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

      if (this.debugMode) {
        console.log('✅ Rotation Index Integration initialized');
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
        return originalResult;
      }

      const productKey = `${category}:${product}`;
      const rotationCalc = this.rotationController.getProductCalculation(productKey);

      if (this.debugMode) {
        console.log(`🔄 Rotation calc for ${productKey}:`, {
          found: !!rotationCalc,
          rotationCalc,
          currentIndex: this.rotationController.getCurrentIndex(),
        });
      }

      if (rotationCalc) {
        const rotationBasedCost = valorAlocado * rotationCalc.comissaoRate;

        if (this.debugMode) {
          console.log(`💰 Cost calculation:`, {
            valorAlocado,
            comissaoRate: rotationCalc.comissaoRate,
            rotationBasedCost,
            originalCost: originalResult.custoMedio,
          });
        }

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

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeRotationIndexIntegration);
    } else {
      initializeRotationIndexIntegration();
    }
  }
})();
