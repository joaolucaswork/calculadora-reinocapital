/**
 * Category Commission Display Module
 * Versão sem imports/exports para uso direto no Webflow
 * Gerencia a exibição dinâmica de valores de comissão por categoria
 */

(function () {
  'use strict';

  class CategoryCommissionDisplay {
    constructor() {
      this.isInitialized = false;
      this.categoryElements = new Map();
      this.categoryCommissions = new Map();
      this.selectedCategories = new Set();
      this.eventHandlers = new Map();
      this.activeValoresItem = null;
      this.lastHoveredCategory = null;

      this.config = {
        enableLogging: false,
        updateDelay: 50,
        containerSelector: '.valores-categorias-grafico',
        itemSelector: '.valores-categoria-item',
        priceSelector: '.valor-categoria-preco',
        nameSelector: '.nome-categoria-item',
      };
    }

    init() {
      if (this.isInitialized) {
        return;
      }

      try {
        this.cacheElements();
        this.setupEventListeners();
        this.updateDisplay();
        this.isInitialized = true;

        if (this.config.enableLogging) {
          console.log('✅ Category Commission Display initialized');
        }

        document.dispatchEvent(new CustomEvent('categoryCommissionDisplayReady'));
      } catch (error) {
        console.error('❌ Failed to initialize Category Commission Display:', error);
      }
    }

    cacheElements() {
      const container = document.querySelector(this.config.containerSelector);
      if (!container) {
        if (this.config.enableLogging) {
          console.warn('⚠️ Container not found, will retry on events');
        }
        return;
      }

      this.categoryElements.clear();
      const items = container.querySelectorAll(this.config.itemSelector);

      if (this.config.enableLogging) {
        console.log('🔍 Scanning elements:', {
          containerFound: !!container,
          itemsFound: items.length,
          containerSelector: this.config.containerSelector,
          itemSelector: this.config.itemSelector,
        });
      }

      items.forEach((item) => {
        const category = item.getAttribute('ativo-category');
        if (!category) {
          return;
        }

        const priceElement = item.querySelector(this.config.priceSelector);
        const nameElement = item.querySelector(this.config.nameSelector);

        if (priceElement) {
          this.categoryElements.set(category, {
            container: item,
            priceElement,
            nameElement,
            category,
          });

          if (this.config.enableLogging) {
            console.log(`📦 Cached category element: ${category}`);
          }
        }
      });

      if (this.config.enableLogging) {
        console.log('📋 All cached categories:', Array.from(this.categoryElements.keys()));
      }
    }

    setupEventListeners() {
      document.addEventListener('allocationChanged', (e) => {
        this.handleAllocationChange(e.detail);
      });

      document.addEventListener('totalComissaoChanged', (e) => {
        this.handleTotalCommissionChange(e.detail);
      });

      document.addEventListener('assetSelectionChanged', (e) => {
        this.handleAssetSelectionChange(e.detail);
      });

      document.addEventListener('resultadoComparativoUpdated', (e) => {
        this.handleResultadoComparativoUpdate(e.detail);
      });

      document.addEventListener('patrimonySyncReady', () => {
        this.retryInitialization();
      });

      document.addEventListener('simpleResultadoSyncReady', () => {
        this.retryInitialization();
      });

      // Listen for donut chart hover events to sync visual effects
      document.addEventListener('donutCategoryHover', (e) => {
        this.handleDonutCategoryHover(e.detail.category);
      });

      document.addEventListener('donutCategoryHoverEnd', () => {
        this.handleDonutCategoryHoverEnd();
      });

      // Setup hover events for valores-categoria-item elements
      this.setupHoverEvents();

      // Clear active state when tooltip is unpinned (ESC, click outside, etc.)
      document.addEventListener('tooltipUnpinned', () => {
        this.clearActiveValoresItem();
      });
    }

    retryInitialization() {
      if (this.categoryElements.size === 0) {
        setTimeout(() => {
          this.cacheElements();
          this.setupHoverEvents();
          this.updateDisplay();
        }, this.config.updateDelay);
      }
    }

    handleAllocationChange(detail) {
      if (!detail.category) {
        return;
      }

      setTimeout(() => {
        this.calculateCategoryCommissions();
        this.updateDisplay();
      }, this.config.updateDelay);
    }

    handleTotalCommissionChange() {
      setTimeout(() => {
        this.calculateCategoryCommissions();
        this.updateDisplay();
      }, this.config.updateDelay);
    }

    handleAssetSelectionChange(detail) {
      if (detail.selectedAssets) {
        this.updateSelectedCategories(detail.selectedAssets);
      }

      setTimeout(() => {
        this.calculateCategoryCommissions();
        this.updateDisplay();
      }, this.config.updateDelay);
    }

    handleResultadoComparativoUpdate(detail) {
      if (detail.tradicional && detail.tradicional.details) {
        this.updateCommissionsFromDetails(detail.tradicional.details);
      }

      setTimeout(() => {
        this.updateDisplay();
      }, this.config.updateDelay);
    }

    updateSelectedCategories(selectedAssets) {
      this.selectedCategories.clear();

      selectedAssets.forEach((asset) => {
        if (typeof asset === 'string') {
          const [category] = asset.split('|');
          this.selectedCategories.add(category);
        } else if (asset.category) {
          this.selectedCategories.add(asset.category);
        }
      });
    }

    updateCommissionsFromDetails(details) {
      this.categoryCommissions.clear();

      details.forEach((detail) => {
        if (detail.category && typeof detail.cost === 'number') {
          const currentTotal = this.categoryCommissions.get(detail.category) || 0;
          this.categoryCommissions.set(detail.category, currentTotal + detail.cost);
        }
      });
    }

    calculateCategoryCommissions() {
      this.categoryCommissions.clear();

      const patrimonioItems = document.querySelectorAll(
        '.patrimonio_interactive_item[ativo-category]'
      );

      patrimonioItems.forEach((item) => {
        const category = item.getAttribute('ativo-category');
        const product = item.getAttribute('ativo-product');

        if (!category || !product) {
          return;
        }

        const inputElement = item.querySelector(
          '.currency-input.individual, [input-settings="receive"]'
        );
        if (!inputElement) {
          return;
        }

        const allocatedValue = this.parseCurrencyValue(inputElement.value);
        if (allocatedValue <= 0) {
          return;
        }

        let commissionValue = 0;

        if (window.calcularCustoProduto) {
          const resultado = window.calcularCustoProduto(allocatedValue, category, product);
          commissionValue = resultado.custoMedio || 0;
        } else {
          commissionValue = allocatedValue * 0.015;
        }

        const currentTotal = this.categoryCommissions.get(category) || 0;
        this.categoryCommissions.set(category, currentTotal + commissionValue);
      });

      if (this.config.enableLogging) {
        console.log(
          '💰 Category commissions calculated:',
          Object.fromEntries(this.categoryCommissions)
        );
      }
    }

    updateDisplay() {
      if (this.categoryElements.size === 0) {
        this.cacheElements();
      }

      this.categoryElements.forEach((elementData, category) => {
        const commissionValue = this.categoryCommissions.get(category) || 0;
        const hasAllocation = commissionValue > 0;
        const isSelected =
          this.selectedCategories.has(category) || this.hasActiveProducts(category);

        this.updateCategoryItem(elementData, commissionValue, hasAllocation && isSelected);
      });
    }

    hasActiveProducts(category) {
      const items = document.querySelectorAll(
        `.patrimonio_interactive_item[ativo-category="${category}"]`
      );

      for (const item of items) {
        const input = item.querySelector('.currency-input.individual, [input-settings="receive"]');
        if (input && this.parseCurrencyValue(input.value) > 0) {
          return true;
        }
      }

      return false;
    }

    updateCategoryItem(elementData, commissionValue, shouldShow) {
      const { container, priceElement } = elementData;

      if (shouldShow) {
        container.style.display = '';
        if (priceElement) {
          priceElement.textContent = this.formatCurrency(commissionValue);
        }
      } else {
        container.style.display = 'none';
      }

      if (this.config.enableLogging && shouldShow) {
        console.log(`📊 Updated ${elementData.category}: ${this.formatCurrency(commissionValue)}`);
      }
    }

    parseCurrencyValue(value) {
      if (!value || typeof value !== 'string') {
        return 0;
      }

      const cleanValue = value
        .replace(/[^\d,.-]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');

      const numericValue = parseFloat(cleanValue);
      return isNaN(numericValue) ? 0 : numericValue;
    }

    formatCurrency(value) {
      if (typeof value !== 'number' || isNaN(value)) {
        return '0,00';
      }

      return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    getCategoryCommissions() {
      return new Map(this.categoryCommissions);
    }

    getTotalCommission() {
      let total = 0;
      this.categoryCommissions.forEach((value) => {
        total += value;
      });
      return total;
    }

    forceUpdate() {
      this.calculateCategoryCommissions();
      this.updateDisplay();
    }

    setupHoverEvents() {
      if (this.categoryElements.size === 0) {
        setTimeout(() => this.setupHoverEvents(), 100);
        return;
      }

      this.categoryElements.forEach((elementData, category) => {
        const { container } = elementData;

        // Remove existing event listeners to avoid duplicates
        const existingHandlers = this.eventHandlers?.get(container);
        if (existingHandlers) {
          if (existingHandlers.click) {
            container.removeEventListener('click', existingHandlers.click);
          }
          if (existingHandlers.hover) {
            container.removeEventListener('mouseenter', existingHandlers.hover);
          }
          if (existingHandlers.hoverOut) {
            container.removeEventListener('mouseleave', existingHandlers.hoverOut);
          }
        }

        // Create event handlers
        const clickHandler = (event) => {
          this.handleValoresCategoryClick(event, category);
        };
        const hoverHandler = () => {
          this.handleValoresCategoryHover(category);
        };
        const hoverOutHandler = () => {
          this.handleValoresCategoryHoverEnd();
        };

        // Store handlers for cleanup
        if (!this.eventHandlers) {
          this.eventHandlers = new Map();
        }
        this.eventHandlers.set(container, {
          click: clickHandler,
          hover: hoverHandler,
          hoverOut: hoverOutHandler,
        });

        // Add event listeners
        container.addEventListener('click', clickHandler);
        container.addEventListener('mouseenter', hoverHandler);
        container.addEventListener('mouseleave', hoverOutHandler);
      });
    }

    handleValoresCategoryHover(category) {
      const chartSystem = window.ReinoD3DonutChartSection5System;
      if (!chartSystem) {
        return;
      }

      // Track the last hovered category
      this.lastHoveredCategory = category;

      // Find the corresponding slice (exactly like lista-resultado-chart-bridge.js)
      const sliceInfo = this.findChartSliceByCategory(category);
      if (!sliceInfo) {
        return;
      }

      // Apply same hover effects as direct slice hover (exactly like lista-resultado-chart-bridge.js)
      this.applySliceHoverEffect(sliceInfo.element, sliceInfo.data);

      // Apply visual effects to valores-categoria-item elements
      this.applyHoverEffects(category);
    }

    handleValoresCategoryHoverEnd() {
      const chartSystem = window.ReinoD3DonutChartSection5System;
      if (!chartSystem) {
        return;
      }

      // Get the last hovered category to find the slice
      if (this.lastHoveredCategory) {
        const sliceInfo = this.findChartSliceByCategory(this.lastHoveredCategory);
        if (sliceInfo) {
          // Remove hover effects (exactly like lista-resultado-chart-bridge.js)
          this.removeSliceHoverEffect(sliceInfo.element, sliceInfo.data);
        }
      }

      // Remove visual effects from valores-categoria-item elements
      this.removeHoverEffects();

      // Clear the last hovered category
      this.lastHoveredCategory = null;
    }

    handleDonutCategoryHover(category) {
      if (this.config.enableLogging) {
        console.log('🎯 DonutCategoryHover received:', category);
      }

      // Apply visual effects when donut chart or lista-resultado-item is hovered
      this.applyHoverEffects(category);

      // Auto-scroll to corresponding valores-categoria-item
      this.scrollToCategory(category);
    }

    handleDonutCategoryHoverEnd() {
      // Remove visual effects when donut chart or lista-resultado-item hover ends
      this.removeHoverEffects();
    }

    handleValoresCategoryClick(event, category) {
      event.preventDefault();
      event.stopPropagation();

      const chartSystem = window.ReinoD3DonutChartSection5System;
      if (!chartSystem) {
        return;
      }

      const elementData = this.categoryElements.get(category);
      if (!elementData) {
        return;
      }

      // Check if clicking on already active item (toggle behavior)
      if (this.activeValoresItem === elementData.container) {
        this.clearActiveValoresItem();
        if (chartSystem.hoverModule && chartSystem.hoverModule.unpinTooltip) {
          chartSystem.hoverModule.unpinTooltip();
        }
        return;
      }

      // Find the corresponding slice and trigger click
      const sliceInfo = this.findChartSliceByCategory(category);
      if (!sliceInfo) {
        return;
      }

      const syntheticEvent = {
        ...event,
        target: sliceInfo.element,
        stopPropagation: () => {},
      };

      // Set active state and trigger chart click
      this.setActiveValoresItem(category);
      chartSystem.handleSliceClick(syntheticEvent, sliceInfo.data, chartSystem.currentChart);
    }

    setActiveValoresItem(category) {
      // Clear other active items
      this.categoryElements.forEach((elementData) => {
        elementData.container.classList.remove('ativo');
      });

      const elementData = this.categoryElements.get(category);
      if (elementData) {
        elementData.container.classList.add('ativo');
        this.activeValoresItem = elementData.container;
      }
    }

    clearActiveValoresItem() {
      if (this.activeValoresItem) {
        this.activeValoresItem.classList.remove('ativo');
        this.activeValoresItem = null;
      }
    }

    applySliceHoverEffect(sliceElement, sliceData) {
      const chartSystem = window.ReinoD3DonutChartSection5System;
      if (!chartSystem || !window.d3) {
        return;
      }

      // Don't apply hover effects if tooltip is pinned
      if (chartSystem.hoverModule && chartSystem.hoverModule.state.isPinned) {
        return;
      }

      // Reset ALL slices to original state first (opacity, filter)
      window.d3
        .selectAll('.arc path')
        .transition()
        .duration(80)
        .style('opacity', 0.3)
        .style('filter', 'brightness(1)');

      // Apply hover effect to target slice
      window.d3
        .select(sliceElement)
        .transition()
        .duration(80)
        .style('opacity', 1)
        .style('filter', 'brightness(1.1)');

      // Show center text and trigger category hover
      if (chartSystem.currentChart) {
        chartSystem.showCenterText(chartSystem.currentChart, sliceData);
      }
      chartSystem.triggerCategoryHover(sliceData.category || sliceData.name);
      chartSystem.setActiveListaResultadoItem(sliceData.category || sliceData.name);
    }

    removeSliceHoverEffect(sliceElement, sliceData) {
      const chartSystem = window.ReinoD3DonutChartSection5System;
      if (!chartSystem || !window.d3) {
        return;
      }

      // Don't remove hover effects if tooltip is pinned
      if (chartSystem.hoverModule && chartSystem.hoverModule.state.isPinned) {
        return;
      }

      // Restore all slices to full opacity
      window.d3.selectAll('.arc path').transition().duration(80).style('opacity', 1);

      // Remove visual hover effect
      window.d3.select(sliceElement).transition().duration(80).style('filter', 'brightness(1)');

      // Hide center text and clear category hover
      if (chartSystem.currentChart) {
        chartSystem.hideCenterText(chartSystem.currentChart);
      }
      chartSystem.clearCategoryHover();

      // Clear active state only if no tooltip is pinned
      if (!chartSystem.hoverModule.state.isPinned) {
        chartSystem.clearActiveListaResultadoItem();
      }
    }

    applyHoverEffects(hoveredCategory) {
      this.categoryElements.forEach((elementData, category) => {
        const { container } = elementData;

        // Remove existing hover classes
        container.classList.remove('highlighted', 'faded');

        if (category === hoveredCategory) {
          // Highlight matching category using CSS class
          container.classList.add('highlighted');
        } else {
          // Dim non-matching categories using CSS class
          container.classList.add('faded');
        }
      });
    }

    removeHoverEffects() {
      this.categoryElements.forEach((elementData) => {
        const { container } = elementData;

        // Remove hover effect classes to return to original state
        container.classList.remove('highlighted', 'faded');
      });
    }

    findChartSliceByCategory(targetCategory) {
      // Reuse the same logic as lista-resultado-chart-bridge.js
      const chartSystem = window.ReinoD3DonutChartSection5System;
      if (!chartSystem?.currentChart || !window.d3) {
        return null;
      }

      try {
        // Get current chart data
        const chartData = chartSystem.getCategoryData('tradicional');
        const matchingData = chartData.find(
          (d) => d.category === targetCategory || d.name === targetCategory
        );

        if (!matchingData) {
          return null;
        }

        // Find the corresponding DOM element
        const arcs = chartSystem.currentChart.g.selectAll('.arc');
        let matchingElement = null;
        let matchingSliceData = null;

        arcs.each(function (d) {
          if (d.data.category === targetCategory || d.data.name === targetCategory) {
            matchingElement = this.querySelector('path');
            matchingSliceData = d;
          }
        });

        if (!matchingElement || !matchingSliceData) {
          return null;
        }

        return {
          element: matchingElement,
          data: matchingSliceData,
        };
      } catch (error) {
        return null;
      }
    }

    scrollToCategory(category) {
      const container = document.querySelector(this.config.containerSelector);
      const targetElement = this.categoryElements.get(category);

      if (this.config.enableLogging) {
        console.log('🔄 ScrollToCategory:', {
          category,
          containerFound: !!container,
          targetElementFound: !!targetElement,
          containerSelector: this.config.containerSelector,
        });
      }

      if (!container || !targetElement) {
        return;
      }

      const { container: targetContainer } = targetElement;

      // Check if target is already visible
      if (this.isElementVisible(targetContainer, container)) {
        if (this.config.enableLogging) {
          console.log('✅ Target already visible, skipping scroll');
        }
        return; // Already visible, no need to scroll
      }

      // Calculate scroll position to center the target element
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetContainer.getBoundingClientRect();

      const containerScrollTop = container.scrollTop;
      const targetOffsetTop = targetRect.top - containerRect.top + containerScrollTop;
      const containerHeight = containerRect.height;
      const targetHeight = targetRect.height;

      // Center the target element in the container
      const scrollPosition = targetOffsetTop - containerHeight / 2 + targetHeight / 2;

      if (this.config.enableLogging) {
        console.log('📍 Scroll calculation:', {
          containerHeight,
          targetHeight,
          targetOffsetTop,
          scrollPosition: Math.max(0, scrollPosition),
        });
      }

      // Smooth scroll to position
      container.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: 'smooth',
      });
    }

    isElementVisible(element, container) {
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      return (
        elementRect.top >= containerRect.top &&
        elementRect.bottom <= containerRect.bottom &&
        elementRect.left >= containerRect.left &&
        elementRect.right <= containerRect.right
      );
    }

    reset() {
      this.categoryCommissions.clear();
      this.selectedCategories.clear();
      this.updateDisplay();
    }
  }

  window.CategoryCommissionDisplay = CategoryCommissionDisplay;
  window.categoryCommissionDisplayInstance = new CategoryCommissionDisplay();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.categoryCommissionDisplayInstance.init();
    });
  } else {
    window.categoryCommissionDisplayInstance.init();
  }
})();
