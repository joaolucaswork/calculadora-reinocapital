#!/usr/bin/env node

/**
 * Cleanup Test Data by Test Run ID
 * Removes specific test run data using service role key
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.testing' });

async function cleanupByTestRunId(testRunId) {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    console.log(`🧹 Cleaning up test run: ${testRunId}`);

    const { data, error } = await supabase
      .from('calculator_submissions')
      .delete()
      .eq('test_run_id', testRunId);

    if (error) {
      throw error;
    }

    console.log(`✅ Cleanup completed for test run: ${testRunId}`);
    return { success: true, testRunId };
  } catch (error) {
    console.error(`❌ Cleanup failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// CLI usage
const testRunId = process.argv[2];
if (!testRunId) {
  console.error('Usage: node scripts/cleanup-by-test-run-id.js <test-run-id>');
  process.exit(1);
}

cleanupByTestRunId(testRunId).then((result) => {
  process.exit(result.success ? 0 : 1);
});

export { cleanupByTestRunId };
