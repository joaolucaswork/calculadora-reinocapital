(function () {
  'use strict';

  class SendButtonTooltip {
    constructor(options = {}) {
      this.options = {
        theme: 'light',
        placement: 'top',
        arrow: true,
        interactive: false,
        allowHTML: true,
        maxWidth: 280,
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
        console.error('SendButtonTooltip: Initialization failed:', error);
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

      this.setupSendButtonTooltip();
      this.observeNewElements();
    }

    setupSendButtonTooltip() {
      const sendButtons = document.querySelectorAll('[element-function="send"]');

      sendButtons.forEach((button) => {
        if (this.instances.has(button)) {
          return;
        }

        this.createTooltipWrapper(button);
      });
    }

    createTooltipWrapper(button) {
      if (!button.parentNode) {
        console.warn('Send button has no parent node, skipping tooltip creation');
        return;
      }

      if (
        button.parentElement &&
        button.parentElement.classList.contains('send-button-tooltip-wrapper')
      ) {
        return;
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'send-button-tooltip-wrapper';

      button.parentNode.insertBefore(wrapper, button);
      wrapper.appendChild(button);

      const tooltipContent = this.getSendButtonContent();

      const instance = window.tippy(wrapper, {
        content: tooltipContent,
        theme: this.options.theme,
        placement: this.options.placement,
        arrow: this.options.arrow,
        interactive: this.options.interactive,
        allowHTML: this.options.allowHTML,
        maxWidth: 280,
        delay: this.options.delay,
        duration: this.options.duration,
        animation: this.options.animation,
        trigger: 'mouseenter focus',
        hideOnClick: false,
        followCursor: 'horizontal',
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

    getSendButtonContent() {
      return `
        <div style="padding: 12px 12px; line-height: 1.4; font-family: 'Satoshi Variable', Arial, sans-serif;">
          <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #111827;">
            O que você vai receber
          </h4>

          <div style="margin-bottom: 14px;">
            <div style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px;">
              Relatório personalizado com:
            </div>
            <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #6b7280; line-height: 1.4;">
              <li style="margin-bottom: 8px; font-weight: 500;">Análise detalhada das suas taxas no modelo tradicional</li>
              <li style="margin-bottom: 8px; font-weight: 500;">Gráfico interativo com breakdown por categoria</li>
              <li style="margin-bottom: 8px; font-weight: 500;">Cálculo de comissões anuais estimadas</li>
              <li style="font-weight: 500;">Slider de índice de giro personalizável</li>
            </ul>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
            <h5 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #111827;">
              Você precisará informar:
            </h5>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              <span style="background: #f3f4f6; padding: 3px 6px; border-radius: 3px; font-size: 11px; color: #374151; font-weight: 500;">
                Nome completo
              </span>
              <span style="background: #f3f4f6; padding: 3px 6px; border-radius: 3px; font-size: 11px; color: #374151; font-weight: 500;">
                E-mail
              </span>
              <span style="background: #f3f4f6; padding: 3px 6px; border-radius: 3px; font-size: 11px; color: #374151; font-weight: 500;">
                Telefone
              </span>
            </div>
            <div style="margin-top: 6px; font-size: 11px; color: #6b7280; font-style: italic;">
              Processo rápido e seguro
            </div>
          </div>
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
                if (
                  node.hasAttribute &&
                  node.hasAttribute('element-function') &&
                  node.getAttribute('element-function') === 'send'
                ) {
                  this.setupSingleTooltip(node);
                } else {
                  const sendButtons =
                    node.querySelectorAll && node.querySelectorAll('[element-function="send"]');
                  if (sendButtons) {
                    sendButtons.forEach((button) => this.setupSingleTooltip(button));
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

      this.createTooltipWrapper(button);
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

      this.instances.forEach((instance) => {
        instance.destroy();
      });
      this.instances.clear();

      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      this.isDestroyed = true;
      this.isInitialized = false;
    }

    getStatus() {
      return {
        initialized: this.isInitialized,
        destroyed: this.isDestroyed,
        instanceCount: this.instances.size,
        hasObserver: !!this.observer,
      };
    }
  }

  window.SendButtonTooltip = SendButtonTooltip;

  window.ReinoSendButtonTooltip = new SendButtonTooltip();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!window.ReinoSendButtonTooltip.isInitialized) {
        window.ReinoSendButtonTooltip.init();
      }
    });
  } else {
    if (!window.ReinoSendButtonTooltip.isInitialized) {
      window.ReinoSendButtonTooltip.init();
    }
  }
})();
