/**
 * Patrimony Sync System - Versão Webflow TXT CORRIGIDA
 * Código original funcionando da pasta Modelo - Webflow
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  const Utils = {
    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    },

    parseCurrencyValue(value) {
      if (!value || typeof value !== 'string') return 0;
      const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
      return parseFloat(cleanValue) || 0;
    },

    calculatePercentage(value, total) {
      if (!total || total === 0) return 0;
      return (value / total) * 100;
    },

    formatPercentage(value) {
      return `${value.toFixed(1)}%`;
    },

    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
  };

  const PatrimonySync = {
    isInitialized: false,
    appState: null,

    init() {
      // Aguarda o AppState estar disponível
      this.waitForAppState();
    },

    async waitForAppState() {
      const maxAttempts = 50;
      let attempts = 0;

      while (attempts < maxAttempts) {
        if (window.ReinoAppState && window.ReinoAppState.isInitialized) {
          this.appState = window.ReinoAppState;
          this.setupPatrimonySync();
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        console.warn('⚠️ PatrimonySync: AppState not found, falling back to legacy mode');
        this.setupPatrimonySync();
      }
    },

    setupPatrimonySync() {
      this.isInitialized = true;
      console.log('✅ PatrimonySync initialized with AppState integration');
    },

    // Getter que usa AppState se disponível, senão fallback
    get mainValue() {
      if (this.appState) {
        return this.appState.getPatrimonio().value;
      }
      return this._legacyMainValue || 0;
    },

    // Setter que usa AppState se disponível
    set mainValue(value) {
      if (this.appState) {
        this.appState.setPatrimonio(value, 'patrimony-sync');
      } else {
        this._legacyMainValue = value;
      }
    },
  };

  const MainInputSync = {
    input: null,

    init() {
      this.input = document.querySelector('[is-main="true"]');
      if (!this.input) {
        return;
      }

      this.setupListeners();
    },

    setupListeners() {
      if (window.ReinoEventCoordinator) {
        window.ReinoEventCoordinator.registerListener(
          'patrimony-sync',
          'input',
          Utils.debounce((e) => {
            const value = Utils.parseCurrencyValue(e.target.value);
            this.handleValueChange(value);
          }, 300)
        );

        window.ReinoEventCoordinator.registerListener('patrimony-sync', 'change', (e) => {
          const value = Utils.parseCurrencyValue(e.target.value);
          this.handleValueChange(value);
        });
      }

      this.input.addEventListener('currencyChange', (e) => {
        this.handleValueChange(e.detail.value);
      });
    },

    handleValueChange(value) {
      // O AppState já dispara os eventos automaticamente
      PatrimonySync.mainValue = value;

      // Atualiza alocações (mantém lógica existente)
      AllocationSync.updateAllAllocations();
      AllocationSync.validateAllAllocations();
    },

    getValue() {
      return PatrimonySync.mainValue;
    },

    setValue(value) {
      PatrimonySync.mainValue = value;
      if (this.input) {
        this.input.value = Utils.formatCurrency(value);
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    },
  };

  const AllocationSync = {
    items: [],

    init() {
      const containers = document.querySelectorAll('.patrimonio_interactive_item');

      containers.forEach((container, index) => {
        const activeItem = container.querySelector('.active-produto-item');
        const disabledItem = container.querySelector('.disabled-produto-item');

        if (!activeItem || !disabledItem) return;

        const input = activeItem.querySelector('[input-settings="receive"]');
        const slider = activeItem.querySelector('range-slider');
        const percentageDisplay = activeItem.querySelector('.porcentagem-calculadora');

        const valorProduto = disabledItem.querySelector('.valor-produto');
        const percentageDisabled = disabledItem.querySelector('.porcentagem-calculadora-disabled');
        const backgroundItemAcao = disabledItem.querySelector('.background-item-acao');

        if (input && slider) {
          const item = {
            container,
            activeItem,
            disabledItem,
            input,
            slider,
            percentageDisplay,
            valorProduto,
            percentageDisabled,
            backgroundItemAcao,
            index,
            value: 0,
            percentage: 0,
            maxAllowed: 0,
          };

          this.items.push(item);
          this.setupItemListeners(item);
        }
      });
    },

    setupItemListeners(item) {
      item.input.addEventListener('currencyChange', (e) => {
        this.handleInputChange(item, e.detail.value);
      });

      item.input.addEventListener(
        'input',
        Utils.debounce((e) => {
          const value = Utils.parseCurrencyValue(e.target.value);
          this.handleInputChange(item, value);
        }, 300)
      );

      item.slider.addEventListener('input', (e) => {
        this.handleSliderChange(item, parseFloat(e.target.value));
      });

      item.input.addEventListener('focus', () => {
        item.container.classList.add('input-focused');
      });

      item.input.addEventListener('blur', () => {
        item.container.classList.remove('input-focused');
      });
    },

    handleInputChange(item, value) {
      const mainValue = MainInputSync.getValue();
      const maxAllowed = this.calculateMaxAllowed(item);

      if (value > maxAllowed) {
        value = maxAllowed;
        item.input.value = Utils.formatCurrency(value);
        VisualFeedback.showAllocationWarning(
          item,
          `Valor máximo disponível: ${Utils.formatCurrency(maxAllowed)}`
        );
      }

      item.value = value;

      if (mainValue > 0) {
        item.percentage = Utils.calculatePercentage(value, mainValue);
        this.updateSlider(item);
      } else {
        item.percentage = 0;
        item.slider.value = 0;
      }

      this.updatePercentageDisplay(item);
      this.updateValorProduto(item);
      this.updateBackgroundItemAcao(item);
      this.validateAllocation(item);
      this.checkTotalAllocationStatus();
      this.dispatchAllocationChange(item);
    },

    handleSliderChange(item, sliderValue) {
      const mainValue = MainInputSync.getValue();

      // Se não há valor principal, não permite slider
      if (mainValue <= 0) {
        item.slider.value = 0;
        item.value = 0;
        item.percentage = 0;
        item.input.value = Utils.formatCurrency(0);
        this.updatePercentageDisplay(item);
        this.updateValorProduto(item);
        this.updateBackgroundItemAcao(item);
        VisualFeedback.showAllocationWarning(item, 'Informe o valor do patrimônio primeiro');
        return;
      }

      let value = mainValue * sliderValue;

      // Validate against max allowed
      const otherAllocations = this.getTotalAllocatedExcept(item.index);
      const maxAllowed = Math.max(0, mainValue - otherAllocations);

      if (value > maxAllowed) {
        value = maxAllowed;
        // Update slider to reflect the capped value
        const cappedSliderValue = mainValue > 0 ? value / mainValue : 0;
        item.slider.value = cappedSliderValue;
        VisualFeedback.showAllocationWarning(
          item,
          `Valor máximo disponível: ${Utils.formatCurrency(maxAllowed)}`
        );
      }

      item.value = value;
      item.percentage = value > 0 && mainValue > 0 ? (value / mainValue) * 100 : 0;

      item.input.value = Utils.formatCurrency(value);
      this.updatePercentageDisplay(item);
      this.updateValorProduto(item);
      this.updateBackgroundItemAcao(item);
      this.validateAllocation(item);
      this.checkTotalAllocationStatus();
      this.dispatchAllocationChange(item);
    },

    calculateMaxAllowed(item) {
      const mainValue = MainInputSync.getValue();
      const totalOthers = this.getTotalAllocatedExcept(item.index);
      return Math.max(0, mainValue - totalOthers);
    },

    updateSlider(item) {
      const mainValue = MainInputSync.getValue();
      if (mainValue > 0) {
        const sliderValue = item.value / mainValue;
        item.slider.value = Math.min(1, Math.max(0, sliderValue));
      } else {
        item.slider.value = 0;
      }
    },

    updatePercentageDisplay(item) {
      const formattedPercentage = Utils.formatPercentage(item.percentage);
      if (item.percentageDisplay) {
        item.percentageDisplay.textContent = formattedPercentage;
      }
      if (item.percentageDisabled) {
        item.percentageDisabled.textContent = formattedPercentage;
      }
    },

    updateValorProduto(item) {
      if (item.valorProduto) {
        item.valorProduto.textContent = Utils.formatCurrency(item.value);
      }
    },

    updateBackgroundItemAcao(item) {
      if (item.backgroundItemAcao) {
        const percentage = Math.min(item.percentage, 100);
        item.backgroundItemAcao.style.width = `${percentage}%`;
      }
    },

    validateAllocation(item) {
      const isOverAllocated = this.getTotalAllocated() > MainInputSync.getValue();

      if (isOverAllocated) {
        item.container.classList.add('over-allocated');
      } else {
        item.container.classList.remove('over-allocated');
      }
    },

    validateAllAllocations() {
      this.items.forEach((item) => {
        this.validateAllocation(item);
      });
    },

    updateAllAllocations() {
      this.items.forEach((item) => {
        if (item.value > 0) {
          item.maxAllowed = this.calculateMaxAllowed(item);
          this.updatePercentageDisplay(item);
          this.updateValorProduto(item);
          this.updateBackgroundItemAcao(item);
        }
      });
    },

    checkTotalAllocationStatus() {
      const total = this.getTotalAllocated();
      const mainValue = MainInputSync.getValue();
      const remaining = mainValue - total;
      const isFullyAllocated = Math.abs(remaining) < 0.01;

      document.dispatchEvent(
        new CustomEvent('allocationStatusChanged', {
          detail: {
            total,
            mainValue,
            remaining,
            isOverAllocated: total > mainValue,
            isFullyAllocated,
          },
        })
      );

      this.updateRetornoValorAlocado(isFullyAllocated);
    },

    updateRetornoValorAlocado(isFullyAllocated) {
      const retornoValorAlocadoElement = document.querySelector('.retorno-valor-alocado');
      const aloqueTodoValorElement = document.querySelector('.aloque-todo-valor');

      if (retornoValorAlocadoElement) {
        if (isFullyAllocated) {
          retornoValorAlocadoElement.classList.remove('desativado');
        } else {
          retornoValorAlocadoElement.classList.add('desativado');
        }
      }

      if (aloqueTodoValorElement) {
        if (isFullyAllocated) {
          aloqueTodoValorElement.classList.add('desativado');
        } else {
          aloqueTodoValorElement.classList.remove('desativado');
        }
      }
    },

    getTotalAllocated() {
      return this.items.reduce((sum, item) => sum + item.value, 0);
    },

    getTotalAllocatedExcept(excludeIndex) {
      return this.items.reduce((sum, item, index) => {
        return index === excludeIndex ? sum : sum + item.value;
      }, 0);
    },

    getRemainingValue() {
      return MainInputSync.getValue() - this.getTotalAllocated();
    },

    dispatchAllocationChange(item) {
      const category = item.container.getAttribute('ativo-category');
      const product = item.container.getAttribute('ativo-product');

      document.dispatchEvent(
        new CustomEvent('allocationChanged', {
          detail: {
            index: item.index,
            category,
            product,
            value: item.value,
            percentage: item.percentage,
            formatted: Utils.formatCurrency(item.value),
            maxAllowed: item.maxAllowed,
            isValid: item.value <= item.maxAllowed,
          },
        })
      );
    },
  };

  const VisualFeedback = {
    showAllocationWarning(item, message) {
      if (!item || !item.container) {
        console.error('VisualFeedback: item ou item.container não definido');
        return;
      }

      let warning = item.container.querySelector('.allocation-warning');
      if (!warning) {
        warning = document.createElement('div');
        warning.className = 'allocation-warning';
        warning.style.cssText = `
          position: absolute;
          top: -30px;
          left: 0;
          right: 0;
          background: #ff6b6b;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          text-align: center;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.3s ease;
        `;
        item.container.style.position = 'relative';
        item.container.appendChild(warning);
      }

      warning.textContent = message;
      warning.style.opacity = '1';

      clearTimeout(warning.hideTimeout);
      warning.hideTimeout = setTimeout(() => {
        warning.style.opacity = '0';
      }, 3000);
    },
  };

  class PatrimonySyncSystem {
    constructor() {
      this.isInitialized = false;
    }

    init() {
      if (this.isInitialized) {
        return;
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.initialize();
        });
      } else {
        this.initialize();
      }

      this.isInitialized = true;
    }

    initialize() {
      if (!window.currency) {
        console.error('Currency.js is required for PatrimonySync');
        return;
      }

      const waitForMotion = () => {
        if (window.Motion) {
          this.initializeComponents();
        } else {
          setTimeout(waitForMotion, 50);
        }
      };
      waitForMotion();
    }

    initializeComponents() {
      // Inicializa PatrimonySync primeiro (com AppState)
      PatrimonySync.init();

      MainInputSync.init();

      setTimeout(() => {
        AllocationSync.init();

        AllocationSync.checkTotalAllocationStatus();

        document.dispatchEvent(
          new CustomEvent('patrimonySyncReady', {
            detail: {
              mainValue: this.getMainValue(),
              totalAllocated: this.getTotalAllocated(),
              remaining: this.getRemainingValue(),
            },
          })
        );

        if (typeof window !== 'undefined') {
          window.getAllocationSync = () => AllocationSync;
          window.patrimonySystemInstance = this;
        }

        this.updateWebflowPatrimonyDisplay();
      }, 100);

      this.updateWebflowPatrimonyDisplay();

      document.addEventListener('patrimonyMainValueChanged', () => {
        this.updateWebflowPatrimonyDisplay();
      });
      document.addEventListener('allocationChanged', () => {
        this.updateWebflowPatrimonyDisplay();
      });
      document.addEventListener('allocationStatusChanged', () => {
        this.updateWebflowPatrimonyDisplay();
      });
    }

    updateWebflowPatrimonyDisplay() {
      const mainValue = this.getMainValue();
      const formattedValue = Utils.formatCurrency(mainValue);

      const restanteEl = document.querySelector('.patrimonio_money_wrapper .patrimonio-restante');
      if (restanteEl) {
        restanteEl.textContent = Utils.formatCurrency(this.getRemainingValue());
      }

      const totalEl = document.querySelector('.patrimonio_money_wrapper .patrimonio-total-value');
      if (totalEl) {
        totalEl.textContent = formattedValue;
      }

      const headerTotalEl = document.querySelector('[data-patrimonio-total="true"]');
      if (headerTotalEl) {
        headerTotalEl.textContent = formattedValue;
      }

      const allTotalElements = document.querySelectorAll('.patrimonio-total-value');
      allTotalElements.forEach((el) => {
        el.textContent = formattedValue;
      });

      const porcentagemRestanteElements = document.querySelectorAll('.porcentagem-restante');
      if (porcentagemRestanteElements.length > 0) {
        const mainValue = this.getMainValue();
        const restante = this.getRemainingValue();
        const percent = mainValue > 0 ? (restante / mainValue) * 100 : 0;
        const formattedPercent = Utils.formatPercentage(percent);

        porcentagemRestanteElements.forEach((el) => {
          el.textContent = formattedPercent;
        });
      }
    }

    getMainValue() {
      return MainInputSync.getValue();
    }

    setMainValue(value) {
      MainInputSync.setValue(value);
    }

    getTotalAllocated() {
      return AllocationSync.getTotalAllocated();
    }

    getRemainingValue() {
      return AllocationSync.getRemainingValue();
    }

    getAllocations() {
      return AllocationSync.items.map((item) => ({
        index: item.index,
        value: item.value,
        percentage: item.percentage,
        formatted: Utils.formatCurrency(item.value),
        maxAllowed: item.maxAllowed,
      }));
    }

    reset() {
      MainInputSync.setValue(0);
      AllocationSync.items.forEach((item) => {
        item.value = 0;
        item.percentage = 0;
        item.maxAllowed = 0;
        item.input.value = Utils.formatCurrency(0);
        item.slider.value = 0;
        AllocationSync.updatePercentageDisplay(item);
        AllocationSync.updateValorProduto(item);
        AllocationSync.updateBackgroundItemAcao(item);
      });

      AllocationSync.checkTotalAllocationStatus();

      document.dispatchEvent(
        new CustomEvent('patrimonySyncReset', {
          detail: {
            timestamp: Date.now(),
          },
        })
      );
    }

    destroy() {
      this.isInitialized = false;
      AllocationSync.items = [];
      MainInputSync.input = null;
    }

    getAllocationSync() {
      return AllocationSync;
    }
  }

  // ...existing code...

  // Cria instância global
  window.ReinoPatrimonySyncSystem = new PatrimonySyncSystem();

  // Auto-inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoPatrimonySyncSystem.init();
    });
  } else {
    window.ReinoPatrimonySyncSystem.init();
  }
})();
