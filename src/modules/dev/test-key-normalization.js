/**
 * Test Key Normalization
 * Testa se a normalização de chaves está funcionando
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  function testKeyNormalization() {
    console.log('🔑 Testing Key Normalization...');
    console.log('==============================');

    if (!window.ReinoRotationIndexController) {
      console.error('❌ ReinoRotationIndexController not found');
      return;
    }

    const controller = window.ReinoRotationIndexController;

    // Test cases
    const testCases = [
      'renda fixa:cdb',
      'Renda Fixa:CDB',
      'RENDA FIXA:CDB',
      'renda fixa:CDB',
      'Renda Fixa:cdb',
    ];

    console.log('\n📋 Testing different key formats:');

    testCases.forEach((testKey) => {
      console.log(`\n--- Testing: "${testKey}" ---`);

      // Test normalization method if available
      if (typeof controller.normalizeProductKey === 'function') {
        const normalized = controller.normalizeProductKey(testKey);
        console.log(`   Normalized: "${normalized}"`);
      }

      // Test getProductCalculation
      const calculation = controller.getProductCalculation(testKey);
      console.log(`   Calculation found: ${!!calculation}`);

      if (calculation) {
        console.log(`   Commission rate: ${calculation.comissaoRate}`);
        console.log(`   Commission %: ${calculation.comissaoPercent}%`);
      }

      // Test getProductData
      const productData = controller.getProductData(testKey);
      console.log(`   Product data found: ${!!productData}`);
    });

    // Test with actual calculation
    console.log('\n🧮 Testing actual calculation:');

    const testValue = 500000;
    const testKey = 'renda fixa:cdb';

    console.log(`Testing calcularCustoProduto with "${testKey}"`);

    if (window.calcularCustoProduto) {
      const [category, product] = testKey.split(':');
      const resultado = window.calcularCustoProduto(testValue, category, product);

      console.log('Result:', {
        custoMedio: resultado.custoMedio,
        custoRotacao: resultado.custoRotacao,
        indiceGiro: resultado.indiceGiro,
        comissaoRate: resultado.comissaoRate,
        hasRotationData: !!(
          resultado.custoRotacao ||
          resultado.indiceGiro ||
          resultado.comissaoRate
        ),
      });

      if (resultado.custoMedio > 0) {
        console.log('✅ Calculation working!');
      } else {
        console.log('❌ Calculation returning 0');
      }
    }

    console.log('\n✅ Key normalization test complete!');
  }

  // Make function globally available
  window.testKeyNormalization = testKeyNormalization;

  console.log('✅ Key Normalization Test loaded. Call testKeyNormalization() to run.');
})();
