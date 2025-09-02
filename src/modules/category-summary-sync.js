/**
 * Category Summary Sync Module
 * Versão sem imports/exports para uso direto no Webflow
 * Atualiza valores e porcentagens das categorias na lista-produtos-selecionados
 */

(function () {
  'use strict';

  class CategorySummarySync {
    constructor() {
      this.isInitialized = false;
      this.categoryElements = new Map();
      this.totalPatrimony = 0;
      this.categoryTotals = new Map();

      this.config = {
        enableLogging: false,
        updateDelay: 100,
      };
    }

    init() {
      if (this.isInitialized) return;

      try {
        this.cacheCategoryElements();
        this.setupEventListeners();
        this.updateAllCategories();
        this.isInitialized = true;

        if (this.config.enableLogging) {
          console.log('✅ Category Summary Sync initialized');
        }

        document.dispatchEvent(new CustomEvent('categorySummarySyncReady'));
      } catch (error) {
        console.error('❌ Failed to initialize Category Summary Sync:', error);
      }
    }

    cacheCategoryElements() {
      const listContainer = document.querySelector('.lista-produtos-selecionados');
      if (!listContainer) {
        throw new Error('Container lista-produtos-selecionados não encontrado');
      }

      this.categoryElements.clear();

      const categoryContainers = listContainer.querySelectorAll('.categoria-porcentagem[ativo-category]');

      categoryContainers.forEach((container) => {
        const category = container.getAttribute('ativo-category');
        if (!category) return;

        const percentageElement = container.querySelector('.porcentagem-categoria');
        let valueElement = container.querySelector('.valor-categoria-esquerda');
        
        if (!valueElement && category === 'Renda Fixa') {
          valueElement = container.querySelector('.valor-categoria > div:not(.brl_tag)');
        }

        if (percentageElement || valueElement) {
          this.categoryElements.set(category, {
            container,
            percentageElement,
            valueElement,
            category,
          });

          if (this.config.enableLogging) {
            console.log(`📦 Cached category: ${category}`);
          }
        }
      });

      if (this.config.enableLogging) {
        console.log(`📋 Cached ${this.categoryElements.size} category elements`);
      }
    }

    setupEventListeners() {
      document.addEventListener('allocationChanged', (event) => {
        this.handleAllocationChange(event.detail);
      });

      document.addEventListener('patrimonyMainValueChanged', (event) => {
        this.handleMainValueChange(event.detail);
      });

      document.addEventListener('patrimonySyncReady', (event) => {
        this.handlePatrimonySyncReady(event.detail);
      });

      document.addEventListener('totalAllocationChange', (event) => {
        this.handleTotalAllocationChange(event.detail);
      });

      if (this.config.enableLogging) {
        console.log('🎧 Event listeners setup complete');
      }
    }

    handleAllocationChange(detail) {
      if (!detail.category) return;

      setTimeout(() => {
        this.calculateCategoryTotals();
        this.updateCategoryDisplay(detail.category);
        this.updateAllPercentages();
      }, this.config.updateDelay);
    }

    handleMainValueChange(detail) {
      this.totalPatrimony = detail.value || 0;
      this.updateAllPercentages();
    }

    handlePatrimonySyncReady(detail) {
      this.totalPatrimony = detail.mainValue || 0;
      this.calculateCategoryTotals();
      this.updateAllCategories();
    }

    handleTotalAllocationChange(detail) {
      this.calculateCategoryTotals();
      this.updateAllCategories();
    }

    calculateCategoryTotals() {
      this.categoryTotals.clear();

      const patrimonioItems = document.querySelectorAll('.patrimonio_interactive_item[ativo-category]');

      patrimonioItems.forEach((item) => {
        const category = item.getAttribute('ativo-category');
        const input = item.querySelector('.currency-input.individual, [input-settings="receive"]');

        if (!category || !input) return;

        const value = this.parseCurrencyValue(input.value);
        const currentTotal = this.categoryTotals.get(category) || 0;
        this.categoryTotals.set(category, currentTotal + value);
      });

      if (this.config.enableLogging) {
        console.log('💰 Category totals calculated:', Object.fromEntries(this.categoryTotals));
      }
    }

    updateCategoryDisplay(category) {
      const categoryData = this.categoryElements.get(category);
      if (!categoryData) return;

      const categoryTotal = this.categoryTotals.get(category) || 0;
      const percentage = this.calculatePercentage(categoryTotal, this.totalPatrimony);

      this.updateValueElement(categoryData.valueElement, categoryTotal);
      this.updatePercentageElement(categoryData.percentageElement, percentage);

      if (this.config.enableLogging) {
        console.log(`📊 Updated ${category}: R$ ${this.formatCurrency(categoryTotal)} (${percentage.toFixed(1)}%)`);
      }
    }

    updateAllCategories() {
      this.calculateCategoryTotals();

      this.categoryElements.forEach((categoryData, category) => {
        this.updateCategoryDisplay(category);
      });
    }

    updateAllPercentages() {
      this.categoryElements.forEach((categoryData, category) => {
        const categoryTotal = this.categoryTotals.get(category) || 0;
        const percentage = this.calculatePercentage(categoryTotal, this.totalPatrimony);
        this.updatePercentageElement(categoryData.percentageElement, percentage);
      });
    }

    updateValueElement(element, value) {
      if (!element) return;
      element.textContent = this.formatCurrency(value);
    }

    updatePercentageElement(element, percentage) {
      if (!element) return;
      element.textContent = `${percentage.toFixed(1)}%`;
    }

    parseCurrencyValue(value) {
      if (!value || typeof value !== 'string') return 0;
      const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
      return parseFloat(cleanValue) || 0;
    }

    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }

    calculatePercentage(value, total) {
      if (!total || total === 0) return 0;
      return (value / total) * 100;
    }

    refresh() {
      this.cacheCategoryElements();
      this.updateAllCategories();
    }

    enableDebug() {
      this.config.enableLogging = true;
    }

    disableDebug() {
      this.config.enableLogging = false;
    }

    getCategoryTotals() {
      return Object.fromEntries(this.categoryTotals);
    }

    getTotalAllocated() {
      return Array.from(this.categoryTotals.values()).reduce((sum, value) => sum + value, 0);
    }
  }

  window.CategorySummarySync = CategorySummarySync;
  window.ReinoCategorySummarySync = new CategorySummarySync();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoCategorySummarySync.init();
    });
  } else {
    window.ReinoCategorySummarySync.init();
  }

})();
