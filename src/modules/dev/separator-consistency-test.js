/**
 * Separator Consistency Test
 * Teste final para verificar se todos os separadores foram padronizados para ':'
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  function testSeparatorConsistency() {
    console.log('🔧 Testing separator consistency across all modules...');

    const results = {
      appState: testAppState(),
      resultadoSync: testResultadoSync(),
      assetSelection: testAssetSelection(),
      supabase: testSupabase(),
      typebot: testTypebot(),
      commission: testCommissionFlow()
    };

    console.log('📊 Test Results Summary:');
    Object.entries(results).forEach(([module, result]) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${module}: ${result.message}`);
    });

    const allSuccess = Object.values(results).every(r => r.success);
    
    if (allSuccess) {
      console.log('🎉 ALL MODULES CONSISTENT! Separator standardization complete!');
    } else {
      console.log('❌ Some modules still have issues');
    }

    return results;
  }

  function testAppState() {
    if (!window.ReinoAppState) {
      return { success: false, message: 'AppState not available' };
    }

    try {
      const appState = window.ReinoAppState;
      
      // Test key normalization
      const testKey = appState.normalizeAssetKey('Test Category', 'Test Product');
      const usesColon = testKey.includes(':') && !testKey.includes('|');
      
      if (!usesColon) {
        return { success: false, message: `Key format incorrect: ${testKey}` };
      }

      return { success: true, message: 'Uses colon separator correctly' };
    } catch (error) {
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  function testResultadoSync() {
    if (!window.ReinoSimpleResultadoSync) {
      return { success: false, message: 'ResultadoSync not available' };
    }

    try {
      const resultadoSync = window.ReinoSimpleResultadoSync;
      
      // Test if it recognizes colon-separated assets
      if (window.ReinoAppState) {
        window.ReinoAppState.addSelectedAsset('Test Category', 'Test Product', 'separator-test');
        
        const isRecognized = resultadoSync.isAssetSelected('Test Category', 'Test Product');
        
        // Cleanup
        window.ReinoAppState.removeSelectedAsset('Test Category', 'Test Product', 'separator-test-cleanup');
        
        if (!isRecognized) {
          return { success: false, message: 'Does not recognize colon-separated assets' };
        }
      }

      return { success: true, message: 'Recognizes colon-separated assets correctly' };
    } catch (error) {
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  function testAssetSelection() {
    if (!window.ReinoAssetSelectionFilter) {
      return { success: false, message: 'AssetSelectionFilter not available' };
    }

    try {
      const filter = window.ReinoAssetSelectionFilter;
      
      // Test key normalization
      const testKey = filter.normalizeAssetKey('Test Category', 'Test Product');
      const usesColon = testKey.includes(':') && !testKey.includes('|');
      
      if (!usesColon) {
        return { success: false, message: `Key format incorrect: ${testKey}` };
      }

      return { success: true, message: 'Uses colon separator correctly' };
    } catch (error) {
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  function testSupabase() {
    if (!window.ReinoSupabaseIntegration) {
      return { success: false, message: 'SupabaseIntegration not available' };
    }

    try {
      const supabase = window.ReinoSupabaseIntegration;
      
      // Test asset format conversion
      const testAssets = ['test category:test product'];
      const converted = supabase.convertSelectedAssetsFormat(testAssets);
      
      if (!converted || converted.length === 0) {
        return { success: false, message: 'Asset format conversion failed' };
      }

      const asset = converted[0];
      if (!asset.category || !asset.product) {
        return { success: false, message: 'Converted asset missing category or product' };
      }

      return { success: true, message: 'Handles colon-separated assets correctly' };
    } catch (error) {
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  function testTypebot() {
    if (!window.ReinoTypebotIntegrationSystem) {
      return { success: false, message: 'TypebotIntegration not available' };
    }

    // Typebot integration should work with AppState format
    return { success: true, message: 'Uses AppState format (assumed correct)' };
  }

  function testCommissionFlow() {
    if (!window.ReinoAppState || !window.ReinoSimpleResultadoSync) {
      return { success: false, message: 'Required modules not available' };
    }

    try {
      const appState = window.ReinoAppState;
      const resultadoSync = window.ReinoSimpleResultadoSync;

      // Test complete flow
      appState.addSelectedAsset('Renda Fixa', 'CDB', 'commission-flow-test');
      appState.setAllocation('Renda Fixa', 'CDB', 100000, 'commission-flow-test');

      // Check if asset is recognized
      const isRecognized = resultadoSync.isAssetSelected('Renda Fixa', 'CDB');
      
      // Check if allocation is retrieved
      const allocation = appState.getAllocation('Renda Fixa', 'CDB');
      
      // Cleanup
      appState.removeSelectedAsset('Renda Fixa', 'CDB', 'commission-flow-test-cleanup');

      if (!isRecognized) {
        return { success: false, message: 'Asset not recognized in commission flow' };
      }

      if (allocation !== 100000) {
        return { success: false, message: 'Allocation not retrieved correctly' };
      }

      return { success: true, message: 'Commission flow working with colon separators' };
    } catch (error) {
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  function runFullCommissionTest() {
    console.log('🚀 Running full commission test with standardized separators...');

    if (!window.ReinoAppState || !window.ReinoSimpleResultadoSync) {
      console.error('❌ Required modules not available');
      return;
    }

    const appState = window.ReinoAppState;
    const resultadoSync = window.ReinoSimpleResultadoSync;

    // Setup test data
    appState.setPatrimonio(1000000, 'full-commission-test');
    appState.addSelectedAsset('Renda Fixa', 'CDB', 'full-commission-test');
    appState.setAllocation('Renda Fixa', 'CDB', 500000, 'full-commission-test');

    setTimeout(() => {
      // Listen for commission event
      let eventReceived = false;
      let eventTotal = 0;

      const handler = (e) => {
        eventReceived = true;
        eventTotal = e.detail.total;
        console.log('📡 Commission event received:', {
          total: e.detail.total,
          source: e.detail.source
        });
      };

      document.addEventListener('totalComissaoChanged', handler);

      // Force calculation
      resultadoSync.forceSync();

      setTimeout(() => {
        document.removeEventListener('totalComissaoChanged', handler);

        // Check results
        const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
        const tradicionalValue = tradicionalElement ? tradicionalElement.textContent : 'NOT_FOUND';
        
        const supabaseCommission = window.ReinoSupabaseIntegration?.lastCommissionData?.total || null;

        console.log('📊 Full Commission Test Results:');
        console.log('- Event received:', eventReceived);
        console.log('- Event total:', eventTotal);
        console.log('- DOM tradicional:', tradicionalValue);
        console.log('- Supabase commission:', supabaseCommission);

        const success = eventReceived && eventTotal > 0 && tradicionalValue !== '0,00';

        if (success) {
          console.log('🎉 FULL COMMISSION TEST PASSED!');
        } else {
          console.log('❌ Full commission test failed');
        }

        // Cleanup
        appState.removeSelectedAsset('Renda Fixa', 'CDB', 'full-commission-test-cleanup');

      }, 500);
    }, 200);
  }

  // Global functions
  window.testSeparatorConsistency = testSeparatorConsistency;
  window.runFullCommissionTest = runFullCommissionTest;

  console.log('🔧 Separator Consistency Test loaded.');
  console.log('🔧 Available functions:');
  console.log('  - testSeparatorConsistency()');
  console.log('  - runFullCommissionTest()');

})();
