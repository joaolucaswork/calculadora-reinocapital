/**
 * Simple Button System - Clean and Direct
 * No CSS classes, no timeouts, no complex observers
 * Just: validate → enable/disable buttons
 */

export class SimpleButtonSystem {
  constructor() {
    this.stepNavigationSystem = null;
    this.debugMode = window.location.search.includes('debug=true');
  }

  async init(stepNavigationSystem) {
    this.stepNavigationSystem = stepNavigationSystem;

    // Setup buttons once
    this.setupButtons();

    // Setup simple listeners
    this.setupListeners();

    // Initial update
    this.updateAllButtons();

    if (this.debugMode) {
      console.log('✅ SimpleButtonSystem initialized');
    }
  }

  setupButtons() {
    // Next buttons
    document.querySelectorAll('[element-function="next"]').forEach((button) => {
      this.setupButton(button, 'next');
    });

    // Prev buttons
    document.querySelectorAll('.step-btn.prev-btn').forEach((button) => {
      this.setupButton(button, 'prev');
    });
  }

  setupButton(button, type) {
    // Clone to remove existing listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    // Simple click handler
    newButton.addEventListener('click', (e) => {
      e.preventDefault();

      // If disabled, ignore
      if (newButton.disabled) return;

      // Execute navigation
      if (type === 'next') {
        this.stepNavigationSystem?.nextStep?.();
      } else {
        this.stepNavigationSystem?.previousStep?.();
      }
    });
  }

  setupListeners() {
    // Listen for input changes that affect validation
    document.addEventListener('input', (e) => {
      if (e.target.matches('#currency, .currency-input, [data-allocation]')) {
        this.updateAllButtons();
      }
    });

    // Listen for asset selection changes
    document.addEventListener('click', (e) => {
      if (e.target.closest('.ativos_item')) {
        setTimeout(() => this.updateAllButtons(), 50);
      }
    });

    // Listen for step changes
    document.addEventListener('stepValidationChanged', () => {
      this.updateAllButtons();
    });
  }

  updateAllButtons() {
    if (!this.stepNavigationSystem) return;

    // Update next buttons
    const canProceed = this.stepNavigationSystem.canProceedToNext();
    document.querySelectorAll('[element-function="next"]').forEach((button) => {
      button.disabled = !canProceed;
    });

    // Update prev buttons
    const isFirstStep = this.stepNavigationSystem.currentStep === 0;
    document.querySelectorAll('.step-btn.prev-btn').forEach((button) => {
      button.disabled = isFirstStep;
    });

    if (this.debugMode) {
      console.log(`Buttons updated - canProceed: ${canProceed}, isFirstStep: ${isFirstStep}`);
    }
  }

  // Public API
  forceUpdate() {
    this.updateAllButtons();
  }
}
