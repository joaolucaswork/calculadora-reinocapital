/**
 * Keyboard Navigation Module
 * Handles Enter key navigation for main currency input
 * Versão sem imports/exports para uso direto no Webflow
 */

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

      // Wait for step navigation system to be available
      this.waitForDependencies();
    }

    waitForDependencies() {
      if (window.ReinoStepNavigationProgressSystem && window.ReinoStepNavigationProgressSystem.isInitialized) {
        this.stepNavigationSystem = window.ReinoStepNavigationProgressSystem;
        this.setupKeyboardListeners();
        this.isInitialized = true;
        
        if (this.debugMode) {
          console.log('✅ Keyboard Navigation System initialized');
        }
      } else {
        // Retry after a short delay
        setTimeout(() => this.waitForDependencies(), 200);
      }
    }

    setupKeyboardListeners() {
      // Target the main currency input specifically
      const mainInput = document.querySelector('input[is-main="true"].currency-input');
      
      if (!mainInput) {
        console.warn('⚠️ Main currency input not found for keyboard navigation');
        return;
      }

      // Add keydown event listener to the main input
      mainInput.addEventListener('keydown', (e) => this.handleKeyDown(e));

      if (this.debugMode) {
        console.log('✅ Keyboard listeners attached to main currency input');
      }
    }

    handleKeyDown(event) {
      // Check if Enter key was pressed
      if (event.key === 'Enter' || event.keyCode === 13) {
        event.preventDefault(); // Prevent form submission
        
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

      // Use the same logic as the navigation buttons
      if (this.stepNavigationSystem.canProceedToNext()) {
        if (this.debugMode) {
          console.log('✅ Proceeding to next step via keyboard navigation');
        }
        
        this.stepNavigationSystem.nextStep();
      } else {
        if (this.debugMode) {
          console.log('❌ Cannot proceed to next step - validation failed');
        }
        
        // Show validation error if available
        if (this.stepNavigationSystem.showValidationError) {
          this.stepNavigationSystem.showValidationError();
        }
      }
    }

    // Method to manually trigger navigation (for testing)
    simulateEnterKey() {
      const mainInput = document.querySelector('input[is-main="true"].currency-input');
      if (mainInput) {
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          keyCode: 13,
          bubbles: true
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

  // Create global instance
  window.ReinoKeyboardNavigationSystem = new KeyboardNavigationSystem();

  // Auto-initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.ReinoKeyboardNavigationSystem.init();
      }, 500); // Delay to ensure other systems are loaded
    });
  } else {
    setTimeout(() => {
      window.ReinoKeyboardNavigationSystem.init();
    }, 500);
  }

})();
