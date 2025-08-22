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
        tradicional: document.querySelector('[data-resultado="tradicional"]'),
        reino: document.querySelector('[data-resultado="reino"]'),
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
      try {
        if (!this.hasValidData()) return;

        // Calcula valores Reino e Tradicional
        const reinoValues = this.calculateReinoValue();
        const traditionalValues = this.calculateTradicionalValue();

        // Atualiza elementos DOM
        this.updateDOMElements(reinoValues, traditionalValues);

        // Atualiza cache
        this.cache.lastReinoValue = reinoValues.annual;
        this.cache.lastTradicionalValue = traditionalValues.total;

        // Dispatch event para outros sistemas
        this.dispatchCalculationUpdate(
          traditionalValues,
          reinoValues.annual,
          reinoValues.patrimony
        );
      } catch (error) {
        console.error('❌ [ResultadoComparativo] Error in calculation:', error);
      }
    }

    updateDOMElements(reinoValues, traditionalValues) {
      // Atualiza valor Reino (data-resultado="reino")
      const reinoElement = document.querySelector('[data-resultado="reino"]');
      if (reinoElement) {
        const formattedValue = this.formatCurrencyForDisplay(reinoValues.annual);
        reinoElement.textContent = formattedValue;
      }

      // Atualiza valor Tradicional (data-resultado="tradicional")
      const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
      if (tradicionalElement) {
        const formattedValue = this.formatCurrencyForDisplay(traditionalValues.total);
        tradicionalElement.textContent = formattedValue;
      }

      // Atualiza valor do patrimônio total usando o sistema existente (data-patrimonio-total="true")
      const patrimonioTotalElement = document.querySelector('[data-patrimonio-total="true"]');
      if (patrimonioTotalElement) {
        const formattedPatrimony = this.formatCurrency(reinoValues.patrimony);
        patrimonioTotalElement.textContent = formattedPatrimony;
      }

      // Calcula e atualiza economia
      const savings = traditionalValues.total - reinoValues.annual;
      const savingsPercent =
        traditionalValues.total > 0 ? (savings / traditionalValues.total) * 100 : 0;

      this.updateEconomiaDisplay(savings, savingsPercent);
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

    calculateReinoValue() {
      const patrimony = this.getMainPatrimony();

      if (window.calcularCustoReino) {
        const reinoInfo = window.calcularCustoReino(patrimony);

        return {
          patrimony,
          taxaAnual: reinoInfo.taxaAnual,
          annual: reinoInfo.custoAnual,
          monthly: reinoInfo.custoMensal,
          faixa: reinoInfo.faixa,
          tipo: reinoInfo.tipo,
          formatted: {
            annual: this.formatCurrency(reinoInfo.custoAnual),
            monthly: this.formatCurrency(reinoInfo.custoMensal),
            patrimony: this.formatCurrency(patrimony),
          },
        };
      }

      // Fallback para cálculo manual se função não estiver disponível
      let custoAnual = 0;
      if (patrimony < 1000000) {
        custoAnual = 799; // Valor fixo corrigido
      } else if (patrimony < 3000000) {
        custoAnual = patrimony * 0.01;
      } else if (patrimony < 5000000) {
        custoAnual = patrimony * 0.009;
      } else if (patrimony < 10000000) {
        custoAnual = patrimony * 0.008;
      } else if (patrimony < 20000000) {
        custoAnual = patrimony * 0.007;
      } else if (patrimony < 50000000) {
        custoAnual = patrimony * 0.006;
      } else {
        custoAnual = patrimony * 0.005;
      }

      return {
        patrimony,
        taxaAnual: patrimony < 1000000 ? null : (custoAnual / patrimony) * 100,
        annual: custoAnual,
        monthly: custoAnual / 12,
        faixa: patrimony < 1000000 ? '< 1M' : `${(patrimony / 1000000).toFixed(1)}M`,
        tipo: patrimony < 1000000 ? 'fixo' : 'percentual',
        formatted: {
          annual: this.formatCurrency(custoAnual),
          monthly: this.formatCurrency(custoAnual / 12),
          patrimony: this.formatCurrency(patrimony),
        },
      };
    }

    getMainPatrimony() {
      if (this.patrimonySystem) {
        return this.patrimonySystem.getMainValue() || 0;
      }

      // Fallback: busca diretamente no DOM
      const mainInput =
        document.querySelector('[is-main="true"] .currency-input.individual') ||
        document.querySelector('[input-settings="receive"][is-main="true"]');
      if (mainInput) {
        return this.parseCurrencyValue(mainInput.value);
      }

      return this.cache.lastPatrimony || 0;
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

    formatCurrencyForDisplay(value) {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
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

      // Atualizar elementos DOM diretamente
      const reinoElement = document.querySelector('[data-resultado="reino"]');
      if (reinoElement) {
        reinoElement.textContent = this.formatCurrencyForDisplay(0);
      }

      const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
      if (tradicionalElement) {
        tradicionalElement.textContent = this.formatCurrencyForDisplay(0);
      }

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
