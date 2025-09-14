/**
 * Chamada Hover Effects Module
 * Handles push/pull hover effects for cta-link buttons in cta-wrapper using GSAP Flip
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class ChamadaHoverEffects {
    constructor() {
      this.isInitialized = false;
      this.containers = [];
    }

    init() {
      if (this.isInitialized) {
        return;
      }

      this.waitForGSAP();
    }

    waitForGSAP() {
      if (window.gsap && window.gsap.registerPlugin) {
        gsap.registerPlugin(Flip);
        this.setupHoverEffects();
        this.isInitialized = true;
      } else {
        setTimeout(() => this.waitForGSAP(), 50);
      }
    }

    setupHoverEffects() {
      const containers = document.querySelectorAll('.cta-wrapper');

      containers.forEach((container) => {
        const buttons = container.querySelectorAll('.cta-link');

        if (buttons.length !== 2) {
          return;
        }

        const [firstButton, secondButton] = buttons;

        // Set transform origins for proper growth direction
        gsap.set(firstButton, { transformOrigin: 'left center' });
        gsap.set(secondButton, { transformOrigin: 'right center' });

        // First button hover - grows to the right
        firstButton.addEventListener('mouseenter', () => {
          gsap.to(firstButton, {
            width: '180px',
            duration: 0.4,
            ease: 'power2.out',
          });

          gsap.to(secondButton, {
            width: '120px',
            duration: 0.4,
            ease: 'power2.out',
          });
        });

        firstButton.addEventListener('mouseleave', () => {
          gsap.to([firstButton, secondButton], {
            width: '140px',
            duration: 0.3,
            ease: 'power2.out',
          });
        });

        // Second button hover - grows to the left
        secondButton.addEventListener('mouseenter', () => {
          gsap.to(firstButton, {
            width: '120px',
            duration: 0.4,
            ease: 'power2.out',
          });

          gsap.to(secondButton, {
            width: '180px',
            duration: 0.4,
            ease: 'power2.out',
          });
        });

        secondButton.addEventListener('mouseleave', () => {
          gsap.to([firstButton, secondButton], {
            width: '140px',
            duration: 0.3,
            ease: 'power2.out',
          });
        });

        this.containers.push({
          container,
          buttons: [firstButton, secondButton],
        });
      });
    }

    destroy() {
      this.containers.forEach(({ buttons }) => {
        buttons.forEach((button) => {
          button.removeEventListener('mouseenter', this.handleMouseEnter);
          button.removeEventListener('mouseleave', this.handleMouseLeave);
        });
      });

      this.containers = [];
      this.isInitialized = false;
    }
  }

  // Make globally available
  window.ChamadaHoverEffects = ChamadaHoverEffects;

  // Create global instance
  window.reinoChamadaHoverEffects = new ChamadaHoverEffects();

  // Auto-initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.reinoChamadaHoverEffects.init();
    });
  } else {
    window.reinoChamadaHoverEffects.init();
  }
})();
