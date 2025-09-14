/**
 * Sistema Simples de Sincronização de Resultados - Versão Webflow TXT
 * Funciona diretamente com atributos ativo-category e ativo-product
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  const Utils = {
    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    },

    parseCurrencyValue(value) {
      if (!value || typeof value !== 'string') return 0;
      const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
      return parseFloat(cleanValue) || 0;
    },
  };

  class SimpleResultadoSync {
    constructor() {
      this.isInitialized = false;
      this.selectedAssets = new Set();
      this.appState = null;
      this.debugMode = false;
    }

    async init() {
      if (this.isInitialized) return;

      await this.waitForAppState();
      this.setupEventListeners();
      this.isInitialized = true;

      document.dispatchEvent(new CustomEvent('simpleResultadoSyncReady'));
      this.log('✅ SimpleResultadoSync initialized with AppState integration');
    }

    async waitForAppState() {
      const maxAttempts = 50;
      let attempts = 0;

      while (attempts < maxAttempts) {
        if (window.ReinoAppState && window.ReinoAppState.isInitialized) {
          this.appState = window.ReinoAppState;
          this.log('🔗 AppState integration enabled');
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        this.log('⚠️ AppState not found, falling back to legacy mode');
      }
    }

    setupEventListeners() {
      // AppState events (preferred)
      if (this.appState) {
        document.addEventListener('appStateChanged', (e) => {
          this.handleAppStateChange(e.detail);
        });
      }

      // Legacy events (fallback)
      document.addEventListener('assetSelectionChanged', (e) => {
        this.selectedAssets = new Set(e.detail.selectedAssets || []);
        this.updateVisibility();
      });

      document.addEventListener('currencyInputChanged', () => {
        this.updateVisibility();
      });

      document.addEventListener('patrimonyValueChanged', () => {
        this.updateVisibility();
      });

      document.addEventListener('allocationChanged', () => {
        this.updateVisibility();
      });

      // Rotation index changes trigger recalculation
      document.addEventListener('rotationIndexChanged', () => {
        this.updateVisibility();
      });
    }

    handleAppStateChange(detail) {
      if (!detail.snapshot) return;

      const snapshot = detail.snapshot;

      // Update selected assets from AppState
      if (snapshot.selectedAssets) {
        this.selectedAssets = new Set(snapshot.selectedAssets);
      }

      // Trigger recalculation
      this.updateVisibility();
      this.log('📊 Updated from AppState change');
    }

    updateVisibility() {
      const hasSelectedAssetsWithValue = this.hasSelectedAssetsWithValue();

      this.updateMainContainers(hasSelectedAssetsWithValue);

      if (!hasSelectedAssetsWithValue) {
        this.hideAllProducts();
        return;
      }

      this.updateProducts();
    }

    hasSelectedAssetsWithValue() {
      const allProducts = document.querySelectorAll('.patrimonio_interactive_item');

      for (const item of allProducts) {
        const category = item.getAttribute('ativo-category');
        const product = item.getAttribute('ativo-product');

        if (this.isAssetSelected(category, product) && this.hasValue(item)) {
          return true;
        }
      }
      return false;
    }

    isAssetSelected(category, product) {
      const normalizedKey = `${category.toLowerCase().trim()}|${product.toLowerCase().trim()}`;
      return this.selectedAssets.has(normalizedKey);
    }

    hasValue(patrimonioItem) {
      const inputElement = patrimonioItem.querySelector('.currency-input.individual');
      if (!inputElement) return false;

      const value = Utils.parseCurrencyValue(inputElement.value);
      return value > 0;
    }

    updateMainContainers(show) {
      const patrimonioContainer = document.querySelector('.patrimonio-ativos-group');
      const comissaoContainer = document.querySelector('.ativos-content-float');

      [patrimonioContainer, comissaoContainer].forEach((container) => {
        if (container) {
          container.style.display = show ? '' : 'none';
        }
      });
    }

    hideAllProducts() {
      const resultadoItems = document.querySelectorAll('.resultado-produto-item');
      resultadoItems.forEach((item) => {
        item.style.display = 'none';
      });

      this.updateTotalComissao(0);
    }

    updateProducts() {
      const resultadoItems = document.querySelectorAll('.resultado-produto-item');
      let totalComissao = 0;

      resultadoItems.forEach((item) => {
        const category = item.getAttribute('ativo-category');
        const product = item.getAttribute('ativo-product');

        if (this.shouldShowProduct(category, product)) {
          item.style.display = '';

          const comissaoValue = this.calculateComissao(category, product);
          this.updateProductDisplay(item, comissaoValue);
          totalComissao += comissaoValue;
        } else {
          item.style.display = 'none';
        }
      });

      this.updateTotalComissao(totalComissao);
    }

    shouldShowProduct(category, product) {
      if (!this.isAssetSelected(category, product)) return false;

      const patrimonioItem = document.querySelector(
        `.patrimonio_interactive_item[ativo-category="${category}"][ativo-product="${product}"]`
      );

      return this.hasValue(patrimonioItem);
    }

    calculateComissao(category, product) {
      // Try to get allocation from AppState first
      if (this.appState) {
        const allocations = this.appState.getAllAllocations();
        const key = `${category}:${product}`;
        const allocatedValue = allocations[key] || 0;

        if (allocatedValue > 0) {
          return this.calculateCommissionForValue(allocatedValue, category, product);
        }
      }

      // Fallback to DOM
      const patrimonioItem = document.querySelector(
        `.patrimonio_interactive_item[ativo-category="${category}"][ativo-product="${product}"]`
      );

      if (!patrimonioItem) return 0;

      const inputElement = patrimonioItem.querySelector('.currency-input.individual');
      if (!inputElement) return 0;

      const allocatedValue = Utils.parseCurrencyValue(inputElement.value);
      return this.calculateCommissionForValue(allocatedValue, category, product);
    }

    calculateCommissionForValue(allocatedValue, category, product) {
      if (allocatedValue <= 0) return 0;

      if (window.calcularCustoProduto) {
        const resultado = window.calcularCustoProduto(allocatedValue, category, product);
        return resultado.custoMedio || 0;
      }

      return allocatedValue * 0.01;
    }

    updateProductDisplay(item, comissaoValue) {
      const comissaoDisplay = item.querySelector('.comissao-valor');
      if (comissaoDisplay) {
        comissaoDisplay.textContent = Utils.formatCurrency(comissaoValue);
      }

      const percentageDisplay = item.querySelector('.comissao-percentual');
      if (percentageDisplay && window.obterTaxaPorAtributos) {
        const category = item.getAttribute('ativo-category');
        const product = item.getAttribute('ativo-product');
        const taxaConfig = window.obterTaxaPorAtributos(category, product);

        if (taxaConfig) {
          percentageDisplay.textContent = `${taxaConfig.media}%`;
        }
      }
    }

    updateTotalComissao(total) {
      const formatted = Utils.formatCurrency(total);

      // Update DOM
      const totalElement = document.querySelector('.total-comissao-valor');
      if (totalElement) {
        totalElement.textContent = formatted;
      }

      // Update AppState if available
      if (this.appState) {
        this.appState.setCommissionResults(total, this.getCommissionDetails(), 'resultado-sync');
      }

      // Emit event for other modules
      document.dispatchEvent(
        new CustomEvent('totalComissaoChanged', {
          detail: {
            total,
            formatted,
            details: this.getCommissionDetails(),
            source: 'resultado-sync',
          },
        })
      );

      this.log(`💵 Total commission updated: ${formatted}`);
    }

    getCommissionDetails() {
      const details = [];
      const resultadoItems = document.querySelectorAll('.resultado-produto-item');

      resultadoItems.forEach((item) => {
        const category = item.getAttribute('ativo-category');
        const product = item.getAttribute('ativo-product');

        if (this.shouldShowProduct(category, product)) {
          const comissaoValue = this.calculateComissao(category, product);
          const allocatedValue = this.getAllocatedValue(category, product);

          if (comissaoValue > 0) {
            details.push({
              category,
              product,
              value: allocatedValue,
              commission: comissaoValue,
              formatted: {
                value: Utils.formatCurrency(allocatedValue),
                commission: Utils.formatCurrency(comissaoValue),
              },
            });
          }
        }
      });

      return details;
    }

    getAllocatedValue(category, product) {
      // Try AppState first
      if (this.appState) {
        const allocations = this.appState.getAllAllocations();
        const key = `${category}:${product}`;
        return allocations[key] || 0;
      }

      // Fallback to DOM
      const patrimonioItem = document.querySelector(
        `.patrimonio_interactive_item[ativo-category="${category}"][ativo-product="${product}"]`
      );

      if (!patrimonioItem) return 0;

      const inputElement = patrimonioItem.querySelector('.currency-input.individual');
      if (!inputElement) return 0;

      return Utils.parseCurrencyValue(inputElement.value);
    }

    forceSync() {
      this.updateVisibility();
    }

    getSelectedAssets() {
      return Array.from(this.selectedAssets);
    }

    reset() {
      this.selectedAssets.clear();
      this.hideAllProducts();
      this.updateMainContainers(false);
    }

    // Debug helper
    log(message, data = null) {
      if (this.debugMode) {
        if (data) {
          console.log(`[ResultadoSync] ${message}`, data);
        } else {
          console.log(`[ResultadoSync] ${message}`);
        }
      }
    }

    enableDebug() {
      this.debugMode = true;
      this.log('🐛 Debug mode enabled');
    }

    disableDebug() {
      this.debugMode = false;
    }
  }

  // Cria instância global
  window.ReinoSimpleResultadoSync = new SimpleResultadoSync();

  // Auto-inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      await window.ReinoSimpleResultadoSync.init();
    });
  } else {
    window.ReinoSimpleResultadoSync.init();
  }
})();
