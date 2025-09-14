/**
 * Navbar Visibility Controller
 * Controls the visibility of top-header-navbar based on current section
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class NavbarVisibilityController {
    constructor() {
      this.navbar = null;
      this.currentSection = null;
      this.isInitialized = false;
      this.debugMode = window.location.search.includes('debug=true');

      this.hiddenSections = new Set(['resultado5']);
    }

    init() {
      if (this.isInitialized) {
        return;
      }

      this.cacheElements();
      this.setupEventListeners();
      this.checkInitialState();

      this.isInitialized = true;
      this.log('✅ Navbar visibility controller initialized');
    }

    cacheElements() {
      this.navbar = document.querySelector('.top-header-navbar');

      if (!this.navbar) {
        this.log('⚠️ top-header-navbar element not found');
        return;
      }

      this.log('📍 Navbar element cached');
    }

    setupEventListeners() {
      document.addEventListener('sectionChanged', (e) => {
        const { to: sectionName } = e.detail;
        this.handleSectionChange(sectionName);
      });

      document.addEventListener('stepChanged', (e) => {
        const { currentStep } = e.detail;
        this.handleStepChange(currentStep);
      });

      this.log('👂 Event listeners setup complete');
    }

    checkInitialState() {
      if (window.ReinoSectionVisibilitySystem) {
        const currentSection = window.ReinoSectionVisibilitySystem.getCurrentSection();
        if (currentSection) {
          this.handleSectionChange(currentSection);
        }
      }

      if (window.ReinoStepNavigationProgressSystem) {
        const currentStep = window.ReinoStepNavigationProgressSystem.getCurrentStep();
        if (currentStep !== undefined) {
          this.handleStepChange(currentStep);
        }
      }
    }

    handleSectionChange(sectionName) {
      if (!this.navbar || this.currentSection === sectionName) {
        return;
      }

      this.currentSection = sectionName;
      this.updateNavbarVisibility();

      this.log(`🔄 Section changed to: ${sectionName}`);
    }

    handleStepChange(stepIndex) {
      if (!this.navbar) {
        return;
      }

      if (stepIndex === 4) {
        this.hideNavbar();
        this.log('🔄 Step 5 (index 4) - hiding navbar');
      } else {
        this.showNavbar();
        this.log(`🔄 Step ${stepIndex + 1} - showing navbar`);
      }
    }

    updateNavbarVisibility() {
      if (!this.navbar || !this.currentSection) {
        return;
      }

      if (this.hiddenSections.has(this.currentSection)) {
        this.hideNavbar();
      } else {
        this.showNavbar();
      }
    }

    hideNavbar() {
      if (!this.navbar) {
        return;
      }

      // Force hide with multiple properties to override Webflow CSS
      this.navbar.style.display = 'none';
      this.navbar.style.visibility = 'hidden';
      this.navbar.style.opacity = '0';
      this.navbar.style.pointerEvents = 'none';
      this.navbar.classList.add('hidden-section');

      this.log('👁️ Navbar hidden');
    }

    showNavbar() {
      if (!this.navbar) {
        return;
      }

      // Clear all hiding properties
      this.navbar.style.display = '';
      this.navbar.style.visibility = '';
      this.navbar.style.opacity = '';
      this.navbar.style.pointerEvents = '';
      this.navbar.classList.remove('hidden-section');

      this.log('👁️ Navbar shown');
    }

    addHiddenSection(sectionName) {
      this.hiddenSections.add(sectionName);
      this.log(`➕ Added hidden section: ${sectionName}`);

      if (this.currentSection === sectionName) {
        this.updateNavbarVisibility();
      }
    }

    removeHiddenSection(sectionName) {
      this.hiddenSections.delete(sectionName);
      this.log(`➖ Removed hidden section: ${sectionName}`);

      if (this.currentSection === sectionName) {
        this.updateNavbarVisibility();
      }
    }

    forceHide() {
      this.hideNavbar();
      this.log('🔒 Navbar force hidden');
    }

    forceShow() {
      this.showNavbar();
      this.log('🔓 Navbar force shown');
    }

    getStatus() {
      return {
        initialized: this.isInitialized,
        navbarFound: !!this.navbar,
        currentSection: this.currentSection,
        hiddenSections: Array.from(this.hiddenSections),
        isVisible: this.navbar ? this.navbar.style.display !== 'none' : false,
      };
    }

    log(message) {
      if (this.debugMode) {
        console.log(`🧭 [NavbarController] ${message}`);
      }
    }
  }

  window.ReinoNavbarVisibilityController = new NavbarVisibilityController();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoNavbarVisibilityController.init();
    });
  } else {
    window.ReinoNavbarVisibilityController.init();
  }
})();
