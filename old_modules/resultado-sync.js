/**
 * Sistema Simples de Sincronização de Resultados
 * Funciona diretamente com atributos ativo-category e ativo-product
 */

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
};

class SimpleResultadoSync {
  constructor() {
    this.isInitialized = false;
    this.selectedAssets = new Set();
  }

  init() {
    if (this.isInitialized) return;

    this.setupEventListeners();
    this.isInitialized = true;

    document.dispatchEvent(new CustomEvent('simpleResultadoSyncReady'));
  }

  setupEventListeners() {
    document.addEventListener('assetSelectionChanged', (e) => {
      this.selectedAssets = new Set(e.detail.selectedAssets || []);
      this.updateVisibility();
    });

    document.addEventListener('currencyInputChanged', () => {
      this.updateVisibility();
    });

    document.addEventListener('patrimonyValueChanged', () => {
      this.updateVisibility();
    });

    document.addEventListener('allocationChanged', () => {
      this.updateVisibility();
    });
  }

  updateVisibility() {
    const hasSelectedAssetsWithValue = this.hasSelectedAssetsWithValue();

    this.updateMainContainers(hasSelectedAssetsWithValue);

    if (!hasSelectedAssetsWithValue) {
      this.hideAllProducts();
      return;
    }

    this.updateProducts();
  }

  hasSelectedAssetsWithValue() {
    const allProducts = document.querySelectorAll('.patrimonio_interactive_item');

    for (const item of allProducts) {
      const category = item.getAttribute('ativo-category');
      const product = item.getAttribute('ativo-product');

      if (this.isAssetSelected(category, product) && this.hasValue(item)) {
        return true;
      }
    }
    return false;
  }

  isAssetSelected(category, product) {
    const normalizedKey = `${category.toLowerCase().trim()}|${product.toLowerCase().trim()}`;
    return this.selectedAssets.has(normalizedKey);
  }

  hasValue(patrimonioItem) {
    const inputElement = patrimonioItem.querySelector('.currency-input.individual');
    if (!inputElement) return false;

    const value = Utils.parseCurrencyValue(inputElement.value);
    return value > 0;
  }

  updateMainContainers(show) {
    const patrimonioContainer = document.querySelector('.patrimonio-ativos-group');
    const comissaoContainer = document.querySelector('.ativos-content-float');

    [patrimonioContainer, comissaoContainer].forEach((container) => {
      if (container) {
        if (show) {
          container.style.display = '';
          container.style.opacity = '1';
        } else {
          container.style.display = 'none';
          container.style.opacity = '0';
        }
      }
    });
  }

  hideAllProducts() {
    document.querySelectorAll('.patrimonio-ativos-group .ativos-produtos-item').forEach((item) => {
      this.hideElement(item);
    });

    document.querySelectorAll('.ativos-content-float .ativos-produtos-item').forEach((item) => {
      this.hideElement(item);
    });

    // Hide all groups
    document.querySelectorAll('.ativos-content-float .ativos-group').forEach((group) => {
      this.hideElement(group);
    });

    document.querySelectorAll('.patrimonio-ativos-group .ativos-group-produtos').forEach((group) => {
      this.hideElement(group);
    });
  }

  updateProducts() {
    const visibleGroups = new Set();

    document.querySelectorAll('.patrimonio-ativos-group .ativos-produtos-item').forEach((item) => {
      const shouldShow = this.updatePatrimonioProduct(item);
      if (shouldShow) {
        const category = item.getAttribute('ativo-category');
        if (category) {
          visibleGroups.add(this.getCategoryClass(category));
        }
      }
    });

    document.querySelectorAll('.ativos-content-float .ativos-produtos-item').forEach((item) => {
      const shouldShow = this.updateComissaoProduct(item);
      if (shouldShow) {
        const category = item.getAttribute('ativo-category');
        if (category) {
          visibleGroups.add(this.getCategoryClass(category));
        }
      }
    });

    this.updateGroupVisibility(visibleGroups);
  }

  updatePatrimonioProduct(element) {
    const category = element.getAttribute('ativo-category');
    const product = element.getAttribute('ativo-product');

    if (!category || !product) return false;

    const isSelected = this.isAssetSelected(category, product);
    const patrimonioItem = document.querySelector(
      `.patrimonio_interactive_item[ativo-category="${category}"][ativo-product="${product}"]`
    );
    const hasValue = patrimonioItem ? this.hasValue(patrimonioItem) : false;
    const shouldShow = isSelected && hasValue;

    if (shouldShow) {
      this.showElement(element);
      this.updatePatrimonioValues(element, category, product);
    } else {
      this.hideElement(element);
    }

    return shouldShow;
  }

