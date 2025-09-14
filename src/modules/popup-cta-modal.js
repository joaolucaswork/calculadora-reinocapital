/**
 * Popup CTA Modal System
 * Handles popup modal animations using Motion One library
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class PopupCtaModal {
    constructor() {
      this.isInitialized = false;
      this.isModalOpen = false;
      this.isAnimating = false;
      this.Motion = null;
      this.popupContainer = null;
      this.backdropOverlay = null;
      this.modalContent = null;
      this.ctaTriggers = [];
    }

    init() {
      if (this.isInitialized) {
        return;
      }

      this.waitForMotion();
    }

    waitForMotion() {
      if (window.Motion) {
        this.Motion = window.Motion;
        this.setup();
        this.isInitialized = true;
      } else {
        setTimeout(() => this.waitForMotion(), 50);
      }
    }

    setup() {
      try {
        this.cacheElements();
        this.setupEventListeners();
        this.initializeModalState();
      } catch (error) {
        console.error('PopupCtaModal: Setup failed:', error);
      }
    }

    cacheElements() {
      this.popupContainer = document.querySelector('.popup-cta');
      this.backdropOverlay = document.querySelector('.backdrop-overlay');
      this.modalContent = document.querySelector('.popup-cta_left-wrapper');
      this.ctaTriggers = document.querySelectorAll('.cta-reino');
      this.closeButton = document.querySelector('.close-button-modal-reino');

      if (!this.popupContainer) {
        throw new Error('Popup container (.popup-cta) not found');
      }

      if (!this.backdropOverlay) {
        throw new Error('Backdrop overlay (.backdrop-overlay) not found');
      }

      if (!this.modalContent) {
        throw new Error('Modal content (.popup-cta_left-wrapper) not found');
      }

      if (this.ctaTriggers.length === 0) {
        console.warn('No CTA triggers (.cta-reino) found');
      }

      if (!this.closeButton) {
        console.warn('Close button (.close-button-modal-reino) not found');
      }
    }

    setupEventListeners() {
      this.ctaTriggers.forEach((trigger) => {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.openModal();
        });
      });

      if (this.closeButton) {
        this.closeButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.closeModal();
        });
      }

      this.backdropOverlay.addEventListener('click', (e) => {
        if (e.target === this.backdropOverlay) {
          this.closeModal();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isModalOpen) {
          this.closeModal();
        }
      });
    }

    initializeModalState() {
      this.popupContainer.style.display = 'none';
      this.backdropOverlay.style.opacity = '0';
      // Estado inicial: modal fora da tela à direita, com scale reduzido
      this.modalContent.style.transform = 'translate(100vw, -50%) scale(0.95)';
      this.modalContent.style.opacity = '0';
      this.isModalOpen = false;
      this.isAnimating = false;
    }

    async openModal() {
      if (this.isModalOpen || this.isAnimating) {
        return;
      }

      this.isAnimating = true;
      this.isModalOpen = true;
      this.popupContainer.style.display = 'block';

      const { animate } = this.Motion;

      // Premium easing: backdrop com fade suave
      const backdropAnimation = animate(
        this.backdropOverlay,
        {
          opacity: [0, 1],
        },
        {
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94], // Custom cubic-bezier para suavidade premium
        }
      );

      // Premium easing: modal com entrada elegante
      const modalAnimation = animate(
        this.modalContent,
        {
          transform: ['translate(100vw, -50%)', 'translate(0px, -50%)'],
          opacity: [0, 1],
          scale: [0.95, 1],
        },
        {
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier para entrada suave e elegante
          delay: 0.05,
        }
      );

      await Promise.all([backdropAnimation.finished, modalAnimation.finished]);

      this.isAnimating = false;

      document.dispatchEvent(
        new CustomEvent('popupCtaOpened', {
          detail: { modal: this.popupContainer },
        })
      );
    }

    async closeModal() {
      if (!this.isModalOpen || this.isAnimating) {
        return;
      }

      this.isAnimating = true;
      const { animate } = this.Motion;

      // Premium easing: modal com saída elegante
      const modalAnimation = animate(
        this.modalContent,
        {
          transform: ['translate(0px, -50%)', 'translate(100vw, -50%)'],
          opacity: [1, 0],
          scale: [1, 0.95],
        },
        {
          duration: 0.4,
          ease: [0.7, 0, 0.84, 0], // Custom cubic-bezier para saída suave e rápida
        }
      );

      // Premium easing: backdrop com fade elegante (sem delay)
      const backdropAnimation = animate(
        this.backdropOverlay,
        {
          opacity: [1, 0],
        },
        {
          duration: 0.3,
          ease: [0.55, 0.085, 0.68, 0.53], // Custom cubic-bezier para fade suave
        }
      );

      await Promise.all([modalAnimation.finished, backdropAnimation.finished]);

      this.popupContainer.style.display = 'none';
      this.isModalOpen = false;
      this.isAnimating = false;

      document.dispatchEvent(
        new CustomEvent('popupCtaClosed', {
          detail: { modal: this.popupContainer },
        })
      );
    }

    getModalState() {
      return {
        isOpen: this.isModalOpen,
        container: this.popupContainer,
        backdrop: this.backdropOverlay,
        content: this.modalContent,
      };
    }
  }

  window.PopupCtaModal = PopupCtaModal;

  window.reinoPopupCtaModal = new PopupCtaModal();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.reinoPopupCtaModal.init();
    });
  } else {
    window.reinoPopupCtaModal.init();
  }
})();
