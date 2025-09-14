/**
 * Resultado Comparativo Calculator - AppState Integration
 * Sistema para calcular e sincronizar valores Reino vs Tradicional
 * Versão sem imports/exports integrada com AppState centralizado
 */

(function () {
  'use strict';

  class ResultadoComparativoCalculator {
    constructor() {
      this.isInitialized = false;
      this.appState = null;
      this.debugMode = false;

      // Cache para otimização de performance
      this.cache = {
        lastPatrimony: 0,
        lastSelectedAssets: new Set(),
        lastTradicionalValue: 0,
        lastReinoValue: 0,
        lastCalculationHash: null,
      };

      this.reinoConfig = {
        description: 'Honorário consultivo transparente',
      };

      this.elements = {}; // Inicializa vazio para evitar erros
    }

    async init() {
      if (this.isInitialized) return;

      // Aguarda AppState estar disponível
      await this.waitForAppState();

      this.setupEventListeners();
      this.checkDOMElements(); // Não falha se elementos não existirem
      this.calculateAndUpdate();

      this.isInitialized = true;
      this.log('✅ ResultadoComparativoCalculator initialized with AppState');
    }

    async waitForAppState() {
      let attempts = 0;
      const maxAttempts = 50;

      while (!window.ReinoAppState && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (window.ReinoAppState) {
        this.appState = window.ReinoAppState;
        this.log('✅ AppState connected successfully');
      } else {
        this.log('⚠️ AppState not available, falling back to legacy mode');
      }
    }

    async waitForSystems() {
      if (!this.patrimonySystem) {
        await this.waitForSystem(
          () => window.ReinoCalculator?.systems?.patrimonySync || window.patrimonySystemInstance,
          'PatrimonySync'
        );
        this.patrimonySystem =
          window.ReinoCalculator?.systems?.patrimonySync || window.patrimonySystemInstance;
      }

      if (!this.resultadoSyncSystem) {
        if (window.ReinoCalculator?.systems?.resultadoSync || window.resultadoSyncInstance) {
          this.resultadoSyncSystem =
            window.ReinoCalculator?.systems?.resultadoSync || window.resultadoSyncInstance;
        }
      }
    }

    async waitForSystem(condition, name, maxAttempts = 30) {
      let attempts = 0;
      while (!condition() && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        attempts++;
      }
    }

    setupEventListeners() {
      document.addEventListener('patrimonyMainValueChanged', (e) => {
        this.onPatrimonyChange(e.detail.value);
      });

      document.addEventListener('allocationChanged', (e) => {
        this.onAllocationChange(e.detail);
      });

      document.addEventListener('assetSelectionChanged', (e) => {
        this.onAssetSelectionChange(e.detail.selectedAssets);
      });

      document.addEventListener('totalComissaoChanged', (e) => {
        this.onTradicionalValueChange(e.detail.total);
      });

      // Escuta mudanças no índice de giro
      document.addEventListener('rotationIndexChanged', (e) => {
        this.onRotationIndexChange(e.detail);
      });

      this.log('🎧 Event listeners configured');
    }

    checkDOMElements() {
      // Busca elementos mas não falha se não encontrar
      const elements = {
        tradicional: document.querySelector('[data-resultado="tradicional"]'),
        reino: document.querySelector('[data-resultado="reino"]'),
      };

      this.elements = elements;

      // Log apenas se debug estiver ativo
      if (window.location.search.includes('debug=true')) {
        Object.entries(elements).forEach(([key, element]) => {
          if (!element) {
            console.log(`ℹ️ Elemento ${key} não encontrado para resultado comparativo (opcional)`);
          }
        });
      }
    }

    onPatrimonyChange(patrimony) {
      if (this.cache.lastPatrimony !== patrimony) {
        this.cache.lastPatrimony = patrimony;
        this.calculateAndUpdate();
        this.log(`💰 Patrimony changed: ${this.formatCurrency(patrimony)}`);
      }
    }

    onAllocationChange(detail) {
      // Força recálculo quando alocações mudam
      this.calculateAndUpdate();
      this.log(`💼 Allocation changed, recalculating...`);
    }

    onAssetSelectionChange(selectedAssets) {
      const newAssetsSet = new Set(selectedAssets);
      if (!this.setsEqual(this.cache.lastSelectedAssets, newAssetsSet)) {
        this.cache.lastSelectedAssets = newAssetsSet;
        this.calculateAndUpdate();
        this.log(`🎯 Asset selection changed: ${selectedAssets.length} assets`);
      }
    }

    onRotationIndexChange(detail) {
      // Mudanças no índice de giro afetam cálculos tradicionais
      this.calculateAndUpdate();
      this.log(`🔄 Rotation index changed: ${detail.index}`);
    }

    onTradicionalValueChange(value) {
      if (this.cache.lastTradicionalValue !== value) {
        this.cache.lastTradicionalValue = value;

        // Atualiza DOM diretamente com o valor recebido, sem recalcular
        this.updateTradicionalDOMElement(value);

        // Calcula apenas o valor Reino (que não depende do tradicional)
        const reinoValues = this.calculateReinoValue();
        this.updateReinoDOMElement(reinoValues.annual);

        // AppState não precisa ser atualizado aqui - o DOM é suficiente

        this.log(`📊 Traditional value updated directly: ${this.formatCurrency(value)}`);
      }
    }

    onTotalComissaoChanged(event) {
      if (event.detail && typeof event.detail.total === 'number') {
        this.onTradicionalValueChange(event.detail.total);
      }
    }

    calculateAndUpdate() {
      try {
        if (!this.hasValidData()) return;

        // Gera hash para evitar recálculos desnecessários
        const currentHash = this.generateCalculationHash();
        if (currentHash === this.cache.lastCalculationHash) {
          this.log('⚡ Skipping calculation - no changes detected');
          return;
        }

        // Calcula valores Reino e Tradicional
        const reinoValues = this.calculateReinoValue();
        const traditionalValues = this.calculateTradicionalValue();

        // Atualiza elementos DOM
        this.updateDOMElements(reinoValues, traditionalValues);

        // Atualiza cache
        this.cache.lastReinoValue = reinoValues.annual;
        this.cache.lastTradicionalValue = traditionalValues.total;
        this.cache.lastCalculationHash = currentHash;

        // AppState não precisa ser atualizado aqui - o DOM é suficiente

        // Dispatch event para outros sistemas
        this.dispatchCalculationUpdate(
          traditionalValues,
          reinoValues.annual,
          reinoValues.patrimony
        );

        this.log(
          `📊 Calculation completed - Reino: ${reinoValues.formatted.annual}, Traditional: ${traditionalValues.formatted.total}`
        );
      } catch (error) {
        console.error('❌ [ResultadoComparativo] Error in calculation:', error);
      }
    }

    generateCalculationHash() {
      const patrimony = this.getMainPatrimony();
      const allocations = this.getSelectedAssetsWithValues();
      const rotationIndex = this.appState ? this.appState.getRotationIndex() : 2;

      return JSON.stringify({
        patrimony,
        allocations: allocations.map((a) => ({
          category: a.category,
          product: a.product,
          value: a.value,
        })),
        rotationIndex,
      });
    }

    updateDOMElements(reinoValues, traditionalValues) {
      this.updateReinoDOMElement(reinoValues.annual);
      this.updateTradicionalDOMElement(traditionalValues.total);
    }

    updateReinoDOMElement(value) {
      const reinoElement = document.querySelector('[data-resultado="reino"]');
      if (reinoElement) {
        const formattedValue = this.formatCurrencyForDisplay(value);
        reinoElement.textContent = formattedValue;
        this.log(`🏛️ Reino DOM updated: ${formattedValue}`);
      }
    }

    updateTradicionalDOMElement(value) {
      const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
      if (tradicionalElement) {
        const formattedValue = this.formatCurrencyForDisplay(value);
        tradicionalElement.textContent = formattedValue;
        this.log(`🏦 Traditional DOM updated: ${formattedValue}`);
      }
    }

    hasValidData() {
      return this.cache.lastPatrimony > 0;
    }

    getSelectedAssetsWithValues() {
      const assets = [];

      // Prioriza AppState se disponível
      if (this.appState) {
        const allocations = this.appState.getAllAllocations();
        const selectedAssetsArray = this.appState.getSelectedAssets();
        const selectedAssetsSet = new Set(selectedAssetsArray);

        Object.entries(allocations).forEach(([key, value]) => {
          if (value > 0 && selectedAssetsSet.has(key)) {
            const [category, product] = key.split(':');
            assets.push({
              category: category.trim(),
              product: product.trim(),
              value: value,
              key: key,
              percentage: 0, // Será calculado se necessário
            });
          }
        });

        return assets;
      }

      // Se temos sistema de resultado, usa ele
      if (this.resultadoSyncSystem) {
        const resultData = this.resultadoSyncSystem.getResultadoData();

        Object.values(resultData.patrimonio || {}).forEach((item) => {
          if (item.valor > 0) {
            assets.push({
              category: item.category,
              product: item.product,
              value: item.valor,
              percentage: item.percentual,
            });
          }
        });

        return assets;
      }

      // Fallback: busca diretamente no DOM
      const patrimonioItems = document.querySelectorAll('.patrimonio_interactive_item');

      patrimonioItems.forEach((item) => {
        const category = item.getAttribute('ativo-category');
        const product = item.getAttribute('ativo-product');
        const inputElement = item.querySelector('[input-settings="receive"]');

        if (category && product && inputElement) {
          const value = this.parseCurrencyValue(inputElement.value);

          if (value > 0) {
            assets.push({
              category,
              product,
              value,
              percentage: 0, // Será calculado se necessário
            });
          }
        }
      });

      return assets;
    }

    calculateTradicionalValue() {
      const selectedAssetsWithValues = this.getSelectedAssetsWithValues();
      let totalTradicional = 0;
      const details = [];

      selectedAssetsWithValues.forEach((asset) => {
        let custoAnual = 0;
        let taxaInfo = null;

        if (window.calcularCustoProduto) {
          const resultado = window.calcularCustoProduto(asset.value, asset.category, asset.product);
          custoAnual = resultado.custoMedio || 0;
          taxaInfo = {
            min: resultado.taxaMinima,
            max: resultado.taxaMaxima,
            media: resultado.taxaMedia,
          };
        } else {
          // Fallback para taxa padrão de 1%
          custoAnual = asset.value * 0.01;
          taxaInfo = { min: 1, max: 1, media: 1 };
        }

        totalTradicional += custoAnual;

        details.push({
          category: asset.category,
          product: asset.product,
          value: asset.value,
          custoAnual: custoAnual,
          taxaInfo: taxaInfo,
          formatted: {
            value: this.formatCurrency(asset.value),
            custoAnual: this.formatCurrency(custoAnual),
          },
        });
      });

      return {
        total: totalTradicional,
        details: details,
        count: details.length,
        formatted: {
          total: this.formatCurrency(totalTradicional),
        },
      };
    }

    calculateReinoValue() {
      const patrimony = this.getMainPatrimony();

      if (window.calcularCustoReino) {
        const reinoInfo = window.calcularCustoReino(patrimony);

        return {
          patrimony,
          taxaAnual: reinoInfo.taxaAnual,
          annual: reinoInfo.custoAnual,
          monthly: reinoInfo.custoMensal,
          faixa: reinoInfo.faixa,
          tipo: reinoInfo.tipo,
          formatted: {
            annual: this.formatCurrency(reinoInfo.custoAnual),
            monthly: this.formatCurrency(reinoInfo.custoMensal),
            patrimony: this.formatCurrency(patrimony),
          },
        };
      }

      // Fallback para cálculo manual se função não estiver disponível
      let custoAnual = 0;
      if (patrimony < 1000000) {
        custoAnual = 799; // Valor fixo corrigido
      } else if (patrimony < 3000000) {
        custoAnual = patrimony * 0.01;
      } else if (patrimony < 5000000) {
        custoAnual = patrimony * 0.009;
      } else if (patrimony < 10000000) {
        custoAnual = patrimony * 0.008;
      } else if (patrimony < 20000000) {
        custoAnual = patrimony * 0.007;
      } else if (patrimony < 50000000) {
        custoAnual = patrimony * 0.006;
      } else {
        custoAnual = patrimony * 0.005;
      }

      return {
        patrimony,
        taxaAnual: patrimony < 1000000 ? null : (custoAnual / patrimony) * 100,
        annual: custoAnual,
        monthly: custoAnual / 12,
        faixa: patrimony < 1000000 ? '< 1M' : `${(patrimony / 1000000).toFixed(1)}M`,
        tipo: patrimony < 1000000 ? 'fixo' : 'percentual',
        formatted: {
          annual: this.formatCurrency(custoAnual),
          monthly: this.formatCurrency(custoAnual / 12),
          patrimony: this.formatCurrency(patrimony),
        },
      };
    }

    getMainPatrimony() {
      // Prioriza AppState se disponível
      if (this.appState) {
        const patrimony = this.appState.getPatrimonio();
        return patrimony.value;
      }

      // Fallback para sistemas legados
      if (this.patrimonySystem) {
        return this.patrimonySystem.getMainValue() || 0;
      }

      // Fallback: busca diretamente no DOM
      const mainInput =
        document.querySelector('[is-main="true"] .currency-input.individual') ||
        document.querySelector('[input-settings="receive"][is-main="true"]');
      if (mainInput) {
        return this.parseCurrencyValue(mainInput.value);
      }

      return this.cache.lastPatrimony || 0;
    }

    dispatchCalculationUpdate(tradicionalResult, reinoValue, patrimony) {
      document.dispatchEvent(
        new CustomEvent('resultadoComparativoUpdated', {
          detail: {
            reino: {
              annual: reinoValue,
              patrimony: patrimony,
              formatted: {
                annual: this.formatCurrency(reinoValue),
                patrimony: this.formatCurrency(patrimony),
              },
            },
            tradicional: tradicionalResult,
            timestamp: new Date().toISOString(),
          },
        })
      );

      // Dispatch event para compatibilidade com outros sistemas
      document.dispatchEvent(
        new CustomEvent('totalComissaoChanged', {
          detail: {
            total: tradicionalResult.total,
            details: tradicionalResult.details,
          },
        })
      );
    }

    parseCurrencyValue(value) {
      if (!value || typeof value !== 'string') return 0;
      const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
      return parseFloat(cleanValue) || 0;
    }

    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    }

    formatCurrencyForDisplay(value) {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }

    setsEqual(a, b) {
      return a.size === b.size && [...a].every((x) => b.has(x));
    }

    forceUpdate() {
      this.cache.lastPatrimony = 0;
      this.cache.lastSelectedAssets.clear();
      this.calculateAndUpdate();
    }

    getResults() {
      return {
        patrimony: this.cache.lastPatrimony,
        tradicional: this.cache.lastTradicionalValue,
        reino: this.cache.lastReinoValue,
      };
    }

    reset() {
      this.cache.lastPatrimony = 0;
      this.cache.lastSelectedAssets.clear();
      this.cache.lastTradicionalValue = 0;
      this.cache.lastReinoValue = 0;

      // Atualizar elementos DOM diretamente
      const reinoElement = document.querySelector('[data-resultado="reino"]');
      if (reinoElement) {
        reinoElement.textContent = this.formatCurrencyForDisplay(0);
      }

      const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
      if (tradicionalElement) {
        tradicionalElement.textContent = this.formatCurrencyForDisplay(0);
      }
    }

    // ==================== DEBUG METHODS ====================

    enableDebug() {
      this.debugMode = true;
      this.log('🐛 Debug mode enabled for ResultadoComparativoCalculator');
    }

    disableDebug() {
      this.debugMode = false;
    }

    log(message, data = null) {
      if (this.debugMode) {
        if (data) {
          console.log(`[ResultadoComparativo] ${message}`, data);
        } else {
          console.log(`[ResultadoComparativo] ${message}`);
        }
      }
    }

    getDebugInfo() {
      return {
        isInitialized: this.isInitialized,
        hasAppState: !!this.appState,
        cache: this.cache,
        patrimony: this.getMainPatrimony(),
        selectedAssets: this.getSelectedAssetsWithValues(),
        debugMode: this.debugMode,
      };
    }

    // ==================== APPSTATE INTEGRATION METHODS ====================

    getAppStateSnapshot() {
      if (!this.appState) return null;

      return {
        patrimony: this.appState.getPatrimonio(),
        allocations: this.appState.getAllAllocations(),
        selectedAssets: Array.from(this.appState.getSelectedAssets()),
        commissionResults: this.appState.getCommissionResults(),
      };
    }
  }

  // Cria instância global
  window.ReinoResultadoComparativoCalculator = new ResultadoComparativoCalculator();

  // Auto-inicialização com delay para aguardar outros sistemas
  setTimeout(() => {
    window.ReinoResultadoComparativoCalculator.init();
  }, 1000);
})();
