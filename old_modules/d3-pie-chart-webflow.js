/**
 * D3.js Pie Chart Webflow Integration System
 * Creates interactive pie charts in the main-area-content div using D3.js
 *
 * Features:
 * ✅ D3.js powered pie chart with smooth animations
 * ✅ Hover effects and tooltips
 * ✅ Responsive design
 * ✅ Integration with app-calc-reino data
 * ✅ Automatic updates when data changes
 */

import * as d3 from 'd3';

import { eventCoordinator } from './event-coordinator.js';

export class D3PieChartWebflowSystem {
  constructor() {
    this.isInitialized = false;
    this.chartContainer = null;
    this.svg = null;
    this.currentData = null;
    this.tooltip = null;
    this.config = {
      width: 400,
      height: 400,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      radius: 150,
      colors: [
        '#FF6B6B',
        '#4ECDC4',
        '#45B7D1',
        '#96CEB4',
        '#FFEAA7',
        '#DDA0DD',
        '#98D8C8',
        '#F7DC6F',
        '#BB8FCE',
        '#85C1E9',
      ],
      animationDuration: 750,
      hoverScale: 1.05,
    };
  }

  async init() {
    if (this.isInitialized) return;

    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise((resolve) => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Initialize chart container
      this.initializeContainer();

      // Setup event listeners
      this.setupEventListeners();

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ [D3PieChart] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize the chart container in main-area-content
   */
  initializeContainer() {
    // Find the main-area-content div
    this.chartContainer = document.querySelector('.main-area-content');

    if (!this.chartContainer) {
      return;
    }

    // Clear any existing content
    this.chartContainer.innerHTML = '';

    // Set container styles
    this.chartContainer.style.display = 'flex';
    this.chartContainer.style.flexDirection = 'column';
    this.chartContainer.style.justifyContent = 'center';
    this.chartContainer.style.alignItems = 'center';
    this.chartContainer.style.minHeight = '400px';
    this.chartContainer.style.padding = '20px';
  }

  /**
   * Setup event listeners for data updates
   */
  setupEventListeners() {
    // Register listeners with EventCoordinator
    eventCoordinator.registerListener('d3-pie-chart', 'input', (e) => {
      // Listen for input changes that might affect chart data
      this.handleInputChange(e);
    });

    // Setup custom event listeners for chart updates
    this.setupCustomEventListeners();
  }

  /**
   * Setup custom event listeners for chart-specific events
   */
  setupCustomEventListeners() {
    // Bind methods to preserve 'this' context
    this.handlePatrimonyUpdate = this.handlePatrimonyUpdate.bind(this);
    this.handleAssetSelection = this.handleAssetSelection.bind(this);
    this.handleResultadoSync = this.handleResultadoSync.bind(this);
    this.handleAllocationChange = this.handleAllocationChange.bind(this);
    this.handleForceUpdate = this.handleForceUpdate.bind(this);

    // Listen for patrimony main value changes
    document.addEventListener('patrimonyMainValueChanged', this.handlePatrimonyUpdate);
    document.addEventListener('totalPatrimonyChanged', this.handlePatrimonyUpdate);

    // Listen for asset selection changes (this is the key event!)
    document.addEventListener('assetSelectionChanged', this.handleAssetSelection);
    document.addEventListener('assetFilterChanged', this.handleAssetSelection);

    // Listen for allocation changes
    document.addEventListener('allocationChanged', this.handleAllocationChange);
    document.addEventListener('currencyInputChanged', this.handleAllocationChange);

    // Listen for force update events
    document.addEventListener('forceResultadoUpdate', this.handleForceUpdate);

    // Listen for resultado sync events
    document.addEventListener('resultadoSyncReady', this.handleResultadoSync);

    // Listen for patrimony sync ready
    document.addEventListener('patrimonySyncReady', this.handlePatrimonyUpdate);
  }

  /**
   * Handle patrimony sync updates
   */
  handlePatrimonyUpdate() {
    // Force update with current data from resultado sync
    this.forceUpdate();
  }

  /**
   * Handle asset selection changes
   */
  handleAssetSelection() {
    // When assets are selected/deselected, update the chart
    setTimeout(() => {
      this.forceUpdate();
    }, 150); // Slightly longer delay to ensure all systems have processed the change
  }

  /**
   * Handle resultado sync completion
   */
  handleResultadoSync() {
    // When resultado sync is ready, create the chart
    setTimeout(() => {
      this.forceUpdate();
    }, 200); // Small delay to ensure all data is synced
  }

  /**
   * Handle input changes that might affect chart
   */
  handleInputChange() {
    // Debounce input changes to avoid excessive updates
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
    }

    this.inputTimeout = setTimeout(() => {
      this.forceUpdate();
    }, 300); // Reduced delay for more responsive updates
  }

  /**
   * Handle allocation changes (sliders, inputs)
   */
  handleAllocationChange() {
    // Debounce allocation changes
    if (this.allocationTimeout) {
      clearTimeout(this.allocationTimeout);
    }

    this.allocationTimeout = setTimeout(() => {
      this.forceUpdate();
    }, 200);
  }

  /**
   * Handle force update events
   */
  handleForceUpdate() {
    // Immediate update for force events
    this.forceUpdate();
  }

  /**
   * Create or update the pie chart
   */
  createChart(data) {
    if (!this.chartContainer) {
      return;
    }

    // Clear existing chart
    this.chartContainer.innerHTML = '';

    const { width, height, radius } = this.config;

    const processedData = this.processData(data);

    if (processedData.length === 0) {
      this.showNoDataMessage();
      return;
    }

    // Create SVG
    this.svg = d3
      .select(this.chartContainer)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', 'transparent');

    const g = this.svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Create pie generator
    const pie = d3
      .pie()
      .value((d) => d.value)
      .sort(null);

    // Create arc generator
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    // Create hover arc (slightly larger)
    const hoverArc = d3
      .arc()
      .innerRadius(0)
      .outerRadius(radius * this.config.hoverScale);

    const pieData = pie(processedData);

    const color = d3
      .scaleOrdinal()
      .domain(processedData.map((d) => d.name))
      .range(this.config.colors);

    // Create slices
    const slices = g.selectAll('.slice').data(pieData).enter().append('g').attr('class', 'slice');

    // Add paths with animation
    slices
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.data.name))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('opacity', 0)
      .on('mouseover', (event, d) => this.onSliceHover(event, d, hoverArc))
      .on('mouseout', (event, d) => this.onSliceOut(event, d, arc))
      .on('click', (event, d) => this.onSliceClick(event, d))
      .transition()
      .duration(this.config.animationDuration)
      .delay((d, i) => i * 100)
      .style('opacity', 1);

