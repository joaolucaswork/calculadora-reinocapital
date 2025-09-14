/**
 * Typebot Completion Simulator
 * Simulates Typebot form completion for testing purposes
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class TypebotCompletionSimulator {
    constructor(options = {}) {
      this.options = {
        delay: 2000, // Default delay before completion
        debug: true,
        ...options
      };
      
      this.defaultCompletionData = {
        nome: 'João Teste',
        email: 'joao.teste@exemplo.com',
        telefone: '(11) 99999-9999',
        completed: true,
        timestamp: new Date().toISOString(),
        method: 'test-simulation'
      };
    }

    /**
     * Simulates the complete Typebot completion flow
     * @param {Object} customData - Custom completion data to override defaults
     * @param {Object} options - Simulation options
     * @returns {Promise<boolean>} - Success status
     */
    async simulateCompletion(customData = {}, options = {}) {
      const config = { ...this.options, ...options };
      
      try {
        this.log('🤖 Starting Typebot completion simulation...');
        
        // Prepare completion data
        const completionData = {
          ...this.defaultCompletionData,
          ...customData,
          timestamp: new Date().toISOString()
        };

        this.log('📋 Completion data prepared:', completionData);

        // Wait for specified delay to simulate real user interaction
        if (config.delay > 0) {
          this.log(`⏳ Waiting ${config.delay}ms to simulate user interaction...`);
          await this.wait(config.delay);
        }

        // Send the postMessage event that matches the real Typebot script
        this.sendCompletionMessage(completionData);

        // Simulate Typebot closing after a short delay
        setTimeout(() => {
          this.simulateTypebotClose();
        }, 1000);

        this.log('✅ Typebot completion simulation completed successfully');
        return true;

      } catch (error) {
        this.log('❌ Typebot completion simulation failed:', error);
        return false;
      }
    }

    /**
     * Sends the postMessage event that triggers completion handling
     * @param {Object} completionData - The completion data to send
     */
    sendCompletionMessage(completionData) {
      this.log('📤 Sending typebot-completion postMessage...');
      
      // Send the exact same postMessage structure as the real Typebot script
      window.postMessage({
        type: 'typebot-completion',
        data: completionData
      }, '*');

      // Also try sending to parent window (in case we're in an iframe context)
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'typebot-completion',
          data: completionData
        }, '*');
      }

      this.log('📨 PostMessage sent with completion data');
    }

    /**
     * Simulates Typebot closing behavior
     */
    simulateTypebotClose() {
      this.log('🔐 Simulating Typebot close...');

      try {
        // Try to close via ReinoTypebotIntegrationSystem if available
        if (window.ReinoTypebotIntegrationSystem) {
          window.ReinoTypebotIntegrationSystem.closeTypebot();
          this.log('✅ Closed via ReinoTypebotIntegrationSystem');
        }

        // Try to close via global Typebot if available
        if (window.Typebot) {
          window.Typebot.close();
          this.log('✅ Closed via global Typebot');
        }

        // Hide any visible Typebot containers
        this.hideTypebotContainers();

      } catch (error) {
        this.log('⚠️ Error during Typebot close simulation:', error);
      }
    }

    /**
     * Hides Typebot containers in the DOM
     */
    hideTypebotContainers() {
      const selectors = [
        '#typebot-embed-container',
        '*[id*="typebot"]',
        '*[class*="typebot"]',
        'iframe[src*="typebot"]'
      ];

      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
          });
          
          if (elements.length > 0) {
            this.log(`🙈 Hidden ${elements.length} elements matching: ${selector}`);
          }
        } catch (error) {
          // Ignore selector errors
        }
      });
    }

    /**
     * Creates a test scenario with specific user data
     * @param {string} scenario - The test scenario name
     * @returns {Object} - Scenario-specific completion data
     */
    createTestScenario(scenario) {
      const scenarios = {
        'lead-qualified': {
          nome: 'Maria Silva',
          email: 'maria.silva@empresa.com',
          telefone: '(11) 98765-4321',
          completed: true,
          method: 'test-lead-qualified'
        },
        'lead-basic': {
          nome: 'João Santos',
          email: 'joao@gmail.com',
          telefone: '(21) 99999-8888',
          completed: true,
          method: 'test-lead-basic'
        },
        'incomplete': {
          nome: 'Pedro Oliveira',
          email: '',
          telefone: '',
          completed: false,
          method: 'test-incomplete'
        },
        'invalid-email': {
          nome: 'Ana Costa',
          email: 'email-invalido',
          telefone: '(31) 77777-6666',
          completed: true,
          method: 'test-invalid-email'
        }
      };

      return scenarios[scenario] || this.defaultCompletionData;
    }

    /**
     * Simulates multiple completion attempts (for stress testing)
     * @param {number} count - Number of completions to simulate
     * @param {number} interval - Interval between completions in ms
     */
    async simulateMultipleCompletions(count = 3, interval = 1000) {
      this.log(`🔄 Starting ${count} completion simulations with ${interval}ms interval...`);
      
      for (let i = 0; i < count; i++) {
        const scenarioData = this.createTestScenario(i % 2 === 0 ? 'lead-qualified' : 'lead-basic');
        scenarioData.nome = `${scenarioData.nome} ${i + 1}`;
        
        await this.simulateCompletion(scenarioData, { delay: 500 });
        
        if (i < count - 1) {
          await this.wait(interval);
        }
      }
      
      this.log('🏁 Multiple completion simulation finished');
    }

    /**
     * Utility method to wait for a specified time
     * @param {number} ms - Milliseconds to wait
     */
    wait(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Logging utility
     * @param {string} message - Log message
     * @param {*} data - Optional data to log
     */
    log(message, data = null) {
      if (this.options.debug) {
        if (data) {
          console.log(`[TypebotSimulator] ${message}`, data);
        } else {
          console.log(`[TypebotSimulator] ${message}`);
        }
      }
    }

    /**
     * Validates that the completion was processed correctly
     * @param {number} timeout - Timeout in ms to wait for processing
     * @returns {Promise<boolean>} - Whether completion was processed
     */
    async validateCompletion(timeout = 5000) {
      this.log('🔍 Validating completion processing...');
      
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        // Check if we've navigated to section 4 or 5 (completion indicators)
        const section4 = document.querySelector('[data-step="4"]');
        const section5 = document.querySelector('[data-step="5"]');
        
        if (section4?.style.display !== 'none' || section5?.style.display !== 'none') {
          this.log('✅ Completion validation successful - navigation detected');
          return true;
        }
        
        await this.wait(100);
      }
      
      this.log('⚠️ Completion validation timeout - no navigation detected');
      return false;
    }
  }

  // Make globally available
  window.TypebotCompletionSimulator = TypebotCompletionSimulator;

  // Create a global instance for easy access
  window.typebotSimulator = new TypebotCompletionSimulator();

  // Auto-initialization message
  if (window.typebotSimulator.options.debug) {
    console.log('🤖 TypebotCompletionSimulator loaded and ready for testing');
    console.log('Usage: window.typebotSimulator.simulateCompletion()');
  }

})();
