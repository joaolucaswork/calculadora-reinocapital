(function () {
  'use strict';

  class RotationIndexIntegration {
    constructor() {
      this.isInitialized = false;
      this.rotationController = null;
      this.originalCalcFunction = null;
      this.debugMode = window.location.search.includes('debug=true');
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
        console.error('❌ Rotation Index Integration initialization failed:', error);
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
        console.warn('⚠️ Rotation Index Integration: Dependencies not found');
      }
    }

    setupIntegration() {
      this.originalCalcFunction = window.calcularCustoProduto;
      window.calcularCustoProduto = this.enhancedCalcFunction.bind(this);

      this.setupEventListeners();
      this.isInitialized = true;

      console.log('✅ Rotation Index Integration initialized and calcularCustoProduto enhanced');

      if (this.debugMode) {
        console.log('🔄 Original function stored, enhanced function active');
      }
    }

    setupEventListeners() {
      document.addEventListener('rotationIndexChanged', (e) => {
        this.handleRotationIndexChange(e.detail);
      });
    }

    enhancedCalcFunction(valorAlocado, category, product) {
      const originalResult = this.originalCalcFunction(valorAlocado, category, product);

      if (!this.rotationController || valorAlocado <= 0) {
        console.log(
          `⚠️ Rotation calc skipped: controller=${!!this.rotationController}, value=${valorAlocado}`
        );
        return originalResult;
      }

      const productKey = `${category}:${product}`;
      const rotationCalc = this.rotationController.getProductCalculation(productKey);

      console.log(`🔄 Rotation calc for ${productKey}:`, {
        found: !!rotationCalc,
        currentIndex: this.rotationController.getCurrentIndex(),
        rotationCalc: rotationCalc
          ? {
              comissaoRate: rotationCalc.comissaoRate,
              comissaoPercent: rotationCalc.comissaoPercent,
            }
          : null,
      });

      if (rotationCalc) {
        const rotationBasedCost = valorAlocado * rotationCalc.comissaoRate;

        console.log(`💰 Cost calculation:`, {
          valorAlocado,
          comissaoRate: rotationCalc.comissaoRate,
          rotationBasedCost,
          originalCost: originalResult.custoMedio,
        });

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
      } else {
        console.log(`⚠️ No rotation calculation found for ${productKey}, using original result`);
      }

      return originalResult;
    }

    handleRotationIndexChange(detail) {
      if (this.debugMode) {
        console.log('🔄 Rotation index changed, triggering recalculation:', detail);
      }

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