    // Add labels with enhanced visibility for small slices
    slices
      .append('text')
      .attr('transform', (d) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .attr('stroke', '#000')
      .attr('stroke-width', '0.5px')
      .style('opacity', 0)
      .text((d) => `${d.data.percentage.toFixed(1)}%`)
      .transition()
      .duration(this.config.animationDuration)
      .delay((d, i) => i * 100 + 200)
      .style('opacity', 1);

    // Create legend
    this.createLegend(processedData, color);

    // Create tooltip
    this.createTooltip();

    this.currentData = data;
  }

  /**
   * Show message when no data is available
   */
  showNoDataMessage() {
    const messageDiv = d3
      .select(this.chartContainer)
      .append('div')
      .style('text-align', 'center')
      .style('color', '#666')
      .style('font-size', '16px')
      .style('padding', '40px');

    messageDiv.append('div').style('font-size', '48px').style('margin-bottom', '10px').text('📊');

    messageDiv.append('div').text('Nenhum dado disponível para exibir o gráfico');

    messageDiv
      .append('div')
      .style('font-size', '14px')
      .style('margin-top', '10px')
      .style('color', '#999')
      .text('Complete o formulário para ver sua alocação de ativos');
  }

  /**
   * Process raw data into chart format
   */
  processData(data) {
    if (!data) {
      const resultadoSync = window.ReinoCalculator?.systems?.resultadoSync;
      if (resultadoSync && typeof resultadoSync.getResultadoData === 'function') {
        data = resultadoSync.getResultadoData();
      }
    }

    if (!data || !data.patrimonio) {
      return [];
    }

    const chartData = [];

    if (data.patrimonio && typeof data.patrimonio === 'object') {
      Object.entries(data.patrimonio).forEach(([key, item]) => {
        if (item && item.valor > 0) {
          chartData.push({
            name: item.product || key,
            value: item.valor,
            percentage: item.percentual || 0,
            category: item.category || 'Outros',
            originalData: item,
          });
        }
      });
    }

    return chartData;
  }

