/**
 * Resultado Comparativo Calculator - Versão Webflow TXT CORRIGIDA
 * Sistema para calcular e sincronizar valores Reino vs Tradicional
 * Versão sem imports/exports e sem elementos DOM obrigatórios
 */

(function () {
  'use strict';

  class ResultadoComparativoCalculator {
    constructor() {
      this.isInitialized = false;
      this.patrimonySystem = null;
      this.resultadoSyncSystem = null;

      this.cache = {
        lastPatrimony: 0,
        lastSelectedAssets: new Set(),
        lastTradicionalValue: 0,
        lastReinoValue: 0,
      };

      this.reinoConfig = {
        description: 'Honorário consultivo transparente',
      };

      this.elements = {}; // Inicializa vazio para evitar erros
    }

    async init(patrimonySystem = null, resultadoSyncSystem = null) {
      if (this.isInitialized) return;

      if (patrimonySystem) {
        this.patrimonySystem = patrimonySystem;
      }
      if (resultadoSyncSystem) {
        this.resultadoSyncSystem = resultadoSyncSystem;
      }

      if (!this.patrimonySystem || !this.resultadoSyncSystem) {
        await this.waitForSystems();
      }

      this.setupEventListeners();
      this.checkDOMElements(); // Não falha se elementos não existirem
      this.calculateAndUpdate();

      this.isInitialized = true;
    }

    async waitForSystems() {
      if (!this.patrimonySystem) {
        await this.waitForSystem(
          () => window.ReinoCalculator?.systems?.patrimonySync || window.patrimonySystemInstance,
          'PatrimonySync'
        );
        this.patrimonySystem =
          window.ReinoCalculator?.systems?.patrimonySync || window.patrimonySystemInstance;
      }

      if (!this.resultadoSyncSystem) {
        if (window.ReinoCalculator?.systems?.resultadoSync || window.resultadoSyncInstance) {
          this.resultadoSyncSystem =
            window.ReinoCalculator?.systems?.resultadoSync || window.resultadoSyncInstance;
        }
      }
    }

    async waitForSystem(condition, name, maxAttempts = 30) {
      let attempts = 0;
      while (!condition() && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        attempts++;
      }
    }

    setupEventListeners() {
      document.addEventListener('patrimonyMainValueChanged', (e) => {
        this.onPatrimonyChange(e.detail.value);
      });

      document.addEventListener('allocationChanged', (e) => {
        this.onAllocationChange(e.detail);
      });

      document.addEventListener('assetSelectionChanged', (e) => {
        this.onAssetSelectionChange(e.detail.selectedAssets);
      });

      document.addEventListener('totalComissaoChanged', (e) => {
        this.onTradicionalValueChange(e.detail.total);
      });
    }

    checkDOMElements() {
      // Busca elementos mas não falha se não encontrar
      const elements = {
        tradicional: document.querySelector('[data-resultado="tradicional-valor"]'),
        reino: document.querySelector('[data-resultado="reino-valor"]'),
        economia: document.querySelector('[data-resultado="economia-valor"]'),
        economiaPercent: document.querySelector('[data-resultado="economia-percentual"]'),
      };

      this.elements = elements;

      // Log apenas se debug estiver ativo
      if (window.location.search.includes('debug=true')) {
        Object.entries(elements).forEach(([key, element]) => {
          if (!element) {
            console.log(`ℹ️ Elemento ${key} não encontrado para resultado comparativo (opcional)`);
          }
        });
      }
    }

    onPatrimonyChange(patrimony) {
      if (this.cache.lastPatrimony !== patrimony) {
        this.cache.lastPatrimony = patrimony;
        this.calculateAndUpdate();
      }
    }

    onAllocationChange(detail) {
      this.calculateAndUpdate();
    }

    onAssetSelectionChange(selectedAssets) {
      const newAssetsSet = new Set(selectedAssets);
      if (!this.setsEqual(this.cache.lastSelectedAssets, newAssetsSet)) {
        this.cache.lastSelectedAssets = newAssetsSet;
        this.calculateAndUpdate();
      }
    }

    onTradicionalValueChange(value) {
      if (this.cache.lastTradicionalValue !== value) {
        this.cache.lastTradicionalValue = value;
        this.updateTradicionalDisplay(value);
        this.calculateEconomia();
      }
    }

    onTotalComissaoChanged(event) {
      if (event.detail && typeof event.detail.total === 'number') {
        this.onTradicionalValueChange(event.detail.total);
      }
    }

    calculateAndUpdate() {
      if (!this.hasValidData()) return;

      const patrimony = this.cache.lastPatrimony;

      const tradicionalResult = this.calculateTradicionalValue();
      const reinoValue = this.calculateReinoValue(patrimony);

      this.updateTradicionalDisplay(tradicionalResult.total);
      this.updateReinoDisplay(reinoValue);
      this.calculateEconomia();

      this.cache.lastTradicionalValue = tradicionalResult.total;
      this.cache.lastReinoValue = reinoValue;

      // Dispatch event para outros sistemas
      this.dispatchCalculationUpdate(tradicionalResult, reinoValue, patrimony);
    }

    hasValidData() {
      return this.cache.lastPatrimony > 0;
    }

    getSelectedAssetsWithValues() {
      const assets = [];

      // Se temos sistema de resultado, usa ele
      if (this.resultadoSyncSystem) {
        const resultData = this.resultadoSyncSystem.getResultadoData();

        Object.values(resultData.patrimonio || {}).forEach((item) => {
          if (item.valor > 0) {
            assets.push({
              category: item.category,
              product: item.product,
              value: item.valor,
              percentage: item.percentual,
            });
          }
        });

        return assets;
      }

      // Fallback: busca diretamente no DOM
      const patrimonioItems = document.querySelectorAll('.patrimonio_interactive_item');

      patrimonioItems.forEach((item) => {
        const category = item.getAttribute('ativo-category');
        const product = item.getAttribute('ativo-product');
        const inputElement = item.querySelector('[input-settings="receive"]');

        if (category && product && inputElement) {
          const value = this.parseCurrencyValue(inputElement.value);

          if (value > 0) {
            assets.push({
              category,
              product,
              value,
              percentage: 0, // Será calculado se necessário
            });
          }
        }
      });

      return assets;
    }

    calculateTradicionalValue() {
      const selectedAssetsWithValues = this.getSelectedAssetsWithValues();
      let totalTradicional = 0;
      const details = [];

      selectedAssetsWithValues.forEach((asset) => {
        let custoAnual = 0;
        let taxaInfo = null;

        if (window.calcularCustoProduto) {
          const resultado = window.calcularCustoProduto(asset.value, asset.category, asset.product);
          custoAnual = resultado.custoMedio || 0;
          taxaInfo = {
            min: resultado.taxaMinima,
            max: resultado.taxaMaxima,
            media: resultado.taxaMedia,
          };
        } else {
          // Fallback para taxa padrão de 1%
          custoAnual = asset.value * 0.01;
          taxaInfo = { min: 1, max: 1, media: 1 };
        }

        totalTradicional += custoAnual;

        details.push({
          category: asset.category,
          product: asset.product,
          value: asset.value,
          custoAnual: custoAnual,
          taxaInfo: taxaInfo,
          formatted: {
            value: this.formatCurrency(asset.value),
            custoAnual: this.formatCurrency(custoAnual),
          },
        });
      });

      return {
        total: totalTradicional,
        details: details,
        count: details.length,
        formatted: {
          total: this.formatCurrency(totalTradicional),
        },
      };
    }

    calculateReinoValue(patrimony) {
      if (window.calcularCustoReino) {
        const resultado = window.calcularCustoReino(patrimony);
        return resultado.custoAnual || 0;
      }

      if (patrimony < 1000000) {
        return 9588;
      }
      if (patrimony < 3000000) {
        return patrimony * 0.01;
      }
      if (patrimony < 5000000) {
        return patrimony * 0.009;
      }
      if (patrimony < 10000000) {
        return patrimony * 0.008;
      }
      if (patrimony < 20000000) {
        return patrimony * 0.007;
      }
      if (patrimony < 50000000) {
        return patrimony * 0.006;
      }
      return patrimony * 0.005;
    }

    updateTradicionalDisplay(value) {
      if (this.elements.tradicional) {
        this.elements.tradicional.textContent = this.formatCurrency(value);
      }
    }

    updateReinoDisplay(value) {
      if (this.elements.reino) {
        this.elements.reino.textContent = this.formatCurrency(value);
      }
    }

    calculateEconomia() {
      const economia = this.cache.lastTradicionalValue - this.cache.lastReinoValue;
      const economiaPercent =
        this.cache.lastTradicionalValue > 0
          ? (economia / this.cache.lastTradicionalValue) * 100
          : 0;

      this.updateEconomiaDisplay(economia, economiaPercent);

      document.dispatchEvent(
        new CustomEvent('economiaCalculated', {
          detail: {
            economia,
            economiaPercent,
            tradicional: this.cache.lastTradicionalValue,
            reino: this.cache.lastReinoValue,
            reinoMaisVantajoso: economia > 0,
          },
        })
      );
    }

    updateEconomiaDisplay(economia, economiaPercent) {
      if (this.elements.economia) {
        this.elements.economia.textContent = this.formatCurrency(Math.abs(economia));

        if (economia > 0) {
          this.elements.economia.style.color = '#22c55e';
        } else if (economia < 0) {
          this.elements.economia.style.color = '#ef4444';
        } else {
          this.elements.economia.style.color = '#6b7280';
        }
      }

      if (this.elements.economiaPercent) {
        this.elements.economiaPercent.textContent = `${Math.abs(economiaPercent).toFixed(1)}%`;

        if (economia > 0) {
          this.elements.economiaPercent.style.color = '#22c55e';
        } else if (economia < 0) {
          this.elements.economiaPercent.style.color = '#ef4444';
        } else {
          this.elements.economiaPercent.style.color = '#6b7280';
        }
      }
    }

    dispatchCalculationUpdate(tradicionalResult, reinoValue, patrimony) {
      const economia = tradicionalResult.total - reinoValue;
      const economiaPercent =
        tradicionalResult.total > 0 ? (economia / tradicionalResult.total) * 100 : 0;

      document.dispatchEvent(
        new CustomEvent('resultadoComparativoUpdated', {
          detail: {
            reino: {
              annual: reinoValue,
              patrimony: patrimony,
              formatted: {
                annual: this.formatCurrency(reinoValue),
                patrimony: this.formatCurrency(patrimony),
              },
            },
            tradicional: tradicionalResult,
            economia: {
              valor: economia,
              percentual: economiaPercent,
              formatted: this.formatCurrency(economia),
              reinoMaisVantajoso: economia > 0,
            },
            timestamp: new Date().toISOString(),
          },
        })
      );

      // Dispatch event para compatibilidade com outros sistemas
      document.dispatchEvent(
        new CustomEvent('totalComissaoChanged', {
          detail: {
            total: tradicionalResult.total,
            details: tradicionalResult.details,
          },
        })
      );
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

    setsEqual(a, b) {
      return a.size === b.size && [...a].every((x) => b.has(x));
    }

    forceUpdate() {
      this.cache.lastPatrimony = 0;
      this.cache.lastSelectedAssets.clear();
      this.calculateAndUpdate();
    }

    getResults() {
      return {
        patrimony: this.cache.lastPatrimony,
        tradicional: this.cache.lastTradicionalValue,
        reino: this.cache.lastReinoValue,
        economia: this.cache.lastTradicionalValue - this.cache.lastReinoValue,
        economiaPercent:
          this.cache.lastTradicionalValue > 0
            ? ((this.cache.lastTradicionalValue - this.cache.lastReinoValue) /
                this.cache.lastTradicionalValue) *
              100
            : 0,
      };
    }

    reset() {
      this.cache.lastPatrimony = 0;
      this.cache.lastSelectedAssets.clear();
      this.cache.lastTradicionalValue = 0;
      this.cache.lastReinoValue = 0;

      this.updateTradicionalDisplay(0);
      this.updateReinoDisplay(0);
      this.updateEconomiaDisplay(0, 0);
    }
  }

  // Cria instância global
  window.ReinoResultadoComparativoCalculator = new ResultadoComparativoCalculator();

  // Auto-inicialização com delay para aguardar outros sistemas
  setTimeout(() => {
    window.ReinoResultadoComparativoCalculator.init();
  }, 1000);
})();
