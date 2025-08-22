/**
 * Typebot Integration System
 * Integrates Typebot chat with the existing webflow button system
 * Handles the flow: Form Data → Typebot → Completion → Supabase
 */

import { TYPEBOT_CONFIG, TypebotClient } from '../config/typebot.js';

export class TypebotIntegrationSystem {
  constructor() {
    this.isInitialized = false;
    this.typebotClient = new TypebotClient(TYPEBOT_CONFIG);
    this.completionCallbacks = [];
    this.currentFormData = null;
    this.isTypebotActive = false;
    this.typebotLibrary = null; // Will hold the Typebot library reference

    // Bind methods
    this.handleTypebotCompletion = this.handleTypebotCompletion.bind(this);
  }

  async init() {
    if (this.isInitialized) return;

    try {
      // Load Typebot library
      await this.loadTypebotLibrary();

      // Initialize Typebot popup
      await this.initializeTypebotPopup();

      // Setup completion webhook listener
      this.setupCompletionListener();

      // Setup embed container if needed
      this.setupEmbedContainer();

      // Setup global API for external integration
      this.setupGlobalAPI();

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ TypebotIntegrationSystem initialization failed:', error);
    }
  }

  /**
   * Load Typebot library from CDN
   */
  async loadTypebotLibrary() {
    try {
      // Check if already loaded
      if (window.Typebot) {
        this.typebotLibrary = window.Typebot;
        return;
      }

      // Dynamically import the Typebot library
      const { default: Typebot } = await import(TYPEBOT_CONFIG.EMBED_CONFIG.cdnUrl);
      this.typebotLibrary = Typebot;
      window.Typebot = Typebot;

      if (TYPEBOT_CONFIG.DEBUG) {
        // eslint-disable-next-line no-console
        console.log('🤖 Typebot library loaded successfully');
      }
    } catch (error) {
      console.error('❌ Failed to load Typebot library:', error);
      throw error;
    }
  }

