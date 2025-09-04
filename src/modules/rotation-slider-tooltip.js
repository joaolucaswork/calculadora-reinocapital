/**
 * Rotation Slider Tooltip Module
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class RotationSliderTooltip {
    constructor() {
      this.tooltipInstance = null;
      this.isInitialized = false;
      this.currentIndex = 2;

      this.init();
    }

    async init() {
      try {
        await this.waitForDependencies();
        this.setupTooltip();
        this.setupProductSelectionListener();
        this.isInitialized = true;
      } catch (error) {
        console.error('❌ Rotation Slider Tooltip initialization failed:', error);
      }
    }

    async waitForDependencies() {
      let attempts = 0;
      const maxAttempts = 100;

      while (!window.tippy && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.tippy) {
        throw new Error('Tippy.js not loaded');
      }

      attempts = 0;
      while (!document.querySelector('#indice-giro [data-thumb]') && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      attempts = 0;
      while (!window.ReinoRotationIndexController && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
    }

    setupTooltip() {
      const sliderThumb = document.querySelector('#indice-giro [data-thumb]');

      if (!sliderThumb) {
        console.error('Slider thumb not found');
        return;
      }

      if (sliderThumb._tippy) {
        sliderThumb._tippy.destroy();
      }

      this.tooltipInstance = window.tippy(sliderThumb, {
        content: () => this.generateTooltipContent(),
        theme: 'light',
        placement: 'bottom',
        arrow: true,
        interactive: true,
        allowHTML: true,
        maxWidth: 320,
        delay: [200, 0],
        duration: [300, 200],
        animation: 'fade',
        trigger: 'mouseenter focus',
        hideOnClick: false,
        interactiveBorder: 20,
        interactiveDebounce: 50,
        appendTo: () => document.body,
        flip: false,
        flipOnUpdate: false,
        onShow: () => {
          this.updateCurrentData();
          this.setupSliderListener();
        },
      });
    }

    setupSliderListener() {
      const slider = document.querySelector('#indice-giro');
      if (slider && !slider._rotationTooltipListenerAdded) {
        const updateTooltip = () => {
          if (this.tooltipInstance && this.tooltipInstance.state.isVisible) {
            this.updateCurrentData();
            this.tooltipInstance.setContent(this.generateTooltipContent());
            this.updateNiveisOpacity();
          }
        };

        slider.addEventListener('input', updateTooltip);
        slider.addEventListener('change', updateTooltip);
        slider._rotationTooltipListenerAdded = true;
      }
    }

    setupProductSelectionListener() {
      // Não é mais necessário monitorar produtos selecionados
      // O tooltip agora mostra apenas os níveis interativos
    }

    updateCurrentData() {
      const slider = document.querySelector('#indice-giro');
      this.currentIndex = slider ? parseInt(slider.value, 10) || 2 : 2;
    }

    generateTooltipContent() {
      this.updateCurrentData();

      const formulaExplanation = this.getFormulaExplanation();

      return `
        <div style="padding: 12px; line-height: 1.4; font-family: 'Satoshi Variable', sans-serif;">
          <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #111827;">
            Índice de giro
          </h4>
          ${formulaExplanation}
        </div>
      `;
    }

    getFormulaExplanation() {
      const currentLevel = this.currentIndex;

      return `
        <div style="font-weight: 500; color: #6B7280; line-height: 1.4; margin-top: 12px;" id="niveis-container">
          <div class="nivel-item" data-nivel="1" style="margin-bottom: 8px; opacity: ${currentLevel === 1 ? '1' : '0.4'}; transition: opacity 0.3s ease;">
            <strong style="color: #374151; font-size: 0.84375rem;">Nível 1</strong><br>
            <span style="font-size: 0.8125rem;">Leva todos os ativos até o vencimento e jamais movimenta a carteira.</span>
          </div>
          <div class="nivel-item" data-nivel="2" style="margin-bottom: 8px; opacity: ${currentLevel === 2 ? '1' : '0.4'}; transition: opacity 0.3s ease;">
            <strong style="color: #374151; font-size: 0.84375rem;">Nível 2 — Padrão</strong><br>
            <span style="font-size: 0.8125rem;">Movimenta poucos ativos na carteira antes do prazo de vencimento — este é o padrão adotado nos nossos cálculos.</span>
          </div>
          <div class="nivel-item" data-nivel="3" style="margin-bottom: 8px; opacity: ${currentLevel === 3 ? '1' : '0.4'}; transition: opacity 0.3s ease;">
            <strong style="color: #374151; font-size: 0.84375rem;">Nível 3</strong><br>
            <span style="font-size: 0.8125rem;">Rebalanceia a maior parte da carteira pelo menos uma vez ao ano.</span>
          </div>
          <div class="nivel-item" data-nivel="4" style="margin-bottom: 0; opacity: ${currentLevel === 4 ? '1' : '0.4'}; transition: opacity 0.3s ease;">
            <strong style="color: #374151; font-size: 0.84375rem;">Nível 4</strong><br>
            <span style="font-size: 0.8125rem;">Alta recorrência — operações frequentes ao longo do ano, com maior rotação de ativos.</span>
          </div>
        </div>
      `;
    }

    updateTooltipContent() {
      if (this.tooltipInstance && this.tooltipInstance.state.isVisible) {
        this.updateCurrentData();
        this.tooltipInstance.setContent(this.generateTooltipContent());
        this.updateNiveisOpacity();
      }
    }

    updateNiveisOpacity() {
      if (!this.tooltipInstance || !this.tooltipInstance.state.isVisible) return;

      const container = document.querySelector('#niveis-container');
      if (!container) return;

      const niveisItems = container.querySelectorAll('.nivel-item');
      const currentLevel = this.currentIndex;

      niveisItems.forEach((item) => {
        const nivel = parseInt(item.getAttribute('data-nivel'), 10);
        const opacity = nivel === currentLevel ? '1' : '0.4';
        item.style.opacity = opacity;
      });
    }

    destroy() {
      if (this.tooltipInstance) {
        this.tooltipInstance.destroy();
        this.tooltipInstance = null;
      }
      this.isInitialized = false;
    }
  }

  window.RotationSliderTooltip = RotationSliderTooltip;

  if (!window.rotationSliderTooltipInstance) {
    window.rotationSliderTooltipInstance = new RotationSliderTooltip();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (!window.rotationSliderTooltipInstance.isInitialized) {
          window.rotationSliderTooltipInstance.init();
        }
      });
    } else {
      if (!window.rotationSliderTooltipInstance.isInitialized) {
        window.rotationSliderTooltipInstance.init();
      }
    }
  }
})();
