(function () {
  'use strict';

  class MotionAnimationSystem {
    constructor() {
      this.isInitialized = false;
      this.Motion = null;
    }

    init() {
      if (this.isInitialized) {
        return;
      }

      this.waitForMotion();
      this.isInitialized = true;
    }

    waitForMotion() {
      if (window.Motion) {
        this.Motion = window.Motion;
        this.initMotionEffects();
      } else {
        setTimeout(() => this.waitForMotion(), 50);
      }
    }

    initMotionEffects() {
      const { animate, hover, press } = this.Motion;

      const input = document.querySelector('input[is-main="true"]');
      const interactiveArrow = document.getElementById('interative-arrow');

      if (!input || !interactiveArrow) {
        return;
      }

      const mainContainer = input.closest('.money_content_right-wrapper');
      if (!mainContainer) {
        return;
      }

      const increaseBtn = mainContainer.querySelector('[currency-control="increase"]');
      const decreaseBtn = mainContainer.querySelector('[currency-control="decrease"]');

      if (!increaseBtn || !decreaseBtn) {
        return;
      }

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

      if (window.ReinoEventCoordinator) {
        window.ReinoEventCoordinator.registerListener('motion-animation', 'input', () => {
          if (!isArrowVisible) {
            showArrow();
          }
          scheduleHide();
        });

        window.ReinoEventCoordinator.registerListener('motion-animation', 'focus', () => {
          if (!isArrowVisible) {
            showArrow();
          }
          clearTimeout(hideTimeout);
        });

        window.ReinoEventCoordinator.registerListener('motion-animation', 'blur', () => {
          scheduleHide();
        });
      }

      const buttonEffects = [increaseBtn, decreaseBtn];
      buttonEffects.forEach((button) => {
        button.addEventListener('mouseenter', () => {
          isButtonInteraction = true;
          if (!isArrowVisible) {
            showArrow();
          }
          clearTimeout(hideTimeout);
        });

        button.addEventListener('mouseleave', () => {
          isButtonInteraction = false;
          scheduleHide();
        });
      });

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
          opacity: 0.2;
        `;
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        animate(
          ripple,
          {
            scale: [0, 4],
            opacity: [0.2, 0],
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

      hover(increaseBtn, (element) => {
        if (element.classList.contains('disabled')) {
          return;
        }

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

      hover(decreaseBtn, (element) => {
        if (element.classList.contains('disabled')) {
          return;
        }

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

      press(increaseBtn, (element) => {
        if (element.classList.contains('disabled')) {
          return;
        }

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

      press(decreaseBtn, (element) => {
        if (element.classList.contains('disabled')) {
          return;
        }

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
    }
  }

  window.ReinoMotionAnimationSystem = new MotionAnimationSystem();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.ReinoMotionAnimationSystem.init();
      }, 300);
    });
  } else {
    setTimeout(() => {
      window.ReinoMotionAnimationSystem.init();
    }, 300);
  }
})();
