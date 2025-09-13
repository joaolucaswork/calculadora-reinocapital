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
      this.colorBallAnimations = new Map();
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
        console.warn('MotionDev not available for DonutListInteraction');
      }
    }

    setupEventListeners() {
      document.addEventListener('donutCategoryHover', (event) => {
        this.handleCategoryHover(event.detail.category);
      });

      document.addEventListener('donutCategoryHoverEnd', () => {
        this.handleCategoryHoverEnd();
      });

      document.addEventListener('DOMContentLoaded', () => {
        this.cacheListaItems();
      });

      document.addEventListener('resultadoSyncCompleted', () => {
        this.cacheListaItems();
      });
    }

    cacheListaItems() {
      this.listaItems = Array.from(document.querySelectorAll('.lista-resultado-item'));

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
          this.setItemOpacity(item, '1');

          this.animateColorBall(item, 1.2);
        } else {
          this.setItemOpacity(item, '0.3');

          this.animateColorBall(item, 1.0);
        }
      });
    }

    handleCategoryHoverEnd() {
      if (!this.isHovering) return;

      this.isHovering = false;
      this.currentHoveredCategory = null;

      this.listaItems.forEach((item) => {
        const originalOpacity = this.originalOpacities.get(item) || '1';
        this.setItemOpacity(item, originalOpacity);

        this.animateColorBall(item, 1.0);
      });
    }

    setItemOpacity(item, opacity) {
      if (!item) return;

      item.style.transition = 'opacity 0.3s ease';
      item.style.opacity = opacity;
    }

    animateColorBall(item, targetScale) {
      if (!item) return;

      const colorBall = item.querySelector('.color-ball');
      if (!colorBall) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion || !this.Motion) {
        colorBall.style.transform = targetScale === 1.0 ? '' : `scale(${targetScale})`;
        return;
      }

      const existingAnimation = this.colorBallAnimations.get(colorBall);
      if (existingAnimation && typeof existingAnimation.cancel === 'function') {
        existingAnimation.cancel();
      }

      const { animate } = this.Motion;

      const animation = animate(
        colorBall,
        {
          scale: targetScale,
        },
        {
          duration: 0.3,
          ease: 'circOut',
        }
      );

      this.colorBallAnimations.set(colorBall, animation);

      if (animation && typeof animation.then === 'function') {
        animation
          .then(() => {
            this.colorBallAnimations.delete(colorBall);
          })
          .catch(() => {
            this.colorBallAnimations.delete(colorBall);
          });
      }
    }

    getCurrentHoveredCategory() {
      return this.currentHoveredCategory;
    }

    isCurrentlyHovering() {
      return this.isHovering;
    }

    manualTriggerHover(category) {
      this.handleCategoryHover(category);
    }

    manualClearHover() {
      this.handleCategoryHoverEnd();
    }

    refresh() {
      this.cacheListaItems();
    }

    cleanup() {
      this.colorBallAnimations.forEach((animation, colorBall) => {
        if (animation && typeof animation.cancel === 'function') {
          animation.cancel();
        }

        if (colorBall) {
          colorBall.style.transform = '';
        }
      });
      this.colorBallAnimations.clear();
    }
  }

  window.DonutListInteraction = DonutListInteraction;

  window.donutListInteraction = new DonutListInteraction();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.donutListInteraction.init();
    });
  } else {
    window.donutListInteraction.init();
  }
})();
