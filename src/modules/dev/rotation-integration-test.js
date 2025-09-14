/**
 * Rotation Integration Test
 * Testa se a integração do índice de giro com calcularCustoProduto está funcionando
 * Versão sem imports/exports para uso direto no Webflow
 */

(function() {
  'use strict';

  function testRotationIntegration() {
    console.log('🔄 Testing Rotation Integration...');
    console.log('==================================');

    // Check if modules are available
    const modules = {
      rotationController: window.ReinoRotationIndexController,
      rotationIntegration: window.ReinoRotationIndexIntegration,
      calcularCustoProduto: window.calcularCustoProduto
    };

    console.log('\n1. 📋 Module Availability:');
    Object.entries(modules).forEach(([name, module]) => {
      const available = !!module;
      const initialized = module?.isInitialized;
      console.log(`   ${available ? '✅' : '❌'} ${name}: ${available ? 'available' : 'missing'} ${initialized !== undefined ? `(${initialized ? 'initialized' : 'not initialized'})` : ''}`);
    });

    if (!modules.rotationController || !modules.calcularCustoProduto) {
      console.error('❌ Required modules missing. Cannot proceed.');
      return;
    }

    // Test calcularCustoProduto with different rotation indices
    console.log('\n2. 🧮 Testing calcularCustoProduto with rotation indices:');
    
    const testValue = 500000; // R$ 500.000
    const testCategory = 'Renda Fixa';
    const testProduct = 'CDB';

    console.log(`   Test parameters: ${testCategory}:${testProduct} = R$ ${testValue.toLocaleString()}`);

    // Test with different rotation indices
    const rotationIndices = [1, 2, 3, 4];
    const results = {};

    rotationIndices.forEach(index => {
      console.log(`\n   Testing with rotation index ${index}:`);
      
      // Set rotation index
      modules.rotationController.setIndex(index);
      
      // Wait a bit for the change to propagate
      setTimeout(() => {
        const currentIndex = modules.rotationController.getCurrentIndex();
        console.log(`     Current rotation index: ${currentIndex}`);
        
        // Test calcularCustoProduto
        try {
          const resultado = modules.calcularCustoProduto(testValue, testCategory, testProduct);
          results[index] = resultado;
          
          console.log(`     Result:`, {
            custoMedio: resultado.custoMedio,
            custoRotacao: resultado.custoRotacao,
            indiceGiro: resultado.indiceGiro,
            comissaoRate: resultado.comissaoRate,
            comissaoPercent: resultado.comissaoPercent
          });
          
          // Check if rotation is being considered
          const hasRotationData = !!(resultado.custoRotacao || resultado.indiceGiro || resultado.comissaoRate);
          console.log(`     Rotation integration active: ${hasRotationData ? '✅' : '❌'}`);
          
        } catch (error) {
          console.error(`     ❌ Error: ${error.message}`);
          results[index] = { error: error.message };
        }
      }, 100 * index); // Stagger the tests
    });

    // Final analysis after all tests
    setTimeout(() => {
      console.log('\n3. 📊 Final Analysis:');
      console.log('====================');

      const validResults = Object.values(results).filter(r => !r.error);
      
      if (validResults.length === 0) {
        console.log('❌ No valid results obtained');
        return;
      }

      // Check if values change with rotation index
      const custoMedioValues = validResults.map(r => r.custoMedio);
      const allSame = custoMedioValues.every(val => val === custoMedioValues[0]);
      
      console.log(`   Results vary with rotation index: ${!allSame ? '✅' : '❌'}`);
      
      if (allSame) {
        console.log('   ⚠️ All custoMedio values are the same - rotation integration may not be working');
        console.log(`   Common value: ${custoMedioValues[0]}`);
      } else {
        console.log('   ✅ custoMedio values change with rotation index - integration is working');
        Object.entries(results).forEach(([index, result]) => {
          if (!result.error) {
            console.log(`     Index ${index}: R$ ${result.custoMedio?.toLocaleString()}`);
          }
        });
      }

      // Check for rotation-specific properties
      const hasRotationProps = validResults.some(r => r.custoRotacao || r.indiceGiro || r.comissaoRate);
      console.log(`   Rotation properties present: ${hasRotationProps ? '✅' : '❌'}`);

      if (!hasRotationProps) {
        console.log('   ⚠️ No rotation-specific properties found in results');
        console.log('   This suggests the rotation integration is not active');
      }

      // Reset to original index
      modules.rotationController.setIndex(2);

    }, 1000); // Wait for all tests to complete
  }

  // Make function globally available
  window.testRotationIntegration = testRotationIntegration;

  console.log('✅ Rotation Integration Test loaded. Call testRotationIntegration() to run.');

})();
