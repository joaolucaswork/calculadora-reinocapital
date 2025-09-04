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

      // Setup reset button listener
      this.setupResetButtonListener();

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

    setupResetButtonListener() {
      const resetButton = document.querySelector('.settings-patrimonio-button');

      if (resetButton) {
        resetButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.handleResetClick();
        });

        if (this.debugMode) {
          console.log('✅ Reset button listener setup complete');
        }
      } else if (this.debugMode) {
        console.warn('⚠️ Reset button (.settings-patrimonio-button) not found');
      }
    }

    handleResetClick() {
      try {
        if (this.debugMode) {
          console.log('🔄 Reset button clicked - clearing all product values');
        }

        // Reset only values, not product selection
        this.resetValuesOnly();

        if (this.debugMode) {
          console.log('✅ Reset completed - values only, products remain selected');
        }

        // Dispatch reset event
        document.dispatchEvent(
          new CustomEvent('patrimonioValuesReset', {
            detail: { timestamp: Date.now() },
          })
        );
      } catch (error) {
        console.error('❌ Error during reset:', error);
      }
    }

    resetValuesOnly() {
      // Reset only values of ACTIVE/SELECTED products, keep them selected
      const activePatrimonioItems = document.querySelectorAll(
        '.patrimonio_interactive_item .active-produto-item'
      );

      if (this.debugMode) {
        console.log(`🔄 Resetting values for ${activePatrimonioItems.length} active products`);
      }

      activePatrimonioItems.forEach((activeItem) => {
        const patrimonioItem = activeItem.closest('.patrimonio_interactive_item');

        if (this.debugMode) {
          const category = patrimonioItem?.getAttribute('ativo-category');
          const product = patrimonioItem?.getAttribute('ativo-product');
          console.log(`🔄 Resetting: ${category} - ${product}`);
        }

        // Reset currency input
        const input = activeItem.querySelector(
          '.currency-input.individual, [input-settings="receive"]'
        );
        if (input) {
          input.value = '';
          input.dispatchEvent(
            new CustomEvent('currencyChange', {
              detail: { value: 0 },
              bubbles: true,
            })
          );
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Reset range slider
        const slider = activeItem.querySelector('range-slider');
        if (slider) {
          slider.value = 0;
          slider.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Reset percentage display
        const percentageDisplay = activeItem.querySelector('.porcentagem-calculadora');
        if (percentageDisplay) {
          percentageDisplay.textContent = '0%';
        }
      });

      // Also reset main patrimony input if needed
      const mainInput = document.querySelector('#currency[is-main="true"]');
      if (mainInput && this.debugMode) {
        console.log('💰 Main patrimony value maintained:', mainInput.value);
      }
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
