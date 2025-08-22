/**
 * DGM Canvas Integration System
 * Handles sending processed form data to DGM Canvas
 *
 * This module is responsible for:
 * - Formatting data for DGM Canvas
 * - Sending HTTP requests to DGM Canvas API
 * - Handling success/error responses
 * - Providing configuration options
 */

/* global navigator, fetch, AbortController */

export class DGMCanvasIntegration {
  constructor(config = {}) {
    this.isInitialized = false;
    this.debugMode = false;

    // Configuration
    this.config = {
      endpoint: config.endpoint || this.getDefaultEndpoint(),
      timeout: config.timeout || 30000, // 30 seconds
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000, // 1 second
      ...config,
    };

    // Headers
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Source': 'app-calc-reino',
      'X-Version': '1.0.0',
      ...config.headers,
    };
  }

  /**
   * Get default endpoint based on environment
   * @returns {string} Default endpoint URL
   */
  getDefaultEndpoint() {
    // Check if running in development or production
    if (typeof window !== 'undefined') {
      const isDevelopment =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('webflow.io') || // Webflow preview
        window.location.search.includes('debug=true');

      if (isDevelopment) {
        return 'http://localhost:5173/api/data'; // DGM Canvas dev server
      }
    }

    // Production endpoint - você pode configurar conforme necessário
    return 'https://your-dgm-canvas-production-url.com/api/data';
  }

  async init() {
    if (this.isInitialized) return;

    try {
      // Setup debug mode
      this.debugMode =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.search.includes('debug=true');

      // Test connection if in debug mode
      if (this.debugMode) {
        await this.testConnection();
      }

      this.isInitialized = true;

      if (this.debugMode) {
        // eslint-disable-next-line no-console
        console.log('✅ [DGMCanvas] Integration initialized');
        // eslint-disable-next-line no-console
        console.log('📋 [DGMCanvas] Config:', this.config);
        // eslint-disable-next-line no-console
        console.log('🌐 [DGMCanvas] Endpoint:', this.config.endpoint);
      }
    } catch (error) {
      console.error('❌ [DGMCanvas] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Test connection to DGM Canvas
   */
  async testConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(this.config.endpoint + '/health', {
        method: 'GET',
        headers: {
          'X-Source': 'app-calc-reino-test',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // eslint-disable-next-line no-console
        console.log('✅ [DGMCanvas] Connection test successful');
      } else {
        console.warn('⚠️ [DGMCanvas] Connection test failed with status:', response.status);
      }
    } catch (error) {
      console.warn('⚠️ [DGMCanvas] Connection test failed:', error.message);
    }
  }

  /**
   * Send data to DGM Canvas
   * @param {Object} formData - The collected form data
   * @param {Object} supabaseResult - The result from Supabase insertion
   * @returns {Promise<Object>} Result object with success status
   */
  async sendData(formData, supabaseResult = null) {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      if (this.debugMode) {
        // eslint-disable-next-line no-console
        console.log('🎨 [DGMCanvas] Preparing data for transmission...');
        // eslint-disable-next-line no-console
        console.log('🌐 [DGMCanvas] Target endpoint:', this.config.endpoint);
      }

      // Format data for DGM Canvas
      const dgmData = this.formatDataForDGM(formData, supabaseResult);

      if (this.debugMode) {
        // eslint-disable-next-line no-console
        console.log('📊 [DGMCanvas] Formatted data summary:');
        // eslint-disable-next-line no-console
        console.log(`💰 Patrimônio: R$ ${dgmData.patrimonio.total.toLocaleString('pt-BR')}`);
        // eslint-disable-next-line no-console
        console.log(`📈 Ativos escolhidos: ${dgmData.ativos.escolhidos.length} itens`);
        dgmData.ativos.escolhidos.forEach((ativo, index) => {
          // eslint-disable-next-line no-console
          console.log(`   ${index + 1}. ${ativo.product} (${ativo.category})`);
        });
        // eslint-disable-next-line no-console
        console.log(
          `💼 Alocações com valor: ${dgmData.ativos.alocacao.filter((a) => a.value > 0).length} itens`
        );
        dgmData.ativos.alocacao
          .filter((a) => a.value > 0)
          .forEach((ativo) => {
            // eslint-disable-next-line no-console
            console.log(
              `   • ${ativo.product}: ${ativo.valueFormatted} (${ativo.percentageFormatted})`
            );
          });
        // eslint-disable-next-line no-console
        console.log(
          `👤 Usuário: ${dgmData.usuario.nome || 'N/A'} (${dgmData.usuario.email || 'N/A'})`
        );
        // eslint-disable-next-line no-console
        console.log('📋 [DGMCanvas] Full data:', JSON.stringify(dgmData, null, 2));
      }

      // Send with retry logic
      const result = await this.sendWithRetry(dgmData);

      if (this.debugMode) {
        // eslint-disable-next-line no-console
        console.log('✅ [DGMCanvas] Data sent successfully:', result);
      }

      // Dispatch success event
      this.dispatchEvent('dgmCanvasDataSent', {
        dgmData,
        result,
        success: true,
      });

      return { success: true, result };
    } catch (error) {
      console.error('❌ [DGMCanvas] Failed to send data:', error);

      // Dispatch error event
      this.dispatchEvent('dgmCanvasError', {
        error: error.message,
        formData,
        supabaseResult,
      });

      // Don't throw - let calling code decide how to handle
      return { success: false, error: error.message };
    }
  }

  /**
   * Format form data for DGM Canvas
   * @param {Object} formData - Raw form data
   * @param {Object} supabaseResult - Supabase insertion result
   * @returns {Object} Formatted data for DGM Canvas
   */
  formatDataForDGM(formData, supabaseResult) {
    // Calculate totals
    const totalAlocado = Object.values(formData.alocacao || {}).reduce(
      (sum, item) => sum + (item.value || 0),
      0
    );

    const patrimonioRestante = (formData.patrimonio || 0) - totalAlocado;
    const percentualAlocado =
      formData.patrimonio > 0 ? (totalAlocado / formData.patrimonio) * 100 : 0;

    return {
      // Identification
      id: supabaseResult?.id || this.generateTempId(),
      timestamp: formData.timestamp || new Date().toISOString(),

      // Financial data
      patrimonio: {
        total: formData.patrimonio || 0,
        totalFormatted: this.formatCurrency(formData.patrimonio || 0),
        alocado: totalAlocado,
        alocadoFormatted: this.formatCurrency(totalAlocado),
        restante: patrimonioRestante,
        restanteFormatted: this.formatCurrency(patrimonioRestante),
        percentualAlocado: Math.round(percentualAlocado * 100) / 100,
        percentualAlocadoFormatted: `${Math.round(percentualAlocado * 100) / 100}%`,
      },

      // Asset allocation
      ativos: {
        escolhidos: formData.ativosEscolhidos || [],
        alocacao: this.formatAllocationForDGM(formData.alocacao || {}),
        resumo: this.generateAllocationSummary(formData.alocacao || {}),
      },

      // User information (if available from Typebot)
      usuario: {
        nome: formData.nome || null,
        email: formData.email || null,
        hasUserData: !!(formData.nome || formData.email),
      },

      // Integration metadata
      metadata: {
        source: 'app-calc-reino',
        version: '1.0.0',
        hasTypebot: !!(formData.typebotSessionId || formData.typebotResultId),
        typebotSessionId: formData.typebotSessionId || null,
        typebotResultId: formData.typebotResultId || null,
        userAgent:
          formData.userAgent ||
          (typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'),
        sessionId: formData.sessionId || this.generateTempId(),
        supabaseId: supabaseResult?.id || null,
        submittedAt: formData.timestamp || new Date().toISOString(),
      },
    };
  }

  /**
   * Format allocation data for DGM Canvas
   * @param {Object} allocation - Raw allocation data
   * @returns {Array} Formatted allocation array
   */
  formatAllocationForDGM(allocation) {
    return Object.entries(allocation).map(([key, data]) => ({
      key,
      category: data.category || 'unknown',
      product: data.product || 'unknown',
      value: data.value || 0,
      valueFormatted: this.formatCurrency(data.value || 0),
      percentage: data.percentage || 0,
      percentageFormatted: `${Math.round((data.percentage || 0) * 100) / 100}%`,
    }));
  }

  /**
   * Generate allocation summary
   * @param {Object} allocation - Raw allocation data
   * @returns {Object} Summary statistics
   */
  generateAllocationSummary(allocation) {
    const categories = {};
    let totalValue = 0;

    Object.values(allocation).forEach((item) => {
      const category = item.category || 'unknown';
      const value = item.value || 0;

      if (!categories[category]) {
        categories[category] = { value: 0, count: 0 };
      }

      categories[category].value += value;
      categories[category].count += 1;
      totalValue += value;
    });

    return {
      totalItems: Object.keys(allocation).length,
      totalValue,
      totalValueFormatted: this.formatCurrency(totalValue),
      categories: Object.entries(categories).map(([name, data]) => ({
        name,
        value: data.value,
        valueFormatted: this.formatCurrency(data.value),
        count: data.count,
        percentage: totalValue > 0 ? Math.round((data.value / totalValue) * 100 * 100) / 100 : 0,
        percentageFormatted:
          totalValue > 0 ? `${Math.round((data.value / totalValue) * 100 * 100) / 100}%` : '0%',
      })),
    };
  }

  /**
   * Send data with retry logic
   * @param {Object} data - Data to send
   * @returns {Promise<Object>} Response data
   */
  async sendWithRetry(data) {
    let lastError;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt += 1) {
      try {
        if (this.debugMode && attempt > 1) {
          // eslint-disable-next-line no-console
          console.log(`🔄 [DGMCanvas] Retry attempt ${attempt}/${this.config.retryAttempts}`);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: this.defaultHeaders,
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (this.debugMode) {
          // eslint-disable-next-line no-console
          console.log(`✅ [DGMCanvas] Data sent successfully to DGM Canvas on attempt ${attempt}`);
        }

        return result;
      } catch (error) {
        lastError = error;

        if (this.debugMode) {
          console.warn(`⚠️ [DGMCanvas] Attempt ${attempt} failed:`, error.message);
        }

        // Don't retry on certain errors
        if (error.name === 'AbortError' || error.message.includes('400')) {
          break;
        }

        // Wait before retry (except on last attempt)
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.headers) {
      this.defaultHeaders = { ...this.defaultHeaders, ...newConfig.headers };
    }

    if (this.debugMode) {
      // eslint-disable-next-line no-console
      console.log('🔧 [DGMCanvas] Configuration updated:', this.config);
      // eslint-disable-next-line no-console
      console.log('🌐 [DGMCanvas] New endpoint:', this.config.endpoint);
    }
  }

  /**
   * Reinitialize with new configuration (useful for testing)
   * @param {Object} newConfig - New configuration options
   */
  async reinitialize(newConfig = {}) {
    this.isInitialized = false;
    this.updateConfig(newConfig);
    await this.init();
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Get integration status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      debugMode: this.debugMode,
      endpoint: this.config.endpoint,
      lastError: this.lastError || null,
      version: '1.0.0',
    };
  }

  // Utility methods
  generateTempId() {
    return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  dispatchEvent(eventName, detail) {
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
  }
}

// Export singleton instance
export const dgmCanvasIntegration = new DGMCanvasIntegration();

// Export class for custom instances
export default DGMCanvasIntegration;
