/**
 * Commission Flow Analyzer
 * Analisa o fluxo completo de cálculo de comissões no fluxo normal do usuário
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class CommissionFlowAnalyzer {
    constructor() {
      this.eventLog = [];
      this.isMonitoring = false;
      this.debugMode = false;
    }

    startMonitoring() {
      this.debugMode = true;
      this.eventLog = [];
      this.isMonitoring = true;
      this.setupEventMonitoring();
      this.log('🔍 Commission flow monitoring started');
      this.analyzeCurrentState();
    }

    stopMonitoring() {
      this.isMonitoring = false;
      this.debugMode = false;
      this.log('🛑 Commission flow monitoring stopped');
    }

    setupEventMonitoring() {
      // Monitor all relevant events
      const events = [
        'allocationChanged',
        'totalComissaoChanged',
        'patrimonyMainValueChanged',
        'assetSelectionChanged',
        'appStateChanged',
        'simpleResultadoSyncReady',
        'rotationIndexChanged',
      ];

      events.forEach((eventName) => {
        document.addEventListener(eventName, (e) => {
          if (this.isMonitoring) {
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
        domState: this.captureDOMState(),
        appStateSnapshot: this.captureAppStateSnapshot(),
      };

      this.eventLog.push(logEntry);
      this.log(`📡 [${eventName}]`, {
        detail: detail,
        domTradicional: logEntry.domState.tradicional,
        supabaseLastCommission: logEntry.appStateSnapshot.supabaseLastCommission,
      });

      // Special analysis for commission events
      if (eventName === 'totalComissaoChanged') {
        this.analyzeCommissionEvent(detail, logEntry);
      }
    }

    analyzeCommissionEvent(detail, logEntry) {
      this.log('💰 Commission Event Analysis:', {
        eventTotal: detail.total,
        eventSource: detail.source,
        domBefore: logEntry.domState.tradicional,
        supabaseBefore: logEntry.appStateSnapshot.supabaseLastCommission,
      });

      // Check if DOM will be updated
      setTimeout(() => {
        const domAfter = this.captureDOMState();
        const supabaseAfter = this.captureAppStateSnapshot();

        this.log('💰 Commission Event Results:', {
          domAfter: domAfter.tradicional,
          supabaseAfter: supabaseAfter.supabaseLastCommission,
          domUpdated: domAfter.tradicional !== logEntry.domState.tradicional,
          supabaseUpdated:
            supabaseAfter.supabaseLastCommission !==
            logEntry.appStateSnapshot.supabaseLastCommission,
        });
      }, 100);
    }

    captureDOMState() {
      const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
      const totalComissaoElement = document.querySelector('.total-comissao-valor');

      return {
        tradicional: tradicionalElement ? tradicionalElement.textContent : 'NOT_FOUND',
        totalComissao: totalComissaoElement ? totalComissaoElement.textContent : 'NOT_FOUND',
      };
    }

    captureAppStateSnapshot() {
      const snapshot = {
        appStateCommission: null,
        supabaseLastCommission: null,
        allocations: null,
        selectedAssets: null,
      };

      if (window.ReinoAppState) {
        const appSnapshot = window.ReinoAppState.getStateSnapshot();
        snapshot.appStateCommission = appSnapshot.commission;
        snapshot.allocations = Object.keys(appSnapshot.allocations || {}).length;
        snapshot.selectedAssets = appSnapshot.selectedAssets
          ? appSnapshot.selectedAssets.length
          : 0;
      }

      if (window.ReinoSupabaseIntegration) {
        snapshot.supabaseLastCommission =
          window.ReinoSupabaseIntegration.lastCommissionData?.total || null;
      }

      return snapshot;
    }

    analyzeCurrentState() {
      this.log('🔍 Current State Analysis:');

      // Check modules
      const modules = {
        ReinoAppState: !!window.ReinoAppState,
        ReinoSupabaseIntegration: !!window.ReinoSupabaseIntegration,
        ReinoSimpleResultadoSync: !!window.ReinoSimpleResultadoSync,
        ReinoResultadoComparativoCalculator: !!window.ReinoResultadoComparativoCalculator,
      };

      this.log('📋 Modules:', modules);

      // Check current data
      const domState = this.captureDOMState();
      const appStateSnapshot = this.captureAppStateSnapshot();

      this.log('🖥️ DOM State:', domState);
      this.log('📊 AppState Snapshot:', appStateSnapshot);

      // Check if resultado-sync is properly initialized
      if (window.ReinoSimpleResultadoSync) {
        const sync = window.ReinoSimpleResultadoSync;
        this.log('🔄 ResultadoSync State:', {
          isInitialized: sync.isInitialized,
          hasAppState: !!sync.appState,
          selectedAssetsCount: sync.selectedAssets ? sync.selectedAssets.size : 0,
        });
      }

      // Trigger a test to see what happens
      this.triggerTestFlow();
    }

    triggerTestFlow() {
      this.log('🧪 Triggering test flow...');

      // Simulate normal user flow
      if (window.ReinoAppState) {
        const appState = window.ReinoAppState;

        // 1. Set patrimony
        this.log('1️⃣ Setting patrimony...');
        appState.setPatrimonio(1000000, 'flow-test');

        setTimeout(() => {
          // 2. Add asset selection
          this.log('2️⃣ Adding asset selection...');
          appState.addSelectedAsset('Renda Fixa', 'CDB', 'flow-test');

          setTimeout(() => {
            // 3. Set allocation
            this.log('3️⃣ Setting allocation...');
            appState.setAllocation('Renda Fixa', 'CDB', 500000, 'flow-test');

            setTimeout(() => {
              // 4. Force resultado-sync update
              this.log('4️⃣ Forcing resultado-sync update...');
              if (window.ReinoSimpleResultadoSync) {
                window.ReinoSimpleResultadoSync.forceSync();
              }

              setTimeout(() => {
                this.log('✅ Test flow completed - check results above');
              }, 200);
            }, 200);
          }, 200);
        }, 200);
      }
    }

    analyzeEventSequence() {
      this.log('📈 Event Sequence Analysis:');

      const commissionEvents = this.eventLog.filter((e) => e.event === 'totalComissaoChanged');
      const allocationEvents = this.eventLog.filter((e) => e.event === 'allocationChanged');

      this.log(
        `📊 Found ${commissionEvents.length} commission events and ${allocationEvents.length} allocation events`
      );

      if (commissionEvents.length === 0) {
        this.log('❌ NO COMMISSION EVENTS FOUND - This is the problem!');
        this.log('🔍 Checking why resultado-sync is not triggering events...');
        this.diagnoseResultadoSync();
      } else {
        this.log(
          '✅ Commission events found:',
          commissionEvents.map((e) => ({
            timestamp: e.timestamp,
            total: e.detail.total,
            source: e.detail.source,
          }))
        );
      }
    }

    diagnoseResultadoSync() {
      if (!window.ReinoSimpleResultadoSync) {
        this.log('❌ ReinoSimpleResultadoSync not found');
        return;
      }

      const sync = window.ReinoSimpleResultadoSync;

      this.log('🔍 ResultadoSync Diagnosis:', {
        isInitialized: sync.isInitialized,
        hasAppState: !!sync.appState,
        selectedAssets: Array.from(sync.selectedAssets || []),
        hasUpdateTotalComissaoMethod: typeof sync.updateTotalComissao === 'function',
        hasCalculateCommissionMethod: typeof sync.calculateCommissionForValue === 'function',
      });

      // Test if it can calculate
      if (typeof sync.calculateCommissionForValue === 'function') {
        try {
          const testCommission = sync.calculateCommissionForValue(500000, 'Renda Fixa', 'CDB');
          this.log('🧮 Test calculation result:', testCommission);
        } catch (error) {
          this.log('❌ Test calculation failed:', error.message);
        }
      }

      // Check if it has the right DOM elements
      const resultadoItems = document.querySelectorAll('.resultado-produto-item');
      this.log('🖥️ Found resultado-produto-item elements:', resultadoItems.length);
    }

    getEventLog() {
      return this.eventLog;
    }

    printEventLog() {
      console.log('📋 Complete Event Log:');
      this.eventLog.forEach((entry, index) => {
        console.log(`${index + 1}. [${entry.timestamp}] ${entry.event}:`, {
          detail: entry.detail,
          domState: entry.domState,
          appState: entry.appStateSnapshot,
        });
      });
    }

    // ==================== UTILITY METHODS ====================

    log(message, data = null) {
      const timestamp = new Date().toLocaleTimeString();
      if (data) {
        console.log(`[${timestamp}] [FlowAnalyzer] ${message}`, data);
      } else {
        console.log(`[${timestamp}] [FlowAnalyzer] ${message}`);
      }
    }

    // ==================== PUBLIC API ====================

    runCompleteAnalysis() {
      this.log('🚀 Running complete commission flow analysis...');

      this.startMonitoring();

      setTimeout(() => {
        this.analyzeEventSequence();
      }, 2000);

      setTimeout(() => {
        this.printEventLog();
        this.stopMonitoring();
        this.log('✅ Complete analysis finished');
      }, 3000);
    }
  }

  // Create global instance
  window.ReinoCommissionFlowAnalyzer = new CommissionFlowAnalyzer();

  // Auto-enable if debug parameter is present
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.search.includes('debug=flow')) {
        window.ReinoCommissionFlowAnalyzer.runCompleteAnalysis();
      }
    });
  }

  console.log(
    '🔧 Commission Flow Analyzer loaded. Run with: window.ReinoCommissionFlowAnalyzer.runCompleteAnalysis()'
  );
})();
