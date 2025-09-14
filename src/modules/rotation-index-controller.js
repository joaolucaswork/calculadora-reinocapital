(function () {
  'use strict';

  class RotationIndexController {
    constructor() {
      this.isInitialized = false;
      this.appState = null;
      this.slider = null;
      this.displayElement = null;
      this.debugMode = window.location.search.includes('debug=true');

      this.config = {
        minValue: 1,
        maxValue: 4,
        defaultValue: 2,
        step: 1,
      };

      // Legacy fallback para compatibilidade
      this._legacyIndex = this.config.defaultValue;
      this.productData = this.initializeProductData();
    }

    // Getter inteligente que usa AppState se disponível
    get currentIndex() {
      if (this.appState) {
        return this.appState.getRotationIndex().value;
      }
      return this._legacyIndex;
    }

    // Setter inteligente que usa AppState se disponível
    set currentIndex(value) {
      if (this.appState) {
        const calculations = this.calculateAllProducts(value);
        this.appState.setRotationIndex(value, calculations, 'rotation-controller');
      } else {
        this._legacyIndex = value;
        // Dispara evento legacy para compatibilidade
        this.dispatchIndexChange();
      }
    }

    init() {
      if (this.isInitialized) return;

      // Aguarda o AppState estar disponível
      this.waitForAppState();
    }

    async waitForAppState() {
      const maxAttempts = 50;
      let attempts = 0;

      while (attempts < maxAttempts) {
        if (window.ReinoAppState && window.ReinoAppState.isInitialized) {
          this.appState = window.ReinoAppState;
          this.setupController();
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        console.warn('⚠️ RotationIndexController: AppState not found, falling back to legacy mode');
        this.setupController();
      }
    }

    setupController() {
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
          const mode = this.appState ? 'with AppState integration' : 'in legacy mode';
          console.log(`✅ Rotation Index Controller initialized ${mode}`);
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
      const initialValue = currentValue || this.config.defaultValue;

      // Se AppState estiver disponível, sincroniza com ele
      if (this.appState) {
        const appStateValue = this.appState.getRotationIndex().value;
        // Usa o valor do AppState se disponível, senão usa o valor inicial
        this.currentIndex = appStateValue || initialValue;
      } else {
        this.currentIndex = initialValue;
      }

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

      // Listener para mudanças do AppState (de outras fontes)
      if (this.appState) {
        document.addEventListener('rotationIndexChanged', (e) => {
          // Só atualiza se a mudança não veio deste controller
          if (e.detail.source !== 'rotation-controller') {
            this.forceSliderUpdate();
            this.updateDisplay();
          }
        });
      }
    }

    handleSliderChange(e) {
      const newValue = parseInt(e.target.value, 10);

      if (newValue !== this.currentIndex) {
        this.currentIndex = newValue; // Usa o setter inteligente
        this.updateDisplay();

        // Se não estiver usando AppState, dispara evento legacy
        if (!this.appState) {
          this.dispatchIndexChange();
        }

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

    calculateAllProducts(indexOverride = null) {
      const results = {};
      const indexToUse = indexOverride !== null ? indexOverride : this.currentIndex;

      for (const [key, product] of Object.entries(this.productData)) {
        results[key] = this.calculateProductCommission(product, indexToUse);
      }

      return results;
    }

    calculateProductCommission(product, indexOverride = null) {
      const { mediaCorretagem, prazoMedioAnos, fatorGiro, fixed } = product;
      const indexToUse = indexOverride !== null ? indexOverride : this.currentIndex;

      const indiceGiro = fixed ? 1 : indexToUse;
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
        'Fundo de Investimento:Ações FIA': {
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
        'Fundo de Investimento:Imobiliários Cetipados': {
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
        'Renda Variável:Ações e Ativos': {
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
        'Renda Variável:Carteira administrada': {
          mediaCorretagem: 0.0325,
          prazoMedioAnos: 1.0,
          fatorGiro: 1.0,
          fixed: false,
        },
        'Internacional:Dólar': {
          mediaCorretagem: 0.02,
          prazoMedioAnos: 5.0,
          fatorGiro: 1.0,
          fixed: false,
        },
        'Internacional:Inter Produtos': {
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
        'COE:COE': {
          mediaCorretagem: 0.055,
          prazoMedioAnos: 1.0,
          fatorGiro: 1.0,
          fixed: true,
        },
      };
    }

    getCurrentIndex() {
      return this.currentIndex;
    }

    setIndex(newIndex) {
      if (newIndex >= this.config.minValue && newIndex <= this.config.maxValue) {
        this.currentIndex = newIndex; // Usa o setter inteligente
        this.forceSliderUpdate();

        // Se não estiver usando AppState, dispara evento legacy
        if (!this.appState) {
          this.dispatchIndexChange();
        }
      }
    }

    forceVisualSync() {
      this.forceSliderUpdate();
    }

    getProductCalculation(productKey) {
      // Try exact match first
      let product = this.productData[productKey];

      // If not found, try normalized key
      if (!product) {
        const normalizedKey = this.normalizeProductKey(productKey);
        product = this.productData[normalizedKey];
      }

      return product ? this.calculateProductCommission(product) : null;
    }

    getProductData(productKey) {
      // Try exact match first
      let product = this.productData[productKey];

      // If not found, try normalized key
      if (!product) {
        const normalizedKey = this.normalizeProductKey(productKey);
        product = this.productData[normalizedKey];
      }

      return product || null;
    }

    normalizeProductKey(productKey) {
      // Convert "renda fixa:cdb" to "Renda Fixa:CDB"
      const [category, product] = productKey.split(':');
      if (!category || !product) return productKey;

      const normalizedCategory = category
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      const normalizedProduct = product.toUpperCase();

      return `${normalizedCategory}:${normalizedProduct}`;
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
