/**
 * Currency Control System - Versão Webflow TXT
 * Handles currency input controls (increase/decrease buttons)
 * Versão sem imports/exports para uso direto no Webflow
 */

(function() {
  'use strict';

  class CurrencyControlSystem {
    constructor() {
      this.isInitialized = false;
    }

    init() {
      if (this.isInitialized) {
        console.warn('🔄 Currency Control System já inicializado');
        return;
      }

      console.warn('🚀 Iniciando Currency Control System');

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.initializeCurrencyControls();
        });
      } else {
        this.initializeCurrencyControls();
      }

      this.isInitialized = true;
    }

    initializeCurrencyControls() {
      const input = document.querySelector('[is-main="true"]');
      console.warn('📍 Input principal encontrado:', !!input);
      
      if (!input) {
        console.error('❌ Input principal não encontrado!');
        return;
      }

      const getIncrement = (value) => {
        if (value < 1000) return 100;
        if (value < 10000) return 1000;
        if (value < 100000) return 10000;
        if (value < 1000000) return 50000;
        return 100000;
      };

      const updateValue = (newValue) => {
        const formattedValue = new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(newValue);

        if (window.ReinoEventCoordinator) {
          window.ReinoEventCoordinator.setValue(formattedValue, 'currency-control');
        } else {
          input.value = formattedValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };

      const decreaseButtons = document.querySelectorAll('[currency-control="decrease"]');
      const increaseButtons = document.querySelectorAll('[currency-control="increase"]');
      
      console.warn('🎯 Botões encontrados:', {
        decrease: decreaseButtons.length,
        increase: increaseButtons.length
      });

      decreaseButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          console.warn('➖ Botão decrease clicado');
          const current = parseFloat(input.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
          const newValue = Math.max(0, current - getIncrement(current));
          console.warn('💰 Valor atual:', current, '→ Novo valor:', newValue);
          updateValue(newValue);
        });
      });

      increaseButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          console.warn('➕ Botão increase clicado');
          const current = parseFloat(input.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
          const newValue = current + getIncrement(current);
          console.warn('💰 Valor atual:', current, '→ Novo valor:', newValue);
          updateValue(newValue);
        });
      });
      
      console.warn('✅ Currency Control System configurado com sucesso');
    }
  }

  // Cria instância global
  window.ReinoCurrencyControlSystem = new CurrencyControlSystem();

  // Auto-inicialização com delay
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.ReinoCurrencyControlSystem.init();
      }, 150);
    });
  } else {
    setTimeout(() => {
      window.ReinoCurrencyControlSystem.init();
    }, 150);
  }

})();