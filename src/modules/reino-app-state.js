/**
 * Reino AppState - Centralized State Management
 * Versão sem imports/exports para uso direto no Webflow
 *
 * Fonte única de verdade para todo o estado da aplicação
 * Segue padrão event-driven conforme recomendações de arquitetura
 */

(function () {
  'use strict';

  class ReinoAppState {
    constructor() {
      this.isInitialized = false;
      this.debugMode = false;

      // Estado centralizado - única fonte de verdade
      this.state = {
        // Patrimônio principal
        patrimonio: {
          value: 0,
          formatted: 'R$ 0,00',
        },

        // Ativos selecionados pelo usuário
        ativosSelecionados: new Set(),

        // Alocações por produto/categoria
        alocacoes: new Map(),

        // Índice de giro atual
        indiceGiro: {
          value: 2,
          calculations: new Map(),
        },

        // Resultados calculados
        resultados: {
          comissaoTotal: {
            value: 0,
            formatted: 'R$ 0,00',
            details: [],
          },
          patrimonioRestante: {
            value: 0,
            formatted: 'R$ 0,00',
          },
          percentualAlocado: 0,
        },

        // Metadados do estado
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: '1.0.0',
          isValid: true,
          validationErrors: [],
        },
      };

      // Event listeners registrados
      this.eventListeners = new Map();

      // Histórico de mudanças (para debug)
      this.changeHistory = [];
      this.maxHistorySize = 50;
    }

    init() {
      if (this.isInitialized) {
        return;
      }

      console.log('🚀 ReinoAppState: Starting initialization...');

      try {
        this.setupEventSystem();
        this.loadInitialState();
        this.setupValidation();
        this.isInitialized = true;

        console.log('✅ ReinoAppState initialized successfully');

        // Notifica que o AppState está pronto
        this.dispatchEvent('appStateReady', {
          version: this.state.metadata.version,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('❌ Failed to initialize ReinoAppState:', error);
      }
    }

    // ==================== PATRIMÔNIO ====================

    setPatrimonio(value, source = 'unknown') {
      const oldValue = this.state.patrimonio.value;
      const numericValue = this.parseNumericValue(value);

      this.state.patrimonio.value = numericValue;
      this.state.patrimonio.formatted = this.formatCurrency(numericValue);

      this.updateMetadata();
      this.addToHistory('patrimonio', { oldValue, newValue: numericValue, source });

      // Recalcula patrimônio restante
      this.recalculateRemainingPatrimony();

      this.dispatchEvent('patrimonyMainValueChanged', {
        value: numericValue,
        formatted: this.state.patrimonio.formatted,
        oldValue,
        source,
      });

      this.log(`💰 Patrimônio updated: ${this.state.patrimonio.formatted} (source: ${source})`);
    }

    getPatrimonio() {
      return {
        value: this.state.patrimonio.value,
        formatted: this.state.patrimonio.formatted,
      };
    }

    // ==================== ATIVOS SELECIONADOS ====================

    addSelectedAsset(category, product, source = 'unknown') {
      const assetKey = this.normalizeAssetKey(category, product);
      const wasSelected = this.state.ativosSelecionados.has(assetKey);

      this.state.ativosSelecionados.add(assetKey);
      this.updateMetadata();

      if (!wasSelected) {
        this.addToHistory('assetAdded', { category, product, assetKey, source });

        this.dispatchEvent('assetSelectionChanged', {
          selectedAssets: Array.from(this.state.ativosSelecionados),
          selectedCount: this.state.ativosSelecionados.size,
          action: 'added',
          asset: { category, product, key: assetKey },
          source,
        });

        this.log(`📊 Asset added: ${category} - ${product} (source: ${source})`);
      }
    }

    removeSelectedAsset(category, product, source = 'unknown') {
      const assetKey = this.normalizeAssetKey(category, product);
      const wasSelected = this.state.ativosSelecionados.has(assetKey);

      this.state.ativosSelecionados.delete(assetKey);

      // Remove alocação correspondente
      this.state.alocacoes.delete(assetKey);

      this.updateMetadata();

      if (wasSelected) {
        this.addToHistory('assetRemoved', { category, product, assetKey, source });

        this.dispatchEvent('assetSelectionChanged', {
          selectedAssets: Array.from(this.state.ativosSelecionados),
          selectedCount: this.state.ativosSelecionados.size,
          action: 'removed',
          asset: { category, product, key: assetKey },
          source,
        });

        this.log(`📊 Asset removed: ${category} - ${product} (source: ${source})`);
      }
    }

    getSelectedAssets() {
      return Array.from(this.state.ativosSelecionados);
    }

    isAssetSelected(category, product) {
      const assetKey = this.normalizeAssetKey(category, product);
      return this.state.ativosSelecionados.has(assetKey);
    }

    // ==================== ALOCAÇÕES ====================

    setAllocation(category, product, value, source = 'unknown') {
      const assetKey = this.normalizeAssetKey(category, product);
      const numericValue = this.parseNumericValue(value);
      const oldValue = this.state.alocacoes.get(assetKey) || 0;

      if (numericValue > 0) {
        this.state.alocacoes.set(assetKey, numericValue);
        // Garante que o ativo está selecionado
        this.addSelectedAsset(category, product, 'allocation');
      } else {
        this.state.alocacoes.delete(assetKey);
      }

      this.updateMetadata();
      this.recalculateRemainingPatrimony();
      this.addToHistory('allocation', { assetKey, oldValue, newValue: numericValue, source });

      this.dispatchEvent('allocationChanged', {
        allocations: Object.fromEntries(this.state.alocacoes),
        totalAllocated: this.getTotalAllocated(),
        remainingPatrimony: this.state.resultados.patrimonioRestante.value,
        percentualAlocado: this.state.resultados.percentualAlocado,
        changedAsset: { category, product, key: assetKey, value: numericValue },
        source,
      });

      this.log(
        `💼 Allocation updated: ${assetKey} = ${this.formatCurrency(numericValue)} (source: ${source})`
      );
    }

    getAllocation(category, product) {
      const assetKey = this.normalizeAssetKey(category, product);
      return this.state.alocacoes.get(assetKey) || 0;
    }

    getAllAllocations() {
      return Object.fromEntries(this.state.alocacoes);
    }

    getTotalAllocated() {
      return Array.from(this.state.alocacoes.values()).reduce((sum, value) => sum + value, 0);
    }

    // ==================== ÍNDICE DE GIRO ====================

    setRotationIndex(index, calculations = null, source = 'unknown') {
      const oldIndex = this.state.indiceGiro.value;

      this.state.indiceGiro.value = index;
      if (calculations) {
        this.state.indiceGiro.calculations = new Map(Object.entries(calculations));
      }

      this.updateMetadata();
      this.addToHistory('rotationIndex', { oldIndex, newIndex: index, source });

      this.dispatchEvent('rotationIndexChanged', {
        index,
        oldIndex,
        calculations: calculations || Object.fromEntries(this.state.indiceGiro.calculations),
        source,
      });

      this.log(`🔄 Rotation index updated: ${index} (source: ${source})`);
    }

    getRotationIndex() {
      return {
        value: this.state.indiceGiro.value,
        calculations: Object.fromEntries(this.state.indiceGiro.calculations),
      };
    }

    // ==================== RESULTADOS ====================

    setCommissionResults(total, details = [], source = 'unknown') {
      const oldTotal = this.state.resultados.comissaoTotal.value;
      const numericTotal = this.parseNumericValue(total);

      this.state.resultados.comissaoTotal.value = numericTotal;
      this.state.resultados.comissaoTotal.formatted = this.formatCurrency(numericTotal);
      this.state.resultados.comissaoTotal.details = details;

      this.updateMetadata();
      this.addToHistory('commission', { oldTotal, newTotal: numericTotal, source });

      this.dispatchEvent('totalComissaoChanged', {
        total: numericTotal,
        formatted: this.state.resultados.comissaoTotal.formatted,
        details,
        oldTotal,
        source,
      });

      this.log(
        `💵 Commission updated: ${this.state.resultados.comissaoTotal.formatted} (source: ${source})`
      );
    }

    getCommissionResults() {
      return {
        total: this.state.resultados.comissaoTotal.value,
        formatted: this.state.resultados.comissaoTotal.formatted,
        details: this.state.resultados.comissaoTotal.details,
      };
    }

    // ==================== UTILITÁRIOS ====================

    normalizeAssetKey(category, product) {
      return `${category.toLowerCase().trim()}:${product.toLowerCase().trim()}`;
    }

    parseNumericValue(value) {
      if (typeof value === 'number') {
        return value;
      }
      if (!value) {
        return 0;
      }

      const cleaned = value
        .toString()
        .replace(/[^\d,]/g, '')
        .replace(',', '.');
      return parseFloat(cleaned) || 0;
    }

    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    }

    recalculateRemainingPatrimony() {
      const totalAllocated = this.getTotalAllocated();
      const remaining = this.state.patrimonio.value - totalAllocated;
      const percentual =
        this.state.patrimonio.value > 0 ? (totalAllocated / this.state.patrimonio.value) * 100 : 0;

      this.state.resultados.patrimonioRestante.value = remaining;
      this.state.resultados.patrimonioRestante.formatted = this.formatCurrency(remaining);
      this.state.resultados.percentualAlocado = percentual;
    }

    // ==================== SISTEMA DE EVENTOS ====================

    setupEventSystem() {
      // Sistema de eventos já configurado no constructor
      this.log('📡 Event system ready');
    }

    dispatchEvent(eventName, detail) {
      const event = new CustomEvent(eventName, { detail });
      document.dispatchEvent(event);

      if (this.debugMode) {
        this.log(`📤 Event dispatched: ${eventName}`, detail);
      }
    }

    // ==================== VALIDAÇÃO ====================

    setupValidation() {
      // Validação será implementada na próxima task
      this.state.metadata.isValid = true;
      this.state.metadata.validationErrors = [];
    }

    // ==================== METADADOS E HISTÓRICO ====================

    updateMetadata() {
      this.state.metadata.lastUpdated = new Date().toISOString();
    }

    addToHistory(action, data) {
      this.changeHistory.push({
        action,
        data,
        timestamp: new Date().toISOString(),
      });

      // Limita o tamanho do histórico
      if (this.changeHistory.length > this.maxHistorySize) {
        this.changeHistory.shift();
      }
    }

    // ==================== ESTADO INICIAL ====================

    loadInitialState() {
      // Carrega estado inicial dos módulos existentes se disponível
      this.log('📥 Loading initial state...');

      // Será implementado para migrar dados dos módulos existentes
    }

    // ==================== API PÚBLICA ====================

    getFullState() {
      return JSON.parse(JSON.stringify(this.state));
    }

    getStateSnapshot() {
      return {
        patrimonio: this.getPatrimonio(),
        selectedAssets: this.getSelectedAssets(),
        allocations: this.getAllAllocations(),
        rotationIndex: this.getRotationIndex(),
        commission: this.getCommissionResults(),
        metadata: this.state.metadata,
      };
    }

    // ==================== DEBUG ====================

    enableDebug() {
      this.debugMode = true;
      this.log('🐛 Debug mode enabled');
    }

    disableDebug() {
      this.debugMode = false;
    }

    log(message, data = null) {
      if (this.debugMode) {
        if (data) {
          console.log(`[ReinoAppState] ${message}`, data);
        } else {
          console.log(`[ReinoAppState] ${message}`);
        }
      }
    }

    getDebugInfo() {
      return {
        state: this.getFullState(),
        history: this.changeHistory.slice(-10), // Últimas 10 mudanças
        isInitialized: this.isInitialized,
        debugMode: this.debugMode,
      };
    }
  }

  // Criar instância global
  window.ReinoAppState = new ReinoAppState();

  // Auto-inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoAppState.init();
    });
  } else {
    window.ReinoAppState.init();
  }
})();
