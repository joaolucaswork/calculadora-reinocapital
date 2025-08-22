/**
 * Section Visibility System - Versão Webflow TXT
 * Controls showing/hiding of different sections based on user interactions
 * Versão sem imports/exports para uso direto no Webflow
 */

(function() {
  'use strict';

  class SectionVisibilitySystem {
    constructor() {
      this.currentSection = 'home';
      this.sections = {};
      this.isReady = false;
    }

    init() {
      if (this.isReady) return;

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      this.initializeSections();
      this.setupEventListeners();
      this.showInitialSection();
      this.isReady = true;
    }

    initializeSections() {
      const sectionMap = {
        home: '._0-home-section-calc-intro',
        money: '._1-section-calc-money',
        ativos: '._2-section-calc-ativos',
        alocacao: '._3-section-patrimonio-alocation',
        chart: '.section',
      };

      Object.entries(sectionMap).forEach(([name, selector]) => {
        const element = document.querySelector(selector);
        if (element) {
          this.sections[name] = {
            element,
            visible: element.style.display !== 'none',
          };
        }
      });
    }

    setupEventListeners() {
      document.addEventListener('click', (e) => {
        const showTarget = e.target.closest('[data-show]');
        if (showTarget) {
          e.preventDefault();
          const sectionName = showTarget.dataset.show;
          this.showSection(sectionName);
          return;
        }

        const toggleTarget = e.target.closest('[data-toggle]');
        if (toggleTarget) {
          e.preventDefault();
          const sectionName = toggleTarget.dataset.toggle;
          this.toggleSection(sectionName);
        }
      });

      window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '');
        if (hash && this.sections[hash]) {
          this.showSection(hash);
        } else if (!hash) {
          this.showSection('home');
        }
      });
    }

    showInitialSection() {
      const hash = window.location.hash.replace('#', '');
      const initialSection = hash && this.sections[hash] ? hash : 'home';
      this.showSection(initialSection, false);
    }

    async showSection(sectionName, animate = true) {
      if (!this.sections[sectionName] || this.currentSection === sectionName) {
        return;
      }

      if (this.currentSection && this.sections[this.currentSection]) {
        await this.hideSection(this.currentSection, animate);
      }

      await this.displaySection(sectionName, animate);

      this.currentSection = sectionName;
      this.updateURL(sectionName);

      document.dispatchEvent(new CustomEvent('sectionChanged', {
        detail: { 
          from: this.currentSection, 
          to: sectionName,
          animate 
        }
      }));

      if (typeof this.onSectionShow === 'function') {
        this.onSectionShow(sectionName);
      }
    }

    async hideSection(sectionName, animate = true) {
      const section = this.sections[sectionName];
      if (!section || !section.visible) return;

      if (animate && window.Motion) {
        await window.Motion.animate(
          section.element,
          { opacity: 0, scale: 0.95 },
          { duration: 0.3, ease: 'easeOut' }
        ).finished;
      }

      section.element.style.display = 'none';
      section.visible = false;
    }

    async displaySection(sectionName, animate = true) {
      const section = this.sections[sectionName];
      if (!section) return;

      section.element.style.display = '';
      section.visible = true;

      if (animate && window.Motion) {
        section.element.style.opacity = '0';
        section.element.style.transform = 'scale(0.95)';
        
        await window.Motion.animate(
          section.element,
          { opacity: 1, scale: 1 },
          { duration: 0.4, ease: 'easeOut' }
        ).finished;
      } else {
        section.element.style.opacity = '';
        section.element.style.transform = '';
      }
    }

    toggleSection(sectionName) {
      const section = this.sections[sectionName];
      if (!section) return;

      if (section.visible) {
        this.hideSection(sectionName);
      } else {
        this.showSection(sectionName);
      }
    }

    updateURL(sectionName) {
      if (sectionName !== 'home') {
        window.history.pushState(null, '', `#${sectionName}`);
      } else {
        window.history.pushState(null, '', window.location.pathname);
      }
    }

    getCurrentSection() {
      return this.currentSection;
    }

    isSectionVisible(sectionName) {
      return this.sections[sectionName]?.visible || false;
    }

    getAllSections() {
      return Object.keys(this.sections);
    }

    hideAllSections() {
      Object.keys(this.sections).forEach(sectionName => {
        this.hideSection(sectionName, false);
      });
    }

    showAllSections() {
      Object.keys(this.sections).forEach(sectionName => {
        this.displaySection(sectionName, false);
      });
    }
  }

  // Cria instância global
  window.ReinoSectionVisibilitySystem = new SectionVisibilitySystem();

  // Auto-inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoSectionVisibilitySystem.init();
    });
  } else {
    window.ReinoSectionVisibilitySystem.init();
  }

})();