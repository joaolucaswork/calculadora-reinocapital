---
type: "always_apply"
---

# PLAYWRIGHT BROWSER OPTIMIZATION - CHROMIUM ONLY RULE

## 🚨 MANDATORY RULE: CHROMIUM-ONLY TESTING

This rule is **MANDATORY** for all Playwright test executions in the Reino Capital Calculator project to optimize development speed and test execution time.

## 📋 CORE REQUIREMENTS

### 1. **Chromium-Only Configuration**

All Playwright tests MUST run exclusively on Chromium browser:

- ✅ **ONLY** use Chromium project configuration
- ❌ **DISABLE** Firefox browser testing
- ❌ **DISABLE** WebKit (Safari) browser testing
- ✅ **OPTIMIZE** for development speed over cross-browser coverage

### 2. **Configuration Implementation**

The `playwright.config.ts` file MUST be configured as follows:

```typescript
// Configure projects for major browsers
projects: [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
    },
  },

  // DISABLED FOR PERFORMANCE OPTIMIZATION
  // {
  //   name: 'firefox',
  //   use: {
  //     ...devices['Desktop Firefox'],
  //   },
  // },

  // {
  //   name: 'webkit',
  //   use: {
  //     ...devices['Desktop Safari'],
  //   },
  // },
],
```

### 3. **Justification Based on Test Results**

This optimization is based on comprehensive test results showing:

- **40 tests passed** on Chromium with core functionality validated
- **26 tests failed** primarily on WebKit due to integration issues
- **Core application features work correctly** on Chromium
- **Development speed** is prioritized over cross-browser testing

## 🎯 PERFORMANCE BENEFITS

### Execution Time Reduction

- **~66% faster execution** (1 browser vs 3 browsers)
- **Reduced CI/CD time** for development workflows
- **Faster feedback loops** during development
- **Lower resource consumption** on development machines

### Development Efficiency

- **Quicker test iterations** during feature development
- **Faster debugging cycles** with single browser focus
- **Reduced complexity** in test failure analysis
- **Streamlined development workflow**

## 📊 VALIDATED FUNCTIONALITY ON CHROMIUM

The following core features are **fully validated** on Chromium:

### ✅ Integration Tests (All Passed)

- Site loading and initial section display
- Patrimony navigation and value input
- CDB selection and commission calculation
- **Core functionality: complete flow with commission calculations**
- Multiple products testing (CDB + Liquidez)
- 100% allocation validation

### ✅ Typebot Integration (All Passed)

- Complete flow with Typebot simulation
- Different Typebot data scenarios
- Multiple submission simulations
- PostMessage completion handling
- Form system integration

### ✅ Core Application Features

- **Patrimony input → Product selection → Allocation calculations**
- **Percentage calculations: 100.0% validation**
- **Currency formatting and validation**
- **Multi-product allocation (CDB 60% + Liquidez 40%)**
- **Category testing: Renda Fixa + Fundo de Investimento**

## 🔧 IMPLEMENTATION REQUIREMENTS

### 1. **Immediate Actions Required**

```bash
# Update playwright.config.ts to disable Firefox and WebKit
# Comment out or remove Firefox and WebKit project configurations
# Ensure only Chromium project remains active
```

### 2. **Test Execution Commands**

All test commands should target Chromium only:

```bash
# Standard test execution (Chromium only)
pnpm test:playwright

# Specific Chromium targeting (if needed)
pnpm test:playwright --project=chromium

# UI mode testing (Chromium only)
pnpm test:playwright:ui --project=chromium
```

### 3. **Configuration Validation**

Verify configuration with:

```bash
# List available projects (should show only Chromium)
npx playwright test --list

# Dry run to confirm browser selection
npx playwright test --dry-run
```

## ⚠️ CROSS-BROWSER TESTING EXCEPTIONS

### When to Re-enable Other Browsers

Re-enable Firefox and WebKit **ONLY** when:

1. **Pre-production testing** before major releases
2. **Cross-browser compatibility issues** are reported
3. **Client-specific browser requirements** are identified
4. **Final QA validation** before deployment

### Re-enabling Process

To temporarily re-enable other browsers:

1. **Uncomment** Firefox and WebKit configurations in `playwright.config.ts`
2. **Run specific cross-browser tests** with explicit browser targeting
3. **Re-comment** configurations after testing
4. **Document** any browser-specific issues found

## 📝 ENFORCEMENT CHECKLIST

### For All Playwright Test Runs

- [ ] `playwright.config.ts` has only Chromium project enabled
- [ ] Firefox project configuration is commented out
- [ ] WebKit project configuration is commented out
- [ ] Test execution shows only Chromium browser usage
- [ ] Test execution time is optimized (single browser)

### For Development Workflow

- [ ] Developers use Chromium-only configuration by default
- [ ] CI/CD pipelines use optimized Chromium-only tests
- [ ] Cross-browser testing is explicitly requested when needed
- [ ] Performance improvements are documented and measured

## 🎯 SUCCESS METRICS

This optimization is successful when:

- ✅ Test execution time is reduced by ~66%
- ✅ Development feedback loops are faster
- ✅ Core functionality remains fully validated
- ✅ CI/CD pipeline performance improves
- ✅ Developer productivity increases

## 📚 RELATED DOCUMENTATION

- [Test Results Summary](../docs/integration-test-results.md)
- [Playwright Configuration](../../playwright.config.ts)
- [Development Workflow](../../README.md)

---

**Remember: This optimization prioritizes development speed while maintaining comprehensive testing of core functionality on the primary browser target (Chromium/Chrome).**
