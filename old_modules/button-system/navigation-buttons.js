/**
 * Navigation Buttons Module
 * Handles next/prev button functionality only
 */

export class NavigationButtons {
  constructor() {
    this.stepNavigationSystem = null;
    this.debugMode = window.location.search.includes('debug=true');

    // Simple debounced update
    this.updateButtons = this.debounce(() => this._updateAllButtons(), 100);
  }

  init(stepNavigationSystem) {
    this.stepNavigationSystem = stepNavigationSystem;

    this.setupButtons();
    this.setupListeners();
    this.updateButtons();

    this.log('✅ Navigation buttons initialized');
  }

  setupButtons() {
    // Setup next buttons
    document.querySelectorAll('[element-function="next"]').forEach((button) => {
      this.setupNextButton(button);
    });

    // Setup prev buttons
    document.querySelectorAll('.step-btn.prev-btn').forEach((button) => {
      this.setupPrevButton(button);
    });
  }

  setupNextButton(button) {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (newButton.disabled) return;

      this.log('Next button clicked');
      this.handleNext();
    });
  }

  setupPrevButton(button) {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (newButton.disabled) return;

      this.log('Prev button clicked');
      this.handlePrev();
    });
  }

  handleNext() {
    if (this.stepNavigationSystem?.nextStep) {
      if (this.stepNavigationSystem.canProceedToNext()) {
        this.stepNavigationSystem.nextStep();
      } else {
        this.stepNavigationSystem.showValidationError?.();
      }
    }
  }

  handlePrev() {
    if (this.stepNavigationSystem?.previousStep) {
      this.stepNavigationSystem.previousStep();
    }
  }

  setupListeners() {
    // Listen for validation changes
    document.addEventListener('stepValidationChanged', () => {
      this.updateButtons();
    });

    // Listen for input changes
    document.addEventListener('input', (e) => {
      if (e.target.matches('#currency, .currency-input[is-main="true"], [data-allocation]')) {
        this.updateButtons();
      }
    });

    // Listen for asset selection changes
    document.addEventListener('click', (e) => {
      if (e.target.closest('.ativos_item')) {
        setTimeout(() => this.updateButtons(), 50);
      }
    });
  }

  _updateAllButtons() {
    if (!this.stepNavigationSystem) {
      this.disableAllButtons();
      return;
    }

    this.updateNextButtons();
    this.updatePrevButtons();
  }

  updateNextButtons() {
    const canProceed = this.stepNavigationSystem.canProceedToNext();
    document.querySelectorAll('[element-function="next"]').forEach((button) => {
      button.disabled = !canProceed;
    });
  }

  updatePrevButtons() {
    const isFirstStep = this.stepNavigationSystem.currentStep === 0;
    document.querySelectorAll('.step-btn.prev-btn').forEach((button) => {
      button.disabled = isFirstStep;
    });
  }

  disableAllButtons() {
    document.querySelectorAll('[element-function="next"], .step-btn.prev-btn').forEach((button) => {
      button.disabled = true;
    });
  }

  // Public API
  forceUpdate() {
    this.updateButtons();
  }

  debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  log(message) {
    if (this.debugMode) {
      console.log(`🔘 [NavigationButtons] ${message}`);
    }
  }
}
