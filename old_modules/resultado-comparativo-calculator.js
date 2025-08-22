/**
 * Resultado Comparativo Calculator
 * Sistema para calcular e sincronizar valores Reino vs Tradicional
 * Integra com os sistemas existentes de patrimônio e comissões
 */

import { ComissoesUtils } from '../config/comissoes-config.js';
import { calcularCustoReino } from '../config/honorarios-reino-config.js';

class ResultadoComparativoCalculator {
  constructor() {
    this.isInitialized = false;
    this.patrimonySystem = null;
    this.resultadoSyncSystem = null;
    
    // Cache para evitar recálculos desnecessários
    this.cache = {
      lastPatrimony: 0,
      lastSelectedAssets: new Set(),
      lastTradicionalValue: 0,
      lastReinoValue: 0
    };
    
    // Configuração Reino Capital (sistema de faixas)
    this.reinoConfig = {
      description: 'Honorário consultivo transparente'
    };
  }

  async init(patrimonySystem = null, resultadoSyncSystem = null) {
    if (this.isInitialized) return;



    // Use passed systems or wait for them
    if (patrimonySystem) {
      this.patrimonySystem = patrimonySystem;
    }
    if (resultadoSyncSystem) {
      this.resultadoSyncSystem = resultadoSyncSystem;
    }

    // If systems weren't passed, wait for them
    if (!this.patrimonySystem || !this.resultadoSyncSystem) {
      await this.waitForSystems();
    }
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Verifica se elementos DOM existem
    this.checkDOMElements();
    
    // Calcula valores iniciais
    this.calculateAndUpdate();
    
    this.isInitialized = true;

  }

  async waitForSystems() {
    // Aguarda PatrimonySyncSystem - first try window.ReinoCalculator, then try direct window access
    if (!this.patrimonySystem) {
      await this.waitForSystem(() => 
        window.ReinoCalculator?.systems?.patrimonySync || 
        window.patrimonySystemInstance, 
        'PatrimonySync'
      );
      this.patrimonySystem = window.ReinoCalculator?.systems?.patrimonySync || window.patrimonySystemInstance;
    }

    // Aguarda ResultadoSyncSystem (opcional)
    if (!this.resultadoSyncSystem) {
      if (window.ReinoCalculator?.systems?.resultadoSync || window.resultadoSyncInstance) {
        this.resultadoSyncSystem = window.ReinoCalculator?.systems?.resultadoSync || window.resultadoSyncInstance;
      }
    }
  }

  async waitForSystem(condition, name, maxAttempts = 30) {
    let attempts = 0;
    while (!condition() && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }
    
    if (!condition()) {
    } else {
    }
  }

  setupEventListeners() {

    
    // Listen for patrimony changes
    document.addEventListener('patrimonyMainValueChanged', (e) => {
      this.onPatrimonyChange(e.detail.value);
    });

    // Listen for allocation changes
    document.addEventListener('allocationChanged', (e) => {
      this.onAllocationChange();
    });

    // Listen for asset selection changes
    document.addEventListener('assetSelectionChanged', (e) => {
      this.onAssetSelectionChange(e.detail.selectedAssets);
    });

    // Listen for currency input changes (fallback)
    document.addEventListener('currencyInputChanged', () => {
      this.calculateAndUpdate();
    });
    

  }

  onPatrimonyChange(newValue) {
    if (newValue !== this.cache.lastPatrimony) {

      this.cache.lastPatrimony = newValue;
      this.calculateAndUpdate();
    }
  }

  onAllocationChange() {

    this.calculateAndUpdate();
  }

  onAssetSelectionChange(selectedAssets) {
    const newAssetSet = new Set(selectedAssets || []);
    
    // Check if selection actually changed
    const hasChanged = newAssetSet.size !== this.cache.lastSelectedAssets.size ||
      [...newAssetSet].some(asset => !this.cache.lastSelectedAssets.has(asset));
    
    if (hasChanged) {

      this.cache.lastSelectedAssets = newAssetSet;
      this.calculateAndUpdate();
    }
  }

