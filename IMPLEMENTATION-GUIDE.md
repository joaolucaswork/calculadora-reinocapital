# Database Isolation Implementation Guide

## 🎯 Overview

This guide provides step-by-step instructions for implementing database isolation in the Reino Capital Calculator project, ensuring proper separation between test and production data.

## 📊 Current Situation

**Problem:** Test data is contaminating the production database

- **Total entries:** 55 submissions
- **Test entries:** 26 submissions (47% of production data!)
- **Risk:** Test data mixed with real user data

## 🚀 Implementation Steps

### Phase 1: Immediate Cleanup (Production Safety)

#### Step 1: Clean Production Database

```bash
# First, run in dry-run mode to see what would be deleted
SUPABASE_ACCESS_TOKEN=<your-token> node scripts/production-cleanup.js --dry-run --verbose

# If the results look correct, run the actual cleanup
SUPABASE_ACCESS_TOKEN=<your-token> node scripts/production-cleanup.js --verbose
```

**What this does:**

- Removes test entries from production database
- Adds environment tracking columns
- Creates indexes for efficient cleanup
- Preserves all legitimate user data

#### Step 2: Verify Production Cleanup

Use the Supabase tool to verify the cleanup was successful:

```javascript
// Query to check remaining entries
SELECT COUNT(*) as total_entries FROM calculator_submissions;
SELECT COUNT(*) as production_entries FROM calculator_submissions WHERE environment = 'production';
```

### Phase 2: Environment Setup (Development)

#### Step 3: Set Up Local Environments

```bash
# Run the environment setup script
node scripts/setup-test-environments.js

# Start development database
npm run dev:db:start

# Start testing database  
npm run test:db:start

# Check status of both
npm run db:status:all
```

#### Step 4: Configure Environment Variables

Create environment-specific configuration files:

**.env.development**

```env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<dev-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<dev-service-key>
ENVIRONMENT=development
```

**.env.test**

```env
SUPABASE_URL=http://localhost:54322
SUPABASE_ANON_KEY=<test-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<test-service-key>
ENVIRONMENT=testing
```

### Phase 3: Application Integration

#### Step 5: Update Application Code

The Supabase integration module has been enhanced with:

- **Environment Detection:** Automatically detects test vs production
- **Data Tagging:** Adds environment and test_run_id to all submissions
- **Data Sanitization:** Adds test prefixes to test data
- **Cleanup Methods:** Built-in cleanup for test data

**Key Features:**

```javascript
// Environment is automatically detected
window.ReinoSupabaseIntegration.environment // 'testing', 'development', or 'production'

// Test data is automatically tagged
{
  environment: 'testing',
  test_run_id: 'test-1234567890-abc123',
  created_by: 'playwright-test',
  nome: 'Test João Silva',
  email: 'joao+test@exemplo.com'
}
```

#### Step 6: Update Test Configuration

The new test utilities provide:

- **Environment Setup:** Automatic test environment configuration
- **Data Isolation:** Ensures tests only see test data
- **Cleanup:** Automatic cleanup after test runs
- **Verification:** Validates isolation is working

**Usage in tests:**

```javascript
const { setupTestEnvironment, cleanupAfterTest } = require('./utils/environment-setup');

test.beforeEach(async ({ page }) => {
  const { testEnv } = await setupTestEnvironment(page);
  // Test environment is now isolated
});

test.afterEach(async ({ page }) => {
  await cleanupAfterTest(page, testEnv);
  // Test data is automatically cleaned up
});
```

### Phase 4: Testing and Validation

#### Step 7: Run Isolation Tests

```bash
# Run the new database isolation tests
npx playwright test tests/database-isolation.test.js

# Run all tests with the new isolation
npx playwright test
```

#### Step 8: Verify Isolation is Working

The tests will verify:

- ✅ Test environment is properly detected
- ✅ Test data is tagged with environment markers
- ✅ Test data is isolated from production queries
- ✅ Cleanup removes only test data
- ✅ Production data remains untouched

### Phase 5: Ongoing Maintenance

#### Step 9: Regular Cleanup

```bash
# Clean up test data weekly
npm run test:db:cleanup

# Or manually clean specific test runs
node scripts/cleanup-test-data.js testing --verbose
```

#### Step 10: Monitor Data Health

```bash
# Check database statistics
npm run db:status:all

# Verify no test data in production
node scripts/cleanup-test-data.js production --dry-run
```

## 🔧 Available Commands

### Database Management

```bash
npm run dev:db:start          # Start development database
npm run test:db:start         # Start testing database
npm run db:start:all          # Start both environments
npm run db:stop:all           # Stop both environments
npm run test:db:cleanup       # Clean test data
```

### Testing

```bash
npm run test:integration      # Run tests with cleanup
npx playwright test tests/database-isolation.test.js  # Test isolation
```

### Cleanup

```bash
node scripts/cleanup-test-data.js testing --dry-run   # Preview test cleanup
node scripts/production-cleanup.js --dry-run          # Preview production cleanup
```

## 🛡️ Safety Features

### Automatic Environment Detection

- **URL-based:** localhost = development, test params = testing
- **User Agent:** Playwright/headless = testing
- **Manual Override:** `window.REINO_ENVIRONMENT = 'testing'`

### Data Protection

- **Production Safety:** Cannot cleanup production without explicit confirmation
- **Safe Pattern Matching:** Only removes data with clear test indicators (emails, phones, environment tags)
- **No Name-Based Deletion:** Removed risky name patterns to protect real users
- **Test Tagging:** All test data is clearly marked with environment metadata
- **Isolation Verification:** Tests verify data separation
- **Dry Run Mode:** Preview changes before applying

### Cleanup Safeguards

- **Safe Pattern Matching:** Only removes data with explicit test indicators:
  - **Emails:** Contains "test", "exemplo", "playwright", "@test.com", "+test@"
  - **Phones:** Test patterns like "(11) 11111", "(99) 99999"
  - **Environment:** Tagged as "testing" or "development"
  - **Created By:** "playwright-test", "headless-test", "automated-test"
- **No Name Matching:** Removed risky name patterns to protect real users
- **Batch Processing:** Handles large datasets safely
- **Error Handling:** Continues on partial failures
- **Audit Trail:** Logs all cleanup operations

## 📊 Expected Results

### Before Implementation

- 55 total entries (26 test + 29 production)
- Test data mixed with user data
- No isolation between environments

### After Implementation

- ~29 production entries (clean user data)
- 0 test entries in production
- Isolated test environments
- Automatic test data cleanup

## 🚨 Important Notes

1. **Always run cleanup scripts in dry-run mode first**
2. **Backup production data before running cleanup**
3. **Test the isolation thoroughly before deploying**
4. **Monitor production database for test data contamination**
5. **Use environment-specific Supabase instances for complete isolation**

## 🎯 Success Criteria

- ✅ Production database contains only legitimate user data
- ✅ Test data is automatically isolated and tagged
- ✅ Tests run without affecting production data
- ✅ Automatic cleanup prevents test data accumulation
- ✅ Environment detection works reliably
- ✅ Data integrity is maintained across all environments

## 📞 Support

If you encounter issues:

1. **Check environment detection:** `window.ReinoSupabaseIntegration.getStatus()`
2. **Verify test isolation:** Run `tests/database-isolation.test.js`
3. **Review cleanup logs:** Check console output for errors
4. **Validate data patterns:** Ensure test data matches expected patterns

---

**Remember:** This implementation maintains your current test approach (creating real DB entries) while ensuring proper isolation between test and production environments.
