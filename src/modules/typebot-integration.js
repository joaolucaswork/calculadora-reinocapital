/**
 * Typebot Integration System - Fixed for Webflow
 * Uses globally loaded Typebot library and integrates with button system
 * Based on working console solution
 */

class ReinoTypebotIntegrationSystem {
  constructor() {
    this.isInitialized = false;
    this.completionCallbacks = [];
    this.currentFormData = null;
    this.isTypebotActive = false;
    this.typebotLibrary = null;

    // Config
    this.config = {
      PUBLIC_ID: 'relatorio-reino',
      API_HOST: 'https://typebot.io/api/v1',
      DEBUG: true,
      EMBED_CONFIG: {
        cdnUrl: 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0/dist/web.js',
        containerId: 'typebot-embed-container',
      },
    };

    // Use global config if available
    if (window.REINO_TYPEBOT_CONFIG) {
      this.config = { ...this.config, ...window.REINO_TYPEBOT_CONFIG };
    }

    // Bind methods
    this.handleTypebotCompletion = this.handleTypebotCompletion.bind(this);
  }

  async init() {
    if (this.isInitialized) return;

    try {
      await this.loadTypebotLibrary();
      await this.initializeTypebotPopup();
      this.setupCompletionListener();
      this.setupEmbedContainer();
      this.setupGlobalAPI();
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ TypebotIntegrationSystem initialization failed:', error);
    }
  }

