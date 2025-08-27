/**
 * Tippy.js Tooltip Module
 * Versão sem imports/exports para uso direto no Webflow
 * Implementa tooltips usando Tippy.js para botões de ajuda
 */

(function () {
  'use strict';

  class TippyTooltipModule {
    constructor(options = {}) {
      this.options = {
        theme: 'light', // Sem tema para usar nosso HTML customizado
        placement: 'top',
        arrow: true,
        interactive: false,
        allowHTML: true,
        maxWidth: 280, // Largura otimizada para melhor legibilidade
        delay: [300, 100],
        duration: [200, 150],
        animation: 'fade',
        ...options,
      };

      this.instances = new Map();
      this.isInitialized = false;
      this.isDestroyed = false;

      this.init();
    }

    async init() {
      if (this.isInitialized || this.isDestroyed) return;

      try {
        await this.waitForDependencies();
        this.setupTooltips();
        this.isInitialized = true;
      } catch (error) {
        console.error('TippyTooltipModule: Initialization failed:', error);
      }
    }

    async waitForDependencies() {
      let attempts = 0;
      const maxAttempts = 50;

      while (!window.tippy && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.tippy) {
        throw new Error('Tippy.js library not found. Please include Tippy.js CDN scripts.');
      }
    }

    setupTooltips() {
      if (this.isDestroyed) return;

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.initializeTooltips();
        });
      } else {
        this.initializeTooltips();
      }
    }

    initializeTooltips() {
      if (this.isDestroyed) return;

      this.setupAjudaBotaoTooltip();
      this.observeNewElements();
    }

    setupAjudaBotaoTooltip() {
      const ajudaBotoes = document.querySelectorAll('.ajuda-botao');

      ajudaBotoes.forEach((button) => {
        if (this.instances.has(button)) {
          return;
        }

        const tooltipContent = this.getIndiceGiroContent();

        const instance = window.tippy(button, {
          content: tooltipContent,
          theme: this.options.theme,
          placement: this.options.placement,
          arrow: this.options.arrow,
          interactive: this.options.interactive,
          allowHTML: this.options.allowHTML,
          maxWidth: this.options.maxWidth,
          delay: this.options.delay,
          duration: this.options.duration,
          animation: this.options.animation,
          trigger: 'mouseenter focus',
          hideOnClick: true,
          appendTo: () => document.body,
          onCreate: (tippyInstance) => {
            this.instances.set(button, tippyInstance);
          },
          onDestroy: (tippyInstance) => {
            this.instances.delete(button);
          },
        });

        if (instance) {
          this.instances.set(button, instance);
        }
      });
    }

    getIndiceGiroContent() {
      return `
        <div style="padding: 12px; line-height: 1.5;">
          <p style="font-weight: 500; margin: 0; font-size: 14px; color: #374151;">
           É um indicador que aproxima o quanto a sua carteira é movimentada ao longo do tempo.
            <br><br>
            Usamos esse índice para estimar a média de comissão anual cobrada em diferentes cenários de rotação de ativos.

          </p>
        </div>
      `;
    }

    observeNewElements() {
      if (this.isDestroyed || !window.MutationObserver) return;

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.classList && node.classList.contains('ajuda-botao')) {
                  this.setupSingleTooltip(node);
                } else {
                  const ajudaBotoes =
                    node.querySelectorAll && node.querySelectorAll('.ajuda-botao');
                  if (ajudaBotoes) {
                    ajudaBotoes.forEach((button) => this.setupSingleTooltip(button));
                  }
                }
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      this.observer = observer;
    }

    setupSingleTooltip(button) {
      if (this.isDestroyed || this.instances.has(button)) return;

      const tooltipContent = this.getIndiceGiroContent();

      const instance = window.tippy(button, {
        content: tooltipContent,
        theme: this.options.theme,
        placement: this.options.placement,
        arrow: this.options.arrow,
        interactive: this.options.interactive,
        allowHTML: this.options.allowHTML,
        maxWidth: this.options.maxWidth,
        delay: this.options.delay,
        duration: this.options.duration,
        animation: this.options.animation,
        trigger: 'mouseenter focus',
        hideOnClick: true,
        appendTo: () => document.body,
        onCreate: (tippyInstance) => {
          this.instances.set(button, tippyInstance);
        },
        onDestroy: (tippyInstance) => {
          this.instances.delete(button);
        },
      });

      if (instance) {
        this.instances.set(button, instance);
      }
    }

    updateTooltipContent(selector, newContent) {
      if (this.isDestroyed) return;

      const elements =
        typeof selector === 'string' ? document.querySelectorAll(selector) : [selector];

      elements.forEach((element) => {
        const instance = this.instances.get(element);
        if (instance) {
          instance.setContent(newContent);
        }
      });
    }

    destroyTooltip(selector) {
      if (this.isDestroyed) return;

      const elements =
        typeof selector === 'string' ? document.querySelectorAll(selector) : [selector];

      elements.forEach((element) => {
        const instance = this.instances.get(element);
        if (instance) {
          instance.destroy();
          this.instances.delete(element);
        }
      });
    }

    destroy() {
      if (this.isDestroyed) return;

      this.instances.forEach((instance, element) => {
        try {
          instance.destroy();
        } catch (error) {
          console.warn('TippyTooltipModule: Error destroying instance:', error);
        }
      });

      this.instances.clear();

      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      this.isDestroyed = true;
      this.isInitialized = false;
    }
  }

  window.TippyTooltipModule = TippyTooltipModule;

  window.tippyTooltipInstance = new TippyTooltipModule();
})();
