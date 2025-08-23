/**
 * Simple Hover Module
 * Versão simplificada do Enhanced Hover Module para uso direto no Webflow
 */

(function () {
  'use strict';

  class SimpleHoverModule {
    constructor(options = {}) {
      this.options = {
        offset: { x: 15, y: -10 },
        animationDuration: 150,
        className: 'simple-tooltip',
        ...options,
      };

      this.state = {
        activeTooltip: null,
        isVisible: false,
      };
    }

    createTooltip(className = 'simple-tooltip') {
      if (!window.d3) {
        return null;
      }

      const tooltip = window.d3
        .select('body')
        .append('div')
        .attr('class', className)
        .style('position', 'fixed')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', '#fff')
        .style('padding', '12px')
        .style('border-radius', '8px')
        .style('font-size', '14px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('visibility', 'hidden')
        .style('z-index', '10000')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
        .style('border', '1px solid rgba(255,255,255,0.1)')
        .style('max-width', '300px')
        .style('word-wrap', 'break-word');

      return tooltip;
    }

    attachHoverEvents(selection, options = {}) {
      const {
        onHover = () => {},
        onOut = () => {},
        onMove = () => {},
        tooltipContent = () => '',
        className = 'simple-tooltip',
      } = options;

      selection
        .on('mouseenter', (event, d) => {
          this.showTooltip(event, d, tooltipContent, className);
          onHover(event, d);
        })
        .on('mouseleave', (event, d) => {
          this.hideTooltip();
          onOut(event, d);
        })
        .on('mousemove', (event, d) => {
          this.updateTooltipPosition(event);
          onMove(event, d);
        });
    }

    showTooltip(event, data, contentFunction, className = 'simple-tooltip') {
      if (!this.state.activeTooltip) {
        this.state.activeTooltip = this.createTooltip(className);
      }

      if (!this.state.activeTooltip) {
        return;
      }

      const content = contentFunction(data);
      this.state.activeTooltip.html(content);

      this.updateTooltipPosition(event);

      this.state.activeTooltip
        .transition()
        .duration(this.options.animationDuration)
        .style('opacity', 1)
        .style('visibility', 'visible');

      this.state.isVisible = true;
    }

    hideTooltip() {
      if (this.state.activeTooltip && this.state.isVisible) {
        this.state.activeTooltip
          .transition()
          .duration(this.options.animationDuration)
          .style('opacity', 0)
          .style('visibility', 'hidden');

        this.state.isVisible = false;
      }
    }

    updateTooltipPosition(event) {
      if (!this.state.activeTooltip || !this.state.isVisible) return;

      const mouseX = event.clientX;
      const mouseY = event.clientY;
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let tooltipWidth = 300;
      let tooltipHeight = 100;

      if (this.state.activeTooltip) {
        const tooltipNode = this.state.activeTooltip.node();
        if (tooltipNode) {
          const rect = tooltipNode.getBoundingClientRect();
          tooltipWidth = rect.width || tooltipWidth;
          tooltipHeight = rect.height || tooltipHeight;
        }
      }

      let x = mouseX + this.options.offset.x;
      let y = mouseY + this.options.offset.y;

      if (x + tooltipWidth + 20 > viewport.width) {
        x = mouseX - tooltipWidth - Math.abs(this.options.offset.x);
      }

      if (y + tooltipHeight + 20 > viewport.height) {
        y = mouseY - tooltipHeight - Math.abs(this.options.offset.y);
      }

      x = Math.max(20, Math.min(x, viewport.width - tooltipWidth - 20));
      y = Math.max(20, Math.min(y, viewport.height - tooltipHeight - 20));

      this.state.activeTooltip
        .style('left', x + 'px')
        .style('top', y + 'px');
    }

    onSliceHover(event, d, hoverArc, contentFunction) {
      if (hoverArc) {
        window.d3.selectAll('.arc path').style('filter', 'brightness(1)');
        window.d3
          .select(event.target)
          .transition()
          .duration(this.options.animationDuration)
          .attr('d', hoverArc)
          .style('filter', 'brightness(1.1)');
      }

      this.showTooltip(event, d, contentFunction);
    }

    onSliceOut(event, d, normalArc) {
      if (normalArc) {
        window.d3
          .select(event.target)
          .transition()
          .duration(this.options.animationDuration)
          .attr('d', normalArc)
          .style('filter', 'brightness(1)');
      }

      this.hideTooltip();
    }

    onSliceMove(event, d) {
      this.updateTooltipPosition(event);
    }

    destroy() {
      if (this.state.activeTooltip) {
        this.state.activeTooltip.remove();
        this.state.activeTooltip = null;
      }
      this.state.isVisible = false;
    }
  }

  window.SimpleHoverModule = SimpleHoverModule;
})();
