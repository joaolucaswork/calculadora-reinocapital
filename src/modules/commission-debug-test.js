/**
 * Commission Debug Test
 * Debug específico para entender por que a comissão está sendo calculada como 0
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  function debugCommissionCalculation() {
    console.log('🔍 Debugging commission calculation...');

    if (!window.ReinoSimpleResultadoSync) {
      console.error('❌ ResultadoSync not available');
      return;
    }

    const resultadoSync = window.ReinoSimpleResultadoSync;
    
    // Test parameters
    const testValue = 100000;
    const testCategory = 'Renda Fixa';
    const testProduct = 'CDB';

    console.log('🧮 Testing commission calculation with:');
    console.log(`- Value: ${testValue}`);
    console.log(`- Category: ${testCategory}`);
    console.log(`- Product: ${testProduct}`);

    // Check if calculateCommissionForValue method exists
    if (typeof resultadoSync.calculateCommissionForValue !== 'function') {
      console.error('❌ calculateCommissionForValue method not found');
      console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(resultadoSync)));
      return;
    }

    try {
      const commission = resultadoSync.calculateCommissionForValue(testValue, testCategory, testProduct);
      console.log(`💰 Calculated commission: ${commission}`);

      if (commission === 0) {
        console.log('⚠️ Commission is 0 - investigating why...');
        
        // Check if calcularCustoProduto function exists
        if (typeof window.calcularCustoProduto === 'function') {
          console.log('✅ calcularCustoProduto function found');
          
          try {
            const custoResult = window.calcularCustoProduto(testValue, testCategory, testProduct);
            console.log('🧮 calcularCustoProduto result:', custoResult);
          } catch (error) {
            console.error('❌ calcularCustoProduto error:', error.message);
          }
        } else {
          console.error('❌ calcularCustoProduto function not found');
          console.log('Available global functions:', Object.keys(window).filter(key => key.includes('calcular')));
        }

        // Check rotation index
        if (window.ReinoRotationIndexController) {
          const rotationIndex = window.ReinoRotationIndexController.getCurrentIndex();
          console.log('🔄 Current rotation index:', rotationIndex);
        } else {
          console.log('⚠️ ReinoRotationIndexController not found');
        }

        // Check if there are DOM elements for this product
        const patrimonioItem = document.querySelector(
          `.patrimonio_interactive_item[ativo-category="${testCategory}"][ativo-product="${testProduct}"]`
        );
        console.log('🖥️ Patrimonio item found:', !!patrimonioItem);

        if (patrimonioItem) {
          const input = patrimonioItem.querySelector('.currency-input.individual');
          console.log('💰 Input element found:', !!input);
          if (input) {
            console.log('💰 Input value:', input.value);
          }
        }

      } else {
        console.log('✅ Commission calculation working correctly');
      }

    } catch (error) {
      console.error('❌ Commission calculation failed:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }

  function debugResultadoSyncState() {
    console.log('🔍 Debugging ResultadoSync state...');

    if (!window.ReinoSimpleResultadoSync) {
      console.error('❌ ResultadoSync not available');
      return;
    }

    const resultadoSync = window.ReinoSimpleResultadoSync;

    console.log('📊 ResultadoSync state:');
    console.log('- isInitialized:', resultadoSync.isInitialized);
    console.log('- hasAppState:', !!resultadoSync.appState);
    console.log('- selectedAssets:', Array.from(resultadoSync.selectedAssets || []));
    console.log('- debugMode:', resultadoSync.debugMode);

    // Check DOM elements
    const resultadoItems = document.querySelectorAll('.resultado-produto-item');
    console.log('🖥️ Found resultado-produto-item elements:', resultadoItems.length);

    resultadoItems.forEach((item, index) => {
      const category = item.getAttribute('ativo-category');
      const product = item.getAttribute('ativo-product');
      const isVisible = item.style.display !== 'none';
      
      console.log(`  ${index + 1}. ${category}:${product} - visible: ${isVisible}`);
    });

    // Check if hasSelectedAssetsWithValue works
    const hasValue = resultadoSync.hasSelectedAssetsWithValue();
    console.log('💰 hasSelectedAssetsWithValue:', hasValue);

    // Check AppState data
    if (window.ReinoAppState) {
      console.log('📊 AppState data:');
      console.log('- Selected assets:', window.ReinoAppState.getSelectedAssets());
      console.log('- Allocations:', window.ReinoAppState.getAllAllocations());
      console.log('- Commission results:', window.ReinoAppState.getCommissionResults());
    }
  }

  function forceCommissionRecalculation() {
    console.log('🔄 Forcing commission recalculation...');

    if (!window.ReinoSimpleResultadoSync) {
      console.error('❌ ResultadoSync not available');
      return;
    }

    const resultadoSync = window.ReinoSimpleResultadoSync;

    // Enable debug mode
    resultadoSync.debugMode = true;
    console.log('🐛 Debug mode enabled');

    // Listen for events
    let eventCount = 0;
    const handler = (e) => {
      eventCount++;
      console.log(`📡 Event ${eventCount}: totalComissaoChanged`, {
        total: e.detail.total,
        source: e.detail.source,
        details: e.detail.details?.length || 0
      });
    };

    document.addEventListener('totalComissaoChanged', handler);

    // Force sync
    resultadoSync.forceSync();

    setTimeout(() => {
      document.removeEventListener('totalComissaoChanged', handler);
      console.log(`📊 Total events received: ${eventCount}`);
      
      // Disable debug mode
      resultadoSync.debugMode = false;
    }, 1000);
  }

  // Global functions
  window.debugCommissionCalculation = debugCommissionCalculation;
  window.debugResultadoSyncState = debugResultadoSyncState;
  window.forceCommissionRecalculation = forceCommissionRecalculation;

  console.log('🔧 Commission Debug Test loaded.');
  console.log('🔧 Available functions:');
  console.log('  - debugCommissionCalculation()');
  console.log('  - debugResultadoSyncState()');
  console.log('  - forceCommissionRecalculation()');

})();
