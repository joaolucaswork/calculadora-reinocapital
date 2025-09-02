/**
 * Detalhes Cálculo Tooltip Module
 * Versão sem imports/exports para uso direto no Webflow
 * Implementa tooltips para elementos .detalhes-calculo-geral
 */

(function () {
  'use strict';

  class DetalhesCalculoTooltip {
    constructor(options = {}) {
      this.options = {
        theme: 'light',
        placement: 'bottom',
        arrow: true,
        interactive: false,
        allowHTML: true,
        maxWidth: 320,
        delay: [300, 100],
        duration: [200, 150],
        animation: 'fade',
        flip: false,
        flipOnUpdate: false,
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
        console.error('DetalhesCalculoTooltip: Initialization failed:', error);
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

      this.setupDetalhesCalculoTooltip();
      this.observeNewElements();
    }

    setupDetalhesCalculoTooltip() {
      const detalhesButtons = document.querySelectorAll('.detalhes-calculo-geral');

      detalhesButtons.forEach((button) => {
        if (this.instances.has(button)) {
          return;
        }

        const tooltipContent = this.getDetalhesCalculoContent();

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
          hideOnClick: false,
          flip: this.options.flip,
          flipOnUpdate: this.options.flipOnUpdate,
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

    getDetalhesCalculoContent() {
      return `
        <div style="padding: 12px; line-height: 1.5; font-family: 'Satoshi Variable', Arial, sans-serif;">
          <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #111827;">
            Como calculamos a média de comissão anual?
          </h4>

          <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 500; color: #374151;">
            Para estimar o que o mercado costuma cobrar, consideramos uma <strong>média de corretagem</strong> por produto e aplicamos um fator de rotação compatível com o seu perfil.
          </p>

          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #374151;">
            <li style="margin-bottom: 12px;">
              <div style="margin-bottom: 6px;">
                <strong>Fórmula base (em %):</strong>
              </div>
              <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 12px; font-weight: 500; color: #1f2937;">
                Comissão % = (Média de Corretagem ÷ Prazo Médio) × Fator de Giro.
              </div>
            </li>
            <li style="margin-bottom: 8px; font-weight: 500;">
              <strong>Premissas:</strong> usamos faixas de mercado, prazos médios representativos por produto e o <strong>nível 2</strong> como referência padrão.
            </li>
            <li style="margin-bottom: 0; font-weight: 500;">
              <strong>Comissão estimada (R$):</strong> Valor investido × Comissão %.
            </li>
          </ul>
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
                if (node.classList && node.classList.contains('detalhes-calculo-geral')) {
                  this.setupSingleTooltip(node);
                } else {
                  const detalhesButtons =
                    node.querySelectorAll && node.querySelectorAll('.detalhes-calculo-geral');
                  if (detalhesButtons) {
                    detalhesButtons.forEach((button) => this.setupSingleTooltip(button));
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

      const tooltipContent = this.getDetalhesCalculoContent();

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
        hideOnClick: false,
        flip: this.options.flip,
        flipOnUpdate: this.options.flipOnUpdate,
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
          console.warn('DetalhesCalculoTooltip: Error destroying instance:', error);
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

  window.DetalhesCalculoTooltip = DetalhesCalculoTooltip;

  window.detalhesCalculoTooltipInstance = new DetalhesCalculoTooltip();
})();
