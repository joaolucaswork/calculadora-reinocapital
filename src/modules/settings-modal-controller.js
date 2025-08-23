(function () {
  'use strict';

  class SettingsModalController {
    constructor() {
      this.isInitialized = false;
      this.modal = null;
      this.toggleButton = null;
      this.isModalOpen = false;
      this.debugMode = window.location.search.includes('debug=true');
    }

    init() {
      if (this.isInitialized) return;

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      try {
        this.cacheElements();
        this.setupEventListeners();
        this.initializeModalState();
        this.isInitialized = true;

        if (this.debugMode) {
          console.log('✅ Settings Modal Controller initialized');
        }
      } catch (error) {
        console.error('❌ Settings Modal Controller initialization failed:', error);
      }
    }

    cacheElements() {
      this.toggleButton = document.querySelector('[settings-att="button"]');
      this.modal = document.querySelector('[settings-att="modal"]');

      if (!this.toggleButton) {
        throw new Error('Settings toggle button not found');
      }

      if (!this.modal) {
        throw new Error('Settings modal not found');
      }
    }

    setupEventListeners() {
      this.toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleModal();
      });

      document.addEventListener('click', (e) => {
        if (
          this.isModalOpen &&
          !this.modal.contains(e.target) &&
          !this.toggleButton.contains(e.target)
        ) {
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
      this.modal.style.display = 'none';
      this.modal.style.opacity = '0';
      this.modal.style.transform = 'scale(0.95)';
      this.toggleButton.classList.remove('active');
      this.isModalOpen = false;
    }

    toggleModal() {
      if (this.isModalOpen) {
        this.closeModal();
      } else {
        this.openModal();
      }
    }

    async openModal() {
      if (this.isModalOpen) return;

      this.isModalOpen = true;
      this.modal.style.display = 'block';
      this.toggleButton.classList.add('active');

      if (window.Motion) {
        await window.Motion.animate(
          this.modal,
          {
            opacity: [0, 1],
            scale: [0.95, 1],
          },
          {
            duration: 0.2,
            ease: 'easeOut',
          }
        ).finished;
      } else {
        this.modal.style.opacity = '1';
        this.modal.style.transform = 'scale(1)';
      }

      document.dispatchEvent(
        new CustomEvent('settingsModalOpened', {
          detail: { modal: this.modal },
        })
      );

      if (this.debugMode) {
        console.log('🔧 Settings modal opened');
      }
    }

    async closeModal() {
      if (!this.isModalOpen) return;

      if (window.Motion) {
        await window.Motion.animate(
          this.modal,
          {
            opacity: [1, 0],
            scale: [1, 0.95],
          },
          {
            duration: 0.15,
            ease: 'easeIn',
          }
        ).finished;
      } else {
        this.modal.style.opacity = '0';
        this.modal.style.transform = 'scale(0.95)';
      }

      this.modal.style.display = 'none';
      this.toggleButton.classList.remove('active');
      this.isModalOpen = false;

      document.dispatchEvent(
        new CustomEvent('settingsModalClosed', {
          detail: { modal: this.modal },
        })
      );

      if (this.debugMode) {
        console.log('🔧 Settings modal closed');
      }
    }

    getModalState() {
      return {
        isOpen: this.isModalOpen,
        modal: this.modal,
        toggleButton: this.toggleButton,
      };
    }
  }

  function initializeSettingsModalController() {
    if (!window.ReinoSettingsModalController) {
      const controller = new SettingsModalController();
      window.ReinoSettingsModalController = controller;
      controller.init();
    }
  }

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeSettingsModalController);
    } else {
      initializeSettingsModalController();
    }
  }
})();
