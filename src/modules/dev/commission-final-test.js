/**
 * Commission Final Test
 * Teste final para verificar se todos os problemas foram corrigidos
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  function finalCommissionTest() {
    console.log('🎯 Running FINAL commission test...');

    // Check modules
    const modules = {
      appState: !!window.ReinoAppState,
      resultadoSync: !!window.ReinoSimpleResultadoSync,
      comparativo: !!window.ReinoResultadoComparativoCalculator,
      supabase: !!window.ReinoSupabaseIntegration,
      calcularCustoProduto: !!window.calcularCustoProduto,
    };

    console.log('📋 Modules:', modules);

    if (!modules.appState || !modules.resultadoSync) {
      console.error('❌ Required modules missing');
      return;
    }

    if (!modules.calcularCustoProduto) {
      console.warn('⚠️ calcularCustoProduto function not found - commission will be 0');
    }

    // Clear and setup test
    console.log('🧹 Setting up clean test...');

    const appState = window.ReinoAppState;
    const resultadoSync = window.ReinoSimpleResultadoSync;

    // Remove existing test assets
    const existingAssets = appState.getSelectedAssets();
    existingAssets.forEach((assetKey) => {
      const [category, product] = assetKey.split(':');
      if (category && product && category.includes('test')) {
        appState.removeSelectedAsset(category, product, 'cleanup');
      }
    });

    // Add test asset with higher value
    const testCategory = 'Renda Fixa';
    const testProduct = 'CDB';
    const testValue = 500000; // R$ 500,000

    console.log(
      `🎯 Testing with ${testCategory}:${testProduct} = R$ ${testValue.toLocaleString()}`
    );

    appState.addSelectedAsset(testCategory, testProduct, 'final-test');
    appState.setAllocation(testCategory, testProduct, testValue, 'final-test');

    setTimeout(() => {
      // Test key consistency
      console.log('🔑 Testing key consistency...');

      const appStateAssets = appState.getSelectedAssets();
      const expectedKey = `${testCategory.toLowerCase()}:${testProduct.toLowerCase()}`;
      const keyExists = appStateAssets.includes(expectedKey);

      console.log('- Expected key:', expectedKey);
      console.log('- AppState assets:', appStateAssets);
      console.log('- Key exists:', keyExists);

      if (!keyExists) {
        console.error('❌ Key consistency failed');
        return;
      }

      // Test asset recognition
      const isRecognized = resultadoSync.isAssetSelected(testCategory, testProduct);
      console.log('✅ Asset recognized:', isRecognized);

      if (!isRecognized) {
        console.error('❌ Asset recognition failed');
        return;
      }

      // Test allocation retrieval
      const allocation = appState.getAllocation(testCategory, testProduct);
      console.log('💰 Allocation retrieved:', allocation);

      if (allocation !== testValue) {
        console.error('❌ Allocation mismatch');
        return;
      }

      // Test commission calculation
      console.log('🧮 Testing commission calculation...');

      let calculationResult = 0;
      if (window.calcularCustoProduto) {
        try {
          const custoResult = window.calcularCustoProduto(testValue, testCategory, testProduct);
          calculationResult = custoResult.custoMedio || 0;
          console.log('- calcularCustoProduto result:', custoResult);
          console.log('- Commission calculated:', calculationResult);
        } catch (error) {
          console.error('❌ calcularCustoProduto error:', error.message);
        }
      } else {
        console.log('⚠️ calcularCustoProduto not available - using fallback');
        calculationResult = testValue * 0.015; // 1.5% fallback
      }

      // Listen for events
      let eventReceived = false;
      let eventTotal = 0;
      const handler = (e) => {
        eventReceived = true;
        eventTotal = e.detail.total;
        console.log('📡 Commission event received:', {
          total: e.detail.total,
          formatted: e.detail.formatted,
          source: e.detail.source,
          details: e.detail.details?.length || 0,
        });
      };

      document.addEventListener('totalComissaoChanged', handler);

      // Force calculation
      console.log('🔄 Forcing calculation...');
      resultadoSync.forceSync();

      setTimeout(() => {
        document.removeEventListener('totalComissaoChanged', handler);

        console.log('📊 FINAL RESULTS:');
        console.log('================');

        // Event results
        console.log('📡 Event received:', eventReceived);
        console.log('💰 Event total:', eventTotal);

        // DOM results
        const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
        const tradicionalValue = tradicionalElement ? tradicionalElement.textContent : 'NOT_FOUND';
        console.log('🖥️ DOM tradicional:', tradicionalValue);

        // Supabase results
        const supabaseCommission =
          window.ReinoSupabaseIntegration?.lastCommissionData?.total || null;
        console.log('📊 Supabase commission:', supabaseCommission);

        // AppState results
        const appStateCommission = window.ReinoAppState.getCommissionResults();
        console.log('📊 AppState commission:', appStateCommission);

        // Success criteria
        const success = {
          eventReceived: eventReceived,
          eventHasValue: eventTotal > 0,
          domUpdated: tradicionalValue !== '0,00' && tradicionalValue !== 'NOT_FOUND',
          supabaseUpdated: supabaseCommission > 0,
          appStateUpdated: appStateCommission.total > 0,
        };

        console.log('✅ Success criteria:', success);

        const allSuccess = Object.values(success).every(Boolean);

        if (allSuccess) {
          console.log('🎉 🎉 🎉 ALL TESTS PASSED! Commission flow is working perfectly! 🎉 🎉 🎉');
        } else {
          console.log('❌ Some tests failed. Issues remaining:');
          Object.entries(success).forEach(([key, value]) => {
            if (!value) {
              console.log(`  - ${key}: FAILED`);
            }
          });
        }

        // Cleanup
        appState.removeSelectedAsset(testCategory, testProduct, 'final-test-cleanup');
      }, 500);
    }, 200);
  }

  // Global function
  window.finalCommissionTest = finalCommissionTest;

  console.log('🔧 Commission Final Test loaded. Run with: finalCommissionTest()');
})();
