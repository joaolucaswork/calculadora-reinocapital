/**
 * Selected Products List Module
 * Versão sem imports/exports para uso direto no Webflow
 * Gerencia a exibição dos itens na lista-produtos-selecionados baseado nos ativos selecionados
 */

(function () {
  'use strict';

  class SelectedProductsList {
    constructor() {
      this.isInitialized = false;
      this.selectedAssets = new Set();
      this.listContainer = null;
      this.categoryItems = new Map();

      // Configuração de debug
      this.config = {
        enableLogging: false,
        animationDuration: 300,
      };
    }

    init() {
      if (this.isInitialized) return;

      try {
        this.findListContainer();
        this.cacheListItems();
        this.setupEventListeners();
        this.updateVisibility();
        this.isInitialized = true;

        if (this.config.enableLogging) {
          console.log('✅ Selected Products List initialized');
        }

        document.dispatchEvent(new CustomEvent('selectedProductsListReady'));
      } catch (error) {
        console.error('❌ Failed to initialize Selected Products List:', error);
      }
    }

    findListContainer() {
      // Busca pela div lista-produtos-selecionados
      this.listContainer = document.querySelector('.lista-produtos-selecionados');

      if (!this.listContainer) {
        // Fallback: busca por containers alternativos
        this.listContainer = document.querySelector('[class*="lista"][class*="produtos"]');
      }

      if (!this.listContainer) {
        throw new Error('Container lista-produtos-selecionados não encontrado');
      }

      if (this.config.enableLogging) {
        console.log('📋 Found list container:', this.listContainer);
      }
    }

    cacheListItems() {
      if (!this.listContainer) return;

      // Busca todos os itens categoria-ativo dentro do container
      const categoryItems = this.listContainer.querySelectorAll('.categoria-ativo');

      this.categoryItems.clear();

      categoryItems.forEach((categoryElement) => {
        // Busca o atributo ativo-category no próprio elemento ou no pai
        let targetElement = categoryElement;
        let category = targetElement.getAttribute('ativo-category');

        if (!category) {
          // Se não encontrou, busca no elemento pai
          targetElement = categoryElement.closest('[ativo-category]');
          if (targetElement) {
            category = targetElement.getAttribute('ativo-category');
          }
        }

        // Se ainda não encontrou, tenta extrair da classe ou texto
        if (!category) {
          const categoryText = categoryElement.textContent?.trim();
          if (categoryText) {
            category = categoryText;
          }
        }

        if (category) {
          // Usa apenas a categoria como chave (sem produto específico)
          const normalizedKey = category.toLowerCase().trim();

          this.categoryItems.set(normalizedKey, {
            element: categoryElement, // O elemento categoria-ativo
            targetElement: targetElement,
            category: category,
            visible: true,
          });

          if (this.config.enableLogging) {
            console.log(`📦 Cached categoria-ativo: ${category}`);
          }
        }
      });

      // Cache elementos categoria-porcentagem
      const categoryPercentageElements = document.querySelectorAll(
        '.categoria-porcentagem[ativo-category]'
      );
      categoryPercentageElements.forEach((categoryElement) => {
        const category = categoryElement.getAttribute('ativo-category');

        if (category) {
          const normalizedKey = `${category.toLowerCase().trim()}-percentage`;

          this.categoryItems.set(normalizedKey, {
            element: categoryElement, // O elemento categoria-porcentagem
            targetElement: null,
            category: category,
            visible: true,
            isPercentage: true, // Flag para identificar elementos de porcentagem
          });

          if (this.config.enableLogging) {
            console.log(`📦 Cached categoria-porcentagem: ${category}`);
          }
        }
      });

      if (this.config.enableLogging) {
        console.log(`📋 Cached ${this.categoryItems.size} category items (ativo + porcentagem)`);
      }
    }

    setupEventListeners() {
      // Escuta mudanças na seleção de ativos
      document.addEventListener('assetSelectionChanged', (e) => {
        this.handleAssetSelectionChange(e.detail);
      });

      // Escuta mudanças nos valores de patrimônio
      document.addEventListener('patrimonioUpdated', () => {
        this.updateVisibility();
      });

      // Escuta mudanças de alocação
      document.addEventListener('allocationChanged', () => {
        this.updateVisibility();
      });

      // Re-cache items quando o DOM muda
      document.addEventListener('DOMContentLoaded', () => {
        this.cacheListItems();
        this.updateVisibility();
      });

      if (this.config.enableLogging) {
        console.log('👂 Event listeners setup complete');
      }
    }

    handleAssetSelectionChange(detail) {
      if (detail && detail.selectedAssets) {
        this.selectedAssets = new Set(detail.selectedAssets);

        if (this.config.enableLogging) {
          console.log('🔄 Asset selection changed:', Array.from(this.selectedAssets));
        }

        this.updateVisibility();
      }
    }

    updateVisibility() {
      if (!this.listContainer || this.categoryItems.size === 0) {
        return;
      }

      let visibleCount = 0;

      this.categoryItems.forEach((item, key) => {
        const shouldShow = this.shouldShowCategory(item.category);

        if (shouldShow !== item.visible) {
          this.toggleItemVisibility(item, shouldShow);
          item.visible = shouldShow;
        }

        if (shouldShow) {
          visibleCount++;
        }
      });

      // Atualiza visibilidade do container principal
      this.updateContainerVisibility(visibleCount > 0);

      if (this.config.enableLogging) {
        console.log(`👁️ Updated visibility: ${visibleCount} items visible`);
      }

      // Dispara evento para outros módulos
      document.dispatchEvent(
        new CustomEvent('selectedProductsListUpdated', {
          detail: {
            visibleCount: visibleCount,
            totalItems: this.categoryItems.size,
          },
        })
      );
    }

    shouldShowCategory(category) {
      // Verifica se QUALQUER produto desta categoria está selecionado
      const hasSelectedAssetInCategory = Array.from(this.selectedAssets).some((assetKey) => {
        const [assetCategory] = assetKey.split('|');
        return assetCategory === category.toLowerCase().trim();
      });

      if (!hasSelectedAssetInCategory) {
        return false;
      }

      // Verifica se QUALQUER produto desta categoria tem valor > 0
      const patrimonioItems = document.querySelectorAll(
        `.patrimonio_interactive_item[ativo-category="${category}"]`
      );

      let hasValueInCategory = false;
      patrimonioItems.forEach((item) => {
        const input = item.querySelector('.currency-input.individual');
        if (input) {
          const value = this.parseCurrencyValue(input.value);
          if (value > 0) {
            hasValueInCategory = true;
          }
        }
      });

      if (this.config.enableLogging) {
        console.log(
          `🔍 Category ${category}: selected=${hasSelectedAssetInCategory}, hasValue=${hasValueInCategory}`
        );
      }

      return hasValueInCategory;
    }

    toggleItemVisibility(item, show) {
      if (!item.element) return;

      const categoryElement = item.element;
      const elementType = item.isPercentage ? 'categoria-porcentagem' : 'categoria-ativo';

      if (show) {
        // Mostra o elemento
        categoryElement.style.display = '';
        categoryElement.style.opacity = '0';
        categoryElement.style.transform = 'translateY(10px)';

        // Animação de entrada
        setTimeout(() => {
          categoryElement.style.transition = `opacity ${this.config.animationDuration}ms ease, transform ${this.config.animationDuration}ms ease`;
          categoryElement.style.opacity = '1';
          categoryElement.style.transform = 'translateY(0)';
        }, 10);

        if (this.config.enableLogging) {
          console.log(`👁️ Showing ${elementType}: ${item.category}`);
        }
      } else {
        // Esconde o elemento
        categoryElement.style.transition = `opacity ${this.config.animationDuration}ms ease, transform ${this.config.animationDuration}ms ease`;
        categoryElement.style.opacity = '0';
        categoryElement.style.transform = 'translateY(-10px)';

        setTimeout(() => {
          categoryElement.style.display = 'none';
        }, this.config.animationDuration);

        if (this.config.enableLogging) {
          console.log(`🙈 Hiding ${elementType}: ${item.category}`);
        }
      }
    }

    updateContainerVisibility(show) {
      if (!this.listContainer) return;

      if (show) {
        this.listContainer.style.display = '';
      } else {
        this.listContainer.style.display = 'none';
      }
    }

    normalizeKey(category, product) {
      return `${category.toLowerCase().trim()}|${product.toLowerCase().trim()}`;
    }

    parseCurrencyValue(value) {
      if (!value) return 0;

      // Remove tudo exceto números, vírgulas e pontos
      const cleanValue = value.toString().replace(/[^\d,.]/g, '');

      // Converte vírgula para ponto se for o separador decimal
      const normalizedValue = cleanValue.replace(',', '.');

      return parseFloat(normalizedValue) || 0;
    }

    // Métodos públicos para controle externo
    refresh() {
      this.cacheListItems();
      this.updateVisibility();
    }

    getVisibleItems() {
      const visible = [];
      this.categoryItems.forEach((item) => {
        if (item.visible) {
          visible.push({
            category: item.category,
          });
        }
      });
      return visible;
    }

    enableDebug() {
      this.config.enableLogging = true;
    }

    disableDebug() {
      this.config.enableLogging = false;
    }
  }

  // Torna a classe globalmente disponível
  window.SelectedProductsList = SelectedProductsList;

  // Cria instância global
  window.ReinoSelectedProductsList = new SelectedProductsList();

  // Auto-inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoSelectedProductsList.init();
    });
  } else {
    window.ReinoSelectedProductsList.init();
  }
})();
