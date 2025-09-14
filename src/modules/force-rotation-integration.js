/**
 * Force Rotation Integration
 * Força a inicialização da integração do sistema de rotação
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  function forceRotationIntegration() {
    console.log('🔧 Force Rotation Integration...');
    console.log('================================');

    // Check current state
    console.log('\n1. 📋 Current State:');
    console.log(`   calcularCustoProduto: ${typeof window.calcularCustoProduto}`);
    console.log(`   ReinoRotationIndexController: ${!!window.ReinoRotationIndexController}`);
    console.log(`   ReinoRotationIndexIntegration: ${!!window.ReinoRotationIndexIntegration}`);

    if (window.ReinoRotationIndexIntegration) {
      console.log(
        `   Integration initialized: ${window.ReinoRotationIndexIntegration.isInitialized}`
      );
    }

    // Force initialization if needed
    if (
      !window.ReinoRotationIndexIntegration ||
      !window.ReinoRotationIndexIntegration.isInitialized
    ) {
      console.log('\n2. 🚀 Forcing integration initialization...');

      if (window.ReinoRotationIndexController && window.calcularCustoProduto) {
        // Create integration manually
        class RotationIndexIntegration {
          constructor() {
            this.isInitialized = false;
            this.rotationController = null;
            this.originalCalcFunction = null;
          }

          init() {
            this.rotationController = window.ReinoRotationIndexController;
            this.originalCalcFunction = window.calcularCustoProduto;

            // Replace the function
            window.calcularCustoProduto = this.enhancedCalcFunction.bind(this);
            this.isInitialized = true;

            console.log('✅ Manual rotation integration initialized');
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

              console.log(
                `🔄 Enhanced calc: ${productKey} = R$ ${rotationBasedCost.toLocaleString()} (rate: ${rotationCalc.comissaoRate})`
              );

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
        }

        const integration = new RotationIndexIntegration();
        window.ReinoRotationIndexIntegration = integration;
        integration.init();
      } else {
        console.log('❌ Required dependencies not available');
        return;
      }
    } else {
      console.log('\n2. ✅ Integration already initialized');
    }

    // Test the integration
    console.log('\n3. 🧪 Testing integration...');

    const testValue = 500000;
    const testCategory = 'Renda Fixa';
    const testProduct = 'CDB';

    console.log(`Testing: ${testCategory}:${testProduct} = R$ ${testValue.toLocaleString()}`);

    // Test with different rotation indices
    [1, 2, 3, 4].forEach((index) => {
      window.ReinoRotationIndexController.setIndex(index);

      const resultado = window.calcularCustoProduto(testValue, testCategory, testProduct);
      console.log(
        `Index ${index}: R$ ${resultado.custoMedio?.toLocaleString()} (has rotation: ${!!(resultado.custoRotacao || resultado.indiceGiro)})`
      );
    });

    // Reset to index 2
    window.ReinoRotationIndexController.setIndex(2);

    // Force recalculation
    console.log('\n4. 🔄 Forcing recalculation...');
    if (window.ReinoSimpleResultadoSync) {
      window.ReinoSimpleResultadoSync.forceSync();
      console.log('✅ Forced resultado-sync recalculation');
    }

    console.log('\n✅ Force rotation integration complete!');
  }

  // Make function globally available
  window.forceRotationIntegration = forceRotationIntegration;

  console.log('✅ Force Rotation Integration loaded. Call forceRotationIntegration() to run.');
})();
