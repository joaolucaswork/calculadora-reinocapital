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
        isPinned: false,
      };

      // Callback for when tooltip is unpinned
      this.onUnpinCallback = null;
    }

    createTooltip(className = 'simple-tooltip') {
      if (!window.d3) {
        return null;
      }

      // Use light theme for donut chart tooltips, dark for others
      const isDonutTooltip = className.includes('d3-donut-tooltip');

      const tooltip = window.d3
        .select('body')
        .append('div')
        .attr('class', className)
        .style('position', 'fixed')
        .style('background', isDonutTooltip ? '#ffffff' : 'rgba(0, 0, 0, 0.9)')
        .style('color', isDonutTooltip ? '#111827' : '#fff')
        .style('padding', isDonutTooltip ? '16px' : '12px')
        .style('border-radius', isDonutTooltip ? '12px' : '8px')
        .style('font-size', '14px')
        .style('font-family', 'Satoshi Variable, Arial, sans-serif')
        .style('font-weight', '500')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('visibility', 'hidden')
        .style('z-index', '10000')
        .style(
          'box-shadow',
          isDonutTooltip ? '0 10px 25px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.3)'
        )
        .style('border', isDonutTooltip ? '1px solid #e5e7eb' : '1px solid rgba(255,255,255,0.1)')
        .style('max-width', isDonutTooltip ? '280px' : '300px')
        .style('word-wrap', 'break-word');

      return tooltip;
    }

    togglePinnedTooltip(event, data, contentFunction, className = 'simple-tooltip') {
      // Always pin the new tooltip, replacing any existing pinned tooltip
      this.pinTooltip(event, data, contentFunction, className);
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
          // Don't update position when tooltip is pinned
          if (!this.state.isPinned) {
            this.updateTooltipPosition(event);
          }
          onMove(event, d);
        });
    }

    showTooltip(event, data, contentFunction, className = 'simple-tooltip') {
      // Don't show hover tooltips when a tooltip is pinned
      if (this.state.isPinned) {
        return;
      }

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
      if (this.state.isPinned) {
        return;
      }

      if (this.state.activeTooltip && this.state.isVisible) {
        this.state.activeTooltip
          .transition()
          .duration(this.options.animationDuration)
          .style('opacity', 0)
          .style('visibility', 'hidden');

        this.state.isVisible = false;
      }
    }

    pinTooltip(event, data, contentFunction, className = 'simple-tooltip') {
      if (!this.state.activeTooltip) {
        this.state.activeTooltip = this.createTooltip(className);
      }

      if (!this.state.activeTooltip) return;

      const content = contentFunction(data);
      this.state.activeTooltip.html(content);

      this.state.isPinned = true;
      this.state.isVisible = true;

      this.state.activeTooltip.style('pointer-events', 'auto').style('user-select', 'text');

      // Prevent clicks inside tooltip from closing it
      this.state.activeTooltip.on('click', (e) => {
        e.stopPropagation();
      });

      this.updateTooltipPosition(event);

      this.state.activeTooltip
        .transition()
        .duration(this.options.animationDuration)
        .style('opacity', 1)
        .style('visibility', 'visible');

      this.setupEscapeHandler();
    }

    unpinTooltip() {
      if (this.state.activeTooltip && this.state.isPinned) {
        // Remove click event listener
        this.state.activeTooltip.on('click', null);

        this.state.activeTooltip
          .style('pointer-events', 'none')
          .style('user-select', 'none')
          .transition()
          .duration(this.options.animationDuration)
          .style('opacity', 0)
          .style('visibility', 'hidden');
      }

      this.state.isPinned = false;
      this.state.isVisible = false;

      this.removeEscapeHandler();

      // Notify parent component that tooltip was unpinned
      if (this.onUnpinCallback) {
        this.onUnpinCallback();
      }
    }

    setupEscapeHandler() {
      const handleEscape = (event) => {
        if (event.key === 'Escape' && this.state.isPinned) {
          this.unpinTooltip();
        }
      };

      document.addEventListener('keydown', handleEscape);
      this._escapeHandler = handleEscape;
    }

    removeEscapeHandler() {
      if (this._escapeHandler) {
        document.removeEventListener('keydown', this._escapeHandler);
        this._escapeHandler = null;
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

      this.state.activeTooltip.style('left', x + 'px').style('top', y + 'px');
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
      this.unpinTooltip();

      if (this.state.activeTooltip) {
        this.state.activeTooltip.remove();
        this.state.activeTooltip = null;
      }
      this.state.isVisible = false;
    }
  }

  window.SimpleHoverModule = SimpleHoverModule;
})();