  updateComissaoProduct(element) {
    const category = element.getAttribute('ativo-category');
    const product = element.getAttribute('ativo-product');

    if (!category || !product) return false;

    const isSelected = this.isAssetSelected(category, product);
    const patrimonioItem = document.querySelector(
      `.patrimonio_interactive_item[ativo-category="${category}"][ativo-product="${product}"]`
    );
    const hasValue = patrimonioItem ? this.hasValue(patrimonioItem) : false;
    const shouldShow = isSelected && hasValue;

    if (shouldShow) {
      this.showElement(element);
      this.updateComissaoValues(element, category, product);
    } else {
      this.hideElement(element);
    }

    return shouldShow;
  }

  updatePatrimonioValues(element, category, product) {
    const inputElement = document.querySelector(
      `.patrimonio_interactive_item[ativo-category="${category}"][ativo-product="${product}"] .currency-input.individual`
    );

    const sliderElement = document.querySelector(
      `.patrimonio_interactive_item[ativo-category="${category}"][ativo-product="${product}"] range-slider`
    );

    if (!inputElement) return;

    const value = Utils.parseCurrencyValue(inputElement.value);
    const percentage = sliderElement ? parseFloat(sliderElement.value) * 100 : 0;

    const valorElement = element.querySelector('.valor-minimo');
    if (valorElement) {
      valorElement.textContent = Utils.formatCurrency(value);
    }

    const percentageElement = element.querySelector('.porcentagem-calculadora.v2');
    if (percentageElement) {
      percentageElement.textContent = `${percentage.toFixed(1)}%`;
    }
  }

  updateComissaoValues(element, category, product) {
    const inputElement = document.querySelector(
      `.patrimonio_interactive_item[ativo-category="${category}"][ativo-product="${product}"] .currency-input.individual`
    );

    if (!inputElement) return;

    const value = Utils.parseCurrencyValue(inputElement.value);

    const comissaoData = this.getComissaoData(category, product);
    if (!comissaoData) return;

    const valorMinimo = (value * comissaoData.min) / 100;
    const valorMaximo = (value * comissaoData.max) / 100;

    const taxaMinimaElement = element.querySelector('.taxa-minima');
    const taxaMaximaElement = element.querySelector('.taxa-maxima');
    const valorMinimoElement = element.querySelector('.ativo-valor-minimo .valor-minimo');
    const valorMaximoElement = element.querySelector('.ativo-valor-maximo .valor-maximo');

    if (taxaMinimaElement) taxaMinimaElement.textContent = `${comissaoData.min}%`;
    if (taxaMaximaElement) taxaMaximaElement.textContent = `${comissaoData.max}%`;
    if (valorMinimoElement) valorMinimoElement.textContent = Utils.formatCurrency(valorMinimo);
    if (valorMaximoElement) valorMaximoElement.textContent = Utils.formatCurrency(valorMaximo);
  }

  getComissaoData(category, product) {
    if (typeof window.ComissoesUtils !== 'undefined') {
      return window.ComissoesUtils.getComissaoData(category, product);
    }

    if (typeof window.COMISSOES_CONFIG !== 'undefined') {
      return window.COMISSOES_CONFIG[category]?.[product];
    }

    return null;
  }

