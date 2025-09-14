# Database Isolation Pre-Merge Testing Guide

## 🎯 Overview

This guide provides comprehensive instructions for implementing automated database isolation tests as a **mandatory pre-merge requirement** for the master branch in the Reino Capital Calculator project.

## 📋 Table of Contents

1. [Pre-merge Hook Setup](#pre-merge-hook-setup)
2. [Test Execution Requirements](#test-execution-requirements)
3. [Environment Configuration](#environment-configuration)
4. [Failure Handling](#failure-handling)
5. [CI/CD Integration Examples](#cicd-integration-examples)
6. [Troubleshooting Guide](#troubleshooting-guide)

---

## 🔧 Pre-merge Hook Setup

### Git Hooks Configuration

#### Option A: Local Git Hook (Development)

Create a pre-push hook to run tests before pushing to master:

```bash
# Create the hook file
touch .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

Add the following content to `.git/hooks/pre-push`:

```bash
#!/bin/bash

# Get the branch being pushed
branch=$(git rev-parse --abbrev-ref HEAD)

# Only run tests when pushing to master
if [ "$branch" = "master" ] || [ "$branch" = "main" ]; then
    echo "🔍 Running database isolation tests before merge to master..."
    
    # Run isolation tests
    npm run test:isolation
    if [ $? -ne 0 ]; then
        echo "❌ Database isolation tests failed. Push rejected."
        exit 1
    fi
    
    # Run cleanup verification
    npm run db:cleanup:testing
    if [ $? -ne 0 ]; then
        echo "❌ Database cleanup verification failed. Push rejected."
        exit 1
    fi
    
    echo "✅ All database isolation tests passed. Push allowed."
fi
```

#### Option B: Husky Integration (Recommended)

Install and configure Husky v9 for team-wide hook management:

```bash
# Install Husky v9
pnpm add --save-dev husky

# Initialize Husky (creates .husky/ directory and adds prepare script)
pnpm exec husky init

# The init command automatically:
# - Creates .husky/ directory with Git hooks
# - Adds "prepare": "husky" script to package.json
# - Creates a basic pre-commit hook
```

**Husky v9 Features:**

- ✅ Ultra-fast (2kB, runs in ~1ms)
- ✅ Zero dependencies
- ✅ Uses Git's native core.hooksPath
- ✅ Supports all Git hooks and environments
- ✅ Team-wide consistency

---

## ✅ Test Execution Requirements

### Mandatory Test Suite

Before any merge to master, the following tests **MUST** pass:

#### 1. Database Isolation Tests (8/8 Required)

```bash
pnpm test:isolation
```

**Success Criteria:**

- ✅ All 8 tests must pass (100% success rate)
- ✅ Test execution time < 60 seconds
- ✅ No timeout errors or browser crashes

**Expected Output:**

```
Running 8 tests using 6 workers
✓ should detect testing environment correctly
✓ should isolate test data from production queries  
✓ should sanitize test data with proper prefixes
✓ should create test data with proper isolation tags
✓ should cleanup test data properly
✓ should handle environment detection correctly
✓ should prevent production data contamination
✓ should maintain test data consistency across page reloads

8 passed (11.9s)
```

#### 2. Database Cleanup Verification

```bash
pnpm db:cleanup:testing
```

**Success Criteria:**

- ✅ Script executes without errors (exit code 0)
- ✅ Test data is properly identified and removed
- ✅ Production data remains untouched
- ✅ Final statistics show 0 testing entries

**Expected Output:**

```
🚀 Starting test data cleanup for testing environment

📊 Current database statistics:
  Total entries: X
  Production entries: Y
  Testing entries: Z
  Test pattern matches: Z

🧹 Cleaning up testing environment data...
✅ Deleted Z entries from testing environment

📊 Final database statistics:
  Total entries: Y
  Production entries: Y
  Testing entries: 0
  Test pattern matches: 0

✅ Cleanup completed successfully!
```

#### 3. Environment Validation

```bash
pnpm db:status
```

**Success Criteria:**

- ✅ All environment files present (`.env.testing`, `.env.production`)
- ✅ Supabase connection successful
- ✅ Database schema includes isolation columns

---

## 🌍 Environment Configuration

### Required Environment Files

Ensure these files exist and are properly configured:

#### `.env.testing`

```env
SUPABASE_URL=https://dwpsyresppubuxbrwrkc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ENVIRONMENT=testing
NODE_ENV=test
DEBUG=true
TEST_MODE=true
```

#### `.env.production`

```env
SUPABASE_URL=https://dwpsyresppubuxbrwrkc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ENVIRONMENT=production
NODE_ENV=production
```

### Database Schema Requirements

The `calculator_submissions` table must include these isolation columns:

```sql
-- Required columns for isolation
environment VARCHAR DEFAULT 'production'
created_by VARCHAR DEFAULT 'user'
test_run_id VARCHAR NULL
```

### Playwright Configuration

Verify `playwright.config.ts` is configured for Chromium-only testing:

```typescript
export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox and WebKit should be commented out for performance
  ],
});
```

---

## 🚨 Failure Handling

### When Tests Fail

#### 1. Database Isolation Test Failures

**Common Issues:**

- Button timeout errors
- Environment detection failures
- Data contamination between tests

**Resolution Steps:**

```bash
# 1. Clean test environment
pnpm db:cleanup:testing

# 2. Verify environment configuration
pnpm db:status

# 3. Re-run tests with verbose output
pnpm test:isolation --reporter=verbose

# 4. Check browser compatibility
npx playwright install chromium
```

#### 2. Cleanup Verification Failures

**Common Issues:**

- Service role key authentication
- Network connectivity to Supabase
- Insufficient permissions

**Resolution Steps:**

```bash
# 1. Verify service role key
node -e "console.log(process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20))"

# 2. Test Supabase connection
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     "$SUPABASE_URL/rest/v1/calculator_submissions?select=count"

# 3. Manual cleanup if needed
node scripts/cleanup-test-data.js testing --dry-run
```

#### 3. Production Data Contamination

**Emergency Procedures:**

```bash
# 1. STOP all testing immediately
# 2. Assess contamination scope
pnpm db:status

# 3. Identify test data in production
node scripts/cleanup-test-data.js production --dry-run

# 4. Remove test data (CAREFUL!)
node scripts/cleanup-test-data.js production --verbose

# 5. Verify production integrity
pnpm db:status
```

### Merge Rejection Process

When tests fail:

1. **Automatic Rejection**: CI/CD pipeline blocks merge
2. **Developer Notification**: Clear error messages with resolution steps
3. **Fix Requirements**: All tests must pass before retry
4. **Re-validation**: Full test suite runs again after fixes

---

## 🔄 CI/CD Integration Examples

### GitHub Actions

Create `.github/workflows/database-isolation.yml`:

```yaml
name: Database Isolation Tests

on:
  pull_request:
    branches: [ master, main ]

jobs:
  database-isolation:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright browsers
      run: npx playwright install chromium
    
    - name: Setup environment
      run: |
        echo "SUPABASE_URL=${{ secrets.SUPABASE_URL }}" >> .env.testing
        echo "SUPABASE_ANON_KEY=${{ secrets.SUPABASE_ANON_KEY }}" >> .env.testing
        echo "SUPABASE_SERVICE_ROLE_KEY=${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" >> .env.testing
    
    - name: Run database isolation tests
      run: npm run test:isolation
    
    - name: Verify cleanup functionality
      run: npm run db:cleanup:testing
    
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: test-results
        path: test-results/
```

### GitLab CI

Create `.gitlab-ci.yml` section:

```yaml
database-isolation:
  stage: test
  image: node:18
  before_script:
    - npm ci
    - npx playwright install chromium
  script:
    - echo "SUPABASE_URL=$SUPABASE_URL" >> .env.testing
    - echo "SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> .env.testing
    - echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY" >> .env.testing
    - npm run test:isolation
    - npm run db:cleanup:testing
  only:
    - merge_requests
  variables:
    SUPABASE_URL: $SUPABASE_URL
    SUPABASE_ANON_KEY: $SUPABASE_ANON_KEY
    SUPABASE_SERVICE_ROLE_KEY: $SUPABASE_SERVICE_ROLE_KEY
```

---

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

#### Issue: "Button timeout in database isolation tests"

**Symptoms:**

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button[element-function="next"]')
```

**Solutions:**

1. Verify Chromium browser installation: `npx playwright install chromium`
2. Check website accessibility: `curl -I https://reinocapital.webflow.io/taxas-app`
3. Increase timeout in test configuration
4. Use more specific selectors: `[data-step="1"] button[element-function="next"]`

#### Issue: "Supabase authentication failed"

**Symptoms:**

```
Error: Missing Supabase configuration for testing environment
```

**Solutions:**

1. Verify `.env.testing` file exists and contains valid keys
2. Check service role key permissions in Supabase dashboard
3. Test connection manually:

   ```bash
   curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        "$SUPABASE_URL/rest/v1/"
   ```

#### Issue: "Production data contamination detected"

**Symptoms:**

```
Error: expect(received).toBe(expected)
Expected: false
Received: true
```

**Solutions:**

1. Immediately stop all testing
2. Run contamination assessment: `node scripts/cleanup-test-data.js production --dry-run`
3. Clean contaminated data: `node scripts/cleanup-test-data.js production`
4. Review and fix test isolation logic

#### Issue: "ES module import errors"

**Symptoms:**

```
ReferenceError: require is not defined in ES module scope
```

**Solutions:**

1. Convert CommonJS to ES modules in scripts
2. Update `package.json` with `"type": "module"`
3. Use `import` instead of `require` statements
4. Update file extensions to `.mjs` if needed

### Performance Optimization

#### Slow Test Execution

**Optimizations:**

1. **Chromium-only testing**: Disable Firefox and WebKit
2. **Parallel execution**: Use `--workers=6` for faster runs
3. **Selective testing**: Run only isolation tests for pre-merge
4. **Browser reuse**: Configure Playwright for browser persistence

#### Memory Issues

**Solutions:**

1. Increase Node.js memory: `node --max-old-space-size=4096`
2. Close browser instances properly in tests
3. Use `page.close()` and `browser.close()` in cleanup
4. Monitor memory usage during CI runs

---

## 📚 Additional Resources

- [Playwright Testing Documentation](https://playwright.dev/docs/intro)
- [Supabase API Reference](https://supabase.com/docs/reference/api)
- [Reino Capital Calculator Test Results](../tests/database-isolation.test.js)
- [Environment Setup Guide](./IMPLEMENTATION-GUIDE.md)

---

## 🎯 Success Metrics

A successful pre-merge validation includes:

- ✅ **8/8 database isolation tests passing**
- ✅ **0 test data entries remaining after cleanup**
- ✅ **Production data integrity maintained**
- ✅ **Test execution time < 60 seconds**
- ✅ **Zero false positives or flaky tests**

---

## 🔐 Security Considerations

### Environment Secrets Management

**Critical Security Requirements:**

1. **Never commit sensitive keys to repository**

   ```bash
   # Add to .gitignore
   .env*
   !.env.example
   ```

2. **Use CI/CD secret management**
   - GitHub: Repository Settings → Secrets and variables
   - GitLab: Project Settings → CI/CD → Variables
   - Azure DevOps: Pipeline → Library → Variable groups

3. **Rotate keys regularly**

   ```bash
   # Generate new Supabase service role key monthly
   # Update all environments simultaneously
   # Test connectivity after rotation
   ```

4. **Principle of least privilege**
   - Testing environment: Limited to test database
   - Production environment: Read-only for monitoring
   - Service role: Minimum required permissions

### Data Privacy Compliance

**LGPD/GDPR Considerations:**

- Test data must not contain real user information
- Automated cleanup prevents data retention violations
- Audit logs track all database operations
- Data anonymization for development environments

---

## 📊 Monitoring and Alerting

### Test Execution Monitoring

**Key Metrics to Track:**

- Test success rate over time
- Average execution duration
- Failure patterns and root causes
- Database cleanup effectiveness

**Recommended Monitoring Setup:**

```yaml
# Example monitoring configuration
alerts:
  - name: "Database Isolation Test Failure"
    condition: "test_success_rate < 95%"
    notification: "slack://dev-team"

  - name: "Test Data Contamination"
    condition: "production_test_entries > 0"
    notification: "email://security-team"
    severity: "critical"
```

### Database Health Checks

**Automated Monitoring:**

```bash
# Daily production health check
0 6 * * * /usr/bin/node /path/to/scripts/production-health-check.js

# Weekly test environment cleanup
0 2 * * 0 /usr/bin/node /path/to/scripts/cleanup-test-data.js testing
```

---

## 🚀 Advanced Configuration

### Multi-Environment Testing

**Staging Environment Setup:**

```bash
# Create staging-specific configuration
cp .env.testing .env.staging
sed -i 's/testing/staging/g' .env.staging

# Add staging tests to CI/CD
npm run test:isolation:staging
```

### Custom Test Scenarios

**Extended Test Suite:**

```javascript
// tests/database-isolation-extended.test.js
test('should handle concurrent test executions', async ({ page }) => {
  // Test parallel test execution isolation
});

test('should recover from network failures', async ({ page }) => {
  // Test resilience to connectivity issues
});

test('should validate data encryption', async ({ page }) => {
  // Test sensitive data handling
});
```

### Performance Benchmarking

**Baseline Performance Metrics:**

```bash
# Establish performance baselines
npm run test:isolation -- --reporter=json > baseline-results.json

# Compare against baseline in CI
npm run test:performance:compare
```

---

## 📋 Team Onboarding Checklist

### New Developer Setup

**Required Steps:**

- [ ] Clone repository and install dependencies
- [ ] Configure local environment files (`.env.testing`)
- [ ] Install Playwright browsers: `npx playwright install chromium`
- [ ] Run initial test suite: `pnpm test:isolation`
- [ ] Verify cleanup functionality: `pnpm db:cleanup:testing`
- [ ] Set up Git hooks: `npx husky install`
- [ ] Review database isolation documentation
- [ ] Complete security training on data handling

### Code Review Requirements

**Pre-merge Checklist:**

- [ ] Database isolation tests pass (8/8)
- [ ] No hardcoded credentials or test data
- [ ] Proper error handling for database operations
- [ ] Test data cleanup verified
- [ ] Performance impact assessed
- [ ] Security review completed for data access patterns

---

## 🔄 Maintenance and Updates

### Regular Maintenance Tasks

**Weekly:**

- Review test execution logs for patterns
- Clean up accumulated test data
- Verify environment configurations

**Monthly:**

- Update Playwright and dependencies
- Rotate Supabase service keys
- Review and update test scenarios
- Performance optimization assessment

**Quarterly:**

- Security audit of database access
- Review and update documentation
- Evaluate new testing tools and approaches
- Team training on updated procedures

### Version Compatibility

**Supported Versions:**

- Node.js: 18.x or higher
- Playwright: 1.40.x or higher
- Supabase JS: 2.x
- Chrome/Chromium: Latest stable

**Update Procedures:**

```bash
# Update dependencies
npm update @playwright/test @supabase/supabase-js

# Verify compatibility
npm run test:isolation

# Update documentation if needed
```

---

## 📞 Support and Escalation

### Internal Support

**Level 1 - Developer Self-Service:**

- Review this documentation
- Check troubleshooting guide
- Run diagnostic commands
- Search existing issues

**Level 2 - Team Lead Support:**

- Complex configuration issues
- Performance optimization
- Test scenario updates
- Environment management

**Level 3 - Infrastructure Team:**

- Supabase configuration changes
- CI/CD pipeline modifications
- Security policy updates
- Production incident response

### Emergency Contacts

**Production Data Contamination:**

- Immediate escalation to Security Team
- Stop all automated testing
- Initiate incident response protocol

**Critical Test Failures:**

- Block all merges to master
- Investigate root cause immediately
- Communicate status to development team

---

## 📈 Continuous Improvement

### Feedback Collection

**Regular Review Process:**

- Monthly team retrospectives on testing effectiveness
- Quarterly assessment of test coverage and scenarios
- Annual review of database isolation strategy

**Metrics for Improvement:**

- Reduction in production incidents
- Faster development cycle times
- Improved developer confidence
- Enhanced data security posture

### Future Enhancements

**Planned Improvements:**

- Automated test data generation
- Enhanced monitoring and alerting
- Integration with additional databases
- Advanced security scanning

---

*This comprehensive guide ensures robust database isolation and prevents production data contamination in the Reino Capital Calculator project. Regular updates and team training are essential for maintaining effectiveness.*
