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
    this.isProcessingCompletion = false; // Add flag to prevent duplicate processing

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

    // Don't initialize popup here - wait until we have variables in startTypebotFlow
    // This prevents the Typebot from being initialized without variables
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
      // Always collect comprehensive form data and merge with provided data
      const collectedData = this.collectFormData();
      this.currentFormData = { ...collectedData, ...formData };
      this.isTypebotActive = true;

      // Prepare variables for Typebot with calculator data
      // IMPORTANT: Variable names must match exactly what's defined in Typebot
      // Force fresh data collection at the moment of sending
      const typebotVariables = {
        nome: this.currentFormData.nome || '',
        email: this.currentFormData.email || '',
        telefone: this.currentFormData.telefone || '',
        patrimonio: this.getPatrimonioValue(), // Always get fresh data
        ativos: this.getSelectedAssets(), // Always get fresh data
        totalAlocado: this.formatCurrency(this.getTotalAllocated()), // Always get fresh data
        source: 'webflow_calculator',
      };

      // Initialize Typebot popup with variables (first time or reinitialize)
      await this.typebotLibrary.initPopup({
        typebot: this.config.PUBLIC_ID,
        prefilledVariables: typebotVariables,
        onMessage: () => {
          // Message handling can be added here if needed
        },
        onEnd: () => {
          this.handleTypebotEnd();
        },
      });

      // Open Typebot popup
      this.typebotLibrary.open();

      return true;
    } catch (error) {
      console.error('❌ Failed to start Typebot flow:', error);
      await this.handleTypebotError(error);
      return false;
    }
  }

  collectFormData() {
    // Collect comprehensive form data from the page
    const data = {
      nome: '',
      email: '',
      telefone: '',
      patrimonio: this.getPatrimonioValue(),
      ativos_selecionados: this.getSelectedAssets(),

      // Add detailed calculator data - use DOM as source of truth
      ativosEscolhidos: this.getSelectedAssetsDetailed(),
      alocacao: this.getAllocationData(),
      totalAlocado: this.getTotalAllocated(),
      percentualAlocado: 0,
      patrimonioRestante: 0,
    };

    // Calculate derived values
    const patrimonioNumeric = this.getPatrimonioNumericValue();
    data.percentualAlocado =
      patrimonioNumeric > 0 ? (data.totalAlocado / patrimonioNumeric) * 100 : 0;
    data.patrimonioRestante = patrimonioNumeric - data.totalAlocado;

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

    // Try to get telefone from various inputs
    const phoneInputs = document.querySelectorAll(
      'input[type="tel"], input[name*="telefone"], input[name*="phone"], #telefone'
    );
    if (phoneInputs.length > 0) {
      data.telefone = phoneInputs[0].value || '';
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
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
      }).format(value);
      return formatted;
    }
    return 'R$ 0';
  }

  getPatrimonioNumericValue() {
    const patrimonioInput = document.querySelector('#currency');
    if (patrimonioInput && patrimonioInput.value) {
      const cleaned = patrimonioInput.value
        .toString()
        .replace(/[^\d,]/g, '')
        .replace(',', '.');
      return parseFloat(cleaned) || 0;
    }
    return 0;
  }

  getSelectedAssetsDetailed() {
    const selectedAssets = [];

    // Get from active allocation items (most reliable source)
    const activeItems = document.querySelectorAll(
      '.patrimonio_interactive_item .active-produto-item'
    );
    activeItems.forEach((item) => {
      const container = item.closest('.patrimonio_interactive_item');
      const product = container.getAttribute('ativo-product');
      const category = container.getAttribute('ativo-category');

      if (product && category) {
        selectedAssets.push({
          product: product,
          category: category,
        });
      }
    });

    return selectedAssets;
  }

  getAllocationData() {
    const alocacao = {};
    const activeItems = document.querySelectorAll(
      '.patrimonio_interactive_item .active-produto-item'
    );

    activeItems.forEach((item) => {
      const container = item.closest('.patrimonio_interactive_item');
      const product = container.getAttribute('ativo-product');
      const category = container.getAttribute('ativo-category');
      const input = container.querySelector('.currency-input');
      const slider = container.querySelector('.slider');

      if (product && category && (input || slider)) {
        const value = input ? this.parseCurrencyValue(input.value) : 0;
        const percentage = slider ? parseFloat(slider.value) * 100 : 0;

        alocacao[category + '-' + product] = {
          value: value,
          percentage: percentage,
          category: category,
          product: product,
        };
      }
    });

    return alocacao;
  }

  getTotalAllocated() {
    let total = 0;
    const activeItems = document.querySelectorAll(
      '.patrimonio_interactive_item .active-produto-item'
    );

    activeItems.forEach((item) => {
      const container = item.closest('.patrimonio_interactive_item');
      const input = container.querySelector('.currency-input');

      if (input) {
        const value = this.parseCurrencyValue(input.value);
        total += value;
      }
    });

    return total;
  }

  getSelectedAssets() {
    const selectedAssets = [];

    // Get from active allocation items (more reliable)
    const activeItems = document.querySelectorAll(
      '.patrimonio_interactive_item .active-produto-item'
    );

    activeItems.forEach((item) => {
      const container = item.closest('.patrimonio_interactive_item');
      const product = container.getAttribute('ativo-product');
      const category = container.getAttribute('ativo-category');

      if (product && category) {
        // Format: "Product (Category)" - cleaner format like the image
        const formattedAsset = `${product} (${category})`;
        selectedAssets.push(formattedAsset);
      }
    });

    // If we found active items, use them (don't use fallback)
    if (selectedAssets.length > 0) {
      return selectedAssets.join(', ');
    }

    // Only use fallback if no active items found
    if (window.ReinoAssetSelectionFilter && window.ReinoAssetSelectionFilter.selectedAssets) {
      // Convert old format to new format
      window.ReinoAssetSelectionFilter.selectedAssets.forEach((asset) => {
        // If asset contains "|", split and format properly
        if (asset.includes('|')) {
          const parts = asset.split('|');
          if (parts.length === 2) {
            const category = parts[0].trim();
            const product = parts[1].trim();
            const formattedAsset = `${product} (${category})`;
            selectedAssets.push(formattedAsset);
          }
        } else {
          // If no "|", use as is
          selectedAssets.push(asset);
        }
      });
    }

    return selectedAssets.join(', ') || 'Nenhum ativo selecionado';
  }

  async handleTypebotCompletion(typebotData = {}) {
    try {
      // Prevent duplicate processing
      if (this.isProcessingCompletion) {
        return;
      }

      // Only process if we have valid data (not empty object)
      if (!typebotData || Object.keys(typebotData).length === 0) {
        return;
      }

      this.isProcessingCompletion = true;

      if (!this.currentFormData) {
        // Try to collect form data now
        this.currentFormData = this.collectFormData();
        if (!this.currentFormData || Object.keys(this.currentFormData).length === 0) {
          this.isProcessingCompletion = false;
          return;
        }
      }

      // Extract nome, email and telefone from typebot data
      let nome = null;
      let email = null;
      let telefone = null;

      // Method 1: Direct properties
      if (typebotData.nome && !this.isEncryptedValue(typebotData.nome)) {
        nome = typebotData.nome;
      }
      if (typebotData.email && !this.isEncryptedValue(typebotData.email)) {
        email = typebotData.email;
      }
      if (typebotData.telefone && !this.isEncryptedValue(typebotData.telefone)) {
        telefone = typebotData.telefone;
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
      if (!telefone) {
        telefone =
          typebotData.phone || typebotData.telefone_usuario || typebotData.userPhone || null;
        if (telefone && this.isEncryptedValue(telefone)) telefone = null;
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
        if (
          !telefone &&
          typebotData.variables.telefone &&
          !this.isEncryptedValue(typebotData.variables.telefone)
        ) {
          telefone = typebotData.variables.telefone;
        }
      }

      // Apply nome to DOM elements if extracted from Typebot
      if (nome) {
        this.applyNomeToElements(nome);
      } else {
        // Fallback to form data nome if no nome from Typebot
        this.applyNomeToElements(this.currentFormData.nome);
      }

      // Convert button-coordinator format to form-submission format for callbacks
      const formDataForCallback = this.convertFormDataForSupabase(
        this.currentFormData,
        nome,
        email,
        telefone
      );

      // Merge typebot data with original form data (following old module pattern)
      const enhancedFormData = {
        ...formDataForCallback,
        // Add user contact information from Typebot
        nome: nome,
        email: email,
        telefone: telefone,
        // Typebot metadata
        typebotSessionId: typebotData.sessionId || 'typebot_' + Date.now(),
        typebotResultId: typebotData.resultId || 'result_' + Date.now(),
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
    } catch (error) {
      console.error('❌ Error handling Typebot completion:', error);
      await this.handleTypebotError(error);
    } finally {
      // Reset processing flag
      this.isProcessingCompletion = false;
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

  convertFormDataForSupabase(buttonCoordinatorData, nome, email, telefone) {
    // Convert button-coordinator format to form-submission format
    const converted = {
      timestamp: new Date().toISOString(),
      patrimonio: 0,
      ativosEscolhidos: [],
      alocacao: {},
      session_id: 'calc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11),
      user_agent: navigator.userAgent,
      page_url: window.location.href,
      nome: nome,
      email: email,
      telefone: telefone,
      totalAlocado: 0,
      percentualAlocado: 0,
      patrimonioRestante: 0,
    };

    // Extract patrimonio value from formatted string
    if (buttonCoordinatorData.patrimonio) {
      const patrimonioStr = buttonCoordinatorData.patrimonio.toString();
      const cleanValue = patrimonioStr.replace(/[^\d,]/g, '').replace(',', '.');
      converted.patrimonio = parseFloat(cleanValue) || 0;
    }

    // Get selected assets directly from DOM (most reliable)
    converted.ativosEscolhidos = this.getSelectedAssetsDetailed();

    // Get allocation data from DOM
    const allocationItems = document.querySelectorAll(
      '.patrimonio_interactive_item .active-produto-item'
    );
    let totalAlocado = 0;

    allocationItems.forEach((item) => {
      const container = item.closest('.patrimonio_interactive_item');
      const product = container.getAttribute('ativo-product');
      const category = container.getAttribute('ativo-category');
      const input = container.querySelector('.currency-input');
      const slider = container.querySelector('.slider');

      if (product && category && (input || slider)) {
        const value = input ? this.parseCurrencyValue(input.value) : 0;
        const percentage = slider ? parseFloat(slider.value) * 100 : 0;

        converted.alocacao[category + '-' + product] = {
          value: value,
          percentage: percentage,
          category: category,
          product: product,
        };

        totalAlocado += value;
      }
    });

    // Calculate derived values
    converted.totalAlocado = totalAlocado;
    converted.percentualAlocado =
      converted.patrimonio > 0 ? (totalAlocado / converted.patrimonio) * 100 : 0;
    converted.patrimonioRestante = converted.patrimonio - totalAlocado;

    return converted;
  }

  getAssetCategory(assetName) {
    // Map asset names to categories based on the calculator structure
    const categoryMap = {
      CDB: 'Renda Fixa',
      LCI: 'Renda Fixa',
      LCA: 'Renda Fixa',
      CRI: 'Renda Fixa',
      CRA: 'Renda Fixa',
      DEBÊNTURE: 'Renda Fixa',
      'Títulos Públicos': 'Renda Fixa',
      Ações: 'Fundo de Investimento',
      Liquidez: 'Fundo de Investimento',
      Multimercado: 'Fundo de Investimento',
      Imobiliário: 'Fundo de Investimento',
      'Ações Nacionais': 'Renda Variável',
      ETF: 'Renda Variável',
      BDR: 'Renda Variável',
      'Ações Internacionais': 'Internacional',
      'ETF Internacional': 'Internacional',
      'Renda Fixa Internacional': 'Internacional',
      COE: 'COE',
      Previdência: 'Previdência',
      Outros: 'Outros',
    };

    return categoryMap[assetName] || 'Outros';
  }

  parseCurrencyValue(value) {
    if (!value) return 0;
    const cleaned = value
      .toString()
      .replace(/[^\d,]/g, '')
      .replace(',', '.');
    return parseFloat(cleaned) || 0;
  }

  formatCurrency(value) {
    if (!value || value === 0) return 'R$ 0';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
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
        // Call handleTypebotCompletion directly with the data
        this.handleTypebotCompletion(event.data.data);

        // Also dispatch navigation event
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

    // Also listen for the enhanced script completion event
    document.addEventListener('typebotEnhancedCompletion', (event) => {
      this.handleTypebotCompletion(event.detail);
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
