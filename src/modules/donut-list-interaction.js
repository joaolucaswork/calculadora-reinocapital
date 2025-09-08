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
      this.Motion = null;
      this.colorBallAnimations = new Map(); // Track active animations
    }

    init() {
      if (this.isInitialized) return;

      try {
        this.waitForMotion();
        this.setupEventListeners();
        this.cacheListaItems();
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize DonutListInteraction:', error);
      }
    }

    waitForMotion() {
      if (window.Motion) {
        this.Motion = window.Motion;
      } else {
        // Motion not available yet, continue without it
        console.warn('MotionDev not available for DonutListInteraction');
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
          // Scale up the color ball for matching category
          this.animateColorBall(item, 1.2);
        } else {
          // Reduce opacity for non-matching categories
          this.setItemOpacity(item, '0.3');
          // Keep color ball at normal scale for non-matching categories
          this.animateColorBall(item, 1.0);
        }
      });
    }

    handleCategoryHoverEnd() {
      if (!this.isHovering) return;

      this.isHovering = false;
      this.currentHoveredCategory = null;

      // Restore all items to original opacity and color ball scale
      this.listaItems.forEach((item) => {
        const originalOpacity = this.originalOpacities.get(item) || '1';
        this.setItemOpacity(item, originalOpacity);
        // Reset color ball scale to normal
        this.animateColorBall(item, 1.0);
      });
    }

    setItemOpacity(item, opacity) {
      if (!item) return;

      // Use CSS transition for smooth opacity change
      item.style.transition = 'opacity 0.3s ease';
      item.style.opacity = opacity;
    }

    animateColorBall(item, targetScale) {
      if (!item) return;

      const colorBall = item.querySelector('.color-ball');
      if (!colorBall) return;

      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion || !this.Motion) {
        // Use CSS transition fallback for reduced motion or when Motion is not available
        colorBall.style.transform = targetScale === 1.0 ? '' : `scale(${targetScale})`;
        return;
      }

      // Cancel any existing animation for this color ball
      const existingAnimation = this.colorBallAnimations.get(colorBall);
      if (existingAnimation && typeof existingAnimation.cancel === 'function') {
        existingAnimation.cancel();
      }

      // Create new animation with MotionDev
      const { animate } = this.Motion;

      const animation = animate(
        colorBall,
        {
          scale: targetScale,
        },
        {
          duration: 0.3, // Match the opacity transition duration
          ease: 'circOut', // Premium easing for smooth scale animation
        }
      );

      // Store the animation reference for potential cancellation
      this.colorBallAnimations.set(colorBall, animation);

      // Clean up animation reference when complete
      if (animation && typeof animation.then === 'function') {
        animation
          .then(() => {
            this.colorBallAnimations.delete(colorBall);
          })
          .catch(() => {
            // Handle animation cancellation or errors
            this.colorBallAnimations.delete(colorBall);
          });
      }
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

    // Cleanup method for animations
    cleanup() {
      // Cancel all active color ball animations
      this.colorBallAnimations.forEach((animation, colorBall) => {
        if (animation && typeof animation.cancel === 'function') {
          animation.cancel();
        }
        // Reset scale to normal
        if (colorBall) {
          colorBall.style.transform = '';
        }
      });
      this.colorBallAnimations.clear();
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