  async loadTypebotLibrary() {
    try {
      // Check if already loaded globally
      if (window.Typebot) {
        this.typebotLibrary = window.Typebot;

        return;
      }

      // Use official Typebot loading pattern
      const typebotInitScript = document.createElement('script');
      typebotInitScript.type = 'module';
      typebotInitScript.innerHTML = `
        import Typebot from '${this.config.EMBED_CONFIG.cdnUrl}'
        window.Typebot = Typebot;
        window.typebotLoaded = true;
      `;
      document.body.append(typebotInitScript);

      // Wait for Typebot to load
      let attempts = 0;
      const maxAttempts = 50;
      while (!window.Typebot && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (window.Typebot) {
        this.typebotLibrary = window.Typebot;
      } else {
        throw new Error('Typebot library failed to load after waiting');
      }
    } catch (error) {
      console.error('❌ Failed to load Typebot library:', error);
      throw error;
    }
  }

  async initializeTypebotPopup() {
    if (!this.typebotLibrary) {
      throw new Error('Typebot library not loaded');
    }

    try {
      // Initialize the popup with correct typebot ID
      await this.typebotLibrary.initPopup({
        typebot: this.config.PUBLIC_ID,
        prefilledVariables: {},
        onMessage: (message) => {
          this.handleTypebotMessage(message);
        },
        onEnd: () => {
          this.handleTypebotEnd();
        },
      });
    } catch (error) {
      console.error('❌ Failed to initialize Typebot popup:', error);
      throw error;
    }
  }

  handleTypebotMessage(message) {
    // Message handling logic can be added here
  }

  handleTypebotEnd() {
    this.isTypebotActive = false;

    setTimeout(() => {
      this.handleTypebotCompletion();
    }, 1000);
  }

  async startTypebotFlow(formData = {}) {
    if (!this.isInitialized) {
      console.error('❌ Typebot not initialized');
      return false;
    }

    try {
      this.currentFormData = formData;
      this.isTypebotActive = true;

      // Collect data from form if not provided
      if (!formData.nome || !formData.email) {
        formData = this.collectFormData();
      }

      // Prepare variables for Typebot
      const typebotVariables = {
        nome: formData.nome || '',
        email: formData.email || '',
        telefone: formData.telefone || '',
        patrimonio: formData.patrimonio || this.getPatrimonioValue(),
        ativos_selecionados: formData.ativos_selecionados || this.getSelectedAssets(),
        economia_anual: formData.economia_anual || this.getEconomiaValue(),
        source: 'webflow_calculator',
      };

      // Open Typebot popup with prefilled variables
      this.typebotLibrary.open({
        prefilledVariables: typebotVariables,
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to start Typebot flow:', error);
      await this.handleTypebotError(error);
      return false;
    }
  }

  collectFormData() {
    // Collect basic form data from the page
    const data = {
      nome: '',
      email: '',
      telefone: '',
      patrimonio: this.getPatrimonioValue(),
      ativos_selecionados: this.getSelectedAssets(),
      economia_anual: this.getEconomiaValue(),
    };

    // Try to get name from various inputs
    const nameInputs = document.querySelectorAll(
      'input[name*="nome"], input[placeholder*="nome"], #nome'
    );
    if (nameInputs.length > 0) {
      data.nome = nameInputs[0].value || '';
    }

    // Try to get email from various inputs
    const emailInputs = document.querySelectorAll(
      'input[type="email"], input[name*="email"], #email'
    );
    if (emailInputs.length > 0) {
      data.email = emailInputs[0].value || '';
    }

    return data;
  }

  getPatrimonioValue() {
    const patrimonioInput = document.querySelector('#currency');
    if (patrimonioInput && patrimonioInput.value) {
      const cleaned = patrimonioInput.value
        .toString()
        .replace(/[^\d,]/g, '')
        .replace(',', '.');
      const value = parseFloat(cleaned) || 0;
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
      }).format(value);
    }
    return 'R$ 0';
  }

  getSelectedAssets() {
    const selectedAssets = [];

    // Try to get from asset selection system
    if (window.ReinoAssetSelectionFilter && window.ReinoAssetSelectionFilter.selectedAssets) {
      window.ReinoAssetSelectionFilter.selectedAssets.forEach((asset) => {
        selectedAssets.push(asset);
      });
    }

    // Fallback: check for selected asset elements
    if (selectedAssets.length === 0) {
      const assetElements = document.querySelectorAll('.patrimonio_interactive_item');
      assetElements.forEach((element) => {
        const slider = element.querySelector('range-slider');
        if (slider && parseFloat(slider.value) > 0) {
          const product = element.getAttribute('ativo-product');
          if (product) {
            selectedAssets.push(product);
          }
        }
      });
    }

    return selectedAssets.join(', ') || 'Nenhum ativo selecionado';
  }

  getEconomiaValue() {
    // Try to get from resultado calculator
    try {
      // Check if calculator exists and has cache
      if (
        window.ReinoResultadoComparativoCalculator &&
        window.ReinoResultadoComparativoCalculator.cache &&
        window.ReinoResultadoComparativoCalculator.cache.economia
      ) {
        const economia = window.ReinoResultadoComparativoCalculator.cache.economia;
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
        }).format(economia);
      }

      // Fallback: try to calculate economia manually
      const patrimonioInput = document.querySelector('#currency');
      if (patrimonioInput && patrimonioInput.value) {
        const patrimonio =
          parseFloat(
            patrimonioInput.value
              .toString()
              .replace(/[^\d,]/g, '')
              .replace(',', '.')
          ) || 0;
        if (patrimonio > 0) {
          // Simple estimation: 2-3% economy
          const estimatedEconomy = patrimonio * 0.025;
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
          }).format(estimatedEconomy);
        }
      }
    } catch (error) {
      console.warn('Could not get economia from calculator:', error);
    }
    return 'Calculando...';
  }

  async handleTypebotCompletion(typebotData = {}) {
    try {
      console.log('🤖 [TypebotIntegration] handleTypebotCompletion called with data:', typebotData);

      if (!this.currentFormData) {
        console.warn('⚠️ No form data available for completion');
        return;
      }

      // Extract nome and email from typebot data (matching old module behavior)
      let nome = null;
      let email = null;

      // Log complete typebot data structure for debugging
      console.log(
        '🔍 [TypebotIntegration] Complete typebotData structure:',
        JSON.stringify(typebotData, null, 2)
      );

      // Method 1: Direct properties
      if (typebotData.nome && !this.isEncryptedValue(typebotData.nome)) {
        nome = typebotData.nome;
      }
      if (typebotData.email && !this.isEncryptedValue(typebotData.email)) {
        email = typebotData.email;
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

      // Method 3: Check variables property
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

      console.log('📝 [TypebotIntegration] Extracted user info from Typebot:', { nome, email });

      // Apply nome to DOM elements if extracted from Typebot
      if (nome) {
        this.applyNomeToElements(nome);
      } else {
        // Fallback to form data nome if no nome from Typebot
        console.log('⚠️ No nome from Typebot, using form data nome:', this.currentFormData.nome);
        this.applyNomeToElements(this.currentFormData.nome);
      }

      // Merge typebot data with original form data
      const enhancedFormData = {
        ...this.currentFormData,
        nome: nome || this.currentFormData.nome,
        email: email || this.currentFormData.email,
        typebotData: typebotData,
        completedAt: new Date().toISOString(),
      };

      // Trigger completion callbacks
      for (const callback of this.completionCallbacks) {
        try {
          await callback(enhancedFormData);
        } catch (callbackError) {
          console.error('❌ Completion callback error:', callbackError);
        }
      }

      // Dispatch completion event
      document.dispatchEvent(
        new CustomEvent('typebotCompleted', {
          detail: {
            formData: enhancedFormData,
            typebotData: typebotData,
            userInfo: { nome, email },
            timestamp: new Date().toISOString(),
          },
        })
      );

      console.log('✅ [TypebotIntegration] handleTypebotCompletion completed successfully');
    } catch (error) {
      console.error('❌ Error handling Typebot completion:', error);
      await this.handleTypebotError(error);
    }
  }

  applyNomeToElements(nome) {
    if (!nome) return;

    try {
      // Find all elements with nome-definido="typebot" (matching old module behavior)
      const elements = document.querySelectorAll('[nome-definido="typebot"]');

      if (elements.length === 0) {
        console.log('🔍 [TypebotIntegration] No elements found with nome-definido="typebot"');
        return;
      }

      console.log(
        `🎯 [TypebotIntegration] Found ${elements.length} elements with nome-definido="typebot"`
      );

      elements.forEach((element, index) => {
        // Apply the name to the element's text content
        element.textContent = nome;
        console.log(`✅ [TypebotIntegration] Applied nome "${nome}" to element ${index + 1}`);
      });

      // Dispatch event to notify other systems
      document.dispatchEvent(
        new CustomEvent('typebotNomeApplied', {
          detail: {
            nome: nome,
            elementsUpdated: elements.length,
          },
        })
      );
    } catch (error) {
      console.error('❌ [TypebotIntegration] Failed to apply nome to elements:', error);
    }
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

  setupCompletionListener() {
    // Listen for external completion events
    document.addEventListener('triggerTypebotCompletion', () => {
      this.handleTypebotCompletion();
    });

    // Listen for form submission events that should trigger Typebot
    document.addEventListener('formReadyForTypebot', (event) => {
      const formData = event.detail;
      this.startTypebotFlow(formData);
    });

    // Setup listeners for typebot completion script
    document.addEventListener('forceNavigateToResults', (event) => {
      const { step, data } = event.detail;

      try {
        // Navigate to section 5
        const currentSection = document.querySelector(
          '.step-section[style*="display: block"], .step-section:not([style*="display: none"])'
        );
        const targetSection = document.querySelector('[data-step="' + step + '"]');

        if (currentSection) {
          currentSection.style.display = 'none';
        }
        if (targetSection) {
          targetSection.style.display = 'block';
        }

        // Apply user data
        if (data && data.nome) {
          this.applyNomeToElements(data.nome);
        }

        // Close Typebot popup after navigation
        setTimeout(() => {
          this.closeTypebot();
        }, 1000);
      } catch (error) {
        console.error('❌ Erro na navegação:', error);
      }
    });

    // Listen for postMessage from Typebot
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'typebot-completion') {
        // Dispatch navigation event
        document.dispatchEvent(
          new CustomEvent('forceNavigateToResults', {
            detail: {
              step: 5,
              source: 'postmessage',
              data: event.data.data,
            },
          })
        );
      }
    });
  }

  setupEmbedContainer() {
    // Create embed container if it doesn't exist
    let container = document.getElementById(this.config.EMBED_CONFIG.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.config.EMBED_CONFIG.containerId;
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        display: none;
        background: rgba(0, 0, 0, 0.5);
      `;
      document.body.appendChild(container);
    }
  }

  async handleTypebotError(error) {
    console.error('❌ Typebot error:', error);

    // Dispatch error event
    document.dispatchEvent(
      new CustomEvent('typebotError', {
        detail: { error, timestamp: new Date().toISOString() },
      })
    );

    // Reset state
    this.isTypebotActive = false;
    this.currentFormData = null;
  }

  setupGlobalAPI() {
    // Make available globally
    window.ReinoTypebot = {
      start: (formData) => this.startTypebotFlow(formData),
      close: () => this.closeTypebot(),
      isActive: () => this.isTypebotActive,
      onCompletion: (callback) => this.onCompletion(callback),
      getStatus: () => this.getStatus(),
    };
  }

  onCompletion(callback) {
    if (typeof callback === 'function') {
      this.completionCallbacks.push(callback);
    }
  }

  removeCompletion(callback) {
    const index = this.completionCallbacks.indexOf(callback);
    if (index > -1) {
      this.completionCallbacks.splice(index, 1);
    }
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      active: this.isTypebotActive,
      hasFormData: !!this.currentFormData,
      publicId: this.config.PUBLIC_ID,
    };
  }

  closeTypebot() {
    try {
      if (this.typebotLibrary && typeof this.typebotLibrary.close === 'function') {
        this.typebotLibrary.close();
      }

      // Hide embed container
      const container = document.getElementById(this.config.EMBED_CONFIG.containerId);
      if (container) {
        container.style.display = 'none';
        container.style.visibility = 'hidden';
      }

      // Force hide all typebot elements
      const typebotElements = document.querySelectorAll(
        '*[id*="typebot"], *[class*="typebot"], iframe[src*="typebot"]'
      );
      typebotElements.forEach((el) => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
      });

      // Reset state
      this.isTypebotActive = false;
    } catch (error) {
      console.error('❌ Error closing Typebot:', error);
    }
  }

  cleanup() {
    this.completionCallbacks = [];
    this.currentFormData = null;
    this.isTypebotActive = false;

    // Remove embed container
    const container = document.getElementById(this.config.EMBED_CONFIG.containerId);
    if (container) {
      container.remove();
    }
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  window.ReinoTypebotIntegrationSystem = new ReinoTypebotIntegrationSystem();
  window.ReinoTypebotIntegrationSystem.init();
});

// Also initialize if DOM already loaded
if (document.readyState === 'loading') {
  // Already set up above
} else {
  window.ReinoTypebotIntegrationSystem = new ReinoTypebotIntegrationSystem();
  window.ReinoTypebotIntegrationSystem.init();
}
