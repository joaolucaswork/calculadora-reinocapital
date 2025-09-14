/**
 * Commission Final Fix Test
 * Teste final para verificar se o problema das taxas foi resolvido
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  function testCommissionFinalFix() {
    console.log('🎯 Testing commission final fix...');

    // Test 1: Check if taxas functions are available
    console.log('\n1. 📋 Checking taxas functions:');
    console.log('   calcularCustoProduto:', typeof window.calcularCustoProduto);
    console.log('   obterTaxaPorAtributos:', typeof window.obterTaxaPorAtributos);

    if (typeof window.calcularCustoProduto !== 'function') {
      console.error('❌ calcularCustoProduto not available');
      return;
    }

    // Test 2: Test taxas with lowercase format
    console.log('\n2. 🧮 Testing taxas with lowercase format:');
    
    const testCases = [
      { category: 'renda fixa', product: 'cdb', value: 100000 },
      { category: 'renda variável', product: 'ações e ativos', value: 200000 },
      { category: 'coe', product: 'coe', value: 50000 },
      { category: 'outros', product: 'poupança', value: 30000 }
    ];

    let successCount = 0;

    testCases.forEach((testCase, index) => {
      try {
        console.log(`\n   ${index + 1}. Testing: ${testCase.category}:${testCase.product}`);
        
        const result = window.calcularCustoProduto(testCase.value, testCase.category, testCase.product);
        
        console.log('      Result:', {
          custoMedio: result.custoMedio,
          taxaMedia: result.taxaMedia,
          produto: result.produto
        });
        
        if (result.custoMedio > 0) {
          console.log('      ✅ SUCCESS - Commission calculated');
          successCount++;
        } else {
          console.log('      ❌ FAILED - No commission calculated');
        }
        
      } catch (error) {
        console.log(`      ❌ ERROR: ${error.message}`);
      }
    });

    console.log(`\n   📊 Taxas test results: ${successCount}/${testCases.length} successful`);

    // Test 3: Test complete commission flow
    console.log('\n3. 🔄 Testing complete commission flow:');

    if (!window.ReinoAppState || !window.ReinoSimpleResultadoSync) {
      console.error('❌ Required modules not available');
      return;
    }

    const appState = window.ReinoAppState;
    const resultadoSync = window.ReinoSimpleResultadoSync;

    // Setup test data
    appState.setPatrimonio(1000000, 'final-fix-test');
    appState.addSelectedAsset('Renda Fixa', 'CDB', 'final-fix-test');
    appState.setAllocation('Renda Fixa', 'CDB', 500000, 'final-fix-test');

    setTimeout(() => {
      // Check if asset is recognized
      const isRecognized = resultadoSync.isAssetSelected('Renda Fixa', 'CDB');
      console.log('   Asset recognized:', isRecognized);

      // Check if hasSelectedAssetsWithValue works
      const hasValue = resultadoSync.hasSelectedAssetsWithValue();
      console.log('   Has assets with value:', hasValue);

      // Listen for commission event
      let eventReceived = false;
      let eventTotal = 0;

      const handler = (e) => {
        eventReceived = true;
        eventTotal = e.detail.total;
        console.log('   📡 Commission event received:', {
          total: e.detail.total,
          source: e.detail.source,
          details: e.detail.details?.length || 0
        });
      };

      document.addEventListener('totalComissaoChanged', handler);

      // Force calculation
      console.log('   🔄 Forcing calculation...');
      resultadoSync.forceSync();

      setTimeout(() => {
        document.removeEventListener('totalComissaoChanged', handler);

        // Check final results
        console.log('\n4. 📊 Final Results:');
        console.log('   Event received:', eventReceived);
        console.log('   Event total:', eventTotal);

        // Check DOM
        const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
        const tradicionalValue = tradicionalElement ? tradicionalElement.textContent : 'NOT_FOUND';
        console.log('   DOM tradicional:', tradicionalValue);

        // Check Supabase
        const supabaseCommission = window.ReinoSupabaseIntegration?.lastCommissionData?.total || null;
        console.log('   Supabase commission:', supabaseCommission);

        // Check AppState
        const appStateCommission = window.ReinoAppState.getCommissionResults();
        console.log('   AppState commission:', appStateCommission);

        // Final assessment
        const success = {
          taxasWorking: successCount >= testCases.length / 2,
          eventReceived: eventReceived,
          eventHasValue: eventTotal > 0,
          domUpdated: tradicionalValue !== '0,00' && tradicionalValue !== 'NOT_FOUND',
          supabaseUpdated: supabaseCommission > 0
        };

        console.log('\n5. ✅ Success Assessment:');
        Object.entries(success).forEach(([key, value]) => {
          const status = value ? '✅' : '❌';
          console.log(`   ${status} ${key}: ${value}`);
        });

        const allSuccess = Object.values(success).every(Boolean);

        if (allSuccess) {
          console.log('\n🎉 🎉 🎉 COMMISSION SYSTEM FULLY WORKING! 🎉 🎉 🎉');
          console.log('✅ All problems have been resolved:');
          console.log('  - Separator consistency: FIXED');
          console.log('  - Taxas recognition: FIXED');
          console.log('  - Commission calculation: WORKING');
          console.log('  - DOM updates: WORKING');
          console.log('  - Supabase integration: WORKING');
        } else {
          console.log('\n❌ Some issues remain:');
          Object.entries(success).forEach(([key, value]) => {
            if (!value) {
              console.log(`  - ${key}: NEEDS ATTENTION`);
            }
          });
        }

        // Cleanup
        appState.removeSelectedAsset('Renda Fixa', 'CDB', 'final-fix-test-cleanup');

      }, 500);
    }, 200);
  }

  function quickTaxasTest() {
    console.log('⚡ Quick taxas test...');

    if (typeof window.calcularCustoProduto !== 'function') {
      console.error('❌ calcularCustoProduto not available');
      return;
    }

    // Test the most common failing cases
    const quickTests = [
      { category: 'renda fixa', product: 'cdb' },
      { category: 'renda variável', product: 'ações e ativos' },
      { category: 'coe', product: 'coe' }
    ];

    quickTests.forEach((test, index) => {
      try {
        const result = window.calcularCustoProduto(100000, test.category, test.product);
        const status = result.custoMedio > 0 ? '✅' : '❌';
        console.log(`${status} ${test.category}:${test.product} = ${result.custoMedio}`);
      } catch (error) {
        console.log(`❌ ${test.category}:${test.product} = ERROR: ${error.message}`);
      }
    });
  }

  // Global functions
  window.testCommissionFinalFix = testCommissionFinalFix;
  window.quickTaxasTest = quickTaxasTest;

  console.log('🔧 Commission Final Fix Test loaded.');
  console.log('🔧 Available functions:');
  console.log('  - testCommissionFinalFix() - Complete test');
  console.log('  - quickTaxasTest() - Quick taxas verification');

})();
