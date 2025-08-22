/**
 * Asset Selection Filter System
 * Manages asset selection in Section 2 and filters Section 3 accordingly
 */
export class AssetSelectionFilterSystem {
  constructor() {
    this.isInitialized = false;
    this.selectedAssets = new Set();
    this.section2Assets = [];
    this.section3Assets = [];

    // Cache dos elementos
    this.section2 = null;
    this.section3 = null;
    this.counterElement = null;


  }

  init() {
    if (this.isInitialized) {
      return;
    }

    document.addEventListener('DOMContentLoaded', () => {
      this.initializeSystem();
    });

    this.isInitialized = true;
  }

  initializeSystem() {
    this.section2 = document.querySelector('._2-section-calc-ativos');
    this.section3 = document.querySelector('._3-section-patrimonio-alocation');

    if (!this.section2 || !this.section3) {
      return;
    }

    this.setupAssetSelection();
    this.setupCounter();
    this.setupClearButton();
    this.initialFilterSetup();
    this.setupSystemListeners();

    // Dispatch system ready event after initialization (with delay to ensure all systems are ready)
    setTimeout(() => {
      document.dispatchEvent(
        new CustomEvent('assetSelectionSystemReady', {
          detail: {
            selectedCount: this.selectedAssets.size,
            selectedAssets: Array.from(this.selectedAssets),
            cacheLoaded: false,
          },
        })
      );
    }, 200);
  }

  setupAssetSelection() {
    // Encontrar todos os assets selecionáveis na Section 2

    // Assets em dropdowns
    const dropdownAssets = this.section2.querySelectorAll('.ativo-item-subcategory');
    dropdownAssets.forEach((asset) => this.makeAssetSelectable(asset, 'dropdown'));

    // Assets individuais
    const individualAssets = this.section2.querySelectorAll('.ativos_item:not(.dropdown)');
    individualAssets.forEach((asset) => this.makeAssetSelectable(asset, 'individual'));
  }

  makeAssetSelectable(assetElement, type) {
    const category = assetElement.getAttribute('ativo-category');
    const product = assetElement.getAttribute('ativo-product');

    if (!category || !product) {
      return;
    }

    // Normalizar as strings para comparação consistente
    const normalizedCategory = this.normalizeString(category);
    const normalizedProduct = this.normalizeString(product);

    // Criar checkbox
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'asset-checkbox-container';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'asset-checkbox';
    checkbox.id = `asset-${normalizedCategory}-${normalizedProduct}`
      .replace(/\s+/g, '-')
      .toLowerCase();

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.className = 'asset-checkbox-label';

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(label);

    // Inserir checkbox no elemento
    if (type === 'dropdown') {
      // Para items de dropdown, adicionar no início
      assetElement.insertBefore(checkboxContainer, assetElement.firstChild);
    } else {
      // Para items individuais, adicionar depois do ícone
      const iconElement = assetElement.querySelector('.icon-dragabble');
      if (iconElement) {
        iconElement.parentNode.insertBefore(checkboxContainer, iconElement.nextSibling);
      } else {
        assetElement.insertBefore(checkboxContainer, assetElement.firstChild);
      }
    }

    // Event listener para seleção
    checkbox.addEventListener('change', (e) => {
      this.handleAssetSelection(e.target.checked, category, product, assetElement);
    });

    // Tornar o elemento clicável
    assetElement.addEventListener('click', (e) => {
      // Se o clique não foi no checkbox, ativar/desativar o checkbox
      if (!e.target.matches('.asset-checkbox, .asset-checkbox-label')) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });

    // Armazenar referência com string normalizada
    this.section2Assets.push({
      element: assetElement,
      checkbox: checkbox,
      category: category,
      product: product,
      normalizedKey: `${normalizedCategory}|${normalizedProduct}`,
      key: `${category}|${product}`, // manter key original para compatibilidade
    });
  }

  // Método para normalizar strings para comparação consistente
  normalizeString(str) {
    return str.toLowerCase().trim();
  }

  handleAssetSelection(isSelected, category, product, assetElement) {
    const normalizedKey = `${this.normalizeString(category)}|${this.normalizeString(product)}`;

    if (isSelected) {
      this.selectedAssets.add(normalizedKey);
      assetElement.classList.add('selected-asset');
      this.resetAssetValues(category, product);
    } else {
      this.selectedAssets.delete(normalizedKey);
      assetElement.classList.remove('selected-asset');
      this.resetAssetValues(category, product);
    }

    this.updateCounter();
    this.filterSection3();

    // Notificar mudança na seleção para o step navigation
    document.dispatchEvent(
      new CustomEvent('assetSelectionChanged', {
        detail: {
          selectedCount: this.selectedAssets.size,
          selectedAssets: Array.from(this.selectedAssets),
        },
      })
    );
  }

  setupSystemListeners() {
    // Listen for patrimony sync reset events
    document.addEventListener('patrimonySyncReset', () => {
      // Clear UI selections when patrimony system resets
      this.selectedAssets.clear();
      this.section2Assets.forEach((asset) => {
        asset.checkbox.checked = false;
        asset.element.classList.remove('selected-asset');
      });
      this.updateCounter();
      this.filterSection3();
    });
  }

