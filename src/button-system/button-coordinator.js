/**
 * Button Coordinator - Fixed Version for Webflow
 * Properly captures send button clicks and integrates with Typebot
 */

(function() {
  'use strict';

  class ButtonCoordinator {
    constructor() {
      this.isInitialized = false;
      this.debugMode = window.location.search.includes('debug=true');

      this.navigationButtons = null;
      this.formSubmission = null;
      this.integrations = null;
    }

    async init(stepNavigationSystem) {
      if (this.isInitialized) return;

      await this.waitForDOM();

      // Aguarda sub-módulos estarem disponíveis
      await this.waitForSubModules();

      // Initialize all sub-modules - CORREÇÃO: INSTANCIAR EM VEZ DE ATRIBUIR
      if (window.ReinoNavigationButtons) {
        this.navigationButtons = new window.ReinoNavigationButtons();
        if (this.navigationButtons.init) {
          this.navigationButtons.init(stepNavigationSystem);
        }
      }

      if (window.ReinoFormSubmission) {
        this.formSubmission = new window.ReinoFormSubmission();
        if (this.formSubmission.init) {
          this.formSubmission.init();
        }
      }

      if (window.ReinoExternalIntegrations) {
        this.integrations = new window.ReinoExternalIntegrations();
        if (this.integrations.init) {
          this.integrations.init(stepNavigationSystem);
        }
      }

      // Setup Typebot integration - MOVED TO LAST
      this.setupTypebotIntegration();

      this.setupDebugMode();

      this.isInitialized = true;
      this.log('✅ Button Coordinator initialized');
    }

    setupTypebotIntegration() {
      // Remove existing listeners to avoid conflicts
      this.removeExistingListeners();

      // Add listener with high priority (capture phase)
      document.addEventListener('click', (e) => {
        const sendButton = e.target.closest('[element-function="send"]');
        if (sendButton) {
          e.preventDefault();
          e.stopPropagation();
          this.log('🔥 Send button click captured');
          this.handleSendButtonClick(sendButton);
        }
      }, true); // Use capture phase for higher priority

      // Also add listener for button text specifically
      document.addEventListener('click', (e) => {
        if (e.target.textContent?.includes('Receber relatório') ||
            e.target.textContent?.includes('Enviar')) {
          const sendButton = e.target.closest('.button-hero') || e.target.closest('button');
          if (sendButton) {
            e.preventDefault();
            e.stopPropagation();
            this.log('🔥 Send button captured by text match');
            this.handleSendButtonClick(sendButton);
          }
        }
      }, true);

      this.log('✅ Typebot integration listeners added');
    }

    removeExistingListeners() {
      // Clone and replace send buttons to remove existing listeners
      const sendButtons = document.querySelectorAll('[element-function="send"]');
      sendButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
      });

      this.log(`🔄 Cleaned ${sendButtons.length} send buttons`);
    }

    handleSendButtonClick(button) {
      try {
        this.log('📤 Processing send button click');

        // Change button text to indicate processing
        const originalText = button.textContent;
        const buttonDiv = button.querySelector('div') || button;
        buttonDiv.textContent = 'Enviando...';

        // Collect form data
        const formData = this.collectFormData();
        this.log('📊 Form data collected:', formData);

        // Start Typebot flow
        if (window.ReinoTypebotIntegrationSystem) {
          this.log('🤖 Starting Typebot via integration system');
          window.ReinoTypebotIntegrationSystem.startTypebotFlow(formData);
        } else if (window.ReinoTypebot) {
          this.log('🤖 Starting Typebot via global API');
          window.ReinoTypebot.start(formData);
        } else {
          console.error('❌ Typebot integration not available');
          buttonDiv.textContent = originalText;
          return;
        }

        // Reset button text after a delay
        setTimeout(() => {
          if (buttonDiv.textContent === 'Enviando...') {
            buttonDiv.textContent = originalText;
          }
        }, 5000);

      } catch (error) {
        console.error('❌ Error handling send button:', error);
        const buttonDiv = button.querySelector('div') || button;
        buttonDiv.textContent = buttonDiv.textContent.replace('Enviando...', 'Receber relatório');
      }
    }

    collectFormData() {
      const data = {};

      // Get patrimonio value
      const patrimonioInput = document.querySelector('#currency');
      if (patrimonioInput && patrimonioInput.value) {
        const cleaned = patrimonioInput.value.toString().replace(/[^\d,]/g, '').replace(',', '.');
        const value = parseFloat(cleaned) || 0;
        data.patrimonio = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0
        }).format(value);
      } else {
        data.patrimonio = 'R$ 0';
      }

      // Get selected assets
      const selectedAssets = [];
      if (window.ReinoAssetSelectionFilter && window.ReinoAssetSelectionFilter.selectedAssets) {
        window.ReinoAssetSelectionFilter.selectedAssets.forEach(asset => {
          selectedAssets.push(asset);
        });
      }

      // Fallback: check sliders with values > 0
      if (selectedAssets.length === 0) {
        const sliders = document.querySelectorAll('range-slider');
        sliders.forEach(slider => {
          if (parseFloat(slider.value) > 0) {
            const item = slider.closest('.patrimonio_interactive_item');
            const product = item?.getAttribute('ativo-product');
            if (product) {
              selectedAssets.push(product);
            }
          }
        });
      }

      data.ativos_selecionados = selectedAssets.join(', ') || 'Nenhum ativo selecionado';

      // Get economia value
      if (window.ReinoResultadoComparativoCalculator) {
        try {
          const comparison = window.ReinoResultadoComparativoCalculator.getComparison();
          if (comparison && comparison.economia) {
            data.economia_anual = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0
            }).format(comparison.economia);
          }
        } catch (error) {
          data.economia_anual = 'Calculando...';
        }
      } else {
        data.economia_anual = 'Calculando...';
      }

      return data;
    }

    waitForDOM() {
      return new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', resolve, { once: true });
        }
      });
    }

    async waitForSubModules() {
      const maxAttempts = 50;
      let attempts = 0;

      while (attempts < maxAttempts) {
        if (window.ReinoNavigationButtons &&
            window.ReinoFormSubmission &&
            window.ReinoExternalIntegrations) {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        this.log('⚠️ Some sub-modules may not be available');
      }
    }

    setupDebugMode() {
      if (this.debugMode) {
        window.buttonSystem = {
          coordinator: this,
          navigation: this.navigationButtons,
          form: this.formSubmission,
          integrations: this.integrations,
          testSendButton: () => {
            const sendButton = document.querySelector('[element-function="send"]');
            if (sendButton) {
              this.handleSendButtonClick(sendButton);
            }
          }
        };
      }
    }

    log(message) {
      if (this.debugMode) {
        console.log(`[ButtonCoordinator] ${message}`);
      }
    }
  }

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    // Wait for step navigation system to be available
    const initializeButtonCoordinator = () => {
      if (window.ReinoStepNavigationProgressSystem) {
        const coordinator = new ButtonCoordinator();
        window.ReinoButtonCoordinator = coordinator;
        coordinator.init(window.ReinoStepNavigationProgressSystem);
      } else {
        setTimeout(initializeButtonCoordinator, 100);
      }
    };

    initializeButtonCoordinator();
  });

  // Also initialize if DOM already loaded
  if (document.readyState === 'loading') {
    // Already set up above
  } else {
    const initializeButtonCoordinator = () => {
      if (window.ReinoStepNavigationProgressSystem) {
        const coordinator = new ButtonCoordinator();
        window.ReinoButtonCoordinator = coordinator;
        coordinator.init(window.ReinoStepNavigationProgressSystem);
      } else {
        setTimeout(initializeButtonCoordinator, 100);
      }
    };

    initializeButtonCoordinator();
  }

})();
