#!/usr/bin/env node

/**
 * Production Database Cleanup Script
 * Removes test data from production database using Supabase Management API
 *
 * IMPORTANT: This script operates on PRODUCTION data. Use with extreme caution.
 */

const readline = require('readline');

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

class ProductionCleaner {
  constructor() {
    this.projectId = 'dwpsyresppubuxbrwrkc';
    this.dryRun = process.argv.includes('--dry-run');
    this.force = process.argv.includes('--force');
    this.verbose = process.argv.includes('--verbose');
  }

  async confirmAction() {
    if (this.force) {
      console.log('🚨 FORCE MODE: Skipping confirmation');
      return true;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(
        '\n🚨 WARNING: This will modify PRODUCTION database!\n' +
          'Are you absolutely sure you want to continue? (type "YES" to confirm): ',
        (answer) => {
          rl.close();
          resolve(answer === 'YES');
        }
      );
    });
  }

  async identifyTestData() {
    console.log('🔍 Identifying test data in production database...');

    // Build SQL query to identify test patterns - SAFE PATTERNS ONLY
    const emailConditions = TEST_PATTERNS.emails
      .map((pattern) => `email ILIKE '${pattern}'`)
      .join(' OR ');

    const phoneConditions = TEST_PATTERNS.phones
      .map((pattern) => `telefone ILIKE '${pattern}'`)
      .join(' OR ');

    const environmentConditions = TEST_PATTERNS.environment
      .map((env) => `environment = '${env}'`)
      .join(' OR ');

    const createdByConditions = TEST_PATTERNS.created_by
      .map((creator) => `created_by = '${creator}'`)
      .join(' OR ');

    const query = `
      SELECT id, nome, email, telefone, submitted_at, environment, created_by
      FROM calculator_submissions
      WHERE (${emailConditions}) OR (${phoneConditions}) OR (${environmentConditions}) OR (${createdByConditions})
      ORDER BY submitted_at DESC
    `;

    try {
      const response = await fetch(
        `https://api.supabase.com/v1/projects/${this.projectId}/database/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.result || [];
    } catch (error) {
      throw new Error(`Failed to identify test data: ${error.message}`);
    }
  }

  async deleteTestData(testEntries) {
    if (testEntries.length === 0) {
      console.log('✅ No test data to delete');
      return { deleted: 0, errors: [] };
    }

    console.log(`🗑️ Deleting ${testEntries.length} test entries...`);

    if (this.dryRun) {
      console.log('🔍 DRY RUN MODE - No data will be deleted');
      return { deleted: 0, errors: [] };
    }

    const ids = testEntries.map((entry) => entry.id);
    const batchSize = 50;
    let totalDeleted = 0;
    const errors = [];

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const placeholders = batch.map((_, index) => `$${index + 1}`).join(',');

      const deleteQuery = `
        DELETE FROM calculator_submissions 
        WHERE id IN (${placeholders})
      `;

      try {
        const response = await fetch(
          `https://api.supabase.com/v1/projects/${this.projectId}/database/query`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: deleteQuery,
              params: batch,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Delete request failed: ${response.status} ${response.statusText}`);
        }

        totalDeleted += batch.length;
        console.log(`✅ Deleted batch ${Math.floor(i / batchSize) + 1} (${batch.length} entries)`);
      } catch (error) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        console.error(`❌ Failed to delete batch: ${error.message}`);
      }
    }

    return { deleted: totalDeleted, errors };
  }

  async addEnvironmentColumns() {
    console.log('🔧 Adding environment tracking columns...');

    const migrations = [
      {
        name: 'Add environment column',
        query: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'calculator_submissions' 
              AND column_name = 'environment'
            ) THEN
              ALTER TABLE calculator_submissions 
              ADD COLUMN environment VARCHAR(20) DEFAULT 'production';
            END IF;
          END $$;
        `,
      },
      {
        name: 'Add test_run_id column',
        query: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'calculator_submissions' 
              AND column_name = 'test_run_id'
            ) THEN
              ALTER TABLE calculator_submissions 
              ADD COLUMN test_run_id VARCHAR(50) NULL;
            END IF;
          END $$;
        `,
      },
      {
        name: 'Add created_by column',
        query: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'calculator_submissions' 
              AND column_name = 'created_by'
            ) THEN
              ALTER TABLE calculator_submissions 
              ADD COLUMN created_by VARCHAR(50) DEFAULT 'user';
            END IF;
          END $$;
        `,
      },
      {
        name: 'Create environment index',
        query: `
          CREATE INDEX IF NOT EXISTS idx_calculator_submissions_environment 
          ON calculator_submissions(environment);
        `,
      },
      {
        name: 'Create test_run_id index',
        query: `
          CREATE INDEX IF NOT EXISTS idx_calculator_submissions_test_run 
          ON calculator_submissions(test_run_id) 
          WHERE test_run_id IS NOT NULL;
        `,
      },
    ];

    const results = [];

    for (const migration of migrations) {
      try {
        if (this.dryRun) {
          console.log(`🔍 DRY RUN: Would execute - ${migration.name}`);
          results.push({ name: migration.name, success: true, dryRun: true });
          continue;
        }

        const response = await fetch(
          `https://api.supabase.com/v1/projects/${this.projectId}/database/query`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: migration.query }),
          }
        );

        if (!response.ok) {
          throw new Error(`Migration failed: ${response.status} ${response.statusText}`);
        }

        console.log(`✅ ${migration.name} completed`);
        results.push({ name: migration.name, success: true });
      } catch (error) {
        console.error(`❌ ${migration.name} failed: ${error.message}`);
        results.push({ name: migration.name, success: false, error: error.message });
      }
    }

    return results;
  }

  async getStatistics() {
    const queries = [
      { name: 'total', query: 'SELECT COUNT(*) as count FROM calculator_submissions' },
      {
        name: 'production',
        query:
          "SELECT COUNT(*) as count FROM calculator_submissions WHERE environment = 'production'",
      },
      {
        name: 'testing',
        query: "SELECT COUNT(*) as count FROM calculator_submissions WHERE environment = 'testing'",
      },
    ];

    const stats = {};

    for (const { name, query } of queries) {
      try {
        const response = await fetch(
          `https://api.supabase.com/v1/projects/${this.projectId}/database/query`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          stats[name] = result.result?.[0]?.count || 0;
        } else {
          stats[name] = 'error';
        }
      } catch (error) {
        stats[name] = 'error';
      }
    }

    return stats;
  }

  async run() {
    try {
      console.log('🚀 Starting production database cleanup...\n');

      // Check for required environment variable
      if (!process.env.SUPABASE_ACCESS_TOKEN) {
        throw new Error('SUPABASE_ACCESS_TOKEN environment variable is required');
      }

      // Show initial statistics
      console.log('📊 Current database statistics:');
      const initialStats = await this.getStatistics();
      Object.entries(initialStats).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });

      // Identify test data
      const testEntries = await this.identifyTestData();
      console.log(`\n🔍 Found ${testEntries.length} test entries`);

      if (this.verbose && testEntries.length > 0) {
        console.log('\n📋 Test entries to be removed:');
        testEntries.slice(0, 10).forEach((entry) => {
          console.log(`  - ${entry.nome} (${entry.email}) - ${entry.submitted_at}`);
        });
        if (testEntries.length > 10) {
          console.log(`  ... and ${testEntries.length - 10} more`);
        }
      }

      // Confirm action
      if (testEntries.length > 0) {
        const confirmed = await this.confirmAction();
        if (!confirmed) {
          console.log('❌ Operation cancelled by user');
          return;
        }
      }

      // Add environment columns
      console.log('\n🔧 Setting up environment tracking...');
      const migrationResults = await this.addEnvironmentColumns();

      // Delete test data
      const deleteResult = await this.deleteTestData(testEntries);

      // Show final statistics
      console.log('\n📊 Final database statistics:');
      const finalStats = await this.getStatistics();
      Object.entries(finalStats).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });

      console.log('\n✅ Production cleanup completed!');
      console.log(`📊 Summary:`);
      console.log(`  - Test entries deleted: ${deleteResult.deleted}`);
      console.log(`  - Migration errors: ${deleteResult.errors.length}`);
      console.log(
        `  - Environment tracking: ${migrationResults.every((r) => r.success) ? 'enabled' : 'partial'}`
      );
    } catch (error) {
      console.error('❌ Production cleanup failed:', error.message);
      process.exit(1);
    }
  }
}

function showHelp() {
  console.log(`
🧹 Production Database Cleanup Script

Usage: SUPABASE_ACCESS_TOKEN=<token> node scripts/production-cleanup.js [options]

Options:
  --dry-run   Show what would be deleted without actually deleting
  --verbose   Show detailed information about entries
  --force     Skip confirmation prompt (DANGEROUS!)
  --help      Show this help message

Environment Variables:
  SUPABASE_ACCESS_TOKEN   Required: Your Supabase management API token

Examples:
  SUPABASE_ACCESS_TOKEN=xxx node scripts/production-cleanup.js --dry-run
  SUPABASE_ACCESS_TOKEN=xxx node scripts/production-cleanup.js --verbose

⚠️  WARNING: This script modifies PRODUCTION data. Always run with --dry-run first!
`);
}

if (require.main === module) {
  if (process.argv.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  const cleaner = new ProductionCleaner();
  cleaner.run();
}

module.exports = ProductionCleaner;
