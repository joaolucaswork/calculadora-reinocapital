/**
 * Sistema Simples de Sincronização de Resultados - Versão Webflow TXT
 * Funciona diretamente com atributos ativo-category e ativo-product
 * Versão sem imports/exports para uso direto no Webflow
 */

(function() {
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
    }

    init() {
      if (this.isInitialized) return;

      this.setupEventListeners();
      this.isInitialized = true;

      document.dispatchEvent(new CustomEvent('simpleResultadoSyncReady'));
    }

    setupEventListeners() {
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
      const patrimonioItem = document.querySelector(
        `.patrimonio_interactive_item[ativo-category="${category}"][ativo-product="${product}"]`
      );

      if (!patrimonioItem) return 0;

      const inputElement = patrimonioItem.querySelector('.currency-input.individual');
      if (!inputElement) return 0;

      const allocatedValue = Utils.parseCurrencyValue(inputElement.value);
      
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
      const totalElement = document.querySelector('.total-comissao-valor');
      if (totalElement) {
        totalElement.textContent = Utils.formatCurrency(total);
      }

      document.dispatchEvent(new CustomEvent('totalComissaoChanged', {
        detail: { total, formatted: Utils.formatCurrency(total) }
      }));
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
  }

  // Cria instância global
  window.ReinoSimpleResultadoSync = new SimpleResultadoSync();

  // Auto-inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoSimpleResultadoSync.init();
    });
  } else {
    window.ReinoSimpleResultadoSync.init();
  }

})();