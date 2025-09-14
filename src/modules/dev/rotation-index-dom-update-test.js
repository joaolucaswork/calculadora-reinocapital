/**
 * Rotation Index DOM Update Test
 * Tests if changing rotation index properly updates the [data-resultado="tradicional"] element
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  function testRotationIndexDOMUpdate() {
    console.log('🔄 Testing Rotation Index DOM Update...');
    console.log('=====================================');

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

    // Setup test data
    console.log('\n1. 🏗️ Setting up test data...');
    appState.setPatrimonio(1000000, 'rotation-test');
    appState.addSelectedAsset('Renda Fixa', 'CDB', 'rotation-test');
    appState.setAllocation('Renda Fixa', 'CDB', 500000, 'rotation-test');

    // Wait for initial calculation
    setTimeout(() => {
      console.log('\n2. 📊 Initial state check...');

      // Check initial DOM value
      const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
      const initialValue = tradicionalElement ? tradicionalElement.textContent : 'NOT_FOUND';
      console.log('   Initial DOM value:', initialValue);

      // Check initial rotation index
      const initialIndex = rotationController.getCurrentIndex();
      console.log('   Initial rotation index:', initialIndex);

      // Listen for events
      let commissionEventReceived = false;
      let rotationEventReceived = false;
      let finalDOMValue = '';

      const commissionHandler = (e) => {
        commissionEventReceived = true;
        console.log('   📡 Commission event received:', {
          total: e.detail.total,
          formatted: e.detail.formatted,
          source: e.detail.source,
        });
      };

      const rotationHandler = (e) => {
        rotationEventReceived = true;
        console.log('   🔄 Rotation event received:', {
          index: e.detail.index,
          oldIndex: e.detail.oldIndex,
          source: e.detail.source,
        });
      };

      document.addEventListener('totalComissaoChanged', commissionHandler);
      document.addEventListener('rotationIndexChanged', rotationHandler);

      // Change rotation index
      console.log('\n3. 🔄 Changing rotation index...');
      const newIndex = initialIndex === 2 ? 3 : 2;
      console.log(`   Changing from ${initialIndex} to ${newIndex}`);

      rotationController.setIndex(newIndex);

      // Check results after delay
      setTimeout(() => {
        document.removeEventListener('totalComissaoChanged', commissionHandler);
        document.removeEventListener('rotationIndexChanged', rotationHandler);

        console.log('\n4. 📊 Final Results:');
        console.log('==================');

        // Check final DOM value
        finalDOMValue = tradicionalElement ? tradicionalElement.textContent : 'NOT_FOUND';
        console.log('   Final DOM value:', finalDOMValue);

        // Check final rotation index
        const finalIndex = rotationController.getCurrentIndex();
        console.log('   Final rotation index:', finalIndex);

        // Check events
        console.log('   Rotation event received:', rotationEventReceived);
        console.log('   Commission event received:', commissionEventReceived);

        // Assessment
        const success = {
          rotationChanged: finalIndex === newIndex,
          domValueChanged: finalDOMValue !== initialValue && finalDOMValue !== 'NOT_FOUND',
          eventsReceived: rotationEventReceived && commissionEventReceived,
          domElementExists: tradicionalElement !== null,
        };

        console.log('\n5. ✅ Success Assessment:');
        console.log('========================');
        Object.entries(success).forEach(([key, value]) => {
          const icon = value ? '✅' : '❌';
          console.log(`   ${icon} ${key}: ${value}`);
        });

        const allSuccess = Object.values(success).every((v) => v);

        if (allSuccess) {
          console.log('\n🎉 ALL TESTS PASSED! Rotation index DOM update is working correctly.');
        } else {
          console.log('\n❌ Some tests failed. Issues detected:');
          Object.entries(success).forEach(([key, value]) => {
            if (!value) {
              console.log(`   - ${key}: NEEDS ATTENTION`);
            }
          });
        }

        // Cleanup
        console.log('\n6. 🧹 Cleaning up...');
        appState.removeSelectedAsset('Renda Fixa', 'CDB', 'rotation-test-cleanup');
        rotationController.setIndex(initialIndex); // Reset to original
      }, 1000); // Wait 1 second for all calculations
    }, 500); // Wait 500ms for initial setup
  }

  // Make function globally available
  window.testRotationIndexDOMUpdate = testRotationIndexDOMUpdate;

  console.log(
    '✅ Rotation Index DOM Update Test loaded. Call testRotationIndexDOMUpdate() to run.'
  );
})();
