/**
 * External Integrations Module - Webflow Version
 * Handles all external integrations (Typebot, DGM Canvas, etc.)
 */

window.ReinoExternalIntegrations = (function() {
  'use strict';

  function ExternalIntegrations() {
    this.debugMode = window.location.search.includes('debug=true');
    this.typebotIntegration = null;
    this.useTypebot = true;
    this.stepNavigationSystem = null;
    this.dgmCanvasIntegration = window.ReinoDGMCanvasIntegration;
  }

  ExternalIntegrations.prototype.init = function(stepNavigationSystem) {
    this.stepNavigationSystem = stepNavigationSystem;
    this.log('✅ External integrations initialized');
  };

  // Typebot Integration
  ExternalIntegrations.prototype.setTypebotIntegration = function(typebotIntegration) {
    this.typebotIntegration = typebotIntegration;
    this.log('Typebot integration set');
  };

  ExternalIntegrations.prototype.setTypebotEnabled = function(enabled) {
    this.useTypebot = enabled;
    this.log('Typebot ' + (enabled ? 'enabled' : 'disabled'));
  };

  ExternalIntegrations.prototype.getTypebotStatus = function() {
    return {
      enabled: this.useTypebot,
      available: !!this.typebotIntegration,
      initialized: this.typebotIntegration && this.typebotIntegration.isInitialized || false
    };
  };

  // DGM Canvas Integration
  ExternalIntegrations.prototype.configureDGMCanvas = function(config) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
      try {
        if (self.dgmCanvasIntegration && self.dgmCanvasIntegration.reinitialize) {
          self.dgmCanvasIntegration.reinitialize(config).then(function() {
            self.log('DGM Canvas configured');
            resolve();
          }).catch(function(error) {
            reject(error);
          });
        } else {
          self.log('DGM Canvas integration not available');
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  ExternalIntegrations.prototype.getDGMCanvasStatus = function() {
    if (this.dgmCanvasIntegration && this.dgmCanvasIntegration.getStatus) {
      return this.dgmCanvasIntegration.getStatus();
    }
    return {};
  };

  // Navigation Integration
  ExternalIntegrations.prototype.navigateToResultsSection = function() {
    if (this.stepNavigationSystem && this.stepNavigationSystem.showStep) {
      this.stepNavigationSystem.showStep(5);
      this.log('Navigated to results section');
    }
  };

  ExternalIntegrations.prototype.log = function(message) {
    if (this.debugMode) {
      console.log('🔗 [ExternalIntegrations] ' + message);
    }
  };

  // Cria instância global
  window.ReinoExternalIntegrations = new ExternalIntegrations();

  return ExternalIntegrations;
})();