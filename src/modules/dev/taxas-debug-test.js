/**
 * Taxas Debug Test
 * Debug específico para entender o problema com taxas-tradicional.js
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  function debugTaxasTradicional() {
    console.log('🔍 Debugging taxas-tradicional.js...');

    // Check if the function exists
    if (typeof window.calcularCustoProduto !== 'function') {
      console.error('❌ calcularCustoProduto function not found');
      console.log(
        'Available global functions:',
        Object.keys(window).filter((key) => key.includes('calcular'))
      );
      return;
    }

    console.log('✅ calcularCustoProduto function found');

    // Test with different formats
    const testCases = [
      { value: 100000, category: 'Renda Fixa', product: 'CDB' },
      { value: 100000, category: 'renda fixa', product: 'cdb' },
      { value: 100000, category: 'RENDA FIXA', product: 'CDB' },
      { value: 100000, category: 'Renda Variável', product: 'Ações' },
      { value: 100000, category: 'renda variável', product: 'ações' },
    ];

    console.log('🧮 Testing calcularCustoProduto with different formats:');

    testCases.forEach((testCase, index) => {
      try {
        console.log(`\n${index + 1}. Testing: ${testCase.category} - ${testCase.product}`);

        const result = window.calcularCustoProduto(
          testCase.value,
          testCase.category,
          testCase.product
        );

        console.log('   Result:', result);
        console.log('   custoMedio:', result?.custoMedio || 'undefined');

        if (result && result.custoMedio > 0) {
          console.log('   ✅ SUCCESS - Commission calculated');
        } else {
          console.log('   ❌ FAILED - No commission calculated');
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
      }
    });
  }

  function debugObterTaxaPorAtributos() {
    console.log('🔍 Debugging obterTaxaPorAtributos...');

    if (typeof window.obterTaxaPorAtributos !== 'function') {
      console.error('❌ obterTaxaPorAtributos function not found');
      return;
    }

    console.log('✅ obterTaxaPorAtributos function found');

    // Test with current format that's failing
    const failingCases = [
      'renda fixa:cdb',
      'renda variável:ações e ativos',
      'outros:poupança',
      'coe:coe',
    ];

    console.log('🧮 Testing obterTaxaPorAtributos with failing formats:');

    failingCases.forEach((assetKey, index) => {
      try {
        console.log(`\n${index + 1}. Testing: ${assetKey}`);

        const result = window.obterTaxaPorAtributos(assetKey);

        console.log('   Result:', result);

        if (result) {
          console.log('   ✅ SUCCESS - Taxa found');
        } else {
          console.log('   ❌ FAILED - Taxa not found');
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
      }
    });

    // Test with potential correct formats
    console.log('\n🧮 Testing with potential correct formats:');

    const potentialFormats = [
      'Renda Fixa|CDB',
      'renda-fixa|cdb',
      'RENDA_FIXA|CDB',
      'rendaFixa|cdb',
      'Renda Fixa - CDB',
      'CDB',
      'Renda Fixa',
    ];

    potentialFormats.forEach((format, index) => {
      try {
        console.log(`\n${index + 1}. Testing format: ${format}`);

        const result = window.obterTaxaPorAtributos(format);

        if (result) {
          console.log('   ✅ SUCCESS - Taxa found:', result);
        } else {
          console.log('   ❌ FAILED - Taxa not found');
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
      }
    });
  }

  function listAvailableTaxas() {
    console.log('📋 Listing available taxas...');

    // Try to access the taxas data structure
    const possibleTaxasVariables = [
      'taxasTradicional',
      'taxas',
      'TAXAS_TRADICIONAL',
      'taxasData',
      'taxasProdutos',
    ];

    possibleTaxasVariables.forEach((varName) => {
      if (window[varName]) {
        console.log(`✅ Found taxas variable: ${varName}`);
        console.log('   Data:', window[varName]);

        if (typeof window[varName] === 'object') {
          console.log('   Keys:', Object.keys(window[varName]));
        }
      }
    });

    // Check if there's a way to list all available taxas
    if (typeof window.listarTaxasDisponiveis === 'function') {
      console.log('📋 Available taxas from listarTaxasDisponiveis:');
      try {
        const availableTaxas = window.listarTaxasDisponiveis();
        console.log(availableTaxas);
      } catch (error) {
        console.log('❌ Error listing taxas:', error.message);
      }
    }
  }

  function testCommissionCalculationFix() {
    console.log('🔧 Testing commission calculation fix...');

    if (!window.ReinoSimpleResultadoSync) {
      console.error('❌ ResultadoSync not available');
      return;
    }

    const resultadoSync = window.ReinoSimpleResultadoSync;

    // Test the calculateCommissionForValue method directly
    const testCases = [
      { value: 100000, category: 'Renda Fixa', product: 'CDB' },
      { value: 200000, category: 'Renda Variável', product: 'Ações' },
      { value: 50000, category: 'COE', product: 'COE' },
    ];

    console.log('🧮 Testing ResultadoSync.calculateCommissionForValue:');

    testCases.forEach((testCase, index) => {
      try {
        console.log(
          `\n${index + 1}. Testing: ${testCase.category} - ${testCase.product} - R$ ${testCase.value.toLocaleString()}`
        );

        const commission = resultadoSync.calculateCommissionForValue(
          testCase.value,
          testCase.category,
          testCase.product
        );

        console.log('   Commission calculated:', commission);

        if (commission > 0) {
          console.log('   ✅ SUCCESS - Commission > 0');
        } else {
          console.log('   ❌ FAILED - Commission = 0');
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
      }
    });
  }

  function analyzeCommissionFlow() {
    console.log('🔍 Analyzing complete commission flow...');

    console.log('\n1. Checking global functions:');
    console.log('   calcularCustoProduto:', typeof window.calcularCustoProduto);
    console.log('   obterTaxaPorAtributos:', typeof window.obterTaxaPorAtributos);
    console.log('   calcularCustoReino:', typeof window.calcularCustoReino);

    console.log('\n2. Checking AppState data:');
    if (window.ReinoAppState) {
      const allocations = window.ReinoAppState.getAllAllocations();
      console.log('   Allocations:', allocations);
      console.log('   Selected assets:', window.ReinoAppState.getSelectedAssets());
    }

    console.log('\n3. Checking ResultadoSync state:');
    if (window.ReinoSimpleResultadoSync) {
      const sync = window.ReinoSimpleResultadoSync;
      console.log('   Selected assets:', Array.from(sync.selectedAssets || []));
      console.log('   Has assets with value:', sync.hasSelectedAssetsWithValue());
    }

    console.log('\n4. Testing commission calculation chain:');
    if (window.ReinoAppState && window.ReinoSimpleResultadoSync) {
      const allocations = window.ReinoAppState.getAllAllocations();

      Object.entries(allocations).forEach(([key, value]) => {
        if (value > 0) {
          const [category, product] = key.split(':');
          console.log(`\n   Testing: ${key} = R$ ${value.toLocaleString()}`);

          try {
            const commission = window.ReinoSimpleResultadoSync.calculateCommissionForValue(
              value,
              category,
              product
            );
            console.log(`   Commission: ${commission}`);
          } catch (error) {
            console.log(`   Error: ${error.message}`);
          }
        }
      });
    }
  }

  // Global functions
  window.debugTaxasTradicional = debugTaxasTradicional;
  window.debugObterTaxaPorAtributos = debugObterTaxaPorAtributos;
  window.listAvailableTaxas = listAvailableTaxas;
  window.testCommissionCalculationFix = testCommissionCalculationFix;
  window.analyzeCommissionFlow = analyzeCommissionFlow;

  console.log('🔧 Taxas Debug Test loaded.');
  console.log('🔧 Available functions:');
  console.log('  - debugTaxasTradicional()');
  console.log('  - debugObterTaxaPorAtributos()');
  console.log('  - listAvailableTaxas()');
  console.log('  - testCommissionCalculationFix()');
  console.log('  - analyzeCommissionFlow()');
})();
