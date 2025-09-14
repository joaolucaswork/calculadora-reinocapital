(function () {
  'use strict';

  class RotationIndexIntegration {
    constructor() {
      this.isInitialized = false;
      this.rotationController = null;
      this.originalCalcFunction = null;
      this.debugMode = false; // Debug desabilitado para produção
    }

    init() {
      if (this.isInitialized) return;

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      try {
        this.waitForDependencies();
      } catch (error) {
        // Initialization failed silently
      }
    }

    async waitForDependencies() {
      const maxAttempts = 50;
      let attempts = 0;

      while (attempts < maxAttempts) {
        if (window.ReinoRotationIndexController && window.calcularCustoProduto) {
          this.rotationController = window.ReinoRotationIndexController;
          this.setupIntegration();
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        // Dependencies not found - fail silently
      }
    }

    setupIntegration() {
      this.originalCalcFunction = window.calcularCustoProduto;
      window.calcularCustoProduto = this.enhancedCalcFunction.bind(this);

      this.setupEventListeners();
      this.isInitialized = true;

      // Rotation Index Integration initialized silently
    }

    setupEventListeners() {
      document.addEventListener('rotationIndexChanged', (e) => {
        this.handleRotationIndexChange(e.detail);
      });
    }

    enhancedCalcFunction(valorAlocado, category, product) {
      const originalResult = this.originalCalcFunction(valorAlocado, category, product);

      if (!this.rotationController || valorAlocado <= 0) {
        return originalResult;
      }

      const productKey = `${category}:${product}`;
      const rotationCalc = this.rotationController.getProductCalculation(productKey);

      if (rotationCalc) {
        const rotationBasedCost = valorAlocado * rotationCalc.comissaoRate;

        return {
          ...originalResult,
          custoMedio: rotationBasedCost,
          custoRotacao: rotationBasedCost,
          indiceGiro: this.rotationController.getCurrentIndex(),
          comissaoRate: rotationCalc.comissaoRate,
          comissaoPercent: rotationCalc.comissaoPercent,
          fatorEfetivo: rotationCalc.fatorEfetivo,
          calculoOriginal: originalResult.custoMedio,
        };
      }

      return originalResult;
    }

    handleRotationIndexChange(detail) {
      this.triggerSystemRecalculation();
    }

    triggerSystemRecalculation() {
      setTimeout(() => {
        if (window.ReinoResultadoComparativoCalculator) {
          window.ReinoResultadoComparativoCalculator.calculateAndUpdate();
        }

        if (window.ReinoResultadoSyncSystem) {
          window.ReinoResultadoSyncSystem.syncAllResults();
        }

        document.dispatchEvent(
          new CustomEvent('rotationIndexRecalculationComplete', {
            detail: {
              timestamp: new Date().toISOString(),
              rotationIndex: this.rotationController?.getCurrentIndex(),
            },
          })
        );
      }, 50);
    }

    getRotationIndexData() {
      if (!this.rotationController) return null;

      return {
        currentIndex: this.rotationController.getCurrentIndex(),
        calculations: this.rotationController.calculateAllProducts(),
      };
    }

    restoreOriginalFunction() {
      if (this.originalCalcFunction) {
        window.calcularCustoProduto = this.originalCalcFunction;
      }
    }
  }

  function initializeRotationIndexIntegration() {
    if (!window.ReinoRotationIndexIntegration) {
      const integration = new RotationIndexIntegration();
      window.ReinoRotationIndexIntegration = integration;
      integration.init();
    }
  }

  // Multiple initialization attempts to ensure dependencies are loaded
  function tryInitialization() {
    if (window.ReinoRotationIndexController && window.calcularCustoProduto) {
      initializeRotationIndexIntegration();
      return true;
    }
    return false;
  }

  if (typeof window !== 'undefined') {
    // Try immediate initialization
    if (!tryInitialization()) {
      // If not ready, try on DOMContentLoaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          if (!tryInitialization()) {
            // If still not ready, try with delays
            setTimeout(() => tryInitialization(), 500);
            setTimeout(() => tryInitialization(), 1000);
            setTimeout(() => tryInitialization(), 2000);
          }
        });
      } else {
        // Document already loaded, try with delays
        setTimeout(() => tryInitialization(), 100);
        setTimeout(() => tryInitialization(), 500);
        setTimeout(() => tryInitialization(), 1000);
      }
    }
  }
})();
