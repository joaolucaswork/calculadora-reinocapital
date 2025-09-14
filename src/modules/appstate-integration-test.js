/**
 * AppState Integration Test - Temporary Testing Module
 * Versão sem imports/exports para uso direto no Webflow
 *
 * Testa a integração entre AppState e módulos migrados
 * REMOVER após validação completa
 */

(function () {
  'use strict';

  class AppStateIntegrationTest {
    constructor() {
      this.isInitialized = false;
      this.testResults = [];
      this.debugMode = true;
    }

    init() {
      if (this.isInitialized) return;

      // Aguarda todos os módulos estarem prontos
      this.waitForDependencies();
    }

    async waitForDependencies() {
      const maxAttempts = 200; // Aumenta tentativas
      let attempts = 0;

      this.log('🔍 Waiting for dependencies...');

      while (attempts < maxAttempts) {
        const appStateExists = !!window.ReinoAppState;
        const appStateInitialized = appStateExists && window.ReinoAppState.isInitialized;
        const eventContractsExists = !!window.ReinoEventContracts;
        const eventContractsInitialized =
          eventContractsExists && window.ReinoEventContracts.isInitialized;

        // Log detalhado do status
        if (attempts % 20 === 0) {
          // Log a cada 2 segundos
          this.log(`📊 Dependency status (attempt ${attempts}):`, {
            appStateExists,
            appStateInitialized,
            eventContractsExists,
            eventContractsInitialized,
          });
        }

        if (appStateInitialized && eventContractsInitialized) {
          this.log('✅ All dependencies ready!');
          this.setupTests();
          this.isInitialized = true;
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        this.log('❌ AppState Integration Test: Dependencies not found after 20 seconds');
        this.log('🔍 Final status:', {
          appStateExists: !!window.ReinoAppState,
          appStateInitialized: window.ReinoAppState?.isInitialized,
          eventContractsExists: !!window.ReinoEventContracts,
          eventContractsInitialized: window.ReinoEventContracts?.isInitialized,
        });
      }
    }

    setupTests() {
      this.log('🧪 Setting up AppState integration tests...');

      // Habilita debug básico nos módulos (sem spam)
      if (window.ReinoAppState.enableDebug) {
        window.ReinoAppState.enableDebug();
      }
      if (window.ReinoEventContracts.setLogLevel) {
        window.ReinoEventContracts.setLogLevel('basic'); // Modo básico sem spam
      }

      // Testa eventos básicos
      this.testBasicEvents();

      // Testa integração patrimônio
      setTimeout(() => {
        this.testPatrimonyIntegration();
      }, 1000);

      // Testa integração asset selection
      setTimeout(() => {
        this.testAssetSelectionIntegration();
      }, 1500);

      // Disponibiliza API de teste
      window.ReinoAppStateTest = {
        runTests: () => this.runAllTests(),
        getResults: () => this.testResults,
        testPatrimony: (value) => this.testPatrimonyValue(value),
        testAssetSelection: (category, product) => this.testAssetSelectionValue(category, product),
        getAppStateSnapshot: () => window.ReinoAppState?.getStateSnapshot(),
        enableDebug: () => this.enableDebugMode(),
        disableDebug: () => this.disableDebugMode(),
        setLogLevel: (level) => this.setLogLevel(level),
        checkDependencies: () => this.checkDependencies(),
        forceInit: () => this.forceInitialization(),
      };

      this.log('✅ AppState integration tests ready');
      this.log('💡 Use window.ReinoAppStateTest.runTests() to run all tests');
      this.log('🔧 Use window.ReinoAppStateTest.setLogLevel("off") to disable event spam');
    }

    testBasicEvents() {
      this.log('🔍 Testing basic event system...');

      // Testa se eventos são disparados corretamente
      let eventReceived = false;

      const testListener = (e) => {
        eventReceived = true;
        this.log('✅ Test event received:', e.detail);
        document.removeEventListener('testEvent', testListener);
      };

      document.addEventListener('testEvent', testListener);

      // Dispara evento de teste
      document.dispatchEvent(
        new CustomEvent('testEvent', {
          detail: { test: true, timestamp: new Date().toISOString() },
        })
      );

      setTimeout(() => {
        this.addTestResult('Basic Events', eventReceived, 'Event dispatch and listening');
      }, 100);
    }

    testPatrimonyIntegration() {
      this.log('🔍 Testing patrimony integration...');

      if (!window.ReinoAppState) {
        this.addTestResult('Patrimony Integration', false, 'AppState not available');
        return;
      }

      // Testa set/get patrimônio
      const testValue = 1000000;
      const initialValue = window.ReinoAppState.getPatrimonio().value;

      // Listener para evento
      let eventFired = false;
      const eventListener = (e) => {
        eventFired = true;
        this.log('✅ Patrimony event received:', e.detail);
        document.removeEventListener('patrimonyMainValueChanged', eventListener);
      };

      document.addEventListener('patrimonyMainValueChanged', eventListener);

      // Testa mudança de valor
      window.ReinoAppState.setPatrimonio(testValue, 'integration-test');

      setTimeout(() => {
        const newValue = window.ReinoAppState.getPatrimonio().value;
        const success = newValue === testValue && eventFired;

        this.addTestResult(
          'Patrimony Integration',
          success,
          `Set: ${testValue}, Got: ${newValue}, Event: ${eventFired}`
        );

        // Restaura valor inicial
        if (initialValue !== testValue) {
          window.ReinoAppState.setPatrimonio(initialValue, 'integration-test-restore');
        }
      }, 200);
    }

    testPatrimonyValue(value) {
      this.log(`🧪 Testing patrimony value: ${value}`);

      if (!window.ReinoAppState) {
        this.log('❌ AppState not available');
        return;
      }

      const oldValue = window.ReinoAppState.getPatrimonio().value;
      window.ReinoAppState.setPatrimonio(value, 'manual-test');
      const newValue = window.ReinoAppState.getPatrimonio().value;

      this.log(`📊 Patrimony test result: ${oldValue} → ${newValue}`);
      return { oldValue, newValue, success: newValue === value };
    }

    testAssetSelectionIntegration() {
      this.log('🔍 Testing asset selection integration...');

      if (!window.ReinoAppState) {
        this.addTestResult('Asset Selection Integration', false, 'AppState not available');
        return;
      }

      // Testa add/remove asset
      const testCategory = 'Renda Fixa';
      const testProduct = 'CDB';
      const initialAssets = window.ReinoAppState.getSelectedAssets();

      // Listener para evento
      let eventFired = false;
      const eventListener = (e) => {
        eventFired = true;
        this.log('✅ Asset selection event received:', e.detail);
        document.removeEventListener('assetSelectionChanged', eventListener);
      };

      document.addEventListener('assetSelectionChanged', eventListener);

      // Testa adição de ativo
      window.ReinoAppState.addSelectedAsset(testCategory, testProduct, 'integration-test');

      setTimeout(() => {
        const newAssets = window.ReinoAppState.getSelectedAssets();
        const assetKey = `${testCategory.toLowerCase()}|${testProduct.toLowerCase()}`;
        const assetAdded = newAssets.includes(assetKey);

        this.addTestResult(
          'Asset Selection Integration',
          assetAdded && eventFired,
          `Asset added: ${assetAdded}, Event: ${eventFired}`
        );

        // Remove o ativo de teste
        if (assetAdded) {
          window.ReinoAppState.removeSelectedAsset(
            testCategory,
            testProduct,
            'integration-test-cleanup'
          );
        }
      }, 200);
    }

    testAssetSelectionValue(category, product) {
      this.log(`🧪 Testing asset selection: ${category} - ${product}`);

      if (!window.ReinoAppState) {
        this.log('❌ AppState not available');
        return;
      }

      const initialAssets = window.ReinoAppState.getSelectedAssets();
      const assetKey = `${category.toLowerCase()}|${product.toLowerCase()}`;
      const wasSelected = initialAssets.includes(assetKey);

      if (wasSelected) {
        window.ReinoAppState.removeSelectedAsset(category, product, 'manual-test');
      } else {
        window.ReinoAppState.addSelectedAsset(category, product, 'manual-test');
      }

      const newAssets = window.ReinoAppState.getSelectedAssets();
      const isNowSelected = newAssets.includes(assetKey);

      this.log(`📊 Asset selection test result: ${category} - ${product}`, {
        wasSelected,
        isNowSelected,
        success: wasSelected !== isNowSelected,
      });

      return { wasSelected, isNowSelected, success: wasSelected !== isNowSelected };
    }

    runAllTests() {
      this.log('🚀 Running all AppState integration tests...');
      this.testResults = [];

      this.testBasicEvents();
      setTimeout(() => this.testPatrimonyIntegration(), 500);

      setTimeout(() => {
        this.log('📋 Test Results Summary:');
        this.testResults.forEach((result) => {
          const status = result.success ? '✅' : '❌';
          this.log(`${status} ${result.name}: ${result.details}`);
        });

        const passedTests = this.testResults.filter((r) => r.success).length;
        const totalTests = this.testResults.length;
        this.log(`📊 Tests passed: ${passedTests}/${totalTests}`);

        return this.testResults;
      }, 1500);
    }

    addTestResult(name, success, details) {
      const result = {
        name,
        success,
        details,
        timestamp: new Date().toISOString(),
      };

      this.testResults.push(result);

      const status = success ? '✅' : '❌';
      this.log(`${status} Test: ${name} - ${details}`);
    }

    enableDebugMode() {
      this.debugMode = true;
      if (window.ReinoAppState && window.ReinoAppState.enableDebug) {
        window.ReinoAppState.enableDebug();
      }
      if (window.ReinoEventContracts && window.ReinoEventContracts.enableDebug) {
        window.ReinoEventContracts.enableDebug();
      }
      this.log('🐛 Debug mode enabled for all AppState modules');
    }

    disableDebugMode() {
      this.debugMode = false;
      if (window.ReinoAppState && window.ReinoAppState.disableDebug) {
        window.ReinoAppState.disableDebug();
      }
      if (window.ReinoEventContracts && window.ReinoEventContracts.disableDebug) {
        window.ReinoEventContracts.disableDebug();
      }
      this.log('🔇 Debug mode disabled for all AppState modules');
    }

    setLogLevel(level) {
      this.log(`🔧 Setting log level to: ${level}`);

      if (window.ReinoEventContracts && window.ReinoEventContracts.setLogLevel) {
        window.ReinoEventContracts.setLogLevel(level);
      }

      // Ajusta debug mode local baseado no nível
      switch (level) {
        case 'off':
          this.debugMode = false;
          break;
        case 'basic':
        case 'verbose':
          this.debugMode = true;
          break;
      }
    }

    log(message, data = null) {
      if (this.debugMode) {
        if (data) {
          console.log(`[AppStateTest] ${message}`, data);
        } else {
          console.log(`[AppStateTest] ${message}`);
        }
      }
    }

    checkDependencies() {
      const status = {
        appStateExists: !!window.ReinoAppState,
        appStateInitialized: window.ReinoAppState?.isInitialized,
        eventContractsExists: !!window.ReinoEventContracts,
        eventContractsInitialized: window.ReinoEventContracts?.isInitialized,
        documentReady: document.readyState,
        timestamp: new Date().toISOString(),
      };

      console.log('🔍 Dependency Check:', status);
      return status;
    }

    forceInitialization() {
      console.log('🔧 Force initializing dependencies...');

      if (window.ReinoAppState && !window.ReinoAppState.isInitialized) {
        console.log('🚀 Force initializing AppState...');
        window.ReinoAppState.init();
      }

      if (window.ReinoEventContracts && !window.ReinoEventContracts.isInitialized) {
        console.log('🚀 Force initializing EventContracts...');
        window.ReinoEventContracts.init();
      }

      setTimeout(() => {
        this.checkDependencies();
        if (!this.isInitialized) {
          this.waitForDependencies();
        }
      }, 500);
    }

    getDebugInfo() {
      return {
        isInitialized: this.isInitialized,
        testResults: this.testResults,
        appStateAvailable: !!window.ReinoAppState,
        eventContractsAvailable: !!window.ReinoEventContracts,
        debugMode: this.debugMode,
      };
    }
  }

  // Criar instância global
  window.ReinoAppStateIntegrationTest = new AppStateIntegrationTest();

  // Auto-inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoAppStateIntegrationTest.init();
    });
  } else {
    window.ReinoAppStateIntegrationTest.init();
  }
})();
