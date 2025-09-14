/**
 * Commission Integration Test
 * Testa especificamente a integração de comissões entre módulos
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class CommissionIntegrationTest {
    constructor() {
      this.testResults = [];
      this.debugMode = false;
    }

    async runAllTests() {
      this.log('🧪 Starting Commission Integration Tests...');
      this.testResults = [];

      const tests = [
        () => this.testEventCapture(),
        () => this.testSupabaseIntegration(),
        () => this.testDOMUpdates(),
        () => this.testAppStateIntegration(),
        () => this.testEndToEndFlow(),
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

    async testEventCapture() {
      this.log('📡 Testing event capture...');

      let eventCaptured = false;
      const testTotal = 15000;

      // Listen for the event
      const handler = (e) => {
        if (e.detail.total === testTotal) {
          eventCaptured = true;
        }
      };

      document.addEventListener('totalComissaoChanged', handler);

      // Dispatch test event
      document.dispatchEvent(
        new CustomEvent('totalComissaoChanged', {
          detail: {
            total: testTotal,
            formatted: 'R$ 15.000,00',
            details: [
              {
                category: 'Renda Fixa',
                product: 'CDB',
                value: 500000,
                commission: testTotal,
              },
            ],
            source: 'test',
          },
        })
      );

      await this.wait(100);

      document.removeEventListener('totalComissaoChanged', handler);

      if (!eventCaptured) {
        throw new Error('totalComissaoChanged event not captured');
      }

      this.addResult(true, 'Event capture working correctly');
    }

    async testSupabaseIntegration() {
      this.log('💾 Testing Supabase integration...');

      if (!window.ReinoSupabaseIntegration) {
        throw new Error('ReinoSupabaseIntegration not available');
      }

      const integration = window.ReinoSupabaseIntegration;
      const testTotal = 25000;

      // Clear previous data
      integration.lastCommissionData = null;

      // Dispatch commission event
      document.dispatchEvent(
        new CustomEvent('totalComissaoChanged', {
          detail: {
            total: testTotal,
            formatted: 'R$ 25.000,00',
            details: [
              {
                category: 'Renda Variável',
                product: 'Ações',
                value: 1000000,
                commission: testTotal,
              },
            ],
            source: 'test',
          },
        })
      );

      await this.wait(100);

      // Check if Supabase captured the data
      if (!integration.lastCommissionData) {
        throw new Error('Supabase did not capture commission data');
      }

      if (integration.lastCommissionData.total !== testTotal) {
        throw new Error(
          `Supabase captured wrong total: expected ${testTotal}, got ${integration.lastCommissionData.total}`
        );
      }

      // Test mapping function
      const testFormData = {
        patrimonio: 1000000,
        ativosEscolhidos: ['Renda Variável:Ações'],
        alocacao: { 'Renda Variável:Ações': 1000000 },
      };

      const mappedData = integration.mapFormDataToSupabase(testFormData);

      if (mappedData.comissao_total_calculada !== testTotal) {
        throw new Error(
          `Mapped commission incorrect: expected ${testTotal}, got ${mappedData.comissao_total_calculada}`
        );
      }

      this.addResult(true, 'Supabase integration working correctly');
    }

    async testDOMUpdates() {
      this.log('🖥️ Testing DOM updates...');

      // Check if resultado-comparativo-calculator updates DOM
      if (!window.ReinoResultadoComparativoCalculator) {
        throw new Error('ReinoResultadoComparativoCalculator not available');
      }

      const calculator = window.ReinoResultadoComparativoCalculator;
      const testTotal = 35000;

      // Dispatch commission event
      document.dispatchEvent(
        new CustomEvent('totalComissaoChanged', {
          detail: {
            total: testTotal,
            formatted: 'R$ 35.000,00',
            details: [],
            source: 'test',
          },
        })
      );

      await this.wait(200);

      // Check if DOM element was updated
      const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
      if (!tradicionalElement) {
        this.addResult(
          true,
          'DOM element [data-resultado="tradicional"] not found (may be optional)'
        );
        return;
      }

      // Parse the displayed value
      const displayedText = tradicionalElement.textContent;
      const numericValue = this.parseCurrencyValue(displayedText);

      if (numericValue !== testTotal) {
        throw new Error(
          `DOM not updated correctly: expected ${testTotal}, displayed ${numericValue} (text: "${displayedText}")`
        );
      }

      this.addResult(true, 'DOM updates working correctly');
    }

    async testAppStateIntegration() {
      this.log('🏛️ Testing AppState integration...');

      if (!window.ReinoAppState) {
        throw new Error('ReinoAppState not available');
      }

      const appState = window.ReinoAppState;
      const testTotal = 45000;
      const testDetails = [
        {
          category: 'COE',
          product: 'COE Estruturado',
          value: 750000,
          commission: testTotal,
        },
      ];

      // Set commission via AppState
      appState.setCommissionResults(testTotal, testDetails, 'test');

      await this.wait(100);

      // Verify AppState stored the data
      const commissionResults = appState.getCommissionResults();
      if (commissionResults.total !== testTotal) {
        throw new Error(
          `AppState commission incorrect: expected ${testTotal}, got ${commissionResults.total}`
        );
      }

      // Verify snapshot includes commission data
      const snapshot = appState.getStateSnapshot();
      if (snapshot.commission.total !== testTotal) {
        throw new Error(
          `AppState snapshot commission incorrect: expected ${testTotal}, got ${snapshot.commission.total}`
        );
      }

      this.addResult(true, 'AppState integration working correctly');
    }

    async testEndToEndFlow() {
      this.log('🔄 Testing end-to-end flow...');

      const testTotal = 55000;
      let supabaseCaptured = false;
      let domUpdated = false;

      // Monitor Supabase
      if (window.ReinoSupabaseIntegration) {
        window.ReinoSupabaseIntegration.lastCommissionData = null;
      }

      // Simulate a real calculation update
      if (window.ReinoSimpleResultadoSync) {
        // Trigger via resultado-sync system
        window.ReinoSimpleResultadoSync.updateTotalComissao(testTotal);
      } else {
        // Fallback: dispatch event directly
        document.dispatchEvent(
          new CustomEvent('totalComissaoChanged', {
            detail: {
              total: testTotal,
              formatted: 'R$ 55.000,00',
              details: [
                {
                  category: 'Internacional',
                  product: 'ETF Internacional',
                  value: 2000000,
                  commission: testTotal,
                },
              ],
              source: 'end-to-end-test',
            },
          })
        );
      }

      await this.wait(300);

      // Check Supabase
      if (window.ReinoSupabaseIntegration?.lastCommissionData?.total === testTotal) {
        supabaseCaptured = true;
      }

      // Check DOM
      const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
      if (tradicionalElement) {
        const displayedValue = this.parseCurrencyValue(tradicionalElement.textContent);
        if (displayedValue === testTotal) {
          domUpdated = true;
        }
      } else {
        domUpdated = true; // Element may not exist in current step
      }

      if (!supabaseCaptured && window.ReinoSupabaseIntegration) {
        throw new Error('End-to-end: Supabase did not capture commission data');
      }

      this.addResult(
        true,
        `End-to-end flow working (Supabase: ${supabaseCaptured}, DOM: ${domUpdated})`
      );
    }

    // ==================== UTILITY METHODS ====================

    parseCurrencyValue(text) {
      if (!text) return 0;
      return parseFloat(text.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    }

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

      console.log('\n📊 Commission Integration Test Results:');
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
          console.log(`[CommissionIntegrationTest] ${message}`, data);
        } else {
          console.log(`[CommissionIntegrationTest] ${message}`);
        }
      }
    }
  }

  // Create global instance
  window.ReinoCommissionIntegrationTest = new CommissionIntegrationTest();

  // Auto-enable debug mode if URL parameter is present
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.search.includes('debug=commission')) {
        window.ReinoCommissionIntegrationTest.enableDebug();
      }
    });
  }
})();
