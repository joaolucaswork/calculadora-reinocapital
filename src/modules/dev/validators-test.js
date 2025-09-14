/**
 * AppState Validators Test
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class ValidatorsTest {
    constructor() {
      this.testResults = [];
      this.debugMode = false;
    }

    async runAllTests() {
      this.log('🧪 Starting AppState Validators Tests...');
      this.testResults = [];

      try {
        await this.testValidatorInitialization();
        await this.testPatrimonioValidation();
        await this.testAllocationValidation();
        await this.testAssetValidation();
        await this.testRotationIndexValidation();
        await this.testCommissionValidation();

        this.displayResults();
        return this.testResults;
      } catch (error) {
        this.log('❌ Test suite failed:', error);
        return this.testResults;
      }
    }

    async testValidatorInitialization() {
      this.log('🔧 Testing Validator Initialization...');

      const tests = [
        {
          name: 'Validators exist',
          test: () => !!window.ReinoAppStateValidators,
        },
        {
          name: 'Validators initialized',
          test: () => window.ReinoAppStateValidators.isInitialized,
        },
        {
          name: 'AppState integration enabled',
          test: () => window.ReinoAppStateValidators.appState !== null,
        },
      ];

      for (const test of tests) {
        const result = test.test();
        this.testResults.push({
          category: 'Initialization',
          name: test.name,
          passed: result,
          details: result ? 'OK' : 'FAILED',
        });
      }
    }

    async testPatrimonioValidation() {
      this.log('💰 Testing Patrimônio Validation...');

      const tests = [
        {
          name: 'Valid patrimônio passes',
          test: () => {
            const result = window.ReinoAppStateValidators.validatePatrimonio({
              patrimonio: { value: 1000000 },
            });
            return result.isValid;
          },
        },
        {
          name: 'Negative patrimônio fails',
          test: () => {
            const result = window.ReinoAppStateValidators.validatePatrimonio({
              patrimonio: { value: -1000 },
            });
            return !result.isValid && result.errors.length > 0;
          },
        },
        {
          name: 'Low patrimônio generates warning',
          test: () => {
            const result = window.ReinoAppStateValidators.validatePatrimonio({
              patrimonio: { value: 500 },
            });
            return result.isValid && result.warnings.length > 0;
          },
        },
      ];

      for (const test of tests) {
        try {
          const result = test.test();
          this.testResults.push({
            category: 'Patrimônio Validation',
            name: test.name,
            passed: result,
            details: result ? 'OK' : 'FAILED',
          });
        } catch (error) {
          this.testResults.push({
            category: 'Patrimônio Validation',
            name: test.name,
            passed: false,
            details: `ERROR: ${error.message}`,
          });
        }
      }
    }

    async testAllocationValidation() {
      this.log('📊 Testing Allocation Validation...');

      const tests = [
        {
          name: 'Valid allocation passes',
          test: () => {
            const state = {
              patrimonio: { value: 1000000 },
              allocations: { 'Renda Fixa:CDB': 500000 },
            };
            const result = window.ReinoAppStateValidators.validateAllocations(state);
            return result.isValid;
          },
        },
        {
          name: 'Over-allocation fails',
          test: () => {
            const state = {
              patrimonio: { value: 1000000 },
              allocations: { 'Renda Fixa:CDB': 1500000 },
            };
            const result = window.ReinoAppStateValidators.validateAllocations(state);
            return !result.isValid && result.errors.length > 0;
          },
        },
        {
          name: 'Negative allocation fails',
          test: () => {
            const state = {
              patrimonio: { value: 1000000 },
              allocations: { 'Renda Fixa:CDB': -100000 },
            };
            const result = window.ReinoAppStateValidators.validateAllocations(state);
            return !result.isValid && result.errors.length > 0;
          },
        },
        {
          name: 'High allocation percentage generates warning',
          test: () => {
            const state = {
              patrimonio: { value: 1000000 },
              allocations: { 'Renda Fixa:CDB': 980000 },
            };
            const result = window.ReinoAppStateValidators.validateAllocations(state);
            return result.isValid && result.warnings.length > 0;
          },
        },
      ];

      for (const test of tests) {
        try {
          const result = test.test();
          this.testResults.push({
            category: 'Allocation Validation',
            name: test.name,
            passed: result,
            details: result ? 'OK' : 'FAILED',
          });
        } catch (error) {
          this.testResults.push({
            category: 'Allocation Validation',
            name: test.name,
            passed: false,
            details: `ERROR: ${error.message}`,
          });
        }
      }
    }

    async testAssetValidation() {
      this.log('🏦 Testing Asset Validation...');

      const tests = [
        {
          name: 'Consistent assets and allocations pass',
          test: () => {
            const state = {
              selectedAssets: ['Renda Fixa:CDB'],
              allocations: { 'Renda Fixa:CDB': 500000 },
            };
            const result = window.ReinoAppStateValidators.validateSelectedAssets(state);
            return result.isValid;
          },
        },
        {
          name: 'Selected asset without allocation generates warning',
          test: () => {
            const state = {
              selectedAssets: ['Renda Fixa:CDB'],
              allocations: {},
            };
            const result = window.ReinoAppStateValidators.validateSelectedAssets(state);
            return result.isValid && result.warnings.length > 0;
          },
        },
        {
          name: 'Allocation without selected asset generates warning',
          test: () => {
            const state = {
              selectedAssets: [],
              allocations: { 'Renda Fixa:CDB': 500000 },
            };
            const result = window.ReinoAppStateValidators.validateSelectedAssets(state);
            return result.isValid && result.warnings.length > 0;
          },
        },
      ];

      for (const test of tests) {
        try {
          const result = test.test();
          this.testResults.push({
            category: 'Asset Validation',
            name: test.name,
            passed: result,
            details: result ? 'OK' : 'FAILED',
          });
        } catch (error) {
          this.testResults.push({
            category: 'Asset Validation',
            name: test.name,
            passed: false,
            details: `ERROR: ${error.message}`,
          });
        }
      }
    }

    async testRotationIndexValidation() {
      this.log('🔄 Testing Rotation Index Validation...');

      const tests = [
        {
          name: 'Valid rotation index passes',
          test: () => {
            const result = window.ReinoAppStateValidators.validateRotationIndex({
              rotationIndex: { value: 2 },
            });
            return result.isValid;
          },
        },
        {
          name: 'Invalid rotation index fails',
          test: () => {
            const result = window.ReinoAppStateValidators.validateRotationIndex({
              rotationIndex: { value: 5 },
            });
            return !result.isValid && result.errors.length > 0;
          },
        },
        {
          name: 'Non-integer rotation index fails',
          test: () => {
            const result = window.ReinoAppStateValidators.validateRotationIndex({
              rotationIndex: { value: 2.5 },
            });
            return !result.isValid && result.errors.length > 0;
          },
        },
      ];

      for (const test of tests) {
        try {
          const result = test.test();
          this.testResults.push({
            category: 'Rotation Index Validation',
            name: test.name,
            passed: result,
            details: result ? 'OK' : 'FAILED',
          });
        } catch (error) {
          this.testResults.push({
            category: 'Rotation Index Validation',
            name: test.name,
            passed: false,
            details: `ERROR: ${error.message}`,
          });
        }
      }
    }

    async testCommissionValidation() {
      this.log('💵 Testing Commission Validation...');

      const tests = [
        {
          name: 'Valid commission passes',
          test: () => {
            const state = {
              commission: { value: 15000 },
              patrimonio: { value: 1000000 },
              allocations: { 'Renda Fixa:CDB': 500000 },
            };
            const result = window.ReinoAppStateValidators.validateCommission(state);
            return result.isValid;
          },
        },
        {
          name: 'Zero commission with allocations generates warning',
          test: () => {
            const state = {
              commission: { value: 0 },
              patrimonio: { value: 1000000 },
              allocations: { 'Renda Fixa:CDB': 500000 },
            };
            const result = window.ReinoAppStateValidators.validateCommission(state);
            return result.isValid && result.warnings.length > 0;
          },
        },
        {
          name: 'Very high commission generates warning',
          test: () => {
            const state = {
              commission: { value: 150000 },
              patrimonio: { value: 1000000 },
              allocations: { 'Renda Fixa:CDB': 500000 },
            };
            const result = window.ReinoAppStateValidators.validateCommission(state);
            return result.isValid && result.warnings.length > 0;
          },
        },
      ];

      for (const test of tests) {
        try {
          const result = test.test();
          this.testResults.push({
            category: 'Commission Validation',
            name: test.name,
            passed: result,
            details: result ? 'OK' : 'FAILED',
          });
        } catch (error) {
          this.testResults.push({
            category: 'Commission Validation',
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

      console.log(`\n📊 AppState Validators Test Results:`);
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
        console.log(`[ValidatorsTest] ${message}`, data);
      } else {
        console.log(`[ValidatorsTest] ${message}`);
      }
    }
  }

  // Create global instance
  window.ReinoValidatorsTest = new ValidatorsTest();

  // Auto-initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        console.log('🧪 Validators Test ready. Run: window.ReinoValidatorsTest.runAllTests()');
      }, 1000);
    });
  } else {
    setTimeout(() => {
      console.log('🧪 Validators Test ready. Run: window.ReinoValidatorsTest.runAllTests()');
    }, 1000);
  }
})();
