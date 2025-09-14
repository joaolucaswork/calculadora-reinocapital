/**
 * calcularCustoProduto Debug Test
 * Testa se a função calcularCustoProduto está considerando o índice de giro
 * Versão sem imports/exports para uso direto no Webflow
 */

(function() {
  'use strict';

  function debugCalcularCusto() {
    console.log('🔍 DEBUG: calcularCustoProduto Function');
    console.log('======================================');

    // Check if function exists
    if (!window.calcularCustoProduto) {
      console.error('❌ calcularCustoProduto function not found');
      return;
    }

    console.log('✅ calcularCustoProduto function found');

    // Check rotation controller
    if (!window.ReinoRotationIndexController) {
      console.error('❌ ReinoRotationIndexController not found');
      return;
    }

    console.log('✅ ReinoRotationIndexController found');

    // Check rotation integration
    const hasIntegration = !!window.ReinoRotationIndexIntegration;
    const integrationInitialized = window.ReinoRotationIndexIntegration?.isInitialized;
    
    console.log(`Integration available: ${hasIntegration ? '✅' : '❌'}`);
    console.log(`Integration initialized: ${integrationInitialized ? '✅' : '❌'}`);

    // Test parameters
    const testValue = 500000; // R$ 500.000
    const testCategory = 'Renda Fixa';
    const testProduct = 'CDB';

    console.log(`\nTest parameters: ${testCategory}:${testProduct} = R$ ${testValue.toLocaleString()}`);

    // Test with different rotation indices
    console.log('\n🧮 Testing calcularCustoProduto with different rotation indices:');
    
    const rotationController = window.ReinoRotationIndexController;
    const results = {};

    [1, 2, 3, 4].forEach(index => {
      console.log(`\n--- Testing with rotation index ${index} ---`);
      
      // Set rotation index
      rotationController.setIndex(index);
      const currentIndex = rotationController.getCurrentIndex();
      console.log(`Current rotation index: ${currentIndex}`);

      // Get rotation calculation directly from controller
      const productKey = `${testCategory}:${testProduct}`;
      const rotationCalc = rotationController.getProductCalculation(productKey);
      
      if (rotationCalc) {
        console.log('Rotation calculation:', {
          comissaoRate: rotationCalc.comissaoRate,
          comissaoPercent: rotationCalc.comissaoPercent,
          fatorEfetivo: rotationCalc.fatorEfetivo
        });
        
        const expectedCost = testValue * rotationCalc.comissaoRate;
        console.log(`Expected cost with rotation: R$ ${expectedCost.toLocaleString()}`);
      } else {
        console.log('❌ No rotation calculation found for this product');
      }

      // Test calcularCustoProduto
      try {
        const resultado = window.calcularCustoProduto(testValue, testCategory, testProduct);
        results[index] = resultado;
        
        console.log('calcularCustoProduto result:', {
          custoMedio: resultado.custoMedio,
          custoRotacao: resultado.custoRotacao,
          indiceGiro: resultado.indiceGiro,
          comissaoRate: resultado.comissaoRate,
          hasRotationData: !!(resultado.custoRotacao || resultado.indiceGiro || resultado.comissaoRate)
        });
        
      } catch (error) {
        console.error(`❌ Error calling calcularCustoProduto: ${error.message}`);
        results[index] = { error: error.message };
      }
    });

    // Analysis
    console.log('\n📊 Analysis:');
    console.log('============');

    const validResults = Object.entries(results).filter(([_, r]) => !r.error);
    
    if (validResults.length === 0) {
      console.log('❌ No valid results obtained');
      return;
    }

    // Check if values change
    const custoMedioValues = validResults.map(([_, r]) => r.custoMedio);
    const allSame = custoMedioValues.every(val => val === custoMedioValues[0]);
    
    console.log(`Values change with rotation index: ${!allSame ? '✅' : '❌'}`);
    
    if (allSame) {
      console.log(`⚠️ All custoMedio values are the same: R$ ${custoMedioValues[0]?.toLocaleString()}`);
      console.log('This indicates the rotation integration is NOT working');
    } else {
      console.log('✅ custoMedio values change - rotation integration is working');
      validResults.forEach(([index, result]) => {
        console.log(`  Index ${index}: R$ ${result.custoMedio?.toLocaleString()}`);
      });
    }

    // Check for rotation properties
    const hasRotationProps = validResults.some(([_, r]) => r.custoRotacao || r.indiceGiro || r.comissaoRate);
    console.log(`Rotation properties present: ${hasRotationProps ? '✅' : '❌'}`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (allSame && !hasRotationProps) {
      console.log('1. The rotation integration is not working');
      console.log('2. Check if ReinoRotationIndexIntegration is properly initialized');
      console.log('3. Verify that calcularCustoProduto is being replaced by the enhanced function');
      console.log('4. Check the console for rotation integration initialization messages');
    } else if (allSame && hasRotationProps) {
      console.log('1. Rotation data is present but values don\'t change');
      console.log('2. Check the rotation calculation logic');
    } else {
      console.log('1. Rotation integration appears to be working correctly');
    }

    // Reset to index 2
    rotationController.setIndex(2);
  }

  // Make function globally available
  window.debugCalcularCusto = debugCalcularCusto;

  console.log('✅ calcularCustoProduto Debug Test loaded. Call debugCalcularCusto() to run.');

})();
