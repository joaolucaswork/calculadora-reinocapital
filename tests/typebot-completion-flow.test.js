/**
 * Typebot Completion Flow Test
 * Tests the complete Reino Capital Calculator flow including Typebot lead capture simulation
 */

import { expect, test } from '@playwright/test';
import {
  injectTypebotSimulator,
  simulateTypebotCompletion,
  waitForTypebotCompletion,
  runCompleteTypebotFlow,
  testTypebotScenarios,
  validateReinoIntegration,
} from './utils/typebot-test-helper.js';

const SITE_URL = 'https://reinocapital.webflow.io/taxas-app';

test.describe('Reino Capital Calculator - Complete Flow with Typebot', () => {
  test.beforeEach(async ({ page }) => {
    // Inject the Typebot simulator before each test
    await injectTypebotSimulator(page);

    // Navigate to the site
    await page.goto(SITE_URL, { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');

    // Validate that Reino integration is working
    const integrationValid = await validateReinoIntegration(page);
    if (!integrationValid) {
      console.warn('⚠️ Reino integration validation failed - tests may not work as expected');
    }
  });

  test('deve completar fluxo completo com simulação de Typebot', async ({ page }) => {
    console.log('🚀 Starting complete flow test with Typebot simulation...');

    const testConfig = {
      patrimonio: '500000',
      produtos: [
        { category: 'Renda Fixa', product: 'CDB' },
        { category: 'Fundo de Investimento', product: 'Liquidez' },
      ],
      alocacao: [
        { product: 'CDB', percentage: 0.7 },
        { product: 'Liquidez', percentage: 0.3 },
      ],
      completionData: {
        nome: 'Maria Silva',
        email: 'maria.silva@empresa.com',
        telefone: '(11) 98765-4321',
      },
    };

    const results = await runCompleteTypebotFlow(page, testConfig);

    // Validate all steps completed successfully
    expect(results.success).toBeTruthy();
    expect(results.steps.navigation).toBeTruthy();
    expect(results.steps.patrimonio).toBeTruthy();
    expect(results.steps.produtos).toBeTruthy();
    expect(results.steps.alocacao).toBeTruthy();
    expect(results.steps.typebot).toBeTruthy();
    expect(results.steps.completion).toBeTruthy();

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
    const scenarioResults = await testTypebotScenarios(page);

    // Validate that at least one scenario worked
    const successfulScenarios = Object.values(scenarioResults).filter((result) => result.success);
    expect(successfulScenarios.length).toBeGreaterThan(0);

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

    // Quick navigation to section 3
    await page.evaluate(() => {
      // Use debug mode to quickly set up the form
      if (window.ReinoDebugModule) {
        window.ReinoDebugModule.activateDebugMode();
      }
    });

    await page.waitForTimeout(2000);

    // Navigate to section 3 if not already there
    const section3Visible = await page.locator('[data-step="3"]').isVisible();
    if (!section3Visible) {
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
    }

    // Test multiple submissions
    const multipleResults = await page.evaluate(async () => {
      if (!window.typebotSimulator) {
        return { success: false, error: 'Simulator not available' };
      }

      try {
        await window.typebotSimulator.simulateMultipleCompletions(3, 500);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(multipleResults.success).toBeTruthy();

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
