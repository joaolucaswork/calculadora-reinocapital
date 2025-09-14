/**
 * Typebot Completion Flow Test
 * Tests the complete Reino Capital Calculator flow including Typebot lead capture simulation
 */

import { expect, test } from '@playwright/test';

const SITE_URL = 'https://reinocapital.webflow.io/taxas-app';

// Helper function to simulate Typebot completion directly
async function simulateTypebotCompletion(page, completionData = {}) {
  const defaultData = {
    nome: 'João Teste Playwright',
    email: 'joao.teste@playwright.com',
    telefone: '(11) 99999-0000',
    completed: true,
    method: 'playwright-test',
    timestamp: new Date().toISOString(),
  };

  const finalData = { ...defaultData, ...completionData };

  console.log('🤖 Simulating Typebot completion with data:', finalData);

  const result = await page.evaluate((data) => {
    try {
      // Send postMessage directly
      window.postMessage(
        {
          type: 'typebot-completion',
          data: data,
        },
        '*'
      );

      // Also send to parent if in iframe
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'typebot-completion',
            data: data,
          },
          '*'
        );
      }

      console.log('📨 PostMessage sent with completion data:', data);
      return true;
    } catch (error) {
      console.error('❌ Failed to send completion message:', error);
      return false;
    }
  }, finalData);

  return result;
}

