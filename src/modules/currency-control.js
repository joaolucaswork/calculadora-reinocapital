/**
 * Currency Control System - Versão Webflow TXT
 * Handles currency input controls (increase/decrease buttons)
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class CurrencyControlSystem {
    constructor() {
      this.isInitialized = false;
    }

    init() {
      if (this.isInitialized) {
        return;
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.initializeCurrencyControls();
        });
      } else {
        this.initializeCurrencyControls();
      }

      this.isInitialized = true;
    }

    initializeCurrencyControls() {
      const input = document.querySelector('[is-main="true"]');

      if (!input) {
        return;
      }

      const getIncrement = (value) => {
        if (value < 1000) return 100;
        if (value < 10000) return 1000;
        if (value < 100000) return 10000;
        if (value < 1000000) return 50000;
        return 100000;
      };

      const updateValue = (newValue) => {
        const formattedValue = new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(newValue);

        if (window.ReinoEventCoordinator) {
          window.ReinoEventCoordinator.setValue(formattedValue, 'currency-control');
        } else {
          input.value = formattedValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };

      const decreaseButtons = document.querySelectorAll('[currency-control="decrease"]');
      const increaseButtons = document.querySelectorAll('[currency-control="increase"]');

      decreaseButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const current = parseFloat(input.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
          const newValue = Math.max(0, current - getIncrement(current));
          updateValue(newValue);
        });
      });

      increaseButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const current = parseFloat(input.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
          const newValue = current + getIncrement(current);
          updateValue(newValue);
        });
      });
    }
  }

  // Cria instância global
  window.ReinoCurrencyControlSystem = new CurrencyControlSystem();

  // Auto-inicialização com delay
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.ReinoCurrencyControlSystem.init();
      }, 150);
    });
  } else {
    setTimeout(() => {
      window.ReinoCurrencyControlSystem.init();
    }, 150);
  }
})();
