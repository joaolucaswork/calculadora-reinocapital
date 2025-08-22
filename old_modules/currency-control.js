import { eventCoordinator } from './event-coordinator.js';

/**
 * Currency Control System
 * Handles currency input controls (increase/decrease buttons)
 * Uses EventCoordinator to prevent infinite loops
 */
export class CurrencyControlSystem {
  constructor() {
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) {
      return;
    }

    document.addEventListener('DOMContentLoaded', () => {
      this.initializeCurrencyControls();
    });

    this.isInitialized = true;
  }

  initializeCurrencyControls() {
    const input = document.querySelector('[is-main="true"]');
    if (!input) return;

    // Função para calcular incremento inteligente
    const getIncrement = (value) => {
      if (value < 1000) return 100;
      if (value < 10000) return 1000;
      if (value < 100000) return 10000;
      if (value < 1000000) return 50000;
      return 100000;
    };

    // Função para atualizar valor usando EventCoordinator
    const updateValue = (newValue) => {
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(newValue);

      // Usa EventCoordinator para evitar loops infinitos
      eventCoordinator.setValue(formattedValue, 'currency-control');
    };

    // Decrease buttons
    document.querySelectorAll('[currency-control="decrease"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const current = parseFloat(input.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        updateValue(Math.max(0, current - getIncrement(current)));
      });
    });

    // Increase buttons
    document.querySelectorAll('[currency-control="increase"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const current = parseFloat(input.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        updateValue(current + getIncrement(current));
      });
    });
  }
}
