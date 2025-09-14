/**
 * Resultado Sync AppState Integration Test
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class ResultadoSyncAppStateTest {
    constructor() {
      this.testResults = [];
      this.debugMode = false;
    }

    async runAllTests() {
      this.log('🧪 Starting Resultado Sync AppState Integration Tests...');
      this.testResults = [];

      try {
        await this.testAppStateIntegration();
        await this.testCommissionCalculation();
        await this.testEventEmission();
        await this.testDataConsistency();

        this.displayResults();
        return this.testResults;
      } catch (error) {
        this.log('❌ Test suite failed:', error);
        return this.testResults;
      }
    }

    async testAppStateIntegration() {
      this.log('🔗 Testing AppState Integration...');

      const tests = [
        {
          name: 'ResultadoSync exists',
          test: () => !!window.ReinoSimpleResultadoSync,
        },
        {
          name: 'AppState integration enabled',
          test: () => window.ReinoSimpleResultadoSync.appState !== null,
        },
        {
          name: 'AppState is initialized',
          test: () => window.ReinoAppState && window.ReinoAppState.isInitialized,
        },
        {
          name: 'ResultadoSync is initialized',
          test: () => window.ReinoSimpleResultadoSync.isInitialized,
        },
      ];

      for (const test of tests) {
        const result = test.test();
        this.testResults.push({
          category: 'AppState Integration',
          name: test.name,
          passed: result,
          details: result ? 'OK' : 'FAILED',
        });
      }
    }

    async testCommissionCalculation() {
      this.log('💰 Testing Commission Calculation...');

      // Set up test data in AppState
      if (window.ReinoAppState) {
        window.ReinoAppState.setPatrimonio(1000000, 'test');
        window.ReinoAppState.addSelectedAsset('Renda Fixa', 'CDB', 'test');
        window.ReinoAppState.setAllocation('Renda Fixa', 'CDB', 500000, 'test');
      }

      const tests = [
        {
          name: 'Can calculate commission from AppState',
          test: () => {
            const commission = window.ReinoSimpleResultadoSync.calculateCommissionForValue(
              500000,
              'Renda Fixa',
              'CDB'
            );
            return commission > 0;
          },
        },
        {
          name: 'Commission details are generated',
          test: () => {
            const details = window.ReinoSimpleResultadoSync.getCommissionDetails();
            return Array.isArray(details);
          },
        },
        {
          name: 'Allocated value from AppState',
          test: () => {
            const value = window.ReinoSimpleResultadoSync.getAllocatedValue('Renda Fixa', 'CDB');
            return value === 500000;
          },
        },
      ];

      for (const test of tests) {
        try {
          const result = test.test();
          this.testResults.push({
            category: 'Commission Calculation',
            name: test.name,
            passed: result,
            details: result ? 'OK' : 'FAILED',
          });
        } catch (error) {
          this.testResults.push({
            category: 'Commission Calculation',
            name: test.name,
            passed: false,
            details: `ERROR: ${error.message}`,
          });
        }
      }
    }

    async testEventEmission() {
      this.log('📡 Testing Event Emission...');

      let eventReceived = false;
      let eventData = null;

      // Listen for totalComissaoChanged event
      const eventListener = (e) => {
        eventReceived = true;
        eventData = e.detail;
      };

      document.addEventListener('totalComissaoChanged', eventListener);

      // Trigger calculation
      window.ReinoSimpleResultadoSync.updateTotalComissao(7500);

      // Wait a bit for event to propagate
      await new Promise((resolve) => setTimeout(resolve, 100));

      document.removeEventListener('totalComissaoChanged', eventListener);

      const tests = [
        {
          name: 'totalComissaoChanged event emitted',
          test: () => eventReceived,
        },
        {
          name: 'Event contains total value',
          test: () => eventData && eventData.total === 7500,
        },
        {
          name: 'Event contains formatted value',
          test: () => eventData && typeof eventData.formatted === 'string',
        },
        {
          name: 'Event contains source',
          test: () => eventData && eventData.source === 'resultado-sync',
        },
        {
          name: 'Event contains details array',
          test: () => eventData && Array.isArray(eventData.details),
        },
      ];

      for (const test of tests) {
        const result = test.test();
        this.testResults.push({
          category: 'Event Emission',
          name: test.name,
          passed: result,
          details: result ? 'OK' : 'FAILED',
        });
      }
    }

    async testDataConsistency() {
      this.log('🔄 Testing Data Consistency...');

      // Set test data
      if (window.ReinoAppState) {
        window.ReinoAppState.setPatrimonio(2000000, 'test');
        window.ReinoAppState.addSelectedAsset('Fundo de Investimento', 'Ações', 'test');
        window.ReinoAppState.setAllocation('Fundo de Investimento', 'Ações', 800000, 'test');
      }

      // Trigger sync
      window.ReinoSimpleResultadoSync.forceSync();

      const appStateSnapshot = window.ReinoAppState.getStateSnapshot();
      const resultadoSyncAssets = window.ReinoSimpleResultadoSync.getSelectedAssets();

      const tests = [
        {
          name: 'AppState patrimony matches test value',
          test: () => appStateSnapshot.patrimonio.value === 2000000,
        },
        {
          name: 'AppState allocations contain test asset',
          test: () => appStateSnapshot.allocations['Fundo de Investimento:Ações'] === 800000,
        },
        {
          name: 'Commission results updated in AppState',
          test: () =>
            appStateSnapshot.commission && typeof appStateSnapshot.commission.value === 'number',
        },
      ];

      for (const test of tests) {
        try {
          const result = test.test();
          this.testResults.push({
            category: 'Data Consistency',
            name: test.name,
            passed: result,
            details: result ? 'OK' : 'FAILED',
          });
        } catch (error) {
          this.testResults.push({
            category: 'Data Consistency',
            name: test.name,
            passed: false,
            details: `ERROR: ${error.message}`,
          });
        }
      }
    }

    displayResults() {
      const passed = this.testResults.filter((r) => r.passed).length;
      const total = this.testResults.length;
      const percentage = Math.round((passed / total) * 100);

      console.log(`\n📊 Resultado Sync AppState Integration Test Results:`);
      console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`);

      if (passed < total) {
        console.log(`❌ Failed tests:`);
        this.testResults
          .filter((r) => !r.passed)
          .forEach((r) => {
            console.log(`   - ${r.category}: ${r.name} - ${r.details}`);
          });
      }

      return { passed, total, percentage, results: this.testResults };
    }

    log(message, data = null) {
      if (data) {
        console.log(`[ResultadoSyncTest] ${message}`, data);
      } else {
        console.log(`[ResultadoSyncTest] ${message}`);
      }
    }

    enableDebug() {
      this.debugMode = true;
      if (window.ReinoSimpleResultadoSync) {
        window.ReinoSimpleResultadoSync.enableDebug();
      }
    }

    disableDebug() {
      this.debugMode = false;
      if (window.ReinoSimpleResultadoSync) {
        window.ReinoSimpleResultadoSync.disableDebug();
      }
    }
  }

  // Create global instance
  window.ReinoResultadoSyncAppStateTest = new ResultadoSyncAppStateTest();

  // Auto-initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Wait a bit for other modules to initialize
      setTimeout(() => {
        console.log(
          '🧪 Resultado Sync AppState Test ready. Run: window.ReinoResultadoSyncAppStateTest.runAllTests()'
        );
      }, 1000);
    });
  } else {
    setTimeout(() => {
      console.log(
        '🧪 Resultado Sync AppState Test ready. Run: window.ReinoResultadoSyncAppStateTest.runAllTests()'
      );
    }, 1000);
  }
})();
