/**
 * Simple Sync System - Versão Webflow TXT CORRIGIDA
 * Synchronizes patrimonio_interactive_item with ativos-grafico-item elements
 * Versão sem imports/exports para uso direto no Webflow
 */

(function() {
  'use strict';

  class SimpleSyncSystem {
    constructor() {
      this.pairs = [];
      this.maxBarHeight = 45;
      this.isInitialized = false;
      this.patrimonySyncSystem = null;
    }

    async init() {
      try {
        this.setupPatrimonySyncReference();
        this.findPairs();
        this.setupListeners();
        this.setupBudgetListeners();

        document.addEventListener('patrimonySystemReady', () => {
          this.syncAllFromCurrentValues();
        });

        setTimeout(() => {
          this.syncAllPairs();
        }, 100);

        this.isInitialized = true;
      } catch (error) {
        console.error('❌ Simple sync initialization failed:', error);
      }
    }

    setupPatrimonySyncReference() {
      if (window.ReinoCalculator?.data?.patrimony) {
        this.patrimonySyncSystem = window.ReinoCalculator.data.patrimony;
      } else {
        document.addEventListener('reinoCalculatorReady', (event) => {
          this.patrimonySyncSystem = event.detail.systems.patrimonySync;
        });
      }
    }

    setupBudgetListeners() {
      document.addEventListener('allocationStatusChanged', (event) => {
        this.handleBudgetStatusChange(event.detail);
      });

      document.addEventListener('allocationChanged', (event) => {
        this.handleAllocationChange(event.detail);
      });
    }

    handleBudgetStatusChange(status) {
      this.budgetStatus = status;
    }

    handleAllocationChange(detail) {
      const { category, product, percentage } = detail;

      if (!category || !product) return;

      const pair = this.pairs.find((p) => p.category === category && p.product === product);

      if (pair) {
        if (pair.patrimonio.slider) {
          pair.patrimonio.slider.value = percentage / 100;
        }

        this.syncFromPatrimonio(pair);
      }
    }

    findPairs() {
      const patrimonioItems = document.querySelectorAll('.patrimonio_interactive_item');
      const ativosItems = document.querySelectorAll('.ativos-grafico-item');

      patrimonioItems.forEach((patrimonioItem) => {
        const category = patrimonioItem.getAttribute('ativo-category');
        const product = patrimonioItem.getAttribute('ativo-product');

        if (!category || !product) return;

        const ativosItem = Array.from(ativosItems).find((item) => {
          return (
            item.getAttribute('ativo-category') === category &&
            item.getAttribute('ativo-product') === product
          );
        });

        if (ativosItem) {
          const pair = this.createPair(patrimonioItem, ativosItem, category, product);
          if (pair) {
            this.pairs.push(pair);
          }
        }
      });
    }

    createPair(patrimonioItem, ativosItem, category, product) {
      try {
        const patrimonioElements = this.extractPatrimonioElements(patrimonioItem);
        const ativosElements = this.extractAtivosElements(ativosItem);

        if (!patrimonioElements.slider || !ativosElements.bar) {
          return null;
        }

        return {
          categoria: category,
          category: category,
          product: product,
          patrimonio: patrimonioElements,
          ativos: ativosElements,
        };
      } catch (error) {
        console.error(`Error creating pair for ${category}-${product}:`, error);
        return null;
      }
    }

    extractPatrimonioElements(item) {
      return {
        container: item,
        slider: item.querySelector('range-slider'),
        input: item.querySelector('[input-settings="receive"]'),
        percentage: item.querySelector('.porcentagem-calculadora'),
        activeItem: item.querySelector('.active-produto-item'),
        disabledItem: item.querySelector('.disabled-produto-item'),
      };
    }

    extractAtivosElements(item) {
      return {
        container: item,
        bar: item.querySelector('.ativos-grafico-bar'),
        percentage: item.querySelector('.porcentagem-ativos-grafico'),
        value: item.querySelector('.valor-ativos-grafico'),
      };
    }

    setupListeners() {
      this.pairs.forEach((pair) => {
        if (pair.patrimonio.slider) {
          pair.patrimonio.slider.addEventListener('input', (e) => {
            this.syncFromPatrimonio(pair);
          });
        }

        if (pair.patrimonio.input) {
          pair.patrimonio.input.addEventListener('currencyChange', (e) => {
            this.syncFromPatrimonio(pair);
          });
        }
      });

      document.addEventListener('totalPatrimonyChanged', () => {
        setTimeout(() => this.syncAllPairs(), 50);
      });

      document.addEventListener('assetFilterChanged', () => {
        setTimeout(() => this.syncAllPairs(), 50);
      });
    }

    syncFromPatrimonio(pair) {
      if (!pair.patrimonio.slider || !pair.ativos.bar) return;

      try {
        const sliderValue = parseFloat(pair.patrimonio.slider.value) || 0;
        const percentage = sliderValue * 100;

        this.updateAtivosBar(pair, percentage);
        this.updateAtivosText(pair, percentage);
      } catch (error) {
        console.error(`Error syncing pair ${pair.category}-${pair.product}:`, error);
      }
    }

    syncAllPairs() {
      this.pairs.forEach((pair) => {
        this.syncFromPatrimonio(pair);
      });
    }

    syncAllFromCurrentValues() {
      this.pairs.forEach((pair) => {
        if (pair.patrimonio.input && pair.patrimonio.input.value) {
          const currentValue = this.parseCurrencyValue(pair.patrimonio.input.value);
          const totalPatrimony = window.ReinoEventCoordinator ? 
            this.parseCurrencyValue(window.ReinoEventCoordinator.getValue()) : 0;
          
          if (totalPatrimony > 0) {
            const percentage = (currentValue / totalPatrimony) * 100;
            
            if (pair.patrimonio.slider) {
              pair.patrimonio.slider.value = percentage / 100;
            }
            
            this.updateAtivosBar(pair, percentage);
            this.updateAtivosText(pair, percentage);
          }
        }
      });
    }

    updateAtivosBar(pair, percentage) {
      if (!pair.ativos.bar) return;

      const height = Math.min((percentage / 100) * this.maxBarHeight, this.maxBarHeight);
      pair.ativos.bar.style.height = `${height}px`;
    }

    updateAtivosText(pair, percentage) {
      if (pair.ativos.percentage) {
        pair.ativos.percentage.textContent = `${percentage.toFixed(1)}%`;
      }

      if (pair.ativos.value && window.ReinoEventCoordinator) {
        const totalPatrimony = this.parseCurrencyValue(window.ReinoEventCoordinator.getValue());
        const allocatedValue = (percentage / 100) * totalPatrimony;
        pair.ativos.value.textContent = this.formatCurrency(allocatedValue);
      }
    }

    parseCurrencyValue(value) {
      if (!value || typeof value !== 'string') return 0;
      const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
      return parseFloat(cleanValue) || 0;
    }

    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    }

    resetAll() {
      this.pairs.forEach((pair) => {
        if (pair.patrimonio.slider) {
          pair.patrimonio.slider.value = 0;
        }

        if (pair.patrimonio.input) {
          pair.patrimonio.input.value = 'R$ 0,00';
        }

        if (pair.patrimonio.percentage) {
          pair.patrimonio.percentage.textContent = '0%';
        }

        this.updateAtivosBar(pair, 0);
        this.updateAtivosText(pair, 0);
      });
    }

    getPairByAsset(category, product) {
      return this.pairs.find((pair) => pair.category === category && pair.product === product);
    }

    getAllPairs() {
      return this.pairs;
    }

    getActivePairs() {
      return this.pairs.filter((pair) => {
        const sliderValue = parseFloat(pair.patrimonio.slider?.value) || 0;
        return sliderValue > 0;
      });
    }
  }

  // Cria instância global
  window.ReinoSimpleSyncSystem = new SimpleSyncSystem();

  // Auto-inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoSimpleSyncSystem.init();
    });
  } else {
    window.ReinoSimpleSyncSystem.init();
  }

})();