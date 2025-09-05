/**
 * Reino Debug Module - Konami Code Style Debug Functionality
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class ReinoDebugModule {
    constructor() {
      this.isInitialized = false;
      this.keySequence = '';
      this.targetSequence = 'reinodebug';
      this.sequenceTimeout = null;
      this.debugValue = 1000000;
      this.isDebugModeActive = false;
    }

    init() {
      if (this.isInitialized) return;

      this.setupKeyListener();
      this.isInitialized = true;
    }

    setupKeyListener() {
      document.addEventListener('keydown', (e) => {
        this.handleKeyPress(e.key.toLowerCase());
      });
    }

    handleKeyPress(key) {
      clearTimeout(this.sequenceTimeout);

      if (key.match(/[a-z]/)) {
        this.keySequence += key;

        if (this.keySequence.length > this.targetSequence.length) {
          this.keySequence = this.keySequence.slice(-this.targetSequence.length);
        }

        if (this.keySequence === this.targetSequence) {
          this.activateDebugMode();
          this.keySequence = '';
          return;
        }
      } else {
        this.keySequence = '';
      }

      this.sequenceTimeout = setTimeout(() => {
        this.keySequence = '';
      }, 2000);
    }

    activateDebugMode() {
      try {
        console.log('🐛 STEP 1: Testing tooltips BEFORE debug activation');
        this.testTooltipsFunctionality();

        this.isDebugModeActive = true;

        console.log('🐛 STEP 2: Testing tooltips AFTER setting debug flag');
        this.testTooltipsFunctionality();

        this.setMainCurrencyInput();

        console.log('🐛 STEP 3: Testing tooltips AFTER currency input');
        this.testTooltipsFunctionality();

        this.selectAllAssets();

        console.log('🐛 STEP 4: Testing tooltips AFTER asset selection');
        this.testTooltipsFunctionality();

        this.distributePortfolio();

        console.log('🐛 STEP 5: Testing tooltips AFTER portfolio distribution');
        this.testTooltipsFunctionality();

        this.setupDebugSendButtonBehavior();

        console.log('🐛 STEP 6: Testing tooltips AFTER send button setup');
        this.testTooltipsFunctionality();

        // Notify button coordinator to update send button state
        document.dispatchEvent(
          new CustomEvent('debugModeActivated', {
            detail: { isActive: true },
          })
        );

        console.log('🐛 STEP 7: Testing tooltips AFTER event dispatch');
        this.testTooltipsFunctionality();

        console.log('🐛 Debug mode activated - send button bypass enabled');
      } catch (error) {
        console.error('Debug mode activation failed:', error);
      }
    }

    setMainCurrencyInput() {
      const mainInput = document.querySelector('[is-main="true"]');
      if (!mainInput) {
        throw new Error('Main currency input not found');
      }

      const formattedValue = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(this.debugValue);

      if (window.ReinoEventCoordinator) {
        window.ReinoEventCoordinator.setValue(formattedValue, 'debug-module');
      } else {
        mainInput.value = formattedValue;
        mainInput.dispatchEvent(new Event('input', { bubbles: true }));
        mainInput.dispatchEvent(
          new CustomEvent('currencyChange', {
            detail: { value: this.debugValue },
            bubbles: true,
          })
        );
      }
    }

    selectAllAssets() {
      const assetItems = document.querySelectorAll('.ativo-item-subcategory');

      assetItems.forEach((item) => {
        if (!item.classList.contains('selected-asset')) {
          item.click();
        }
      });

      const standaloneAssets = document.querySelectorAll(
        '.ativos_item[ativo-product][ativo-category]:not(.dropdown)'
      );
      standaloneAssets.forEach((item) => {
        if (!item.classList.contains('selected-asset')) {
          item.click();
        }
      });
    }

    distributePortfolio() {
      setTimeout(() => {
        const portfolioItems = document.querySelectorAll('.patrimonio_interactive_item');
        const visibleItems = Array.from(portfolioItems).filter((item) => {
          return (
            item.style.display !== 'none' &&
            !item.closest('[style*="display: none"]') &&
            item.offsetParent !== null
          );
        });

        if (visibleItems.length === 0) {
          return;
        }

        const valuePerItem = this.debugValue / visibleItems.length;
        const percentagePerItem = 1 / visibleItems.length;

        visibleItems.forEach((item) => {
          this.setPortfolioItemValue(item, valuePerItem, percentagePerItem);
        });
      }, 500);
    }

    setPortfolioItemValue(item, value, percentage) {
      try {
        const currencyInput = item.querySelector('.currency-input.individual');
        const rangeSlider = item.querySelector('range-slider');
        const percentageDisplay = item.querySelector('.porcentagem-calculadora');

        if (currencyInput) {
          const formattedValue = new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(value);

          currencyInput.value = formattedValue;
          currencyInput.dispatchEvent(new Event('input', { bubbles: true }));
          currencyInput.dispatchEvent(
            new CustomEvent('currencyChange', {
              detail: { value: value },
              bubbles: true,
            })
          );
        }

        if (rangeSlider) {
          rangeSlider.value = percentage;
          rangeSlider.dispatchEvent(new Event('input', { bubbles: true }));
        }

        if (percentageDisplay) {
          const formattedPercentage = Math.round(percentage * 100);
          percentageDisplay.textContent = `${formattedPercentage}%`;
        }
      } catch (error) {
        console.error('Error setting portfolio item value:', error);
      }
    }

    setupDebugSendButtonBehavior() {
      // Instead of a global listener, we'll modify the button coordinator's behavior
      // This is much less invasive and won't interfere with tooltips
      console.log('🐛 Debug send button behavior ready (handled by button coordinator)');
    }

    isDebugActive() {
      return this.isDebugModeActive;
    }

    testTooltipsFunctionality() {
      const tooltipElements = {
        'ajuda-botao': document.querySelectorAll('.ajuda-botao'),
        'detalhes-calculo-geral': document.querySelectorAll('.detalhes-calculo-geral'),
        'rotation-slider': document.querySelectorAll('#indice-giro [data-thumb]'),
      };

      Object.entries(tooltipElements).forEach(([name, elements]) => {
        console.log(`🔍 ${name}: Found ${elements.length} elements`);
        elements.forEach((el, index) => {
          const hasTooltip = el._tippy || el.hasAttribute('data-tippy-content') || el.title;
          console.log(`  - Element ${index}: ${hasTooltip ? '✅ Has tooltip' : '❌ No tooltip'}`);
        });
      });

      // Check tooltip instances
      const tooltipSystems = [
        'tippyTooltipInstance',
        'detalhesCalculoTooltipInstance',
        'rotationSliderTooltipInstance',
      ];
      tooltipSystems.forEach((system) => {
        if (window[system]) {
          console.log(`🔍 ${system}: ✅ Available`);
          if (window[system].instances) {
            console.log(
              `  - Instances: ${window[system].instances.size || window[system].instances.length || 'unknown'}`
            );
          }
        } else {
          console.log(`🔍 ${system}: ❌ Not found`);
        }
      });
    }

    // Method to check debug status from console
    getDebugStatus() {
      console.log('🐛 Debug Status:', {
        isActive: this.isDebugModeActive,
        isInitialized: this.isInitialized,
        targetSequence: this.targetSequence,
        currentSequence: this.keySequence,
      });
      return this.isDebugModeActive;
    }

    destroy() {
      this.isInitialized = false;
      this.keySequence = '';
      this.isDebugModeActive = false;
      clearTimeout(this.sequenceTimeout);
    }
  }

  window.ReinoDebugModule = new ReinoDebugModule();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoDebugModule.init();
    });
  } else {
    window.ReinoDebugModule.init();
  }
})();
