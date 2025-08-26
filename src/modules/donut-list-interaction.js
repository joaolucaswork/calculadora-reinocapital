/**
 * Donut List Interaction Module
 * Versão sem imports/exports para uso direto no Webflow
 * Handles cross-component interaction between donut chart hover and lista-resultado-item opacity
 */

(function () {
  'use strict';

  class DonutListInteraction {
    constructor() {
      this.isInitialized = false;
      this.listaItems = [];
      this.originalOpacities = new Map();
      this.isHovering = false;
      this.currentHoveredCategory = null;
    }

    init() {
      if (this.isInitialized) return;

      try {
        this.setupEventListeners();
        this.cacheListaItems();
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize DonutListInteraction:', error);
      }
    }

    setupEventListeners() {
      // Listen for donut chart hover events
      document.addEventListener('donutCategoryHover', (event) => {
        this.handleCategoryHover(event.detail.category);
      });

      document.addEventListener('donutCategoryHoverEnd', () => {
        this.handleCategoryHoverEnd();
      });

      // Re-cache items when DOM changes
      document.addEventListener('DOMContentLoaded', () => {
        this.cacheListaItems();
      });

      // Listen for dynamic content updates
      document.addEventListener('resultadoSyncCompleted', () => {
        this.cacheListaItems();
      });
    }

    cacheListaItems() {
      // Find all lista-resultado-item elements
      this.listaItems = Array.from(document.querySelectorAll('.lista-resultado-item'));
      
      // Store original opacities
      this.listaItems.forEach((item) => {
        const computedStyle = window.getComputedStyle(item);
        const originalOpacity = computedStyle.opacity || '1';
        this.originalOpacities.set(item, originalOpacity);
      });
    }

    handleCategoryHover(hoveredCategory) {
      if (!hoveredCategory || this.listaItems.length === 0) return;

      this.isHovering = true;
      this.currentHoveredCategory = hoveredCategory;

      this.listaItems.forEach((item) => {
        const itemCategory = item.getAttribute('ativo-category');
        
        if (itemCategory === hoveredCategory) {
          // Keep full opacity for matching category
          this.setItemOpacity(item, '1');
        } else {
          // Reduce opacity for non-matching categories
          this.setItemOpacity(item, '0.3');
        }
      });
    }

    handleCategoryHoverEnd() {
      if (!this.isHovering) return;

      this.isHovering = false;
      this.currentHoveredCategory = null;

      // Restore all items to original opacity
      this.listaItems.forEach((item) => {
        const originalOpacity = this.originalOpacities.get(item) || '1';
        this.setItemOpacity(item, originalOpacity);
      });
    }

    setItemOpacity(item, opacity) {
      if (!item) return;

      // Use CSS transition for smooth opacity change
      item.style.transition = 'opacity 0.3s ease';
      item.style.opacity = opacity;
    }

    // Public methods for external control
    getCurrentHoveredCategory() {
      return this.currentHoveredCategory;
    }

    isCurrentlyHovering() {
      return this.isHovering;
    }

    // Manual trigger methods (for testing or external use)
    manualTriggerHover(category) {
      this.handleCategoryHover(category);
    }

    manualClearHover() {
      this.handleCategoryHoverEnd();
    }

    // Refresh method to re-cache items
    refresh() {
      this.cacheListaItems();
    }
  }

  // Make globally available
  window.DonutListInteraction = DonutListInteraction;

  // Create global instance
  window.donutListInteraction = new DonutListInteraction();

  // Auto-initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.donutListInteraction.init();
    });
  } else {
    window.donutListInteraction.init();
  }

})();
