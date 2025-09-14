/**
 * Currency Formatting AppState Integration Test
 * Testa a migração do currency-formatting.js para AppState
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class CurrencyFormattingAppStateTest {
    constructor() {
      this.testResults = [];
      this.debugMode = false;
    }

    async runAllTests() {
      this.log('🧪 Starting Currency Formatting AppState Integration Tests...');
      this.testResults = [];

      const tests = [
        () => this.testAppStateConnection(),
        () => this.testPatrimonySync(),
        () => this.testAllocationSync(),
        () => this.testCurrencyFormatting(),
        () => this.testEventIntegration(),
        () => this.testLegacyCompatibility(),
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

      // Verifica se CurrencyFormatting está conectado
      if (!window.ReinoCurrencyFormatting) {
        throw new Error('ReinoCurrencyFormatting not available');
      }

      const debugInfo = window.ReinoCurrencyFormatting.getDebugInfo();

      if (!debugInfo.hasAppState) {
        throw new Error('CurrencyFormatting not connected to AppState');
      }

      this.addResult(true, 'AppState connection established');
    }

    async testPatrimonySync() {
      this.log('💰 Testing patrimony synchronization...');

      const testValue = 1500000;
      const appState = window.ReinoAppState;
      const currencySystem = window.ReinoCurrencyFormatting;

      // Define valor no AppState
      appState.setPatrimonio(testValue, 'test');

      // Aguarda sincronização
      await this.wait(100);

      // Verifica se o sistema de currency foi notificado
      const debugInfo = currencySystem.getDebugInfo();

      if (debugInfo.lastMainValue !== testValue) {
        throw new Error(
          `Patrimony sync failed. Expected: ${testValue}, Got: ${debugInfo.lastMainValue}`
        );
      }

      this.addResult(true, `Patrimony sync working: ${appState.formatCurrency(testValue)}`);
    }

    async testAllocationSync() {
      this.log('💼 Testing allocation synchronization...');

      const appState = window.ReinoAppState;
      const currencySystem = window.ReinoCurrencyFormatting;

      // Adiciona ativo e define alocação
      appState.addSelectedAsset('Renda Fixa', 'CDB', 'test');
      appState.setAllocation('Renda Fixa', 'CDB', 500000, 'test');

      // Aguarda sincronização
      await this.wait(100);

      // Verifica se o sistema foi notificado
      const debugInfo = currencySystem.getDebugInfo();

      if (debugInfo.lastTotalAllocation !== 500000) {
        throw new Error(
          `Allocation sync failed. Expected: 500000, Got: ${debugInfo.lastTotalAllocation}`
        );
      }

      this.addResult(true, 'Allocation sync working: R$ 500.000,00');
    }

    async testCurrencyFormatting() {
      this.log('💱 Testing currency formatting...');

      const currencySystem = window.ReinoCurrencyFormatting;

      // Testa formatação de moeda
      const testValue = 1234567.89;
      const formatted = currencySystem.formatCurrency(testValue);
      const expected = 'R$ 1.234.567,89';

      if (formatted !== expected) {
        throw new Error(`Currency formatting failed. Expected: ${expected}, Got: ${formatted}`);
      }

      // Testa formatação de input
      const inputFormatted = currencySystem.formatInputValue(testValue);
      const expectedInput = '1.234.567,89';

      if (inputFormatted !== expectedInput) {
        throw new Error(
          `Input formatting failed. Expected: ${expectedInput}, Got: ${inputFormatted}`
        );
      }

      // Testa parsing
      const parsed = currencySystem.parseCurrencyValue('R$ 1.234.567,89');
      if (Math.abs(parsed - testValue) > 0.01) {
        throw new Error(`Currency parsing failed. Expected: ${testValue}, Got: ${parsed}`);
      }

      this.addResult(true, 'Currency formatting methods working correctly');
    }

    async testEventIntegration() {
      this.log('🎧 Testing event integration...');

      let eventReceived = false;
      const testValue = 2000000;

      // Escuta evento de mudança de patrimônio
      const handler = (e) => {
        if (e.detail.value === testValue) {
          eventReceived = true;
        }
      };

      document.addEventListener('patrimonyMainValueChanged', handler);

      // Dispara mudança
      window.ReinoAppState.setPatrimonio(testValue, 'test');

      // Aguarda evento
      await this.wait(100);

      document.removeEventListener('patrimonyMainValueChanged', handler);

      if (!eventReceived) {
        throw new Error('Event integration failed - patrimonyMainValueChanged not received');
      }

      this.addResult(true, 'Event integration working correctly');
    }

    async testLegacyCompatibility() {
      this.log('🔄 Testing legacy compatibility...');

      // Verifica se funções globais ainda existem
      if (typeof window.formatCurrency !== 'function') {
        throw new Error('window.formatCurrency not available');
      }

      if (typeof window.calculateCurrency !== 'function') {
        throw new Error('window.calculateCurrency not available');
      }

      // Testa formatação legada
      const formatted = window.formatCurrency(1000);
      if (!formatted.includes('R$')) {
        throw new Error('Legacy formatCurrency not working');
      }

      this.addResult(true, 'Legacy compatibility maintained');
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

      console.log('\n📊 Currency Formatting AppState Integration Test Results:');
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
          console.log(`[CurrencyFormattingTest] ${message}`, data);
        } else {
          console.log(`[CurrencyFormattingTest] ${message}`);
        }
      }
    }
  }

  // Cria instância global
  window.ReinoCurrencyFormattingAppStateTest = new CurrencyFormattingAppStateTest();

  // Auto-inicialização para debug
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.search.includes('debug=currency')) {
        window.ReinoCurrencyFormattingAppStateTest.enableDebug();
      }
    });
  }
})();
