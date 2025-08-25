(function () {
  'use strict';

  class RotationIndexController {
    constructor() {
      this.isInitialized = false;
      this.slider = null;
      this.displayElement = null;
      this.debugMode = window.location.search.includes('debug=true');

      this.config = {
        minValue: 1,
        maxValue: 4,
        defaultValue: 2,
        step: 1,
      };

      this.currentIndex = this.config.defaultValue;
      this.productData = this.initializeProductData();
    }

    init() {
      if (this.isInitialized) return;

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    async setup() {
      try {
        this.cacheElements();
        await this.waitForSliderInitialization();
        this.setupSlider();
        this.setupEventListeners();
        this.updateDisplay();

        setTimeout(() => {
          this.forceVisualSync();
        }, 300);

        this.isInitialized = true;

        if (this.debugMode) {
          console.log('✅ Rotation Index Controller initialized');
        }
      } catch (error) {
        console.error('❌ Rotation Index Controller initialization failed:', error);
      }
    }

    cacheElements() {
      this.slider = document.querySelector('#indice-giro');
      this.displayElement = document.querySelector('.indice-de-giro');

      if (!this.slider) {
        throw new Error('Rotation index slider not found');
      }

      if (!this.displayElement) {
        throw new Error('Rotation index display element not found');
      }
    }

    async waitForSliderInitialization() {
      return new Promise((resolve) => {
        const checkSliderReady = () => {
          if (this.slider && this.slider.querySelector('[data-thumb]')) {
            setTimeout(resolve, 100);
          } else {
            setTimeout(checkSliderReady, 50);
          }
        };
        checkSliderReady();
      });
    }

    setupSlider() {
      const currentValue = parseInt(this.slider.getAttribute('value'), 10);
      this.currentIndex = currentValue || this.config.defaultValue;

      this.forceSliderUpdate();
    }

    forceSliderUpdate() {
      if (!this.slider) return;

      this.slider.value = this.currentIndex.toString();

      const thumb = this.slider.querySelector('[data-thumb]');
      if (thumb) {
        const percent =
          ((this.currentIndex - this.config.minValue) /
            (this.config.maxValue - this.config.minValue)) *
          100;
        thumb.style.setProperty('inset-inline-start', `${percent}%`);
        thumb.setAttribute('aria-valuenow', this.currentIndex);
      }

      const trackFill = this.slider.querySelector('[data-track-fill]');
      if (trackFill) {
        const percent =
          ((this.currentIndex - this.config.minValue) /
            (this.config.maxValue - this.config.minValue)) *
          100;
        trackFill.style.setProperty('inset-inline', `0 ${100 - percent}%`);
      }

      this.updateDisplay();
    }

    setupEventListeners() {
      this.slider.addEventListener('input', (e) => {
        this.handleSliderChange(e);
      });

      this.slider.addEventListener('change', (e) => {
        this.handleSliderChange(e);
      });

      document.addEventListener('settingsModalOpened', () => {
        this.updateDisplay();
      });
    }

    handleSliderChange(e) {
      const newValue = parseInt(e.target.value, 10);

      if (newValue !== this.currentIndex) {
        this.currentIndex = newValue;
        this.updateDisplay();
        this.dispatchIndexChange();

        if (window.rotationSliderTooltipInstance) {
          window.rotationSliderTooltipInstance.updateTooltipContent();
        }

        if (this.debugMode) {
          console.log(`🔄 Rotation index changed to: ${this.currentIndex}`);
        }
      }
    }

    updateDisplay() {
      if (this.displayElement) {
        this.displayElement.textContent = this.currentIndex.toString();
      }
    }

    dispatchIndexChange() {
      document.dispatchEvent(
        new CustomEvent('rotationIndexChanged', {
          detail: {
            index: this.currentIndex,
            calculations: this.calculateAllProducts(),
          },
        })
      );
    }

    calculateAllProducts() {
      const results = {};

      for (const [key, product] of Object.entries(this.productData)) {
        results[key] = this.calculateProductCommission(product);
      }

      return results;
    }

    calculateProductCommission(product) {
      const { mediaCorretagem, prazoMedioAnos, fatorGiro, fixed } = product;

      const indiceGiro = fixed ? 1 : this.currentIndex;
      const comissaoRate = (mediaCorretagem / prazoMedioAnos) * fatorGiro * indiceGiro;

      return {
        comissaoRate: comissaoRate,
        comissaoPercent: comissaoRate * 100,
        fatorEfetivo: fatorGiro * indiceGiro,
      };
    }

    initializeProductData() {
      return {
        'Renda Fixa:CDB': {
          mediaCorretagem: 0.02,
          prazoMedioAnos: 3.0,
          fatorGiro: 1.2,
          fixed: false,
        },
        'Renda Fixa:CRI': {
          mediaCorretagem: 0.0425,
          prazoMedioAnos: 8.0,
          fatorGiro: 3.0,
          fixed: false,
        },
        'Renda Fixa:Títulos Públicos': {
          mediaCorretagem: 0.0375,
          prazoMedioAnos: 10.0,
          fatorGiro: 3.0,
          fixed: false,
        },
        'Fundo de Investimento:Ações': {
          mediaCorretagem: 0.0175,
          prazoMedioAnos: 1.0,
          fatorGiro: 1.0,
          fixed: true,
        },
        'Fundo de Investimento:Liquidez': {
          mediaCorretagem: 0.0035,
          prazoMedioAnos: 1.0,
          fatorGiro: 1.0,
          fixed: true,
        },
        'Fundo de Investimento:Renda Fixa': {
          mediaCorretagem: 0.0075,
          prazoMedioAnos: 1.0,
          fatorGiro: 1.0,
          fixed: true,
        },
        'Fundo de Investimento:Multimercado': {
          mediaCorretagem: 0.0175,
          prazoMedioAnos: 1.0,
          fatorGiro: 1.0,
          fixed: true,
        },
        'Fundo de Investimento:Imobiliários': {
          mediaCorretagem: 0.02,
          prazoMedioAnos: 1.0,
          fatorGiro: 1.0,
          fixed: true,
        },
        'Fundo de Investimento:Private Equity': {
          mediaCorretagem: 0.02,
          prazoMedioAnos: 1.0,
          fatorGiro: 1.0,
          fixed: true,
        },
        'Renda Variável:Ações': {
          mediaCorretagem: 0.005,
          prazoMedioAnos: 1.0,
          fatorGiro: 3.0,
          fixed: false,
        },
        'Renda Variável:Operação Estruturada': {
          mediaCorretagem: 0.0525,
          prazoMedioAnos: 1.0,
          fatorGiro: 1.0,
          fixed: false,
        },
        'Renda Variável:Carteira Administrada': {
          mediaCorretagem: 0.0325,
          prazoMedioAnos: 1.0,
          fatorGiro: 1.0,
          fixed: false,
        },
        'Internacional:Investimentos': {
          mediaCorretagem: 0.02,
          prazoMedioAnos: 5.0,
          fatorGiro: 1.0,
          fixed: false,
        },
        'Internacional:ETF': {
          mediaCorretagem: 0.0063,
          prazoMedioAnos: 1.0,
          fatorGiro: 1.0,
          fixed: false,
        },
        'Previdência:Ações': {
          mediaCorretagem: 0.0175,
          prazoMedioAnos: 1.0,
          fatorGiro: 1.0,
          fixed: true,
        },
        'Previdência:Multimercado': {
          mediaCorretagem: 0.0175,
          prazoMedioAnos: 1.0,
          fatorGiro: 1.0,
          fixed: true,
        },
        'Previdência:Renda Fixa': {
          mediaCorretagem: 0.0075,
          prazoMedioAnos: 1.0,
          fatorGiro: 1.0,
          fixed: true,
        },
        'Outros:COE': {
          mediaCorretagem: 0.055,
          prazoMedioAnos: 5.0,
          fatorGiro: 1.2,
          fixed: false,
        },
        'Outros:Previdência': {
          mediaCorretagem: 0.0175,
          prazoMedioAnos: 1.0,
          fatorGiro: 1.0,
          fixed: true,
        },
        'Outros:Poupança': {
          mediaCorretagem: 0.002,
          prazoMedioAnos: 1.0,
          fatorGiro: 1.0,
          fixed: true,
        },
        'Outros:Operação compromissada': {
          mediaCorretagem: 0.065,
          prazoMedioAnos: 1.0,
          fatorGiro: 0.33,
          fixed: false,
        },
        'Outros:Imóvel': {
          mediaCorretagem: 0.75,
          fatorGiro: 1.0,
          fixed: false,
        },
        'Outros:Criptoativos': {
          mediaCorretagem: 0,
          fatorGiro: 1.0,
          fixed: false,
        },
      };
    }

    getCurrentIndex() {
      return this.currentIndex;
    }

    setIndex(newIndex) {
      if (newIndex >= this.config.minValue && newIndex <= this.config.maxValue) {
        this.currentIndex = newIndex;
        this.forceSliderUpdate();
        this.dispatchIndexChange();
      }
    }

    forceVisualSync() {
      this.forceSliderUpdate();
    }

    getProductCalculation(productKey) {
      const product = this.productData[productKey];
      return product ? this.calculateProductCommission(product) : null;
    }

    getProductData(productKey) {
      return this.productData[productKey] || null;
    }
  }

  function initializeRotationIndexController() {
    if (!window.ReinoRotationIndexController) {
      const controller = new RotationIndexController();
      window.ReinoRotationIndexController = controller;
      controller.init();
    }
  }

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeRotationIndexController);
    } else {
      initializeRotationIndexController();
    }
  }
})();
