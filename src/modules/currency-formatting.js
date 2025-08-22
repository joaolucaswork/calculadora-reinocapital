/**
 * Currency Formatting System - Versão Webflow TXT
 * Handles currency input formatting and validation
 * Versão sem imports/exports para uso direto no Webflow
 */

(function() {
  'use strict';

  class CurrencyFormattingSystem {
    constructor() {
      this.isInitialized = false;
      this.domObserver = null;
      this.boundHandlers = new Map();
      this.isDestroyed = false;
    }

    init() {
      if (this.isInitialized || this.isDestroyed) {
        return;
      }

      document.addEventListener('DOMContentLoaded', () => {
        this.initializeCurrencySystem();
      });

      setTimeout(() => this.initializeCurrencySystem(), 100);

      this.isInitialized = true;
    }

    initializeCurrencySystem() {
      if (this.isDestroyed) return;

      if (window.Webflow) {
        window.Webflow.push(() => {
          this.setupCurrencyFormatting();
        });
      } else {
        this.setupCurrencyFormatting();
      }
    }

    setupCurrencyFormatting() {
      if (this.isDestroyed) return;

      const formatBRL = (value) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value);
      };

      const formatCurrencyInput = (input) => {
        let value = input.value.replace(/\D/g, '');
        if (value === '') {
          input.value = '';
          return 0;
        }

        const numericValue = parseInt(value) / 100;

        const formatted = new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numericValue);

        input.value = formatted;
        return numericValue;
      };

      const getCurrencyValue = (input) => {
        const cleanValue = input.value.replace(/[^\d,]/g, '').replace(',', '.');
        return parseFloat(cleanValue) || 0;
      };

      const currencyInputs = document.querySelectorAll('[data-currency="true"]');
      const mainInput = document.querySelector('[is-main="true"]');

      currencyInputs.forEach((input) => {
        if (!input || input.hasAttribute('is-main') || this.isDestroyed) return;

        const inputId = input.id || `currency-${Math.random().toString(36).substr(2, 9)}`;

        if (!this.boundHandlers.has(inputId)) {
          const handlers = {
            input: (e) => this.handleCurrencyInput(e, formatCurrencyInput),
            focus: (e) => this.handleCurrencyFocus(e, getCurrencyValue),
            blur: (e) => this.handleCurrencyBlur(e, formatCurrencyInput),
          };

          this.boundHandlers.set(inputId, { input, handlers });

          input.removeEventListener('input', handlers.input);
          input.removeEventListener('focus', handlers.focus);
          input.removeEventListener('blur', handlers.blur);

          input.addEventListener('input', handlers.input, { passive: true });
          input.addEventListener('focus', handlers.focus, { passive: true });
          input.addEventListener('blur', handlers.blur, { passive: true });

          if (input.value && input.value !== input.placeholder) {
            formatCurrencyInput(input);
          }
        }
      });

      if (mainInput && !this.isDestroyed && window.ReinoEventCoordinator) {
        window.ReinoEventCoordinator.unregisterModule('currency-formatting');

        window.ReinoEventCoordinator.registerListener('currency-formatting', 'input', (e) =>
          this.handleCurrencyInput(e, formatCurrencyInput)
        );
        window.ReinoEventCoordinator.registerListener('currency-formatting', 'focus', (e) =>
          this.handleCurrencyFocus(e, getCurrencyValue)
        );
        window.ReinoEventCoordinator.registerListener('currency-formatting', 'blur', (e) =>
          this.handleCurrencyBlur(e, formatCurrencyInput)
        );

        if (mainInput.value && mainInput.value !== mainInput.placeholder) {
          formatCurrencyInput(mainInput);
        }
      }

      window.calculateCurrency = (value1, value2, operation = 'add') => {
        if (window.currency) {
          const curr1 = window.currency(value1);
          const curr2 = window.currency(value2);

          switch (operation) {
            case 'add':
              return curr1.add(curr2);
            case 'subtract':
              return curr1.subtract(curr2);
            case 'multiply':
              return curr1.multiply(curr2);
            case 'divide':
              return curr1.divide(curr2);
            default:
              return curr1;
          }
        }
        return value1;
      };

      window.formatCurrency = formatBRL;

      this.setupAllocationInputs(getCurrencyValue);
      this.setupDOMObserver();
    }

    handleCurrencyInput(event, formatCurrencyInput) {
      if (this.isDestroyed) return;

      const numericValue = formatCurrencyInput(event.target);

      event.target.dispatchEvent(
        new CustomEvent('currencyChange', {
          detail: {
            value: numericValue,
            currencyValue: window.currency ? window.currency(numericValue) : numericValue,
            formatted: window.formatCurrency ? window.formatCurrency(numericValue) : numericValue,
          },
        })
      );
    }

    handleCurrencyFocus(event, getCurrencyValue) {
      if (this.isDestroyed) return;

      const value = getCurrencyValue(event.target);
      if (value > 0) {
        event.target.value = value.toFixed(2).replace('.', ',');
      }
    }

    handleCurrencyBlur(event, formatCurrencyInput) {
      if (this.isDestroyed) return;
      formatCurrencyInput(event.target);
    }

    setupAllocationInputs(getCurrencyValue) {
      if (this.isDestroyed) return;

      const individualInputs = document.querySelectorAll(
        '.currency-input.individual, [input-settings="receive"]'
      );

      individualInputs.forEach((input) => {
        if (!input || this.isDestroyed) return;

        const existingHandler = input._currencyChangeHandler;
        if (existingHandler) {
          input.removeEventListener('currencyChange', existingHandler);
        }

        const handler = () => this.updateTotalAllocation(getCurrencyValue);
        input._currencyChangeHandler = handler;

        input.addEventListener('currencyChange', handler, { passive: true });
      });
    }

    updateTotalAllocation(getCurrencyValue) {
      if (this.isDestroyed || !window.currency) return;

      let total = window.currency(0);
      document
        .querySelectorAll('.currency-input.individual, [input-settings="receive"]')
        .forEach((input) => {
          if (input && input.value && !this.isDestroyed) {
            const value = getCurrencyValue(input);
            total = total.add(value);
          }
        });

      if (!this.isDestroyed) {
        document.dispatchEvent(
          new CustomEvent('totalAllocationChange', {
            detail: {
              total: total.value,
              formatted: window.formatCurrency ? window.formatCurrency(total.value) : total.value,
            },
          })
        );
      }
    }

    setupDOMObserver() {
      if (this.isDestroyed || this.domObserver) return;

      let observerTimeout;
      const throttledReinit = () => {
        if (observerTimeout) clearTimeout(observerTimeout);
        observerTimeout = setTimeout(() => {
          if (!this.isDestroyed) {
            this.initializeCurrencySystem();
          }
        }, 100);
      };

      if (window.Webflow) {
        window.Webflow.push(() => {
          if (this.isDestroyed) return;

          this.domObserver = new MutationObserver((mutations) => {
            if (this.isDestroyed) return;

            let shouldReinit = false;
            mutations.forEach((mutation) => {
              if (mutation.addedNodes.length) {
                for (const node of mutation.addedNodes) {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    if (
                      node.matches('[data-currency="true"], [is-main="true"]') ||
                      node.querySelector('[data-currency="true"], [is-main="true"]')
                    ) {
                      shouldReinit = true;
                      break;
                    }
                  }
                }
              }
            });

            if (shouldReinit) {
              throttledReinit();
            }
          });

          this.domObserver.observe(document.body, {
            childList: true,
            subtree: true,
          });
        });
      }
    }

    cleanup() {
      this.isDestroyed = true;

      if (this.domObserver) {
        this.domObserver.disconnect();
        this.domObserver = null;
      }

      for (const [inputId, { input, handlers }] of this.boundHandlers.entries()) {
        if (input) {
          input.removeEventListener('input', handlers.input);
          input.removeEventListener('focus', handlers.focus);
          input.removeEventListener('blur', handlers.blur);

          if (input._currencyChangeHandler) {
            input.removeEventListener('currencyChange', input._currencyChangeHandler);
            delete input._currencyChangeHandler;
          }
        }
      }

      this.boundHandlers.clear();

      if (window.ReinoEventCoordinator && !window.ReinoEventCoordinator.isDestroyed) {
        window.ReinoEventCoordinator.unregisterModule('currency-formatting');
      }

      if (window.calculateCurrency) {
        delete window.calculateCurrency;
      }
      if (window.formatCurrency) {
        delete window.formatCurrency;
      }

      this.isInitialized = false;
    }

    reinitialize() {
      this.cleanup();
      this.isDestroyed = false;
      this.init();
    }
  }

  // Cria instância global
  window.ReinoCurrencyFormatting = new CurrencyFormattingSystem();

  // Auto-inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoCurrencyFormatting.init();
    });
  } else {
    window.ReinoCurrencyFormatting.init();
  }

  // Cleanup automático
  window.addEventListener('beforeunload', () => {
    if (window.ReinoCurrencyFormatting) {
      window.ReinoCurrencyFormatting.cleanup();
    }
  });

})();