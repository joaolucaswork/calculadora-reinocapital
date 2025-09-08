/**
 * Asset Selection Filter System - Versão Webflow TXT
 * Manages asset selection in Section 2 and filters Section 3 accordingly
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class AssetSelectionFilterSystem {
    constructor() {
      this.isInitialized = false;
      this.selectedAssets = new Set();
      this.section2Assets = [];
      this.section3Assets = [];
      this.categoryCounters = new Map(); // Contadores por categoria

      this.section2 = null;
      this.section3 = null;
    }

    init() {
      if (this.isInitialized) {
        return;
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.initializeSystem();
        });
      } else {
        this.initializeSystem();
      }

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
      const dropdownAssets = this.section2.querySelectorAll('.ativo-item-subcategory');
      const individualAssets = this.section2.querySelectorAll('.ativos_item:not(.dropdown)');

      dropdownAssets.forEach((asset) => this.makeAssetSelectable(asset, 'dropdown'));
      individualAssets.forEach((asset) => this.makeAssetSelectable(asset, 'individual'));
    }

    makeAssetSelectable(assetElement, type) {
      const category = assetElement.getAttribute('ativo-category');
      const product = assetElement.getAttribute('ativo-product');

      if (!category || !product) {
        return;
      }

      const normalizedCategory = this.normalizeString(category);
      const normalizedProduct = this.normalizeString(product);

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

      if (type === 'dropdown') {
        assetElement.insertBefore(checkboxContainer, assetElement.firstChild);
      } else {
        const iconElement = assetElement.querySelector('.icon-dragabble');
        if (iconElement) {
          iconElement.parentNode.insertBefore(checkboxContainer, iconElement.nextSibling);
        } else {
          assetElement.insertBefore(checkboxContainer, assetElement.firstChild);
        }
      }

      checkbox.addEventListener('change', (e) => {
        this.handleAssetSelection(e.target.checked, category, product, assetElement);

        // Add pulse effect when checked
        if (e.target.checked) {
          checkboxContainer.classList.add('pulse-effect');
          setTimeout(() => {
            checkboxContainer.classList.remove('pulse-effect');
          }, 400);
        }
      });

      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      assetElement.addEventListener('click', (e) => {
        if (!e.target.matches('.asset-checkbox, .asset-checkbox-label')) {
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event('change'));

          // Add pulse effect when checked via element click
          if (checkbox.checked) {
            checkboxContainer.classList.add('pulse-effect');
            setTimeout(() => {
              checkboxContainer.classList.remove('pulse-effect');
            }, 400);
          }
        }
      });

      this.section2Assets.push({
        element: assetElement,
        checkbox: checkbox,
        category: category,
        product: product,
        normalizedKey: `${normalizedCategory}|${normalizedProduct}`,
        key: `${category}|${product}`,
      });
    }

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
      document.addEventListener('patrimonySyncReset', () => {
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
      // Configura contadores para cada categoria
      const dropdowns = this.section2.querySelectorAll('.ativos_item');

      dropdowns.forEach((dropdown) => {
        const categoryName = this.getCategoryFromDropdown(dropdown);
        if (!categoryName) return;

        // Procura por contador existente ou cria um novo
        let counterElement = dropdown.querySelector('.counter_ativos');

        if (!counterElement) {
          // Cria o contador dinamicamente
          counterElement = document.createElement('div');
          counterElement.className = 'counter_ativos';

          // Para dropdowns: insere dentro do dropdown-toggle, após o texto
          const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
          if (dropdownToggle) {
            const categoryTextDiv = dropdownToggle.querySelector('div:first-child');
            if (categoryTextDiv) {
              dropdownToggle.insertBefore(counterElement, categoryTextDiv.nextSibling);
            }
          } else {
            // Para itens simples (como COE): insere após o texto direto
            const directText = dropdown.querySelector('div:first-child');
            if (directText && directText.parentNode) {
              directText.parentNode.insertBefore(counterElement, directText.nextSibling);
            }
          }
        }

        // Armazena referência do contador
        this.categoryCounters.set(categoryName, {
          element: counterElement,
          total: this.getProductCountForCategory(dropdown),
          selected: 0,
        });
      });

      this.updateAllCounters();
    }

    getCategoryFromDropdown(dropdown) {
      // Para dropdowns: busca o texto dentro do dropdown-toggle
      const dropdownToggle = dropdown.querySelector('.dropdown-toggle div:first-child');
      if (dropdownToggle) {
        return dropdownToggle.textContent.trim();
      }

      // Para itens simples (como COE): busca o texto direto
      const directText = dropdown.querySelector('div:first-child');
      if (directText && !directText.classList.contains('dropdown-subcategory')) {
        return directText.textContent.trim();
      }

      return null;
    }

    getProductCountForCategory(dropdown) {
      const products = dropdown.querySelectorAll('[ativo-product]');
      return products.length;
    }

    updateAllCounters() {
      this.categoryCounters.forEach((counter, categoryName) => {
        const selectedCount = this.getSelectedCountForCategory(categoryName);
        counter.selected = selectedCount;
        counter.element.textContent = `${selectedCount}/${counter.total}`;
      });
    }

    getSelectedCountForCategory(categoryName) {
      let count = 0;
      const normalizedCategoryName = this.normalizeString(categoryName);

      this.selectedAssets.forEach((assetKey) => {
        const [category] = assetKey.split('|');
        if (category === normalizedCategoryName) {
          count += 1;
        }
      });
      return count;
    }

    updateCounter() {
      this.updateAllCounters();
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

    resetAssetValues(category, product) {
      try {
        const patrimonioItem = this.section3.querySelector(
          `.patrimonio_interactive_item[ativo-category="${category}"][ativo-product="${product}"]`
        );

        if (patrimonioItem) {
          const input = patrimonioItem.querySelector('[input-settings="receive"]');
          if (input) {
            input.value = 'R$ 0,00';

            input.dispatchEvent(
              new CustomEvent('currencyChange', {
                detail: { value: 0 },
                bubbles: true,
              })
            );

            input.dispatchEvent(new Event('input', { bubbles: true }));
          }

          const slider = patrimonioItem.querySelector('range-slider');
          if (slider) {
            slider.value = 0;
            slider.dispatchEvent(new Event('input', { bubbles: true }));
          }

          const percentageDisplay = patrimonioItem.querySelector('.porcentagem-calculadora');
          if (percentageDisplay) {
            percentageDisplay.textContent = '0%';
          }
        }
      } catch (error) {}
    }

    clearAllSelections() {
      this.selectedAssets.clear();

      this.section2Assets.forEach((asset) => {
        asset.checkbox.checked = false;
        asset.element.classList.remove('selected-asset');
        this.resetAssetValues(asset.category, asset.product);
      });

      this.updateCounter();
      this.filterSection3();
    }

    initialFilterSetup() {
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
            key: `${category}|${product}`,
          });
        }
      });

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

    getSelectedAssets() {
      return Array.from(this.selectedAssets);
    }

    isAssetSelected(category, product) {
      const normalizedKey = `${this.normalizeString(category)}|${this.normalizeString(product)}`;
      return this.selectedAssets.has(normalizedKey);
    }

    selectAsset(category, product) {
      const asset = this.section2Assets.find(
        (a) => a.category === category && a.product === product
      );
      if (asset && !asset.checkbox.checked) {
        asset.checkbox.checked = true;
        asset.checkbox.dispatchEvent(new Event('change'));
      }
    }

    deselectAsset(category, product) {
      const asset = this.section2Assets.find(
        (a) => a.category === category && a.product === product
      );
      if (asset && asset.checkbox.checked) {
        asset.checkbox.checked = false;
        asset.checkbox.dispatchEvent(new Event('change'));
      }
    }

    resetSystem() {
      try {
        this.clearAllSelections();

        document.dispatchEvent(
          new CustomEvent('assetSelectionSystemReset', {
            detail: {
              timestamp: Date.now(),
            },
          })
        );
      } catch (error) {}
    }
  }

  // Cria instância global
  window.ReinoAssetSelectionFilter = new AssetSelectionFilterSystem();

  // Auto-inicialização com delay para garantir que o DOM esteja pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.ReinoAssetSelectionFilter.init();
      }, 100);
    });
  } else {
    setTimeout(() => {
      window.ReinoAssetSelectionFilter.init();
    }, 100);
  }
})();
