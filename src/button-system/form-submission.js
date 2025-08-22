/**
 * Form Submission Module - Webflow Version
 * Handles form data collection, validation, and submission
 */

window.ReinoFormSubmission = (function() {
  'use strict';

  function FormSubmission() {
    this.debugMode = window.location.search.includes('debug=true');
    this.typebotIntegration = null;
    this.useTypebot = true;
    this.supabase = window.supabase;
    this.dgmCanvasIntegration = window.ReinoDGMCanvasIntegration;
  }

  FormSubmission.prototype.init = function() {
    this.setupSendButton();
    this.log('✅ Form submission initialized');
  };

  FormSubmission.prototype.setupSendButton = function() {
    var self = this;
    var sendButton = document.querySelector('[element-function="send"]');
    if (!sendButton) return;

    var newButton = sendButton.cloneNode(true);
    sendButton.parentNode.replaceChild(newButton, sendButton);

    newButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      self.log('Send button clicked');
      self.handleDataSubmission(newButton);
    });
  };

  FormSubmission.prototype.handleDataSubmission = function(button) {
    var self = this;

    // Update button state
    var buttonText = button.querySelector('div');
    if (buttonText) buttonText.textContent = 'Processando...';
    button.disabled = true;

    try {
      // Collect and validate form data
      var formData = this.collectFormData();
      var validation = this.validateFormData(formData);

      if (!validation.isValid) {
        throw new Error('Validação falhou: ' + validation.errors.join(', '));
      }

      this.log('Form data collected and validated');

      // Use Typebot if available, otherwise direct submission
      if (this.useTypebot && this.typebotIntegration && this.typebotIntegration.isInitialized) {
        this.startTypebotFlow(formData, button);
      } else {
        this.handleDirectSubmission(formData, button);
      }
    } catch (error) {
      this.log('Data submission error: ' + error.message);
      this.showValidationError(error.message);

      // Reset button
      if (buttonText) buttonText.textContent = 'Enviar';
      button.disabled = false;
    }
  };

  FormSubmission.prototype.collectFormData = function() {
    var data = {
      timestamp: new Date().toISOString(),
      patrimonio: null,
      ativosEscolhidos: [],
      alocacao: {},
      session_id: this.generateSessionId(),
      user_agent: navigator.userAgent,
      page_url: window.location.href
    };

    // Coleta valor do patrimônio
    var patrimonioInput = document.querySelector('[is-main="true"]');
    if (patrimonioInput) {
      data.patrimonio = this.parseCurrencyValue(patrimonioInput.value);
    }

    // Coleta ativos selecionados
    var selectedAssets = document.querySelectorAll('.selected-asset');
    for (var i = 0; i < selectedAssets.length; i++) {
      var asset = selectedAssets[i];
      var product = asset.getAttribute('ativo-product');
      var category = asset.getAttribute('ativo-category');
      if (product && category) {
        data.ativosEscolhidos.push({ product: product, category: category });
      }
    }

    // Coleta alocações
    var allocationItems = document.querySelectorAll('.patrimonio_interactive_item');
    for (var i = 0; i < allocationItems.length; i++) {
      var item = allocationItems[i];
      var product = item.getAttribute('ativo-product');
      var category = item.getAttribute('ativo-category');
      var input = item.querySelector('.currency-input');
      var slider = item.querySelector('.slider');

      if (product && category && (input || slider)) {
        var value = input ? this.parseCurrencyValue(input.value) : 0;
        var percentage = slider ? parseFloat(slider.value) * 100 : 0;

        data.alocacao[category + '-' + product] = {
          value: value,
          percentage: percentage,
          category: category,
          product: product
        };
      }
    }

    return data;
  };

  FormSubmission.prototype.validateFormData = function(data) {
    var errors = [];

    // Validate patrimonio
    if (!data.patrimonio || data.patrimonio <= 0) {
      errors.push('Patrimônio deve ser maior que zero');
    }

    // Validate selected assets
    if (!data.ativosEscolhidos || data.ativosEscolhidos.length === 0) {
      errors.push('Pelo menos um ativo deve ser selecionado');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  };

  FormSubmission.prototype.startTypebotFlow = function(formData, button) {
    var self = this;
    var buttonText = button.querySelector('div');
    
    try {
      if (buttonText) buttonText.textContent = 'Iniciando conversa...';

      // Callback for when Typebot completes
      var onTypebotCompletion = function(typebotData) {
        try {
          var enhancedFormData = {
            timestamp: formData.timestamp,
            patrimonio: formData.patrimonio,
            ativosEscolhidos: formData.ativosEscolhidos,
            alocacao: formData.alocacao,
            session_id: formData.session_id,
            user_agent: formData.user_agent,
            page_url: formData.page_url,
            typebot_results: typebotData,
            submission_type: 'typebot_enhanced',
            completed_at: new Date().toISOString()
          };

          self.sendToSupabase(enhancedFormData).then(function(result) {
            if (result.success) {
              if (self.dgmCanvasIntegration) {
                self.dgmCanvasIntegration.sendData(enhancedFormData);
              }
              self.handleSuccessfulSubmission();
            }
          }).catch(function(error) {
            self.log('Typebot completion error: ' + error.message);
          });
        } catch (error) {
          self.log('Typebot completion error: ' + error.message);
        }
      };

      // Start Typebot
      this.typebotIntegration.startTypebotFlow(formData, onTypebotCompletion);

      if (buttonText) buttonText.textContent = 'Aguardando resposta...';
    } catch (error) {
      this.log('Typebot flow error: ' + error.message);
      // Fallback to direct submission
      this.handleDirectSubmission(formData, button);
    }
  };

  FormSubmission.prototype.handleDirectSubmission = function(formData, button) {
    var self = this;
    var buttonText = button.querySelector('div');
    
    try {
      if (buttonText) buttonText.textContent = 'Enviando...';

      this.sendToSupabase(formData).then(function(result) {
        if (result.success) {
          if (self.dgmCanvasIntegration) {
            self.dgmCanvasIntegration.sendData(formData);
          }
          self.handleSuccessfulSubmission();
        }
        
        // Reset button
        if (buttonText) buttonText.textContent = 'Enviar';
        button.disabled = false;
      }).catch(function(error) {
        self.log('Direct submission error: ' + error.message);
        self.showValidationError(error.message);
        
        // Reset button
        if (buttonText) buttonText.textContent = 'Enviar';
        button.disabled = false;
      });
    } catch (error) {
      this.log('Direct submission error: ' + error.message);
      this.showValidationError(error.message);
      
      // Reset button
      if (buttonText) buttonText.textContent = 'Enviar';
      button.disabled = false;
    }
  };

  FormSubmission.prototype.sendToSupabase = function(data) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
      try {
        if (!self.supabase) {
          throw new Error('Supabase not available');
        }

        if (!window.SUPABASE_TABLE_NAME) {
          throw new Error('Supabase table name not configured');
        }

        self.supabase
          .from(window.SUPABASE_TABLE_NAME)
          .insert([data])
          .select()
          .then(function(result) {
            if (result.error) {
              throw new Error(result.error.message);
            }

            self.log('Data sent to Supabase successfully');
            resolve({ success: true, data: result.data });
          })
          .catch(function(error) {
            self.log('Supabase error: ' + error.message);
            reject({ success: false, error: error.message });
          });
      } catch (error) {
        self.log('Supabase error: ' + error.message);
        reject({ success: false, error: error.message });
      }
    });
  };

  FormSubmission.prototype.handleSuccessfulSubmission = function() {
    this.showSuccessMessage('Dados enviados com sucesso!');
  };

  // Utility methods
  FormSubmission.prototype.parseCurrencyValue = function(value) {
    if (!value) return 0;
    return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
  };

  FormSubmission.prototype.generateSessionId = function() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  FormSubmission.prototype.showValidationError = function(message) {
    this.showToast(message, 'error');
  };

  FormSubmission.prototype.showSuccessMessage = function(message) {
    this.showToast(message, 'success');
  };

  FormSubmission.prototype.showToast = function(message, type) {
    type = type || 'info';
    
    var toast = document.createElement('div');
    var backgroundColor = '#007bff';
    
    if (type === 'error') backgroundColor = '#dc3545';
    else if (type === 'success') backgroundColor = '#28a745';
    
    toast.style.cssText = 
      'position: fixed;' +
      'top: 20px;' +
      'right: 20px;' +
      'padding: 15px 20px;' +
      'border-radius: 5px;' +
      'color: white;' +
      'z-index: 10000;' +
      'font-weight: bold;' +
      'background: ' + backgroundColor + ';';
    
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  };

  FormSubmission.prototype.debounce = function(func, wait) {
    var timeout;
    var self = this;
    return function() {
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(self, args);
      }, wait);
    };
  };

  FormSubmission.prototype.log = function(message) {
    if (this.debugMode) {
      console.log('📝 [FormSubmission] ' + message);
    }
  };

  // Public API
  FormSubmission.prototype.setTypebotIntegration = function(typebotIntegration) {
    this.typebotIntegration = typebotIntegration;
    this.log('Typebot integration set');
  };

  FormSubmission.prototype.setTypebotEnabled = function(enabled) {
    this.useTypebot = enabled;
    this.log('Typebot ' + (enabled ? 'enabled' : 'disabled'));
  };

  // Cria instância global
  window.ReinoFormSubmission = new FormSubmission();

  return FormSubmission;
})();