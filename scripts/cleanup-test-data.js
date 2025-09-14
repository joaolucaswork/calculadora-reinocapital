#!/usr/bin/env node

/**
 * Test Data Cleanup Script
 * Removes test data from databases based on environment
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Test data identification patterns - SAFE PATTERNS ONLY
const TEST_PATTERNS = {
  emails: [
    '%test%',
    '%exemplo%',
    '%playwright%',
    '%@test.com',
    '%@exemplo.com',
    '%@integracao.test',
    '%+test@%', // Sanitized test emails
  ],
  // REMOVED: name patterns to avoid deleting real users
  phones: [
    '%(11) 11111%',
    '%(11) 22222%',
    '%(11) 33333%',
    '%(11) 99999-0000%',
    '%(99) 99999-%', // Playwright test pattern
  ],
  // Additional safe patterns
  environment: ['testing', 'development'],
  created_by: ['playwright-test', 'headless-test', 'automated-test'],
};

class TestDataCleaner {
  constructor(environment = 'testing') {
    this.environment = environment;
    this.supabase = this.createSupabaseClient();
    this.dryRun = process.argv.includes('--dry-run');
    this.verbose = process.argv.includes('--verbose');
  }

  createSupabaseClient() {
    const envFile = `.env.${this.environment}`;

    // Load environment-specific config
    dotenv.config({ path: envFile });

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(`Missing Supabase configuration for ${this.environment} environment`);
    }

    return createClient(url, key);
  }

  async identifyTestData() {
    console.log(`🔍 Identifying test data in ${this.environment} environment...`);

    let query = this.supabase
      .from('calculator_submissions')
      .select('id, nome, email, telefone, submitted_at, environment, created_by');

    // Build OR conditions for test patterns
    const conditions = [];

    // Email patterns
    TEST_PATTERNS.emails.forEach((pattern) => {
      conditions.push(`email.ilike.${pattern}`);
    });

    // Phone patterns (REMOVED name patterns for safety)
    TEST_PATTERNS.phones.forEach((pattern) => {
      conditions.push(`telefone.ilike.${pattern}`);
    });

    // Environment-based identification
    TEST_PATTERNS.environment.forEach((env) => {
      conditions.push(`environment.eq.${env}`);
    });

    // Created by patterns
    TEST_PATTERNS.created_by.forEach((creator) => {
      conditions.push(`created_by.eq.${creator}`);
    });

    // Execute query with OR conditions
    const { data, error } = await query.or(conditions.join(','));

    if (error) {
      throw new Error(`Failed to identify test data: ${error.message}`);
    }

    return data || [];
  }

  async cleanupByEnvironment() {
    console.log(`🧹 Cleaning up ${this.environment} environment data...`);

    if (this.dryRun) {
      console.log('🔍 DRY RUN MODE - No data will be deleted');
    }

    const { data, error } = await this.supabase
      .from('calculator_submissions')
      .select('id, nome, email')
      .eq('environment', this.environment);

    if (error) {
      throw new Error(`Failed to query environment data: ${error.message}`);
    }

    console.log(`📊 Found ${data.length} entries in ${this.environment} environment`);

    if (data.length === 0) {
      console.log('✅ No data to clean up');
      return { deleted: 0, errors: [] };
    }

    if (this.dryRun) {
      console.log('📋 Would delete the following entries:');
      data.forEach((entry) => {
        console.log(`  - ${entry.nome} (${entry.email})`);
      });
      return { deleted: 0, errors: [] };
    }

    // Perform actual deletion
    const { error: deleteError } = await this.supabase
      .from('calculator_submissions')
      .delete()
      .eq('environment', this.environment);

    if (deleteError) {
      throw new Error(`Failed to delete environment data: ${deleteError.message}`);
    }

    console.log(`✅ Deleted ${data.length} entries from ${this.environment} environment`);
    return { deleted: data.length, errors: [] };
  }

  async cleanupByPatterns() {
    console.log('🔍 Cleaning up test data by patterns...');

    const testData = await this.identifyTestData();

    if (testData.length === 0) {
      console.log('✅ No test data found');
      return { deleted: 0, errors: [] };
    }

    console.log(`📊 Found ${testData.length} test entries`);

    if (this.verbose || this.dryRun) {
      console.log('📋 Test entries found:');
      testData.forEach((entry) => {
        console.log(`  - ${entry.nome} (${entry.email}) - ${entry.submitted_at}`);
      });
    }

    if (this.dryRun) {
      console.log('🔍 DRY RUN MODE - No data will be deleted');
      return { deleted: 0, errors: [] };
    }

    // Delete in batches to avoid timeout
    const batchSize = 50;
    let totalDeleted = 0;
    const errors = [];

    for (let i = 0; i < testData.length; i += batchSize) {
      const batch = testData.slice(i, i + batchSize);
      const ids = batch.map((entry) => entry.id);

      try {
        const { error } = await this.supabase.from('calculator_submissions').delete().in('id', ids);

        if (error) {
          errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
        } else {
          totalDeleted += batch.length;
          console.log(`✅ Deleted batch ${i / batchSize + 1} (${batch.length} entries)`);
        }
      } catch (err) {
        errors.push(`Batch ${i / batchSize + 1}: ${err.message}`);
      }
    }

    return { deleted: totalDeleted, errors };
  }

  async getStatistics() {
    console.log('📊 Gathering database statistics...');

    const { data: total, error: totalError } = await this.supabase
      .from('calculator_submissions')
      .select('id', { count: 'exact' });

    const { data: production, error: prodError } = await this.supabase
      .from('calculator_submissions')
      .select('id', { count: 'exact' })
      .eq('environment', 'production');

    const { data: testing, error: testError } = await this.supabase
      .from('calculator_submissions')
      .select('id', { count: 'exact' })
      .eq('environment', 'testing');

    const testPatterns = await this.identifyTestData();

    return {
      total: total?.length || 0,
      production: production?.length || 0,
      testing: testing?.length || 0,
      testPatterns: testPatterns.length,
      errors: [totalError, prodError, testError].filter(Boolean),
    };
  }

  async run() {
    try {
      console.log(`🚀 Starting test data cleanup for ${this.environment} environment\n`);

      // Show current statistics
      const stats = await this.getStatistics();
      console.log('📊 Current database statistics:');
      console.log(`  Total entries: ${stats.total}`);
      console.log(`  Production entries: ${stats.production}`);
      console.log(`  Testing entries: ${stats.testing}`);
      console.log(`  Test pattern matches: ${stats.testPatterns}\n`);

      let result;

      if (this.environment === 'testing' || this.environment === 'development') {
        // For test/dev environments, clean everything
        result = await this.cleanupByEnvironment();
      } else {
        // For production, only clean by patterns (safer)
        result = await this.cleanupByPatterns();
      }

      console.log('\n📊 Cleanup Results:');
      console.log(`  Deleted entries: ${result.deleted}`);
      console.log(`  Errors: ${result.errors.length}`);

      if (result.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        result.errors.forEach((error) => console.log(`  - ${error}`));
      }

      // Show final statistics
      const finalStats = await this.getStatistics();
      console.log('\n📊 Final database statistics:');
      console.log(`  Total entries: ${finalStats.total}`);
      console.log(`  Production entries: ${finalStats.production}`);
      console.log(`  Testing entries: ${finalStats.testing}`);
      console.log(`  Test pattern matches: ${finalStats.testPatterns}`);

      console.log('\n✅ Cleanup completed successfully!');
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
function showHelp() {
  console.log(`
🧹 Test Data Cleanup Script

Usage: node scripts/cleanup-test-data.js [environment] [options]

Environments:
  testing     Clean testing environment (default)
  development Clean development environment  
  production  Clean test patterns from production (CAREFUL!)

Options:
  --dry-run   Show what would be deleted without actually deleting
  --verbose   Show detailed information about entries
  --help      Show this help message

Examples:
  node scripts/cleanup-test-data.js testing --dry-run
  node scripts/cleanup-test-data.js production --verbose
  npm run test:db:cleanup
`);
}

// Execute if this is the main module
if (process.argv[1] && process.argv[1].endsWith('cleanup-test-data.js')) {
  if (process.argv.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  const environment = process.argv[2] || 'testing';
  const cleaner = new TestDataCleaner(environment);
  cleaner.run();
}

export default TestDataCleaner;
