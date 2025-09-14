import { test, expect } from '@playwright/test';
import {
  setupTestEnvironment,
  cleanupAfterTest,
  verifyTestIsolation,
} from './utils/environment-setup.js';

test.describe('Database Isolation Tests', () => {
  let testEnv;

  test.beforeEach(async ({ page }) => {
    await page.goto('https://reinocapital.webflow.io/taxas-app');

    const setup = await setupTestEnvironment(page);
    testEnv = setup.testEnv;

    // Verify test environment is properly configured
    expect(setup.status.environment).toBe('testing');
    expect(setup.status.isTestEnvironment).toBe(true);
  });

  test.afterEach(async ({ page }) => {
    if (testEnv) {
      await cleanupAfterTest(page, testEnv);
    }
  });

  test('should detect testing environment correctly', async ({ page }) => {
    const status = await page.evaluate(() => {
      return window.ReinoSupabaseIntegration?.getStatus();
    });

    expect(status.environment).toBe('testing');
    expect(status.testRunId).toBeTruthy();
    expect(status.isTestEnvironment).toBe(true);
  });

  test('should create test data with proper isolation tags', async ({ page }) => {
    // Navigate through calculator steps
    await page.click('button[element-function="next"]');
    await page.waitForSelector('[data-step="1"]');

    // Input patrimony
    await page.fill('#currency', '100000');
    await page.click('button[element-function="next"]');
    await page.waitForSelector('[data-step="2"]');

    // Select CDB product
    await page.click('a[ativo-product="CDB"]');
    await page.click('button[element-function="next"]');
    await page.waitForSelector('[data-step="3"]');

    // Allocate 100% to CDB
    const slider = page.locator('range-slider[class*="slider"]').first();
    await slider.evaluate((el) => (el.value = 1));
    await slider.dispatchEvent('input');

    // Wait for allocation to complete
    await page.waitForFunction(() => {
      const remaining = document.querySelector('.patrimonio-restante-value');
      return remaining && remaining.textContent.includes('R$ 0,00');
    });

    // Submit form with test data
    const testData = testEnv.generateUniqueTestData();

    const submissionResult = await page.evaluate(async (data) => {
      return await window.ReinoSupabaseIntegration.saveCalculatorSubmission(data);
    }, testData);

    expect(submissionResult.success).toBe(true);
    expect(submissionResult.data).toBeTruthy();

    // Verify the submission has proper isolation tags
    const submissions = await testEnv.getTestSubmissions(page);
    expect(submissions.success).toBe(true);
    expect(submissions.data.length).toBeGreaterThan(0);

    const submission = submissions.data[0];
    expect(submission.environment).toBe('testing');
    expect(submission.test_run_id).toBe(testEnv.getTestRunId());
    expect(submission.created_by).toBe('playwright-test');
    expect(submission.nome).toContain('Test');
  });

  test('should isolate test data from production queries', async ({ page }) => {
    // Create test submission
    const testData = testEnv.generateUniqueTestData();
    const result = await testEnv.simulateFormSubmission(page, testData);

    expect(result.success).toBe(true);

    // Verify data isolation
    const isolation = await verifyTestIsolation(page, testEnv);
    expect(isolation.success).toBe(true);
    expect(isolation.isolated).toBe(true);
    expect(isolation.count).toBeGreaterThan(0);

    // Verify all entries are from testing environment
    isolation.sample.forEach((entry) => {
      expect(entry.environment).toBe('testing');
    });
  });

  test('should cleanup test data properly', async ({ page }) => {
    // Create multiple test submissions
    const submissions = [];
    for (let i = 0; i < 3; i++) {
      const result = await testEnv.simulateFormSubmission(page);
      expect(result.success).toBe(true);
      submissions.push(result);
    }

    // Verify submissions were created
    const beforeCleanup = await testEnv.getTestSubmissions(page);
    expect(beforeCleanup.success).toBe(true);
    expect(beforeCleanup.data.length).toBe(3);

    // Cleanup test data
    const cleanupResult = await testEnv.cleanupTestData(page);
    expect(cleanupResult.success).toBe(true);

    // Verify data was cleaned up
    const afterCleanup = await testEnv.getTestSubmissions(page);
    expect(afterCleanup.success).toBe(true);
    expect(afterCleanup.data.length).toBe(0);
  });

  test('should sanitize test data with proper prefixes', async ({ page }) => {
    const originalData = {
      nome: 'João Silva',
      email: 'joao@exemplo.com',
      telefone: '(11) 99999-9999',
      patrimonio: 150000,
    };

    const result = await page.evaluate(async (data) => {
      const sanitized = window.ReinoSupabaseIntegration.sanitizeTestData(data.nome);
      const emailSanitized = window.ReinoSupabaseIntegration.sanitizeTestData(data.email);

      return {
        originalNome: data.nome,
        sanitizedNome: sanitized,
        originalEmail: data.email,
        sanitizedEmail: emailSanitized,
      };
    }, originalData);

    expect(result.sanitizedNome).toBe('Test João Silva');
    expect(result.sanitizedEmail).toBe('joao+test@exemplo.com');
  });

  test('should handle environment detection correctly', async ({ page }) => {
    // Test various environment detection scenarios
    const detectionTests = await page.evaluate(() => {
      const integration = window.ReinoSupabaseIntegration;

      return {
        currentEnvironment: integration.environment,
        testRunId: integration.testRunId,
        createdBy: integration.getCreatedByValue(),
        isTestMode: integration.environment === 'testing',
      };
    });

    expect(detectionTests.currentEnvironment).toBe('testing');
    expect(detectionTests.testRunId).toBeTruthy();
    expect(detectionTests.createdBy).toBe('playwright-test');
    expect(detectionTests.isTestMode).toBe(true);
  });

  test('should prevent production data contamination', async ({ page }) => {
    // Verify that test environment cannot access production data
    const productionCheck = await page.evaluate(async () => {
      if (!window.ReinoSupabaseIntegration?.client) {
        return { success: false, error: 'Supabase not ready' };
      }

      try {
        // Try to query production data (should return empty or error)
        const { data, error } = await window.ReinoSupabaseIntegration.client
          .from('calculator_submissions')
          .select('id, environment')
          .eq('environment', 'production')
          .limit(1);

        return {
          success: true,
          hasProductionData: data && data.length > 0,
          data: data || [],
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // In a properly isolated test environment, we shouldn't see production data
    if (productionCheck.success) {
      expect(productionCheck.hasProductionData).toBe(false);
    }
  });

  test('should maintain test data consistency across page reloads', async ({ page }) => {
    // Create initial test submission
    const initialResult = await testEnv.simulateFormSubmission(page);
    expect(initialResult.success).toBe(true);

    const initialTestRunId = testEnv.getTestRunId();

    // Reload page and verify environment persistence
    await page.reload();
    await setupTestEnvironment(page);

    // Verify test run ID is maintained (or new one is generated)
    const status = await page.evaluate(() => {
      return window.ReinoSupabaseIntegration?.getStatus();
    });

    expect(status.environment).toBe('testing');
    expect(status.testRunId).toBeTruthy();

    // Verify we can still access our test data
    const submissions = await page.evaluate(async (testRunId) => {
      const { data, error } = await window.ReinoSupabaseIntegration.client
        .from('calculator_submissions')
        .select('*')
        .eq('test_run_id', testRunId);

      return { success: !error, data: data || [], error };
    }, initialTestRunId);

    expect(submissions.success).toBe(true);
    expect(submissions.data.length).toBeGreaterThan(0);
  });
});
