/**
 * Donut Tutorial Checkboxes System
 * Interactive tutorial checkboxes for donut chart interactions
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class DonutTutorialCheckboxes {
    constructor() {
      this.isInitialized = false;
      this.Motion = null;
      this.checkboxStates = {
        hover: false,
        click: false,
        indiceGiro: false,
      };
      this.tutorialElements = {
        hoverItem: null,
        clickItem: null,
        indiceGiroItem: null,
      };
      this.hasCompletedAnimation = false;
      this.debugMode = window.location.search.includes('tutorial-debug=true');
    }

    async init() {
      if (this.isInitialized) return;

      await this.waitForMotion();
      this.findTutorialElements();
      this.addCheckboxes();
      this.setupEventListeners();
      this.initializeNivelIndiceText();
      this.isInitialized = true;
    }

    async waitForMotion() {
      return new Promise((resolve) => {
        const checkMotion = () => {
          if (window.Motion) {
            this.Motion = window.Motion;
            resolve();
          } else {
            setTimeout(checkMotion, 50);
          }
        };
        checkMotion();
      });
    }

    findTutorialElements() {
      this.tutorialElements.hoverItem = document.querySelector(
        '.item-info-interativa[info="mouse-hover"]'
      );
      this.tutorialElements.clickItem = document.querySelector(
        '.item-info-interativa[info="click"]'
      );
      this.tutorialElements.indiceGiroItem = document.querySelector(
        '.item-info-interativa[info="indice-giro"]'
      );

      if (
        !this.tutorialElements.hoverItem ||
        !this.tutorialElements.clickItem ||
        !this.tutorialElements.indiceGiroItem
      ) {
        if (this.debugMode) {
          console.warn(
            'Tutorial elements not found. Make sure .item-info-interativa elements exist in Webflow.'
          );
        }
      }
    }

    addCheckboxes() {
      if (
        !this.tutorialElements.hoverItem ||
        !this.tutorialElements.clickItem ||
        !this.tutorialElements.indiceGiroItem
      )
        return;

      this.addCheckboxToElement(this.tutorialElements.hoverItem, 'hover');
      this.addCheckboxToElement(this.tutorialElements.clickItem, 'click');
      this.addCheckboxToElement(this.tutorialElements.indiceGiroItem, 'indice-giro');
    }

    addCheckboxToElement(element, type) {
      element.style.position = 'relative';

      // Responsive padding: mobile (16px) vs desktop (18px) + gap + left position
      const isMobile = window.innerWidth <= 768;
      const checkboxWidth = isMobile ? 16 : 18;
      const leftPosition = isMobile ? 10 : 12;
      element.style.paddingLeft = `calc(${checkboxWidth}px + 0.5rem + ${leftPosition}px)`;

      const checkbox = document.createElement('div');
      checkbox.className = `tutorial-checkbox tutorial-checkbox-${type}`;
      checkbox.innerHTML = `
        <div class="checkbox-box">
          <div class="checkbox-check">✓</div>
        </div>
      `;

      element.insertBefore(checkbox, element.firstChild);
    }

    setupEventListeners() {
      // Listen for custom tutorial events from donut chart
      document.addEventListener('donutTutorialHover', () => {
        this.markHoverCompleted();
      });

      document.addEventListener('donutTutorialClick', () => {
        this.markClickCompleted();
      });

      // Fallback listeners for existing events
      document.addEventListener('donutCategoryHover', () => {
        this.markHoverCompleted();
      });

      // Listen for tooltip pinning events from simple hover module
      document.addEventListener('simple-hover-tooltip-pinned', () => {
        this.markClickCompleted();
      });

      // Listen for rotation index changes
      document.addEventListener('rotationIndexChanged', (e) => {
        this.updateNivelIndiceText(e.detail.index);
        this.markIndiceGiroCompleted();
      });
    }

    markHoverCompleted() {
      if (this.checkboxStates.hover) return;

      if (this.debugMode) {
        console.log('🎯 Tutorial: Hover completed');
      }

      this.checkboxStates.hover = true;
      this.animateCheckbox('hover');
      this.checkForCompletion();
    }

    markClickCompleted() {
      if (this.checkboxStates.click) return;

      if (this.debugMode) {
        console.log('🎯 Tutorial: Click completed');
      }

      this.checkboxStates.click = true;
      this.animateCheckbox('click');
      this.checkForCompletion();
    }

    markIndiceGiroCompleted() {
      if (this.checkboxStates.indiceGiro) return;

      if (this.debugMode) {
        console.log('🎯 Tutorial: Indice Giro completed');
      }

      this.checkboxStates.indiceGiro = true;
      this.animateCheckbox('indice-giro');
      this.checkForCompletion();
    }

    updateNivelIndiceText(indexValue) {
      const nivelElements = document.querySelectorAll('.nivel-indice');

      if (nivelElements.length === 0) {
        if (this.debugMode) {
          console.warn('⚠️ No .nivel-indice elements found');
        }
        return;
      }

      // Show only the number (1-4)
      const newText =
        indexValue && indexValue >= 1 && indexValue <= 4 ? indexValue.toString() : '2';

      nivelElements.forEach((element) => {
        element.textContent = newText;
      });

      if (this.debugMode) {
        console.log(`📊 Nivel indice updated to: ${newText} (index: ${indexValue})`);
      }
    }

    initializeNivelIndiceText() {
      // Get current rotation index value from the controller or slider
      let currentIndex = 2; // Default value

      // Try to get from rotation index controller
      if (window.ReinoRotationIndexController) {
        currentIndex = window.ReinoRotationIndexController.getCurrentIndex() || 2;
      } else {
        // Fallback: try to get from slider element
        const slider = document.querySelector(
          '#indice-giro, .indice-giro, range-slider.indice-giro'
        );
        if (slider && slider.value) {
          currentIndex = parseInt(slider.value) || 2;
        }
      }

      this.updateNivelIndiceText(currentIndex);

      if (this.debugMode) {
        console.log(`🔧 Initialized nivel indice with value: ${currentIndex}`);
      }
    }

    animateCheckbox(type) {
      const checkbox = document.querySelector(`.tutorial-checkbox-${type}`);
      if (!checkbox || !this.Motion) return;

      const { animate } = this.Motion;
      const checkboxBox = checkbox.querySelector('.checkbox-box');
      const checkMark = checkbox.querySelector('.checkbox-check');

      // Add completed class to checkbox
      checkbox.classList.add('completed');

      // Add fallback class to parent item for opacity reduction
      const parentItem = checkbox.closest('.item-info-interativa');
      if (parentItem) {
        parentItem.classList.add('tutorial-completed');
      }

      animate(
        checkboxBox,
        {
          scale: [1, 1.2, 1],
          backgroundColor: ['transparent', '#c49725', '#c49725'],
        },
        {
          duration: 0.6,
          ease: 'backOut',
        }
      );

      animate(
        checkMark,
        {
          scale: [0, 1.3, 1],
          opacity: [0, 1, 1],
        },
        {
          duration: 0.4,
          delay: 0.2,
          ease: 'backOut',
        }
      );
    }

    checkForCompletion() {
      if (
        this.checkboxStates.hover &&
        this.checkboxStates.click &&
        this.checkboxStates.indiceGiro &&
        !this.hasCompletedAnimation
      ) {
        this.hasCompletedAnimation = true;
        setTimeout(() => {
          this.triggerCompletionAnimation();
        }, 800);
      }
    }

    triggerCompletionAnimation() {
      if (
        !this.Motion ||
        !this.tutorialElements.hoverItem ||
        !this.tutorialElements.clickItem ||
        !this.tutorialElements.indiceGiroItem
      )
        return;

      const { animate } = this.Motion;

      const elements = [
        this.tutorialElements.hoverItem,
        this.tutorialElements.clickItem,
        this.tutorialElements.indiceGiroItem,
      ];

      elements.forEach((element, index) => {
        animate(
          element,
          {
            y: [0, 20],
            opacity: [1, 0],
            scale: [1, 0.95],
          },
          {
            duration: 0.6,
            delay: index * 0.05,
            ease: [0.4, 0, 0.6, 1],
          }
        );
      });
    }

    reset() {
      this.checkboxStates = {
        hover: false,
        click: false,
        indiceGiro: false,
      };
      this.hasCompletedAnimation = false;

      if (this.tutorialElements.hoverItem) {
        this.tutorialElements.hoverItem.style.transform = '';
        this.tutorialElements.hoverItem.style.opacity = '';
        this.tutorialElements.hoverItem.classList.remove('tutorial-completed');
      }
      if (this.tutorialElements.clickItem) {
        this.tutorialElements.clickItem.style.transform = '';
        this.tutorialElements.clickItem.style.opacity = '';
        this.tutorialElements.clickItem.classList.remove('tutorial-completed');
      }
      if (this.tutorialElements.indiceGiroItem) {
        this.tutorialElements.indiceGiroItem.style.transform = '';
        this.tutorialElements.indiceGiroItem.style.opacity = '';
        this.tutorialElements.indiceGiroItem.classList.remove('tutorial-completed');
      }

      const checkboxes = document.querySelectorAll('.tutorial-checkbox');
      checkboxes.forEach((checkbox) => {
        const box = checkbox.querySelector('.checkbox-box');
        const check = checkbox.querySelector('.checkbox-check');

        // Remove completed class
        checkbox.classList.remove('completed');

        if (box) {
          box.style.backgroundColor = 'transparent';
          box.style.transform = '';
        }
        if (check) {
          check.style.opacity = '0';
          check.style.transform = '';
        }
      });
    }

    destroy() {
      const checkboxes = document.querySelectorAll('.tutorial-checkbox');
      checkboxes.forEach((checkbox) => checkbox.remove());

      this.isInitialized = false;
      this.checkboxStates = { hover: false, click: false, indiceGiro: false };
      this.hasCompletedAnimation = false;
    }

    // Debug and testing methods
    getStatus() {
      return {
        isInitialized: this.isInitialized,
        checkboxStates: { ...this.checkboxStates },
        hasCompletedAnimation: this.hasCompletedAnimation,
        elementsFound: {
          hoverItem: !!this.tutorialElements.hoverItem,
          clickItem: !!this.tutorialElements.clickItem,
        },
        debugMode: this.debugMode,
      };
    }

    forceHoverComplete() {
      if (this.debugMode) {
        console.log('🔧 Debug: Forcing hover completion');
      }
      this.markHoverCompleted();
    }

    forceClickComplete() {
      if (this.debugMode) {
        console.log('🔧 Debug: Forcing click completion');
      }
      this.markClickCompleted();
    }

    forceIndiceGiroComplete() {
      if (this.debugMode) {
        console.log('🔧 Debug: Forcing indice giro completion');
      }
      this.markIndiceGiroCompleted();
    }

    forceFullCompletion() {
      if (this.debugMode) {
        console.log('🔧 Debug: Forcing full tutorial completion');
      }
      this.markHoverCompleted();
      setTimeout(() => {
        this.markClickCompleted();
      }, 500);
      setTimeout(() => {
        this.markIndiceGiroCompleted();
      }, 1000);
    }

    testNivelIndiceText(indexValue) {
      if (this.debugMode) {
        console.log(`🔧 Debug: Testing nivel indice with value: ${indexValue}`);
      }
      this.updateNivelIndiceText(indexValue);
    }
  }

  window.ReinoDonutTutorialCheckboxes = new DonutTutorialCheckboxes();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoDonutTutorialCheckboxes.init();
    });
  } else {
    window.ReinoDonutTutorialCheckboxes.init();
  }
})();