  showElement(element) {
    if (element.style.display === 'none') {
      element.style.display = 'block';
      element.style.opacity = '0';
      element.style.transform = 'translateY(-10px)';

      setTimeout(() => {
        element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, 16);
    }
  }

  hideElement(element) {
    if (element.style.display !== 'none') {
      element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      element.style.opacity = '0';
      element.style.transform = 'translateY(-10px)';

      setTimeout(() => {
        if (element.style.opacity === '0') {
          element.style.display = 'none';
        }
      }, 300);
    }
  }



  getResultadoData() {
    const data = {
      patrimonio: {},
      comissoes: {},
      total: 0,
    };

    const patrimonioItems = document.querySelectorAll('.patrimonio_interactive_item');

    patrimonioItems.forEach((item) => {
      const category = item.getAttribute('ativo-category');
      const product = item.getAttribute('ativo-product');

      if (!category || !product) return;

      // Only process items for selected assets
      if (!this.isAssetSelected(category, product)) return;

      const key = `${category}-${product}`;
      const inputElement = item.querySelector('.currency-input.individual');
      const sliderElement = item.querySelector('range-slider');

      if (inputElement) {
        const value = Utils.parseCurrencyValue(inputElement.value);
        const percentage = sliderElement ? parseFloat(sliderElement.value) * 100 : 0;

        // Only include in data if there's a value > 0
        if (value > 0) {
          data.patrimonio[key] = {
            valor: value,
            percentual: percentage,
            category: category,
            product: product,
          };

          data.total += value;

          const comissaoData = this.getComissaoData(category, product);
          if (comissaoData) {
            data.comissoes[key] = {
              taxaMin: comissaoData.min,
              taxaMax: comissaoData.max,
              valorMin: (value * comissaoData.min) / 100,
              valorMax: (value * comissaoData.max) / 100,
            };
          }
        }
      }
    });

    return data;
  }

  getCategoryClass(category) {
    const mapping = {
      'Renda Fixa': 'renda-fixa',
      'Fundo de Investimento': 'fundo-investimento', 
      'Renda Variável': 'renda-variavel',
      'Internacional': 'internacional',
      'Outros': 'outros'
    };
    return mapping[category] || category.toLowerCase().replace(/\s+/g, '-');
  }

  updateGroupVisibility(visibleGroups) {
    // Show/hide comissao groups
    document.querySelectorAll('.ativos-content-float .ativos-group').forEach((group) => {
      const classList = Array.from(group.classList);
      const categoryClass = classList.find(cls => 
        ['renda-fixa', 'fundo-investimento', 'renda-variavel', 'internacional', 'outros'].includes(cls)
      );
      
      if (categoryClass && visibleGroups.has(categoryClass)) {
        this.showElement(group);
      } else {
        this.hideElement(group);
      }
    });

    // Show/hide patrimonio groups
    document.querySelectorAll('.patrimonio-ativos-group .ativos-group-produtos').forEach((group) => {
      const classList = Array.from(group.classList);
      const categoryClass = classList.find(cls => 
        ['renda-fixa', 'fundo-investimento', 'renda-variavel', 'internacional', 'outros'].includes(cls)
      );
      
      if (categoryClass && visibleGroups.has(categoryClass)) {
        this.showElement(group);
      } else {
        this.hideElement(group);
      }
    });
  }

  debug() {
    console.warn('=== SIMPLE RESULTADO SYNC DEBUG ===');
    console.warn('Selected assets:', Array.from(this.selectedAssets));
    console.warn('Has assets with value:', this.hasSelectedAssetsWithValue());

    const patrimonioContainer = document.querySelector('.patrimonio-ativos-group');
    const comissaoContainer = document.querySelector('.ativos-content-float');

    console.warn('Containers:', {
      patrimonioExists: !!patrimonioContainer,
      comissaoExists: !!comissaoContainer,
      patrimonioDisplay: patrimonioContainer?.style.display || 'default',
      comissaoDisplay: comissaoContainer?.style.display || 'default',
    });

    this.selectedAssets.forEach((normalizedKey) => {
      const [categoryLower, productLower] = normalizedKey.split('|');

      const patrimonioItem = Array.from(
        document.querySelectorAll('.patrimonio_interactive_item')
      ).find((item) => {
        const itemCategory = item.getAttribute('ativo-category');
        const itemProduct = item.getAttribute('ativo-product');
        return (
          itemCategory?.toLowerCase().trim() === categoryLower &&
          itemProduct?.toLowerCase().trim() === productLower
        );
      });

      if (patrimonioItem) {
        const category = patrimonioItem.getAttribute('ativo-category');
        const product = patrimonioItem.getAttribute('ativo-product');
        const hasValue = this.hasValue(patrimonioItem);
        const inputElement = patrimonioItem.querySelector('.currency-input.individual');

        console.warn(`${normalizedKey} -> ${category}-${product}:`, {
          hasValue,
          inputValue: inputElement?.value || 'not found',
          isSelected: this.isAssetSelected(category, product),
        });
      }
    });


  }

  forceTest(category, product) {
    const normalizedKey = `${category.toLowerCase()}|${product.toLowerCase()}`;
    this.selectedAssets.add(normalizedKey);

    const inputElement = document.querySelector(
      `.patrimonio_interactive_item[ativo-category="${category}"][ativo-product="${product}"] .currency-input.individual`
    );

    if (inputElement) {
      inputElement.value = '10.000,00';
    }

    this.updateVisibility();
  }
}

const resultadoSync = new SimpleResultadoSync();

export { SimpleResultadoSync, resultadoSync };
export default SimpleResultadoSync;

if (typeof window !== 'undefined') {
  window.resultadoSync = resultadoSync;
  window.resultadoSyncInstance = resultadoSync;

  window.debugResultadoSync = () => {
    resultadoSync.debug();
  };

  window.testResultadoSync = (category, product) => {
    resultadoSync.forceTest(category, product);
  };

  window.forceUpdateResultados = () => {
    resultadoSync.updateVisibility();
  };
}
