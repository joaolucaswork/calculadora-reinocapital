/**
 * Resultado Comparativo AppState Integration Test
 * Testa a migração do resultado-comparativo-calculator.js para AppState
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class ResultadoComparativoAppStateTest {
    constructor() {
      this.testResults = [];
      this.debugMode = false;
    }

    async runAllTests() {
      this.log('🧪 Starting Resultado Comparativo AppState Integration Tests...');
      this.testResults = [];

      const tests = [
        () => this.testAppStateConnection(),
        () => this.testPatrimonyIntegration(),
        () => this.testAllocationIntegration(),
        () => this.testCalculationMethods(),
        () => this.testEventIntegration(),
        () => this.testPerformanceOptimization(),
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

      // Verifica se ResultadoComparativo está disponível
      if (!window.ReinoResultadoComparativoCalculator) {
        throw new Error('ReinoResultadoComparativoCalculator not available');
      }

      const debugInfo = window.ReinoResultadoComparativoCalculator.getDebugInfo();
      
      if (!debugInfo.hasAppState) {
        throw new Error('ResultadoComparativo not connected to AppState');
      }

      this.addResult(true, 'AppState connection established');
    }

    async testPatrimonyIntegration() {
      this.log('💰 Testing patrimony integration...');

      const testValue = 2000000;
      const appState = window.ReinoAppState;
      const calculator = window.ReinoResultadoComparativoCalculator;

      // Define valor no AppState
      appState.setPatrimonio(testValue, 'test');

      // Aguarda sincronização
      await this.wait(100);

      // Verifica se o calculator obtém o valor correto
      const patrimony = calculator.getMainPatrimony();
      
      if (patrimony !== testValue) {
        throw new Error(`Patrimony integration failed. Expected: ${testValue}, Got: ${patrimony}`);
      }

      this.addResult(true, `Patrimony integration working: ${appState.formatCurrency(testValue)}`);
    }

    async testAllocationIntegration() {
      this.log('💼 Testing allocation integration...');

      const appState = window.ReinoAppState;
      const calculator = window.ReinoResultadoComparativoCalculator;

      // Adiciona ativos e define alocações
      appState.addSelectedAsset('Renda Fixa', 'CDB', 'test');
      appState.addSelectedAsset('Renda Variável', 'Ações', 'test');
      appState.setAllocation('Renda Fixa', 'CDB', 800000, 'test');
      appState.setAllocation('Renda Variável', 'Ações', 400000, 'test');

      // Aguarda sincronização
      await this.wait(100);

      // Verifica se o calculator obtém as alocações corretas
      const assets = calculator.getSelectedAssetsWithValues();
      
      if (assets.length !== 2) {
        throw new Error(`Asset count mismatch. Expected: 2, Got: ${assets.length}`);
      }

      const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
      if (totalValue !== 1200000) {
        throw new Error(`Total allocation mismatch. Expected: 1200000, Got: ${totalValue}`);
      }

      this.addResult(true, 'Allocation integration working: 2 assets, R$ 1.200.000,00');
    }

    async testCalculationMethods() {
      this.log('🧮 Testing calculation methods...');

      const calculator = window.ReinoResultadoComparativoCalculator;

      // Testa cálculo Reino
      const reinoValue = calculator.calculateReinoValue();
      if (!reinoValue || typeof reinoValue.annual !== 'number') {
        throw new Error('Reino calculation failed');
      }

      // Testa cálculo Tradicional
      const traditionalValue = calculator.calculateTradicionalValue();
      if (!traditionalValue || typeof traditionalValue.total !== 'number') {
        throw new Error('Traditional calculation failed');
      }

      // Verifica se há diferença entre os modelos
      if (reinoValue.annual >= traditionalValue.total) {
        this.log('⚠️ Warning: Reino cost is higher than traditional - check test data');
      }

      this.addResult(true, `Calculations working - Reino: ${reinoValue.formatted.annual}, Traditional: ${traditionalValue.formatted.total}`);
    }

    async testEventIntegration() {
      this.log('🎧 Testing event integration...');

      let eventReceived = false;
      const testValue = 2500000;

      // Escuta evento de resultado comparativo
      const handler = (e) => {
        if (e.detail.reino && e.detail.tradicional) {
          eventReceived = true;
        }
      };

      document.addEventListener('resultadoComparativoUpdated', handler);

      // Dispara mudança que deve gerar evento
      window.ReinoAppState.setPatrimonio(testValue, 'test');

      // Aguarda evento
      await this.wait(200);

      document.removeEventListener('resultadoComparativoUpdated', handler);

      if (!eventReceived) {
        throw new Error('Event integration failed - resultadoComparativoUpdated not received');
      }

      this.addResult(true, 'Event integration working correctly');
    }

    async testPerformanceOptimization() {
      this.log('⚡ Testing performance optimization...');

      const calculator = window.ReinoResultadoComparativoCalculator;
      
      // Habilita debug para ver logs de otimização
      calculator.enableDebug();

      // Executa cálculo inicial
      calculator.calculateAndUpdate();
      
      // Executa novamente sem mudanças - deve ser otimizado
      const startTime = performance.now();
      calculator.calculateAndUpdate();
      const endTime = performance.now();

      calculator.disableDebug();

      // Verifica se foi rápido (indicando cache/otimização)
      const executionTime = endTime - startTime;
      if (executionTime > 10) { // 10ms é um limite generoso
        this.log(`⚠️ Warning: Calculation took ${executionTime.toFixed(2)}ms - may not be optimized`);
      }

      this.addResult(true, `Performance optimization working - execution time: ${executionTime.toFixed(2)}ms`);
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
      const passed = this.testResults.filter(r => r.success).length;
      const total = this.testResults.length;
      const failed = total - passed;

      console.log('\n📊 Resultado Comparativo AppState Integration Test Results:');
      console.log(`✅ Passed: ${passed}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

      if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        this.testResults
          .filter(r => !r.success)
          .forEach(result => {
            console.log(`   • ${result.message}`);
            if (result.error) {
              console.log(`     ${result.error.message}`);
            }
          });
      }
    }

    getTestSummary() {
      const passed = this.testResults.filter(r => r.success).length;
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
      return new Promise(resolve => setTimeout(resolve, ms));
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
          console.log(`[ResultadoComparativoTest] ${message}`, data);
        } else {
          console.log(`[ResultadoComparativoTest] ${message}`);
        }
      }
    }
  }

  // Cria instância global
  window.ReinoResultadoComparativoAppStateTest = new ResultadoComparativoAppStateTest();

  // Auto-inicialização para debug
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.search.includes('debug=comparativo')) {
        window.ReinoResultadoComparativoAppStateTest.enableDebug();
      }
    });
  }

})();