  calculateAndUpdate() {
    try {

      
      // Calcula valores Reino e Tradicional
      const rainValues = this.calculateReinoValue();
      const traditionalValues = this.calculateTradicionalValue();
      

      
      // Atualiza elementos DOM
      this.updateDOMElements(rainValues, traditionalValues);
      
      // Atualiza cache
      this.cache.lastReinoValue = rainValues.annual;
      this.cache.lastTradicionalValue = traditionalValues.total;
      
      // Dispatch event para outros sistemas
      this.dispatchCalculationUpdate(rainValues, traditionalValues);
      
    } catch (error) {
      console.error('❌ [ResultadoComparativo] Error in calculation:', error);
    }
  }

  /**
   * Calcula valor Reino Capital (sistema de faixas)
   */
  calculateReinoValue() {
    const patrimony = this.getMainPatrimony();
    const reinoInfo = calcularCustoReino(patrimony);
    
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
        patrimony: this.formatCurrency(patrimony)
      }
    };
  }

  /**
   * Calcula valor tradicional (soma dos valores máximos dos produtos selecionados)
   */
  calculateTradicionalValue() {
    const selectedAssetsWithValues = this.getSelectedAssetsWithValues();
    let totalMaxValue = 0;
    const details = [];
    
    selectedAssetsWithValues.forEach(asset => {
      const comissaoData = ComissoesUtils.getComissaoData(asset.category, asset.product);
      
      if (comissaoData) {
        const maxValue = (asset.value * comissaoData.max) / 100;
        totalMaxValue += maxValue;
        
        details.push({
          category: asset.category,
          product: asset.product,
          value: asset.value,
          taxaMax: comissaoData.max,
          maxValue: maxValue,
          formatted: {
            value: this.formatCurrency(asset.value),
            maxValue: this.formatCurrency(maxValue),
            taxa: `${comissaoData.max}%`
          }
        });
      }
    });
    
    return {
      total: totalMaxValue,
      details: details,
      count: details.length,
      formatted: {
        total: this.formatCurrency(totalMaxValue)
      }
    };
  }

  /**
   * Obtém patrimônio principal
   */
  getMainPatrimony() {
    if (this.patrimonySystem) {
      return this.patrimonySystem.getMainValue() || 0;
    }
    
    // Fallback: busca diretamente no DOM
    const mainInput = document.querySelector('[is-main="true"]');
    if (mainInput) {
      return this.parseCurrencyValue(mainInput.value);
    }
    
    return 0;
  }

  /**
   * Obtém ativos selecionados com valores
   */
  getSelectedAssetsWithValues() {
    const assets = [];
    
    // Se temos sistema de resultado, usa ele
    if (this.resultadoSyncSystem) {
      const resultData = this.resultadoSyncSystem.getResultadoData();
      
      Object.values(resultData.patrimonio || {}).forEach(item => {
        if (item.valor > 0) {
          assets.push({
            category: item.category,
            product: item.product,
            value: item.valor,
            percentage: item.percentual
          });
        }
      });
      
      return assets;
    }
    
    // Fallback: busca diretamente no DOM
    const patrimonioItems = document.querySelectorAll('.patrimonio_interactive_item');
    
    patrimonioItems.forEach(item => {
      const category = item.getAttribute('ativo-category');
      const product = item.getAttribute('ativo-product');
      const inputElement = item.querySelector('.currency-input.individual');
      
      if (category && product && inputElement) {
        const value = this.parseCurrencyValue(inputElement.value);
        
        if (value > 0) {
          // Verifica se o ativo está selecionado
          if (this.isAssetSelected(category, product)) {
            assets.push({
              category,
              product,
              value,
              percentage: 0 // Será calculado se necessário
            });
          }
        }
      }
    });
    
    return assets;
  }

  /**
   * Verifica se um ativo está selecionado
   */
  isAssetSelected(category, product) {
    if (this.cache.lastSelectedAssets.size === 0) {
      // Se não há cache, assume que todos com valor estão selecionados
      return true;
    }
    
    const normalizedKey = `${category.toLowerCase().trim()}|${product.toLowerCase().trim()}`;
    return this.cache.lastSelectedAssets.has(normalizedKey);
  }

  /**
   * Atualiza elementos DOM com os valores calculados
   */
  updateDOMElements(reinoValues, traditionalValues) {
    // Atualiza valor Reino (data-resultado="reino")
    const reinoElement = document.querySelector('[data-resultado="reino"]');
    if (reinoElement) {
      const formattedValue = this.formatCurrencyForDisplay(reinoValues.annual);
      reinoElement.textContent = formattedValue;
      
    } else {
    }
    
    // Atualiza valor Tradicional (data-resultado="tradicional")
    const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
    if (tradicionalElement) {
      const formattedValue = this.formatCurrencyForDisplay(traditionalValues.total);
      tradicionalElement.textContent = formattedValue;
      
    } else {
    }

    // Atualiza valor do patrimônio total usando o sistema existente (data-patrimonio-total="true")
    const patrimonioTotalElement = document.querySelector('[data-patrimonio-total="true"]');
    if (patrimonioTotalElement) {
      const formattedPatrimony = this.formatCurrency(reinoValues.patrimony);
      patrimonioTotalElement.textContent = formattedPatrimony;
      
    } else {
    }
    
    // Log summary
    const savings = traditionalValues.total - reinoValues.annual;
    const savingsPercent = traditionalValues.total > 0 ? (savings / traditionalValues.total) * 100 : 0;
    

  }

  /**
   * Dispatch event with calculation results
   */
  dispatchCalculationUpdate(reinoValues, traditionalValues) {
    const savings = traditionalValues.total - reinoValues.annual;
    const savingsPercent = traditionalValues.total > 0 ? (savings / traditionalValues.total) * 100 : 0;
    
    document.dispatchEvent(new CustomEvent('resultadoComparativoUpdated', {
      detail: {
        reino: reinoValues,
        tradicional: traditionalValues,
        economia: {
          valor: savings,
          percentual: savingsPercent,
          formatted: this.formatCurrency(savings)
        },
        timestamp: new Date().toISOString()
      }
    }));
  }

  /**
   * Utility: Format currency for display (only numbers and decimals)
   */
  formatCurrencyForDisplay(value) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Utility: Format currency with R$ symbol
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  /**
   * Utility: Parse currency value from string
   */
  parseCurrencyValue(value) {
    if (!value || typeof value !== 'string') return 0;
    const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  }

  /**
   * Get current status for debugging
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasPatrimonySystem: !!this.patrimonySystem,
      hasResultadoSyncSystem: !!this.resultadoSyncSystem,
      cache: {
        lastPatrimony: this.cache.lastPatrimony,
        selectedAssetsCount: this.cache.lastSelectedAssets.size,
        lastReinoValue: this.cache.lastReinoValue,
        lastTradicionalValue: this.cache.lastTradicionalValue
      },
      reinoConfig: this.reinoConfig
    };
  }

  /**
   * Debug method - manual calculation test
   */
  debugCalculate() {
    const mainPatrimony = this.getMainPatrimony();
    const selectedAssets = this.getSelectedAssetsWithValues();
    const reinoValues = this.calculateReinoValue();
    const traditionalValues = this.calculateTradicionalValue();
    
    return {
      patrimony: mainPatrimony,
      selectedAssets,
      reino: reinoValues,
      traditional: traditionalValues
    };
  }

  /**
   * Force update calculation and DOM
   */
  forceUpdate() {
    this.calculateAndUpdate();
  }

  /**
   * Check if required DOM elements exist
   */
  checkDOMElements() {
    const reinoElement = document.querySelector('[data-resultado="reino"]');
    const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
    const patrimonioElement = document.querySelector('[data-patrimonio-total="true"]');
  }

  /**
   * Reset cache
   */
  resetCache() {
    this.cache = {
      lastPatrimony: 0,
      lastSelectedAssets: new Set(),
      lastTradicionalValue: 0,
      lastReinoValue: 0
    };
  }
}

// Create and export instance
const resultadoComparativoCalculator = new ResultadoComparativoCalculator();

export { ResultadoComparativoCalculator, resultadoComparativoCalculator };
export default ResultadoComparativoCalculator;

// Global access for debugging
if (typeof window !== 'undefined') {
  window.resultadoComparativoCalculator = resultadoComparativoCalculator;
  
  // Debug helpers
  window.debugResultadoComparativo = () => {
    return resultadoComparativoCalculator.debugCalculate();
  };
  
  window.forceUpdateResultado = () => {
    resultadoComparativoCalculator.forceUpdate();
  };
}