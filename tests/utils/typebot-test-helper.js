/**
 * Typebot Test Helper for Playwright
 * Provides utilities for testing Typebot integration in Playwright tests
 */

/**
 * Injects the Typebot completion simulator into the page
 * @param {Page} page - Playwright page object
 */
// No imports needed for this simplified version

async function injectTypebotSimulator(page) {
  // Inject the simulator code directly
  const simulatorCode = `
    (function () {
      'use strict';

      class TypebotCompletionSimulator {
        constructor(options = {}) {
          this.options = {
            delay: 2000,
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

        async simulateCompletion(customData = {}, options = {}) {
          const config = { ...this.options, ...options };

          try {
            this.log('🤖 Starting Typebot completion simulation...');

            const completionData = {
              ...this.defaultCompletionData,
              ...customData,
              timestamp: new Date().toISOString()
            };

            this.log('📋 Completion data prepared:', completionData);

            if (config.delay > 0) {
              this.log('⏳ Waiting ' + config.delay + 'ms to simulate user interaction...');
              await this.wait(config.delay);
            }

            this.sendCompletionMessage(completionData);

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

        sendCompletionMessage(completionData) {
          this.log('📤 Sending typebot-completion postMessage...');

          window.postMessage({
            type: 'typebot-completion',
            data: completionData
          }, '*');

          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'typebot-completion',
              data: completionData
            }, '*');
          }

          this.log('📨 PostMessage sent with completion data');
        }

        simulateTypebotClose() {
          this.log('🔐 Simulating Typebot close...');

          try {
            if (window.ReinoTypebotIntegrationSystem) {
              window.ReinoTypebotIntegrationSystem.closeTypebot();
              this.log('✅ Closed via ReinoTypebotIntegrationSystem');
            }

            if (window.Typebot) {
              window.Typebot.close();
              this.log('✅ Closed via global Typebot');
            }

            this.hideTypebotContainers();

          } catch (error) {
            this.log('⚠️ Error during Typebot close simulation:', error);
          }
        }

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
                this.log('🙈 Hidden ' + elements.length + ' elements matching: ' + selector);
              }
            } catch (error) {
              // Ignore selector errors
            }
          });
        }

        wait(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }

        log(message, data = null) {
          if (this.options.debug) {
            if (data) {
              console.log('[TypebotSimulator] ' + message, data);
            } else {
              console.log('[TypebotSimulator] ' + message);
            }
          }
        }
      }

      window.TypebotCompletionSimulator = TypebotCompletionSimulator;
      window.typebotSimulator = new TypebotCompletionSimulator();

      if (window.typebotSimulator.options.debug) {
        console.log('🤖 TypebotCompletionSimulator loaded and ready for testing');
      }

    })();
  `;

  await page.addInitScript(simulatorCode);

  // Wait for the simulator to be available
  await page.waitForFunction(() => window.TypebotCompletionSimulator !== undefined, {
    timeout: 5000,
  });
}

/**
 * Simulates Typebot completion with custom data
 * @param {Page} page - Playwright page object
 * @param {Object} completionData - Custom completion data
 * @param {Object} options - Simulation options
 * @returns {Promise<boolean>} - Success status
 */
async function simulateTypebotCompletion(page, completionData = {}, options = {}) {
  const defaultData = {
    nome: 'João Teste Playwright',
    email: 'joao.teste@playwright.com',
    telefone: '(11) 99999-0000',
    completed: true,
    method: 'playwright-test',
  };

  const finalData = { ...defaultData, ...completionData };
  const finalOptions = { delay: 1000, debug: true, ...options };

  console.log('🤖 Simulating Typebot completion with data:', finalData);

  const result = await page.evaluate(
    async ({ data, opts }) => {
      if (!window.typebotSimulator) {
        console.error('TypebotCompletionSimulator not available');
        return false;
      }

      return await window.typebotSimulator.simulateCompletion(data, opts);
    },
    { data: finalData, opts: finalOptions }
  );

  return result;
}

/**
 * Waits for Typebot completion to be processed and navigation to occur
 * @param {Page} page - Playwright page object
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} - Whether completion was processed
 */
async function waitForTypebotCompletion(page, timeout = 10000) {
  console.log('⏳ Waiting for Typebot completion processing...');

  try {
    // Wait for navigation to section 5
    await page.waitForSelector('[data-step="5"]', {
      state: 'visible',
      timeout: timeout,
    });

    console.log('✅ Typebot completion processed - navigation detected');
    return true;
  } catch (error) {
    console.log('⚠️ Typebot completion timeout - no navigation detected');
    return false;
  }
}

/**
 * Creates a complete test flow with Typebot completion
 * @param {Page} page - Playwright page object
 * @param {Object} testData - Test configuration
 * @returns {Promise<Object>} - Test results
 */
