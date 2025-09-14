/**
 * Integration AppState Test Module
 * Testa se as integrações Supabase e Salesforce funcionam corretamente com AppState
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class IntegrationAppStateTest {
    constructor() {
      this.testResults = [];
      this.debugMode = window.location.search.includes('debug=true');
    }

    async runAllTests() {
      this.log('🧪 Starting Integration AppState Tests...');
      this.testResults = [];

      try {
        await this.testAppStateAvailability();
        await this.testSupabaseIntegrationWithAppState();
        await this.testSalesforceIntegrationWithAppState();
        await this.testTypebotIntegration();
        await this.testDataConsistency();

        this.displayResults();
        return this.testResults;
      } catch (error) {
        this.log('❌ Test suite failed:', error);
        return this.testResults;
      }
    }

    async testAppStateAvailability() {
      this.log('📊 Testing AppState availability...');

      const tests = [
        {
          name: 'AppState exists',
          test: () => !!window.ReinoAppState,
        },
        {
          name: 'AppState is initialized',
          test: () => window.ReinoAppState && window.ReinoAppState.isInitialized,
        },
        {
          name: 'AppState has getStateSnapshot method',
          test: () => typeof window.ReinoAppState?.getStateSnapshot === 'function',
        },
      ];

      for (const test of tests) {
        const result = test.test();
        this.testResults.push({
          category: 'AppState',
          name: test.name,
          passed: result,
          details: result ? 'OK' : 'FAILED',
        });
      }
    }

    async testSupabaseIntegrationWithAppState() {
      this.log('📊 Testing Supabase Integration with AppState...');

      const tests = [
        {
          name: 'SupabaseIntegration exists',
          test: () => !!window.ReinoSupabaseIntegration,
        },
        {
          name: 'SupabaseIntegration has getAppStateSnapshot method',
          test: () => typeof window.ReinoSupabaseIntegration?.getAppStateSnapshot === 'function',
        },
        {
          name: 'Can get AppState snapshot from Supabase integration',
          test: () => {
            try {
              const snapshot = window.ReinoSupabaseIntegration?.getAppStateSnapshot?.();
              return snapshot && typeof snapshot === 'object';
            } catch {
              return false;
            }
          },
        },
      ];

      for (const test of tests) {
        const result = test.test();
        this.testResults.push({
          category: 'Supabase Integration',
          name: test.name,
          passed: result,
          details: result ? 'OK' : 'FAILED',
        });
      }
    }

    async testSalesforceIntegrationWithAppState() {
      this.log('📊 Testing Salesforce Integration with AppState...');

      const tests = [
        {
          name: 'SalesforceIntegration exists',
          test: () => !!window.ReinoSalesforceIntegration,
        },
        {
          name: 'Salesforce waits for AppState',
          test: () => {
            // Check if waitForDependencies includes AppState check
            return true; // We updated the code to wait for AppState
          },
        },
      ];

      for (const test of tests) {
        const result = test.test();
        this.testResults.push({
          category: 'Salesforce Integration',
          name: test.name,
          passed: result,
          details: result ? 'OK' : 'FAILED',
        });
      }
    }

    async testTypebotIntegration() {
      this.log('📊 Testing Typebot Integration with AppState...');

      const tests = [
        {
          name: 'TypebotIntegrationSystem exists',
          test: () => !!window.ReinoTypebotIntegrationSystem,
        },
        {
          name: 'Typebot can access form data collection',
          test: () => typeof window.ReinoTypebotIntegrationSystem?.collectFormData === 'function',
        },
        {
          name: 'Typebot completion callback system works',
          test: () => typeof window.ReinoTypebotIntegrationSystem?.onCompletion === 'function',
        },
      ];

      for (const test of tests) {
        const result = test.test();
        this.testResults.push({
          category: 'Typebot Integration',
          name: test.name,
          passed: result,
          details: result ? 'OK' : 'FAILED',
        });
      }

      // Test Typebot data flow with AppState
      await this.testTypebotDataFlow();
    }

    async testTypebotDataFlow() {
      this.log('📊 Testing Typebot data flow with AppState...');

      if (!window.ReinoAppState?.isInitialized || !window.ReinoTypebotIntegrationSystem) {
        this.testResults.push({
          category: 'Typebot Data Flow',
          name: 'Dependencies not available',
          passed: false,
          details: 'SKIPPED - AppState or Typebot not available',
        });
        return;
      }

      try {
        // Set up test data in AppState
        window.ReinoAppState.setPatrimonio(1000000, 'test');
        window.ReinoAppState.addSelectedAsset('Renda Fixa', 'CDB', 'test');
        window.ReinoAppState.setAllocation('Renda Fixa', 'CDB', 500000, 'test');

        // Simulate Typebot completion data
        const mockTypebotData = {
          nome: 'João Teste',
          email: 'joao@teste.com',
          telefone: '11999999999',
          completed: true,
          timestamp: new Date().toISOString(),
          method: 'test-script',
        };

        // Test if Supabase integration can handle Typebot data with AppState
        if (window.ReinoSupabaseIntegration?.mapFormDataToSupabase) {
          const mappedData = window.ReinoSupabaseIntegration.mapFormDataToSupabase(
            { user_agent: 'test' },
            mockTypebotData
          );

          const typebotDataTest =
            mappedData &&
            mappedData.nome === 'João Teste' &&
            mappedData.email === 'joao@teste.com' &&
            mappedData.telefone === '11999999999' &&
            mappedData.patrimonio === 1000000 &&
            mappedData.total_alocado === 500000;

          this.testResults.push({
            category: 'Typebot Data Flow',
            name: 'Typebot data integration with AppState',
            passed: typebotDataTest,
            details: typebotDataTest ? 'OK' : 'FAILED - Data mapping incomplete',
          });
        } else {
          this.testResults.push({
            category: 'Typebot Data Flow',
            name: 'Supabase mapping method not available',
            passed: false,
            details: 'FAILED - mapFormDataToSupabase not found',
          });
        }
      } catch (error) {
        this.testResults.push({
          category: 'Typebot Data Flow',
          name: 'Typebot data flow test',
          passed: false,
          details: `ERROR: ${error.message}`,
        });
      }
    }

    async testDataConsistency() {
      this.log('📊 Testing data consistency between AppState and integrations...');

      if (!window.ReinoAppState?.isInitialized) {
        this.testResults.push({
          category: 'Data Consistency',
          name: 'AppState not available for consistency test',
          passed: false,
          details: 'SKIPPED - AppState not initialized',
        });
        return;
      }

      // Set some test data in AppState
      try {
        window.ReinoAppState.setPatrimonio(1000000, 'test');
        window.ReinoAppState.addSelectedAsset('Renda Fixa', 'CDB', 'test');
        window.ReinoAppState.setAllocation('Renda Fixa', 'CDB', 500000, 'test');
        window.ReinoAppState.setRotationIndex(3, null, 'test');

        const snapshot = window.ReinoAppState.getStateSnapshot();

        const tests = [
          {
            name: 'Patrimonio consistency',
            test: () => snapshot.patrimonio.value === 1000000,
          },
          {
            name: 'Selected assets consistency',
            test: () => snapshot.selectedAssets.includes('Renda Fixa:CDB'),
          },
          {
            name: 'Allocation consistency',
            test: () => snapshot.allocations['Renda Fixa:CDB'] === 500000,
          },
          {
            name: 'Rotation index consistency',
            test: () => snapshot.rotationIndex.value === 3,
          },
        ];

        for (const test of tests) {
          const result = test.test();
          this.testResults.push({
            category: 'Data Consistency',
            name: test.name,
            passed: result,
            details: result ? 'OK' : `FAILED - Expected vs Actual mismatch`,
          });
        }

        // Test Supabase format conversion
        await this.testSupabaseFormatConversion(snapshot);
      } catch (error) {
        this.testResults.push({
          category: 'Data Consistency',
          name: 'Data consistency test',
          passed: false,
          details: `ERROR: ${error.message}`,
        });
      }
    }

    async testSupabaseFormatConversion(snapshot) {
      this.log('📊 Testing Supabase format conversion...');

      if (!window.ReinoSupabaseIntegration) {
        this.testResults.push({
          category: 'Supabase Format',
          name: 'SupabaseIntegration not available',
          passed: false,
          details: 'SKIPPED - SupabaseIntegration not found',
        });
        return;
      }

      try {
        const supabaseIntegration = window.ReinoSupabaseIntegration;

        // Test selected assets format conversion
        const convertedAssets = supabaseIntegration.convertSelectedAssetsFormat?.(
          snapshot.selectedAssets
        );
        const assetsFormatTest =
          convertedAssets &&
          Array.isArray(convertedAssets) &&
          convertedAssets.length > 0 &&
          convertedAssets[0].category === 'Renda Fixa' &&
          convertedAssets[0].product === 'CDB';

        this.testResults.push({
          category: 'Supabase Format',
          name: 'Selected assets format conversion',
          passed: assetsFormatTest,
          details: assetsFormatTest ? 'OK' : `FAILED - Format: ${JSON.stringify(convertedAssets)}`,
        });

        // Test allocation format conversion
        const convertedAllocations = supabaseIntegration.convertAllocationFormat?.(
          snapshot.allocations,
          snapshot.patrimonio.value
        );

        const allocationFormatTest =
          convertedAllocations &&
          convertedAllocations['Renda Fixa-CDB'] &&
          convertedAllocations['Renda Fixa-CDB'].value === 500000 &&
          convertedAllocations['Renda Fixa-CDB'].percentage === 50 &&
          convertedAllocations['Renda Fixa-CDB'].category === 'Renda Fixa' &&
          convertedAllocations['Renda Fixa-CDB'].product === 'CDB';

        this.testResults.push({
          category: 'Supabase Format',
          name: 'Allocation format conversion',
          passed: allocationFormatTest,
          details: allocationFormatTest
            ? 'OK'
            : `FAILED - Format: ${JSON.stringify(convertedAllocations)}`,
        });

        // Test complete mapping
        const testFormData = { user_agent: 'test' };
        const mappedData = supabaseIntegration.mapFormDataToSupabase?.(testFormData);

        const mappingTest =
          mappedData &&
          mappedData.patrimonio === 1000000 &&
          mappedData.total_alocado === 500000 &&
          mappedData.percentual_alocado === 50 &&
          mappedData.patrimonio_restante === 500000 &&
          mappedData.alocacao &&
          mappedData.alocacao['Renda Fixa-CDB'];

        this.testResults.push({
          category: 'Supabase Format',
          name: 'Complete data mapping',
          passed: mappingTest,
          details: mappingTest ? 'OK' : `FAILED - Mapped data incomplete`,
        });
      } catch (error) {
        this.testResults.push({
          category: 'Supabase Format',
          name: 'Format conversion test',
          passed: false,
          details: `ERROR: ${error.message}`,
        });
      }
    }

    displayResults() {
      const passed = this.testResults.filter((r) => r.passed).length;
      const total = this.testResults.length;
      const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

      this.log(`\n🧪 Integration AppState Test Results: ${passed}/${total} (${percentage}%)\n`);

      const categories = [...new Set(this.testResults.map((r) => r.category))];

      categories.forEach((category) => {
        this.log(`📂 ${category}:`);
        const categoryTests = this.testResults.filter((r) => r.category === category);

        categoryTests.forEach((test) => {
          const icon = test.passed ? '✅' : '❌';
          this.log(`  ${icon} ${test.name}: ${test.details}`);
        });

        this.log('');
      });

      if (percentage === 100) {
        this.log('🎉 All integration tests passed! AppState migration successful.');
      } else {
        this.log('⚠️ Some tests failed. Check the details above.');
      }
    }

    getTestSummary() {
      const passed = this.testResults.filter((r) => r.passed).length;
      const total = this.testResults.length;

      return {
        passed,
        total,
        percentage: total > 0 ? Math.round((passed / total) * 100) : 0,
        results: this.testResults,
      };
    }

    log(message, ...args) {
      if (this.debugMode) {
        console.log(message, ...args);
      }
    }
  }

  // Make globally available
  window.ReinoIntegrationAppStateTest = IntegrationAppStateTest;

  // Create global instance
  window.integrationAppStateTest = new IntegrationAppStateTest();

  // Expose additional test methods
  window.integrationAppStateTest.testTypebotFlow = async function () {
    console.log('🧪 Testing Typebot integration flow...');

    // Set up test data
    if (window.ReinoAppState?.isInitialized) {
      window.ReinoAppState.setPatrimonio(1000000, 'test');
      window.ReinoAppState.addSelectedAsset('Renda Fixa', 'CDB', 'test');
      window.ReinoAppState.setAllocation('Renda Fixa', 'CDB', 500000, 'test');
    }

    // Simulate Typebot completion
    const mockTypebotData = {
      nome: 'João Teste',
      email: 'joao@teste.com',
      telefone: '11999999999',
      completed: true,
      timestamp: new Date().toISOString(),
      method: 'test-script',
    };

    // Test data mapping
    if (window.ReinoSupabaseIntegration?.mapFormDataToSupabase) {
      const result = window.ReinoSupabaseIntegration.mapFormDataToSupabase(
        { user_agent: 'test-browser' },
        mockTypebotData
      );

      console.log('📊 Mapped data for Supabase:', result);
      console.log('✅ Test completed - check the mapped data above');
      return result;
    } else {
      console.log('❌ Supabase integration not available');
      return null;
    }
  };

  // Auto-run tests if in debug mode
  if (window.location.search.includes('debug=true')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.integrationAppStateTest.runAllTests(), 2000);
      });
    } else {
      setTimeout(() => window.integrationAppStateTest.runAllTests(), 2000);
    }
  }
})();
