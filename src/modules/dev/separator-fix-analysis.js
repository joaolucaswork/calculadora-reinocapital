/**
 * Separator Fix Analysis
 * Analisa e corrige inconsistências entre separadores : e | no sistema
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  function analyzeSeparatorInconsistencies() {
    console.log('🔍 Analyzing separator inconsistencies...');

    const issues = [];

    // Check AppState
    if (window.ReinoAppState) {
      const appState = window.ReinoAppState;

      // Test key normalization
      const testKey = appState.normalizeAssetKey('Renda Fixa', 'CDB');
      console.log('📊 AppState normalizeAssetKey result:', testKey);

      if (testKey.includes('|')) {
        issues.push('AppState uses pipe (|) separator');
      } else if (testKey.includes(':')) {
        console.log('✅ AppState uses colon (:) separator');
      }

      // Check existing assets
      const existingAssets = appState.getSelectedAssets();
      console.log('📊 AppState existing assets:', existingAssets);

      existingAssets.forEach((asset) => {
        if (asset.includes('|')) {
          issues.push(`AppState has pipe-separated asset: ${asset}`);
        }
      });
    }

    // Check ResultadoSync
    if (window.ReinoSimpleResultadoSync) {
      const resultadoSync = window.ReinoSimpleResultadoSync;

      console.log(
        '📊 ResultadoSync selected assets:',
        Array.from(resultadoSync.selectedAssets || [])
      );

      // Check if it has legacy pipe format
      Array.from(resultadoSync.selectedAssets || []).forEach((asset) => {
        if (asset.includes('|')) {
          issues.push(`ResultadoSync has pipe-separated asset: ${asset}`);
        }
      });
    }

    // Check DOM elements for data attributes
    const patrimonioItems = document.querySelectorAll('.patrimonio_interactive_item');
    console.log('🖥️ Found patrimonio items:', patrimonioItems.length);

    patrimonioItems.forEach((item, index) => {
      const category = item.getAttribute('ativo-category');
      const product = item.getAttribute('ativo-product');

      if (category && product) {
        console.log(`  ${index + 1}. ${category}:${product}`);
      }
    });

    // Summary
    console.log('📋 Issues found:', issues);

    if (issues.length === 0) {
      console.log('✅ No separator inconsistencies found!');
    } else {
      console.log('❌ Separator inconsistencies detected:');
      issues.forEach((issue) => console.log(`  - ${issue}`));
    }

    return issues;
  }

  function fixSeparatorInconsistencies() {
    console.log('🔧 Attempting to fix separator inconsistencies...');

    if (!window.ReinoAppState) {
      console.error('❌ AppState not available');
      return;
    }

    const appState = window.ReinoAppState;

    // Get current assets with potential pipe separators
    const currentAssets = Array.from(appState.state.ativosSelecionados);
    const currentAllocations = new Map(appState.state.alocacoes);

    console.log('📊 Current assets:', currentAssets);
    console.log('📊 Current allocations:', Object.fromEntries(currentAllocations));

    // Find assets with pipe separators
    const pipeAssets = currentAssets.filter((asset) => asset.includes('|'));

    if (pipeAssets.length === 0) {
      console.log('✅ No pipe-separated assets found');
      return;
    }

    console.log('🔧 Converting pipe-separated assets to colon format...');

    pipeAssets.forEach((pipeAsset) => {
      const [category, product] = pipeAsset.split('|');
      const colonAsset = `${category}:${product}`;

      console.log(`  Converting: ${pipeAsset} → ${colonAsset}`);

      // Get allocation value
      const allocationValue = currentAllocations.get(pipeAsset) || 0;

      // Remove old format
      appState.state.ativosSelecionados.delete(pipeAsset);
      appState.state.alocacoes.delete(pipeAsset);

      // Add new format
      appState.state.ativosSelecionados.add(colonAsset);
      if (allocationValue > 0) {
        appState.state.alocacoes.set(colonAsset, allocationValue);
      }
    });

    // Update metadata
    appState.updateMetadata();

    console.log('✅ Conversion completed');
    console.log('📊 New assets:', Array.from(appState.state.ativosSelecionados));
    console.log('📊 New allocations:', Object.fromEntries(appState.state.alocacoes));

    // Dispatch update event
    appState.dispatchEvent('appStateChanged', {
      snapshot: appState.getStateSnapshot(),
      source: 'separator-fix',
    });
  }

  function testSeparatorConsistency() {
    console.log('🧪 Testing separator consistency...');

    if (!window.ReinoAppState || !window.ReinoSimpleResultadoSync) {
      console.error('❌ Required modules not available');
      return;
    }

    const appState = window.ReinoAppState;
    const resultadoSync = window.ReinoSimpleResultadoSync;

    // Clear existing test data
    const existingAssets = appState.getSelectedAssets();
    existingAssets.forEach((asset) => {
      if (asset.includes('test')) {
        const [category, product] = asset.split(':');
        if (category && product) {
          appState.removeSelectedAsset(category, product, 'separator-test-cleanup');
        }
      }
    });

    // Add test asset
    const testCategory = 'Test Category';
    const testProduct = 'Test Product';

    console.log('🎯 Adding test asset...');
    appState.addSelectedAsset(testCategory, testProduct, 'separator-test');
    appState.setAllocation(testCategory, testProduct, 100000, 'separator-test');

    setTimeout(() => {
      // Check AppState format
      const appStateAssets = appState.getSelectedAssets();
      const expectedKey = appState.normalizeAssetKey(testCategory, testProduct);

      console.log('📊 AppState assets:', appStateAssets);
      console.log('📊 Expected key:', expectedKey);
      console.log('📊 Key exists in AppState:', appStateAssets.includes(expectedKey));

      // Check ResultadoSync recognition
      const isRecognized = resultadoSync.isAssetSelected(testCategory, testProduct);
      console.log('📊 ResultadoSync recognizes asset:', isRecognized);

      // Check allocation retrieval
      const allocation = appState.getAllocation(testCategory, testProduct);
      console.log('📊 Allocation retrieved:', allocation);

      // Results
      const success = {
        keyInAppState: appStateAssets.includes(expectedKey),
        recognizedByResultadoSync: isRecognized,
        allocationRetrieved: allocation === 100000,
        usesColonSeparator: expectedKey.includes(':') && !expectedKey.includes('|'),
      };

      console.log('✅ Test results:', success);

      const allSuccess = Object.values(success).every(Boolean);

      if (allSuccess) {
        console.log('🎉 Separator consistency test PASSED!');
      } else {
        console.log('❌ Separator consistency test FAILED');
        Object.entries(success).forEach(([key, value]) => {
          if (!value) {
            console.log(`  - ${key}: FAILED`);
          }
        });
      }

      // Cleanup
      appState.removeSelectedAsset(testCategory, testProduct, 'separator-test-cleanup');
    }, 200);
  }

  // Global functions
  window.analyzeSeparatorInconsistencies = analyzeSeparatorInconsistencies;
  window.fixSeparatorInconsistencies = fixSeparatorInconsistencies;
  window.testSeparatorConsistency = testSeparatorConsistency;

  console.log('🔧 Separator Fix Analysis loaded.');
  console.log('🔧 Available functions:');
  console.log('  - analyzeSeparatorInconsistencies()');
  console.log('  - fixSeparatorInconsistencies()');
  console.log('  - testSeparatorConsistency()');
})();