  /**
   * Create legend for the chart
   */
  createLegend(data, colorScale) {
    const legendContainer = d3
      .select(this.chartContainer)
      .append('div')
      .style('margin-top', '20px')
      .style('display', 'flex')
      .style('flex-wrap', 'wrap')
      .style('justify-content', 'center')
      .style('gap', '10px')
      .style('max-width', '400px');

    // Create legend items using D3.js data binding
    const legendItems = legendContainer
      .selectAll('.legend-item')
      .data(data)
      .enter()
      .append('div')
      .attr('class', 'legend-item')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '5px')
      .style('padding', '5px 10px')
      .style('background', '#f8f9fa')
      .style('border-radius', '15px')
      .style('font-size', '12px')
      .style('cursor', 'pointer')
      .style('opacity', 0);

    // Add color indicators
    legendItems
      .append('div')
      .style('width', '12px')
      .style('height', '12px')
      .style('border-radius', '50%')
      .style('background', (d) => colorScale(d.name));

    // Add text labels
    legendItems.append('span').text((d) => `${d.name}: ${d.percentage.toFixed(1)}%`);

    // Animate legend items
    legendItems
      .transition()
      .duration(this.config.animationDuration)
      .delay((d, i) => i * 50 + 400)
      .style('opacity', 1);
  }

  /**
   * Create tooltip element
   */
  createTooltip() {
    // Remove existing tooltip
    d3.select('.d3-pie-tooltip').remove();

    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'd3-pie-tooltip')
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

  /**
   * Handle slice hover
   */
  onSliceHover(event, d, hoverArc) {
    // Animate slice expansion
    d3.select(event.target)
      .transition()
      .duration(200)
      .attr('d', hoverArc)
      .style('filter', 'brightness(1.1)');

    // Show tooltip
    if (this.tooltip) {
      const formatValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(d.data.value);

      this.tooltip
        .style('opacity', 1)
        .html(
          `
          <div style="font-weight: bold; margin-bottom: 5px;">${d.data.name}</div>
          <div>Valor: ${formatValue}</div>
          <div>Percentual: ${d.data.percentage.toFixed(1)}%</div>
          <div style="font-size: 11px; margin-top: 5px; opacity: 0.8;">Clique para mais detalhes</div>
        `
        )
        .style('left', event.pageX + 15 + 'px')
        .style('top', event.pageY - 10 + 'px');
    }
  }

  /**
   * Handle slice mouse out
   */
  onSliceOut(event, d, arc) {
    // Animate slice back to normal
    d3.select(event.target)
      .transition()
      .duration(200)
      .attr('d', arc)
      .style('filter', 'brightness(1)');

    // Hide tooltip
    if (this.tooltip) {
      this.tooltip.style('opacity', 0);
    }
  }

  /**
   * Handle slice click
   */
  onSliceClick(event, d) {
    // Emit custom event for other systems
    document.dispatchEvent(
      new CustomEvent('pieChartSliceClicked', {
        detail: {
          data: d.data,
          event: event,
        },
      })
    );

    // Add click animation
    d3.select(event.target)
      .transition()
      .duration(150)
      .style('transform', 'scale(0.95)')
      .transition()
      .duration(150)
      .style('transform', 'scale(1)');
  }

  /**
   * Update chart with new data
   */
  updateChart(data) {
    if (!this.isInitialized) return;

    this.createChart(data);
  }

  /**
   * Animate chart entrance
   */
  animateChart() {
    if (!this.svg) return;

    // Animate slices
    this.svg
      .selectAll('.slice path')
      .style('opacity', 0)
      .transition()
      .duration(this.config.animationDuration)
      .delay((d, i) => i * 100)
      .style('opacity', 1);

    // Animate labels
    this.svg
      .selectAll('.slice text')
      .style('opacity', 0)
      .transition()
      .duration(this.config.animationDuration)
      .delay((d, i) => i * 100 + 200)
      .style('opacity', 1);
  }

  /**
   * Get current chart data
   */
  getData() {
    return this.currentData;
  }

  /**
   * Update chart configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    if (this.currentData) {
      this.createChart(this.currentData);
    }
  }

  /**
   * Clear the chart
   */
  clear() {
    if (this.chartContainer) {
      this.chartContainer.innerHTML = '';
    }

    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }

    this.svg = null;
    this.currentData = null;
  }

  /**
   * Destroy the system
   */
  destroy() {
    this.clear();

    // Remove event listeners from EventCoordinator
    eventCoordinator.removeListener('d3-pie-chart');

    // Remove document event listeners
    document.removeEventListener('patrimonyMainValueChanged', this.handlePatrimonyUpdate);
    document.removeEventListener('totalPatrimonyChanged', this.handlePatrimonyUpdate);
    document.removeEventListener('assetSelectionChanged', this.handleAssetSelection);
    document.removeEventListener('assetFilterChanged', this.handleAssetSelection);
    document.removeEventListener('resultadoSyncReady', this.handleResultadoSync);
    document.removeEventListener('patrimonySyncReady', this.handlePatrimonyUpdate);

    // Clear timeout
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
      this.inputTimeout = null;
    }

    this.isInitialized = false;
  }

  /**
   * Get system status for debugging
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasContainer: !!this.chartContainer,
      hasSvg: !!this.svg,
      hasData: !!this.currentData,
      hasTooltip: !!this.tooltip,
      config: this.config,
    };
  }

  /**
   * Force update with current resultado data
   */
  forceUpdate() {
    // Try multiple ways to access the resultado sync system
    let resultadoSync = null;

    // Method 1: Via global ReinoCalculator
    if (window.ReinoCalculator?.systems?.resultadoSync) {
      resultadoSync = window.ReinoCalculator.systems.resultadoSync;
    }

    // Method 2: Via global AppCalcReino
    if (!resultadoSync && window.AppCalcReino?.getModule) {
      resultadoSync = window.AppCalcReino.getModule('resultadoSync');
    }

    // Method 3: Via direct global access
    if (!resultadoSync && window.resultadoSync) {
      resultadoSync = window.resultadoSync;
    }

    if (resultadoSync && typeof resultadoSync.getResultadoData === 'function') {
      const data = resultadoSync.getResultadoData();
      this.createChart(data);
    } else {
      // Show no data message
      this.showNoDataMessage();
    }
  }
}

// Expose debug methods globally for testing
if (typeof window !== 'undefined') {
  window.debugD3PieChart = () => {
    const system = window.ReinoCalculator?.systems?.d3PieChart;
    if (system) {
      return system.getStatus();
    }
    return null;
  };

  window.testD3PieChart = () => {
    const system = window.ReinoCalculator?.systems?.d3PieChart;
    if (system) {
      // Test with sample data
      const testData = {
        patrimonio: {
          'Renda Variável-Ações': {
            valor: 50000,
            percentual: 50,
            category: 'Renda Variável',
            product: 'Ações',
          },
          'Renda Fixa-CDB': {
            valor: 30000,
            percentual: 30,
            category: 'Renda Fixa',
            product: 'CDB',
          },
          'Fundos-Multimercado': {
            valor: 20000,
            percentual: 20,
            category: 'Fundos',
            product: 'Multimercado',
          },
        },
        total: 100000,
      };
      system.createChart(testData);
      return 'Test chart created';
    }
    return 'System not found';
  };

  window.forceUpdateD3PieChart = () => {
    const system = window.ReinoCalculator?.systems?.d3PieChart;
    if (system) {
      system.forceUpdate();
      return 'Chart updated';
    }
    return 'System not found';
  };
}
