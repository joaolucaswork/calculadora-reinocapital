/**
 * Form Submission Module - Webflow Version
 * Handles form data collection, validation, and submission
 */

window.ReinoFormSubmission = (function () {
  'use strict';

  function FormSubmission() {
    this.debugMode = window.location.search.includes('debug=true');
    this.typebotIntegration = null;
    this.useTypebot = true;
    this.dgmCanvasIntegration = window.ReinoDGMCanvasIntegration;
    this.supabaseIntegration = null;
    this.isProcessingTypebotCompletion = false; // Flag to prevent duplicate processing

    // Aguardar ReinoSupabaseIntegration estar disponível
    this.waitForSupabaseIntegration();
  }

  FormSubmission.prototype.init = function () {
    this.setupSendButton();
    this.setupTypebotCallback();
    this.log('✅ Form submission initialized');
  };

  FormSubmission.prototype.waitForSupabaseIntegration = function () {
    var self = this;
    var checkSupabaseIntegration = function () {
      if (window.ReinoSupabaseIntegration && window.ReinoSupabaseIntegration.isReady) {
        self.supabaseIntegration = window.ReinoSupabaseIntegration;
        self.log('✅ Supabase integration available');
        return;
      }
      setTimeout(checkSupabaseIntegration, 100);
    };
    checkSupabaseIntegration();
  };

  FormSubmission.prototype.setupTypebotCallback = function () {
    var self = this;

    // Wait for Typebot integration to be available
    var checkTypebot = function () {
      if (window.ReinoTypebotIntegrationSystem) {
        // Register callback for when Typebot completes
        window.ReinoTypebotIntegrationSystem.onCompletion(function (enhancedFormData) {
          self.log('🤖 Typebot completion callback triggered');
          self.handleTypebotCompletion(enhancedFormData);
        });
        self.log('✅ Typebot callback registered');
        return;
      }
      setTimeout(checkTypebot, 100);
    };
    checkTypebot();
  };

  FormSubmission.prototype.setupSendButton = function () {
    var self = this;
    var sendButton = document.querySelector('[element-function="send"]');
    if (!sendButton) return;

    var newButton = sendButton.cloneNode(true);
    sendButton.parentNode.replaceChild(newButton, sendButton);

    newButton.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      self.log('Send button clicked');
      self.handleDataSubmission(newButton);
    });
  };

  FormSubmission.prototype.handleDataSubmission = function (button) {
    var self = this;

    // Check if debug mode is active
    var isDebugActive = window.ReinoDebugModule && window.ReinoDebugModule.isDebugActive();
    if (isDebugActive) {
      this.log('🐛 Debug mode active - form submission bypassed');
      return; // Let debug module handle navigation
    }

    // Update button state
    var buttonText = button.querySelector('div');
    if (buttonText) buttonText.textContent = 'Processando...';
    button.disabled = true;

    try {
      // Collect and validate form data
      var formData = this.collectFormData();

      // Use Supabase integration validation if available, otherwise fallback
      var validation;
      if (this.supabaseIntegration) {
        validation = this.supabaseIntegration.validateFormData(formData);
      } else {
        validation = this.validateFormData(formData);
      }

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
      button.disabled = false;
    }
  };

  FormSubmission.prototype.collectFormData = function () {
    var data = {
      timestamp: new Date().toISOString(),
      patrimonio: null,
      ativosEscolhidos: [],
      alocacao: {},
      session_id: this.generateSessionId(),
      user_agent: navigator.userAgent,
      page_url: window.location.href,
      nome: null,
      email: null,
      telefone: null,
    };

    // Coleta valor do patrimônio
    var patrimonioInput = document.querySelector('[is-main="true"]');
    if (patrimonioInput) {
      data.patrimonio = this.parseCurrencyValue(patrimonioInput.value);
    }

    // Coleta informações de contato se disponíveis
    var nameInput = document.querySelector(
      'input[name*="nome"], input[placeholder*="nome"], #nome'
    );
    if (nameInput && nameInput.value) {
      data.nome = nameInput.value.trim();
    }

    var emailInput = document.querySelector('input[type="email"], input[name*="email"], #email');
    if (emailInput && emailInput.value) {
      data.email = emailInput.value.trim();
    }

    var phoneInput = document.querySelector(
      'input[type="tel"], input[name*="telefone"], input[name*="phone"], #telefone'
    );
    if (phoneInput && phoneInput.value) {
      data.telefone = phoneInput.value.trim();
    }

    // Coleta ativos selecionados - busca por elementos ativos
    var activeItems = document.querySelectorAll(
      '.patrimonio_interactive_item .active-produto-item'
    );
    for (var i = 0; i < activeItems.length; i++) {
      var item = activeItems[i].closest('.patrimonio_interactive_item');
      var product = item.getAttribute('ativo-product');
      var category = item.getAttribute('ativo-category');
      if (product && category) {
        data.ativosEscolhidos.push({ product: product, category: category });
      }
    }

    // Coleta alocações com cálculos
    var totalAlocado = 0;
    var allocationItems = document.querySelectorAll(
      '.patrimonio_interactive_item .active-produto-item'
    );

    for (var i = 0; i < allocationItems.length; i++) {
      var item = allocationItems[i].closest('.patrimonio_interactive_item');
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
          product: product,
        };

        totalAlocado += value;
      }
    }

    // Adiciona cálculos derivados
    data.totalAlocado = totalAlocado;
    data.percentualAlocado = data.patrimonio > 0 ? (totalAlocado / data.patrimonio) * 100 : 0;
    data.patrimonioRestante = data.patrimonio - totalAlocado;

    return data;
  };

  FormSubmission.prototype.validateFormData = function (data) {
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
      errors: errors,
    };
  };

  FormSubmission.prototype.startTypebotFlow = function (formData, button) {
    var self = this;
    var buttonText = button.querySelector('div');

    try {
      if (buttonText) buttonText.textContent = 'Iniciando conversa...';

      // Callback for when Typebot completes
      var onTypebotCompletion = function (typebotData) {
        try {
          // Usar o novo módulo de integração Supabase
          if (self.supabaseIntegration) {
            self.supabaseIntegration
              .saveCalculatorSubmission(formData, typebotData)
              .then(function (result) {
                if (result.success) {
                  // Criar dados para Salesforce com informações do Typebot
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
                    completed_at: new Date().toISOString(),
                    nome: typebotData.nome,
                    email: typebotData.email,
                    telefone: typebotData.telefone,
                  };

                  // Enviar para Salesforce também
                  self.sendToSalesforce(enhancedFormData);

                  if (self.dgmCanvasIntegration) {
                    self.dgmCanvasIntegration.sendData(enhancedFormData);
                  }
                  self.handleSuccessfulSubmission();
                }
              })
              .catch(function (error) {
                self.log('Typebot completion error: ' + error.message);
              });
          } else {
            self.log('⚠️ Supabase integration not available');
          }
        } catch (error) {
          self.log('Typebot completion error: ' + error.message);
        }
      };

      // Start Typebot
      this.typebotIntegration.startTypebotFlow(formData, onTypebotCompletion);
    } catch (error) {
      this.log('Typebot flow error: ' + error.message);
      // Fallback to direct submission
      this.handleDirectSubmission(formData, button);
    }
  };

  FormSubmission.prototype.handleDirectSubmission = function (formData, button) {
    var self = this;
    var buttonText = button.querySelector('div');

    try {
      if (buttonText) buttonText.textContent = 'Enviando...';

      // Usar o novo módulo de integração Supabase
      if (self.supabaseIntegration) {
        self.supabaseIntegration
          .saveCalculatorSubmission(formData)
          .then(function (result) {
            if (result.success) {
              // Enviar para Salesforce também
              self.sendToSalesforce(formData);

              if (self.dgmCanvasIntegration) {
                self.dgmCanvasIntegration.sendData(formData);
              }
              self.handleSuccessfulSubmission();
            }

            // Reset button
            if (buttonText) buttonText.textContent = 'Enviar';
            button.disabled = false;
          })
          .catch(function (error) {
            self.log('Direct submission error: ' + error.message);
            self.showValidationError(error.message);

            // Reset button
            if (buttonText) buttonText.textContent = 'Enviar';
            button.disabled = false;
          });
      } else {
        self.log('⚠️ Supabase integration not available');
        self.showValidationError('Sistema de armazenamento não disponível');

        // Reset button
        if (buttonText) buttonText.textContent = 'Enviar';
        button.disabled = false;
      }
    } catch (error) {
      this.log('Direct submission error: ' + error.message);
      self.showValidationError(error.message);

      // Reset button
      if (buttonText) buttonText.textContent = 'Enviar';
      button.disabled = false;
    }
  };

  FormSubmission.prototype.handleTypebotCompletion = function (enhancedFormData) {
    var self = this;

    try {
      // Prevent duplicate processing
      if (self.isProcessingTypebotCompletion) {
        self.log('🚫 Typebot completion already being processed, skipping duplicate');
        return;
      }

      self.isProcessingTypebotCompletion = true;
      self.log('📝 Processing Typebot completion data:', enhancedFormData);

      // Validate required data
      if (!enhancedFormData || (!enhancedFormData.nome && !enhancedFormData.email)) {
        self.log('⚠️ Invalid Typebot completion data, skipping');
        self.isProcessingTypebotCompletion = false;
        return;
      }

      // Use Supabase integration to save data
      if (self.supabaseIntegration) {
        // Extract Typebot data for Supabase
        var typebotDataForSupabase = {
          nome: enhancedFormData.nome,
          email: enhancedFormData.email,
          telefone: enhancedFormData.telefone,
          sessionId: enhancedFormData.typebotSessionId,
          resultId: enhancedFormData.typebotResultId,
        };

        self.supabaseIntegration
          .saveCalculatorSubmission(enhancedFormData, typebotDataForSupabase)
          .then(function (result) {
            if (result.success) {
              self.log('✅ Data saved to Supabase via Typebot completion');

              // Also send to Salesforce
              self.sendToSalesforce(enhancedFormData);

              if (self.dgmCanvasIntegration) {
                self.dgmCanvasIntegration.sendData(enhancedFormData);
              }

              self.handleSuccessfulSubmission();
            } else {
              self.log('❌ Failed to save to Supabase: ' + result.error);
            }
          })
          .catch(function (error) {
            self.log('❌ Supabase integration error: ' + error.message);
          })
          .finally(function () {
            // Reset processing flag
            self.isProcessingTypebotCompletion = false;
          });
      } else {
        self.log('⚠️ Supabase integration not available for Typebot completion');
        self.isProcessingTypebotCompletion = false;
      }
    } catch (error) {
      self.log('❌ Error handling Typebot completion: ' + error.message);
      self.isProcessingTypebotCompletion = false;
    }
  };

  FormSubmission.prototype.handleSuccessfulSubmission = function () {
    this.showSuccessMessage('Dados enviados com sucesso!');
  };

  FormSubmission.prototype.sendToSalesforce = function (data) {
    var self = this;

    try {
      // Verificar se Salesforce está disponível
      if (!window.ReinoSalesforce || !window.ReinoSalesforce.api.isInitialized) {
        self.log('Salesforce not initialized, skipping sync');
        return Promise.resolve({ success: false, error: 'Salesforce not available' });
      }

      // Transformar dados para formato Salesforce Lead
      var salesforceData = {
        // Campos obrigatórios do Lead
        LastName: self.extractLastName(data.nome || data.typebot_results?.nome),
        FirstName: self.extractFirstName(data.nome || data.typebot_results?.nome),
        Email: data.email || data.typebot_results?.email,
        Phone: data.telefone || data.typebot_results?.telefone,
        Company: 'Reino Capital - Calculadora',

        // Campos personalizados da calculadora
        Patrimonio__c: data.patrimonio,
        Ativos_Escolhidos__c: JSON.stringify(data.ativosEscolhidos || data.ativos_escolhidos),
        Alocacao__c: JSON.stringify(data.alocacao),

        // Dados de origem e rastreamento
        LeadSource: 'Website Calculator',
        Session_ID__c: data.session_id,
        User_Agent__c: data.user_agent,
        Page_URL__c: data.page_url,

        // Dados do Typebot
        Typebot_Completed__c: !!(
          data.typebot_results || data.submission_type === 'typebot_enhanced'
        ),
        Typebot_Data__c: data.typebot_results ? JSON.stringify(data.typebot_results) : null,
        Submission_Type__c: data.submission_type || 'direct',

        // Timestamps
        Data_Submissao__c: data.timestamp || data.submitted_at,
        Typebot_Completed_At__c: data.completed_at,
      };

      // Enviar para Salesforce
      return window.ReinoSalesforce.api
        .createRecord('Lead', salesforceData)
        .then(function (result) {
          self.log('Data sent to Salesforce successfully: ' + result.id);
          return { success: true, data: result };
        })
        .catch(function (error) {
          self.log('Salesforce error: ' + error.message);
          return { success: false, error: error.message };
        });
    } catch (error) {
      self.log('Salesforce integration error: ' + error.message);
      return Promise.resolve({ success: false, error: error.message });
    }
  };

  // Métodos auxiliares para processar nomes
  FormSubmission.prototype.extractFirstName = function (fullName) {
    if (!fullName) return 'Prospect';
    var parts = fullName.trim().split(' ');
    return parts[0] || 'Prospect';
  };

  FormSubmission.prototype.extractLastName = function (fullName) {
    if (!fullName) return 'Calculator';
    var parts = fullName.trim().split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : 'Calculator';
  };

  // Utility methods
  FormSubmission.prototype.parseCurrencyValue = function (value) {
    if (!value) return 0;
    return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
  };

  FormSubmission.prototype.generateSessionId = function () {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  FormSubmission.prototype.showValidationError = function (message) {
    this.showToast(message, 'error');
  };

  FormSubmission.prototype.showSuccessMessage = function (message) {
    this.showToast(message, 'success');
  };

  FormSubmission.prototype.showToast = function (message, type) {
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
      'background: ' +
      backgroundColor +
      ';';

    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  };

  FormSubmission.prototype.debounce = function (func, wait) {
    var timeout;
    var self = this;
    return function () {
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        func.apply(self, args);
      }, wait);
    };
  };

  FormSubmission.prototype.log = function (message) {
    if (this.debugMode) {
      console.log('📝 [FormSubmission] ' + message);
    }
  };

  // Public API
  FormSubmission.prototype.setTypebotIntegration = function (typebotIntegration) {
    this.typebotIntegration = typebotIntegration;
    this.log('Typebot integration set');
  };

  FormSubmission.prototype.setTypebotEnabled = function (enabled) {
    this.useTypebot = enabled;
    this.log('Typebot ' + (enabled ? 'enabled' : 'disabled'));
  };

  // Cria instância global
  const formSubmissionInstance = new FormSubmission();
  window.ReinoFormSubmission = FormSubmission;
  window.ReinoFormSubmissionInstance = formSubmissionInstance;

  return FormSubmission;
})();
