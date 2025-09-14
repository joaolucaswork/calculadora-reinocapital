/**
 * Rotation Fix Test
 * Testa se a correção direta do elemento [data-resultado="tradicional"] está funcionando
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  function testRotationFix() {
    console.log('🔧 Testing Rotation Fix...');
    console.log('==========================');

    if (
      !window.ReinoAppState ||
      !window.ReinoSimpleResultadoSync ||
      !window.ReinoRotationIndexController
    ) {
      console.error('❌ Required modules not available');
      return;
    }

    const appState = window.ReinoAppState;
    const resultadoSync = window.ReinoSimpleResultadoSync;
    const rotationController = window.ReinoRotationIndexController;

    // Check DOM element
    const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
    if (!tradicionalElement) {
      console.error('❌ Element [data-resultado="tradicional"] not found');
      return;
    }

    console.log('✅ All required components found');

    // Setup test data
    console.log('\n1. 🏗️ Setting up test data...');
    appState.setPatrimonio(1000000, 'rotation-fix-test');
    appState.addSelectedAsset('Renda Fixa', 'CDB', 'rotation-fix-test');
    appState.setAllocation('Renda Fixa', 'CDB', 500000, 'rotation-fix-test');

    setTimeout(() => {
      const initialValue = tradicionalElement.textContent;
      const initialIndex = rotationController.getCurrentIndex();

      console.log(`   Initial DOM value: "${initialValue}"`);
      console.log(`   Initial rotation index: ${initialIndex}`);

      // Change rotation index
      console.log('\n2. 🔄 Changing rotation index...');
      const newIndex = initialIndex === 2 ? 3 : 2;
      console.log(`   Changing from ${initialIndex} to ${newIndex}`);

      rotationController.setIndex(newIndex);

      // Check result after short delay
      setTimeout(() => {
        const finalValue = tradicionalElement.textContent;
        const finalIndex = rotationController.getCurrentIndex();

        console.log('\n3. 📊 Results:');
        console.log(`   Final DOM value: "${finalValue}"`);
        console.log(`   Final rotation index: ${finalIndex}`);
        console.log(`   DOM value changed: ${finalValue !== initialValue ? '✅' : '❌'}`);
        console.log(`   Rotation index changed: ${finalIndex === newIndex ? '✅' : '❌'}`);

        if (finalValue !== initialValue) {
          console.log(
            '\n🎉 SUCCESS! The fix is working - DOM element updates when rotation index changes.'
          );
        } else {
          console.log('\n❌ ISSUE: DOM element did not update when rotation index changed.');
        }

        // Cleanup
        console.log('\n4. 🧹 Cleaning up...');
        appState.removeSelectedAsset('Renda Fixa', 'CDB', 'rotation-fix-test-cleanup');
        rotationController.setIndex(initialIndex);
      }, 1000);
    }, 500);
  }

  // Make function globally available
  window.testRotationFix = testRotationFix;

  console.log('✅ Rotation Fix Test loaded. Call testRotationFix() to run.');
})();
