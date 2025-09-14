/**
 * Commission Flow Fix Test
 * Testa especificamente a correção do problema de separadores de chave
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  function testCommissionFlowFix() {
    console.log('🔧 Testing commission flow fix...');

    // Step 1: Check if modules are available
    const modules = {
      appState: !!window.ReinoAppState,
      resultadoSync: !!window.ReinoSimpleResultadoSync,
      comparativo: !!window.ReinoResultadoComparativoCalculator,
      supabase: !!window.ReinoSupabaseIntegration,
    };

    console.log('📋 Modules available:', modules);

    if (!modules.appState || !modules.resultadoSync) {
      console.error('❌ Required modules not available');
      return;
    }

    // Step 2: Clear any existing state
    console.log('🧹 Clearing existing state...');

    // Clear existing allocations and selections manually
    const existingAssets = window.ReinoAppState.getSelectedAssets();
    existingAssets.forEach((assetKey) => {
      const [category, product] = assetKey.split(':');
      if (category && product) {
        window.ReinoAppState.removeSelectedAsset(category, product, 'flow-fix-test-cleanup');
      }
    });

    // Step 3: Set up test scenario
    console.log('🎯 Setting up test scenario...');

    // Set patrimony
    window.ReinoAppState.setPatrimonio(1000000, 'flow-fix-test');

    // Add asset selection
    window.ReinoAppState.addSelectedAsset('Renda Fixa', 'CDB', 'flow-fix-test');

    // Set allocation
    window.ReinoAppState.setAllocation('Renda Fixa', 'CDB', 500000, 'flow-fix-test');

    // Step 4: Check if resultado-sync recognizes the asset
    setTimeout(() => {
      console.log('🔍 Checking asset recognition...');

      const resultadoSync = window.ReinoSimpleResultadoSync;
      const isRecognized = resultadoSync.isAssetSelected('Renda Fixa', 'CDB');

      console.log('🎯 Asset recognition result:', isRecognized);

      if (!isRecognized) {
        console.error('❌ Asset not recognized - key format issue persists');

        // Debug info
        console.log('🔍 Debug info:');
        console.log('- AppState selected assets:', window.ReinoAppState.getSelectedAssets());
        console.log('- ResultadoSync selected assets:', Array.from(resultadoSync.selectedAssets));
        console.log('- AppState allocations:', window.ReinoAppState.getAllAllocations());

        return;
      }

      console.log('✅ Asset recognized correctly');

      // Step 5: Check if hasSelectedAssetsWithValue works
      const hasAssetsWithValue = resultadoSync.hasSelectedAssetsWithValue();
      console.log('💰 Has assets with value:', hasAssetsWithValue);

      if (!hasAssetsWithValue) {
        console.error('❌ hasSelectedAssetsWithValue returned false');

        // Check DOM elements
        const patrimonioItems = document.querySelectorAll(
          '.patrimonio_interactive_item[ativo-category="Renda Fixa"][ativo-product="CDB"]'
        );
        console.log('🖥️ Found patrimonio items:', patrimonioItems.length);

        if (patrimonioItems.length > 0) {
          const item = patrimonioItems[0];
          const input = item.querySelector('.currency-input.individual');
          console.log('💰 Input element found:', !!input);
          if (input) {
            console.log('💰 Input value:', input.value);
          }
        }

        return;
      }

      console.log('✅ hasSelectedAssetsWithValue working correctly');

      // Step 6: Force sync and check for commission calculation
      console.log('🔄 Forcing sync...');

      let eventReceived = false;
      const eventHandler = (e) => {
        eventReceived = true;
        console.log('📡 totalComissaoChanged event received:', {
          total: e.detail.total,
          source: e.detail.source,
          details: e.detail.details?.length || 0,
        });
      };

      document.addEventListener('totalComissaoChanged', eventHandler);

      resultadoSync.forceSync();

      // Step 7: Check results after a delay
      setTimeout(() => {
        document.removeEventListener('totalComissaoChanged', eventHandler);

        console.log('📊 Final results:');
        console.log('- Event received:', eventReceived);

        // Check DOM
        const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
        const tradicionalValue = tradicionalElement ? tradicionalElement.textContent : 'NOT_FOUND';
        console.log('- DOM tradicional value:', tradicionalValue);

        // Check Supabase
        const supabaseCommission =
          window.ReinoSupabaseIntegration?.lastCommissionData?.total || null;
        console.log('- Supabase commission:', supabaseCommission);

        // Check AppState
        const appStateCommission = window.ReinoAppState.getCommissionResults();
        console.log('- AppState commission:', appStateCommission);

        if (eventReceived && tradicionalValue !== '0,00' && tradicionalValue !== 'NOT_FOUND') {
          console.log('🎉 SUCCESS: Commission flow is working correctly!');
        } else {
          console.error('❌ FAILURE: Commission flow still has issues');

          // Additional debugging
          console.log('🔍 Additional debugging:');
          console.log('- updateProducts called?', 'Check resultado-sync logs');
          console.log('- calculateComissao working?', 'Test individual calculation');

          // Test individual calculation
          try {
            const testCommission = resultadoSync.calculateCommissionForValue(
              500000,
              'Renda Fixa',
              'CDB'
            );
            console.log('- Individual calculation test:', testCommission);
          } catch (error) {
            console.log('- Individual calculation error:', error.message);
          }
        }
      }, 500);
    }, 200);
  }

  // Global function
  window.testCommissionFlowFix = testCommissionFlowFix;

  console.log('🔧 Commission Flow Fix Test loaded. Run with: testCommissionFlowFix()');
})();