async function runCompleteTypebotFlow(page, testData = {}) {
  const {
    patrimonio = '100000',
    produtos = [{ category: 'Renda Fixa', product: 'CDB' }],
    alocacao = [{ product: 'CDB', percentage: 1.0 }],
    completionData = {},
    skipToSection3 = false,
  } = testData;

  const results = {
    success: false,
    steps: {
      navigation: false,
      patrimonio: false,
      produtos: false,
      alocacao: false,
      typebot: false,
      completion: false,
    },
    errors: [],
  };

  try {
    console.log('🚀 Starting complete Typebot flow test...');

    if (!skipToSection3) {
      // Step 1: Navigate to patrimonio section
      await page.click('[data-step="0"] button[element-function="next"]');
      await page.waitForSelector('[data-step="1"]', { state: 'visible' });
      results.steps.navigation = true;

      // Step 2: Enter patrimonio
      await page.fill('#currency[data-currency="true"]', patrimonio);
      await page.waitForTimeout(1000);
      await page.waitForSelector(
        '[data-step="1"] button[element-function="next"]:not([disabled])',
        {
          state: 'visible',
        }
      );
      await page.click('[data-step="1"] button[element-function="next"]');
      await page.waitForSelector('[data-step="2"]', { state: 'visible' });
      results.steps.patrimonio = true;

      // Step 3: Select produtos
      for (const produto of produtos) {
        await page.click(`.dropdown-subcategory:has-text("${produto.category}") .dropdown-toggle`);
        await page.waitForTimeout(500);
        await page.click(
          `a[ativo-product="${produto.product}"][ativo-category="${produto.category}"]`,
          {
            force: true,
          }
        );
        await page.waitForTimeout(500);
      }
      await page.click('[data-step="2"] button[element-function="next"]');
      await page.waitForSelector('[data-step="3"]', { state: 'visible' });
      results.steps.produtos = true;

      // Step 4: Set alocacao
      for (const alloc of alocacao) {
        await page
          .locator(`[ativo-product="${alloc.product}"] range-slider`)
          .evaluate((slider, percentage) => {
            slider.value = percentage;
            slider.dispatchEvent(new Event('input', { bubbles: true }));
          }, alloc.percentage);
      }
      await page.waitForTimeout(1500);
      results.steps.alocacao = true;
    }

    // Step 5: Simulate Typebot completion
    const typebotSuccess = await simulateTypebotCompletion(page, completionData);
    results.steps.typebot = typebotSuccess;

    if (typebotSuccess) {
      // Step 6: Wait for completion processing
      const completionSuccess = await waitForTypebotCompletion(page);
      results.steps.completion = completionSuccess;
      results.success = completionSuccess;
    }

    console.log('📊 Complete flow test results:', results);
    return results;
  } catch (error) {
    console.error('❌ Complete flow test failed:', error);
    results.errors.push(error.message);
    return results;
  }
}

/**
 * Tests different Typebot completion scenarios
 * @param {Page} page - Playwright page object
 * @returns {Promise<Object>} - Test results for all scenarios
 */
async function testTypebotScenarios(page) {
  const scenarios = [
    {
      name: 'Valid Lead',
      data: {
        nome: 'Maria Silva',
        email: 'maria@empresa.com',
        telefone: '(11) 98765-4321',
      },
    },
    {
      name: 'Minimal Data',
      data: {
        nome: 'João',
        email: 'joao@test.com',
        telefone: '11999999999',
      },
    },
    {
      name: 'Corporate Lead',
      data: {
        nome: 'Ana Rodrigues',
        email: 'ana.rodrigues@corporation.com.br',
        telefone: '(21) 3333-4444',
      },
    },
  ];

  const results = {};

  for (const scenario of scenarios) {
    console.log(`🧪 Testing scenario: ${scenario.name}`);

    try {
      const success = await simulateTypebotCompletion(page, scenario.data, { delay: 500 });
      results[scenario.name] = {
        success,
        data: scenario.data,
      };

      // Wait a bit between scenarios
      await page.waitForTimeout(1000);
    } catch (error) {
      results[scenario.name] = {
        success: false,
        error: error.message,
        data: scenario.data,
      };
    }
  }

  console.log('📋 Scenario test results:', results);
  return results;
}

/**
 * Validates that the Reino Capital integration is working correctly
 * @param {Page} page - Playwright page object
 * @returns {Promise<boolean>} - Whether integration is working
 */
async function validateReinoIntegration(page) {
  console.log('🔍 Validating Reino Capital Typebot integration...');

  const checks = await page.evaluate(() => {
    const results = {
      typebotSystem: !!window.ReinoTypebotIntegrationSystem,
      formSubmission: !!window.ReinoFormSubmission,
      eventListeners: false,
      completionCallbacks: false,
    };

    // Check if event listeners are set up
    if (window.ReinoTypebotIntegrationSystem) {
      results.completionCallbacks =
        window.ReinoTypebotIntegrationSystem.completionCallbacks?.length > 0;
    }

    // Check if form submission system is listening
    if (window.ReinoFormSubmission) {
      results.eventListeners = true;
    }

    return results;
  });

  console.log('🔧 Integration check results:', checks);

  const isValid = checks.typebotSystem && checks.formSubmission;

  if (isValid) {
    console.log('✅ Reino Capital Typebot integration is properly configured');
  } else {
    console.log('⚠️ Reino Capital Typebot integration has issues');
  }

  return isValid;
}

export {
  injectTypebotSimulator,
  runCompleteTypebotFlow,
  simulateTypebotCompletion,
  testTypebotScenarios,
  validateReinoIntegration,
  waitForTypebotCompletion,
};