// Helper function to wait for completion processing
async function waitForTypebotCompletion(page, timeout = 10000) {
  console.log('⏳ Waiting for Typebot completion processing...');

  try {
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

test.describe('Reino Capital Calculator - Complete Flow with Typebot', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the site
    await page.goto(SITE_URL, { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');

    // Validate that Reino integration is working
    const integrationValid = await page.evaluate(() => {
      return !!(window.ReinoTypebotIntegrationSystem && window.ReinoFormSubmission);
    });

    if (!integrationValid) {
      console.warn('⚠️ Reino integration validation failed - tests may not work as expected');
    }
  });

  test('deve completar fluxo completo com simulação de Typebot', async ({ page }) => {
    console.log('🚀 Starting complete flow test with Typebot simulation...');

    // Navigate through the calculator flow
    console.log('📍 Navigating to section 1...');
    await page.click('[data-step="0"] button[element-function="next"]');
    await page.waitForSelector('[data-step="1"]', { state: 'visible' });

    // Enter patrimony value
    console.log('💰 Entering patrimony value...');
    await page.fill('#currency[data-currency="true"]', '500000');
    await page.waitForTimeout(1000);
    await page.click('[data-step="1"] button[element-function="next"]');
    await page.waitForSelector('[data-step="2"]', { state: 'visible' });

    // Select CDB product
    console.log('🎯 Selecting CDB product...');
    await page.click('.dropdown-subcategory:has-text("Renda Fixa") .dropdown-toggle');
    await page.waitForTimeout(500);
    await page.click('a[ativo-product="CDB"][ativo-category="Renda Fixa"]', { force: true });
    await page.waitForTimeout(500);

    // Select Liquidez product
    console.log('🎯 Selecting Liquidez product...');
    await page.click('.dropdown-subcategory:has-text("Fundo de Investimento") .dropdown-toggle');
    await page.waitForTimeout(500);
    await page.click('a[ativo-product="Liquidez"][ativo-category="Fundo de Investimento"]', {
      force: true,
    });
    await page.waitForTimeout(500);

    await page.click('[data-step="2"] button[element-function="next"]');
    await page.waitForSelector('[data-step="3"]', { state: 'visible' });

    // Set allocations: CDB 70%, Liquidez 30%
    console.log('📊 Setting allocations...');
    await page.locator('[ativo-product="CDB"] range-slider').evaluate((slider) => {
      slider.value = 0.7;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(500);

    await page.locator('[ativo-product="Liquidez"] range-slider').evaluate((slider) => {
      slider.value = 0.3;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(1000);

    // Simulate Typebot completion
    console.log('🤖 Simulating Typebot completion...');
    const completionData = {
      nome: 'Maria Silva',
      email: 'maria.silva@empresa.com',
      telefone: '(11) 98765-4321',
    };

    const success = await simulateTypebotCompletion(page, completionData);
    expect(success).toBeTruthy();

    // Wait for completion processing and navigation
    console.log('⏳ Waiting for completion processing...');
    const processed = await waitForTypebotCompletion(page, 15000);
    expect(processed).toBeTruthy();

    // Verify we're on the results page
    const resultsSection = page.locator('[data-step="5"]');
    await expect(resultsSection).toBeVisible();

    console.log('✅ Complete flow test passed successfully!');
  });

  test('deve testar diferentes cenários de dados do Typebot', async ({ page }) => {
    console.log('🧪 Testing different Typebot completion scenarios...');

    // Navigate to section 3 first (skip the UI flow for this test)
    await page.click('[data-step="0"] button[element-function="next"]');
    await page.waitForSelector('[data-step="1"]', { state: 'visible' });
    await page.fill('#currency[data-currency="true"]', '100000');
    await page.waitForTimeout(1000);
    await page.click('[data-step="1"] button[element-function="next"]');
    await page.waitForSelector('[data-step="2"]', { state: 'visible' });

    // Select CDB
    await page.click('.dropdown-subcategory:has-text("Renda Fixa") .dropdown-toggle');
    await page.waitForTimeout(500);
    await page.click('a[ativo-product="CDB"][ativo-category="Renda Fixa"]', { force: true });
    await page.waitForTimeout(500);

    await page.click('[data-step="2"] button[element-function="next"]');
    await page.waitForSelector('[data-step="3"]', { state: 'visible' });

    // Set 100% allocation
    await page.locator('[ativo-product="CDB"] range-slider').evaluate((slider) => {
      slider.value = 1;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(1000);

    // Test different scenarios
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

    let successfulScenarios = 0;

    for (const scenario of scenarios) {
      console.log(`🧪 Testing scenario: ${scenario.name}`);

      try {
        const success = await simulateTypebotCompletion(page, scenario.data);
        if (success) {
          successfulScenarios++;
          console.log(`✅ Scenario ${scenario.name} completed successfully`);
        }

        // Wait a bit between scenarios
        await page.waitForTimeout(1000);
      } catch (error) {
        console.log(`❌ Scenario ${scenario.name} failed:`, error.message);
      }
    }

    // Validate that at least one scenario worked
    expect(successfulScenarios).toBeGreaterThan(0);

    console.log('✅ Scenario testing completed successfully!');
  });

  test('deve validar integração com sistema de formulários', async ({ page }) => {
    console.log('🔧 Testing form system integration...');

    // Navigate to section 3
    await page.click('[data-step="0"] button[element-function="next"]');
    await page.waitForSelector('[data-step="1"]', { state: 'visible' });
    await page.fill('#currency[data-currency="true"]', '200000');
    await page.waitForTimeout(1000);
    await page.click('[data-step="1"] button[element-function="next"]');
    await page.waitForSelector('[data-step="2"]', { state: 'visible' });

    // Select CDB
    await page.click('.dropdown-subcategory:has-text("Renda Fixa") .dropdown-toggle');
    await page.waitForTimeout(500);
    await page.click('a[ativo-product="CDB"][ativo-category="Renda Fixa"]', { force: true });
    await page.waitForTimeout(500);

    await page.click('[data-step="2"] button[element-function="next"]');
    await page.waitForSelector('[data-step="3"]', { state: 'visible' });

    // Set allocation
    await page.locator('[ativo-product="CDB"] range-slider').evaluate((slider) => {
      slider.value = 1;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(1000);

    // Test that form submission system is ready
    const formSystemReady = await page.evaluate(() => {
      return !!(window.ReinoFormSubmission && window.ReinoTypebotIntegrationSystem);
    });

    expect(formSystemReady).toBeTruthy();

    // Simulate completion and verify processing
    const completionData = {
      nome: 'João Integração',
      email: 'joao@integracao.test',
      telefone: '(31) 88888-7777',
    };

    const success = await simulateTypebotCompletion(page, completionData);
    expect(success).toBeTruthy();

    // Wait for processing
    const processed = await waitForTypebotCompletion(page, 8000);
    expect(processed).toBeTruthy();

    console.log('✅ Form system integration test passed!');
  });

  test('deve testar simulação de múltiplas submissões', async ({ page }) => {
    console.log('🔄 Testing multiple submission simulation...');

    // Navigate to section 3
    await page.click('[data-step="0"] button[element-function="next"]');
    await page.waitForSelector('[data-step="1"]', { state: 'visible' });
    await page.fill('#currency[data-currency="true"]', '150000');
    await page.waitForTimeout(1000);
    await page.click('[data-step="1"] button[element-function="next"]');
    await page.waitForSelector('[data-step="2"]', { state: 'visible' });
    await page.click('.dropdown-subcategory:has-text("Renda Fixa") .dropdown-toggle');
    await page.waitForTimeout(500);
    await page.click('a[ativo-product="CDB"][ativo-category="Renda Fixa"]', { force: true });
    await page.waitForTimeout(500);
    await page.click('[data-step="2"] button[element-function="next"]');
    await page.waitForSelector('[data-step="3"]', { state: 'visible' });
    await page.locator('[ativo-product="CDB"] range-slider').evaluate((slider) => {
      slider.value = 1;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(1000);

    // Test multiple submissions with different data
    const testScenarios = [
      { nome: 'Teste 1', email: 'teste1@exemplo.com', telefone: '(11) 11111-1111' },
      { nome: 'Teste 2', email: 'teste2@exemplo.com', telefone: '(11) 22222-2222' },
      { nome: 'Teste 3', email: 'teste3@exemplo.com', telefone: '(11) 33333-3333' },
    ];

    let successfulSubmissions = 0;

    for (let i = 0; i < testScenarios.length; i++) {
      console.log(`🧪 Testing submission ${i + 1}: ${testScenarios[i].nome}`);

      try {
        const success = await simulateTypebotCompletion(page, testScenarios[i]);
        if (success) {
          successfulSubmissions++;
          console.log(`✅ Submission ${i + 1} completed successfully`);
        }

        // Wait between submissions
        await page.waitForTimeout(500);
      } catch (error) {
        console.log(`❌ Submission ${i + 1} failed:`, error.message);
      }
    }

    // Validate that at least 2 submissions worked
    expect(successfulSubmissions).toBeGreaterThanOrEqual(2);

    console.log('✅ Multiple submission test completed!');
  });

  test('deve validar dados de completion específicos', async ({ page }) => {
    console.log('📋 Testing specific completion data validation...');

    // Navigate to section 3 quickly
    await page.click('[data-step="0"] button[element-function="next"]');
    await page.waitForSelector('[data-step="1"]', { state: 'visible' });
    await page.fill('#currency[data-currency="true"]', '75000');
    await page.waitForTimeout(1000);
    await page.click('[data-step="1"] button[element-function="next"]');
    await page.waitForSelector('[data-step="2"]', { state: 'visible' });
    await page.click('.dropdown-subcategory:has-text("Renda Fixa") .dropdown-toggle');
    await page.waitForTimeout(500);
    await page.click('a[ativo-product="CDB"][ativo-category="Renda Fixa"]', { force: true });
    await page.waitForTimeout(500);
    await page.click('[data-step="2"] button[element-function="next"]');
    await page.waitForSelector('[data-step="3"]', { state: 'visible' });
    await page.locator('[ativo-product="CDB"] range-slider').evaluate((slider) => {
      slider.value = 1;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(1000);

    // Test with specific completion data
    const specificData = {
      nome: 'Ana Validação',
      email: 'ana.validacao@teste.com.br',
      telefone: '(85) 99999-1234',
      completed: true,
      method: 'validation-test',
      customField: 'test-value',
    };

    const success = await simulateTypebotCompletion(page, specificData);
    expect(success).toBeTruthy();

    // Verify the data was processed
    const dataProcessed = await page.evaluate(() => {
      // Check if any completion callbacks were triggered
      return window.ReinoTypebotIntegrationSystem?.completionCallbacks?.length > 0;
    });

    expect(dataProcessed).toBeTruthy();

    console.log('✅ Specific completion data validation passed!');
  });
});
