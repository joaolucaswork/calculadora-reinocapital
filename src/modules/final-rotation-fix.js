/**
 * Final Rotation Fix
 * Solução definitiva para o problema do elemento [data-resultado="tradicional"]
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  function applyFinalRotationFix() {
    console.log('🔧 Applying Final Rotation Fix...');
    console.log('=================================');

    // Step 1: Ensure rotation integration is working
    console.log('\n1. 🔄 Ensuring rotation integration...');

    if (!window.ReinoRotationIndexController || !window.calcularCustoProduto) {
      console.error('❌ Required dependencies missing');
      return;
    }

    // Store original function if not already stored
    if (!window._originalCalcularCustoProduto) {
      window._originalCalcularCustoProduto = window.calcularCustoProduto;
      console.log('✅ Original calcularCustoProduto stored');
    }

    // Create enhanced function that ALWAYS considers rotation
    window.calcularCustoProduto = function (valorAlocado, category, product) {
      const originalResult = window._originalCalcularCustoProduto(valorAlocado, category, product);

      if (!window.ReinoRotationIndexController || valorAlocado <= 0) {
        return originalResult;
      }

      const productKey = `${category}:${product}`;
      const rotationCalc = window.ReinoRotationIndexController.getProductCalculation(productKey);

      if (rotationCalc) {
        const rotationBasedCost = valorAlocado * rotationCalc.comissaoRate;
        const currentIndex = window.ReinoRotationIndexController.getCurrentIndex();

        console.log(
          `🔄 Rotation calc: ${productKey} @ index ${currentIndex} = R$ ${rotationBasedCost.toLocaleString()} (rate: ${rotationCalc.comissaoRate})`
        );

        return {
          ...originalResult,
          custoMedio: rotationBasedCost,
          custoRotacao: rotationBasedCost,
          indiceGiro: currentIndex,
          comissaoRate: rotationCalc.comissaoRate,
          comissaoPercent: rotationCalc.comissaoPercent,
          fatorEfetivo: rotationCalc.fatorEfetivo,
          calculoOriginal: originalResult.custoMedio,
        };
      } else {
        console.log(`⚠️ No rotation calculation found for ${productKey}`);
      }

      return originalResult;
    };

    console.log('✅ Enhanced calcularCustoProduto installed');

    // Step 2: Enhance resultado-sync to force DOM update
    console.log('\n2. 🎯 Enhancing resultado-sync DOM update...');

    if (window.ReinoSimpleResultadoSync) {
      const originalUpdateTotalComissao = window.ReinoSimpleResultadoSync.updateTotalComissao;

      window.ReinoSimpleResultadoSync.updateTotalComissao = function (total) {
        // Call original method
        originalUpdateTotalComissao.call(this, total);

        // FORCE update the tradicional element
        const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
        if (tradicionalElement) {
          const displayFormatted = new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(total);

          tradicionalElement.textContent = displayFormatted;
          console.log(`🎯 FORCED tradicional DOM update: ${displayFormatted}`);
        }
      };

      console.log('✅ Enhanced resultado-sync updateTotalComissao');
    }

    // Step 3: Add rotation index change listener
    console.log('\n3. 🔗 Adding rotation change listener...');

    document.addEventListener('rotationIndexChanged', (e) => {
      console.log(`🔄 Rotation changed to ${e.detail.index}, forcing recalculation...`);

      // Force immediate recalculation
      setTimeout(() => {
        if (window.ReinoSimpleResultadoSync) {
          window.ReinoSimpleResultadoSync.forceSync();
        }
      }, 50);
    });

    console.log('✅ Rotation change listener added');

    // Step 4: Test the fix
    console.log('\n4. 🧪 Testing the fix...');

    if (window.ReinoAppState) {
      // Setup test data
      window.ReinoAppState.setPatrimonio(1000000, 'final-fix-test');
      window.ReinoAppState.addSelectedAsset('Renda Fixa', 'CDB', 'final-fix-test');
      window.ReinoAppState.setAllocation('Renda Fixa', 'CDB', 500000, 'final-fix-test');

      setTimeout(() => {
        const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
        const initialValue = tradicionalElement ? tradicionalElement.textContent : 'NOT_FOUND';
        console.log(`Initial DOM value: "${initialValue}"`);

        // Change rotation index
        const rotationController = window.ReinoRotationIndexController;
        const initialIndex = rotationController.getCurrentIndex();
        const newIndex = initialIndex === 2 ? 3 : 2;

        console.log(`Changing rotation from ${initialIndex} to ${newIndex}...`);
        rotationController.setIndex(newIndex);

        setTimeout(() => {
          const finalValue = tradicionalElement ? tradicionalElement.textContent : 'NOT_FOUND';
          console.log(`Final DOM value: "${finalValue}"`);
          console.log(`DOM changed: ${finalValue !== initialValue ? '✅' : '❌'}`);

          if (finalValue !== initialValue) {
            console.log('\n🎉 SUCCESS! The fix is working!');
          } else {
            console.log('\n❌ Fix not working, manual intervention needed');
          }

          // Cleanup
          window.ReinoAppState.removeSelectedAsset('Renda Fixa', 'CDB', 'final-fix-test-cleanup');
          rotationController.setIndex(initialIndex);
        }, 1000);
      }, 500);
    }

    console.log('\n✅ Final rotation fix applied!');
  }

  // Make function globally available
  window.applyFinalRotationFix = applyFinalRotationFix;

  // Auto-apply the fix
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(applyFinalRotationFix, 2000); // Wait 2 seconds for all modules to load
    });
  } else {
    setTimeout(applyFinalRotationFix, 2000);
  }

  console.log('✅ Final Rotation Fix loaded and will auto-apply in 2 seconds.');
})();
