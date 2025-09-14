(function () {
  'use strict';

  class D3DonutChartSection5System {
    constructor() {
      this.isInitialized = false;
      this.charts = new Map();
      this.colorScale = null;
      this.categoryColors = {
        'Renda Fixa': '#a2883b',
        'Fundo de Investimento': '#e3ad0c',
        'Renda Variável': '#5d4e2a',
        Internacional: '#bdaa6f',
        COE: '#d17d00',
        Previdência: '#8c5e00',
        Outro: '#4f4f4f',
        Outros: '#4f4f4f',
      };

      this.hoverModule = null;

      this.currentPinnedSliceData = null;
      this.currentChart = null;

      this.hasPlayedEntranceAnimation = false;
      this.currentStep = -1;

      this.setupColorScale();
    }

    async init() {
      if (this.isInitialized) {
        return;
      }

      try {
        await this.loadD3();
        this.addTooltipScrollbarStyles();
        this.initializeEnhancedHover();
        this.setupEventListeners();
        this.initializeCharts();
        this.isInitialized = true;

        document.dispatchEvent(new CustomEvent('donutChartSection5Ready'));
      } catch (error) {
        console.error('Failed to initialize D3DonutChartSection5System:', error);
      }
    }

    addTooltipScrollbarStyles() {
      if (!document.getElementById('tooltip-scrollbar-styles')) {
        const style = document.createElement('style');
        style.id = 'tooltip-scrollbar-styles';
        style.textContent = `

          .d3-donut-tooltip-section5 div[style*="overflow-y: auto"] {
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
            scroll-behavior: smooth;
          }

          .d3-donut-tooltip-section5 div[style*="overflow-y: auto"]::-webkit-scrollbar {
            width: 8px;
            background: transparent;
          }

          .d3-donut-tooltip-section5 div[style*="overflow-y: auto"]::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 10px;
            margin: 15px 0;
          }

          .d3-donut-tooltip-section5 div[style*="overflow-y: auto"]::-webkit-scrollbar-thumb {
            background: linear-gradient(
              180deg,
              rgba(0, 0, 0, 0.15) 0%,
              rgba(0, 0, 0, 0.25) 50%,
              rgba(0, 0, 0, 0.15) 100%
            );
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .d3-donut-tooltip-section5 div[style*="overflow-y: auto"]::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(
              180deg,
              rgba(0, 0, 0, 0.25) 0%,
              rgba(0, 0, 0, 0.35) 50%,
              rgba(0, 0, 0, 0.25) 100%
            );
            border-color: rgba(255, 255, 255, 0.2);
            transform: scaleX(1.2);
          }

          .d3-donut-tooltip-section5 div[style*="overflow-y: auto"]::-webkit-scrollbar-thumb:active {
            background: linear-gradient(
              180deg,
              rgba(0, 0, 0, 0.3) 0%,
              rgba(0, 0, 0, 0.4) 50%,
              rgba(0, 0, 0, 0.3) 100%
            );
          }

          .d3-donut-tooltip-section5 div[style*="overflow-y: auto"]::-webkit-scrollbar-corner {
            background: transparent;
          }

          .d3-donut-tooltip-section5 [id^="scroll-indicator-"] {
            font-family: 'Satoshi Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            user-select: none;
            z-index: 10;
          }

          .d3-donut-tooltip-section5 [id^="scroll-indicator-"] span {
            background: rgba(255, 255, 255, 0.95);
            padding: 2px 8px;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(0, 0, 0, 0.05);
          }
        `;
        document.head.appendChild(style);
      }
    }

    handleStepChange(newStep, previousStep) {
      this.currentStep = newStep;

      if (newStep === 4 && previousStep !== 4) {
        this.hasPlayedEntranceAnimation = false;

        this.charts.forEach((chart) => {
          if (chart.g) {
            chart.g.selectAll('.arc').remove();
          }
        });

        setTimeout(() => {
          this.updateAllCharts();
        }, 100);
      }
    }

    initializeEnhancedHover() {
      if (window.SimpleHoverModule) {
        this.hoverModule = new window.SimpleHoverModule({
          offset: { x: 15, y: -10 },
          animationDuration: 80,
          className: 'd3-donut-tooltip-section5',
        });

        this.hoverModule.onUnpinCallback = () => {
          this.resetAllSliceEffects();
          this.hideCenterText(this.currentChart);
          this.clearCategoryHover();
          this.currentPinnedSliceData = null;
        };

        this.hoverModule.updateTooltipPosition = (event) => {
          this.updateIntelligentTooltipPosition(event);
        };

        this.setupTooltipAccordionHandlers();
      } else {
        console.warn('Simple Hover Module not available, using fallback');

        this.hoverModule = {
          attachHoverEvents: (selection, options) => {
            selection
              .on('mouseenter', options.onHover)
              .on('mouseleave', options.onOut)
              .on('mousemove', options.onMove);
          },
          showTooltip: () => {},
          hideTooltip: () => {},
          destroy: () => {},
          createTooltip: () => null,
        };
      }
    }

    setupTooltipAccordionHandlers() {
      document.addEventListener('click', (event) => {
        if (event.target.classList.contains('product-modal-overlay')) {
          this.closeProductModal();
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.activeModal) {
          this.closeProductModal();
        }
      });
    }

    openProductModal(button) {
      const category = button.getAttribute('data-category');
      const chartType = button.getAttribute('data-chart-type');
      const isTraditional = chartType === 'tradicional';

      const categoryData = this.getCategoryData(chartType).find((cat) => cat.name === category);
      if (!categoryData || !categoryData.details) {
        return;
      }

      this.createProductModal(categoryData.details, category, isTraditional);
    }

    createProductModal(products, categoryName, isTraditional) {
      this.closeProductModal();

      const modalOverlay = document.createElement('div');
      modalOverlay.className = 'product-modal-overlay';
      modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        z-index: 10002;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(2px);
        animation: fadeIn 0.2s ease;
      `;

      const modal = document.createElement('div');
      modal.className = 'product-modal';
      modal.style.cssText = `
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        margin: 20px;
        animation: slideIn 0.2s ease;
        font-family: 'Satoshi Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      const modalContent = this.generateModalContent(products, categoryName, isTraditional);
      modal.innerHTML = modalContent;

      modalOverlay.appendChild(modal);
      document.body.appendChild(modalOverlay);

      this.activeModal = modalOverlay;

      modal.addEventListener('click', (e) => e.stopPropagation());
    }

    generateModalContent(products, categoryName, isTraditional) {
      const categoryColor = this.categoryColors[categoryName] || '#c0c0c0';

      const productsHtml = products
        .map((product, index) => {
          const commissionValue = isTraditional
            ? product.cost
              ? this.formatCurrency(product.cost)
              : 'Sem custo'
            : product.custoAnualReino
              ? this.formatCurrency(product.custoAnualReino)
              : 'Sem custo';

          const investedValue = product.value ? this.formatCurrency(product.value) : 'R$ 0,00';
          const isLast = index === products.length - 1;

          return `
          <div style="padding: 12px 0; ${!isLast ? 'border-bottom: 1px solid #f1f5f9;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <div style="flex: 1;">
                <div style="font-size: 0.875em; font-weight: 600; color: #111827; margin-bottom: 4px;">${product.product}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 1em; font-weight: 700; color: #111827; margin-bottom: 2px;">${commissionValue}</div>
                <div style="font-size: 0.75em; color: #6b7280; font-weight: 500;">Custo de Comissão</div>
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end;">
              <div style="text-align: right;">
                <div style="font-size: 0.8em; color: #374151; font-weight: 500;">${investedValue}</div>
                <div style="font-size: 0.7em; color: #9ca3af; font-weight: 400;">Valor Investido</div>
              </div>
            </div>
          </div>
        `;
        })
        .join('');

      return `
        <div style="padding: 20px;">
          <div style="display: flex; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #f1f5f9;">
            <div style="width: 4px; height: 24px; background-color: ${categoryColor}; border-radius: 2px; margin-right: 12px;"></div>
            <h3 style="margin: 0; font-size: 1.1em; font-weight: 600; color: #111827;">${categoryName}</h3>
          </div>
          <div style="margin-bottom: 12px;">
            ${productsHtml}
          </div>
          <button
            onclick="window.ReinoD3DonutChartSection5?.closeProductModal()"
            style="
              width: 100%;
              padding: 8px 16px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              color: #64748b;
              font-size: 0.8em;
              cursor: pointer;
              transition: all 0.2s ease;
            "
            onmouseover="this.style.background='#f1f5f9'"
            onmouseout="this.style.background='#f8fafc'"
          >
            Fechar
          </button>
        </div>
      `;
    }

    closeProductModal() {
      if (this.activeModal) {
        this.activeModal.remove();
        this.activeModal = null;
      }
    }

    handleTooltipScroll(scrollContainerId, scrollIndicatorId) {
      const scrollContainer = document.getElementById(scrollContainerId);
      const scrollIndicator = document.getElementById(scrollIndicatorId);

      if (!scrollContainer || !scrollIndicator) {
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;

      scrollIndicator.style.opacity = isAtBottom ? '0' : '1';
    }

    initializeTooltipScrollIndicators() {
      setTimeout(() => {
        document.querySelectorAll('[id^="scroll-container-"]').forEach((container) => {
          const containerId = container.id;
          const indicatorId = containerId.replace('scroll-container-', 'scroll-indicator-');
          this.handleTooltipScroll(containerId, indicatorId);
        });
      }, 100);
    }

    async loadD3() {
      if (window.d3) {
        return;
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/d3@7';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load D3.js'));
        document.head.appendChild(script);
      });
    }

    setupColorScale() {
      const colors = Object.values(this.categoryColors);
      this.colorScale = (category) => this.categoryColors[category] || '#c0c0c0';
    }

    setupEventListeners() {
      document.addEventListener('assetSelectionChanged', (e) => {
        this.handleAssetSelection();
      });

      document.addEventListener('patrimonioUpdated', (e) => {
        this.handlePatrimonyUpdate();
      });

      document.addEventListener('resultadoSyncCompleted', (e) => {
        this.handleResultadoSync();
      });

      document.addEventListener('allocationChanged', (e) => {
        this.handleAssetSelection();
      });

      document.addEventListener('rotationIndexChanged', (e) => {
        this.handleRotationIndexChange();
      });

      document.addEventListener('click', (e) => {
        if (!this.hoverModule || !this.hoverModule.state.isPinned) {
          return;
        }

        const section5 =
          document.querySelector('[data-section="5"]') ||
          document.querySelector('.section-resultado') ||
          document.querySelector('[chart-content]')?.closest('section');

        if (section5 && !section5.contains(e.target)) {
          this.unpinTooltipAndCleanup();
          return;
        }

        if (section5 && section5.contains(e.target)) {
          const isTooltipClick = e.target.closest('.d3-donut-tooltip-section5');
          const isSliceClick = e.target.tagName === 'path' && e.target.closest('.arc');
          const isChartAreaClick = e.target.closest('svg') || e.target.closest('[chart-content]');

          if (isTooltipClick) {
            return;
          }

          if (isSliceClick) {
            return;
          }

          if (isChartAreaClick || !isSliceClick) {
            this.unpinTooltipAndCleanup();
          }
        }
      });

      document.addEventListener('scroll', () => {
        this.cleanupTooltips();
      });
    }

    initializeCharts() {
      const tradicionalChart = document.querySelector(
        '[chart-content="tradicional"][chart-type="donut"]'
      );

      if (tradicionalChart) {
        this.createChart(tradicionalChart, 'tradicional');
      }
    }

    createChart(container, type) {
      if (!container || !window.d3) {
        return;
      }

      container.innerHTML = '';

      const baseFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const widthInEm = 15;
      const heightInEm = 15;
      const width = widthInEm * baseFontSize;
      const height = heightInEm * baseFontSize;
      const radius = Math.min(width, height) / 2 - 10;

      const svg = window.d3
        .select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('overflow', 'visible');

      const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);

      const centerGroup = g.append('g').attr('class', 'center-text-group');

      centerGroup
        .append('text')
        .attr('class', 'center-value')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.1em')
        .style('font-size', '0.875em')
        .style('font-weight', '600')
        .style('fill', '#111827')
        .style('opacity', 0);

      centerGroup
        .append('text')
        .attr('class', 'center-category')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.2em')
        .style('font-size', '0.75em')
        .style('font-weight', '500')
        .style('fill', '#6b7280')
        .style('opacity', 0);

      const pie = window.d3
        .pie()
        .value((d) => d.value)
        .sort(null);

      const arc = window.d3
        .arc()
        .innerRadius(radius * 0.65)
        .outerRadius(radius);

      const chart = {
        svg,
        g,
        pie,
        arc,
        container,
        type,
        width,
        height,
        radius,
      };

      this.currentChart = chart;

      this.charts.set(type, chart);
      this.updateChart(type);
    }

    handleAssetSelection() {
      this.updateAllCharts();
    }

    handlePatrimonyUpdate() {
      this.updateAllCharts();
    }

    handleResultadoSync() {
      this.updateAllCharts();
    }

    handleRotationIndexChange() {
      this.updateAllCharts();
    }

    updateAllCharts() {
      this.charts.forEach((chart, type) => {
        this.updateChart(type);
      });
      this.updateListVisibility();
    }

    updateChart(type) {
      const chart = this.charts.get(type);
      if (!chart) {
        return;
      }

      const data = this.getCategoryData(type);

      if (!data || data.length === 0) {
        this.showNoDataMessage(chart);
        return;
      }

      this.renderChart(chart, data);
    }

    renderChart(chart, data) {
      const { g, pie, arc, container } = chart;

      const existingMessage = container.querySelector('.no-data-message');
      if (existingMessage) {
        existingMessage.remove();
      }

      const validData = data.filter((d) => d.value > 0 && isFinite(d.value));
      if (validData.length === 0) {
        return;
      }

      const arcs = g.selectAll('.arc').data(pie(validData), (d) => d.data.category);

      arcs.exit().remove();

      const arcEnter = arcs.enter().append('g').attr('class', 'arc');

      const isFirstRender =
        !this.hasPlayedEntranceAnimation && this.currentStep === 4 && arcEnter.size() > 0;

      arcEnter
        .append('path')
        .attr('fill', (d) => this.colorScale(d.data.category))
        .attr('stroke', 'none')
        .style('cursor', 'pointer')
        .style('opacity', 1);

      const arcUpdate = arcEnter.merge(arcs);

      if (isFirstRender) {
        this.applyEntranceAnimations(chart, arcUpdate, validData);
      } else {
        this.applyStandardAnimation(arcUpdate, arc);

        this.setupInteractions(arcUpdate, chart);
      }
    }

    setupInteractions(arcUpdate, chart) {
      this.hoverModule.attachHoverEvents(arcUpdate.select('path'), {
        onHover: (event, d) => {
          if (this.hoverModule && this.hoverModule.state.isPinned) {
            return;
          }

          window.d3
            .selectAll('.arc path')
            .transition()
            .duration(80)
            .style('opacity', 0.3)
            .style('filter', 'brightness(1)');

          window.d3
            .select(event.target)
            .transition()
            .duration(80)
            .style('opacity', 1)
            .style('filter', 'brightness(1.1)');

          this.showCenterText(chart, d.data);

          this.triggerCategoryHover(d.data.category || d.data.name);

          this.setActiveListaResultadoItem(d.data.category || d.data.name);

          document.dispatchEvent(
            new CustomEvent('donutTutorialHover', {
              detail: { category: d.data.category || d.data.name },
            })
          );
        },
        onOut: (event, d) => {
          if (this.hoverModule && this.hoverModule.state.isPinned) {
            return;
          }

          window.d3.selectAll('.arc path').transition().duration(80).style('opacity', 1);

          window.d3.select(event.target).transition().duration(80).style('filter', 'brightness(1)');

          this.hideCenterText(chart);

          this.clearCategoryHover();

          if (!this.hoverModule.state.isPinned) {
            this.clearActiveListaResultadoItem();
          }
        },
        tooltipContent: (d) => this.generateTooltipContent(d),
        className: 'd3-donut-tooltip-section5',
      });

      arcUpdate.select('path').on('click', (event, d) => {
        this.handleSliceClick(event, d, chart);
      });
    }

    applyEntranceAnimations(chart, arcUpdate, validData) {
      const { g, pie, arc } = chart;

      this.hasPlayedEntranceAnimation = true;

      const { width, height } = chart;
      const centerX = width / 2;
      const centerY = height / 2;

      g.transition()
        .duration(800)
        .ease(window.d3.easeCubicOut)
        .attrTween('transform', function () {
          const interpolateRotation = window.d3.interpolate(360, 0);
          return function (t) {
            const rotation = interpolateRotation(t);
            return `translate(${centerX}, ${centerY}) rotate(${rotation})`;
          };
        });

      const pieData = pie(validData);

      arcUpdate
        .select('path')
        .each(function (d, i) {
          d.originalStartAngle = d.startAngle;
          d.originalEndAngle = d.endAngle;

          d.startAngle = d.originalStartAngle;
          d.endAngle = d.originalStartAngle;
        })
        .attr('d', arc)
        .transition()
        .delay((d, i) => 400 + i * 200)
        .duration(600)
        .ease(window.d3.easeBackOut.overshoot(1.2))
        .attrTween('d', function (d) {
          const interpolateEnd = window.d3.interpolate(d.originalStartAngle, d.originalEndAngle);
          return function (t) {
            d.endAngle = interpolateEnd(t);
            return arc(d);
          };
        })
        .attr('fill', (d) => this.colorScale(d.data.category))
        .on('end', (d, i, nodes) => {
          if (i === nodes.length - 1) {
            this.setupInteractions(arcUpdate, chart);
          }
        });
    }

    applyStandardAnimation(arcUpdate, arc) {
      arcUpdate
        .select('path')
        .transition()
        .duration(750)
        .ease(window.d3.easeCubicInOut)
        .attr('d', (d) => {
          try {
            return arc(d);
          } catch (e) {
            return '';
          }
        })
        .attr('fill', (d) => this.colorScale(d.data.category));
    }

    getCategoryData(chartType = 'tradicional') {
      const resultadoSync =
        window.ReinoCalculator?.systems?.resultadoSync || window.resultadoSyncInstance;
      if (resultadoSync && typeof resultadoSync.getResultadoData === 'function') {
        const resultData = resultadoSync.getResultadoData();
        if (resultData?.patrimonio) {
          return this.getCategoryDataFromResultSync(resultData, chartType);
        }
      }

      return this.getCategoryDataFromDOM(chartType);
    }

    getCategoryDataFromResultSync(resultData, chartType) {
      const categoryTotals = new Map();
      const categoryDetails = new Map();

      Object.entries(resultData.patrimonio).forEach(([key, item]) => {
        if (item && item.valor > 0) {
          const category = item.category || 'Outros';
          const product = item.product || key;

          let taxaInfo = null;
          let custoCalculado = 0;

          const rotationController = window.ReinoRotationIndexController;
          if (rotationController) {
            const productKey = `${category}:${product}`;
            const rotationCalc = rotationController.getProductCalculation(productKey);

            if (rotationCalc) {
              custoCalculado = item.valor * rotationCalc.comissaoRate;

              const productData = rotationController.getProductData(productKey);
              const mediaCorretagemPercent = productData
                ? (productData.mediaCorretagem * 100).toFixed(2)
                : 'N/A';

              taxaInfo = {
                comissaoRate: rotationCalc.comissaoRate,
                comissaoPercent: rotationCalc.comissaoPercent,
                fatorEfetivo: rotationCalc.fatorEfetivo,
                indiceGiro: rotationController.getCurrentIndex(),
                mediaCorretagem: mediaCorretagemPercent,
              };
            } else {
              custoCalculado = item.valor * 0.01;
            }
          } else {
            custoCalculado = item.valor * 0.01;
          }

          const currentCost = categoryTotals.get(category) || 0;
          categoryTotals.set(category, currentCost + custoCalculado);

          if (!categoryDetails.has(category)) {
            categoryDetails.set(category, []);
          }
          categoryDetails.get(category).push({
            product: product,
            value: item.valor,
            cost: custoCalculado,
            percentage: item.percentual || 0,
            taxaInfo: taxaInfo,
            chartType: 'tradicional',
          });
        }
      });

      const totalValue = Array.from(categoryTotals.values()).reduce((sum, val) => sum + val, 0);

      return Array.from(categoryTotals.entries()).map(([category, value]) => ({
        category,
        value,
        name: category,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        details: categoryDetails.get(category) || [],
        chartType: chartType,
        reinoInfo: reinoInfo,
      }));
    }

    getCategoryDataFromDOM(chartType) {
      const patrimonioItems = document.querySelectorAll('.patrimonio_interactive_item');
      const categoryTotals = new Map();
      const categoryDetails = new Map();

      patrimonioItems.forEach((item) => {
        const category = item.getAttribute('ativo-category');
        const product = item.getAttribute('ativo-product');
        const input = item.querySelector('[input-settings="receive"]');

        if (!input || !category || !product) {
          return;
        }

        const value = this.parseCurrencyValue(input.value);
        if (value <= 0) {
          return;
        }

        let cost = 0;
        let taxaInfo = null;

        const rotationController = window.ReinoRotationIndexController;
        if (rotationController) {
          const productKey = `${category}:${product}`;
          const rotationCalc = rotationController.getProductCalculation(productKey);

          if (rotationCalc) {
            cost = value * rotationCalc.comissaoRate;

            const productData = rotationController.getProductData(productKey);
            const mediaCorretagemPercent = productData
              ? (productData.mediaCorretagem * 100).toFixed(2)
              : 'N/A';

            taxaInfo = {
              comissaoRate: rotationCalc.comissaoRate,
              comissaoPercent: rotationCalc.comissaoPercent,
              fatorEfetivo: rotationCalc.fatorEfetivo,
              indiceGiro: rotationController.getCurrentIndex(),
              mediaCorretagem: mediaCorretagemPercent,
            };
          } else {
            cost = value * 0.01;
          }
        } else {
          cost = value * 0.01;
        }

        const currentValue = categoryTotals.get(category) || 0;
        categoryTotals.set(category, currentValue + cost);

        if (!categoryDetails.has(category)) {
          categoryDetails.set(category, []);
        }
        categoryDetails.get(category).push({
          product: product,
          value: value,
          cost: cost,
          taxaInfo: taxaInfo,
          chartType: chartType,
        });
      });

      const totalValue = Array.from(categoryTotals.values()).reduce((sum, val) => sum + val, 0);

      return Array.from(categoryTotals.entries()).map(([category, value]) => ({
        category,
        value,
        name: category,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        details: categoryDetails.get(category) || [],
        chartType: chartType,
      }));
    }

    getChartData(type) {
      return this.getCategoryData(type);
    }

    generateTooltipContent(d) {
      const formatValue = this.formatCurrency(d.data.value);
      const isTraditional = d.data.chartType === 'tradicional';
      const categoryColor = this.categoryColors[d.data.name] || '#c0c0c0';
      const tooltipId = `tooltip-${d.data.name.replace(/\s+/g, '-').toLowerCase()}`;

      let detailsHtml = '';

      const mainSection = `
        <div style="display: flex; align-items: center; margin: 8px 0;">
          <div style="width: 4px; height: 40px; background-color: ${categoryColor}; border-radius: 2px; margin-right: 12px;"></div>
          <div style="flex: 1;">
            <div style="font-size: 1.1em; font-weight: 600; color: #1f2937; margin-bottom: 2px;">${d.data.name}</div>
            <div style="font-size: 1.7em; font-weight: 700; color: #111827; line-height: 1;">${formatValue}</div>
            <div style="font-size: 0.9em; color: #6b7280; margin-top: 2px;">Custo Total dos Produtos</div>
          </div>
        </div>
      `;

      if (d.data.details && d.data.details.length > 0) {
        const scrollContainerId = `scroll-container-${tooltipId}`;
        const scrollIndicatorId = `scroll-indicator-${tooltipId}`;

        detailsHtml = `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; position: relative;">
            <div style="margin-bottom: 4px;">
              <h4 style="margin: 0; font-size: 0.75em; font-weight: 500; color: #6b7280;">Custo de Comissão (${d.data.details.length} produtos)</h4>
            </div>
            <div
              id="${scrollContainerId}"
              style="
                max-height: 180px;
                overflow-y: auto;
                padding-right: 4px;
                margin-right: -4px;
                position: relative;
              "
              onscroll="window.ReinoD3DonutChartSection5System?.handleTooltipScroll('${scrollContainerId}', '${scrollIndicatorId}')"
            >
        `;

        d.data.details.forEach((detail, index) => {
          detailsHtml += this.generateProductHtml(
            detail,
            index,
            d.data.details.length - 1,
            isTraditional
          );
        });

        detailsHtml += `
            </div>
            <div
              id="${scrollIndicatorId}"
              style="
                position: absolute;
                bottom: 0;
                right: 0;
                left: 0;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(transparent, rgba(255, 255, 255, 0.9));
                font-size: 0.75em;
                color: #6b7280;
                font-weight: 500;
                pointer-events: none;
                transition: opacity 0.2s ease;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                backdrop-filter: blur(2px);
              "
            >
              <span style="display: flex; align-items: center; gap: 2px;">
                ↓ Mais produtos
              </span>
            </div>
          </div>
        `;
      }

      const tooltipHtml = `
        <div style="min-width: 200px; max-width: 320px; font-size: 1.1em;" data-tooltip-id="${tooltipId}">
          ${mainSection}
          ${detailsHtml}
        </div>
      `;

      setTimeout(() => {
        this.initializeTooltipScrollIndicators();
      }, 50);

      return tooltipHtml;
    }

    generateProductHtml(detail, index, lastIndex, isTraditional) {
      const detailValue = this.formatCurrency(detail.value);

      let commissionDisplay = '';
      let commissionValue = '';
      let giroInfo = '';

      if (isTraditional && detail.taxaInfo) {
        const mediaCorretagem = detail.taxaInfo.mediaCorretagem || 'N/A';
        const indiceGiro = detail.taxaInfo.indiceGiro || 'N/A';
        commissionDisplay = `${mediaCorretagem}% média de corretagem`;
        giroInfo = `Índice de Giro: ${indiceGiro}`;
        if (detail.cost) {
          commissionValue = this.formatCurrency(detail.cost);
        }
      } else if (isTraditional && detail.cost) {
        const custoAnual = this.formatCurrency(detail.cost);
        commissionDisplay = 'Custo tradicional';
        commissionValue = custoAnual;
      } else if (!isTraditional && detail.custoAnualReino) {
        const custoReino = this.formatCurrency(detail.custoAnualReino);
        commissionDisplay = 'Custo Reino';
        commissionValue = custoReino;
      } else {
        commissionDisplay = 'Sem custo adicional';
        commissionValue = '';
      }

      let commissionTags = '';
      if (isTraditional && detail.taxaInfo) {
        const mediaCorretagem = detail.taxaInfo.mediaCorretagem || 'N/A';
        const indiceGiro = detail.taxaInfo.indiceGiro || 'N/A';

        commissionTags = `
          <div style="display: flex; gap: 6px; justify-content: flex-start; align-items: center;">
            <span style="
              background: linear-gradient(135deg, #E3AD0C, #D4A017);
              color: #5D4E2A;
              font-size: 0.65em;
              font-weight: 600;
              padding: 2px 8px;
              border-radius: 12px;
              border: 1px solid #B8860B30;
              white-space: nowrap;
            ">${mediaCorretagem}% corretagem</span>
            <span style="
              background: linear-gradient(135deg, #8B4513, #A0522D);
              color: #F5DEB3;
              font-size: 0.65em;
              font-weight: 600;
              padding: 2px 8px;
              border-radius: 12px;
              border: 1px solid #5D4E2A30;
              white-space: nowrap;
            ">Giro: ${indiceGiro}</span>
          </div>
        `;
      } else if (commissionDisplay && commissionDisplay !== 'Sem custo adicional') {
        commissionTags = `
          <div style="display: flex; justify-content: flex-start;">
            <span style="
              background: linear-gradient(135deg, #BDAA6F, #A2883B);
              color: #5D4E2A;
              font-size: 0.65em;
              font-weight: 600;
              padding: 2px 8px;
              border-radius: 12px;
              border: 1px solid #8B4513;
              white-space: nowrap;
            ">${commissionDisplay}</span>
          </div>
        `;
      }

      return `
        <div style="padding: 10px 0 15px 0; ${index < lastIndex ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
            <div style="flex: 1;">
              <div class="tooltip-product-name" style="font-size: 0.875em; font-weight: 600; color: #111827; margin-bottom: 2px;" title="${detail.product}">${detail.product}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1em; font-weight: 700; color: #111827;">${commissionValue || 'Sem custo'}</div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 4px; margin-bottom: 8px;">
            <div style="font-size: 0.75em; color: #374151; font-weight: 500;">
              Valor Investido:
            </div>
            <div style="font-size: 0.75em; font-weight: 600; color: #111827;">
              ${detailValue}
            </div>
          </div>
          ${
            commissionTags
              ? `
          <div style="display: flex; justify-content: flex-start; padding-top: 4px;">
            ${commissionTags}
          </div>
          `
              : ''
          }
        </div>
      `;
    }

    showNoDataMessage(chart) {
      const { container, width, height } = chart;

      chart.g.selectAll('.arc').remove();

      const existing = container.querySelector('.no-data-message');
      if (existing) {
        existing.remove();
      }

      const message = document.createElement('div');
      message.className = 'no-data-message';
      message.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: #6B7280;
        font-size: 0.875em;
      `;
      message.textContent = 'Nenhum ativo selecionado';

      container.style.position = 'relative';
      container.appendChild(message);
    }

    updateListVisibility() {
      const categoryData = this.getCategoryData();
      const visibleCategories = new Set(categoryData.map((d) => d.category));

      document.querySelectorAll('.lista-resultado-item').forEach((item) => {
        const category = item.getAttribute('ativo-category');

        if (visibleCategories.has(category)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });

      const tradicionalList = document.querySelector(
        '[chart-content="tradicional"][chart-type="list"]'
      );
      const reinoList = document.querySelector('[chart-content="reino"][chart-type="list"]');

      if (tradicionalList) {
        this.updateListData(tradicionalList, 'tradicional');
      }

      if (reinoList) {
        this.updateListData(reinoList, 'reino');
      }
    }

    updateListData(container, type) {
      const data = this.getChartData(type);

      container.innerHTML = '';

      data.forEach((item) => {
        const listItem = document.createElement('div');
        listItem.className = 'chart-list-item';
        listItem.style.cssText = `
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        `;

        const colorDot = document.createElement('span');
        colorDot.style.cssText = `
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: ${this.colorScale(item.category)};
          display: inline-block;
          margin-right: 8px;
        `;

        const label = document.createElement('span');
        label.textContent = item.label;
        label.style.flex = '1';

        const value = document.createElement('span');
        value.textContent = this.formatCurrency(item.value);
        value.style.fontWeight = 'bold';

        const labelContainer = document.createElement('div');
        labelContainer.style.display = 'flex';
        labelContainer.style.alignItems = 'center';
        labelContainer.appendChild(colorDot);
        labelContainer.appendChild(label);

        listItem.appendChild(labelContainer);
        listItem.appendChild(value);
        container.appendChild(listItem);
      });
    }

    parseCurrencyValue(value) {
      if (!value || typeof value !== 'string') {
        return 0;
      }
      const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
      return parseFloat(cleanValue) || 0;
    }

    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    }

    getChart(type) {
      return this.charts.get(type);
    }

    destroyChart(type) {
      const chart = this.charts.get(type);
      if (chart && chart.container) {
        chart.container.innerHTML = '';
        this.charts.delete(type);
      }
    }

    destroyAllCharts() {
      this.charts.forEach((chart, type) => {
        this.destroyChart(type);
      });
      this.cleanupTooltips();
    }

    unpinTooltipAndCleanup() {
      if (this.hoverModule && this.hoverModule.unpinTooltip) {
        this.hoverModule.unpinTooltip();
      }
      this.resetAllSliceEffects();
      this.hideCenterText(this.currentChart);
      this.clearCategoryHover();
      this.currentPinnedSliceData = null;

      document.dispatchEvent(new CustomEvent('tooltipUnpinned'));
    }

    cleanupTooltips() {
      this.currentPinnedSliceData = null;

      if (this.hoverModule && typeof this.hoverModule.destroy === 'function') {
        this.hoverModule.destroy();
      }

      if (window.d3) {
        window.d3.selectAll('.d3-donut-tooltip-section5').remove();
      }
    }

    refresh() {
      this.updateAllCharts();
    }

    triggerCategoryHover(category) {
      if (!category) {
        return;
      }

      document.dispatchEvent(
        new CustomEvent('donutCategoryHover', {
          detail: { category: category },
        })
      );
    }

    clearCategoryHover() {
      document.dispatchEvent(new CustomEvent('donutCategoryHoverEnd'));
    }

    setActiveListaResultadoItem(category) {
      document.querySelectorAll('.lista-resultado-item.ativo').forEach((item) => {
        item.classList.remove('ativo');
      });

      const listaItem = document.querySelector(
        `.lista-resultado-item[ativo-category="${category}"]`
      );
      if (listaItem) {
        listaItem.classList.add('ativo');
      }
    }

    clearActiveListaResultadoItem() {
      document.querySelectorAll('.lista-resultado-item.ativo').forEach((item) => {
        item.classList.remove('ativo');
      });
    }

    showCenterText(chart, data) {
      const centerValue = chart.g.select('.center-value');
      const centerCategory = chart.g.select('.center-category');

      if (centerValue.empty() || centerCategory.empty()) {
        return;
      }

      const formattedValue = this.formatCurrency(data.value);
      const categoryName = data.category || data.name;

      centerValue.text(formattedValue).transition().duration(80).style('opacity', 1);

      centerCategory.text('Custo de comissão').transition().duration(80).style('opacity', 0.7);
    }

    hideCenterText(chart) {
      const centerValue = chart.g.select('.center-value');
      const centerCategory = chart.g.select('.center-category');

      if (centerValue.empty() || centerCategory.empty()) {
        return;
      }

      centerValue.transition().duration(80).style('opacity', 0);

      centerCategory.transition().duration(80).style('opacity', 0);
    }

    handleSliceClick(event, d, chart) {
      event.stopPropagation();

      if (
        this.currentPinnedSliceData &&
        this.currentPinnedSliceData.name === d.data.name &&
        this.hoverModule.state.isPinned
      ) {
        this.unpinTooltipAndCleanup();
        return;
      }

      if (this.hoverModule && this.hoverModule.togglePinnedTooltip) {
        this.hoverModule.togglePinnedTooltip(
          event,
          d,
          (data) => this.generateTooltipContent(data),
          'd3-donut-tooltip-section5'
        );

        this.applyPinnedStateEffects(event.target, d);

        this.showCenterText(chart, d.data);

        this.triggerCategoryHover(d.data.category || d.data.name);

        this.setActiveListaResultadoItem(d.data.category || d.data.name);

        this.currentPinnedSliceData = d.data;

        document.dispatchEvent(
          new CustomEvent('donutTutorialClick', {
            detail: { category: d.data.category || d.data.name },
          })
        );
      }
    }

    resetAllSliceEffects() {
      window.d3
        .selectAll('.arc path')
        .style('opacity', 1)
        .style('filter', 'brightness(1)')
        .style('stroke', 'none')
        .style('stroke-width', null);

      window.d3
        .selectAll('.arc')
        .transition()
        .duration(250)
        .ease(window.d3.easeBackIn)
        .attr('transform', 'translate(0, 0)');
    }

    applyPinnedStateEffects(selectedElement, selectedData) {
      window.d3.selectAll('.arc').transition().duration(250).attr('transform', 'translate(0, 0)');

      window.d3
        .selectAll('.arc path')
        .style('opacity', 0.3)
        .style('filter', 'brightness(1)')
        .style('stroke', 'none')
        .style('stroke-width', null);

      window.d3
        .select(selectedElement)
        .style('opacity', 1)
        .style('filter', 'brightness(1.1)')
        .style('stroke', 'none')
        .style('stroke-width', null);

      this.explodeSlice(selectedElement, selectedData);
    }

    explodeSlice(element, sliceData) {
      if (!this.currentChart || !sliceData) {
        return;
      }

      const explodeDistance = 12;

      const angle = (sliceData.startAngle + sliceData.endAngle) / 2;

      const explodeX = Math.sin(angle) * explodeDistance;
      const explodeY = -Math.cos(angle) * explodeDistance;

      window.d3
        .select(element.parentNode)
        .transition()
        .duration(300)
        .ease(window.d3.easeBackOut.overshoot(1.2))
        .attr('transform', `translate(${explodeX}, ${explodeY})`);
    }

    updateIntelligentTooltipPosition(event) {
      if (!this.hoverModule.state.activeTooltip || !this.hoverModule.state.isVisible) {
        return;
      }

      const mouseX = event.clientX;
      const mouseY = event.clientY;
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let tooltipWidth = 280;
      let tooltipHeight = 200;

      if (this.hoverModule.state.activeTooltip) {
        const tooltipNode = this.hoverModule.state.activeTooltip.node();
        if (tooltipNode) {
          const rect = tooltipNode.getBoundingClientRect();
          tooltipWidth = rect.width || tooltipWidth;
          tooltipHeight = rect.height || tooltipHeight;
        }
      }

      const donutCenter = this.getDonutCenterPosition();

      let x = mouseX + this.hoverModule.options.offset.x;
      let y = mouseY + this.hoverModule.options.offset.y;

      if (donutCenter && this.wouldOverlapCenter(x, y, tooltipWidth, tooltipHeight, donutCenter)) {
        x = mouseX - tooltipWidth - Math.abs(this.hoverModule.options.offset.x);

        if (this.wouldOverlapCenter(x, y, tooltipWidth, tooltipHeight, donutCenter) || x < 20) {
          x = mouseX + this.hoverModule.options.offset.x;

          if (mouseY > donutCenter.y) {
            y = mouseY - tooltipHeight - Math.abs(this.hoverModule.options.offset.y);
          } else {
            y = mouseY + Math.abs(this.hoverModule.options.offset.y) + 20;
          }
        }
      }

      if (x + tooltipWidth + 20 > viewport.width) {
        x = mouseX - tooltipWidth - Math.abs(this.hoverModule.options.offset.x);
      }

      if (y + tooltipHeight + 20 > viewport.height) {
        y = mouseY - tooltipHeight - Math.abs(this.hoverModule.options.offset.y);
      }

      x = Math.max(20, Math.min(x, viewport.width - tooltipWidth - 20));
      y = Math.max(20, Math.min(y, viewport.height - tooltipHeight - 20));

      this.hoverModule.state.activeTooltip.style('left', x + 'px').style('top', y + 'px');
    }

    getDonutCenterPosition() {
      const donutContainer = document.querySelector(
        '[chart-content="tradicional"][chart-type="donut"]'
      );
      if (!donutContainer) {
        return null;
      }

      const rect = donutContainer.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        radius: (Math.min(rect.width, rect.height) / 2) * 0.65,
      };
    }

    wouldOverlapCenter(tooltipX, tooltipY, tooltipWidth, tooltipHeight, center) {
      const tooltipRect = {
        left: tooltipX,
        right: tooltipX + tooltipWidth,
        top: tooltipY,
        bottom: tooltipY + tooltipHeight,
      };

      const centerRect = {
        left: center.x - center.radius,
        right: center.x + center.radius,
        top: center.y - center.radius,
        bottom: center.y + center.radius,
      };

      return !(
        tooltipRect.right < centerRect.left ||
        tooltipRect.left > centerRect.right ||
        tooltipRect.bottom < centerRect.top ||
        tooltipRect.top > centerRect.bottom
      );
    }
  }

  window.ReinoD3DonutChartSection5System = new D3DonutChartSection5System();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoD3DonutChartSection5System.init();
    });
  } else {
    window.ReinoD3DonutChartSection5System.init();
  }
})();
