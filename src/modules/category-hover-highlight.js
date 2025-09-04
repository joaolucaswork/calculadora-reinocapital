/**
 * Category Hover Highlight Module
 * Versão sem imports/exports para uso direto no Webflow
 * Destaca patrimonio_interactive_item baseado no hover de categoria-porcentagem
 */

(function () {
  'use strict';

  class CategoryHoverHighlight {
    constructor() {
      this.isInitialized = false;
      this.categoryTriggers = [];
      this.patrimonioItems = [];
      this.isHovering = false;
      this.currentCategory = null;

      // Configuração
      this.config = {
        enableLogging: false,
        highlightOpacity: 1.0,
        dimOpacity: 0.4,
        transitionDuration: 150, // Reduzido para ser mais responsivo
      };
    }

    init() {
      if (this.isInitialized) return;

      try {
        this.cacheCategoryTriggers();
        this.cachePatrimonioItems();
        this.setupEventListeners();
        this.isInitialized = true;

        if (this.config.enableLogging) {
          console.log('✅ Category Hover Highlight initialized');
        }

        document.dispatchEvent(new CustomEvent('categoryHoverHighlightReady'));
      } catch (error) {
        console.error('❌ Failed to initialize Category Hover Highlight:', error);
      }
    }

    cacheCategoryTriggers() {
      // Busca todos os elementos categoria-porcentagem com atributo ativo-category
      const triggers = document.querySelectorAll('.categoria-porcentagem[ativo-category]');

      this.categoryTriggers = [];

      triggers.forEach((trigger) => {
        const category = trigger.getAttribute('ativo-category');

        if (category) {
          this.categoryTriggers.push({
            element: trigger,
            category: category,
          });

          if (this.config.enableLogging) {
            console.log(`🎯 Cached trigger: ${category}`);
          }
        }
      });

      if (this.config.enableLogging) {
        console.log(`🎯 Cached ${this.categoryTriggers.length} category triggers`);
      }
    }

    cachePatrimonioItems() {
      // Busca todos os elementos patrimonio_interactive_item com atributo ativo-category
      const patrimonioItems = document.querySelectorAll(
        '.patrimonio_interactive_item[ativo-category]'
      );

      // Busca todos os elementos categoria-ativo.v2 com atributo ativo-category
      const categoriaItems = document.querySelectorAll('.categoria-ativo.v2[ativo-category]');

      this.patrimonioItems = [];

      // Adiciona patrimonio items
      patrimonioItems.forEach((item) => {
        const category = item.getAttribute('ativo-category');

        if (category) {
          this.patrimonioItems.push({
            element: item,
            category: category,
            type: 'patrimonio',
            originalOpacity: window.getComputedStyle(item).opacity || '1',
          });

          if (this.config.enableLogging) {
            console.log(`💼 Cached patrimonio item: ${category}`);
          }
        }
      });

      // Adiciona categoria items (exceto os triggers)
      categoriaItems.forEach((item) => {
        const category = item.getAttribute('ativo-category');

        if (category) {
          this.patrimonioItems.push({
            element: item,
            category: category,
            type: 'categoria',
            originalOpacity: window.getComputedStyle(item).opacity || '1',
          });

          if (this.config.enableLogging) {
            console.log(`📂 Cached categoria item: ${category}`);
          }
        }
      });

      if (this.config.enableLogging) {
        console.log(`💼 Cached ${this.patrimonioItems.length} total items`);
      }
    }

    setupEventListeners() {
      this.categoryTriggers.forEach((trigger) => {
        // Mouse enter
        trigger.element.addEventListener('mouseenter', () => {
          this.handleCategoryHover(trigger.category);
        });

        // Mouse leave
        trigger.element.addEventListener('mouseleave', () => {
          this.handleCategoryHoverEnd();
        });
      });

      // Re-cache items quando o DOM muda
      document.addEventListener('DOMContentLoaded', () => {
        this.refresh();
      });

      if (this.config.enableLogging) {
        console.log('👂 Event listeners setup complete');
      }
    }

    handleCategoryHover(category) {
      this.isHovering = true;
      this.currentCategory = category;

      if (this.config.enableLogging) {
        console.log(`🔍 Hovering category: ${category}`);
      }

      // Aplica imediatamente sem requestAnimationFrame
      this.updatePatrimonioOpacity(category);

      // Dispara evento para outros módulos
      document.dispatchEvent(
        new CustomEvent('categoryHoverStart', {
          detail: { category: category },
        })
      );
    }

    handleCategoryHoverEnd() {
      if (!this.isHovering) return;

      this.isHovering = false;
      const previousCategory = this.currentCategory;
      this.currentCategory = null;

      if (this.config.enableLogging) {
        console.log(`🔍 Hover ended for category: ${previousCategory}`);
      }

      // Reset imediatamente sem requestAnimationFrame
      this.resetPatrimonioOpacity();

      // Dispara evento para outros módulos
      document.dispatchEvent(
        new CustomEvent('categoryHoverEnd', {
          detail: { category: previousCategory },
        })
      );
    }

    updatePatrimonioOpacity(targetCategory) {
      // Encontra o elemento trigger atual
      const currentTrigger = this.categoryTriggers.find(
        (trigger) => trigger.category === targetCategory
      );

      this.patrimonioItems.forEach((item) => {
        // Não aplica efeito no próprio elemento que está sendo hovered
        if (currentTrigger && item.element === currentTrigger.element) {
          return;
        }

        const isTargetCategory = item.category === targetCategory;
        const opacity = isTargetCategory ? this.config.highlightOpacity : this.config.dimOpacity;

        // Garante que a transição está ativa
        item.element.style.transition = `opacity ${this.config.transitionDuration}ms ease-out`;

        // Força reflow para garantir que a transição seja aplicada
        void item.element.offsetHeight;

        // Aplica a opacidade
        item.element.style.opacity = opacity;

        // Adiciona classes para CSS adicional se necessário
        if (isTargetCategory) {
          item.element.classList.add('category-highlighted');
          item.element.classList.remove('category-dimmed');
        } else {
          item.element.classList.add('category-dimmed');
          item.element.classList.remove('category-highlighted');
        }
      });
    }

    resetPatrimonioOpacity() {
      this.patrimonioItems.forEach((item) => {
        // Remove transição para reset instantâneo
        item.element.style.transition = 'none';
        item.element.style.opacity = '';

        // Remove classes imediatamente
        item.element.classList.remove('category-highlighted', 'category-dimmed');
      });

      // Reaplica transição após um frame para próximos hovers
      setTimeout(() => {
        this.patrimonioItems.forEach((item) => {
          item.element.style.transition = `opacity ${this.config.transitionDuration}ms ease-out`;
        });
      }, 16); // Um frame (~16ms)
    }

    // Métodos públicos para controle externo
    refresh() {
      this.cacheCategoryTriggers();
      this.cachePatrimonioItems();
      this.setupEventListeners();
    }

    highlightCategory(category) {
      this.handleCategoryHover(category);
    }

    clearHighlight() {
      this.handleCategoryHoverEnd();
    }

    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
    }

    enableDebug() {
      this.config.enableLogging = true;
    }

    disableDebug() {
      this.config.enableLogging = false;
    }

    getState() {
      return {
        isHovering: this.isHovering,
        currentCategory: this.currentCategory,
        triggersCount: this.categoryTriggers.length,
        itemsCount: this.patrimonioItems.length,
      };
    }
  }

  // Torna a classe globalmente disponível
  window.CategoryHoverHighlight = CategoryHoverHighlight;

  // Cria instância global
  window.ReinoCategoryHoverHighlight = new CategoryHoverHighlight();

  // Auto-inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoCategoryHoverHighlight.init();
    });
  } else {
    window.ReinoCategoryHoverHighlight.init();
  }
})();
