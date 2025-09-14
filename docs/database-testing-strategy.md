# Database Testing Strategy - Reino Capital Calculator

## 🎯 Overview

This document outlines the database isolation strategy for the Reino Capital Calculator project, ensuring proper separation between production, development, and test data.

## 📊 Current State Analysis

**Database:** Reino Capital - Calculadora (dwpsyresppubuxbrwrkc)

- **Total entries:** 55 submissions
- **Test entries:** 26 submissions (47% of production data!)
- **Issue:** Test data is polluting production database

## 🏗️ Recommended Architecture

### Three-Environment Strategy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PRODUCTION    │    │   DEVELOPMENT   │    │     TESTING     │
│                 │    │                 │    │                 │
│ Supabase Cloud  │    │ Local Supabase  │    │ Local Supabase  │
│ Real user data  │    │ Port: 54321     │    │ Port: 54322     │
│                 │    │ Dev data        │    │ Test data       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Implementation Plan

### Phase 1: Environment Setup

1. **Create Local Development Instance**

   ```bash
   # Create development instance
   mkdir -p instances/development
   cd instances/development
   npx supabase init
   npx supabase start
   ```

2. **Create Local Testing Instance**

   ```bash
   # Create testing instance
   mkdir -p instances/testing
   cd instances/testing
   npx supabase init
   # Modify config.toml to use different ports
   npx supabase start
   ```

### Phase 2: Environment Configuration

#### Development Environment (.env.development)

```env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<dev-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<dev-service-key>
ENVIRONMENT=development
```

#### Testing Environment (.env.test)

```env
SUPABASE_URL=http://localhost:54322
SUPABASE_ANON_KEY=<test-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<test-service-key>
ENVIRONMENT=testing
```

#### Production Environment (.env.production)

```env
SUPABASE_URL=https://dwpsyresppubuxbrwrkc.supabase.co
SUPABASE_ANON_KEY=<prod-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<prod-service-key>
ENVIRONMENT=production
```

### Phase 3: Test Data Isolation

#### Test Data Identification Pattern

```javascript
// Add environment tagging to all test submissions
const testSubmissionData = {
  ...formData,
  environment: 'testing',
  test_run_id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  created_by: 'playwright-test'
};
```

#### Test Cleanup Strategy

```javascript
// Automatic cleanup after test runs
afterAll(async () => {
  if (process.env.ENVIRONMENT === 'testing') {
    await supabase
      .from('calculator_submissions')
      .delete()
      .eq('environment', 'testing');
  }
});
```

## 📋 Migration Strategy

### Step 1: Clean Current Production Data

```sql
-- Remove test entries from production - SAFE PATTERNS ONLY
DELETE FROM calculator_submissions
WHERE
  email LIKE '%test%' OR
  email LIKE '%exemplo%' OR
  email LIKE '%playwright%' OR
  email LIKE '%@test.com' OR
  email LIKE '%+test@%' OR
  telefone LIKE '%(11) 11111%' OR
  telefone LIKE '%(11) 22222%' OR
  telefone LIKE '%(11) 33333%' OR
  telefone LIKE '%(99) 99999-%' OR
  environment IN ('testing', 'development') OR
  created_by IN ('playwright-test', 'headless-test', 'automated-test');
```

### Step 2: Add Environment Tracking

```sql
-- Add environment column to track data source
ALTER TABLE calculator_submissions 
ADD COLUMN environment VARCHAR(20) DEFAULT 'production';

-- Add index for efficient cleanup
CREATE INDEX idx_calculator_submissions_environment 
ON calculator_submissions(environment);
```

### Step 3: Update Application Code

- Modify form submission to include environment tag
- Update test helpers to use test environment
- Add cleanup procedures for test data

## 🧪 Testing Best Practices

### Test Data Patterns

```javascript
// Use consistent test data patterns
const TEST_DATA_PATTERNS = {
  emails: ['test1@playwright.com', 'test2@playwright.com'],
  names: ['Test User 1', 'Test User 2'],
  phones: ['(99) 99999-0001', '(99) 99999-0002'],
  prefix: 'TEST_'
};
```

### Test Isolation

```javascript
// Each test suite gets unique identifiers
describe('Calculator Tests', () => {
  const testSuiteId = `suite-${Date.now()}`;
  
  beforeEach(() => {
    // Use suite-specific data
    testData.session_id = `${testSuiteId}-${testIndex++}`;
  });
});
```

## 🚀 Benefits

### Data Integrity

- ✅ Production data remains clean
- ✅ No test pollution in real user data
- ✅ Safe to run tests anytime

### Development Efficiency

- ✅ Isolated development environment
- ✅ Fast test execution without cleanup concerns
- ✅ Parallel test execution possible

### Operational Safety

- ✅ No risk of accidentally affecting users
- ✅ Clear separation of concerns
- ✅ Easy to reset test environment

## 📊 Monitoring & Maintenance

### Regular Cleanup

```bash
# Weekly cleanup script
npm run test:cleanup-data
```

### Environment Health Checks

```javascript
// Verify environment isolation
const healthCheck = {
  production: await checkProductionDataIntegrity(),
  development: await checkDevelopmentEnvironment(),
  testing: await checkTestingEnvironment()
};
```

## 🔄 Next Steps

1. **Immediate:** Clean test data from production
2. **Short-term:** Set up local development/testing instances
3. **Medium-term:** Implement environment tagging
4. **Long-term:** Automated cleanup and monitoring

---

**Note:** This strategy maintains the current test approach (creating real DB entries) while ensuring proper isolation between environments.
