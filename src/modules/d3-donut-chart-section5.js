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
        Outros: '#c0c0c0',
      };
      this.setupColorScale();
    }

    async init() {
      if (this.isInitialized) return;

      try {
        await this.loadD3();
        this.setupEventListeners();
        this.initializeCharts();
        this.isInitialized = true;

        document.dispatchEvent(new CustomEvent('donutChartSection5Ready'));
      } catch (error) {
        console.error('Failed to initialize D3DonutChartSection5System:', error);
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
    }

    initializeCharts() {
      const tradicionalChart = document.querySelector(
        '[chart-content="tradicional"][chart-type="donut"]'
      );
      const reinoChart = document.querySelector('[chart-content="reino"][chart-type="donut"]');

      if (tradicionalChart) {
        this.createChart(tradicionalChart, 'tradicional');
      }

      if (reinoChart) {
        this.createChart(reinoChart, 'reino');
      }
    }

    createChart(container, type) {
      if (!container || !window.d3) return;

      container.innerHTML = '';

      const width = 200;
      const height = 200;
      const radius = Math.min(width, height) / 2 - 10;

      const svg = window.d3
        .select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);

      const pie = window.d3
        .pie()
        .value((d) => d.value)
        .sort(null);

      const arc = window.d3
        .arc()
        .innerRadius(radius * 0.5)
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

      this.createTooltip();

      const hoverArc = window.d3
        .arc()
        .innerRadius(chart.radius * 0.5)
        .outerRadius(chart.radius + 10);

      // Verificar se há dados válidos antes de renderizar
      const validData = data.filter((d) => d.value > 0 && isFinite(d.value));
      if (validData.length === 0) return;

      const arcs = g.selectAll('.arc').data(pie(validData), (d) => d.data.category);

      arcs.exit().remove();

      const arcEnter = arcs.enter().append('g').attr('class', 'arc');

      arcEnter
        .append('path')
        .attr('fill', (d) => this.colorScale(d.data.category))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer');

      const arcUpdate = arcEnter.merge(arcs);

      arcUpdate
        .select('path')
        .on('mouseenter', (event, d) => this.onSliceHover(event, d, hoverArc))
        .on('mouseleave', (event, d) => this.onSliceOut(event, d, arc))
        .on('mousemove', (event, d) => this.onSliceMove(event, d))
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
      const isTraditional = window.shouldCalculateTraditionalRates
        ? window.shouldCalculateTraditionalRates(chartType)
        : chartType === 'tradicional';

      // Obter patrimônio total
      const patrimonioInput = document.querySelector('[is-main="true"] .currency-input.individual');
      const patrimonioTotal = patrimonioInput
        ? parseFloat(patrimonioInput.value.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
        : 0;

      const reinoInfo =
        !isTraditional && window.calcularCustoReino
          ? window.calcularCustoReino(patrimonioTotal)
          : null;

      Object.entries(resultData.patrimonio).forEach(([key, item]) => {
        if (item && item.valor > 0) {
          const category = item.category || 'Outros';
          const product = item.product || key;

          let taxaInfo = null;
          let custoTradicional = null;
          let custoReinoProporcional = 0;

          if (isTraditional) {
            // Calcular taxa tradicional para este produto
            if (window.getTaxaTradicional) {
              taxaInfo = window.getTaxaTradicional(category, product);
            }
            if (window.calcularCustoTradicional) {
              custoTradicional = window.calcularCustoTradicional(category, product, item.valor);
            }
          } else {
            // Calcular custo Reino proporcional ao valor do produto
            const somaProdutos = Object.values(resultData.patrimonio).reduce(
              (sum, item) => sum + (item?.valor || 0),
              0
            );
            custoReinoProporcional =
              reinoInfo && somaProdutos > 0
                ? (item.valor / somaProdutos) * reinoInfo.custoAnual
                : 0;
          }

          const currentValue = categoryTotals.get(category) || 0;
          categoryTotals.set(category, currentValue + item.valor);

          if (!categoryDetails.has(category)) {
            categoryDetails.set(category, []);
          }
          categoryDetails.get(category).push({
            product: product,
            value: item.valor,
            percentage: item.percentual || 0,
            taxaTradicional: taxaInfo ? taxaInfo.media : 0,
            custoAnualTradicional: custoTradicional ? custoTradicional.custoAnual : 0,
            custoAnualReino: custoReinoProporcional,
            taxaReino: reinoInfo ? reinoInfo.taxaAnual : 0,
            tipoReino: reinoInfo ? reinoInfo.tipo : 'percentual',
            valorFixoReino: reinoInfo ? reinoInfo.valorFixoAnual : null,
            taxaRange:
              taxaInfo && window.formatarPercentual
                ? `${window.formatarPercentual(taxaInfo.min)} - ${window.formatarPercentual(taxaInfo.max)}`
                : 'N/A',
            isTraditional: isTraditional,
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

      // Obter patrimônio total para cálculo do Reino
      const patrimonioInput =
        document.querySelector('[is-main="true"] .currency-input.individual') ||
        document.querySelector('[input-settings="receive"][is-main="true"]');
      const patrimonioTotal = patrimonioInput ? this.parseCurrencyValue(patrimonioInput.value) : 0;

      patrimonioItems.forEach((item) => {
        const category = item.getAttribute('ativo-category');
        const product = item.getAttribute('ativo-product');
        const input = item.querySelector('[input-settings="receive"]');

        if (!input || !category || !product) return;

        const value = this.parseCurrencyValue(input.value);
        if (value <= 0) return;

        let cost = 0;
        let taxaInfo = null;

        if (chartType === 'tradicional') {
          // Usar função de cálculo tradicional
          if (window.calcularCustoProduto) {
            const resultado = window.calcularCustoProduto(value, category, product);
            cost = resultado.custoMedio || 0;
            taxaInfo = {
              min: resultado.taxaMinima,
              max: resultado.taxaMaxima,
              media: resultado.taxaMedia,
            };
          } else {
            // Fallback para taxa padrão
            cost = value * 0.01;
          }
        } else if (chartType === 'reino') {
          // Calcular custo Reino proporcional
          if (window.calcularCustoReino && patrimonioTotal > 0) {
            const reinoResult = window.calcularCustoReino(patrimonioTotal);
            cost = (value / patrimonioTotal) * reinoResult.custoAnual;
          }
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

    createTooltip() {
      window.d3.select('.d3-donut-tooltip').remove();

      this.tooltip = window.d3
        .select('body')
        .append('div')
        .attr('class', 'd3-donut-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', '#fff')
        .style('padding', '12px')
        .style('border-radius', '8px')
        .style('font-size', '13px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', '1000')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
        .style('border', '1px solid rgba(255,255,255,0.1)');
    }

    onSliceHover(event, d, hoverArc) {
      // Clear any existing hover states
      window.d3.selectAll('.arc path').style('filter', 'brightness(1)');

      // Apply hover to current slice
      window.d3
        .select(event.target)
        .transition()
        .duration(150)
        .attr('d', hoverArc)
        .style('filter', 'brightness(1.1)');

      this.showTooltip(event, d);
    }

    onSliceOut(event, d, normalArc) {
      window.d3
        .select(event.target)
        .transition()
        .duration(150)
        .attr('d', normalArc)
        .style('filter', 'brightness(1)');

      this.hideTooltip();
    }

    onSliceMove(event, d) {
      if (this.tooltip && this.tooltip.style('opacity') > 0) {
        this.tooltip.style('left', event.pageX + 15 + 'px').style('top', event.pageY - 10 + 'px');
      }
    }

    showTooltip(event, d) {
      if (!this.tooltip) return;

      const formatValue = this.formatCurrency(d.data.value);
      const isTraditional = d.data.chartType === 'tradicional';

      // Calcular custo total da categoria
      let custoTotalCategoria = 0;
      let detailsHtml = '';

      if (d.data.details && d.data.details.length > 0) {
        detailsHtml =
          '<div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px;">';

        d.data.details.forEach((detail) => {
          const detailValue = this.formatCurrency(detail.value);

          if (isTraditional) {
            const custoAnual = this.formatCurrency(
              detail.custoAnualTradicional || detail.cost || 0
            );
            const taxa = window.formatarPercentual
              ? window.formatarPercentual(detail.taxaTradicional || detail.taxaInfo?.media || 0)
              : `${(detail.taxaTradicional || detail.taxaInfo?.media || 0).toFixed(2)}%`;

            custoTotalCategoria += detail.custoAnualTradicional || detail.cost || 0;

            detailsHtml += `
              <div style="font-size: 11px; margin: 4px 0; padding: 3px 0;">
                <div style="font-weight: 600;">• ${detail.product}</div>
                <div style="margin-left: 8px; color: #ccc;">
                  Valor: ${detailValue} | Taxa: ${taxa}<br>
                  Custo anual: ${custoAnual}
                </div>
              </div>
            `;
          } else {
            const custoReinoDetail = this.formatCurrency(
              detail.custoAnualReino || detail.cost || 0
            );
            custoTotalCategoria += detail.custoAnualReino || detail.cost || 0;

            detailsHtml += `
              <div style="font-size: 11px; margin: 4px 0; padding: 3px 0;">
                <div style="font-weight: 600;">• ${detail.product}</div>
                <div style="margin-left: 8px; color: #ccc;">
                  Valor: ${detailValue}<br>
                  Custo anual: ${custoReinoDetail}
                </div>
              </div>
            `;
          }
        });
        detailsHtml += '</div>';
      }

      let custoInfo = '';
      if (isTraditional) {
        const custoTotalFormatado = this.formatCurrency(custoTotalCategoria);
        custoInfo = `<div style="color: #ff9999; font-weight: 600; margin-top: 5px;">Custo Tradicional: ${custoTotalFormatado}/ano</div>`;
      } else {
        const custoTotalFormatado = this.formatCurrency(custoTotalCategoria);
        custoInfo = `<div style="color: #90EE90; font-weight: 600; margin-top: 5px;">Reino: ${custoTotalFormatado}/ano</div>`;
      }

      this.tooltip
        .style('opacity', 1)
        .html(
          `
          <div style="font-weight: bold; margin-bottom: 5px;">${d.data.name}</div>
          <div>Valor Total: ${formatValue}</div>
          <div>Percentual: ${d.data.percentage.toFixed(1)}%</div>
          ${custoInfo}
          ${detailsHtml}
        `
        )
        .style('left', event.pageX + 15 + 'px')
        .style('top', event.pageY - 10 + 'px');
    }

    hideTooltip() {
      if (this.tooltip) {
        this.tooltip.transition().duration(150).style('opacity', 0);
      }
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
        font-size: 14px;
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
    }

    refresh() {
      this.updateAllCharts();
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
