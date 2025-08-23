---
type: "always_apply"
---

# WEBSITE TESTING RULE - OFFICIAL URL REQUIREMENT

## 🌐 OFFICIAL WEBSITE URL

**Primary Website:** <https://rc-calculadora.webflow.io/>

This is the **ONLY** website URL that should be used for all testing activities in this project.

## 🎯 SCOPE OF APPLICATION

This rule applies to ALL testing tools and activities, including but not limited to:

### Browser Automation

- **Playwright** browser automation tests
- **Selenium** web driver tests
- Any other browser automation frameworks

### Web Scraping & Analysis

- **Firecrawl** web scraping operations
- **Web crawling** and content extraction
- **API testing** against web endpoints

### Performance & Monitoring

- **Load testing** and performance analysis
- **Accessibility testing** tools
- **SEO analysis** and validation

### Development Testing

- **End-to-end (E2E)** testing
- **Integration testing** with web components
- **User acceptance testing** (UAT)

## 📋 MANDATORY REQUIREMENTS

### ✅ CORRECT USAGE

All testing tools MUST use the official URL:

#### Playwright Examples

```javascript
// ✅ CORRECT - Using official URL
await page.goto('https://rc-calculadora.webflow.io/');

// ✅ CORRECT - Navigation within official site
await page.goto('https://rc-calculadora.webflow.io/calculadora');
```

#### Firecrawl Examples

```javascript
// ✅ CORRECT - Scraping official site
{
  "url": "https://rc-calculadora.webflow.io/",
  "formats": ["markdown"]
}

// ✅ CORRECT - Crawling official site
{
  "url": "https://rc-calculadora.webflow.io/*",
  "maxDepth": 2
}
```

### ❌ FORBIDDEN USAGE

Never use alternative URLs for testing:

```javascript
// ❌ WRONG - Local development URLs
await page.goto('http://localhost:3000/');
await page.goto('http://127.0.0.1:8080/');

// ❌ WRONG - Staging or alternative domains
await page.goto('https://staging.example.com/');
await page.goto('https://test.webflow.io/');

// ❌ WRONG - Other Webflow sites
await page.goto('https://other-project.webflow.io/');
```

## 🚨 CRITICAL WARNINGS

### Data Integrity

- Testing on incorrect URLs can lead to **false test results**
- **Production data** may be affected if wrong endpoints are tested
- **User experience** testing must reflect the actual live site

### Compliance & Security

- Only the official URL is **authorized** for testing activities
- **Security scans** and **penetration testing** must target the correct site
- **GDPR and privacy** compliance requires testing the actual production environment

### Development Workflow

- **CI/CD pipelines** must reference the official URL
- **Automated testing** scripts should be configured with the correct endpoint
- **Documentation** and **test reports** must reflect the official site

## 🔧 IMPLEMENTATION GUIDELINES

### Environment Configuration

```javascript
// ✅ RECOMMENDED - Use environment variables
const OFFICIAL_WEBSITE = 'https://rc-calculadora.webflow.io/';

// ✅ RECOMMENDED - Configuration object
const testConfig = {
  baseURL: 'https://rc-calculadora.webflow.io/',
  timeout: 30000,
  retries: 2
};
```

### Test Setup Validation

```javascript
// ✅ RECOMMENDED - Validate URL before testing
function validateTestURL(url) {
  const officialDomain = 'rc-calculadora.webflow.io';
  if (!url.includes(officialDomain)) {
    throw new Error(`Invalid test URL. Must use ${officialDomain}`);
  }
}
```

## 📚 RELATED DOCUMENTATION

- [Playwright Testing Guidelines](../docs/playwright-testing.md)
- [Firecrawl Usage Examples](../docs/firecrawl-examples.md)
- [Project Testing Strategy](../docs/testing-strategy.md)

## 🔍 VERIFICATION CHECKLIST

Before running any tests, verify:

- [ ] URL starts with `https://rc-calculadora.webflow.io/`
- [ ] No localhost or development URLs are used
- [ ] Configuration files point to the official site
- [ ] Test scripts reference the correct domain
- [ ] Documentation examples use the official URL

## 📞 QUESTIONS & EXCEPTIONS

### When to Use This Rule

- **Always** - This rule has no exceptions
- **All environments** - Development, staging, and production testing
- **All team members** - Developers, QA, and stakeholders

### If You Need Different URLs

- **Contact the project lead** before using alternative URLs
- **Document the exception** with clear justification
- **Revert to official URL** as soon as possible

---

**Remember: <https://rc-calculadora.webflow.io/> is the single source of truth for all testing activities.**
