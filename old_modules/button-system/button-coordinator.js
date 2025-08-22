/**
 * Button Coordinator - Main Module
 * Combines navigation buttons, form submission, and integrations
 * Clean button system without webflow dependency
 */

import { ExternalIntegrations } from './external-integrations.js';
import { FormSubmission } from './form-submission.js';
import { NavigationButtons } from './navigation-buttons.js';

export class ButtonCoordinator {
  constructor() {
    this.isInitialized = false;
    this.debugMode = window.location.search.includes('debug=true');

    // Initialize sub-modules
    this.navigationButtons = new NavigationButtons();
    this.formSubmission = new FormSubmission();
    this.integrations = new ExternalIntegrations();
  }

  async init(stepNavigationSystem) {
    if (this.isInitialized) return;

    await this.waitForDOM();

    // Initialize all sub-modules
    this.navigationButtons.init(stepNavigationSystem);
    this.formSubmission.init();
    this.integrations.init(stepNavigationSystem);

    this.setupDebugMode();

    this.isInitialized = true;
    this.log('✅ Button Coordinator initialized');
  }

  waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
  }

  setupDebugMode() {
    if (this.debugMode) {
      window.buttonSystem = {
        coordinator: this,
        navigation: this.navigationButtons,
        form: this.formSubmission,
        integrations: this.integrations,

        // Debug methods
        forceUpdate: () => this.forceUpdateButtons(),
        debugButtons: () => this.debugButtonStates(),
        getStatus: () => this.getStatus(),
      };
    }
  }

  debugButtonStates() {
    console.group('🔘 Button Coordinator Debug');
    console.log('Initialized:', this.isInitialized);
    console.log('Sub-modules status:', {
      navigationButtons: !!this.navigationButtons,
      formSubmission: !!this.formSubmission,
      integrations: !!this.integrations,
    });
    console.groupEnd();
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      navigation: this.navigationButtons ? true : false,
      form: this.formSubmission ? true : false,
      integrations: this.integrations ? true : false,
      typebot: this.integrations?.getTypebotStatus() || {},
    };
  }

  log(message) {
    if (this.debugMode) {
      console.log(`🎯 [ButtonCoordinator] ${message}`);
    }
  }

  // Public API - delegate to appropriate sub-modules
  updateNextButtonsState() {
    this.navigationButtons?.forceUpdate();
  }

  forceUpdateButtons() {
    this.navigationButtons?.forceUpdate();
  }

  setTypebotIntegration(typebotIntegration) {
    this.formSubmission?.setTypebotIntegration(typebotIntegration);
    this.integrations?.setTypebotIntegration(typebotIntegration);
  }

  setTypebotEnabled(enabled) {
    this.formSubmission?.setTypebotEnabled(enabled);
    this.integrations?.setTypebotEnabled(enabled);
  }

  getTypebotStatus() {
    return this.integrations?.getTypebotStatus() || {};
  }

  async configureDGMCanvas(config) {
    return this.integrations?.configureDGMCanvas(config);
  }

  getDGMCanvasStatus() {
    return this.integrations?.getDGMCanvasStatus() || {};
  }

  navigateToResultsSection() {
    this.integrations?.navigateToResultsSection();
  }

  setSupabaseClient(client) {
    // Not needed anymore, using config directly
  }
}
