/**
 * Navbar Hide Controller - Versão Webflow TXT
 * Adiciona classe "hide" ao top-header-navbar quando 5-section-resultado está em view
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class NavbarHideController {
    constructor() {
      this.isInitialized = false;
      this.Motion = null;
      this.navbar = null;
      this.section5 = null;
      this.inViewCleanup = null;
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
      if (window.Motion && window.Motion.inView) {
        this.Motion = window.Motion;
        this.setupNavbarHide();
      } else {
        setTimeout(() => this.waitForMotion(), 50);
      }
    }

    setupNavbarHide() {
      this.navbar = document.querySelector('.top-header-navbar');
      this.section5 = document.querySelector('._5-section-resultado');

      console.log('🔍 NavbarHideController - Elements found:', {
        navbar: !!this.navbar,
        section5: !!this.section5,
      });

      if (!this.navbar || !this.section5) {
        console.warn('⚠️ NavbarHideController - Missing elements');
        return;
      }

      // Usar o sistema de seções existente para detectar quando seção 5 está ativa
      this.setupSectionListener();

      console.log('✅ NavbarHideController - Section listener setup complete');
    }

    setupSectionListener() {
      // Escutar mudanças de seção do sistema existente
      document.addEventListener('sectionChanged', (event) => {
        const { to } = event.detail;
        console.log('📍 Section changed to:', to);

        if (to === 'resultado5') {
          this.navbar.classList.add('hide');
          console.log('🙈 Navbar hidden (section 5 active)');
        } else {
          this.navbar.classList.remove('hide');
          console.log('👀 Navbar shown (section 5 not active)');
        }
      });

      // Verificar estado inicial
      if (window.ReinoSectionVisibilitySystem) {
        const currentSection = window.ReinoSectionVisibilitySystem.getCurrentSection();
        console.log('🔍 Current section on init:', currentSection);

        if (currentSection === 'resultado5') {
          this.navbar.classList.add('hide');
          console.log('🙈 Navbar hidden (initial state)');
        }
      }
    }

    destroy() {
      if (this.navbar) {
        this.navbar.classList.remove('hide');
      }

      this.isInitialized = false;
    }
  }

  window.ReinoNavbarHideController = new NavbarHideController();

  console.log('🚀 NavbarHideController module loaded');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        console.log('🎯 Initializing NavbarHideController...');
        window.ReinoNavbarHideController.init();
      }, 100);
    });
  } else {
    setTimeout(() => {
      console.log('🎯 Initializing NavbarHideController...');
      window.ReinoNavbarHideController.init();
    }, 100);
  }
})();
