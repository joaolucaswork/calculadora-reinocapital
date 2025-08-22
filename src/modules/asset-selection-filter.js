/**
 * Asset Selection Filter System - Versão Webflow TXT
 * Manages asset selection in Section 2 and filters Section 3 accordingly
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  "use strict";

  class AssetSelectionFilterSystem {
    constructor() {
      this.isInitialized = false;
      this.selectedAssets = new Set();
      this.section2Assets = [];
      this.section3Assets = [];

      this.section2 = null;
      this.section3 = null;
      this.counterElement = null;
    }

    init() {
      if (this.isInitialized) {
        console.warn("🔄 Asset Selection Filter já inicializado");
        return;
      }

      console.warn("🚀 Iniciando Asset Selection Filter System");

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          this.initializeSystem();
        });
      } else {
        this.initializeSystem();
      }

      this.isInitialized = true;
    }

    initializeSystem() {
      console.warn("🔍 Buscando seções...");
      this.section2 = document.querySelector("._2-section-calc-ativos");
      this.section3 = document.querySelector(
        "._3-section-patrimonio-alocation"
      );

      console.warn("📍 Section 2:", !!this.section2);
      console.warn("📍 Section 3:", !!this.section3);

      if (!this.section2 || !this.section3) {
        console.error("❌ Seções não encontradas!");
        return;
      }

      console.warn("✅ Configurando asset selection...");
      this.setupAssetSelection();
      this.setupCounter();
      this.setupClearButton();
      this.initialFilterSetup();
      this.setupSystemListeners();

      setTimeout(() => {
        document.dispatchEvent(
          new CustomEvent("assetSelectionSystemReady", {
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
      const dropdownAssets = this.section2.querySelectorAll(
        ".ativo-item-subcategory"
      );
      const individualAssets = this.section2.querySelectorAll(
        ".ativos_item:not(.dropdown)"
      );

      console.warn("🎯 Assets encontrados:", {
        dropdown: dropdownAssets.length,
        individual: individualAssets.length,
      });

      dropdownAssets.forEach((asset) =>
        this.makeAssetSelectable(asset, "dropdown")
      );
      individualAssets.forEach((asset) =>
        this.makeAssetSelectable(asset, "individual")
      );
    }

    makeAssetSelectable(assetElement, type) {
      const category = assetElement.getAttribute("ativo-category");
      const product = assetElement.getAttribute("ativo-product");

      if (!category || !product) {
        console.warn("⚠️ Asset sem categoria/produto:", assetElement);
        return;
      }

      console.warn("🔧 Criando checkbox para:", category, "-", product);

      const normalizedCategory = this.normalizeString(category);
      const normalizedProduct = this.normalizeString(product);

      const checkboxContainer = document.createElement("div");
      checkboxContainer.className = "asset-checkbox-container";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "asset-checkbox";
      checkbox.id = `asset-${normalizedCategory}-${normalizedProduct}`
        .replace(/\s+/g, "-")
        .toLowerCase();

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.className = "asset-checkbox-label";

      checkboxContainer.appendChild(checkbox);
      checkboxContainer.appendChild(label);

      if (type === "dropdown") {
        assetElement.insertBefore(checkboxContainer, assetElement.firstChild);
        console.warn("✅ Checkbox inserido em dropdown:", category, product);
      } else {
        const iconElement = assetElement.querySelector(".icon-dragabble");
        if (iconElement) {
          iconElement.parentNode.insertBefore(
            checkboxContainer,
            iconElement.nextSibling
          );
          console.warn("✅ Checkbox inserido após ícone:", category, product);
        } else {
          assetElement.insertBefore(checkboxContainer, assetElement.firstChild);
          console.warn("✅ Checkbox inserido no início:", category, product);
        }
      }

      checkbox.addEventListener("change", (e) => {
        this.handleAssetSelection(
          e.target.checked,
          category,
          product,
          assetElement
        );
      });

      assetElement.addEventListener("click", (e) => {
        if (!e.target.matches(".asset-checkbox, .asset-checkbox-label")) {
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event("change"));
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
      const normalizedKey = `${this.normalizeString(
        category
      )}|${this.normalizeString(product)}`;

      if (isSelected) {
        this.selectedAssets.add(normalizedKey);
        assetElement.classList.add("selected-asset");
        this.resetAssetValues(category, product);
      } else {
        this.selectedAssets.delete(normalizedKey);
        assetElement.classList.remove("selected-asset");
        this.resetAssetValues(category, product);
      }

      this.updateCounter();
      this.filterSection3();

      document.dispatchEvent(
        new CustomEvent("assetSelectionChanged", {
          detail: {
            selectedCount: this.selectedAssets.size,
            selectedAssets: Array.from(this.selectedAssets),
          },
        })
      );
    }

    setupSystemListeners() {
      document.addEventListener("patrimonySyncReset", () => {
        this.selectedAssets.clear();
        this.section2Assets.forEach((asset) => {
          asset.checkbox.checked = false;
          asset.element.classList.remove("selected-asset");
        });
        this.updateCounter();
        this.filterSection3();
      });
    }

    setupCounter() {
      this.counterElement = this.section2.querySelector(".counter_ativos");
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
      const clearButton = this.section2.querySelector(".ativos_clean-button");
      if (clearButton) {
        clearButton.addEventListener("click", (e) => {
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
          const input = patrimonioItem.querySelector(
            '[input-settings="receive"]'
          );
          if (input) {
            input.value = "R$ 0,00";

            input.dispatchEvent(
              new CustomEvent("currencyChange", {
                detail: { value: 0 },
                bubbles: true,
              })
            );

            input.dispatchEvent(new Event("input", { bubbles: true }));
          }

          const slider = patrimonioItem.querySelector("range-slider");
          if (slider) {
            slider.value = 0;
            slider.dispatchEvent(new Event("input", { bubbles: true }));
          }

          const percentageDisplay = patrimonioItem.querySelector(
            ".porcentagem-calculadora"
          );
          if (percentageDisplay) {
            percentageDisplay.textContent = "0%";
          }
        }
      } catch (error) {}
    }

    clearAllSelections() {
      this.selectedAssets.clear();

      this.section2Assets.forEach((asset) => {
        asset.checkbox.checked = false;
        asset.element.classList.remove("selected-asset");
        this.resetAssetValues(asset.category, asset.product);
      });

      this.updateCounter();
      this.filterSection3();
    }

    initialFilterSetup() {
      const section3Assets = this.section3.querySelectorAll(
        ".ativos-grafico-item, .patrimonio_interactive_item"
      );

      section3Assets.forEach((asset) => {
        const category = asset.getAttribute("ativo-category");
        const product = asset.getAttribute("ativo-product");

        if (category && product) {
          this.section3Assets.push({
            element: asset,
            category: category,
            product: product,
            normalizedKey: `${this.normalizeString(
              category
            )}|${this.normalizeString(product)}`,
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
          asset.element.style.display = "";
          asset.element.classList.remove("asset-filtered-out");
          asset.element.classList.add("asset-filtered-in");
        } else {
          asset.element.style.display = "none";
          asset.element.classList.add("asset-filtered-out");
          asset.element.classList.remove("asset-filtered-in");
        }
      });

      document.dispatchEvent(
        new CustomEvent("assetFilterChanged", {
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
      const normalizedKey = `${this.normalizeString(
        category
      )}|${this.normalizeString(product)}`;
      return this.selectedAssets.has(normalizedKey);
    }

    selectAsset(category, product) {
      const asset = this.section2Assets.find(
        (a) => a.category === category && a.product === product
      );
      if (asset && !asset.checkbox.checked) {
        asset.checkbox.checked = true;
        asset.checkbox.dispatchEvent(new Event("change"));
      }
    }

    deselectAsset(category, product) {
      const asset = this.section2Assets.find(
        (a) => a.category === category && a.product === product
      );
      if (asset && asset.checkbox.checked) {
        asset.checkbox.checked = false;
        asset.checkbox.dispatchEvent(new Event("change"));
      }
    }

    resetSystem() {
      try {
        this.clearAllSelections();

        document.dispatchEvent(
          new CustomEvent("assetSelectionSystemReset", {
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
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
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
