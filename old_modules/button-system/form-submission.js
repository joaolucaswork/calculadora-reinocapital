/**
 * Form Submission Module
 * Handles form data collection, validation, and submission
 */

import { supabase, TABLE_NAME, validateSupabaseConfig } from '../../config/supabase.js';
import { dgmCanvasIntegration } from '../dgm-canvas-integration.js';

export class FormSubmission {
  constructor() {
    this.debugMode = window.location.search.includes('debug=true');
    this.typebotIntegration = null;
    this.useTypebot = true;
  }

  init() {
    this.setupSendButton();
    this.log('✅ Form submission initialized');
  }

  setupSendButton() {
    const sendButton = document.querySelector('[element-function="send"]');
    if (!sendButton) return;

    const newButton = sendButton.cloneNode(true);
    sendButton.parentNode.replaceChild(newButton, sendButton);

    newButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      this.log('Send button clicked');
      this.handleDataSubmission(newButton);
    });
  }

  async handleDataSubmission(button) {
    try {
      // Update button state
      const buttonText = button.querySelector('div');
      if (buttonText) buttonText.textContent = 'Processando...';
      button.disabled = true;

      // Collect and validate form data
      const formData = this.collectFormData();
      const validation = this.validateFormData(formData);

      if (!validation.isValid) {
        throw new Error(`Validação falhou: ${validation.errors.join(', ')}`);
      }

      this.log('Form data collected and validated');

      // Use Typebot if available, otherwise direct submission
      if (this.useTypebot && this.typebotIntegration?.isInitialized) {
        await this.startTypebotFlow(formData, button);
      } else {
        await this.handleDirectSubmission(formData, button);
      }
    } catch (error) {
      this.log(`Data submission error: ${error.message}`);
      this.showValidationError(error.message);
    } finally {
      // Reset button
      const buttonText = button.querySelector('div');
      if (buttonText) buttonText.textContent = 'Enviar';
      button.disabled = false;
    }
  }

  collectFormData() {
    const data = {
      timestamp: new Date().toISOString(),
      patrimonio: null,
      ativosEscolhidos: [],
      alocacao: {},
      session_id: this.generateSessionId(),
      user_agent: navigator.userAgent,
      page_url: window.location.href,
    };

    // Coleta valor do patrimônio
    const patrimonioInput = document.querySelector('[is-main="true"]');
    if (patrimonioInput) {
      data.patrimonio = this.parseCurrencyValue(patrimonioInput.value);
    }

    // Coleta ativos selecionados
    const selectedAssets = document.querySelectorAll('.selected-asset');
    selectedAssets.forEach((asset) => {
      const product = asset.getAttribute('ativo-product');
      const category = asset.getAttribute('ativo-category');
      if (product && category) {
        data.ativosEscolhidos.push({ product, category });
      }
    });

    // Coleta alocações
    const allocationItems = document.querySelectorAll('.patrimonio_interactive_item');
    allocationItems.forEach((item) => {
      const product = item.getAttribute('ativo-product');
      const category = item.getAttribute('ativo-category');
      const input = item.querySelector('.currency-input');
      const slider = item.querySelector('.slider');

      if (product && category && (input || slider)) {
        const value = input ? this.parseCurrencyValue(input.value) : 0;
        const percentage = slider ? parseFloat(slider.value) * 100 : 0;

        data.alocacao[`${category}-${product}`] = {
          value,
          percentage,
          category,
          product,
        };
      }
    });

    return data;
  }

  validateFormData(data) {
    const errors = [];

    // Validate patrimonio
    if (!data.patrimonio || data.patrimonio <= 0) {
      errors.push('Patrimônio deve ser maior que zero');
    }

    // Validate selected assets
    if (!data.ativosEscolhidos || data.ativosEscolhidos.length === 0) {
      errors.push('Pelo menos um ativo deve ser selecionado');
    }

    // Validate allocations
    if (data.alocacao && Object.keys(data.alocacao).length > 0) {
      const totalPercentage = Object.values(data.alocacao).reduce(
        (sum, allocation) => sum + (allocation.percentage || 0),
        0
      );

      // Removed 100% allocation requirement - users can allocate any percentage
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async startTypebotFlow(formData, button) {
    try {
      const buttonText = button.querySelector('div');
      if (buttonText) buttonText.textContent = 'Iniciando conversa...';

      // Callback for when Typebot completes
      const onTypebotCompletion = async (typebotData) => {
        try {
          const enhancedFormData = {
            ...formData,
            typebot_results: typebotData,
            submission_type: 'typebot_enhanced',
            completed_at: new Date().toISOString(),
          };

          const result = await this.sendToSupabase(enhancedFormData);

          if (result.success) {
            await dgmCanvasIntegration.sendData(enhancedFormData);
            this.handleSuccessfulSubmission();
          }
        } catch (error) {
          this.log(`Typebot completion error: ${error.message}`);
        }
      };

      // Start Typebot
      await this.typebotIntegration.startTypebotFlow(formData, onTypebotCompletion);

      if (buttonText) buttonText.textContent = 'Aguardando resposta...';
    } catch (error) {
      this.log(`Typebot flow error: ${error.message}`);
      // Fallback to direct submission
      await this.handleDirectSubmission(formData, button);
    }
  }

  async handleDirectSubmission(formData, button) {
    try {
      const buttonText = button.querySelector('div');
      if (buttonText) buttonText.textContent = 'Enviando...';

      const result = await this.sendToSupabase(formData);

      if (result.success) {
        await dgmCanvasIntegration.sendData(formData);
        this.handleSuccessfulSubmission();
      }
    } catch (error) {
      this.log(`Direct submission error: ${error.message}`);
      throw error;
    }
  }

  async sendToSupabase(data) {
    try {
      validateSupabaseConfig();

      const result = await supabase.from(TABLE_NAME).insert([data]).select();

      if (result.error) {
        throw new Error(result.error.message);
      }

      this.log('Data sent to Supabase successfully');
      return { success: true, data: result.data };
    } catch (error) {
      this.log(`Supabase error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  handleSuccessfulSubmission() {
    this.showSuccessMessage('Dados enviados com sucesso!');
  }

  // Utility methods
  parseCurrencyValue(value) {
    if (!value) return 0;
    return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  showValidationError(message) {
    this.showToast(message, 'error');
  }

  showSuccessMessage(message) {
    this.showToast(message, 'success');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      color: white;
      z-index: 10000;
      font-weight: bold;
      background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  log(message) {
    if (this.debugMode) {
      console.log(`📝 [FormSubmission] ${message}`);
    }
  }

  // Public API
  setTypebotIntegration(typebotIntegration) {
    this.typebotIntegration = typebotIntegration;
    this.log('Typebot integration set');
  }

  setTypebotEnabled(enabled) {
    this.useTypebot = enabled;
    this.log(`Typebot ${enabled ? 'enabled' : 'disabled'}`);
  }
}
