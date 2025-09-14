/**
 * Salesforce Configuration and API Client
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  // Salesforce configuration
  const SALESFORCE_CONFIG = {
    // OAuth 2.0 Configuration
    CLIENT_ID: '3MVG9Xl3BC6VHB.ajXGO2p2AGuJtw9GU2JdBlXw4PWsw8DyLvcr6p.iFCV3kv5skIwXM7ZSVkMQ==', // Set your Connected App Consumer Key
    REDIRECT_URI: window.location.origin + '/oauth-callback.html',
    LOGIN_URL: 'https://login.salesforce.com',
    SANDBOX_URL: 'https://test.salesforce.com',

    // API Configuration
    API_VERSION: 'v62.0',

    // Salesforce Objects
    OBJECTS: {
      CALCULATOR_SUBMISSION: 'Lead',
    },

    // Request timeout in milliseconds
    TIMEOUT: 30000,

    // Retry configuration
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  };

  // Salesforce API Client
  class SalesforceAPI {
    constructor() {
      this.accessToken = null;
      this.instanceUrl = null;
      this.isInitialized = false;
      this.authWindow = null;
    }

    async init() {
      if (this.isInitialized) {
        return true;
      }

      try {
        // Check for existing session
        const storedToken = sessionStorage.getItem('sf_access_token');
        const storedInstance = sessionStorage.getItem('sf_instance_url');

        if (storedToken && storedInstance) {
          this.accessToken = storedToken;
          this.instanceUrl = storedInstance;

          // Validate token
          const isValid = await this.validateToken();
          if (isValid) {
            this.isInitialized = true;
            return true;
          }
        }

        // If no valid token, need to authenticate
        return false;
      } catch (error) {
        console.error('❌ Salesforce API initialization failed:', error);
        return false;
      }
    }

    async authenticate() {
      return new Promise((resolve, reject) => {
        if (!SALESFORCE_CONFIG.CLIENT_ID) {
          reject(new Error('Salesforce CLIENT_ID not configured'));
          return;
        }

        const authUrl = this.buildAuthUrl();

        // Open popup for OAuth
        this.authWindow = window.open(
          authUrl,
          'salesforce_auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Listen for auth completion
        const checkClosed = setInterval(() => {
          if (this.authWindow.closed) {
            clearInterval(checkClosed);
            reject(new Error('Authentication cancelled'));
          }
        }, 1000);

        // Listen for auth success message
        window.addEventListener(
          'message',
          (event) => {
            if (event.origin !== window.location.origin) {
              return;
            }

            if (event.data.type === 'salesforce_auth_success') {
              clearInterval(checkClosed);
              this.authWindow.close();

              this.accessToken = event.data.access_token;
              this.instanceUrl = event.data.instance_url;

              // Store tokens
              sessionStorage.setItem('sf_access_token', this.accessToken);
              sessionStorage.setItem('sf_instance_url', this.instanceUrl);

              this.isInitialized = true;
              resolve(true);
            } else if (event.data.type === 'salesforce_auth_error') {
              clearInterval(checkClosed);
              this.authWindow.close();
              reject(new Error(event.data.error));
            }
          },
          { once: true }
        );
      });
    }

    buildAuthUrl() {
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: SALESFORCE_CONFIG.CLIENT_ID,
        redirect_uri: SALESFORCE_CONFIG.REDIRECT_URI,
        scope: 'api refresh_token',
        state: Math.random().toString(36).substring(7),
      });

      return `${SALESFORCE_CONFIG.LOGIN_URL}/services/oauth2/authorize?${params}`;
    }

    async validateToken() {
      if (!this.accessToken || !this.instanceUrl) {
        return false;
      }

      try {
        const response = await this.makeRequest('GET', '/services/data');
        return response.ok;
      } catch (error) {
        return false;
      }
    }

    async createRecord(objectType, data) {
      if (!this.isInitialized) {
        throw new Error('Salesforce API not initialized');
      }

      const endpoint = `/services/data/v${SALESFORCE_CONFIG.API_VERSION}/sobjects/${objectType}`;

      try {
        const response = await this.makeRequest('POST', endpoint, data);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Salesforce API Error: ${errorData[0]?.message || 'Unknown error'}`);
        }

        return await response.json();
      } catch (error) {
        console.error('❌ Error creating Salesforce record:', error);
        throw error;
      }
    }

    async makeRequest(method, endpoint, data = null) {
      const url = `${this.instanceUrl}${endpoint}`;

      const options = {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      };

      if (data && (method === 'POST' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
      }

      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SALESFORCE_CONFIG.TIMEOUT);
      options.signal = controller.signal;

      try {
        const response = await fetch(url, options);
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }

    logout() {
      this.accessToken = null;
      this.instanceUrl = null;
      this.isInitialized = false;

      sessionStorage.removeItem('sf_access_token');
      sessionStorage.removeItem('sf_instance_url');
    }

    getStatus() {
      return {
        isInitialized: this.isInitialized,
        hasToken: !!this.accessToken,
        instanceUrl: this.instanceUrl,
      };
    }
  }

  // Configuration validation
  function validateSalesforceConfig() {
    const errors = [];

    if (!SALESFORCE_CONFIG.CLIENT_ID) {
      errors.push('CLIENT_ID is required');
    }

    if (!SALESFORCE_CONFIG.REDIRECT_URI) {
      errors.push('REDIRECT_URI is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      message: errors.length > 0 ? errors.join(', ') : 'Configuration is valid',
    };
  }

  // Create global instance
  const salesforceAPI = new SalesforceAPI();

  // Export globally
  window.ReinoSalesforce = {
    config: SALESFORCE_CONFIG,
    api: salesforceAPI,
    validateConfig: validateSalesforceConfig,
  };

  // For backward compatibility with existing imports
  window.SALESFORCE_CONFIG = SALESFORCE_CONFIG;
  window.salesforceAPI = salesforceAPI;
  window.validateSalesforceConfig = validateSalesforceConfig;

  // Dispatch ready event
  document.dispatchEvent(
    new CustomEvent('salesforceConfigReady', {
      detail: { configured: validateSalesforceConfig().isValid },
    })
  );
})();
