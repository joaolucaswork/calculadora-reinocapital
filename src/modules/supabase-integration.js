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

      // Environment detection and isolation
      this.environment = this.detectEnvironment();
      this.testRunId = this.generateTestRunId();

      this.lastCommissionData = null;
      this.lastAppStateSnapshot = null;

      this.init();
    }

    detectEnvironment() {
      // Check for explicit environment setting
      if (window.REINO_ENVIRONMENT) {
        return window.REINO_ENVIRONMENT;
      }

      // Check URL patterns
      const { hostname } = window.location;
      const { search } = window.location;

      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return search.includes('test=true') ? 'testing' : 'development';
      }

      if (hostname.includes('test') || hostname.includes('staging')) {
        return 'testing';
      }

      if (search.includes('test=true') || search.includes('playwright=true')) {
        return 'testing';
      }

      // Check for test user agents (Playwright, etc.)
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('playwright') || userAgent.includes('headless')) {
        return 'testing';
      }

      return 'production';
    }

    generateTestRunId() {
      if (this.environment === 'testing') {
        return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      return null;
    }

    async init() {
      try {
        await this.waitForSupabaseClient();
        await this.waitForAppState();
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

    waitForAppState() {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;

        const check = () => {
          if (window.ReinoAppState && window.ReinoAppState.isInitialized) {
            resolve();
          } else if (attempts >= maxAttempts) {
            reject(new Error('AppState not available after waiting'));
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

      document.addEventListener('appStateChanged', (e) => {
        this.lastAppStateSnapshot = e.detail.snapshot;
        this.log('📊 AppState snapshot captured:', this.lastAppStateSnapshot);
      });

      document.addEventListener('appStateReady', () => {
        this.lastAppStateSnapshot = window.ReinoAppState.getStateSnapshot();
        this.log('📊 Initial AppState snapshot captured');
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
      const snapshot = this.getAppStateSnapshot();

      const baseData = {
        patrimonio: snapshot.patrimonio.value || formData.patrimonio || 0,
        ativos_escolhidos:
          this.convertSelectedAssetsFormat(snapshot.selectedAssets) ||
          formData.ativosEscolhidos ||
          [],
        alocacao:
          this.convertAllocationFormat(snapshot.allocations, snapshot.patrimonio.value) ||
          formData.alocacao ||
          {},
        user_agent: formData.user_agent || navigator.userAgent,
        session_id: formData.session_id || this.generateSessionId(),
        total_alocado: this.calculateTotalAllocated(snapshot.allocations),
        percentual_alocado: this.calculatePercentualAlocado(snapshot),
        patrimonio_restante: this.calculatePatrimonioRestante(snapshot),
        submitted_at: new Date().toISOString(),

        // Environment isolation fields
        environment: this.environment,
        test_run_id: this.testRunId,
        created_by: this.getCreatedByValue(),
      };

      baseData.comissao_total_calculada = this.lastCommissionData
        ? this.lastCommissionData.total
        : snapshot.commission?.value || 0;
      baseData.indice_giro_usado = snapshot.rotationIndex.value || 2;
      baseData.detalhes_comissao = this.lastCommissionData
        ? this.lastCommissionData.details
        : snapshot.commission?.details || [];

      if (typebotData) {
        baseData.nome = this.sanitizeTestData(typebotData.nome || formData.nome);
        baseData.email = this.sanitizeTestData(typebotData.email || formData.email);
        baseData.telefone = this.sanitizeTestData(typebotData.telefone || formData.telefone);
        baseData.typebot_session_id = typebotData.sessionId;
        baseData.typebot_result_id = typebotData.resultId;
      } else {
        baseData.nome = this.sanitizeTestData(formData.nome);
        baseData.email = this.sanitizeTestData(formData.email);
        baseData.telefone = this.sanitizeTestData(formData.telefone);
      }

      return baseData;
    }

    getCreatedByValue() {
      if (this.environment === 'testing') {
        // Check for explicit test mode first
        if (window.REINO_TEST_MODE) {
          return 'playwright-test';
        }

        const userAgent = navigator.userAgent.toLowerCase();
        if (
          userAgent.includes('playwright') ||
          (userAgent.includes('chrome') && userAgent.includes('headless'))
        ) {
          return 'playwright-test';
        }
        if (userAgent.includes('headless')) {
          return 'headless-test';
        }
        return 'automated-test';
      }
      return 'user';
    }

    sanitizeTestData(value) {
      if (!value) return value;

      // Add test prefix for testing environment
      if (this.environment === 'testing' && typeof value === 'string') {
        // Only add prefix if not already present
        if (!value.toLowerCase().includes('test') && !value.toLowerCase().includes('playwright')) {
          if (value.includes('@')) {
            // Email: add test prefix to local part
            return value.replace('@', '+test@');
          }
          // Name or phone: add test prefix
          return `Test ${value}`;
        }
      }

      return value;
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

    getAppStateSnapshot() {
      if (this.lastAppStateSnapshot) {
        return this.lastAppStateSnapshot;
      }

      if (window.ReinoAppState && window.ReinoAppState.isInitialized) {
        return window.ReinoAppState.getStateSnapshot();
      }

      return {
        patrimonio: { value: 0 },
        selectedAssets: [],
        allocations: {},
        rotationIndex: { value: 2 },
        commission: { value: 0, details: [] },
      };
    }

    convertSelectedAssetsFormat(selectedAssets) {
      if (!selectedAssets || !Array.isArray(selectedAssets)) {
        return [];
      }

      return selectedAssets
        .map((assetKey) => {
          // AppState usa formato "categoria:produto" em lowercase
          const [category, product] = assetKey.split(':');
          return {
            // Converter para formato original com capitalização
            category: this.capitalizeWords(category) || 'Unknown',
            product: this.capitalizeWords(product) || 'Unknown',
          };
        })
        .filter((asset) => asset.category !== 'Unknown' && asset.product !== 'Unknown');
    }

    convertAllocationFormat(allocations, patrimonio) {
      if (!allocations || typeof allocations !== 'object') {
        return {};
      }

      const converted = {};

      Object.entries(allocations).forEach(([assetKey, value]) => {
        // AppState usa formato "categoria:produto" em lowercase
        const [category, product] = assetKey.split(':');

        // Skip if split failed
        if (!category || !product) {
          this.log(`⚠️ Invalid asset key format: ${assetKey}`);
          return;
        }

        const numericValue = parseFloat(value) || 0;
        const percentage = patrimonio > 0 ? (numericValue / patrimonio) * 100 : 0;

        // Converter para formato original com capitalização
        const capitalizedCategory = this.capitalizeWords(category);
        const capitalizedProduct = this.capitalizeWords(product);
        const originalKey = `${capitalizedCategory}-${capitalizedProduct}`;

        converted[originalKey] = {
          value: numericValue,
          percentage: percentage,
          category: capitalizedCategory,
          product: capitalizedProduct,
        };
      });

      return converted;
    }

    capitalizeWords(str) {
      if (!str) return '';

      // Mapeamento para preservar formatação original de produtos e categorias
      const originalFormatMap = {
        // Produtos
        cdb: 'CDB',
        cri: 'CRI',
        coe: 'COE',
        'títulos públicos': 'Títulos Públicos',
        ações: 'Ações',
        liquidez: 'Liquidez',
        multimercado: 'Multimercado',
        'imobiliários cetipados': 'Imobiliários Cetipados',
        'private equity': 'Private Equity',
        'ações e ativos': 'Ações e Ativos',
        'operação estruturada': 'Operação Estruturada',
        'carteira administrada': 'Carteira administrada',
        dólar: 'Dólar',
        'inter produtos': 'Inter Produtos',
        poupança: 'Poupança',
        'operação compromissada': 'Operação compromissada',

        // Categorias
        'renda fixa': 'Renda Fixa',
        'fundo de investimento': 'Fundo de Investimento',
        'renda variável': 'Renda Variável',
        internacional: 'Internacional',
        previdência: 'Previdência',
        outros: 'Outros',
      };

      const normalized = str.toLowerCase().trim();

      // Verifica se existe mapeamento específico
      if (originalFormatMap[normalized]) {
        return originalFormatMap[normalized];
      }

      // Fallback para capitalização padrão
      return str
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    calculateTotalAllocated(allocations) {
      return Object.values(allocations || {}).reduce((sum, value) => sum + (value || 0), 0);
    }

    calculatePercentualAlocado(snapshot) {
      const total = this.calculateTotalAllocated(snapshot.allocations);
      const patrimonio = snapshot.patrimonio.value || 0;
      return patrimonio > 0 ? (total / patrimonio) * 100 : 0;
    }

    calculatePatrimonioRestante(snapshot) {
      const total = this.calculateTotalAllocated(snapshot.allocations);
      const patrimonio = snapshot.patrimonio.value || 0;
      return patrimonio - total;
    }

    getCurrentCommissionData() {
      const snapshot = this.getAppStateSnapshot();

      return {
        commission: this.lastCommissionData || snapshot.commission,
        rotationIndex: snapshot.rotationIndex.value,
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

    async cleanupTestData() {
      if (this.environment === 'production') {
        throw new Error('Cannot cleanup test data in production environment');
      }

      if (!this.isReady || !this.client) {
        throw new Error('Supabase not ready');
      }

      try {
        const { data, error } = await this.client
          .from(this.tableName)
          .delete()
          .eq('environment', this.environment);

        if (error) {
          throw error;
        }

        return { success: true, deletedCount: data?.length || 0 };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async cleanupTestRunData(testRunId = null) {
      const runId = testRunId || this.testRunId;

      if (!runId) {
        throw new Error('No test run ID provided');
      }

      if (!this.isReady || !this.client) {
        throw new Error('Supabase not ready');
      }

      try {
        const { data, error } = await this.client
          .from(this.tableName)
          .delete()
          .eq('test_run_id', runId);

        if (error) {
          throw error;
        }

        return { success: true, deletedCount: data?.length || 0 };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    getStatus() {
      return {
        isReady: this.isReady,
        environment: this.environment,
        testRunId: this.testRunId,
        tableName: this.tableName,
        hasClient: !!this.client,
        debugMode: this.debugMode,
        createdBy: this.getCreatedByValue(),
        isTestEnvironment: this.environment !== 'production',
      };
    }

    log(message) {
      if (this.debugMode) {
        console.log(`[SupabaseIntegration] ${message}`);
      }
    }
  }

  const supabaseIntegration = new SupabaseIntegration();

  // Expose the complete instance for testing and form submission
  window.ReinoSupabaseIntegration = supabaseIntegration;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      supabaseIntegration.init();
    });
  } else {
    supabaseIntegration.init();
  }
})();
