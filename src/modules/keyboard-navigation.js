(function () {
  'use strict';

  class KeyboardNavigationSystem {
    constructor() {
      this.isInitialized = false;
      this.stepNavigationSystem = null;
      this.debugMode = window.location.search.includes('debug=true');
    }

    init() {
      if (this.isInitialized) {
        return;
      }

      this.waitForDependencies();
    }

    waitForDependencies() {
      if (
        window.ReinoStepNavigationProgressSystem &&
        window.ReinoStepNavigationProgressSystem.isInitialized
      ) {
        this.stepNavigationSystem = window.ReinoStepNavigationProgressSystem;
        this.setupKeyboardListeners();
        this.isInitialized = true;

        if (this.debugMode) {
          console.log('✅ Keyboard Navigation System initialized');
        }
      } else {
        setTimeout(() => this.waitForDependencies(), 200);
      }
    }

    setupKeyboardListeners() {
      const mainInput = document.querySelector('input[is-main="true"].currency-input');

      if (!mainInput) {
        console.warn('⚠️ Main currency input not found for keyboard navigation');
        return;
      }

      mainInput.addEventListener('keydown', (e) => this.handleKeyDown(e));

      if (this.debugMode) {
        console.log('✅ Keyboard listeners attached to main currency input');
      }
    }

    handleKeyDown(event) {
      if (event.key === 'Enter' || event.keyCode === 13) {
        event.preventDefault();

        if (this.debugMode) {
          console.log('🔘 Enter key pressed on main currency input');
        }

        this.triggerNextStep();
      }
    }

    triggerNextStep() {
      if (!this.stepNavigationSystem) {
        console.warn('⚠️ Step navigation system not available');
        return;
      }

      if (this.stepNavigationSystem.canProceedToNext()) {
        if (this.debugMode) {
          console.log('✅ Proceeding to next step via keyboard navigation');
        }

        this.stepNavigationSystem.nextStep();
      } else {
        if (this.debugMode) {
          console.log('❌ Cannot proceed to next step - validation failed');
        }

        if (this.stepNavigationSystem.showValidationError) {
          this.stepNavigationSystem.showValidationError();
        }
      }
    }

    simulateEnterKey() {
      const mainInput = document.querySelector('input[is-main="true"].currency-input');
      if (mainInput) {
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          keyCode: 13,
          bubbles: true,
        });
        mainInput.dispatchEvent(enterEvent);
      }
    }

    destroy() {
      const mainInput = document.querySelector('input[is-main="true"].currency-input');
      if (mainInput) {
        mainInput.removeEventListener('keydown', this.handleKeyDown);
      }
      this.isInitialized = false;
      this.stepNavigationSystem = null;
    }
  }

  window.ReinoKeyboardNavigationSystem = new KeyboardNavigationSystem();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.ReinoKeyboardNavigationSystem.init();
      }, 500);
    });
  } else {
    setTimeout(() => {
      window.ReinoKeyboardNavigationSystem.init();
    }, 500);
  }
})();