  /**
   * Initialize Typebot popup
   */
  async initializeTypebotPopup() {
    if (!this.typebotLibrary) {
      throw new Error('Typebot library not loaded');
    }

    try {
      // Initialize the popup with your typebot ID
      await this.typebotLibrary.initPopup({
        typebot: TYPEBOT_CONFIG.PUBLIC_ID,
        prefilledVariables: {}, // Will be set when opening
        onMessage: (message) => {
          // Handle messages from Typebot
          this.handleTypebotMessage(message);
        },
        onEnd: () => {
          // Handle when typebot conversation ends
          this.handleTypebotEnd();
        },
      });

      if (TYPEBOT_CONFIG.DEBUG) {
        // eslint-disable-next-line no-console
        console.log('🤖 Typebot popup initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Typebot popup:', error);
      throw error;
    }
  }

  /**
   * Handle messages from Typebot
   */
  handleTypebotMessage(message) {
    if (TYPEBOT_CONFIG.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('🤖 Typebot message:', message);
    }

    // Check if message contains completion data
    if (message.type === 'completion' || message.data?.completed) {
      this.handleTypebotCompletion(message.data);
    }
  }

  /**
   * Handle when Typebot ends
   */
  handleTypebotEnd() {
    // eslint-disable-next-line no-console
    console.log('🏁 [TypebotIntegration] Typebot conversation ended (onEnd triggered)');

    this.isTypebotActive = false;

    // If we have current form data, trigger completion
    if (this.currentFormData) {
      // eslint-disable-next-line no-console
      console.log('📋 [TypebotIntegration] Auto-triggering completion with form data');
      this.handleTypebotCompletion({ completed: true, autoTriggered: true });
    } else {
      console.warn('⚠️ [TypebotIntegration] No form data available for auto-completion');
    }
  }

  /**
   * Start Typebot with form data instead of sending directly to Supabase
   * @param {Object} formData - Collected form data
   * @param {Function} onCompletion - Callback when typebot is completed
   * @returns {Promise<void>}
   */
  async startTypebotFlow(formData, onCompletion = null) {
    try {
      // eslint-disable-next-line no-console
      console.log('🚀 [TypebotIntegration] startTypebotFlow called with:', formData);

      if (!this.typebotLibrary) {
        throw new Error('Typebot library not loaded');
      }

      // Store form data and completion callback
      this.currentFormData = formData;
      if (onCompletion) {
        this.completionCallbacks.push(onCompletion);
        // eslint-disable-next-line no-console
        console.log('📝 [TypebotIntegration] Completion callback registered');
      }

      // eslint-disable-next-line no-console
      console.log(`📞 [TypebotIntegration] Total callbacks: ${this.completionCallbacks.length}`);

      // Map form data to typebot variables
      const prefilledVariables = this.typebotClient.mapFormDataToVariables(formData);

      // eslint-disable-next-line no-console
      console.log('🔄 [TypebotIntegration] Prefilled variables:', prefilledVariables);

      // Set prefilled variables and open popup
      if (this.typebotLibrary.setPrefilledVariables) {
        this.typebotLibrary.setPrefilledVariables(prefilledVariables);
      }

      // Open the Typebot popup
      // eslint-disable-next-line no-console
      console.log('🎯 [TypebotIntegration] Opening Typebot popup...');
      this.typebotLibrary.open();

      this.isTypebotActive = true;

      // Dispatch event for other systems
      document.dispatchEvent(
        new CustomEvent('typebotStarted', {
          detail: {
            formData: formData,
            prefilledVariables: prefilledVariables,
          },
        })
      );

      // eslint-disable-next-line no-console
      console.log('✅ [TypebotIntegration] Typebot popup opened successfully');

      return { success: true, prefilledVariables };
    } catch (error) {
      console.error('❌ [TypebotIntegration] Failed to start Typebot flow:', error);

      // Fallback to direct Supabase submission if Typebot fails
      this.handleTypebotError(error);
      throw error;
    }
  }

  /**
   * Handle Typebot completion and trigger Supabase submission
   */
  async handleTypebotCompletion(typebotData = {}) {
    try {
      // eslint-disable-next-line no-console
      console.log('🤖 [TypebotIntegration] handleTypebotCompletion called with data:', typebotData);

      // DEBUG: Log all properties of typebotData to understand the structure
      // eslint-disable-next-line no-console
      console.log(
        '🔍 [TypebotIntegration] Complete typebotData structure:',
        JSON.stringify(typebotData, null, 2)
      );

      if (!this.currentFormData) {
        console.error('❌ [TypebotIntegration] No form data available for Supabase submission');
        return;
      }

      // eslint-disable-next-line no-console
      console.log('📋 [TypebotIntegration] Current form data:', this.currentFormData);

      // Mark typebot as completed
      this.typebotClient.markCompleted();
      this.isTypebotActive = false;

      // Extract nome and email from typebot data
      // Try multiple extraction methods due to Typebot's data structure
      let nome = null;
      let email = null;

      // eslint-disable-next-line no-console
      console.log(
        '🔍 [TypebotIntegration] Complete typebotData structure:',
        JSON.stringify(typebotData, null, 2)
      );

      // Method 1: Direct properties (check if they're real values, not IDs)
      if (typebotData.nome && !this.isEncryptedValue(typebotData.nome)) {
        nome = typebotData.nome;
      } else if (typebotData.nome && this.isEncryptedValue(typebotData.nome)) {
        // Use encrypted value as fallback for now - we know it came from Typebot
        console.warn(
          '⚠️ [TypebotIntegration] Nome is encrypted, using fallback:',
          typebotData.nome
        );
        nome = 'Nome capturado via Typebot (ID: ' + typebotData.nome.substring(0, 8) + '...)';
      }

      if (typebotData.email && !this.isEncryptedValue(typebotData.email)) {
        email = typebotData.email;
      } else if (typebotData.email && this.isEncryptedValue(typebotData.email)) {
        // Use encrypted value as fallback for now - we know it came from Typebot
        console.warn(
          '⚠️ [TypebotIntegration] Email is encrypted, using fallback:',
          typebotData.email
        );
        email = 'email-typebot-' + typebotData.email.substring(0, 8) + '@capturado.com';
      }

      // Method 2: Check for alternative property names
      if (!nome) {
        nome = typebotData.name || typebotData.nome_usuario || typebotData.userName || null;
        if (nome && this.isEncryptedValue(nome)) nome = null;
      }
      if (!email) {
        email = typebotData.e_mail || typebotData.userEmail || typebotData.email_usuario || null;
        if (email && this.isEncryptedValue(email)) email = null;
      }

      // Method 3: Check typebot session data for real values
      if (typebotData.sessionData) {
        const sessionVars = typebotData.sessionData.variables || {};
        if (!nome && sessionVars.nome && !this.isEncryptedValue(sessionVars.nome)) {
          nome = sessionVars.nome;
        }
        if (!email && sessionVars.email && !this.isEncryptedValue(sessionVars.email)) {
          email = sessionVars.email;
        }
      }

      // Method 4: Look in result data
      if (typebotData.resultData) {
        const resultVars = typebotData.resultData.variables || {};
        if (!nome && resultVars.nome && !this.isEncryptedValue(resultVars.nome)) {
          nome = resultVars.nome;
        }
        if (!email && resultVars.email && !this.isEncryptedValue(resultVars.email)) {
          email = resultVars.email;
        }
      }

      // Method 5: Check if data has a variables or answers property
      if (typebotData.variables) {
        if (
          !nome &&
          typebotData.variables.nome &&
          !this.isEncryptedValue(typebotData.variables.nome)
        ) {
          nome = typebotData.variables.nome;
        }
        if (
          !email &&
          typebotData.variables.email &&
          !this.isEncryptedValue(typebotData.variables.email)
        ) {
          email = typebotData.variables.email;
        }
      }

      // Method 6: Parse answers array more thoroughly
      if (typebotData.answers && Array.isArray(typebotData.answers)) {
        for (const answer of typebotData.answers) {
          if (answer.type === 'text' && answer.value && !this.isEncryptedValue(answer.value)) {
            // Check if this looks like a name
            if (
              !nome &&
              (answer.question?.toLowerCase().includes('nome') ||
                answer.question?.toLowerCase().includes('name') ||
                (answer.value.length > 2 &&
                  answer.value.length < 50 &&
                  !answer.value.includes('@')))
            ) {
              nome = answer.value;
            }
            // Check if this looks like an email
            if (!email && answer.value.includes('@') && answer.value.includes('.')) {
              email = answer.value;
            }
          }
        }
      }

      // Log what we extracted
      // eslint-disable-next-line no-console
      console.log('📝 [TypebotIntegration] Extracted user info from Typebot:', { nome, email });

      // If still encrypted/placeholder values, use fallback values
      if (nome && this.isEncryptedValue(nome)) {
        console.warn('⚠️ [TypebotIntegration] Nome appears to be encrypted/placeholder:', nome);
        nome = 'Nome não capturado do Typebot';
      }
      if (email && this.isEncryptedValue(email)) {
        console.warn('⚠️ [TypebotIntegration] Email appears to be encrypted/placeholder:', email);
        email = 'email@nao-capturado-typebot.com';
      }

      // Apply nome to elements with nome-definido="typebot"
      if (nome) {
        this.applyNomeToElements(nome);
      }

      // Merge typebot data with original form data
      const enhancedFormData = {
        ...this.currentFormData,
        // Add user contact information from Typebot
        nome: nome,
        email: email,
        // Typebot metadata
        typebotSessionId: this.typebotClient.sessionId,
        typebotResultId: this.typebotClient.resultId,
        typebotData: typebotData,
        completedAt: new Date().toISOString(),
      };

      // eslint-disable-next-line no-console
      console.log('🔄 [TypebotIntegration] Enhanced form data prepared:', enhancedFormData);

      // Validate that we have user info
      if (!nome || !email) {
        console.warn(
          '⚠️ [TypebotIntegration] Missing user info from Typebot. Nome:',
          nome,
          'Email:',
          email
        );
      }

      // eslint-disable-next-line no-console
      console.log(
        `📞 [TypebotIntegration] Executing ${this.completionCallbacks.length} completion callbacks...`
      );

      // Execute completion callbacks
      for (const callback of this.completionCallbacks) {
        try {
          // eslint-disable-next-line no-console
          console.log('🎯 [TypebotIntegration] Calling completion callback...');
          await callback(enhancedFormData);
          // eslint-disable-next-line no-console
          console.log('✅ [TypebotIntegration] Completion callback executed successfully');
        } catch (callbackError) {
          console.error('❌ [TypebotIntegration] Completion callback error:', callbackError);
        }
      }

      // Clear callbacks and form data
      this.completionCallbacks = [];
      this.currentFormData = null;

      // eslint-disable-next-line no-console
      console.log('🎉 [TypebotIntegration] Dispatching typebotCompleted event...');

      // Dispatch completion event
      document.dispatchEvent(
        new CustomEvent('typebotCompleted', {
          detail: {
            formData: enhancedFormData,
            typebotData: typebotData,
            userInfo: { nome, email },
          },
        })
      );

      // eslint-disable-next-line no-console
      console.log('✅ [TypebotIntegration] handleTypebotCompletion completed successfully');
    } catch (error) {
      console.error('❌ [TypebotIntegration] Failed to handle Typebot completion:', error);
    }
  }

  /**
   * Apply user name to elements with nome-definido="typebot" attribute
   * @param {string} nome - User name from Typebot
   */
  applyNomeToElements(nome) {
    if (!nome) return;

    try {
      // Find all elements with nome-definido="typebot"
      const elements = document.querySelectorAll('[nome-definido="typebot"]');
      
      if (elements.length === 0) {
        console.log('🔍 [TypebotIntegration] No elements found with nome-definido="typebot"');
        return;
      }

      console.log(`🎯 [TypebotIntegration] Found ${elements.length} elements with nome-definido="typebot"`);

      elements.forEach((element, index) => {
        // Apply the name to the element's text content
        element.textContent = nome;
        console.log(`✅ [TypebotIntegration] Applied nome "${nome}" to element ${index + 1}`);
      });

      // Dispatch event to notify other systems
      document.dispatchEvent(new CustomEvent('typebotNomeApplied', {
        detail: {
          nome: nome,
          elementsUpdated: elements.length
        }
      }));

    } catch (error) {
      console.error('❌ [TypebotIntegration] Failed to apply nome to elements:', error);
    }
  }

  /**
   * Setup completion listener for webhooks or client-side actions
   */
  setupCompletionListener() {
    // eslint-disable-next-line no-console
    console.log('🔧 [TypebotIntegration] Setting up completion listeners...');

    // Listen for custom completion events
    document.addEventListener('typebotFlowCompleted', (event) => {
      // eslint-disable-next-line no-console
      console.log('📨 [TypebotIntegration] typebotFlowCompleted event received:', event.detail);
      this.handleTypebotCompletion(event.detail);
    });

    // Listen for postMessage from embedded typebot
    window.addEventListener('message', (event) => {
      // eslint-disable-next-line no-console
      console.log('📬 [TypebotIntegration] postMessage received:', event.data);

      if (event.data && event.data.type === 'typebot-completion') {
        // eslint-disable-next-line no-console
        console.log('🎯 [TypebotIntegration] typebot-completion message detected');
        this.handleTypebotCompletion(event.data.data);
      } else if (event.data && event.data.type === 'typebot-close-request') {
        // eslint-disable-next-line no-console
        console.log('🔒 [TypebotIntegration] typebot-close-request received');
        this.closeTypebot(event.data.data);
      }
    });

    // Setup webhook endpoint listener (if using server-side webhooks)
    this.setupWebhookListener();

    // Setup fallback navigation listener
    this.setupFallbackNavigationListener();

    // eslint-disable-next-line no-console
    console.log('✅ [TypebotIntegration] Completion listeners setup complete');
  }

  /**
   * Setup webhook listener for server-side completion callbacks
   */
  setupWebhookListener() {
    // This would typically be handled by your server
    // For client-side detection, we'll check for completion periodically
    if (TYPEBOT_CONFIG.COMPLETION_WEBHOOK) {
      // Implement webhook polling or server-sent events here
      // For now, we'll use a simple polling mechanism
      this.startCompletionPolling();
    }
  }

  /**
   * Start polling for completion (fallback method)
   */
  startCompletionPolling() {
    const pollInterval = setInterval(() => {
      if (!this.isTypebotActive || this.typebotClient.isSessionCompleted()) {
        clearInterval(pollInterval);
        return;
      }

      // Check if typebot session is completed
      // This is a simplified approach - in production, you'd use webhooks
      this.checkTypebotCompletion();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Check if typebot is completed (simplified implementation)
   */
  async checkTypebotCompletion() {
    // In a real implementation, you would check the typebot API
    // or listen for specific events that indicate completion
    // For now, this is a placeholder
  }

  /**
   * Setup embed container for typebot
   */
  setupEmbedContainer() {
    const { containerId } = TYPEBOT_CONFIG.EMBED_CONFIG;
    let container = document.getElementById(containerId);

    if (!container) {
      // Create container if it doesn't exist
      container = document.createElement('div');
      container.id = containerId;
      container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        max-width: ${TYPEBOT_CONFIG.EMBED_CONFIG.theme.chatWindow.maxWidth};
        max-height: ${TYPEBOT_CONFIG.EMBED_CONFIG.theme.chatWindow.maxHeight};
      `;
      document.body.appendChild(container);
    }
  }

  /**
   * Initialize embedded typebot
   */
  initializeEmbed() {
    // This would integrate with Typebot's embed library
    // For now, we'll create a placeholder
    const container = document.getElementById(TYPEBOT_CONFIG.EMBED_CONFIG.containerId);
    if (container) {
      container.innerHTML = `
        <div style="
          background: ${TYPEBOT_CONFIG.EMBED_CONFIG.theme.chatWindow.backgroundColor};
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <h3 style="margin: 0 0 15px 0; color: #333;">Reino Capital</h3>
          <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">
            Obrigado por preencher o formulário! Continue a conversa conosco:
          </p>
          <button onclick="window.openTypebot('${this.typebotClient.sessionId}')" style="
            background: ${TYPEBOT_CONFIG.EMBED_CONFIG.theme.button.backgroundColor};
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">
            Continuar Conversa →
          </button>
        </div>
      `;
    }
  }

  /**
   * Determine if embed mode should be used
   */
  shouldUseEmbed() {
    return (
      TYPEBOT_CONFIG.EMBED_CONFIG &&
      TYPEBOT_CONFIG.EMBED_CONFIG.containerId &&
      TYPEBOT_CONFIG.PUBLIC_ID
    );
  }

  /**
   * Handle typebot errors with fallback
   */
  async handleTypebotError(error) {
    console.error('🤖 Typebot error, falling back to direct submission:', error);

    // Fallback to direct Supabase submission
    if (this.currentFormData && this.completionCallbacks.length > 0) {
      const fallbackData = {
        ...this.currentFormData,
        typebotError: error.message,
        fallbackSubmission: true,
        submittedAt: new Date().toISOString(),
      };

      // Execute completion callbacks with fallback data
      for (const callback of this.completionCallbacks) {
        try {
          await callback(fallbackData);
        } catch (callbackError) {
          console.error('❌ Fallback callback error:', callbackError);
        }
      }
    }
  }

  /**
   * Setup global API for external integration
   */
  setupGlobalAPI() {
    // Add to global ReinoCalculator API
    if (window.ReinoCalculator) {
      window.ReinoCalculator.typebot = {
        start: (formData, onCompletion) => this.startTypebotFlow(formData, onCompletion),
        complete: (data) => this.handleTypebotCompletion(data),
        isActive: () => this.isTypebotActive,
        client: this.typebotClient,
        config: TYPEBOT_CONFIG,
      };
    }

    // Global function for embed buttons
    window.openTypebot = (sessionId) => {
      // Open typebot in new window or modal
      const typebotUrl = `https://typebot.io/${TYPEBOT_CONFIG.PUBLIC_ID}?sessionId=${sessionId}`;
      window.open(typebotUrl, 'typebot', 'width=400,height=600,scrollbars=yes,resizable=yes');
    };

    // Global function to trigger completion (for webhook/external use)
    window.triggerTypebotCompletion = (data) => {
      document.dispatchEvent(
        new CustomEvent('typebotFlowCompleted', {
          detail: data,
        })
      );
    };
  }

  /**
   * Add completion callback
   */
  onCompletion(callback) {
    this.completionCallbacks.push(callback);
  }

  /**
   * Remove completion callback
   */
  removeCompletion(callback) {
    const index = this.completionCallbacks.indexOf(callback);
    if (index > -1) {
      this.completionCallbacks.splice(index, 1);
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isTypebotActive: this.isTypebotActive,
      hasFormData: !!this.currentFormData,
      sessionId: this.typebotClient.sessionId,
      isCompleted: this.typebotClient.isSessionCompleted(),
      callbackCount: this.completionCallbacks.length,
    };
  }

  /**
   * Helper function to detect encrypted/placeholder values from Typebot
   */
  isEncryptedValue(value) {
    if (!value || typeof value !== 'string') return false;

    // Check for typical encrypted patterns
    const encryptedPatterns = [
      'XBCHzvp1qAbdX',
      'VFChNVSCXQ2rXv4DrJ8Ah',
      'giiLFGw5xXBCHzvp1qAbdX',
      'v3VFChNVSCXQ2rXv4DrJ8Ah',
    ];

    // Check if value matches any known encrypted patterns
    if (encryptedPatterns.some((pattern) => value.includes(pattern))) {
      return true;
    }

    // Check for suspicious characteristics of encrypted values
    if (value.length > 15 && !/\s/.test(value) && !/[@.]/.test(value)) {
      // Long string without spaces, dots, or @ signs - likely encrypted
      return true;
    }

    return false;
  }

  /**
   * Close Typebot popup
   */
  closeTypebot(data = {}) {
    try {
      // eslint-disable-next-line no-console
      console.log('🔒 [TypebotIntegration] Closing Typebot popup...', data);

      // Try to close using the Typebot library
      if (this.typebotLibrary && typeof this.typebotLibrary.close === 'function') {
        this.typebotLibrary.close();
        // eslint-disable-next-line no-console
        console.log('✅ [TypebotIntegration] Typebot closed via library method');
      } else if (this.typebotLibrary && typeof this.typebotLibrary.toggle === 'function') {
        // Some versions use toggle to close
        this.typebotLibrary.toggle();
        // eslint-disable-next-line no-console
        console.log('✅ [TypebotIntegration] Typebot toggled (closed) via library method');
      } else {
        // Fallback: Try to find and hide the typebot container
        const typebotContainer =
          document.querySelector('#typebot-bubble') ||
          document.querySelector('[data-testid="typebot-bubble"]') ||
          document.querySelector('.typebot-container');

        if (typebotContainer) {
          typebotContainer.style.display = 'none';
          // eslint-disable-next-line no-console
          console.log('✅ [TypebotIntegration] Typebot hidden via DOM manipulation');
        } else {
          console.warn('⚠️ [TypebotIntegration] Could not find Typebot container to close');
        }
      }

      // Mark as inactive
      this.isTypebotActive = false;
    } catch (error) {
      console.error('❌ [TypebotIntegration] Error closing Typebot:', error);
    }
  }

  /**
   * Setup fallback navigation listener for direct navigation requests
   */
  setupFallbackNavigationListener() {
    // eslint-disable-next-line no-console
    console.log('🔧 [TypebotIntegration] Setting up fallback navigation listener...');

    document.addEventListener('forceNavigateToResults', (event) => {
      // eslint-disable-next-line no-console
      console.log('🎯 [TypebotIntegration] Fallback navigation event received:', event.detail);

      try {
        // Try to access the step navigation system through global API
        if (
          window.ReinoCalculator &&
          window.ReinoCalculator.navigation &&
          window.ReinoCalculator.navigation.stepNavigation
        ) {
          // eslint-disable-next-line no-console
          console.log('✅ [TypebotIntegration] Executing fallback navigation to step 5...');
          window.ReinoCalculator.navigation.stepNavigation.showStep(5);
        } else {
          console.warn(
            '⚠️ [TypebotIntegration] ReinoCalculator navigation not available for fallback'
          );
        }
      } catch (error) {
        console.error('❌ [TypebotIntegration] Fallback navigation failed:', error);
      }
    });
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.completionCallbacks = [];
    this.currentFormData = null;
    this.isTypebotActive = false;
    this.typebotClient.reset();

    // Remove embed container
    const container = document.getElementById(TYPEBOT_CONFIG.EMBED_CONFIG.containerId);
    if (container) {
      container.remove();
    }
  }
}
