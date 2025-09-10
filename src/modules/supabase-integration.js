/**
 * Supabase Integration Module
 * Centraliza toda a lógica de integração com Supabase
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class SupabaseIntegration {
    constructor() {
      this.client = null;
      this.tableName = 'calculator_submissions';
      this.isReady = false;
      this.debugMode = window.location.search.includes('debug=true');

      this.lastCommissionData = null;

      this.init();
    }

    async init() {
      try {
        await this.waitForSupabaseClient();
        this.setupClient();
        this.setupEventListeners();
        this.isReady = true;
      } catch (error) {
        this.log('❌ Failed to initialize Supabase: ' + error.message);
      }
    }

    waitForSupabaseClient() {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;

        const check = () => {
          if (window.ReinoSupabase && window.ReinoSupabase.client) {
            resolve();
          } else if (attempts >= maxAttempts) {
            reject(new Error('Supabase client not available after waiting'));
          } else {
            attempts++;
            setTimeout(check, 100);
          }
        };

        check();
      });
    }

    setupClient() {
      if (window.ReinoSupabase && window.ReinoSupabase.client) {
        this.client = window.ReinoSupabase.client;
        this.tableName = window.ReinoSupabase.tableName || 'calculator_submissions';
      } else {
        throw new Error('ReinoSupabase not available');
      }
    }

    setupEventListeners() {
      document.addEventListener('totalComissaoChanged', (e) => {
        this.lastCommissionData = {
          total: e.detail.total,
          details: e.detail.details,
          timestamp: new Date().toISOString(),
        };
        this.log('📊 Commission data captured:', this.lastCommissionData);
      });
    }

    async saveCalculatorSubmission(formData, typebotData = null) {
      try {
        if (!this.isReady || !this.client) {
          throw new Error('Supabase not ready');
        }

        const mappedData = this.mapFormDataToSupabase(formData, typebotData);

        const { data, error } = await this.client
          .from(this.tableName)
          .insert([mappedData])
          .select()
          .single();

        if (error) {
          throw error;
        }

        return { success: true, data };
      } catch (error) {
        this.log('❌ Supabase save error: ' + error.message);
        return { success: false, error: error.message };
      }
    }

    mapFormDataToSupabase(formData, typebotData = null) {
      const baseData = {
        patrimonio: formData.patrimonio || 0,
        ativos_escolhidos: formData.ativosEscolhidos || [],
        alocacao: formData.alocacao || {},
        user_agent: formData.user_agent || navigator.userAgent,
        session_id: formData.session_id || this.generateSessionId(),
        total_alocado: formData.totalAlocado || 0,
        percentual_alocado: formData.percentualAlocado || 0,
        patrimonio_restante: formData.patrimonioRestante || 0,
        submitted_at: new Date().toISOString(),
      };

      const indiceGiro = window.ReinoRotationIndexController
        ? window.ReinoRotationIndexController.getCurrentIndex()
        : 2;

      baseData.comissao_total_calculada = this.lastCommissionData
        ? this.lastCommissionData.total
        : 0;
      baseData.indice_giro_usado = indiceGiro;
      baseData.detalhes_comissao = this.lastCommissionData ? this.lastCommissionData.details : [];

      if (typebotData) {
        baseData.nome = typebotData.nome || formData.nome;
        baseData.email = typebotData.email || formData.email;
        baseData.telefone = typebotData.telefone || formData.telefone;
        baseData.typebot_session_id = typebotData.sessionId;
        baseData.typebot_result_id = typebotData.resultId;
      } else {
        baseData.nome = formData.nome;
        baseData.email = formData.email;
        baseData.telefone = formData.telefone;
      }

      return baseData;
    }

    async getSubmissionHistory(sessionId) {
      try {
        if (!this.isReady || !this.client) {
          throw new Error('Supabase not ready');
        }

        const { data, error } = await this.client
          .from(this.tableName)
          .select('*')
          .eq('session_id', sessionId)
          .order('submitted_at', { ascending: false });

        if (error) {
          throw error;
        }

        return { success: true, data };
      } catch (error) {
        this.log('❌ Error fetching history: ' + error.message);
        return { success: false, error: error.message };
      }
    }

    async updateSubmissionWithTypebot(submissionId, typebotData) {
      try {
        if (!this.isReady || !this.client) {
          throw new Error('Supabase not ready');
        }

        const updateData = {
          nome: typebotData.nome,
          email: typebotData.email,
          typebot_session_id: typebotData.sessionId,
          typebot_result_id: typebotData.resultId,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await this.client
          .from(this.tableName)
          .update(updateData)
          .eq('id', submissionId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        this.log('✅ Submission updated with Typebot data:', data);
        return { success: true, data };
      } catch (error) {
        this.log('❌ Error updating submission: ' + error.message);
        return { success: false, error: error.message };
      }
    }

    generateSessionId() {
      return 'calc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    validateFormData(formData) {
      const errors = [];

      if (!formData.patrimonio || formData.patrimonio <= 0) {
        errors.push('Patrimônio deve ser maior que zero');
      }

      if (!formData.ativosEscolhidos || formData.ativosEscolhidos.length === 0) {
        errors.push('Pelo menos um ativo deve ser selecionado');
      }

      if (formData.percentualAlocado && formData.percentualAlocado < 100) {
        errors.push('Patrimônio deve estar 100% alocado');
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    }

    getCurrentCommissionData() {
      return {
        commission: this.lastCommissionData,
        rotationIndex: window.ReinoRotationIndexController
          ? window.ReinoRotationIndexController.getCurrentIndex()
          : 2,
        timestamp: new Date().toISOString(),
      };
    }

    parseCurrencyValue(value) {
      if (!value) return 0;
      const cleaned = value
        .toString()
        .replace(/[^\d,]/g, '')
        .replace(',', '.');
      return parseFloat(cleaned) || 0;
    }

    getStatus() {
      return {
        ready: this.isReady,
        hasClient: !!this.client,
        tableName: this.tableName,
        debugMode: this.debugMode,
      };
    }

    log(message) {
      if (this.debugMode) {
        // Debug logging removed for production
      }
    }
  }

  const supabaseIntegration = new SupabaseIntegration();

  window.ReinoSupabaseIntegration = supabaseIntegration;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      supabaseIntegration.init();
    });
  } else {
    supabaseIntegration.init();
  }
})();
