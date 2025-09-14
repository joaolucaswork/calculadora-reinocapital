/**
 * Currency Control System - AppState Integration
 * Controles de incremento/decremento integrados com AppState centralizado
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class CurrencyControlSystem {
    constructor() {
      this.isInitialized = false;
      this.appState = null;
      this.debugMode = false;
    }

    async init() {
      if (this.isInitialized) {
        return;
      }

      // Aguarda AppState estar disponível
      await this.waitForAppState();

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.initializeCurrencyControls();
        });
      } else {
        this.initializeCurrencyControls();
      }

      this.isInitialized = true;
      this.log('✅ CurrencyControlSystem initialized with AppState');
    }

    async waitForAppState() {
      let attempts = 0;
      const maxAttempts = 50;

      while (!window.ReinoAppState && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (window.ReinoAppState) {
        this.appState = window.ReinoAppState;
        this.log('✅ AppState connected successfully');
      } else {
        this.log('⚠️ AppState not available, falling back to legacy mode');
      }
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
        // Prioriza AppState se disponível
        if (this.appState) {
          this.appState.setPatrimonio(newValue, 'currency-control');
          this.log(`💰 Value updated via AppState: ${this.formatCurrency(newValue)}`);
          return;
        }

        // Fallback para sistemas legados
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

        this.log(`💰 Value updated via legacy mode: ${formattedValue}`);
      };

      const decreaseButtons = document.querySelectorAll('[currency-control="decrease"]');
      const increaseButtons = document.querySelectorAll('[currency-control="increase"]');

      decreaseButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const current = this.getCurrentValue();
          const increment = getIncrement(current);
          const newValue = Math.max(0, current - increment);
          updateValue(newValue);
          this.log(
            `⬇️ Decreased by ${this.formatCurrency(increment)}: ${this.formatCurrency(current)} → ${this.formatCurrency(newValue)}`
          );
        });
      });

      increaseButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const current = this.getCurrentValue();
          const increment = getIncrement(current);
          const newValue = current + increment;
          updateValue(newValue);
          this.log(
            `⬆️ Increased by ${this.formatCurrency(increment)}: ${this.formatCurrency(current)} → ${this.formatCurrency(newValue)}`
          );
        });
      });

      this.log(
        `🎛️ Currency controls initialized - ${decreaseButtons.length} decrease, ${increaseButtons.length} increase buttons`
      );
    }

    getCurrentValue() {
      // Prioriza AppState se disponível
      if (this.appState) {
        const patrimony = this.appState.getPatrimonio();
        return patrimony.value;
      }

      // Fallback para input DOM
      const input = document.querySelector('[is-main="true"]');
      if (input && input.value) {
        return parseFloat(input.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      }

      return 0;
    }

    // ==================== UTILITY METHODS ====================

    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    }

    // ==================== DEBUG METHODS ====================

    enableDebug() {
      this.debugMode = true;
      this.log('🐛 Debug mode enabled for CurrencyControlSystem');
    }

    disableDebug() {
      this.debugMode = false;
    }

    log(message, data = null) {
      if (this.debugMode) {
        if (data) {
          console.log(`[CurrencyControl] ${message}`, data);
        } else {
          console.log(`[CurrencyControl] ${message}`);
        }
      }
    }

    getDebugInfo() {
      return {
        isInitialized: this.isInitialized,
        hasAppState: !!this.appState,
        currentValue: this.getCurrentValue(),
        debugMode: this.debugMode,
      };
    }
  }

  window.ReinoCurrencyControlSystem = new CurrencyControlSystem();

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
