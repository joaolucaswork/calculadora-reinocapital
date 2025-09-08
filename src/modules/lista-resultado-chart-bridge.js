/**
 * Lista Resultado Chart Bridge
 * Conecta cliques em .lista-resultado-item com tooltips do gráfico D3.js
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class ListaResultadoChartBridge {
    constructor() {
      this.isInitialized = false;
      this.chartSystem = null;
      this.eventHandlers = new Map();
      this.activeListaItem = null;
    }

    async init() {
      if (this.isInitialized) return;

      try {
        await this.waitForChartSystem();
        this.setupEventListeners();
        this.setupListaResultadoClickHandlers();
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize ListaResultadoChartBridge:', error);
      }
    }

    async waitForChartSystem() {
      // Wait for the D3 chart system to be available
      while (!window.ReinoD3DonutChartSection5System) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      this.chartSystem = window.ReinoD3DonutChartSection5System;
    }

    setupEventListeners() {
      // Re-setup handlers when chart data changes
      document.addEventListener('resultadoSyncCompleted', () => {
        this.setupListaResultadoClickHandlers();
      });

      document.addEventListener('donutChartSection5Ready', () => {
        this.setupListaResultadoClickHandlers();
      });

      // Re-setup when DOM changes
      document.addEventListener('DOMContentLoaded', () => {
        this.setupListaResultadoClickHandlers();
      });

      // Clear active state when tooltip is unpinned (ESC, click outside, etc.)
      document.addEventListener('tooltipUnpinned', () => {
        this.clearActiveListaItem();
      });
    }

    setupListaResultadoClickHandlers() {
      if (!this.chartSystem) return;

      // Find all lista-resultado-item elements and add click handlers
      const listaItems = document.querySelectorAll('.lista-resultado-item');

      listaItems.forEach((item) => {
        // Remove existing handlers if they exist to avoid duplicates
        const existingHandlers = this.eventHandlers.get(item);
        if (existingHandlers) {
          if (existingHandlers.click) item.removeEventListener('click', existingHandlers.click);
          if (existingHandlers.hover)
            item.removeEventListener('mouseenter', existingHandlers.hover);
          if (existingHandlers.hoverOut)
            item.removeEventListener('mouseleave', existingHandlers.hoverOut);
        }

        // Create handlers
        const clickHandler = (event) => {
          this.handleListaResultadoClick(event, item);
        };
        const hoverHandler = (event) => {
          this.handleListaResultadoHover(event, item);
        };
        const hoverOutHandler = (event) => {
          this.handleListaResultadoHoverOut(event, item);
        };

        // Store references for cleanup
        this.eventHandlers.set(item, {
          click: clickHandler,
          hover: hoverHandler,
          hoverOut: hoverOutHandler,
        });

        // Add event listeners
        item.addEventListener('click', clickHandler);
        item.addEventListener('mouseenter', hoverHandler);
        item.addEventListener('mouseleave', hoverOutHandler);
      });
    }

    handleListaResultadoClick(event, listaItem) {
      event.preventDefault();
      event.stopPropagation();

      const category = listaItem.getAttribute('ativo-category');
      if (!category || !this.chartSystem) return;

      // Check if clicking on already active item (toggle behavior)
      if (this.activeListaItem === listaItem) {
        this.clearActiveListaItem();
        if (this.chartSystem.hoverModule && this.chartSystem.hoverModule.unpinTooltip) {
          this.chartSystem.hoverModule.unpinTooltip();
        }
        return;
      }

      // Find the corresponding slice and trigger click
      const sliceInfo = this.findSliceByCategory(category);
      if (!sliceInfo) return;

      const syntheticEvent = {
        ...event,
        target: sliceInfo.element,
        stopPropagation: () => {},
      };

      // Set active state and trigger chart click
      this.setActiveListaItem(category);
      this.chartSystem.handleSliceClick(
        syntheticEvent,
        sliceInfo.data,
        this.chartSystem.currentChart
      );
    }

    handleListaResultadoHover(event, listaItem) {
      const category = listaItem.getAttribute('ativo-category');
      if (!category || !this.chartSystem) return;

      // Find the corresponding slice
      const sliceInfo = this.findSliceByCategory(category);
      if (!sliceInfo) return;

      // Apply same hover effects as direct slice hover
      this.applySliceHoverEffect(sliceInfo.element, sliceInfo.data);
    }

    handleListaResultadoHoverOut(event, listaItem) {
      const category = listaItem.getAttribute('ativo-category');
      if (!category || !this.chartSystem) return;

      // Find the corresponding slice
      const sliceInfo = this.findSliceByCategory(category);
      if (!sliceInfo) return;

      // Remove hover effects
      this.removeSliceHoverEffect(sliceInfo.element, sliceInfo.data);
    }

    setActiveListaItem(category) {
      // Clear other active items but keep reference for comparison
      document.querySelectorAll('.lista-resultado-item.ativo').forEach((item) => {
        item.classList.remove('ativo');
      });

      const listaItem = document.querySelector(
        `.lista-resultado-item[ativo-category="${category}"]`
      );
      if (listaItem) {
        listaItem.classList.add('ativo');
        this.activeListaItem = listaItem;
      }
    }

    clearActiveListaItem() {
      const activeItems = document.querySelectorAll('.lista-resultado-item.ativo');
      activeItems.forEach((item) => {
        item.classList.remove('ativo');
      });
      this.activeListaItem = null;
    }

    applySliceHoverEffect(sliceElement, sliceData) {
      if (!this.chartSystem || !window.d3) return;

      // Don't apply hover effects if tooltip is pinned
      if (this.chartSystem.hoverModule && this.chartSystem.hoverModule.state.isPinned) {
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
      if (this.chartSystem.currentChart) {
        console.log('🔧 Bridge showCenterText - sliceData:', sliceData);
        this.chartSystem.showCenterText(this.chartSystem.currentChart, sliceData);
      }
      this.chartSystem.triggerCategoryHover(sliceData.category || sliceData.name);
      this.chartSystem.setActiveListaResultadoItem(sliceData.category || sliceData.name);
    }

    removeSliceHoverEffect(sliceElement, sliceData) {
      if (!this.chartSystem || !window.d3) return;

      // Don't remove hover effects if tooltip is pinned
      if (this.chartSystem.hoverModule && this.chartSystem.hoverModule.state.isPinned) {
        return;
      }

      // Restore all slices to full opacity
      window.d3.selectAll('.arc path').transition().duration(80).style('opacity', 1);

      // Remove visual hover effect
      window.d3.select(sliceElement).transition().duration(80).style('filter', 'brightness(1)');

      // Hide center text and clear category hover
      if (this.chartSystem.currentChart) {
        this.chartSystem.hideCenterText(this.chartSystem.currentChart);
      }
      this.chartSystem.clearCategoryHover();

      // Clear active state only if no tooltip is pinned
      if (!this.chartSystem.hoverModule.state.isPinned) {
        this.chartSystem.clearActiveListaResultadoItem();
      }
    }

    findSliceByCategory(targetCategory) {
      if (!this.chartSystem?.currentChart || !window.d3) {
        return null;
      }

      try {
        // Get current chart data
        const chartData = this.chartSystem.getCategoryData('tradicional');
        const matchingData = chartData.find(
          (d) => d.category === targetCategory || d.name === targetCategory
        );

        if (!matchingData) {
          return null;
        }

        // Find the corresponding DOM element
        const arcs = this.chartSystem.currentChart.g.selectAll('.arc');
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

    cleanupEventHandlers() {
      this.eventHandlers.forEach((handlers, item) => {
        if (typeof handlers === 'function') {
          // Old format - single click handler
          item.removeEventListener('click', handlers);
        } else if (handlers && typeof handlers === 'object') {
          // New format - multiple handlers
          if (handlers.click) item.removeEventListener('click', handlers.click);
          if (handlers.hover) item.removeEventListener('mouseenter', handlers.hover);
          if (handlers.hoverOut) item.removeEventListener('mouseleave', handlers.hoverOut);
        }
      });
      this.eventHandlers.clear();
    }

    // Test method for lista-resultado click functionality
    testListaResultadoClick(category) {
      const listaItem = document.querySelector(
        `.lista-resultado-item[ativo-category="${category}"]`
      );
      if (listaItem) {
        const syntheticEvent = new Event('click', { bubbles: true, cancelable: true });
        this.handleListaResultadoClick(syntheticEvent, listaItem);
        return true;
      }
      return false;
    }

    // Debug method to check available categories
    getAvailableCategories() {
      const listaItems = document.querySelectorAll('.lista-resultado-item');
      const categories = Array.from(listaItems)
        .map((item) => item.getAttribute('ativo-category'))
        .filter(Boolean);
      return categories;
    }

    destroy() {
      this.cleanupEventHandlers();
      this.clearActiveListaItem();
      this.isInitialized = false;
      this.chartSystem = null;
    }
  }

  // Create global instance
  window.ReinoListaResultadoChartBridge = new ListaResultadoChartBridge();

  // Auto-initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoListaResultadoChartBridge.init();
    });
  } else {
    window.ReinoListaResultadoChartBridge.init();
  }
})();
