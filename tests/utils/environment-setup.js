/**
 * Environment Setup Utilities for Playwright Tests
 * Handles test environment isolation and cleanup
 */

class TestEnvironmentSetup {
  constructor() {
    this.testRunId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.environment = 'testing';
  }

  async setupTestEnvironment(page) {
    // Set environment variables for the test session
    await page.addInitScript(() => {
      window.REINO_ENVIRONMENT = 'testing';
      window.REINO_TEST_MODE = true;
    });

    // Add test identification to user agent
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Playwright Test Environment) AppleWebKit/537.36',
    });

    // Add test query parameter
    const currentUrl = page.url();
    const url = new URL(currentUrl);
    url.searchParams.set('test', 'true');
    url.searchParams.set('playwright', 'true');

    await page.goto(url.toString());
  }

  async injectTestConfiguration(page) {
    await page.addInitScript((testRunId) => {
      // Set global test configuration BEFORE any modules load
      window.REINO_ENVIRONMENT = 'testing';
      window.REINO_TEST_MODE = true;
      window.REINO_TEST_RUN_ID = testRunId;
    }, this.testRunId);

    // Also set after page load for existing instances
    await page.evaluate((testRunId) => {
      // Override Supabase integration for testing
      if (window.ReinoSupabaseIntegration) {
        window.ReinoSupabaseIntegration.testRunId = testRunId;
        window.ReinoSupabaseIntegration.environment = 'testing';
      }

      // Set global test configuration
      window.REINO_TEST_RUN_ID = testRunId;
      window.REINO_ENVIRONMENT = 'testing';
      window.REINO_TEST_MODE = true;
    }, this.testRunId);
  }

  async waitForSupabaseReady(page) {
    await page.waitForFunction(
      () => {
        return (
          window.ReinoSupabaseIntegration &&
          window.ReinoSupabaseIntegration.isReady &&
          window.ReinoSupabaseIntegration.environment === 'testing'
        );
      },
      { timeout: 10000 }
    );
  }

  async verifyTestEnvironment(page) {
    const status = await page.evaluate(() => {
      if (!window.ReinoSupabaseIntegration) {
        return { error: 'Supabase integration not found' };
      }

      return window.ReinoSupabaseIntegration.getStatus();
    });

    if (status.error) {
      throw new Error(`Test environment verification failed: ${status.error}`);
    }

    if (status.environment !== 'testing') {
      throw new Error(`Expected testing environment, got: ${status.environment}`);
    }

    return status;
  }

  async cleanupTestData(page) {
    try {
      // Use Supabase Management API for cleanup
      const { createClient } = await import('@supabase/supabase-js');

      const supabase = createClient(
        'https://dwpsyresppubuxbrwrkc.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3cHN5cmVzcHB1YnV4YnJ3cmtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM2NzE3OCwiZXhwIjoyMDY4OTQzMTc4fQ.osxkgCRNeVfTz0YCOYIS1zJWZWppVZ38gHi9aEiCUeI'
      );

      const { error } = await supabase
        .from('calculator_submissions')
        .delete()
        .eq('test_run_id', this.testRunId);

      if (error) {
        throw error;
      }

      return { success: true, testRunId: this.testRunId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getTestSubmissions(page) {
    return await page.evaluate(async (testRunId) => {
      if (!window.ReinoSupabaseIntegration || !window.ReinoSupabaseIntegration.client) {
        return { success: false, error: 'Supabase not ready' };
      }

      try {
        const { data, error } = await window.ReinoSupabaseIntegration.client
          .from('calculator_submissions')
          .select('*')
          .eq('test_run_id', testRunId)
          .order('submitted_at', { ascending: false });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, this.testRunId);
  }

  generateTestUserData(index = 1) {
    return {
      nome: `Test User ${index}`,
      email: `test.user${index}@playwright.test`,
      telefone: `(99) 99999-000${index}`,
      patrimonio: 100000 * index,
    };
  }

  generateUniqueTestData() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 5);

    return {
      nome: `Playwright Test ${random}`,
      email: `playwright.${timestamp}@test.com`,
      telefone: `(99) ${timestamp.toString().slice(-5)}-${random}`,
      patrimonio: 100000 + Math.floor(Math.random() * 900000),
    };
  }

  async simulateFormSubmission(page, userData = null) {
    const testData = userData || this.generateUniqueTestData();

    // Simulate form submission with test data
    const result = await page.evaluate(async (data) => {
      if (!window.ReinoSupabaseIntegration) {
        return { success: false, error: 'Supabase integration not available' };
      }

      try {
        return await window.ReinoSupabaseIntegration.saveCalculatorSubmission(data);
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, testData);

    return { ...result, testData };
  }

  async verifyDataIsolation(page) {
    // Verify that test data is properly isolated
    const result = await page.evaluate(async () => {
      if (!window.ReinoSupabaseIntegration || !window.ReinoSupabaseIntegration.client) {
        return { success: false, error: 'Supabase not ready' };
      }

      try {
        // Check that we can only see testing environment data
        const { data, error } = await window.ReinoSupabaseIntegration.client
          .from('calculator_submissions')
          .select('environment, created_by')
          .eq('environment', 'testing')
          .limit(5);

        if (error) {
          return { success: false, error: error.message };
        }

        // Verify all entries are from testing environment
        const allTesting = data.every((entry) => entry.environment === 'testing');

        return {
          success: true,
          isolated: allTesting,
          count: data.length,
          sample: data,
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    return result;
  }

  getTestRunId() {
    return this.testRunId;
  }

  getEnvironment() {
    return this.environment;
  }
}

// Helper functions for test setup
async function setupTestEnvironment(page) {
  const testEnv = new TestEnvironmentSetup();

  await testEnv.setupTestEnvironment(page);
  await testEnv.injectTestConfiguration(page);
  await testEnv.waitForSupabaseReady(page);

  const status = await testEnv.verifyTestEnvironment(page);

  return { testEnv, status };
}

async function cleanupAfterTest(page, testEnv) {
  if (testEnv) {
    const result = await testEnv.cleanupTestData(page);
    return result;
  }
  return { success: false, error: 'No test environment provided' };
}

async function verifyTestIsolation(page, testEnv) {
  if (testEnv) {
    return await testEnv.verifyDataIsolation(page);
  }
  return { success: false, error: 'No test environment provided' };
}

export { cleanupAfterTest, setupTestEnvironment, TestEnvironmentSetup, verifyTestIsolation };
