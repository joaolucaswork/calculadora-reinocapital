/**
 * Commission Flow Debug Module
 * Debugs the complete flow from allocation changes to commission updates
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class CommissionFlowDebug {
    constructor() {
      this.eventLog = [];
      this.isListening = false;
      this.debugMode = false;
    }

    startDebugging() {
      this.debugMode = true;
      this.eventLog = [];
      this.setupEventListeners();
      this.isListening = true;
      this.log('🐛 Commission flow debugging started');

      // Test current state
      this.testCurrentState();
    }

    stopDebugging() {
      this.debugMode = false;
      this.isListening = false;
      this.log('🛑 Commission flow debugging stopped');
    }

    setupEventListeners() {
      // Listen to all relevant events
      const events = [
        'allocationChanged',
        'totalComissaoChanged',
        'patrimonyMainValueChanged',
        'resultadoComparativoUpdated',
        'appStateChanged',
        'rotationIndexChanged',
      ];

      events.forEach((eventName) => {
        document.addEventListener(eventName, (e) => {
          if (this.debugMode) {
            this.logEvent(eventName, e.detail);
          }
        });
      });
    }

    logEvent(eventName, detail) {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        event: eventName,
        detail: detail || {},
      };

      this.eventLog.push(logEntry);
      this.log(`📡 Event: ${eventName}`, detail);

      // Special handling for commission events
      if (eventName === 'totalComissaoChanged') {
        this.verifyCommissionFlow(detail);
      }
    }

    verifyCommissionFlow(detail) {
      this.log('💰 Commission event details:', {
        total: detail.total,
        formatted: detail.formatted,
        source: detail.source,
        detailsCount: detail.details?.length || 0,
      });

      // Check if Supabase captured it
      if (window.ReinoSupabaseIntegration) {
        const supabaseData = window.ReinoSupabaseIntegration.lastCommissionData;
        if (supabaseData) {
          this.log('✅ Supabase captured commission:', {
            total: supabaseData.total,
            timestamp: supabaseData.timestamp,
          });
        } else {
          this.log('❌ Supabase did NOT capture commission data');
        }
      }

      // Check if DOM element was updated
      const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
      if (tradicionalElement) {
        this.log('✅ DOM element [data-resultado="tradicional"]:', {
          textContent: tradicionalElement.textContent,
          value: detail.total,
        });
      } else {
        this.log('❌ DOM element [data-resultado="tradicional"] not found');
      }
    }

    testCurrentState() {
      this.log('🔍 Testing current state...');

      // Check if modules are loaded
      const modules = {
        ReinoAppState: window.ReinoAppState,
        ReinoSupabaseIntegration: window.ReinoSupabaseIntegration,
        ReinoSimpleResultadoSync: window.ReinoSimpleResultadoSync,
        ReinoResultadoComparativoCalculator: window.ReinoResultadoComparativoCalculator,
      };

      Object.entries(modules).forEach(([name, module]) => {
        if (module) {
          this.log(`✅ ${name} is loaded`);
        } else {
          this.log(`❌ ${name} is NOT loaded`);
        }
      });

      // Check current commission data
      if (window.ReinoAppState) {
        const snapshot = window.ReinoAppState.getStateSnapshot();
        this.log('📊 Current AppState commission:', {
          value: snapshot.resultados?.comissaoTotal?.value,
          formatted: snapshot.resultados?.comissaoTotal?.formatted,
        });
      }

      // Check Supabase last captured data
      if (window.ReinoSupabaseIntegration) {
        const lastData = window.ReinoSupabaseIntegration.lastCommissionData;
        this.log('📊 Supabase last commission data:', lastData);
      }

      // Check DOM elements
      const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
      if (tradicionalElement) {
        this.log('📊 DOM [data-resultado="tradicional"]:', {
          textContent: tradicionalElement.textContent,
        });
      }

      // Trigger a test calculation
      this.triggerTestCalculation();
    }

    triggerTestCalculation() {
      this.log('🧪 Triggering test calculation...');

      // Try to trigger a recalculation
      if (window.ReinoSimpleResultadoSync) {
        setTimeout(() => {
          window.ReinoSimpleResultadoSync.updateVisibility();
          this.log('🔄 Triggered ReinoSimpleResultadoSync.updateVisibility()');
        }, 100);
      }

      if (window.ReinoResultadoComparativoCalculator) {
        setTimeout(() => {
          window.ReinoResultadoComparativoCalculator.calculateAndUpdate();
          this.log('🔄 Triggered ReinoResultadoComparativoCalculator.calculateAndUpdate()');
        }, 200);
      }
    }

    simulateAllocationChange() {
      this.log('🧪 Simulating allocation change...');

      // Find a patrimonio item to simulate change
      const patrimonioItem = document.querySelector(
        '.patrimonio_interactive_item .currency-input.individual'
      );
      if (patrimonioItem) {
        const currentValue = patrimonioItem.value;
        const testValue = '500.000,00';

        patrimonioItem.value = testValue;
        patrimonioItem.dispatchEvent(new Event('input', { bubbles: true }));

        this.log(`🔄 Simulated input change: ${currentValue} → ${testValue}`);

        // Restore original value after test
        setTimeout(() => {
          patrimonioItem.value = currentValue;
          patrimonioItem.dispatchEvent(new Event('input', { bubbles: true }));
          this.log(`🔄 Restored original value: ${currentValue}`);
        }, 2000);
      } else {
        this.log('❌ No patrimonio input found for simulation');
      }
    }

    getEventLog() {
      return this.eventLog;
    }

    printEventLog() {
      console.log('📋 Commission Flow Event Log:');
      this.eventLog.forEach((entry, index) => {
        console.log(`${index + 1}. [${entry.timestamp}] ${entry.event}:`, entry.detail);
      });
    }

    checkSupabaseIntegration() {
      this.log('🔍 Checking Supabase integration...');

      if (!window.ReinoSupabaseIntegration) {
        this.log('❌ ReinoSupabaseIntegration not found');
        return false;
      }

      const integration = window.ReinoSupabaseIntegration;

      this.log('📊 Supabase Integration Status:', {
        isReady: integration.isReady,
        hasClient: !!integration.client,
        lastCommissionData: integration.lastCommissionData,
        debugMode: integration.debugMode,
      });

      // Test the mapping function
      if (integration.mapFormDataToSupabase) {
        const testData = {
          patrimonio: 1000000,
          ativosEscolhidos: ['Renda Fixa:CDB'],
          alocacao: { 'Renda Fixa:CDB': 500000 },
        };

        try {
          const mapped = integration.mapFormDataToSupabase(testData);
          this.log('✅ Supabase mapping test successful:', {
            comissao_total_calculada: mapped.comissao_total_calculada,
            patrimonio: mapped.patrimonio,
          });
        } catch (error) {
          this.log('❌ Supabase mapping test failed:', error.message);
        }
      }

      return true;
    }

    // ==================== UTILITY METHODS ====================

    log(message, data = null) {
      const timestamp = new Date().toLocaleTimeString();
      if (data) {
        console.log(`[${timestamp}] [CommissionDebug] ${message}`, data);
      } else {
        console.log(`[${timestamp}] [CommissionDebug] ${message}`);
      }
    }

    // ==================== PUBLIC API ====================

    runFullDiagnostic() {
      this.log('🚀 Running full commission flow diagnostic...');

      this.startDebugging();

      setTimeout(() => {
        this.checkSupabaseIntegration();
      }, 500);

      setTimeout(() => {
        this.simulateAllocationChange();
      }, 1000);

      setTimeout(() => {
        this.printEventLog();
        this.stopDebugging();
        this.log('✅ Full diagnostic complete');
      }, 4000);
    }
  }

  // Create global instance
  window.ReinoCommissionFlowDebug = new CommissionFlowDebug();

  // Auto-enable debug mode if URL parameter is present
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.search.includes('debug=commission')) {
        window.ReinoCommissionFlowDebug.startDebugging();
      }
    });
  } else {
    if (window.location.search.includes('debug=commission')) {
      window.ReinoCommissionFlowDebug.startDebugging();
    }
  }
})();
