/**
 * Motion Animation System - Versão Webflow TXT
 * Handles all motion animations, including currency control buttons
 * Versão sem imports/exports para uso direto no Webflow
 */

(function() {
  'use strict';

  class MotionAnimationSystem {
    constructor() {
      this.isInitialized = false;
      this.Motion = null;
    }

    init() {
      if (this.isInitialized) {
        console.warn('🔄 Motion Animation System já inicializado');
        return;
      }

      console.warn('🚀 Iniciando Motion Animation System');
      this.waitForMotion();
      this.isInitialized = true;
    }

    waitForMotion() {
      if (window.Motion) {
        this.Motion = window.Motion;
        console.warn('✅ Motion.js encontrado, inicializando efeitos');
        this.initMotionEffects();
      } else {
        console.warn('⏳ Aguardando Motion.js...');
        setTimeout(() => this.waitForMotion(), 50);
      }
    }

    initMotionEffects() {
      const { animate, hover, press } = this.Motion;

      // Busca elementos pela estrutura real
      const input = document.querySelector('input[is-main="true"]');
      const interactiveArrow = document.getElementById('interative-arrow');

      console.warn('📍 Elementos encontrados:', {
        input: !!input,
        arrow: !!interactiveArrow
      });

      if (!input || !interactiveArrow) {
        console.error('❌ Elementos essenciais não encontrados!');
        return;
      }

      // Busca o container pai que contém tanto o input quanto os botões
      const mainContainer = input.closest('.money_content_right-wrapper');
      if (!mainContainer) {
        console.error('❌ Container principal não encontrado!');
        return;
      }

      // Busca os botões dentro do container principal
      const increaseBtn = mainContainer.querySelector('[currency-control="increase"]');
      const decreaseBtn = mainContainer.querySelector('[currency-control="decrease"]');

      console.warn('🎯 Botões encontrados:', {
        increase: !!increaseBtn,
        decrease: !!decreaseBtn
      });

      if (!increaseBtn || !decreaseBtn) {
        console.error('❌ Botões de controle não encontrados!');
        return;
      }

      // Controle da seta
      let hideTimeout;
      let isArrowVisible = true;
      let isButtonInteraction = false;

      const hideArrow = () => {
        isArrowVisible = false;
        animate(
          interactiveArrow,
          {
            opacity: 0,
            scale: 0.8,
          },
          {
            duration: 0.4,
            ease: 'circInOut',
          }
        );
      };

      const showArrow = () => {
        isArrowVisible = true;
        animate(
          interactiveArrow,
          {
            opacity: 1,
            scale: 1,
          },
          {
            duration: 0.4,
            ease: 'backOut',
          }
        );
      };

      const resetHideTimer = () => {
        clearTimeout(hideTimeout);
        if (!isArrowVisible) {
          showArrow();
        }
        hideTimeout = setTimeout(() => {
          hideArrow();
        }, 5000);
      };

      const scheduleHide = () => {
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
          if (!isButtonInteraction) {
            hideArrow();
          }
        }, 2000);
      };

      // EventCoordinator integration
      if (window.ReinoEventCoordinator) {
        window.ReinoEventCoordinator.registerListener('motion-animation', 'input', () => {
          if (!isArrowVisible) showArrow();
          scheduleHide();
        });

        window.ReinoEventCoordinator.registerListener('motion-animation', 'focus', () => {
          if (!isArrowVisible) showArrow();
          clearTimeout(hideTimeout);
        });

        window.ReinoEventCoordinator.registerListener('motion-animation', 'blur', () => {
          scheduleHide();
        });
      }

      // Button interaction tracking
      const buttonEffects = [increaseBtn, decreaseBtn];
      buttonEffects.forEach((button) => {
        button.addEventListener('mouseenter', () => {
          isButtonInteraction = true;
          if (!isArrowVisible) showArrow();
          clearTimeout(hideTimeout);
        });

        button.addEventListener('mouseleave', () => {
          isButtonInteraction = false;
          scheduleHide();
        });
      });

      // Ripple effect
      const createRippleEffect = (element, color) => {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          background: ${color};
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 1;
          opacity: 0.4;
        `;
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        animate(
          ripple,
          {
            scale: [0, 4],
            opacity: [0.4, 0],
          },
          {
            duration: 0.5,
            ease: 'circOut',
          }
        );

        setTimeout(() => ripple.remove(), 500);
      };

      const rotateArrowDown = () => {
        animate(
          interactiveArrow,
          {
            rotate: 180,
            color: '#ef4444',
          },
          {
            duration: 0.3,
            ease: 'backOut',
          }
        );
      };

      const rotateArrowUp = () => {
        animate(
          interactiveArrow,
          {
            rotate: 0,
            color: '#22c55e',
          },
          {
            duration: 0.3,
            ease: 'backOut',
          }
        );
      };

      // Hover no botão +
      hover(increaseBtn, (element) => {
        if (element.classList.contains('disabled')) return;

        isButtonInteraction = true;
        animate(
          element,
          {
            scale: 1.08,
            y: -3,
            filter: 'brightness(1.1)',
          },
          {
            duration: 0.25,
            ease: 'circOut',
          }
        );

        rotateArrowUp();
        resetHideTimer();

        const icon = element.querySelector('svg');
        if (icon) {
          animate(
            icon,
            {
              scale: 1.15,
            },
            {
              duration: 0.2,
              ease: 'backOut',
            }
          );
        }

        return () => {
          isButtonInteraction = false;
          animate(
            element,
            {
              scale: 1,
              y: 0,
              filter: 'brightness(1)',
            },
            {
              duration: 0.2,
              ease: 'circInOut',
            }
          );

          if (icon) {
            animate(
              icon,
              {
                scale: 1,
              },
              {
                duration: 0.15,
              }
            );
          }
        };
      });

      // Hover no botão -
      hover(decreaseBtn, (element) => {
        if (element.classList.contains('disabled')) return;

        isButtonInteraction = true;
        animate(
          element,
          {
            scale: 1.08,
            y: -3,
            filter: 'brightness(1.1)',
          },
          {
            duration: 0.25,
            ease: 'circOut',
          }
        );

        rotateArrowDown();
        resetHideTimer();

        const icon = element.querySelector('svg');
        if (icon) {
          animate(
            icon,
            {
              scale: 1.15,
            },
            {
              duration: 0.2,
              ease: 'backOut',
            }
          );
        }

        return () => {
          isButtonInteraction = false;
          animate(
            element,
            {
              scale: 1,
              y: 0,
              filter: 'brightness(1)',
            },
            {
              duration: 0.2,
              ease: 'circInOut',
            }
          );

          if (icon) {
            animate(
              icon,
              {
                scale: 1,
              },
              {
                duration: 0.15,
              }
            );
          }
        };
      });

      // Press no botão +
      press(increaseBtn, (element) => {
        if (element.classList.contains('disabled')) return;

        isButtonInteraction = true;
        animate(
          element,
          {
            scale: 0.92,
            y: 2,
          },
          {
            duration: 0.08,
            ease: 'circIn',
          }
        );

        createRippleEffect(element, '#9ca3af');
        rotateArrowUp();
        resetHideTimer();

        return () => {
          animate(
            element,
            {
              scale: 1.08,
              y: -3,
            },
            {
              duration: 0.12,
              ease: 'backOut',
            }
          );
          setTimeout(() => {
            isButtonInteraction = false;
          }, 100);
        };
      });

      // Press no botão -
      press(decreaseBtn, (element) => {
        if (element.classList.contains('disabled')) return;

        isButtonInteraction = true;
        animate(
          element,
          {
            scale: 0.92,
            y: 2,
          },
          {
            duration: 0.08,
            ease: 'circIn',
          }
        );

        createRippleEffect(element, '#9ca3af');
        rotateArrowDown();
        resetHideTimer();

        return () => {
          animate(
            element,
            {
              scale: 1.08,
              y: -3,
            },
            {
              duration: 0.12,
              ease: 'backOut',
            }
          );
          setTimeout(() => {
            isButtonInteraction = false;
          }, 100);
        };
      });

      console.warn('✅ Motion effects configurados com sucesso');
    }
  }

  // Cria instância global
  window.ReinoMotionAnimationSystem = new MotionAnimationSystem();

  // Auto-inicialização com delay para aguardar Motion.js
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.ReinoMotionAnimationSystem.init();
      }, 300); // Delay maior para garantir que Motion.js carregou
    });
  } else {
    setTimeout(() => {
      window.ReinoMotionAnimationSystem.init();
    }, 300);
  }

})();