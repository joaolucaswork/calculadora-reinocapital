/**
 * Section Visibility System - Simplified
 * Controls showing/hiding of different sections based on user interactions
 */
export class SectionVisibilitySystem {
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
    // Mapeamento das seções principais
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
    // Event listeners para elementos com data-show
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

    // Hash change listener
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

    // Esconde seção atual
    if (this.currentSection && this.sections[this.currentSection]) {
      await this.hideSection(this.currentSection, animate);
    }

    // Mostra nova seção
    await this.displaySection(sectionName, animate);

    this.currentSection = sectionName;
    this.updateURL(sectionName);
    this.updateActiveStates(sectionName);
  }

  async hideSection(sectionName, animate = true) {
    const section = this.sections[sectionName];
    if (!section || !section.visible) return;

    if (animate && window.Motion) {
      try {
        await window.Motion.animate(
          section.element,
          { opacity: [1, 0], y: [0, -20] },
          { duration: 0.2, ease: 'easeOut' }
        ).finished;
      } catch {
        // Fallback se animação falhar
      }
    }

    section.element.style.display = 'none';
    section.visible = false;
  }

  async displaySection(sectionName, animate = true) {
    const section = this.sections[sectionName];
    if (!section || section.visible) return;

    section.element.style.display = 'block';

    if (animate && window.Motion) {
      try {
        section.element.style.opacity = '0';
        await window.Motion.animate(
          section.element,
          { opacity: [0, 1], y: [20, 0] },
          { duration: 0.3, ease: 'easeOut' }
        ).finished;
      } catch {
        // Fallback se animação falhar
        section.element.style.opacity = '1';
        section.element.style.transform = 'none';
      }
    } else {
      section.element.style.opacity = '1';
      section.element.style.transform = 'none';
    }

    section.visible = true;
  }

  async toggleSection(sectionName) {
    const section = this.sections[sectionName];
    if (!section) return;

    if (section.visible) {
      await this.hideSection(sectionName);
    } else {
      await this.showSection(sectionName);
    }
  }

  updateURL(sectionName) {
    const newUrl =
      sectionName === 'home'
        ? window.location.pathname
        : `${window.location.pathname}#${sectionName}`;
    window.history.pushState(null, null, newUrl);
  }

  updateActiveStates(sectionName) {
    // Remove estado ativo de todos os triggers
    document.querySelectorAll('[data-show].is-active').forEach((el) => {
      el.classList.remove('is-active');
    });

    // Adiciona estado ativo aos triggers da seção atual
    document.querySelectorAll(`[data-show="${sectionName}"]`).forEach((el) => {
      el.classList.add('is-active');
    });
  }

  // Métodos públicos essenciais
  getCurrentSection() {
    return this.currentSection;
  }

  isSectionVisible(sectionName) {
    return this.sections[sectionName]?.visible || false;
  }

  getSectionElement(sectionName) {
    return this.sections[sectionName]?.element || null;
  }
}
