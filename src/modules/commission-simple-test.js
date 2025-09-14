/**
 * Commission Simple Test
 * Teste simples para verificar se o fluxo de comissão está funcionando
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  function simpleCommissionTest() {
    console.log('🧪 Running simple commission test...');

    // Check modules
    const modules = {
      appState: !!window.ReinoAppState,
      resultadoSync: !!window.ReinoSimpleResultadoSync,
      comparativo: !!window.ReinoResultadoComparativoCalculator,
      supabase: !!window.ReinoSupabaseIntegration
    };

    console.log('📋 Modules:', modules);

    if (!modules.appState || !modules.resultadoSync) {
      console.error('❌ Required modules missing');
      return;
    }

    // Test asset recognition
    console.log('🎯 Testing asset recognition...');
    
    const appState = window.ReinoAppState;
    const resultadoSync = window.ReinoSimpleResultadoSync;

    // Add a test asset
    appState.addSelectedAsset('Renda Fixa', 'CDB', 'simple-test');
    appState.setAllocation('Renda Fixa', 'CDB', 100000, 'simple-test');

    setTimeout(() => {
      // Test if resultado-sync recognizes it
      const isRecognized = resultadoSync.isAssetSelected('Renda Fixa', 'CDB');
      console.log('✅ Asset recognized:', isRecognized);

      if (!isRecognized) {
        console.error('❌ Asset recognition failed');
        
        // Debug info
        console.log('🔍 Debug:');
        console.log('- AppState assets:', appState.getSelectedAssets());
        console.log('- ResultadoSync assets:', Array.from(resultadoSync.selectedAssets));
        console.log('- AppState allocations:', appState.getAllAllocations());
        
        return;
      }

      // Test hasSelectedAssetsWithValue
      const hasValue = resultadoSync.hasSelectedAssetsWithValue();
      console.log('💰 Has assets with value:', hasValue);

      if (!hasValue) {
        console.error('❌ hasSelectedAssetsWithValue failed');
        return;
      }

      // Listen for commission event
      let eventReceived = false;
      const handler = (e) => {
        eventReceived = true;
        console.log('📡 Commission event received:', e.detail.total);
      };

      document.addEventListener('totalComissaoChanged', handler);

      // Force calculation
      console.log('🔄 Forcing calculation...');
      resultadoSync.forceSync();

      setTimeout(() => {
        document.removeEventListener('totalComissaoChanged', handler);
        
        if (eventReceived) {
          console.log('🎉 SUCCESS: Commission flow working!');
        } else {
          console.error('❌ FAILURE: No commission event received');
        }

        // Check final state
        const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
        const tradicionalValue = tradicionalElement ? tradicionalElement.textContent : 'NOT_FOUND';
        console.log('🖥️ DOM tradicional value:', tradicionalValue);

        const supabaseCommission = window.ReinoSupabaseIntegration?.lastCommissionData?.total || null;
        console.log('📊 Supabase commission:', supabaseCommission);

      }, 300);
    }, 100);
  }

  function debugAssetKeys() {
    console.log('🔍 Debugging asset keys...');
    
    if (!window.ReinoAppState || !window.ReinoSimpleResultadoSync) {
      console.error('❌ Required modules not available');
      return;
    }

    const appState = window.ReinoAppState;
    const resultadoSync = window.ReinoSimpleResultadoSync;

    console.log('📊 AppState selected assets:', appState.getSelectedAssets());
    console.log('📊 ResultadoSync selected assets:', Array.from(resultadoSync.selectedAssets));
    console.log('📊 AppState allocations:', appState.getAllAllocations());

    // Test key normalization
    const testCategory = 'Renda Fixa';
    const testProduct = 'CDB';
    
    console.log('🔑 Key normalization test:');
    console.log('- AppState format:', `${testCategory}:${testProduct}`);
    console.log('- Legacy format:', `${testCategory.toLowerCase().trim()}|${testProduct.toLowerCase().trim()}`);
    
    // Test if AppState recognizes
    const appStateRecognizes = appState.isAssetSelected(testCategory, testProduct);
    console.log('- AppState recognizes:', appStateRecognizes);
    
    // Test if ResultadoSync recognizes
    const resultadoSyncRecognizes = resultadoSync.isAssetSelected(testCategory, testProduct);
    console.log('- ResultadoSync recognizes:', resultadoSyncRecognizes);
  }

  function testCommissionCalculation() {
    console.log('🧮 Testing commission calculation...');
    
    if (!window.ReinoSimpleResultadoSync) {
      console.error('❌ ResultadoSync not available');
      return;
    }

    const resultadoSync = window.ReinoSimpleResultadoSync;
    
    try {
      const testValue = 500000;
      const testCategory = 'Renda Fixa';
      const testProduct = 'CDB';
      
      const commission = resultadoSync.calculateCommissionForValue(testValue, testCategory, testProduct);
      console.log(`💰 Commission for ${testValue} in ${testCategory}:${testProduct}:`, commission);
      
      if (commission > 0) {
        console.log('✅ Commission calculation working');
      } else {
        console.log('⚠️ Commission calculation returned 0');
      }
    } catch (error) {
      console.error('❌ Commission calculation failed:', error.message);
    }
  }

  // Global functions
  window.simpleCommissionTest = simpleCommissionTest;
  window.debugAssetKeys = debugAssetKeys;
  window.testCommissionCalculation = testCommissionCalculation;

  console.log('🔧 Simple Commission Test loaded.');
  console.log('🔧 Available functions:');
  console.log('  - simpleCommissionTest()');
  console.log('  - debugAssetKeys()');
  console.log('  - testCommissionCalculation()');

})();
