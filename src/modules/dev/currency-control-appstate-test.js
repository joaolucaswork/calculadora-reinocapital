/**
 * Currency Control AppState Integration Test
 * Testa a migração do currency-control.js para AppState
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class CurrencyControlAppStateTest {
    constructor() {
      this.testResults = [];
      this.debugMode = false;
    }

    async runAllTests() {
      this.log('🧪 Starting Currency Control AppState Integration Tests...');
      this.testResults = [];

      const tests = [
        () => this.testAppStateConnection(),
        () => this.testCurrentValueRetrieval(),
        () => this.testIncrementLogic(),
        () => this.testDecrementLogic(),
        () => this.testAppStateIntegration(),
        () => this.testLegacyFallback(),
      ];

      for (const test of tests) {
        try {
          await test();
        } catch (error) {
          this.addResult(false, `Test failed: ${error.message}`, error);
        }
      }

      this.printResults();
      return this.getTestSummary();
    }

    async testAppStateConnection() {
      this.log('🔗 Testing AppState connection...');

      // Verifica se AppState está disponível
      if (!window.ReinoAppState) {
        throw new Error('ReinoAppState not available');
      }

      // Verifica se CurrencyControl está disponível
      if (!window.ReinoCurrencyControlSystem) {
        throw new Error('ReinoCurrencyControlSystem not available');
      }

      const debugInfo = window.ReinoCurrencyControlSystem.getDebugInfo();

      if (!debugInfo.hasAppState) {
        throw new Error('CurrencyControl not connected to AppState');
      }

      this.addResult(true, 'AppState connection established');
    }

    async testCurrentValueRetrieval() {
      this.log('💰 Testing current value retrieval...');

      const testValue = 1500000;
      const appState = window.ReinoAppState;
      const currencyControl = window.ReinoCurrencyControlSystem;

      // Define valor no AppState
      appState.setPatrimonio(testValue, 'test');

      // Aguarda sincronização
      await this.wait(100);

      // Verifica se o currency control obtém o valor correto
      const currentValue = currencyControl.getCurrentValue();

      if (currentValue !== testValue) {
        throw new Error(
          `Current value retrieval failed. Expected: ${testValue}, Got: ${currentValue}`
        );
      }

      this.addResult(
        true,
        `Current value retrieval working: ${appState.formatCurrency(testValue)}`
      );
    }

    async testIncrementLogic() {
      this.log('⬆️ Testing increment logic...');

      const appState = window.ReinoAppState;
      const currencyControl = window.ReinoCurrencyControlSystem;

      // Testa diferentes valores para verificar incrementos
      const testCases = [
        { initial: 500, expectedIncrement: 100 },
        { initial: 5000, expectedIncrement: 1000 },
        { initial: 50000, expectedIncrement: 10000 },
        { initial: 500000, expectedIncrement: 50000 },
        { initial: 5000000, expectedIncrement: 100000 },
      ];

      for (const testCase of testCases) {
        // Define valor inicial
        appState.setPatrimonio(testCase.initial, 'test');
        await this.wait(50);

        const initialValue = currencyControl.getCurrentValue();

        // Simula clique no botão de incremento
        const increaseButton = document.querySelector('[currency-control="increase"]');
        if (increaseButton) {
          increaseButton.click();
          await this.wait(50);

          const newValue = currencyControl.getCurrentValue();
          const actualIncrement = newValue - initialValue;

          if (actualIncrement !== testCase.expectedIncrement) {
            throw new Error(
              `Increment logic failed for ${testCase.initial}. Expected increment: ${testCase.expectedIncrement}, Got: ${actualIncrement}`
            );
          }
        }
      }

      this.addResult(true, 'Increment logic working correctly for all value ranges');
    }

    async testDecrementLogic() {
      this.log('⬇️ Testing decrement logic...');

      const appState = window.ReinoAppState;
      const currencyControl = window.ReinoCurrencyControlSystem;

      // Define valor inicial alto
      const initialValue = 1000000;
      appState.setPatrimonio(initialValue, 'test');
      await this.wait(50);

      // Simula clique no botão de decremento
      const decreaseButton = document.querySelector('[currency-control="decrease"]');
      if (decreaseButton) {
        const beforeValue = currencyControl.getCurrentValue();
        decreaseButton.click();
        await this.wait(50);

        const afterValue = currencyControl.getCurrentValue();

        if (afterValue >= beforeValue) {
          throw new Error(
            `Decrement logic failed. Value should decrease. Before: ${beforeValue}, After: ${afterValue}`
          );
        }

        // Testa limite mínimo (não pode ser negativo)
        appState.setPatrimonio(50, 'test');
        await this.wait(50);

        decreaseButton.click();
        await this.wait(50);

        const finalValue = currencyControl.getCurrentValue();
        if (finalValue < 0) {
          throw new Error(`Decrement logic failed - value went negative: ${finalValue}`);
        }
      }

      this.addResult(true, 'Decrement logic working correctly with minimum value protection');
    }

    async testAppStateIntegration() {
      this.log('🔄 Testing AppState integration...');

      let eventReceived = false;
      const testValue = 2000000;

      // Escuta evento de mudança de patrimônio
      const handler = (e) => {
        if (e.detail.value === testValue && e.detail.source === 'currency-control') {
          eventReceived = true;
        }
      };

      document.addEventListener('patrimonyMainValueChanged', handler);

      // Simula incremento que deve usar AppState
      const appState = window.ReinoAppState;
      appState.setPatrimonio(testValue - 100000, 'test'); // Valor base
      await this.wait(50);

      const increaseButton = document.querySelector('[currency-control="increase"]');
      if (increaseButton) {
        increaseButton.click();
        await this.wait(100);
      }

      document.removeEventListener('patrimonyMainValueChanged', handler);

      // Verifica se o valor foi atualizado via AppState
      const finalValue = appState.getPatrimonio().value;
      if (finalValue <= testValue - 100000) {
        throw new Error('AppState integration failed - value not updated');
      }

      this.addResult(true, 'AppState integration working correctly');
    }

    async testLegacyFallback() {
      this.log('🔄 Testing legacy fallback...');

      // Temporariamente remove AppState para testar fallback
      const originalAppState = window.ReinoAppState;
      window.ReinoAppState = null;

      // Recria instância para testar fallback
      const currencyControl = new window.ReinoCurrencyControlSystem.constructor();
      await currencyControl.init();

      const debugInfo = currencyControl.getDebugInfo();
      if (debugInfo.hasAppState) {
        throw new Error('Legacy fallback failed - still thinks AppState is available');
      }

      // Restaura AppState
      window.ReinoAppState = originalAppState;

      this.addResult(true, 'Legacy fallback working correctly');
    }

    // ==================== UTILITY METHODS ====================

    addResult(success, message, error = null) {
      this.testResults.push({
        success,
        message,
        error,
        timestamp: new Date().toISOString(),
      });

      const icon = success ? '✅' : '❌';
      this.log(`${icon} ${message}`);

      if (error) {
        this.log(`   Error details:`, error);
      }
    }

    printResults() {
      const passed = this.testResults.filter((r) => r.success).length;
      const total = this.testResults.length;
      const failed = total - passed;

      console.log('\n📊 Currency Control AppState Integration Test Results:');
      console.log(`✅ Passed: ${passed}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

      if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        this.testResults
          .filter((r) => !r.success)
          .forEach((result) => {
            console.log(`   • ${result.message}`);
            if (result.error) {
              console.log(`     ${result.error.message}`);
            }
          });
      }
    }

    getTestSummary() {
      const passed = this.testResults.filter((r) => r.success).length;
      const total = this.testResults.length;

      return {
        passed,
        failed: total - passed,
        total,
        successRate: (passed / total) * 100,
        results: this.testResults,
      };
    }

    async wait(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    enableDebug() {
      this.debugMode = true;
      this.log('🐛 Debug mode enabled');
    }

    disableDebug() {
      this.debugMode = false;
    }

    log(message, data = null) {
      if (this.debugMode || message.includes('✅') || message.includes('❌')) {
        if (data) {
          console.log(`[CurrencyControlTest] ${message}`, data);
        } else {
          console.log(`[CurrencyControlTest] ${message}`);
        }
      }
    }
  }

  // Cria instância global
  window.ReinoCurrencyControlAppStateTest = new CurrencyControlAppStateTest();

  // Auto-inicialização para debug
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.search.includes('debug=control')) {
        window.ReinoCurrencyControlAppStateTest.enableDebug();
      }
    });
  }
})();
