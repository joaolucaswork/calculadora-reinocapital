/**
 * D3.js Donut Chart System for Section 5 - Versão Webflow TXT
 * Creates donut charts grouped by asset categories in result comparison section
 * Versão sem imports/exports para uso direto no Webflow
 */

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
        'Renda Variável': '#776a41',
        Internacional: '#bdaa6f',
        COE: '#d17d00',
        Previdência: '#8c5e00',
        Outro: '#4f4f4f',
        Outros: '#4f4f4f',
      };

      // Initialize Simple Hover Module (will be set up in init method)
      this.hoverModule = null;

      // Track currently pinned slice data for toggle behavior
      this.currentPinnedSliceData = null;
      this.currentChart = null;

      this.setupColorScale();
    }

    async init() {
      if (this.isInitialized) return;

      try {
        await this.loadD3();
        this.initializeEnhancedHover();
        this.setupEventListeners();
        this.initializeCharts();
        this.isInitialized = true;

        document.dispatchEvent(new CustomEvent('donutChartSection5Ready'));
      } catch (error) {
        console.error('Failed to initialize D3DonutChartSection5System:', error);
      }
    }

    initializeEnhancedHover() {
      // Initialize Simple Hover Module if available
      if (window.SimpleHoverModule) {
        this.hoverModule = new window.SimpleHoverModule({
          offset: { x: 15, y: -10 },
          animationDuration: 80,
          className: 'd3-donut-tooltip-section5',
        });

        // Set callback for when tooltip is unpinned
        this.hoverModule.onUnpinCallback = () => {
          this.resetAllSliceEffects();
          this.hideCenterText(this.currentChart);
          this.clearCategoryHover();
          this.currentPinnedSliceData = null;
        };

        // Override the updateTooltipPosition method for intelligent positioning
        this.hoverModule.updateTooltipPosition = (event) => {
          this.updateIntelligentTooltipPosition(event);
        };
      } else {
        console.warn('Simple Hover Module not available, using fallback');
        // Create a comprehensive fallback
        this.hoverModule = {
          attachHoverEvents: (selection, options) => {
            // Fallback to basic hover events
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

    async loadD3() {
      if (window.d3) return;

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

      // Listener para mudanças no índice de giro
      document.addEventListener('rotationIndexChanged', (e) => {
        this.handleRotationIndexChange();
      });

      // Limpar tooltips quando o usuário sair da seção
      document.addEventListener('click', (e) => {
        const section5 =
          document.querySelector('[data-section="5"]') ||
          document.querySelector('.section-resultado') ||
          document.querySelector('[chart-content]')?.closest('section');

        // Check if click is outside section 5 or on a chart element
        if (section5 && !section5.contains(e.target)) {
          this.cleanupTooltips();
        } else if (section5 && section5.contains(e.target)) {
          // Check if click is on chart area but not on a slice or tooltip
          const isChartClick = e.target.closest('svg') || e.target.closest('[chart-content]');
          const isSliceClick = e.target.tagName === 'path' && e.target.closest('.arc');
          const isTooltipClick = e.target.closest('.d3-donut-tooltip-section5');

          // Only close tooltip if clicking on chart area, not on slice or tooltip
          if (isChartClick && !isSliceClick && !isTooltipClick) {
            if (this.hoverModule && this.hoverModule.unpinTooltip) {
              this.hoverModule.unpinTooltip();
              this.resetAllSliceEffects();
              this.hideCenterText(this.currentChart);
              this.clearCategoryHover();
              this.currentPinnedSliceData = null;
            }
          }
        }
      });

      // Limpar tooltips ao fazer scroll
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
      if (!container || !window.d3) return;

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

      // Add center text group
      const centerGroup = g.append('g').attr('class', 'center-text-group');

      // Main value text (larger)
      centerGroup
        .append('text')
        .attr('class', 'center-value')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.1em')
        .style('font-size', '0.875em')
        .style('font-weight', '600')
        .style('fill', '#111827')
        .style('opacity', 0);

      // Category text (smaller, below)
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

      // Store chart reference for callbacks
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
      if (!chart) return;

      const data = this.getCategoryData(type);

      if (!data || data.length === 0) {
        this.showNoDataMessage(chart);
        return;
      }

      this.renderChart(chart, data);
    }

    renderChart(chart, data) {
      const { g, pie, arc, container } = chart;

      // Remove no-data message if it exists
      const existingMessage = container.querySelector('.no-data-message');
      if (existingMessage) {
        existingMessage.remove();
      }

      // Verificar se há dados válidos antes de renderizar
      const validData = data.filter((d) => d.value > 0 && isFinite(d.value));
      if (validData.length === 0) return;

      const arcs = g.selectAll('.arc').data(pie(validData), (d) => d.data.category);

      arcs.exit().remove();

      const arcEnter = arcs.enter().append('g').attr('class', 'arc');

      arcEnter
        .append('path')
        .attr('fill', (d) => this.colorScale(d.data.category))
        .attr('stroke', 'none')
        .style('cursor', 'pointer')
        .style('opacity', 1);

      const arcUpdate = arcEnter.merge(arcs);

      // Use Simple Hover Module instead of direct event handlers
      this.hoverModule.attachHoverEvents(arcUpdate.select('path'), {
        onHover: (event, d) => {
          // Completely disable hover tooltips when any tooltip is pinned
          if (this.hoverModule && this.hoverModule.state.isPinned) {
            return;
          }

          // Reset ALL slices to original state first (opacity, filter) - no size change
          window.d3
            .selectAll('.arc path')
            .transition()
            .duration(80)
            .style('opacity', 0.3)
            .style('filter', 'brightness(1)');

          // Then apply hover effect to current slice - no size change
          window.d3
            .select(event.target)
            .transition()
            .duration(80)
            .style('opacity', 1)
            .style('filter', 'brightness(1.1)');

          // Show center text with category info
          this.showCenterText(chart, d.data);

          // Trigger cross-component interaction
          this.triggerCategoryHover(d.data.category || d.data.name);
        },
        onOut: (event, d) => {
          // Completely disable hover out effects when any tooltip is pinned
          if (this.hoverModule && this.hoverModule.state.isPinned) {
            return;
          }

          // Restore all slices to full opacity with faster transition
          window.d3.selectAll('.arc path').transition().duration(80).style('opacity', 1);

          // Remove visual hover effect - no size reset needed
          window.d3.select(event.target).transition().duration(80).style('filter', 'brightness(1)');

          // Hide center text
          this.hideCenterText(chart);

          // Clear cross-component interaction
          this.clearCategoryHover();
        },
        tooltipContent: (d) => this.generateTooltipContent(d),
        className: 'd3-donut-tooltip-section5',
      });

      // Add click handlers for pinning tooltips
      arcUpdate.select('path').on('click', (event, d) => {
        this.handleSliceClick(event, d, chart);
      });

      arcUpdate
        .select('path')
        .transition()
        .duration(750)
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
      // Tentar obter dados do sistema de resultado primeiro
      const resultadoSync =
        window.ReinoCalculator?.systems?.resultadoSync || window.resultadoSyncInstance;
      if (resultadoSync && typeof resultadoSync.getResultadoData === 'function') {
        const resultData = resultadoSync.getResultadoData();
        if (resultData?.patrimonio) {
          return this.getCategoryDataFromResultSync(resultData, chartType);
        }
      }

      // Fallback: buscar diretamente do DOM
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

          // Usar sistema de rotation index para cálculo de comissão
          const rotationController = window.ReinoRotationIndexController;
          if (rotationController) {
            const productKey = `${category}:${product}`;
            const rotationCalc = rotationController.getProductCalculation(productKey);

            if (rotationCalc) {
              custoCalculado = item.valor * rotationCalc.comissaoRate;

              // Obter dados do produto para incluir média de corretagem
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

        if (!input || !category || !product) return;

        const value = this.parseCurrencyValue(input.value);
        if (value <= 0) return;

        let cost = 0;
        let taxaInfo = null;

        // Usar sistema de rotation index para cálculo de comissão
        const rotationController = window.ReinoRotationIndexController;
        if (rotationController) {
          const productKey = `${category}:${product}`;
          const rotationCalc = rotationController.getProductCalculation(productKey);

          if (rotationCalc) {
            cost = value * rotationCalc.comissaoRate;

            // Obter dados do produto para incluir média de corretagem
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

    // Método de compatibilidade
    getChartData(type) {
      return this.getCategoryData(type);
    }

    // Generate tooltip content for Simple Hover Module
    generateTooltipContent(d) {
      const formatValue = this.formatCurrency(d.data.value);
      const isTraditional = d.data.chartType === 'tradicional';
      const categoryColor = this.categoryColors[d.data.name] || '#c0c0c0';

      let detailsHtml = '';

      // Main content section with category info - increased font sizes
      let mainSection = `
        <div style="display: flex; align-items: center; margin: 8px 0;">
          <div style="width: 4px; height: 40px; background-color: ${categoryColor}; border-radius: 2px; margin-right: 12px;"></div>
          <div style="flex: 1;">
            <div style="font-size: 1.1em; font-weight: 600; color: #1f2937; margin-bottom: 2px;">${d.data.name}</div>
            <div style="font-size: 1.7em; font-weight: 700; color: #111827; line-height: 1;">${formatValue}</div>
            <div style="font-size: 0.9em; color: #6b7280; margin-top: 2px;">Custo de Comissão</div>
          </div>
        </div>
      `;

      // Build details section with enhanced product display
      if (d.data.details && d.data.details.length > 0) {
        detailsHtml =
          '<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">';

        d.data.details.forEach((detail, index) => {
          if (index < 4) {
            // Show up to 4 details with better formatting
            const detailValue = this.formatCurrency(detail.value);

            // Get commission info with both percentage and value
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

            detailsHtml += `
              <div style="padding: 10px 0; ${index < 3 && index < d.data.details.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                  <div style="flex: 1;">
                    <div style="font-size: 0.875em; font-weight: 600; color: #111827; margin-bottom: 2px;">${detail.product}</div>
                    <div style="font-size: 0.75em; color: #6b7280;">${commissionDisplay}</div>
                    ${giroInfo ? `<div style="font-size: 0.6875em; color: #9ca3af; margin-top: 2px;">${giroInfo}</div>` : ''}
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 0.8125em; font-weight: 600; color: #111827;">${detailValue}</div>
                  </div>
                </div>
                ${
                  commissionValue
                    ? `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px solid #f3f4f6;">
                    <span style="font-size: 0.6875em; color: #6b7280;">Comissão média anual:</span>
                    <span style="font-size: 0.75em; font-weight: 600; color: ${isTraditional ? '#dc2626' : '#16a34a'};">${commissionValue}</span>
                  </div>
                `
                    : ''
                }
              </div>
            `;
          }
        });

        if (d.data.details.length > 4) {
          detailsHtml += `<div style="font-size: 0.75em; color: #9ca3af; margin-top: 8px; text-align: center; font-style: italic; padding: 6px; background-color: #f9fafb; border-radius: 6px;">+${d.data.details.length - 4} outros produtos nesta categoria</div>`;
        }

        detailsHtml += '</div>';
      }

      return `
        <div style="min-width: 200px; font-size: 1.1em;">
          ${mainSection}
          ${detailsHtml}
        </div>
      `;
    }

    showNoDataMessage(chart) {
      const { container, width, height } = chart;

      chart.g.selectAll('.arc').remove();

      const existing = container.querySelector('.no-data-message');
      if (existing) existing.remove();

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

      // Atualizar listas de gráfico se existirem
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
      if (!value || typeof value !== 'string') return 0;
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

    cleanupTooltips() {
      // Reset pinned slice tracking
      this.currentPinnedSliceData = null;

      // Use Simple Hover Module cleanup
      if (this.hoverModule && typeof this.hoverModule.destroy === 'function') {
        this.hoverModule.destroy();
      }

      // Fallback cleanup for any remaining tooltips
      if (window.d3) {
        window.d3.selectAll('.d3-donut-tooltip-section5').remove();
      }
    }

    refresh() {
      this.updateAllCharts();
    }

    triggerCategoryHover(category) {
      if (!category) return;

      // Dispatch custom event for cross-component interaction
      document.dispatchEvent(
        new CustomEvent('donutCategoryHover', {
          detail: { category: category },
        })
      );
    }

    clearCategoryHover() {
      // Dispatch custom event to clear cross-component interaction
      document.dispatchEvent(new CustomEvent('donutCategoryHoverEnd'));
    }

    showCenterText(chart, data) {
      const centerValue = chart.g.select('.center-value');
      const centerCategory = chart.g.select('.center-category');

      if (centerValue.empty() || centerCategory.empty()) return;

      // Format the commission value
      const formattedValue = this.formatCurrency(data.value);
      const categoryName = data.category || data.name;

      // Show value text
      centerValue.text(formattedValue).transition().duration(80).style('opacity', 1);

      // Show category text
      centerCategory.text(categoryName).transition().duration(80).style('opacity', 0.7);
    }

    hideCenterText(chart) {
      const centerValue = chart.g.select('.center-value');
      const centerCategory = chart.g.select('.center-category');

      if (centerValue.empty() || centerCategory.empty()) return;

      // Hide both texts
      centerValue.transition().duration(80).style('opacity', 0);

      centerCategory.transition().duration(80).style('opacity', 0);
    }

    handleSliceClick(event, d, chart) {
      event.stopPropagation();

      // Check if clicking on the same slice that's already pinned (toggle behavior)
      if (
        this.currentPinnedSliceData &&
        this.currentPinnedSliceData.name === d.data.name &&
        this.hoverModule.state.isPinned
      ) {
        // Unpin the current tooltip and reset visual effects
        this.hoverModule.unpinTooltip();
        this.resetAllSliceEffects();
        this.hideCenterText(chart);
        this.clearCategoryHover();
        this.currentPinnedSliceData = null;
        return;
      }

      // Pin the new slice tooltip (replaces any existing pinned tooltip)
      if (this.hoverModule && this.hoverModule.togglePinnedTooltip) {
        this.hoverModule.togglePinnedTooltip(
          event,
          d,
          (data) => this.generateTooltipContent(data),
          'd3-donut-tooltip-section5'
        );

        // Apply pinned state visual effects
        this.applyPinnedStateEffects(event.target, d);

        // Show center text for pinned slice
        this.showCenterText(chart, d.data);

        // Trigger cross-component interaction for pinned slice
        this.triggerCategoryHover(d.data.category || d.data.name);

        // Track the currently pinned slice
        this.currentPinnedSliceData = d.data;
      }
    }

    resetAllSliceEffects() {
      // Reset all slices to normal state
      window.d3
        .selectAll('.arc path')
        .style('opacity', 1)
        .style('filter', 'brightness(1)')
        .style('stroke', 'none')
        .style('stroke-width', null);

      // Reset all slice transforms (explode effect)
      window.d3
        .selectAll('.arc')
        .transition()
        .duration(250)
        .ease(window.d3.easeBackIn)
        .attr('transform', 'translate(0, 0)');
    }

    applyPinnedStateEffects(selectedElement, selectedData) {
      // First, reset all transforms
      window.d3.selectAll('.arc').transition().duration(250).attr('transform', 'translate(0, 0)');

      // Set all slices to reduced opacity
      window.d3
        .selectAll('.arc path')
        .style('opacity', 0.3)
        .style('filter', 'brightness(1)')
        .style('stroke', 'none')
        .style('stroke-width', null);

      // Highlight the selected slice (no border, just opacity and brightness)
      window.d3
        .select(selectedElement)
        .style('opacity', 1)
        .style('filter', 'brightness(1.1)')
        .style('stroke', 'none')
        .style('stroke-width', null);

      // Apply explode effect to selected slice
      this.explodeSlice(selectedElement, selectedData);
    }

    explodeSlice(element, sliceData) {
      if (!this.currentChart || !sliceData) return;

      const explodeDistance = 12; // Distance to move the slice outward

      // Calculate the angle to determine direction
      const angle = (sliceData.startAngle + sliceData.endAngle) / 2;

      // Calculate explode offset
      const explodeX = Math.sin(angle) * explodeDistance;
      const explodeY = -Math.cos(angle) * explodeDistance;

      // Apply transform to move the slice group
      window.d3
        .select(element.parentNode)
        .transition()
        .duration(300)
        .ease(window.d3.easeBackOut.overshoot(1.2))
        .attr('transform', `translate(${explodeX}, ${explodeY})`);
    }

    updateIntelligentTooltipPosition(event) {
      if (!this.hoverModule.state.activeTooltip || !this.hoverModule.state.isVisible) return;

      const mouseX = event.clientX;
      const mouseY = event.clientY;
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // Get tooltip dimensions
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

      // Find the donut chart center position
      const donutCenter = this.getDonutCenterPosition();

      // Calculate intelligent positioning
      let x = mouseX + this.hoverModule.options.offset.x;
      let y = mouseY + this.hoverModule.options.offset.y;

      // Check if default position would overlap with donut center
      if (donutCenter && this.wouldOverlapCenter(x, y, tooltipWidth, tooltipHeight, donutCenter)) {
        // Position tooltip to the left of cursor instead
        x = mouseX - tooltipWidth - Math.abs(this.hoverModule.options.offset.x);

        // If still overlapping or going off-screen, try above/below
        if (this.wouldOverlapCenter(x, y, tooltipWidth, tooltipHeight, donutCenter) || x < 20) {
          x = mouseX + this.hoverModule.options.offset.x;

          // Try positioning above the cursor
          if (mouseY > donutCenter.y) {
            y = mouseY - tooltipHeight - Math.abs(this.hoverModule.options.offset.y);
          } else {
            // Position below the cursor
            y = mouseY + Math.abs(this.hoverModule.options.offset.y) + 20;
          }
        }
      }

      // Ensure tooltip stays within viewport bounds
      if (x + tooltipWidth + 20 > viewport.width) {
        x = mouseX - tooltipWidth - Math.abs(this.hoverModule.options.offset.x);
      }

      if (y + tooltipHeight + 20 > viewport.height) {
        y = mouseY - tooltipHeight - Math.abs(this.hoverModule.options.offset.y);
      }

      // Final bounds checking
      x = Math.max(20, Math.min(x, viewport.width - tooltipWidth - 20));
      y = Math.max(20, Math.min(y, viewport.height - tooltipHeight - 20));

      this.hoverModule.state.activeTooltip.style('left', x + 'px').style('top', y + 'px');
    }

    getDonutCenterPosition() {
      const donutContainer = document.querySelector(
        '[chart-content="tradicional"][chart-type="donut"]'
      );
      if (!donutContainer) return null;

      const rect = donutContainer.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        radius: (Math.min(rect.width, rect.height) / 2) * 0.65, // Inner radius area
      };
    }

    wouldOverlapCenter(tooltipX, tooltipY, tooltipWidth, tooltipHeight, center) {
      // Check if tooltip rectangle would overlap with donut center circle
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

  // Cria instância global
  window.ReinoD3DonutChartSection5System = new D3DonutChartSection5System();

  // Auto-inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoD3DonutChartSection5System.init();
    });
  } else {
    window.ReinoD3DonutChartSection5System.init();
  }
})();
