import { eventCoordinator } from './event-coordinator.js';

/**
 * Currency Formatting System - VERSÃO CORRIGIDA
 * Handles currency input formatting and validation
 * Uses EventCoordinator for main input event coordination
 * Implementa cleanup adequado para prevenir memory leaks
 */
export class CurrencyFormattingSystem {
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

    // Fallback caso o Webflow não esteja disponível
    setTimeout(() => this.initializeCurrencySystem(), 100);

    this.isInitialized = true;
  }

  initializeCurrencySystem() {
    if (this.isDestroyed) return;

    // Aguarda o Webflow carregar completamente
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

    // Configuração para Real Brasileiro
    const formatBRL = (value) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    // Função para formatar input enquanto digita
    const formatCurrencyInput = (input) => {
      let value = input.value.replace(/\D/g, '');
      if (value === '') {
        input.value = '';
        return 0;
      }

      // Converte centavos para reais
      const numericValue = parseInt(value) / 100;

      // Formata usando Intl.NumberFormat
      const formatted = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericValue);

      input.value = formatted;
      return numericValue;
    };

    // Função para obter valor numérico limpo
    const getCurrencyValue = (input) => {
      const cleanValue = input.value.replace(/[^\d,]/g, '').replace(',', '.');
      return parseFloat(cleanValue) || 0;
    };

    // Inicializa inputs de moeda - separa main input dos outros
    const currencyInputs = document.querySelectorAll('[data-currency="true"]');
    const mainInput = document.querySelector('[is-main="true"]');

    // Para inputs normais de moeda
    currencyInputs.forEach((input) => {
      if (!input || input.hasAttribute('is-main') || this.isDestroyed) return;

      // Cria handlers bound únicos para cada input
      const inputId = input.id || `currency-${Math.random().toString(36).substr(2, 9)}`;

      if (!this.boundHandlers.has(inputId)) {
        const handlers = {
          input: (e) => this.handleCurrencyInput(e, formatCurrencyInput),
          focus: (e) => this.handleCurrencyFocus(e, getCurrencyValue),
          blur: (e) => this.handleCurrencyBlur(e, formatCurrencyInput),
        };

        this.boundHandlers.set(inputId, { input, handlers });

        // Remove listeners existentes se houver
        input.removeEventListener('input', handlers.input);
        input.removeEventListener('focus', handlers.focus);
        input.removeEventListener('blur', handlers.blur);

        // Adiciona novos listeners
        input.addEventListener('input', handlers.input, { passive: true });
        input.addEventListener('focus', handlers.focus, { passive: true });
        input.addEventListener('blur', handlers.blur, { passive: true });

        // Formatação inicial se já houver valor
        if (input.value && input.value !== input.placeholder) {
          formatCurrencyInput(input);
        }
      }
    });

    // Para o input principal, usa EventCoordinator
    if (mainInput && !this.isDestroyed) {
      // Remove listeners anteriores se existirem
      eventCoordinator.unregisterModule('currency-formatting');

      // Registra novos listeners
      eventCoordinator.registerListener('currency-formatting', 'input', (e) =>
        this.handleCurrencyInput(e, formatCurrencyInput)
      );
      eventCoordinator.registerListener('currency-formatting', 'focus', (e) =>
        this.handleCurrencyFocus(e, getCurrencyValue)
      );
      eventCoordinator.registerListener('currency-formatting', 'blur', (e) =>
        this.handleCurrencyBlur(e, formatCurrencyInput)
      );

      // Formatação inicial se já houver valor
      if (mainInput.value && mainInput.value !== mainInput.placeholder) {
        formatCurrencyInput(mainInput);
      }
    }

    // Função para calcular com precisão usando Currency.js
    window.calculateCurrency = (value1, value2, operation = 'add') => {
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
    };

    // Função para formatar qualquer valor
    window.formatCurrency = formatBRL;

    // Setup para inputs individuais de alocação
    this.setupAllocationInputs(getCurrencyValue);

    // Observa mudanças no DOM para reinicializar inputs dinâmicos
    this.setupDOMObserver();
  }

  handleCurrencyInput(event, formatCurrencyInput) {
    if (this.isDestroyed) return;

    const numericValue = formatCurrencyInput(event.target);

    // Dispara evento customizado para outros scripts
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

    // Remove formatação para edição mais fácil
    const value = getCurrencyValue(event.target);
    if (value > 0) {
      event.target.value = value.toFixed(2).replace('.', ',');
    }
  }

  handleCurrencyBlur(event, formatCurrencyInput) {
    if (this.isDestroyed) return;

    // Reaplica formatação completa
    formatCurrencyInput(event.target);
  }

  setupAllocationInputs(getCurrencyValue) {
    if (this.isDestroyed) return;

    const individualInputs = document.querySelectorAll(
      '.currency-input.individual, [input-settings="receive"]'
    );

    individualInputs.forEach((input) => {
      if (!input || this.isDestroyed) return;

      // Remove listener anterior se existir
      const existingHandler = input._currencyChangeHandler;
      if (existingHandler) {
        input.removeEventListener('currencyChange', existingHandler);
      }

      // Cria novo handler
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

    // Dispara evento para outros componentes
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

    // Cria observer com throttling para evitar muitas reinicializações
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
              // Verifica se algum dos nós adicionados é relevante
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

  // Método de cleanup para prevenir memory leaks
  cleanup() {
    this.isDestroyed = true;

    // Desconecta DOM observer
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
    }

    // Remove todos os event listeners dos inputs normais
    for (const [inputId, { input, handlers }] of this.boundHandlers.entries()) {
      if (input) {
        input.removeEventListener('input', handlers.input);
        input.removeEventListener('focus', handlers.focus);
        input.removeEventListener('blur', handlers.blur);

        // Remove handler customizado se existir
        if (input._currencyChangeHandler) {
          input.removeEventListener('currencyChange', input._currencyChangeHandler);
          delete input._currencyChangeHandler;
        }
      }
    }

    // Limpa referências
    this.boundHandlers.clear();

    // Remove listeners do EventCoordinator
    if (eventCoordinator && !eventCoordinator.isDestroyed) {
      eventCoordinator.unregisterModule('currency-formatting');
    }

    // Remove funções globais se foram criadas por este módulo
    if (window.calculateCurrency) {
      delete window.calculateCurrency;
    }
    if (window.formatCurrency) {
      delete window.formatCurrency;
    }

    this.isInitialized = false;
  }

  // Método para reinicializar se necessário
  reinitialize() {
    this.cleanup();
    this.isDestroyed = false;
    this.init();
  }
}
