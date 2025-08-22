/**
 * D3.js Pie Chart Webflow System - Standalone for Webflow
 * Creates interactive pie charts in the main-area-content div using D3.js
 */

class ReinoD3PieChartWebflowSystem {
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
        '#85C1E9'
      ],
      animationDuration: 750,
      hoverScale: 1.05
    };
  }

  async init() {
    if (this.isInitialized) return;

    try {
      if (document.readyState === 'loading') {
        await new Promise((resolve) => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      await this.waitForD3();
      this.initializeContainer();
      this.setupEventListeners();
      this.isInitialized = true;
      
      console.log('✅ D3 Pie Chart initialized');
    } catch (error) {
      console.error('❌ D3 Pie Chart initialization failed:', error);
    }
  }

  async waitForD3() {
    let attempts = 0;
    const maxAttempts = 50;

    while (!window.d3 && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.d3) {
      throw new Error('D3.js library not found');
    }
  }

  initializeContainer() {
    this.chartContainer = document.querySelector('.main-area-content');

    if (!this.chartContainer) {
      console.warn('⚠️ .main-area-content container not found');
      return;
    }

    this.chartContainer.innerHTML = '';
    this.chartContainer.style.display = 'flex';
    this.chartContainer.style.flexDirection = 'column';
    this.chartContainer.style.justifyContent = 'center';
    this.chartContainer.style.alignItems = 'center';
    this.chartContainer.style.minHeight = '400px';
    this.chartContainer.style.padding = '20px';
  }

  setupEventListeners() {
    // Listen for asset selection changes
    document.addEventListener('assetSelectionChanged', (e) => {
      this.handleAssetSelection(e);
    });

    // Listen for patrimony updates
    document.addEventListener('patrimonioValueChanged', (e) => {
      this.handlePatrimonyUpdate(e);
    });

    // Listen for allocation changes
    document.addEventListener('allocationChanged', (e) => {
      this.handleAllocationChange(e);
    });

    // Listen for resultado sync updates
    document.addEventListener('resultadoSynced', (e) => {
      this.handleResultadoSync(e);
    });

    // Listen for force update requests
    document.addEventListener('updatePieChart', () => {
      this.forceUpdate();
    });
  }

  handlePatrimonyUpdate(event) {
    setTimeout(() => this.forceUpdate(), 100);
  }

  handleAssetSelection(event) {
    setTimeout(() => this.forceUpdate(), 100);
  }

  handleResultadoSync(event) {
    setTimeout(() => this.forceUpdate(), 100);
  }

  handleAllocationChange(event) {
    setTimeout(() => this.forceUpdate(), 200);
  }

  createChart(data) {
    if (!this.chartContainer || !window.d3) return;

    // Clear existing chart
    this.clear();

    if (!data || !Array.isArray(data) || data.length === 0) {
      this.showNoDataMessage();
      return;
    }

    const processedData = this.processData(data);
    if (processedData.length === 0) {
      this.showNoDataMessage();
      return;
    }

    const { width, height, radius } = this.config;

    // Create SVG
    this.svg = d3.select(this.chartContainer)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('font-family', 'Arial, sans-serif');

    const g = this.svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Create pie layout
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);

    // Create arc generator
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const hoverArc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius * this.config.hoverScale);

    // Create color scale
    const color = d3.scaleOrdinal()
      .domain(processedData.map(d => d.name))
      .range(this.config.colors);

    // Create tooltip
    this.createTooltip();

    // Create slices
    const slices = g.selectAll('.slice')
      .data(pie(processedData))
      .enter()
      .append('g')
      .attr('class', 'slice');

    // Add paths
    slices.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.name))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        this.onSliceHover(event, d, hoverArc, color);
      })
      .on('mouseout', (event, d) => {
        this.onSliceOut(event, d, arc);
      })
      .on('click', (event, d) => {
        this.onSliceClick(event, d);
      })
      .transition()
      .duration(this.config.animationDuration)
      .attrTween('d', (d) => {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return (t) => arc(interpolate(t));
      });

    // Add labels
    slices.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '.35em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#fff')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.5)')
      .text(d => d.data.percentage > 5 ? `${d.data.percentage}%` : '')
      .style('opacity', 0)
      .transition()
      .delay(this.config.animationDuration / 2)
      .duration(this.config.animationDuration / 2)
      .style('opacity', 1);

    // Create legend
    this.createLegend(processedData, color);

    this.currentData = processedData;
  }

  showNoDataMessage() {
    if (!this.chartContainer) return;

    this.clear();
    
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
      color: #666;
      min-height: 200px;
    `;

    messageDiv.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
      <h3 style="margin: 0 0 8px 0; color: #333;">Nenhum dado para exibir</h3>
      <p style="margin: 0; font-size: 14px;">Configure sua carteira para visualizar o gráfico</p>
    `;

    this.chartContainer.appendChild(messageDiv);
  }

  processData(data) {
    if (!Array.isArray(data)) return [];

    const validData = data.filter(item => 
      item && 
      typeof item.name === 'string' && 
      typeof item.value === 'number' && 
      item.value > 0
    );

    if (validData.length === 0) return [];

    const total = validData.reduce((sum, item) => sum + item.value, 0);
    
    return validData.map(item => ({
      ...item,
      percentage: Math.round((item.value / total) * 100)
    }));
  }

  createLegend(data, color) {
    if (!this.svg || !data.length) return;

    const legend = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.config.width - 150}, 20)`);

    const legendItems = legend.selectAll('.legend-item')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`);

    legendItems.append('rect')
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', d => color(d.name))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    legendItems.append('text')
      .attr('x', 25)
      .attr('y', 9)
      .attr('dy', '.35em')
      .style('font-size', '12px')
      .style('fill', '#333')
      .text(d => `${d.name} (${d.percentage}%)`);
  }

  createTooltip() {
    if (this.tooltip) {
      this.tooltip.remove();
    }

    this.tooltip = d3.select('body')
      .append('div')
      .attr('class', 'pie-chart-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('z-index', '1000')
      .style('pointer-events', 'none');
  }

  onSliceHover(event, d, hoverArc, color) {
    // Scale up the slice
    d3.select(event.target)
      .transition()
      .duration(200)
      .attr('d', hoverArc)
      .style('filter', 'brightness(1.1)');

    // Show tooltip
    if (this.tooltip) {
      const formatValue = (value) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      };

      this.tooltip
        .style('visibility', 'visible')
        .html(`
          <strong>${d.data.name}</strong><br/>
          Valor: ${formatValue(d.data.value)}<br/>
          Percentual: ${d.data.percentage}%
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    }
  }

  onSliceOut(event, d, arc) {
    // Scale back to normal
    d3.select(event.target)
      .transition()
      .duration(200)
      .attr('d', arc)
      .style('filter', 'brightness(1)');

    // Hide tooltip
    if (this.tooltip) {
      this.tooltip.style('visibility', 'hidden');
    }
  }

  onSliceClick(event, d) {
    console.log('Pie slice clicked:', d.data);
    
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('pieSliceClicked', {
      detail: { data: d.data }
    }));
  }

  updateChart() {
    this.forceUpdate();
  }

  clear() {
    if (this.chartContainer) {
      this.chartContainer.innerHTML = '';
    }
    this.svg = null;
    this.currentData = null;

    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  forceUpdate() {
    // Try to get data from resultado sync system
    let data = null;

    // Try multiple methods to get data
    if (window.ReinoSimpleResultadoSync && typeof window.ReinoSimpleResultadoSync.getResultadoData === 'function') {
      data = window.ReinoSimpleResultadoSync.getResultadoData();
    } else if (window.resultadoSync && typeof window.resultadoSync.getResultadoData === 'function') {
      data = window.resultadoSync.getResultadoData();
    }

    if (data && Array.isArray(data) && data.length > 0) {
      this.createChart(data);
    } else {
      this.showNoDataMessage();
    }
  }

  destroy() {
    this.clear();
    this.isInitialized = false;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasContainer: !!this.chartContainer,
      hasSvg: !!this.svg,
      hasData: !!this.currentData,
      hasTooltip: !!this.tooltip,
      config: this.config
    };
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    if (this.currentData) {
      this.createChart(this.currentData);
    }
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  window.ReinoD3PieChartWebflowSystem = new ReinoD3PieChartWebflowSystem();
  window.ReinoD3PieChartWebflowSystem.init();
});

// Also initialize if DOM already loaded
if (document.readyState === 'loading') {
  // Already set up above
} else {
  window.ReinoD3PieChartWebflowSystem = new ReinoD3PieChartWebflowSystem();
  window.ReinoD3PieChartWebflowSystem.init();
}

// Global API
window.ReinoPieChart = {
  update: () => {
    if (window.ReinoD3PieChartWebflowSystem) {
      window.ReinoD3PieChartWebflowSystem.forceUpdate();
    }
  },
  clear: () => {
    if (window.ReinoD3PieChartWebflowSystem) {
      window.ReinoD3PieChartWebflowSystem.clear();
    }
  },
  getStatus: () => {
    return window.ReinoD3PieChartWebflowSystem ? window.ReinoD3PieChartWebflowSystem.getStatus() : null;
  }
};