/**
 * Button Coordinator - Fixed Version for Webflow
 * Properly captures send button clicks and integrates with Typebot
 */

(function () {
  'use strict';

  class ButtonCoordinator {
    constructor() {
      this.isInitialized = false;
      this.debugMode = window.location.search.includes('debug=true');

      this.navigationButtons = null;
      this.formSubmission = null;
      this.integrations = null;
      this.isFullyAllocated = false;
    }

    async init(stepNavigationSystem) {
      if (this.isInitialized) return;

      await this.waitForDOM();

      // Aguarda sub-módulos estarem disponíveis
      await this.waitForSubModules();

      // NAVIGATION BUTTONS: Não inicializa aqui, deixa o navigation-buttons.js standalone
      // Os botões next/prev são gerenciados pelo navigation-buttons.js

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
      this.setupAllocationValidation();

      this.setupDebugMode();

      this.isInitialized = true;
      this.log('✅ Button Coordinator initialized (send buttons only)');
    }

    setupTypebotIntegration() {
      // Remove existing listeners to avoid conflicts
      this.removeExistingListeners();

      // Add listener with high priority (capture phase)
      document.addEventListener(
        'click',
        (e) => {
          const sendButton = e.target.closest('[element-function="send"]');
          if (sendButton) {
            e.preventDefault();
            e.stopPropagation();
            this.log('🔥 Send button click captured');
            this.handleSendButtonClick(sendButton);
          }
        },
        true
      ); // Use capture phase for higher priority

      // Also add listener for button text specifically
      document.addEventListener(
        'click',
        (e) => {
          if (
            e.target.textContent?.includes('Receber relatório') ||
            e.target.textContent?.includes('Enviar')
          ) {
            const sendButton = e.target.closest('.button-hero') || e.target.closest('button');
            if (sendButton) {
              e.preventDefault();
              e.stopPropagation();
              this.log('🔥 Send button captured by text match');
              this.handleSendButtonClick(sendButton);
            }
          }
        },
        true
      );

      this.log('✅ Typebot integration listeners added');
    }

    setupAllocationValidation() {
      document.addEventListener('allocationStatusChanged', (e) => {
        const { isFullyAllocated } = e.detail;
        this.isFullyAllocated = isFullyAllocated;
        this.updateSendButtonState();
        this.log(
          `💰 Allocation status: ${isFullyAllocated ? 'Fully allocated' : 'Not fully allocated'}`
        );
      });

      this.updateSendButtonState();
      this.log('✅ Allocation validation setup complete');
    }

    updateSendButtonState() {
      const sendButtons = document.querySelectorAll('[element-function="send"]');
      sendButtons.forEach((button) => {
        button.disabled = !this.isFullyAllocated;

        if (this.isFullyAllocated) {
          button.classList.remove('disabled');
          button.style.opacity = '';
          button.style.pointerEvents = '';
        } else {
          button.classList.add('disabled');
          button.style.opacity = '0.5';
          button.style.pointerEvents = 'none';
        }
      });
    }

    removeExistingListeners() {
      // Clone and replace send buttons to remove existing listeners
      const sendButtons = document.querySelectorAll('[element-function="send"]');
      sendButtons.forEach((button) => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
      });

      this.log(`🔄 Cleaned ${sendButtons.length} send buttons`);
    }

    handleSendButtonClick(button) {
      try {
        this.log('📤 Processing send button click');

        if (!this.isFullyAllocated) {
          this.log('⚠️ Cannot send - patrimony not fully allocated');
          return;
        }

        // Collect form data
        const formData = this.collectFormData();
        this.log('📊 Form data collected:', formData);

        // Start Typebot flow
        if (window.ReinoTypebotIntegrationSystem) {
          this.log('🤖 Starting Typebot via integration system with data:', formData);
          window.ReinoTypebotIntegrationSystem.startTypebotFlow(formData);
        } else if (window.ReinoTypebot) {
          this.log('🤖 Starting Typebot via global API with data:', formData);
          window.ReinoTypebot.start(formData);
        } else {
          console.error('❌ Typebot integration not available');
          return;
        }
      } catch (error) {
        console.error('❌ Error handling send button:', error);
      }
    }

    collectFormData() {
      const data = {};

      // Get patrimonio value (formatted for display)
      const patrimonioInput = document.querySelector('#currency');
      if (patrimonioInput && patrimonioInput.value) {
        const cleaned = patrimonioInput.value
          .toString()
          .replace(/[^\d,]/g, '')
          .replace(',', '.');
        const value = parseFloat(cleaned) || 0;
        data.patrimonio = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
        }).format(value);

        // Also store numeric value for calculations
        data.patrimonioNumeric = value;
      } else {
        data.patrimonio = 'R$ 0';
        data.patrimonioNumeric = 0;
      }

      // Get selected assets (simple format for Typebot)
      const selectedAssets = [];
      if (window.ReinoAssetSelectionFilter && window.ReinoAssetSelectionFilter.selectedAssets) {
        window.ReinoAssetSelectionFilter.selectedAssets.forEach((asset) => {
          selectedAssets.push(asset);
        });
      }

      // Fallback: check sliders with values > 0
      if (selectedAssets.length === 0) {
        const sliders = document.querySelectorAll('range-slider');
        sliders.forEach((slider) => {
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

      // Get detailed assets for Supabase (detailed format)
      data.ativosEscolhidos = this.getSelectedAssetsDetailed();

      // Get allocation data
      data.alocacao = this.getAllocationData();

      // Calculate totals
      data.totalAlocado = this.getTotalAllocated();
      data.percentualAlocado =
        data.patrimonioNumeric > 0 ? (data.totalAlocado / data.patrimonioNumeric) * 100 : 0;
      data.patrimonioRestante = data.patrimonioNumeric - data.totalAlocado;

      // Get economia value
      if (window.ReinoResultadoComparativoCalculator) {
        try {
          const comparison = window.ReinoResultadoComparativoCalculator.getComparison();
          if (comparison && comparison.economia) {
            data.economia_anual = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
            }).format(comparison.economia);
          }
        } catch (error) {
          data.economia_anual = 'Calculando...';
        }
      } else {
        data.economia_anual = 'Calculando...';
      }

      this.log('📊 Collected comprehensive form data:', data);
      return data;
    }

    getSelectedAssetsDetailed() {
      const selectedAssets = [];

      // Get from active allocation items
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

    parseCurrencyValue(value) {
      if (!value) return 0;
      const cleaned = value
        .toString()
        .replace(/[^\d,]/g, '')
        .replace(',', '.');
      return parseFloat(cleaned) || 0;
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
        if (
          window.ReinoNavigationButtons &&
          window.ReinoFormSubmission &&
          window.ReinoExternalIntegrations
        ) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
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
          },
          getAllocationStatus: () => ({
            isFullyAllocated: this.isFullyAllocated,
            sendButtonsDisabled: !this.isFullyAllocated,
          }),
        };
      }
    }

    log(message) {
      if (this.debugMode) {
        console.log(`[ButtonCoordinator] ${message}`);
      }
    }
  }

  // Auto-initialize for SEND buttons only
  // Navigation buttons (next/prev) are handled by standalone navigation-buttons.js
  function initializeButtonCoordinator() {
    if (
      window.ReinoStepNavigationProgressSystem &&
      window.ReinoStepNavigationProgressSystem.isInitialized
    ) {
      if (!window.ReinoButtonCoordinator) {
        const coordinator = new ButtonCoordinator();
        window.ReinoButtonCoordinator = coordinator;
        coordinator.init(window.ReinoStepNavigationProgressSystem);
        console.log('✅ ButtonCoordinator initialized (send buttons only)');
      }
    } else {
      setTimeout(initializeButtonCoordinator, 200);
    }
  }

  // Initialize based on document state
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeButtonCoordinator, 600); // Delay maior para não conflitar com navigation-buttons
    });
  } else {
    setTimeout(initializeButtonCoordinator, 600);
  }
})();
