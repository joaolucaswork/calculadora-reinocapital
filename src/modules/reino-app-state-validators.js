/**
 * Reino AppState Validators
 * Sistema de validação para garantir consistência do AppState
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class ReinoAppStateValidators {
    constructor() {
      this.isInitialized = false;
      this.appState = null;
      this.validationRules = {};
      this.debugMode = false;
    }

    async init() {
      if (this.isInitialized) return;

      await this.waitForAppState();
      this.setupValidationRules();
      this.setupEventListeners();
      this.isInitialized = true;

      this.log('✅ AppState Validators initialized');
    }

    async waitForAppState() {
      const maxAttempts = 50;
      let attempts = 0;

      while (attempts < maxAttempts) {
        if (window.ReinoAppState && window.ReinoAppState.isInitialized) {
          this.appState = window.ReinoAppState;
          this.log('🔗 AppState integration enabled');
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        this.log('⚠️ AppState not found, validators disabled');
      }
    }

    setupValidationRules() {
      this.validationRules = {
        patrimonio: {
          name: 'Patrimônio',
          validate: (state) => this.validatePatrimonio(state),
        },
        allocations: {
          name: 'Alocações',
          validate: (state) => this.validateAllocations(state),
        },
        selectedAssets: {
          name: 'Ativos Selecionados',
          validate: (state) => this.validateSelectedAssets(state),
        },
        rotationIndex: {
          name: 'Índice de Giro',
          validate: (state) => this.validateRotationIndex(state),
        },
        commission: {
          name: 'Comissões',
          validate: (state) => this.validateCommission(state),
        },
      };
    }

    setupEventListeners() {
      if (!this.appState) return;

      // Validate on every AppState change
      document.addEventListener('appStateChanged', (e) => {
        this.validateState(e.detail.snapshot);
      });

      // Validate on specific events
      document.addEventListener('patrimonyMainValueChanged', () => {
        this.validateCurrentState();
      });

      document.addEventListener('allocationChanged', () => {
        this.validateCurrentState();
      });

      document.addEventListener('assetSelectionChanged', () => {
        this.validateCurrentState();
      });

      document.addEventListener('rotationIndexChanged', () => {
        this.validateCurrentState();
      });
    }

    validateCurrentState() {
      if (!this.appState) return { isValid: true, errors: [] };

      const snapshot = this.appState.getStateSnapshot();
      return this.validateState(snapshot);
    }

    validateState(state) {
      const results = {
        isValid: true,
        errors: [],
        warnings: [],
        details: {},
      };

      // Run all validation rules
      Object.entries(this.validationRules).forEach(([key, rule]) => {
        try {
          const result = rule.validate(state);
          results.details[key] = result;

          if (!result.isValid) {
            results.isValid = false;
            results.errors.push(...result.errors.map((error) => `${rule.name}: ${error}`));
          }

          if (result.warnings && result.warnings.length > 0) {
            results.warnings.push(...result.warnings.map((warning) => `${rule.name}: ${warning}`));
          }
        } catch (error) {
          results.isValid = false;
          results.errors.push(`${rule.name}: Validation error - ${error.message}`);
          this.log(`❌ Validation error in ${key}:`, error);
        }
      });

      // Update AppState metadata with validation results
      if (this.appState) {
        this.appState.state.metadata.isValid = results.isValid;
        this.appState.state.metadata.validationErrors = results.errors;
      }

      // Log validation results
      if (!results.isValid) {
        this.log('❌ Validation failed:', results.errors);
      } else if (results.warnings.length > 0) {
        this.log('⚠️ Validation warnings:', results.warnings);
      }

      return results;
    }

    // ==================== VALIDATION RULES ====================

    validatePatrimonio(state) {
      const errors = [];
      const warnings = [];

      const patrimonio = state.patrimonio?.value || 0;

      // Must be positive
      if (patrimonio < 0) {
        errors.push('Patrimônio não pode ser negativo');
      }

      // Reasonable range check
      if (patrimonio > 0 && patrimonio < 1000) {
        warnings.push('Patrimônio muito baixo (< R$ 1.000)');
      }

      if (patrimonio > 1000000000) {
        warnings.push('Patrimônio muito alto (> R$ 1 bilhão)');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        value: patrimonio,
      };
    }

    validateAllocations(state) {
      const errors = [];
      const warnings = [];

      const patrimonio = state.patrimonio?.value || 0;
      const allocations = state.allocations || {};

      // Calculate total allocated
      const totalAllocated = Object.values(allocations).reduce(
        (sum, value) => sum + (value || 0),
        0
      );

      // Total allocation cannot exceed patrimony
      if (totalAllocated > patrimonio) {
        errors.push(
          `Total alocado (${this.formatCurrency(totalAllocated)}) excede patrimônio (${this.formatCurrency(patrimonio)})`
        );
      }

      // Check for negative allocations
      Object.entries(allocations).forEach(([key, value]) => {
        if (value < 0) {
          errors.push(`Alocação negativa em ${key}: ${this.formatCurrency(value)}`);
        }
      });

      // Calculate percentage
      const percentage = patrimonio > 0 ? (totalAllocated / patrimonio) * 100 : 0;

      // Warnings for allocation percentage
      if (percentage > 100) {
        errors.push(`Alocação total excede 100% (${percentage.toFixed(1)}%)`);
      } else if (percentage > 95 && percentage <= 100) {
        warnings.push(`Alocação quase completa (${percentage.toFixed(1)}%)`);
      } else if (percentage < 50 && totalAllocated > 0) {
        warnings.push(`Baixa alocação do patrimônio (${percentage.toFixed(1)}%)`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        totalAllocated,
        percentage,
        remaining: patrimonio - totalAllocated,
      };
    }

    validateSelectedAssets(state) {
      const errors = [];
      const warnings = [];

      const selectedAssets = state.selectedAssets || [];
      const allocations = state.allocations || {};

      // Check if selected assets have corresponding allocations
      selectedAssets.forEach((asset) => {
        if (!allocations[asset] || allocations[asset] <= 0) {
          warnings.push(`Ativo selecionado sem alocação: ${asset}`);
        }
      });

      // Check if allocations have corresponding selected assets
      Object.entries(allocations).forEach(([key, value]) => {
        if (value > 0 && !selectedAssets.includes(key)) {
          warnings.push(`Alocação sem ativo selecionado: ${key}`);
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        count: selectedAssets.length,
      };
    }

    validateRotationIndex(state) {
      const errors = [];
      const warnings = [];

      const rotationIndex = state.rotationIndex?.value || 2;

      // Must be in valid range (1-4)
      if (rotationIndex < 1 || rotationIndex > 4) {
        errors.push(`Índice de giro inválido: ${rotationIndex} (deve estar entre 1 e 4)`);
      }

      // Must be integer
      if (!Number.isInteger(rotationIndex)) {
        errors.push(`Índice de giro deve ser um número inteiro: ${rotationIndex}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        value: rotationIndex,
      };
    }

    validateCommission(state) {
      const errors = [];
      const warnings = [];

      const commission = state.commission?.value || 0;
      const patrimonio = state.patrimonio?.value || 0;

      // Commission should be positive if there are allocations
      const totalAllocated = Object.values(state.allocations || {}).reduce(
        (sum, value) => sum + (value || 0),
        0
      );

      if (totalAllocated > 0 && commission <= 0) {
        warnings.push('Comissão zero com alocações existentes');
      }

      // Commission should not exceed reasonable percentage of patrimony
      if (patrimonio > 0) {
        const commissionPercentage = (commission / patrimonio) * 100;

        if (commissionPercentage > 10) {
          warnings.push(`Comissão muito alta: ${commissionPercentage.toFixed(2)}% do patrimônio`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        value: commission,
      };
    }

    // ==================== UTILITY METHODS ====================

    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    }

    log(message, data = null) {
      if (this.debugMode) {
        if (data) {
          console.log(`[AppStateValidators] ${message}`, data);
        } else {
          console.log(`[AppStateValidators] ${message}`);
        }
      }
    }

    enableDebug() {
      this.debugMode = true;
      this.log('🐛 Debug mode enabled');
    }

    disableDebug() {
      this.debugMode = false;
    }

    // ==================== PUBLIC API ====================

    getValidationSummary() {
      const result = this.validateCurrentState();
      return {
        isValid: result.isValid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        errors: result.errors,
        warnings: result.warnings,
      };
    }

    getDetailedValidation() {
      return this.validateCurrentState();
    }
  }

  // Create global instance
  window.ReinoAppStateValidators = new ReinoAppStateValidators();

  // Auto-initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      await window.ReinoAppStateValidators.init();
    });
  } else {
    window.ReinoAppStateValidators.init();
  }
})();