  setupCounter() {
    this.counterElement = this.section2.querySelector('.counter_ativos');
    if (this.counterElement) {
      this.updateCounter();
    }
  }

  updateCounter() {
    if (this.counterElement) {
      this.counterElement.textContent = `(${this.selectedAssets.size})`;
    }
  }

  setupClearButton() {
    const clearButton = this.section2.querySelector('.ativos_clean-button');
    if (clearButton) {
      clearButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearAllSelections();
      });
    }
  }

  /**
   * Reset all input values for a specific asset to zero
   * This ensures deselected assets don't affect calculations
   */
  resetAssetValues(category, product) {
    try {
      // Find the corresponding patrimonio_interactive_item in Section 3
      const patrimonioItem = this.section3.querySelector(
        `.patrimonio_interactive_item[ativo-category="${category}"][ativo-product="${product}"]`
      );

      if (patrimonioItem) {
        // Reset currency input field
        const input = patrimonioItem.querySelector('[input-settings="receive"]');
        if (input) {
          // Set value to formatted zero
          input.value = 'R$ 0,00';

          // Trigger currencyChange event to update the patrimony sync system
          input.dispatchEvent(
            new CustomEvent('currencyChange', {
              detail: { value: 0 },
              bubbles: true,
            })
          );

          // Also trigger input event as fallback
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Reset slider
        const slider = patrimonioItem.querySelector('range-slider');
        if (slider) {
          slider.value = 0;
          slider.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Reset any percentage displays immediately
        const percentageDisplay = patrimonioItem.querySelector('.porcentagem-calculadora');
        if (percentageDisplay) {
          percentageDisplay.textContent = '0%';
        }
      }
    } catch (error) {
    }
  }



  clearAllSelections() {
    this.selectedAssets.clear();

    this.section2Assets.forEach((asset) => {
      asset.checkbox.checked = false;
      asset.element.classList.remove('selected-asset');
      // Reset values for all assets when clearing selections
      this.resetAssetValues(asset.category, asset.product);
    });

    this.updateCounter();
    this.filterSection3();
  }

  initialFilterSetup() {
    // Encontrar todos os assets na Section 3
    const section3Assets = this.section3.querySelectorAll(
      '.ativos-grafico-item, .patrimonio_interactive_item'
    );

    section3Assets.forEach((asset) => {
      const category = asset.getAttribute('ativo-category');
      const product = asset.getAttribute('ativo-product');

      if (category && product) {
        this.section3Assets.push({
          element: asset,
          category: category,
          product: product,
          normalizedKey: `${this.normalizeString(category)}|${this.normalizeString(product)}`,
          key: `${category}|${product}`, // manter key original para compatibilidade
        });
      }
    });

    // Inicialmente esconder todos os itens da Section 3
    this.filterSection3();
  }

  filterSection3() {
    this.section3Assets.forEach((asset) => {
      const isSelected = this.selectedAssets.has(asset.normalizedKey);

      if (isSelected) {
        asset.element.style.display = '';
        asset.element.classList.remove('asset-filtered-out');
        asset.element.classList.add('asset-filtered-in');
      } else {
        asset.element.style.display = 'none';
        asset.element.classList.add('asset-filtered-out');
        asset.element.classList.remove('asset-filtered-in');
      }
    });

    document.dispatchEvent(
      new CustomEvent('assetFilterChanged', {
        detail: {
          selectedAssets: Array.from(this.selectedAssets),
          selectedCount: this.selectedAssets.size,
        },
      })
    );
  }

  // Métodos públicos para integração
  getSelectedAssets() {
    return Array.from(this.selectedAssets);
  }

  isAssetSelected(category, product) {
    const normalizedKey = `${this.normalizeString(category)}|${this.normalizeString(product)}`;
    return this.selectedAssets.has(normalizedKey);
  }

  selectAsset(category, product) {
    const asset = this.section2Assets.find((a) => a.category === category && a.product === product);
    if (asset && !asset.checkbox.checked) {
      asset.checkbox.checked = true;
      asset.checkbox.dispatchEvent(new Event('change'));
    }
  }

  deselectAsset(category, product) {
    const asset = this.section2Assets.find((a) => a.category === category && a.product === product);
    if (asset && asset.checkbox.checked) {
      asset.checkbox.checked = false;
      asset.checkbox.dispatchEvent(new Event('change'));
    }
  }

  /**
   * Reset the entire asset selection system and clear all caches
   * This method can be called by other systems for complete reset
   */
  resetSystem() {
    try {
      // Clear all selections (this also clears the cache)
      this.clearAllSelections();

      // Dispatch event to notify other systems about the reset
      document.dispatchEvent(
        new CustomEvent('assetSelectionSystemReset', {
          detail: {
            timestamp: Date.now(),
          },
        })
      );

    } catch (error) {
    }
  }


}
