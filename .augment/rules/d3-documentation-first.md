---
type: "always_apply"
---

# D3.js Documentation-First Development Rule

## 🚨 MANDATORY RULE: D3.js Official Documentation First

This rule is **MANDATORY** for all D3.js implementations, modifications, and fixes in this project. Violation of this rule is not permitted.

## 📋 CORE REQUIREMENTS

### 1. **Always Consult D3.js Documentation First**

Before implementing ANY D3.js functionality, you MUST:

1. **Search official D3.js documentation** using Context7 library ID: `/d3/d3`
2. **Find official API methods** and patterns for the required functionality
3. **Verify best practices** from official examples and documentation
4. **Only proceed** after confirming the official D3 approach

### 2. **Use Official D3 APIs Over Custom Solutions**

- ❌ **NEVER** create custom workarounds when D3.js provides native methods
- ❌ **NEVER** implement functionality from scratch if D3 has built-in support
- ✅ **ALWAYS** prefer official D3 API approach over custom implementations
- ✅ **ALWAYS** follow D3.js patterns and conventions

### 3. **Mandatory Documentation Search Process**

For EVERY D3.js task, follow this exact sequence:

#### Step 1: Resolve Library ID (if needed)

```javascript
// Use resolve-library-id if D3 library ID is unknown
resolve-library-id("d3")
```

#### Step 2: Search D3 Documentation

```javascript
// Use get-library-docs with Context7 for specific functionality
get-library-docs("/d3/d3", {
  topic: "tooltip events selection click hover", // relevant keywords
  tokens: 8000
})
```

#### Step 3: Find Examples and Best Practices

```javascript
// Use firecrawl_search for D3 examples and patterns
firecrawl_search({
  query: "d3.js tooltip click sticky persistent examples",
  limit: 5
})
```

#### Step 4: Verify Implementation Approach

- Compare found documentation with intended implementation
- Identify official D3 methods that solve the problem
- Plan implementation using official APIs only

### 4. **Specific Search Topics for Common Tasks**

| Task | Required Search Keywords |
|------|-------------------------|
| Tooltips | `tooltip`, `hover`, `mouseover`, `mouseout`, `click` |
| Event Handling | `selection.on`, `event`, `click`, `mouseover`, `dispatch` |
| Data Binding | `selection.data`, `enter`, `exit`, `update` |
| Transitions | `transition`, `duration`, `ease`, `delay` |
| Selections | `select`, `selectAll`, `append`, `attr`, `style` |
| Scales | `scale`, `domain`, `range`, `linear`, `ordinal` |
| Shapes | `arc`, `pie`, `line`, `area`, `path` |

### 5. **Implementation Validation**

After finding official documentation, validate your approach:

- ✅ Uses official D3 API methods
- ✅ Follows D3.js patterns and conventions  
- ✅ Matches examples from official documentation
- ✅ Leverages D3's built-in functionality
- ❌ No custom workarounds for existing D3 features
- ❌ No reinventing D3 functionality

## 🎯 PROJECT-SPECIFIC APPLICATION

### Reino Capital Calculator - Donut Chart

This rule specifically applies to:

- **Tooltip functionality**: Must use official D3 tooltip patterns
- **Event handling**: Must use `selection.on()` API correctly
- **Chart interactions**: Must follow D3 interaction best practices
- **Data visualization**: Must use D3's built-in chart components

### Current Implementation Review

All existing D3.js code must be reviewed against this rule:

1. **Donut chart tooltips** - Verify against D3 tooltip documentation
2. **Event handlers** - Confirm proper use of `selection.on()`
3. **Chart rendering** - Validate against D3 chart patterns
4. **Interactions** - Check compliance with D3 interaction APIs

## 🔍 ENFORCEMENT PROCESS

### Before Writing Any D3 Code

1. **Document search completed?** ✅/❌
2. **Official D3 API identified?** ✅/❌  
3. **Best practices reviewed?** ✅/❌
4. **Implementation plan uses official APIs?** ✅/❌

### Code Review Checklist

- [ ] D3 documentation was consulted first
- [ ] Official D3 APIs are used throughout
- [ ] No custom workarounds for existing D3 features
- [ ] Implementation follows D3 patterns
- [ ] Code matches official D3 examples

## 📚 REQUIRED TOOLS

### Context7 Integration

```javascript
// Always use Context7 for D3 documentation
get-library-docs("/d3/d3", {
  topic: "your-specific-topic",
  tokens: 8000
})
```

### Firecrawl Integration  

```javascript
// Use Firecrawl for D3 examples and community patterns
firecrawl_search({
  query: "d3.js your-specific-functionality examples",
  limit: 5,
  scrapeOptions: {
    formats: ["markdown"],
    onlyMainContent: true
  }
})
```

## ⚠️ VIOLATION CONSEQUENCES

Violating this rule results in:

1. **Code rejection** - Implementation must be redone
2. **Documentation requirement** - Must provide D3 documentation proof
3. **Refactoring mandate** - Custom solutions must be replaced with official APIs
4. **Review requirement** - All D3 code must be re-reviewed

## 🎯 SUCCESS CRITERIA

D3.js implementations are successful when:

- ✅ Official D3 documentation was consulted first
- ✅ Official D3 APIs are used exclusively  
- ✅ Implementation follows D3 best practices
- ✅ Code is maintainable and follows D3 patterns
- ✅ No custom workarounds for existing D3 functionality

---

**Remember: D3.js has extensive official documentation and APIs. Always use them first!**
