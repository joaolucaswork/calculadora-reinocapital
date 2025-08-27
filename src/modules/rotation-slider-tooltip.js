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
      this.selectedProduct = null;
      this.selectedValue = 0;
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
        placement: 'top',
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
      const observer = new MutationObserver(() => {
        if (this.tooltipInstance && this.tooltipInstance.state.isVisible) {
          this.updateSelectedProduct();
          this.tooltipInstance.setContent(this.generateTooltipContent());
        }
      });

      const patrimonioContainer = document.querySelector('.patrimonio_interactive_container');
      if (patrimonioContainer) {
        observer.observe(patrimonioContainer, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['value'],
        });
      }

      document.addEventListener('input', (e) => {
        if (
          e.target.classList.contains('currency-input') &&
          e.target.classList.contains('individual')
        ) {
          if (this.tooltipInstance && this.tooltipInstance.state.isVisible) {
            this.updateSelectedProduct();
            this.tooltipInstance.setContent(this.generateTooltipContent());
          }
        }
      });
    }

    updateCurrentData() {
      const slider = document.querySelector('#indice-giro');
      this.currentIndex = slider ? parseInt(slider.value, 10) || 2 : 2;
      this.updateSelectedProduct();
    }

    updateSelectedProduct() {
      const patrimonioItems = document.querySelectorAll('.patrimonio_interactive_item');
      const selectedProducts = [];

      patrimonioItems.forEach((item) => {
        const input = item.querySelector('.currency-input.individual');
        const category = item.getAttribute('ativo-category');
        const product = item.getAttribute('ativo-product');

        if (input && input.value) {
          const value = parseFloat(input.value.replace(/[^\d,]/g, '').replace(',', '.'));
          if (value > 0) {
            selectedProducts.push({
              category,
              product,
              value,
              element: item,
            });
          }
        }
      });

      if (selectedProducts.length === 0) {
        this.selectedProduct = { category: 'Renda Fixa', product: 'CDB', value: 100000 };
      } else {
        selectedProducts.sort((a, b) => b.value - a.value);
        this.selectedProduct = selectedProducts[0];
      }

      this.selectedValue = this.selectedProduct.value;
    }

    generateTooltipContent() {
      this.updateCurrentData();

      if (!this.selectedProduct) {
        return `
          <div style="padding: 12px; line-height: 1.4; font-family: 'Satoshi Variable, Arial, sans-serif';">
            <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #111827;">
              Índice de giro
            </h4>
            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 500; color: #374151;">
              Maior índice = maior custo de corretagem
            </p>
            <p style="margin: 0; font-size: 13px; font-weight: 400; color: #6B7280;">
              Selecione um produto para ver o exemplo de cálculo
            </p>
          </div>
        `;
      }

      const calculationExample = this.generateCalculationExample();
      const formulaExplanation = this.getFormulaExplanation();

      return `
        <div style="padding: 12px; line-height: 1.4; font-family: 'Satoshi Variable', sans-serif;">
          <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #111827;">
            Índice de giro
          </h4>
          ${calculationExample}
          ${formulaExplanation}
        </div>
      `;
    }

    generateCalculationExample() {
      if (!this.selectedProduct) {
        return '<p style="margin: 0; font-size: 12px; color: #6B7280;">Selecione um produto para ver o cálculo</p>';
      }

      const rotationController = window.ReinoRotationIndexController;

      if (!rotationController) {
        return '<p style="margin: 0; font-size: 12px; color: #EF4444;">Sistema de cálculo não disponível</p>';
      }

      const productKey = `${this.selectedProduct.category}:${this.selectedProduct.product}`;
      const productData = rotationController.getProductData(productKey);

      if (!productData) {
        return '<p style="margin: 0; font-size: 12px; color: #EF4444;">Dados do produto não encontrados</p>';
      }

      const calcIndex1 = this.calculateCommissionForIndex(productData, 1);
      const calcCurrentIndex = this.calculateCommissionForIndex(productData, this.currentIndex);

      const costIndex1 = this.selectedValue * calcIndex1.comissaoRate;
      const costCurrentIndex = this.selectedValue * calcCurrentIndex.comissaoRate;
      const difference = costCurrentIndex - costIndex1;
      const percentChange = costIndex1 > 0 ? ((difference / costIndex1) * 100).toFixed(1) : '0';

      const formatValue = (value) => {
        return value.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
      };

      return `
        <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 6px; padding: 8px; margin-bottom: 8px;">
          <div style="margin-bottom: 4px; font-size: 12px; font-weight: 600; color: #6B7280;">
            ${this.selectedProduct.product} - ${formatValue(this.selectedValue)}
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 13px; font-weight: 400; color: #6B7280;">Índice 1:</span>
            <span style="font-size: 13px; font-weight: 500; color: #111827;">
              ${formatValue(costIndex1)}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-size: 13px; font-weight: 400; color: #6B7280;">Índice ${this.currentIndex}:</span>
            <span style="font-size: 13px; font-weight: 600; color: ${difference >= 0 ? '#EF4444' : '#10B981'};">
              ${formatValue(costCurrentIndex)} (${difference >= 0 ? '+' : ''}${percentChange}%)
            </span>
          </div>
        </div>
      `;
    }

    getFormulaExplanation() {
      const currentLevel = this.currentIndex;

      return `
        <div style="font-weight: 500; color: #6B7280; line-height: 1.4; margin-top: 12px;" id="niveis-container">
          <div class="nivel-item" data-nivel="1" style="margin-bottom: 8px; opacity: ${currentLevel === 1 ? '1' : '0.4'}; transition: opacity 0.3s ease;">
            <strong style="color: #374151; font-size: 13px;">Nível 1</strong><br>
            <span style="font-size: 12px;">Leva os ativos até o vencimento — não há movimentações na carteira ao longo do ano.</span>
          </div>
          <div class="nivel-item" data-nivel="2" style="margin-bottom: 8px; opacity: ${currentLevel === 2 ? '1' : '0.4'}; transition: opacity 0.3s ease;">
            <strong style="color: #374151; font-size: 13px;">Nível 2 — Padrão</strong><br>
            <span style="font-size: 12px;">Movimenta a carteira uma vez por ano — este é o padrão adotado nos nossos cálculos.</span>
          </div>
          <div class="nivel-item" data-nivel="3" style="margin-bottom: 8px; opacity: ${currentLevel === 3 ? '1' : '0.4'}; transition: opacity 0.3s ease;">
            <strong style="color: #374151; font-size: 13px;">Nível 3</strong><br>
            <span style="font-size: 12px;">Rebalanceia a cada 6 meses — duas janelas de movimentação dentro do ano.</span>
          </div>
          <div class="nivel-item" data-nivel="4" style="margin-bottom: 0; opacity: ${currentLevel === 4 ? '1' : '0.4'}; transition: opacity 0.3s ease;">
            <strong style="color: #374151; font-size: 13px;">Nível 4</strong><br>
            <span style="font-size: 12px;">Alta recorrência — operações frequentes ao longo do ano, com maior rotação de ativos.</span>
          </div>
        </div>
      `;
    }

    calculateCommissionForIndex(productData, index) {
      const { mediaCorretagem, prazoMedioAnos, fatorGiro, fixed } = productData;
      const indiceGiro = fixed ? 1 : index;
      const comissaoRate = (mediaCorretagem / prazoMedioAnos) * fatorGiro * indiceGiro;

      return {
        comissaoRate: comissaoRate,
        comissaoPercent: comissaoRate * 100,
        fatorEfetivo: fatorGiro * indiceGiro,
      };
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
