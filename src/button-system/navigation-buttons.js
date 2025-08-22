/**
 * Navigation Buttons Module - Webflow Version
 * Handles next/prev button functionality only
 */

window.ReinoNavigationButtons = (function() {
  'use strict';

  function NavigationButtons() {
    this.stepNavigationSystem = null;
    this.debugMode = window.location.search.includes('debug=true');

    // Simple debounced update
    var self = this;
    this.updateButtons = this.debounce(function() {
      return self._updateAllButtons();
    }, 100);
  }

  NavigationButtons.prototype.init = function(stepNavigationSystem) {
    this.stepNavigationSystem = stepNavigationSystem;

    this.setupButtons();
    this.setupListeners();
    this.updateButtons();

    this.log('✅ Navigation buttons initialized');
  };

  NavigationButtons.prototype.setupButtons = function() {
    var self = this;

    // Setup next buttons
    document.querySelectorAll('[element-function="next"]').forEach(function(button) {
      self.setupNextButton(button);
    });

    // Setup prev buttons
    document.querySelectorAll('.step-btn.prev-btn').forEach(function(button) {
      self.setupPrevButton(button);
    });
  };

  NavigationButtons.prototype.setupNextButton = function(button) {
    var self = this;
    var newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      if (newButton.disabled) return;

      self.log('Next button clicked');
      self.handleNext();
    });
  };

  NavigationButtons.prototype.setupPrevButton = function(button) {
    var self = this;
    var newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      if (newButton.disabled) return;

      self.log('Prev button clicked');
      self.handlePrev();
    });
  };

  NavigationButtons.prototype.handleNext = function() {
    if (this.stepNavigationSystem && this.stepNavigationSystem.nextStep) {
      if (this.stepNavigationSystem.canProceedToNext()) {
        this.stepNavigationSystem.nextStep();
      } else {
        if (this.stepNavigationSystem.showValidationError) {
          this.stepNavigationSystem.showValidationError();
        }
      }
    }
  };

  NavigationButtons.prototype.handlePrev = function() {
    if (this.stepNavigationSystem && this.stepNavigationSystem.previousStep) {
      this.stepNavigationSystem.previousStep();
    }
  };

  NavigationButtons.prototype.setupListeners = function() {
    var self = this;

    // Listen for validation changes
    document.addEventListener('stepValidationChanged', function() {
      self.updateButtons();
    });

    // Listen for input changes
    document.addEventListener('input', function(e) {
      if (e.target.matches('#currency, .currency-input[is-main="true"], [data-allocation]')) {
        self.updateButtons();
      }
    });

    // Listen for asset selection changes
    document.addEventListener('click', function(e) {
      if (e.target.closest('.ativos_item')) {
        setTimeout(function() {
          self.updateButtons();
        }, 50);
      }
    });
  };

  NavigationButtons.prototype._updateAllButtons = function() {
    if (!this.stepNavigationSystem) {
      this.disableAllButtons();
      return;
    }

    this.updateNextButtons();
    this.updatePrevButtons();
  };

  NavigationButtons.prototype.updateNextButtons = function() {
    var canProceed = this.stepNavigationSystem.canProceedToNext();
    document.querySelectorAll('[element-function="next"]').forEach(function(button) {
      button.disabled = !canProceed;
    });
  };

  NavigationButtons.prototype.updatePrevButtons = function() {
    var isFirstStep = this.stepNavigationSystem.currentStep === 0;
    document.querySelectorAll('.step-btn.prev-btn').forEach(function(button) {
      button.disabled = isFirstStep;
    });
  };

  NavigationButtons.prototype.disableAllButtons = function() {
    document.querySelectorAll('[element-function="next"], .step-btn.prev-btn').forEach(function(button) {
      button.disabled = true;
    });
  };

  // Public API
  NavigationButtons.prototype.forceUpdate = function() {
    this.updateButtons();
  };

  NavigationButtons.prototype.debounce = function(func, wait) {
    var timeout;
    var self = this;
    return function() {
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(self, args);
      }, wait);
    };
  };

  NavigationButtons.prototype.log = function(message) {
    if (this.debugMode) {
      console.log('🔘 [NavigationButtons] ' + message);
    }
  };

  // Cria instância global
  window.ReinoNavigationButtons = new NavigationButtons();

  return NavigationButtons;
})();