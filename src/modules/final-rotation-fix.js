/**
 * Final Rotation Fix
 * Solução definitiva para o problema do elemento [data-resultado="tradicional"]
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  function applyFinalRotationFix() {
    // Apply Final Rotation Fix silently

    // Step 1: Ensure rotation integration is working

    if (!window.ReinoRotationIndexController || !window.calcularCustoProduto) {
      return;
    }

    // Store original function if not already stored
    if (!window._originalCalcularCustoProduto) {
      window._originalCalcularCustoProduto = window.calcularCustoProduto;
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

        // Rotation calculation applied silently

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
      }

      return originalResult;
    };

    // Step 2: Enhance resultado-sync to force DOM update

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
        }
      };
    }

    // Step 3: Add rotation index change listener
    document.addEventListener('rotationIndexChanged', (e) => {
      // Force immediate recalculation
      setTimeout(() => {
        if (window.ReinoSimpleResultadoSync) {
          window.ReinoSimpleResultadoSync.forceSync();
        }
      }, 50);
    });
  }

  // Auto-apply the fix
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(applyFinalRotationFix, 2000); // Wait 2 seconds for all modules to load
    });
  } else {
    setTimeout(applyFinalRotationFix, 2000);
  }
})();
