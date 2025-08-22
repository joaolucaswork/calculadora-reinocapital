/**
 * Product System - Versão Webflow TXT
 * Handles product interaction logic for patrimony allocation items
 * Versão sem imports/exports para uso direto no Webflow
 */

(function() {
  'use strict';

  class ProductSystem {
    constructor() {
      this.isInitialized = false;
      this.Motion = null;
      this.globalInteracting = false;
      this.activeSlider = null;
      this.items = [];
    }

    init() {
      if (this.isInitialized) {
        console.warn('🔄 Product System já inicializado');
        return;
      }

      console.warn('🚀 Iniciando Product System');

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
        console.warn('✅ Motion.js encontrado, inicializando sistema de produtos');
        this.initProductSystem();
      } else {
        console.warn('⏳ Aguardando Motion.js...');
        setTimeout(() => this.waitForMotion(), 50);
      }
    }

    initProductSystem() {
      const { animate, hover } = this.Motion;

      // Configuração simplificada
      const config = {
        duration: {
          fast: 0.3,
          normal: 0.5,
          slow: 0.6,
        },
        delay: {
          deactivate: 1,
          display: 0.45,
        },
        animation: {
          blur: 8,
          move: 15,
          rotate: 10,
        },
        ease: 'circOut',
      };

      // Classe para gerenciar cada item
      class ProductItem {
        constructor(element, index, parentSystem) {
          this.element = element;
          this.index = index;
          this.parentSystem = parentSystem;
          this.activeDiv = element.querySelector('.active-produto-item');
          this.disabledDiv = element.querySelector('.disabled-produto-item');
          this.input = element.querySelector('.currency-input.individual');
          this.slider = element.querySelector('range-slider');
          this.sliderThumb = element.querySelector('[data-thumb]');
          this.pinButton = element.querySelector('.pin-function');

          this.state = {
            active: false,
            interacting: false,
            sliderDragging: false,
            animating: false,
            pinned: false,
          };

          this.deactivateTimer = null;
          this.init(animate, config);
        }

        init(animate, config) {
          if (!this.activeDiv || !this.disabledDiv) return;

          // Estado inicial
          this.activeDiv.style.display = 'none';
          this.disabledDiv.style.display = 'flex';

          if (this.pinButton) {
            this.pinButton.style.display = 'none';
          }

          this.setupEvents(animate, config);

          // Animação de entrada
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

        setupEvents(animate, config) {
          if (this.pinButton) {
            this.pinButton.addEventListener('click', (e) => {
              e.stopPropagation();
              this.togglePin(animate);
            });

            this.pinButton.addEventListener('mousedown', (e) => {
              e.stopPropagation();
            });
          }

          // Eventos do container
          const startInteraction = () => {
            if (this.parentSystem.activeSlider && this.parentSystem.activeSlider !== this) return;
            this.state.interacting = true;
            this.activate(animate, config);
          };

          const endInteraction = () => {
            if (!this.state.sliderDragging && !this.state.pinned) {
              this.state.interacting = false;
              this.scheduleDeactivate(animate, config);
            }
          };

          this.element.addEventListener('mouseenter', startInteraction);
          this.element.addEventListener('mouseleave', () => {
            if (
              !this.state.sliderDragging &&
              !this.parentSystem.globalInteracting &&
              !this.state.pinned
            ) {
              endInteraction();
            }
          });

          this.element.addEventListener('touchstart', startInteraction, { passive: true });

          // Input events
          if (this.input) {
            this.input.addEventListener('focus', () => {
              this.state.interacting = true;
              this.activate(animate, config);
            });

            this.input.addEventListener('blur', () => {
              if (!this.state.pinned) {
                this.state.interacting = false;
                this.scheduleDeactivate(animate, config);
              }
            });

            this.input.addEventListener('mousedown', (e) => {
              e.stopPropagation();
              this.state.interacting = true;
            });
          }

          // Eventos do Slider
          if (this.slider) {
            const startSliderDrag = () => {
              this.state.sliderDragging = true;
              this.state.interacting = true;
              this.parentSystem.globalInteracting = true;
              this.parentSystem.activeSlider = this;
              this.activate(animate, config);
              this.slider.classList.add('dragging');
            };

            const endSliderDrag = () => {
              if (this.state.sliderDragging) {
                this.state.sliderDragging = false;
                this.parentSystem.globalInteracting = false;
                this.parentSystem.activeSlider = null;
                this.slider.classList.remove('dragging');

                const mouseOverElement = this.element.matches(':hover');
                if (!mouseOverElement && !this.state.pinned) {
                  this.state.interacting = false;
                  this.scheduleDeactivate(animate, config);
                }
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
              this.activate(animate, config);
            });
          }

          // Hover effect usando Motion
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

        togglePin(animate) {
          this.state.pinned = !this.state.pinned;

          if (this.state.pinned) {
            this.pinButton.classList.add('active');
            clearTimeout(this.deactivateTimer);
          } else {
            this.pinButton.classList.remove('active');
            if (!this.state.interacting && !this.state.sliderDragging) {
              this.scheduleDeactivate(animate, { delay: { deactivate: 1 } });
            }
          }

          animate(
            this.pinButton,
            {
              scale: [1.2, 1],
              rotate: this.state.pinned ? 45 : 0,
            },
            {
              duration: 0.3,
              ease: 'backOut',
            }
          );
        }

        async activate(animate, config) {
          if (this.state.active || this.state.animating) return;

          clearTimeout(this.deactivateTimer);
          this.state.active = true;
          this.state.animating = true;

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

        scheduleDeactivate(animate, config) {
          clearTimeout(this.deactivateTimer);

          if (
            this.state.interacting ||
            this.state.sliderDragging ||
            this.parentSystem.globalInteracting ||
            this.state.pinned
          ) {
            return;
          }

          this.deactivateTimer = setTimeout(() => {
            if (
              !this.state.interacting &&
              !this.state.sliderDragging &&
              !this.parentSystem.globalInteracting &&
              !this.state.pinned
            ) {
              this.deactivate(animate, config);
            }
          }, config.delay.deactivate * 1000);
        }

        async deactivate(animate, config) {
          if (
            !this.state.active ||
            this.state.animating ||
            this.state.sliderDragging ||
            this.state.pinned
          )
            return;

          this.state.active = false;
          this.state.animating = true;

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

      // Inicializa todos os items
      const items = document.querySelectorAll('.patrimonio_interactive_item');
      console.warn('🎯 Items encontrados:', items.length);
      
      items.forEach((item, index) => {
        this.items.push(new ProductItem(item, index, this));
      });

      // Adiciona estilos para feedback visual durante arraste
      this.addDragStyles();
      
      console.warn('✅ Product System inicializado com sucesso');
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

    // Métodos públicos para integração
    getItems() {
      return this.items;
    }

    resetAllItems() {
      this.items.forEach(item => {
        if (item.state.active && !item.state.pinned) {
          item.deactivate(this.Motion.animate, {
            duration: { fast: 0.3 },
            animation: { move: 15 }
          });
        }
      });
    }

    forceUpdate() {
      // Reinicializa se necessário
      if (this.items.length === 0) {
        this.initProductSystem();
      }
    }
  }

  // Cria instância global
  window.ReinoProductSystem = new ProductSystem();

  // Auto-inicialização com delay para aguardar Motion.js
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.ReinoProductSystem.init();
      }, 200); // Delay maior para aguardar Motion.js
    });
  } else {
    setTimeout(() => {
      window.ReinoProductSystem.init();
    }, 200);
  }

})();