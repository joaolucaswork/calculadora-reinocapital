import { eventCoordinator } from './event-coordinator.js';

/**
 * Patrimony Sync System
 * Código original funcionando da pasta Modelo - Webflow
 * Usa EventCoordinator para evitar loops infinitos
 */

// Cache Manager (from original)


// Utils (from original)
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

// PatrimonySync namespace (from original)
const PatrimonySync = {
  mainValue: 0,
  isInitialized: false,
};

// Main input synchronization (from original)
const MainInputSync = {
  input: null,

  init() {
    this.input = document.querySelector('[is-main="true"]');
    if (!this.input) {
      return;
    }

    // Setup event listeners
    this.setupListeners();
  },

  setupListeners() {
    // Registra listeners no EventCoordinator em vez de adicionar diretamente
    eventCoordinator.registerListener(
      'patrimony-sync',
      'input',
      Utils.debounce((e) => {
        const value = Utils.parseCurrencyValue(e.target.value);
        this.handleValueChange(value);
      }, 300)
    );

    eventCoordinator.registerListener('patrimony-sync', 'change', (e) => {
      const value = Utils.parseCurrencyValue(e.target.value);
      this.handleValueChange(value);
    });

    // Listen for currency change events (from existing currency system)
    this.input.addEventListener('currencyChange', (e) => {
      this.handleValueChange(e.detail.value);
    });
  },

  handleValueChange(value) {
    PatrimonySync.mainValue = value;

    // Dispatch custom event for other components
    document.dispatchEvent(
      new CustomEvent('patrimonyMainValueChanged', {
        detail: {
          value,
          formatted: Utils.formatCurrency(value),
        },
      })
    );

    // Dispatch event for total patrimony changes (used by AtivosGraficoSync)
    document.dispatchEvent(
      new CustomEvent('totalPatrimonyChanged', {
        detail: {
          value,
          formatted: Utils.formatCurrency(value),
        },
      })
    );

    // Update all section 3 allocations and validate
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

// Section 3 allocation synchronization (from original)
const AllocationSync = {
  items: [],

  init() {
    // Find all patrimonio interactive items
    const containers = document.querySelectorAll('.patrimonio_interactive_item');

    containers.forEach((container, index) => {
      // Find elements within the correct structure
      const activeItem = container.querySelector('.active-produto-item');
      const disabledItem = container.querySelector('.disabled-produto-item');

      if (!activeItem || !disabledItem) return;

      const input = activeItem.querySelector('[input-settings="receive"]');
      const slider = activeItem.querySelector('range-slider');
      const percentageDisplay = activeItem.querySelector('.porcentagem-calculadora');

      // Find elements in disabled state
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
    // Input change listener with validation
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

    // Slider change listener with validation
    item.slider.addEventListener('input', (e) => {
      this.handleSliderChange(item, parseFloat(e.target.value));
    });

    // Focus/blur for better UX
    item.input.addEventListener('focus', () => {
      item.container.classList.add('input-focused');
      this.updateMaxAllowed(item);
    });

    item.input.addEventListener('blur', () => {
      item.container.classList.remove('input-focused');
      // Final validation on blur
      this.validateAllocation(item);
    });
  },

  handleInputChange(item, value) {
    const mainValue = MainInputSync.getValue();

    // Calculate max allowed for this item
    const otherAllocations = this.getTotalAllocatedExcept(item);
    const maxAllowed = Math.max(0, mainValue - otherAllocations);

    // Validate and cap the value
    if (value > maxAllowed) {
      value = maxAllowed;
      item.input.value = Utils.formatCurrency(value);
      VisualFeedback.showAllocationWarning(
        item.container,
        `Valor máximo disponível: R$ ${Utils.formatCurrency(maxAllowed)}`
      );
    }

    item.value = value;
    item.percentage = Utils.calculatePercentage(value, mainValue);
    item.maxAllowed = maxAllowed;

    // Update all displays
    this.updateSlider(item);
    this.updatePercentageDisplay(item);
    this.updateValorProduto(item);
    this.updateBackgroundItemAcao(item);

    // Dispatch event
    this.dispatchAllocationChange(item);

    // Check total allocation status
    this.checkTotalAllocationStatus();
  },

  handleSliderChange(item, sliderValue) {
    const mainValue = MainInputSync.getValue();
    let value = mainValue * sliderValue;

    // Validate against max allowed
    const otherAllocations = this.getTotalAllocatedExcept(item);
    const maxAllowed = Math.max(0, mainValue - otherAllocations);

    if (value > maxAllowed) {
      value = maxAllowed;
      // Update slider to reflect the capped value
      const cappedSliderValue = mainValue > 0 ? value / mainValue : 0;
      item.slider.value = cappedSliderValue;
      VisualFeedback.showAllocationWarning(
        item.container,
        `Valor máximo disponível: R$ ${Utils.formatCurrency(maxAllowed)}`
      );
    }

    item.value = value;
    item.percentage = value > 0 && mainValue > 0 ? (value / mainValue) * 100 : 0;
    item.maxAllowed = maxAllowed;

    // Update displays
    item.input.value = Utils.formatCurrency(value);
    this.updatePercentageDisplay(item);
    this.updateValorProduto(item);
    this.updateBackgroundItemAcao(item);

    // Dispatch event
    this.dispatchAllocationChange(item);

    // Check total allocation status
    this.checkTotalAllocationStatus();
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

    // Update active percentage display
    if (item.percentageDisplay) {
      item.percentageDisplay.textContent = formattedPercentage;
    }

    // Update disabled percentage display
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
    if (item.backgroundItemAcao && window.Motion) {
      const { animate } = window.Motion;
      const widthPercentage = Math.max(0, Math.min(100, item.percentage));

      animate(
        item.backgroundItemAcao,
        {
          width: `${widthPercentage}%`,
        },
        {
          duration: 0.5,
          easing: 'ease-out',
        }
      );
    }
  },

  updateMaxAllowed(item) {
    const mainValue = MainInputSync.getValue();
    const otherAllocations = this.getTotalAllocatedExcept(item);
    item.maxAllowed = Math.max(0, mainValue - otherAllocations);
  },

  validateAllocation(item) {
    const mainValue = MainInputSync.getValue();
    const otherAllocations = this.getTotalAllocatedExcept(item);
    const maxAllowed = Math.max(0, mainValue - otherAllocations);

    if (item.value > maxAllowed) {
      item.value = maxAllowed;
      item.input.value = Utils.formatCurrency(maxAllowed);
      this.updateSlider(item);
      this.updatePercentageDisplay(item);
      this.updateValorProduto(item);
      this.updateBackgroundItemAcao(item);
      this.saveAllocations();
    }
  },

  validateAllAllocations() {
    const mainValue = MainInputSync.getValue();
    const total = this.getTotalAllocated();

    if (total > mainValue) {
      // Proportionally reduce all allocations
      const ratio = mainValue / total;
      this.items.forEach((item) => {
        const newValue = item.value * ratio;
        item.value = newValue;
        item.percentage = Utils.calculatePercentage(newValue, mainValue);
        item.input.value = Utils.formatCurrency(newValue);
        this.updateSlider(item);
        this.updatePercentageDisplay(item);
        this.updateValorProduto(item);
        this.updateBackgroundItemAcao(item);
      });
      this.saveAllocations();
    }
  },

  updateAllAllocations() {
    const mainValue = MainInputSync.getValue();

    this.items.forEach((item) => {
      // Update max allowed for each item
      this.updateMaxAllowed(item);

      // Recalculate percentage based on current value
      if (mainValue > 0) {
        item.percentage = Utils.calculatePercentage(item.value, mainValue);
        this.updateSlider(item);
        this.updatePercentageDisplay(item);
        this.updateValorProduto(item);
        this.updateBackgroundItemAcao(item);
      } else {
        // Reset if main value is 0
        item.value = 0;
        item.percentage = 0;
        item.input.value = Utils.formatCurrency(0);
        item.slider.value = 0;
        this.updatePercentageDisplay(item);
        this.updateValorProduto(item);
        this.updateBackgroundItemAcao(item);
      }
    });
  },

  checkTotalAllocationStatus() {
    const mainValue = MainInputSync.getValue();
    const total = this.getTotalAllocated();
    const remaining = mainValue - total;

    document.dispatchEvent(
      new CustomEvent('allocationStatusChanged', {
        detail: {
          mainValue,
          totalAllocated: total,
          remaining,
          isFullyAllocated: remaining === 0,
          isOverAllocated: remaining < 0,
          percentageAllocated: mainValue > 0 ? (total / mainValue) * 100 : 0,
          remainingPercentage: mainValue > 0 ? (remaining / mainValue) * 100 : 0,
        },
      })
    );
  },

  getTotalAllocated() {
    return this.items.reduce((sum, item) => sum + item.value, 0);
  },

  getTotalAllocatedExcept(excludeItem) {
    return this.items.reduce((sum, item) => {
      return item === excludeItem ? sum : sum + item.value;
    }, 0);
  },

  getRemainingValue() {
    const mainValue = MainInputSync.getValue();
    const totalAllocated = this.getTotalAllocated();
    return Math.max(0, mainValue - totalAllocated);
  },



  dispatchAllocationChange(item) {
    // Extract category and product from container attributes
    const category = item.container.getAttribute('ativo-category') || '';
    const product = item.container.getAttribute('ativo-product') || '';

    document.dispatchEvent(
      new CustomEvent('allocationChanged', {
        detail: {
          index: item.index,
          category: category,
          product: product,
          value: item.value,
          percentage: item.percentage,
          formatted: Utils.formatCurrency(item.value),
          remaining: this.getRemainingValue(),
        },
      })
    );

    // Also dispatch patrimonyValueChanged for resultado-sync
    document.dispatchEvent(
      new CustomEvent('patrimonyValueChanged', {
        detail: {
          key: `${category}-${product}`,
          category: category,
          product: product,
          value: item.value,
          percentage: item.percentage,
        },
      })
    );
  },
};

// Visual feedback system (from original)
const VisualFeedback = {
  showAllocationWarning(container, message) {
    let warning = container.querySelector('.allocation-warning');

    if (!warning) {
      warning = document.createElement('div');
      warning.className = 'allocation-warning';
      warning.style.cssText = `
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.5rem;
        opacity: 0;
        transition: opacity 0.3s ease;
        position: absolute;
        background: white;
        padding: 0.5rem;
        border-radius: 0.25rem;
        box-shadow: 0 2px 10px rgba(239, 68, 68, 0.2);
        z-index: 10;
      `;
      container.style.position = 'relative';
      container.appendChild(warning);
    }

    warning.textContent = message;
    warning.style.opacity = '1';

    // Position the warning
    const input = container.querySelector('input');
    if (input) {
      const rect = input.getBoundingClientRect();
      warning.style.top = `${input.offsetTop + rect.height + 5}px`;
      warning.style.left = `${input.offsetLeft}px`;
    }

    // Auto hide
    setTimeout(() => {
      warning.style.opacity = '0';
    }, 3000);

    // Add limit reached styling to input
    if (input) {
      input.style.borderColor = '#ef4444';
      setTimeout(() => {
        input.style.borderColor = '';
      }, 3000);
    }
  },
};

// Main PatrimonySyncSystem class for module export
export class PatrimonySyncSystem {
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
    // Check for dependencies
    if (!window.currency) {
      console.error('Currency.js is required for PatrimonySync');
      return;
    }

    // Wait for Motion.js to be available
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
    // Initialize main input
    MainInputSync.init();

    // Wait a bit for dynamic content to load
    setTimeout(() => {
      AllocationSync.init();
      PatrimonySync.isInitialized = true;

      // Initial status check
      AllocationSync.checkTotalAllocationStatus();

      // Dispatch ready event
      document.dispatchEvent(
        new CustomEvent('patrimonySyncReady', {
          detail: {
            mainValue: this.getMainValue(),
            totalAllocated: this.getTotalAllocated(),
            remaining: this.getRemainingValue(),
          },
        })
      );

      // Garante que AllocationSync esteja exposto globalmente após inicialização
      if (typeof window !== 'undefined') {
        window.getAllocationSync = () => AllocationSync;
        window.patrimonySystemInstance = this;
      }

      // Atualiza os valores do Webflow imediatamente após a inicialização
      this.updateWebflowPatrimonyDisplay();
    }, 100);

    // Atualiza valores do Webflow na inicialização
    this.updateWebflowPatrimonyDisplay();

    // Atualiza valores do Webflow sempre que o status mudar
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

  // Atualiza os valores do Webflow (patrimonio_money_wrapper e header-and-patrimonio)
  updateWebflowPatrimonyDisplay() {
    const mainValue = this.getMainValue();
    const formattedValue = Utils.formatCurrency(mainValue);

    // Atualiza o valor restante
    const restanteEl = document.querySelector('.patrimonio_money_wrapper .patrimonio-restante');
    if (restanteEl) {
      restanteEl.textContent = Utils.formatCurrency(this.getRemainingValue());
    }

    // Atualiza o valor total na seção principal
    const totalEl = document.querySelector('.patrimonio_money_wrapper .patrimonio-total-value');
    if (totalEl) {
      totalEl.textContent = formattedValue;
    }

    // Atualiza o valor total no header da seção de resultados (header-and-patrimonio)
    const headerTotalEl = document.querySelector('[data-patrimonio-total="true"]');
    if (headerTotalEl) {
      headerTotalEl.textContent = formattedValue;
    }

    // Atualiza todos os elementos com classe patrimonio-total-value (fallback)
    const allTotalElements = document.querySelectorAll('.patrimonio-total-value');
    allTotalElements.forEach((el) => {
      el.textContent = formattedValue;
    });

    // Atualiza a porcentagem do valor restante - busca em todo o documento
    const porcentagemRestanteElements = document.querySelectorAll('.porcentagem-restante');
    if (porcentagemRestanteElements.length > 0) {
      const mainValue = this.getMainValue();
      const restante = this.getRemainingValue();
      const percent = mainValue > 0 ? (restante / mainValue) * 100 : 0;
      const formattedPercent = Utils.formatPercentage(percent);

      // Atualiza todos os elementos com a classe porcentagem-restante
      porcentagemRestanteElements.forEach((el) => {
        el.textContent = formattedPercent;
      });
    }
  }

  // Public API methods
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

    // Dispatch event to notify asset selection system about the reset
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

  // Expõe AllocationSync para integração externa
  getAllocationSync() {
    return AllocationSync;
  }
}
