/**
 * Rotation Debug Test
 * Debug específico para o problema do elemento [data-resultado="tradicional"] não atualizar
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  function debugRotationDOMUpdate() {
    console.log('🔍 DEBUG: Rotation DOM Update Issue');
    console.log('===================================');

    // Check if modules are available
    const modules = {
      appState: window.ReinoAppState,
      resultadoSync: window.ReinoSimpleResultadoSync,
      rotationController: window.ReinoRotationIndexController,
      resultadoComparativo: window.ReinoResultadoComparativoCalculator,
    };

    console.log('\n1. 📋 Module Availability:');
    Object.entries(modules).forEach(([name, module]) => {
      const available = !!module;
      const initialized = module?.isInitialized;
      console.log(
        `   ${available ? '✅' : '❌'} ${name}: ${available ? 'available' : 'missing'} ${initialized ? '(initialized)' : '(not initialized)'}`
      );
    });

    if (!modules.appState || !modules.resultadoSync || !modules.rotationController) {
      console.error('❌ Required modules missing. Cannot proceed.');
      return;
    }

    // Check DOM element
    const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
    console.log('\n2. 🎯 DOM Element Check:');
    console.log(`   Element found: ${!!tradicionalElement}`);
    if (tradicionalElement) {
      console.log(`   Current value: "${tradicionalElement.textContent}"`);
      console.log(`   Element type: ${tradicionalElement.tagName}`);
    }

    // Setup test data
    console.log('\n3. 🏗️ Setting up test data...');
    modules.appState.setPatrimonio(1000000, 'rotation-debug');
    modules.appState.addSelectedAsset('Renda Fixa', 'CDB', 'rotation-debug');
    modules.appState.setAllocation('Renda Fixa', 'CDB', 500000, 'rotation-debug');

    // Enable debug mode on resultado-comparativo if available
    if (
      modules.resultadoComparativo &&
      typeof modules.resultadoComparativo.enableDebug === 'function'
    ) {
      modules.resultadoComparativo.enableDebug();
      console.log('   ✅ Enabled debug mode on resultado-comparativo');
    }

    // Wait for initial calculation
    setTimeout(() => {
      console.log('\n4. 📊 Initial State:');
      const initialValue = tradicionalElement ? tradicionalElement.textContent : 'NOT_FOUND';
      const initialIndex = modules.rotationController.getCurrentIndex();
      console.log(`   DOM value: "${initialValue}"`);
      console.log(`   Rotation index: ${initialIndex}`);

      // Setup event listeners with detailed logging
      const totalComissaoEvents = [];
      const rotationIndexEvents = [];

      const totalComissaoHandler = (e) => {
        const event = {
          timestamp: new Date().toISOString(),
          total: e.detail.total,
          formatted: e.detail.formatted,
          source: e.detail.source,
          detailsCount: e.detail.details?.length || 0,
        };
        totalComissaoEvents.push(event);
        console.log(`   📡 totalComissaoChanged: ${event.formatted} (source: ${event.source})`);

        // Check if DOM updates immediately
        setTimeout(() => {
          const currentDOMValue = tradicionalElement ? tradicionalElement.textContent : 'NOT_FOUND';
          console.log(`   🎯 DOM after event: "${currentDOMValue}"`);
        }, 10);
      };

      const rotationIndexHandler = (e) => {
        const event = {
          timestamp: new Date().toISOString(),
          index: e.detail.index,
          oldIndex: e.detail.oldIndex,
          source: e.detail.source,
        };
        rotationIndexEvents.push(event);
        console.log(
          `   🔄 rotationIndexChanged: ${event.oldIndex} → ${event.index} (source: ${event.source})`
        );
      };

      document.addEventListener('totalComissaoChanged', totalComissaoHandler);
      document.addEventListener('rotationIndexChanged', rotationIndexHandler);

      // Change rotation index
      console.log('\n5. 🔄 Changing rotation index...');
      const newIndex = initialIndex === 2 ? 3 : 2;
      console.log(`   Changing from ${initialIndex} to ${newIndex}`);

      modules.rotationController.setIndex(newIndex);

      // Check results after delay
      setTimeout(() => {
        document.removeEventListener('totalComissaoChanged', totalComissaoHandler);
        document.removeEventListener('rotationIndexChanged', rotationIndexHandler);

        console.log('\n6. 📊 Final Analysis:');
        console.log('====================');

        const finalValue = tradicionalElement ? tradicionalElement.textContent : 'NOT_FOUND';
        const finalIndex = modules.rotationController.getCurrentIndex();

        console.log(`   Initial DOM: "${initialValue}"`);
        console.log(`   Final DOM: "${finalValue}"`);
        console.log(`   DOM changed: ${finalValue !== initialValue}`);
        console.log(`   Rotation changed: ${finalIndex === newIndex}`);

        console.log(`\n   Events received:`);
        console.log(`   - rotationIndexChanged: ${rotationIndexEvents.length}`);
        console.log(`   - totalComissaoChanged: ${totalComissaoEvents.length}`);

        if (rotationIndexEvents.length > 0) {
          console.log(`\n   Rotation events:`);
          rotationIndexEvents.forEach((event, i) => {
            console.log(`     ${i + 1}. ${event.oldIndex} → ${event.index} (${event.source})`);
          });
        }

        if (totalComissaoEvents.length > 0) {
          console.log(`\n   Commission events:`);
          totalComissaoEvents.forEach((event, i) => {
            console.log(`     ${i + 1}. ${event.formatted} (${event.source})`);
          });
        }

        // Test direct DOM update
        console.log('\n7. 🧪 Testing direct DOM update...');
        if (
          modules.resultadoComparativo &&
          typeof modules.resultadoComparativo.updateTradicionalDOMElement === 'function'
        ) {
          const testValue = 99999;
          modules.resultadoComparativo.updateTradicionalDOMElement(testValue);

          setTimeout(() => {
            const afterDirectUpdate = tradicionalElement
              ? tradicionalElement.textContent
              : 'NOT_FOUND';
            console.log(`   After direct update: "${afterDirectUpdate}"`);
            console.log(`   Direct update works: ${afterDirectUpdate.includes('99.999')}`);

            // Restore original value
            if (totalComissaoEvents.length > 0) {
              const lastEvent = totalComissaoEvents[totalComissaoEvents.length - 1];
              modules.resultadoComparativo.updateTradicionalDOMElement(lastEvent.total);
            }
          }, 100);
        } else {
          console.log('   ❌ updateTradicionalDOMElement method not available');
        }

        // Cleanup
        setTimeout(() => {
          console.log('\n8. 🧹 Cleaning up...');
          modules.appState.removeSelectedAsset('Renda Fixa', 'CDB', 'rotation-debug-cleanup');
          modules.rotationController.setIndex(initialIndex);
        }, 500);
      }, 2000); // Wait 2 seconds for all events
    }, 1000); // Wait 1 second for initial setup
  }

  // Make function globally available
  window.debugRotationDOMUpdate = debugRotationDOMUpdate;

  console.log('✅ Rotation Debug Test loaded. Call debugRotationDOMUpdate() to run.');
})();
