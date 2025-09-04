/**
 * Lottie Lifecycle Manager
 * Manages Lottie animation instances for performance optimization
 * Destroys animations when leaving step 0, recreates when returning
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class LottieLifecycleManager {
    constructor() {
      this.isInitialized = false;
      this.lottieInstances = new Map();
      this.animationConfigs = new Map();
      this.currentStep = 0;
      this.stepNavigationSystem = null;
      this.isStep0Active = true;
    }

    init() {
      if (this.isInitialized) return;

      this.waitForDependencies();
    }

    waitForDependencies() {
      if (window.ReinoStepNavigationProgressSystem && window.Webflow) {
        this.stepNavigationSystem = window.ReinoStepNavigationProgressSystem;
        this.setup();
        this.isInitialized = true;
      } else {
        setTimeout(() => this.waitForDependencies(), 100);
      }
    }

    setup() {
      this.cacheAnimationConfigs();
      this.setupStepListener();
      this.currentStep = this.stepNavigationSystem.getCurrentStep();
      this.isStep0Active = this.currentStep === 0;

      if (!this.isStep0Active) {
        this.destroyLottieAnimations();
      }
    }

    cacheAnimationConfigs() {
      const animationElements = document.querySelectorAll(
        '.animation-source-wrapper [data-animation-type="lottie"]'
      );

      animationElements.forEach((element) => {
        const config = {
          element: element,
          src: element.getAttribute('data-src'),
          loop: element.getAttribute('data-loop'),
          direction: element.getAttribute('data-direction'),
          autoplay: element.getAttribute('data-autoplay'),
          renderer: element.getAttribute('data-renderer'),
          duration: element.getAttribute('data-duration'),
          wId: element.getAttribute('data-w-id'),
          isIx2Target: element.getAttribute('data-is-ix2-target'),
          defaultDuration: element.getAttribute('data-default-duration'),
          className: element.className,
          parentWrapper: element.closest('.animation-source-wrapper'),
        };

        this.animationConfigs.set(element, config);
      });
    }

    setupStepListener() {
      // Step change notifications are handled directly by progress-bar-system.js
      // No additional setup needed here
    }

    handleStepChange(currentStep, previousStep) {
      const wasStep0 = previousStep === 0;
      const isStep0 = currentStep === 0;

      if (wasStep0 && !isStep0) {
        this.destroyLottieAnimations();
        this.isStep0Active = false;
      } else if (!wasStep0 && isStep0) {
        this.recreateLottieAnimations();
        this.isStep0Active = true;
      }
    }

    destroyLottieAnimations() {
      try {
        this.animationConfigs.forEach((config, element) => {
          if (window.Webflow && window.Webflow.destroy) {
            try {
              window.Webflow.destroy();
            } catch {
              // Ignore errors during destruction
            }
          }

          if (element && element.parentNode) {
            const placeholder = document.createElement('div');
            placeholder.className = 'lottie-placeholder';
            placeholder.setAttribute('data-original-class', config.className);
            placeholder.setAttribute('data-w-id', config.wId);
            placeholder.style.width = '100%';
            placeholder.style.height = '100%';
            placeholder.style.display = 'none';

            element.parentNode.replaceChild(placeholder, element);
            this.lottieInstances.set(config, placeholder);
          }
        });

        if (window.Webflow && window.Webflow.ready) {
          window.Webflow.ready();
        }
      } catch (error) {
        console.error('LottieLifecycleManager: Error during destruction:', error);
      }
    }

    recreateLottieAnimations() {
      try {
        this.lottieInstances.forEach((placeholder, config) => {
          if (placeholder && placeholder.parentNode) {
            const newElement = document.createElement('div');
            newElement.className = config.className;
            newElement.setAttribute('data-w-id', config.wId);
            newElement.setAttribute('data-animation-type', 'lottie');
            newElement.setAttribute('data-src', config.src);
            newElement.setAttribute('data-loop', config.loop);
            newElement.setAttribute('data-direction', config.direction);
            newElement.setAttribute('data-autoplay', config.autoplay);
            newElement.setAttribute('data-is-ix2-target', config.isIx2Target);
            newElement.setAttribute('data-renderer', config.renderer);
            newElement.setAttribute('data-default-duration', config.defaultDuration);
            newElement.setAttribute('data-duration', config.duration);

            placeholder.parentNode.replaceChild(newElement, placeholder);

            this.animationConfigs.set(newElement, config);
            this.animationConfigs.delete(config);
          }
        });

        this.lottieInstances.clear();

        if (window.Webflow && window.Webflow.destroy) {
          window.Webflow.destroy();
        }

        if (window.Webflow && window.Webflow.ready) {
          window.Webflow.ready();
        }

        setTimeout(() => {
          if (window.Webflow && window.Webflow.require) {
            try {
              const ix2 = window.Webflow.require('ix2');
              if (ix2 && ix2.init) {
                ix2.init();
              }
            } catch {
              // Fallback initialization
            }
          }
        }, 100);
      } catch (error) {
        console.error('LottieLifecycleManager: Error during recreation:', error);
      }
    }

    getCurrentStep() {
      return this.currentStep;
    }

    isOnStep0() {
      return this.isStep0Active;
    }

    forceDestroy() {
      if (this.isStep0Active) {
        this.destroyLottieAnimations();
        this.isStep0Active = false;
      }
    }

    forceRecreate() {
      if (!this.isStep0Active) {
        this.recreateLottieAnimations();
        this.isStep0Active = true;
      }
    }

    getAnimationStatus() {
      return {
        currentStep: this.currentStep,
        isStep0Active: this.isStep0Active,
        totalAnimations: this.animationConfigs.size,
        activeInstances: this.lottieInstances.size,
      };
    }
  }

  window.ReinoLottieLifecycleManager = new LottieLifecycleManager();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoLottieLifecycleManager.init();
    });
  } else {
    window.ReinoLottieLifecycleManager.init();
  }
})();
