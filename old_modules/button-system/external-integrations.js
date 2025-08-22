/**
 * External Integrations Module
 * Handles all external integrations (Typebot, DGM Canvas, etc.)
 */

import { dgmCanvasIntegration } from '../dgm-canvas-integration.js';

export class ExternalIntegrations {
  constructor() {
    this.debugMode = window.location.search.includes('debug=true');
    this.typebotIntegration = null;
    this.useTypebot = true;
    this.stepNavigationSystem = null;
  }

  init(stepNavigationSystem) {
    this.stepNavigationSystem = stepNavigationSystem;
    this.log('✅ External integrations initialized');
  }

  // Typebot Integration
  setTypebotIntegration(typebotIntegration) {
    this.typebotIntegration = typebotIntegration;
    this.log('Typebot integration set');
  }

  setTypebotEnabled(enabled) {
    this.useTypebot = enabled;
    this.log(`Typebot ${enabled ? 'enabled' : 'disabled'}`);
  }

  getTypebotStatus() {
    return {
      enabled: this.useTypebot,
      available: !!this.typebotIntegration,
      initialized: this.typebotIntegration?.isInitialized || false,
    };
  }

  // DGM Canvas Integration
  async configureDGMCanvas(config) {
    if (dgmCanvasIntegration?.reinitialize) {
      await dgmCanvasIntegration.reinitialize(config);
      this.log('DGM Canvas configured');
    }
  }

  getDGMCanvasStatus() {
    return dgmCanvasIntegration?.getStatus() || {};
  }

  // Navigation Integration
  navigateToResultsSection() {
    if (this.stepNavigationSystem?.showStep) {
      this.stepNavigationSystem.showStep(5);
      this.log('Navigated to results section');
    }
  }

  log(message) {
    if (this.debugMode) {
      console.log(`🔗 [ExternalIntegrations] ${message}`);
    }
  }
}
