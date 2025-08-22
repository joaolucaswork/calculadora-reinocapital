/**
 * Simple Button System - Versão Webflow TXT
 * No CSS classes, no timeouts, no complex observers
 * Versão sem imports/exports para uso direto no Webflow
 */

(function() {
  'use strict';

  class SimpleButtonSystem {
    constructor() {
      this.stepNavigationSystem = null;
      this.debugMode = window.location.search.includes('debug=true');
    }

    async init(stepNavigationSystem) {
      this.stepNavigationSystem = stepNavigationSystem;

      this.setupButtons();
      this.setupListeners();
      this.updateAllButtons();

      if (this.debugMode) {
        console.log('✅ SimpleButtonSystem initialized');
      }
    }

    setupButtons() {
      document.querySelectorAll('[element-function="next"]').forEach((button) => {
        this.setupButton(button, 'next');
      });

      document.querySelectorAll('.step-btn.prev-btn').forEach((button) => {
        this.setupButton(button, 'prev');
      });
    }

    setupButton(button, type) {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);

      newButton.addEventListener('click', (e) => {
        e.preventDefault();

        if (newButton.disabled) return;

        if (type === 'next') {
          this.stepNavigationSystem?.nextStep?.();
        } else {
          this.stepNavigationSystem?.previousStep?.();
        }
      });
    }

    setupListeners() {
      document.addEventListener('input', (e) => {
        if (e.target.matches('#currency, .currency-input, [data-allocation]')) {
          this.updateAllButtons();
        }
      });

      document.addEventListener('click', (e) => {
        if (e.target.closest('.ativos_item')) {
          setTimeout(() => this.updateAllButtons(), 50);
        }
      });

      document.addEventListener('stepValidationChanged', () => {
        this.updateAllButtons();
      });
    }

    updateAllButtons() {
      if (!this.stepNavigationSystem) return;

      const canProceed = this.stepNavigationSystem.canProceedToNext();
      document.querySelectorAll('[element-function="next"]').forEach((button) => {
        button.disabled = !canProceed;
      });

      const isFirstStep = this.stepNavigationSystem.currentStep === 0;
      document.querySelectorAll('.step-btn.prev-btn').forEach((button) => {
        button.disabled = isFirstStep;
      });

      if (this.debugMode) {
        console.log(`Buttons updated - canProceed: ${canProceed}, isFirstStep: ${isFirstStep}`);
      }
    }

    updateNextButtons(enabled) {
      document.querySelectorAll('[element-function="next"]').forEach((button) => {
        button.disabled = !enabled;
        
        if (enabled) {
          button.classList.remove('disabled');
          button.style.opacity = '';
          button.style.pointerEvents = '';
        } else {
          button.classList.add('disabled');
          button.style.opacity = '0.5';
          button.style.pointerEvents = 'none';
        }
      });
    }

    updatePrevButtons(enabled) {
      document.querySelectorAll('.step-btn.prev-btn').forEach((button) => {
        button.disabled = !enabled;
        
        if (enabled) {
          button.classList.remove('disabled');
          button.style.opacity = '';
          button.style.pointerEvents = '';
        } else {
          button.classList.add('disabled');
          button.style.opacity = '0.5';
          button.style.pointerEvents = 'none';
        }
      });
    }

    enableAllButtons() {
      document.querySelectorAll('[element-function="next"], .step-btn.prev-btn').forEach((button) => {
        button.disabled = false;
        button.classList.remove('disabled');
        button.style.opacity = '';
        button.style.pointerEvents = '';
      });
    }

    disableAllButtons() {
      document.querySelectorAll('[element-function="next"], .step-btn.prev-btn').forEach((button) => {
        button.disabled = true;
        button.classList.add('disabled');
        button.style.opacity = '0.5';
        button.style.pointerEvents = 'none';
      });
    }

    refreshButtons() {
      this.setupButtons();
      this.updateAllButtons();
    }

    getButtonState() {
      const nextButtons = document.querySelectorAll('[element-function="next"]');
      const prevButtons = document.querySelectorAll('.step-btn.prev-btn');
      
      return {
        next: {
          count: nextButtons.length,
          enabled: Array.from(nextButtons).some(btn => !btn.disabled)
        },
        prev: {
          count: prevButtons.length,
          enabled: Array.from(prevButtons).some(btn => !btn.disabled)
        }
      };
    }
  }

  // Cria instância global
  window.ReinoSimpleButtonSystem = new SimpleButtonSystem();

  // Auto-inicialização com delay para aguardar outros sistemas
  setTimeout(() => {
    if (window.ReinoStepNavigationProgressSystem) {
      window.ReinoSimpleButtonSystem.init(window.ReinoStepNavigationProgressSystem);
    }
  }, 500);

})();