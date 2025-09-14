/**
 * Click-Based Product System - Versão Webflow TXT
 * Handles product interaction logic for patrimony allocation items with click-based edit icon triggers
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class ClickProductSystem {
    constructor() {
      this.isInitialized = false;
      this.Motion = null;
      this.globalInteracting = false;
      this.activeSlider = null;
      this.items = [];
    }

    init() {
      if (this.isInitialized) {
        return;
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.waitForMotion();
        });
      } else {
        this.waitForMotion();
      }

      this.isInitialized = true;
    }

    waitForMotion() {
      if (window.Motion) {
        this.Motion = window.Motion;
        this.initClickProductSystem();
      } else {
        setTimeout(() => this.waitForMotion(), 50);
      }
    }

    initClickProductSystem() {
      const { animate } = this.Motion;

      const config = {
        duration: {
          fast: 0.3,
          normal: 0.5,
          slow: 0.6,
        },
        // COMMENTED OUT - No automatic visual state transitions
        // Auto-save is handled by other systems (patrimony-sync, etc.)
        // delay: {
        //   deactivate: 5,
        //   display: 0.45,
        // },
        animation: {
          blur: 8,
          move: 15,
          rotate: 10,
        },
        ease: 'circOut',
      };

      class ClickProductItem {
        constructor(element, index, parentSystem) {
          this.element = element;
          this.index = index;
          this.parentSystem = parentSystem;
          this.activeDiv = element.querySelector('.active-produto-item');
          this.disabledDiv = element.querySelector('.disabled-produto-item');
          this.editIcon = element.querySelector('.edit-icon');
          this.input = element.querySelector('.currency-input.individual');
          this.slider = element.querySelector('range-slider');
          this.sliderThumb = element.querySelector('[data-thumb]');
          this.pinButton = element.querySelector('.pin-function');

          this.state = {
            active: true, // Start in edit mode by default
            interacting: false,
            sliderDragging: false,
            animating: false,
            pinned: false,
          };

          this.deactivateTimer = null;
          this.init(animate, config);
        }

        init(animate, config) {
          if (!this.activeDiv || !this.disabledDiv) {
            return;
          }

          // Start in active mode by default
          this.disabledDiv.style.display = 'none';
          this.activeDiv.style.display = 'block';

          if (this.pinButton) {
            this.pinButton.style.display = 'block';
          }

          this.setupClickEvents(animate, config);

          animate(
            this.element,
            {
              opacity: [0, 1],
              y: [30, 0],
            },
            {
              duration: config.duration.normal,
              ease: config.ease,
              delay: this.index * 0.1,
            }
          );
        }

        setupClickEvents(animate, config) {
          // Edit icon is only visible in disabled state, so it only activates
          if (this.editIcon) {
            this.editIcon.addEventListener('click', (e) => {
              e.stopPropagation();
              if (!this.state.active) {
                this.activate(animate, config);
              }
            });

            this.editIcon.style.cursor = 'pointer';
          }

          if (this.pinButton) {
            this.pinButton.addEventListener('click', (e) => {
              e.stopPropagation();
              this.togglePin(animate);
            });

            this.pinButton.addEventListener('mousedown', (e) => {
              e.stopPropagation();
            });
          }

          if (this.input) {
            this.input.addEventListener('focus', () => {
              this.state.interacting = true;
            });

            this.input.addEventListener('blur', () => {
              this.state.interacting = false;
              // Auto-save happens automatically via other systems
              // No visual state change - only manual via pin button
            });

            this.input.addEventListener('mousedown', (e) => {
              e.stopPropagation();
              this.state.interacting = true;
            });
          }

          if (this.slider) {
            const startSliderDrag = () => {
              this.state.sliderDragging = true;
              this.state.interacting = true;
              this.parentSystem.globalInteracting = true;
              this.parentSystem.activeSlider = this;
              this.slider.classList.add('dragging');
            };

            const endSliderDrag = () => {
              if (this.state.sliderDragging) {
                this.state.sliderDragging = false;
                this.parentSystem.globalInteracting = false;
                this.parentSystem.activeSlider = null;
                this.slider.classList.remove('dragging');

                this.state.interacting = false;
                // Auto-save happens automatically via other systems
                // No visual state change - only manual via pin button
              }
            };

            this.slider.addEventListener('mousedown', startSliderDrag);
            if (this.sliderThumb) {
              this.sliderThumb.addEventListener('mousedown', startSliderDrag);
            }

            this.slider.addEventListener('touchstart', startSliderDrag, { passive: true });
            if (this.sliderThumb) {
              this.sliderThumb.addEventListener('touchstart', startSliderDrag, { passive: true });
            }

            document.addEventListener('mouseup', endSliderDrag);
            document.addEventListener('touchend', endSliderDrag);

            this.slider.addEventListener('click', (e) => {
              e.stopPropagation();
            });

            this.slider.addEventListener('input', () => {
              this.state.interacting = true;
            });
          }

          if (this.parentSystem.Motion.hover && this.parentSystem.Motion.animate) {
            this.parentSystem.Motion.hover(this.element, (element) => {
              this.parentSystem.Motion.animate(
                element,
                {
                  scale: 1,
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                },
                {
                  duration: 0.2,
                  ease: 'circOut',
                }
              );

              return () => {
                this.parentSystem.Motion.animate(
                  element,
                  {
                    scale: 1,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  },
                  {
                    duration: 0.15,
                    ease: 'circOut',
                  }
                );
              };
            });
          }
        }

        // toggleState removed - edit icon only activates, pin button only deactivates

        togglePin(animate) {
          // Pin button acts as a "save and close" button
          // Auto-save is handled by other systems, this just changes visual state
          if (this.state.active) {
            // Force visual deactivation immediately (data is auto-saved by other systems)
            this.state.interacting = false;
            this.state.pinned = false;
            clearTimeout(this.deactivateTimer);

            // Immediate visual deactivation when pin is clicked - no delay
            this.deactivate(animate, {
              duration: { fast: 0.3, normal: 0.5 },
              animation: { move: 15 },
              ease: 'circOut',
            });
          }
        }

        async activate(animate, config) {
          if (this.state.active || this.state.animating) {
            return;
          }

          clearTimeout(this.deactivateTimer);

          this.state.active = true;
          this.state.animating = true;
          this.state.interacting = true;

          await animate(
            this.disabledDiv,
            {
              opacity: 0,
              y: -config.animation.move,
              filter: `blur(${config.animation.blur}px)`,
            },
            {
              duration: config.duration.fast,
              ease: 'circIn',
            }
          ).finished;

          this.disabledDiv.style.display = 'none';
          this.activeDiv.style.display = 'block';

          if (this.pinButton) {
            this.pinButton.style.display = 'block';
            animate(
              this.pinButton,
              {
                opacity: [0, 1],
                scale: [0.8, 1],
              },
              {
                duration: 0.3,
                ease: 'backOut',
                delay: 0.1,
              }
            );
          }

          await animate(
            this.activeDiv,
            {
              opacity: [0, 1],
              y: [config.animation.move, 0],
              filter: ['blur(5px)', 'blur(0px)'],
            },
            {
              duration: config.duration.normal,
              ease: 'backOut',
            }
          ).finished;

          this.state.animating = false;
        }

        /* COMMENTED OUT - No automatic visual state change, only manual via pin button
         * Auto-save functionality is handled by other systems (patrimony-sync, etc.)
         * This only controls the visual state transitions between active/disabled views
        scheduleDeactivate(animate, config) {
          clearTimeout(this.deactivateTimer);

          if (
            this.state.interacting ||
            this.state.sliderDragging ||
            this.parentSystem.globalInteracting
          ) {
            return;
          }

          this.deactivateTimer = setTimeout(() => {
            if (
              !this.state.interacting &&
              !this.state.sliderDragging &&
              !this.parentSystem.globalInteracting
            ) {
              this.deactivate(animate, config);
            }
          }, config.delay.deactivate * 1000);
        }
        */

        async deactivate(animate, config) {
          if (!this.state.active || this.state.animating || this.state.sliderDragging) {
            return;
          }

          this.state.active = false;
          this.state.animating = true;
          this.state.interacting = false;

          if (this.pinButton) {
            await animate(
              this.pinButton,
              {
                opacity: 0,
                scale: 0.8,
              },
              {
                duration: 0.2,
                ease: 'circIn',
              }
            ).finished;
            this.pinButton.style.display = 'none';
          }

          await animate(
            this.activeDiv,
            {
              opacity: 0,
              y: config.animation.move / 2,
              filter: 'blur(5px)',
            },
            {
              duration: config.duration.fast,
              ease: config.ease,
            }
          ).finished;

          this.activeDiv.style.display = 'none';
          this.disabledDiv.style.display = 'flex';

          await animate(
            this.disabledDiv,
            {
              opacity: [0, 1],
              y: [0, 0],
              filter: ['blur(5px)', 'blur(0px)'],
            },
            {
              duration: config.duration.normal,
              ease: config.ease,
            }
          ).finished;

          this.state.animating = false;
        }
      }

      const items = document.querySelectorAll('.patrimonio_interactive_item');

      items.forEach((item, index) => {
        this.items.push(new ClickProductItem(item, index, this));
      });

      this.addDragStyles();
    }

    addDragStyles() {
      const style = document.createElement('style');
      style.textContent = `
        range-slider.dragging {
          cursor: grabbing !important;
        }
        range-slider.dragging [data-thumb] {
          cursor: grabbing !important;
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
      `;
      document.head.appendChild(style);
    }

    getItems() {
      return this.items;
    }

    resetAllItems() {
      this.items.forEach((item) => {
        if (item.state.active) {
          item.deactivate(this.Motion.animate, {
            duration: { fast: 0.3 },
            animation: { move: 15 },
          });
        }
      });
    }

    forceUpdate() {
      if (this.items.length === 0) {
        this.initClickProductSystem();
      }
    }
  }

  window.ClickProductSystem = ClickProductSystem;

  window.clickProductSystem = new ClickProductSystem();

  // Backward compatibility - replace the old system with the new one
  window.ReinoProductSystem = window.clickProductSystem;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.clickProductSystem.init();
    });
  } else {
    window.clickProductSystem.init();
  }
})();
