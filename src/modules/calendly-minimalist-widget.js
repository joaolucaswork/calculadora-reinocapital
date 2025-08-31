/**
 * Calendly Minimalist Widget
 * Custom minimalist implementation for small spaces
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class CalendlyMinimalistWidget {
    constructor(options = {}) {
      this.options = {
        calendlyUrl: 'https://calendly.com/tecnologia-reinocapital/30min',
        hideEventDetails: true,
        hideGdprBanner: true,
        minimalistMode: true,
        fullSize: true,
        theme: {
          primaryColor: '#006BFF',
          backgroundColor: '#ffffff',
          textColor: '#333333',
        },
        ...options,
      };

      this.isInitialized = false;
      this.widget = null;
      this.container = null;
      this.isVisible = false;
    }

    async init() {
      if (this.isInitialized) return;

      try {
        await this.waitForCalendlyScript();
        this.createMinimalistContainer();
        this.setupEventListeners();
        this.setupResponsiveHandling();
        this.isInitialized = true;
        console.log('✅ CalendlyMinimalistWidget: Initialized successfully');
      } catch (error) {
        console.error('CalendlyMinimalistWidget: Initialization failed:', error);
      }
    }

    async waitForCalendlyScript() {
      if (window.Calendly) return;

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Calendly script'));
        document.head.appendChild(script);
      });
    }

    createMinimalistContainer() {
      this.container = document.createElement('div');
      this.container.className = 'calendly-minimalist-container';
      this.container.style.cssText = `
        position: relative;
        width: 100%;
        height: auto;
        min-width: 280px;
        min-height: 400px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        background: ${this.options.theme.backgroundColor};
        display: block;
      `;

      this.createWidgetContent();
      this.initializeCalendlyWidget();
    }

    createWidgetContent() {
      this.widgetContent = document.createElement('div');
      this.widgetContent.className = 'calendly-minimalist-content';
      this.widgetContent.style.cssText = `
        width: 100%;
        height: 100%;
        position: relative;
      `;

      this.container.appendChild(this.widgetContent);
    }

    buildCalendlyUrl() {
      const url = new URL(this.options.calendlyUrl);

      if (this.options.hideEventDetails) {
        url.searchParams.set('hide_event_type_details', '1');
      }

      if (this.options.hideGdprBanner) {
        url.searchParams.set('hide_gdpr_banner', '1');
      }

      // Parâmetros necessários para o resize automático funcionar
      url.searchParams.set('embed_domain', window.location.hostname);
      url.searchParams.set('embed_type', 'Inline');

      return url.toString();
    }

    initializeCalendlyWidget() {
      if (!window.Calendly) {
        console.error('Calendly script not loaded');
        return;
      }

      const calendlyContainer = document.createElement('div');
      calendlyContainer.style.cssText = `
        width: 100%;
        height: 100%;
      `;

      this.widgetContent.appendChild(calendlyContainer);

      window.Calendly.initInlineWidget({
        url: this.buildCalendlyUrl(),
        parentElement: calendlyContainer,
        resize: true,
        prefill: this.getPrefillData(),
      });

      this.widget = calendlyContainer;
      this.isVisible = true;
    }

    getPrefillData() {
      const prefill = {};

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('name')) prefill.name = urlParams.get('name');
      if (urlParams.get('email')) prefill.email = urlParams.get('email');

      return prefill;
    }

    setupEventListeners() {
      window.addEventListener('message', (e) => {
        if (this.isCalendlyEvent(e)) {
          this.handleCalendlyEvent(e.data);
        }
      });
    }

    isCalendlyEvent(e) {
      return e.data.event && e.data.event.indexOf('calendly') === 0;
    }

    handleCalendlyEvent(data) {
      switch (data.event) {
        case 'calendly.invitee_scheduled':
          this.onEventScheduled(data.payload);
          break;
        case 'calendly.height_changed':
          this.adjustHeight(data.payload.height);
          break;
      }
    }

    onEventScheduled(payload) {
      document.dispatchEvent(
        new CustomEvent('calendlyEventScheduled', {
          detail: payload,
        })
      );
    }

    adjustHeight(height) {
      if (this.container && height && typeof height === 'number') {
        // Adiciona um pequeno padding para garantir que todo o conteúdo seja visível
        const adjustedHeight = height + 20;

        this.container.style.height = `${adjustedHeight}px`;

        // Também ajusta o container pai se necessário
        const parentElement = this.container.parentElement;
        if (parentElement && parentElement.style.height !== 'auto') {
          parentElement.style.height = `${adjustedHeight}px`;
        }

        console.log(`📏 Calendly height adjusted to: ${adjustedHeight}px`);

        // Dispara evento customizado para notificar sobre mudança de altura
        document.dispatchEvent(
          new CustomEvent('calendlyHeightChanged', {
            detail: { height: adjustedHeight, originalHeight: height },
          })
        );
      }
    }

    setupResponsiveHandling() {
      const style = document.createElement('style');
      style.textContent = `
        .calendly-minimalist-container {
          box-sizing: border-box;
          transition: height 0.3s ease;
        }

        .calendly-minimalist-content {
          box-sizing: border-box;
        }

        .calendly-minimalist-container iframe {
          width: 100% !important;
          border: none !important;
        }

        @media (max-width: 768px) {
          .calendly-minimalist-container {
            min-width: 280px !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    async attachTo(element) {
      const originalSelector = element;

      if (typeof element === 'string') {
        element = document.querySelector(element);
      }

      if (!element) {
        console.warn(`CalendlyMinimalistWidget: Target element not found: ${originalSelector}`);
        console.warn(
          'Available elements with data-calendly-widget:',
          document.querySelectorAll('[data-calendly-widget]')
        );
        return false;
      }

      // Check if already attached
      if (element.querySelector('.calendly-minimalist-container')) {
        console.warn('CalendlyMinimalistWidget: Already attached to this element');
        return false;
      }

      // Ensure widget is initialized before attaching
      if (!this.isInitialized || !this.container) {
        console.log('CalendlyMinimalistWidget: Initializing before attach...');
        await this.init();
      }

      // Double-check elements exist after initialization
      if (!this.container) {
        console.error('CalendlyMinimalistWidget: Failed to create DOM elements');
        return false;
      }

      element.appendChild(this.container);

      console.log('✅ CalendlyMinimalistWidget: Successfully attached to element');
      return true;
    }

    destroy() {
      if (this.container) {
        this.container.remove();
      }
      this.isInitialized = false;
      this.isVisible = false;
    }
  }

  window.CalendlyMinimalistWidget = CalendlyMinimalistWidget;

  window.ReinoCalendlyWidget = new CalendlyMinimalistWidget();

  // Use Webflow ready pattern for proper DOM initialization
  window.Webflow ||= [];
  window.Webflow.push(async () => {
    await window.ReinoCalendlyWidget.init();

    // Auto-attach to default container if it exists
    const defaultContainer = document.querySelector('[data-calendly-widget]');
    if (defaultContainer) {
      await window.ReinoCalendlyWidget.attachTo(defaultContainer);
    }
  });
})();
