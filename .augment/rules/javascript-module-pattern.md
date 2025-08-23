---
type: "always_apply"
---

# JAVASCRIPT MODULE PATTERN - STANDALONE IIFE REQUIREMENT

## 🚨 CRITICAL RULE: STANDALONE JAVASCRIPT MODULES ONLY

All JavaScript modules in this project **MUST** be written as standalone code using the IIFE (Immediately Invoked Function Expression) pattern, without any imports or exports.

## 📋 MANDATORY PATTERN

### ✅ CORRECT PATTERN

```javascript
/**
 * Module Description
 * Versão sem imports/exports para uso direto no Webflow
 */

(function() {
  'use strict';

  class MyModuleClass {
    constructor() {
      // Constructor logic
    }

    myMethod() {
      // Method logic
    }
  }

  // Make class globally available
  window.MyModuleClass = MyModuleClass;

  // Optional: Create global instance
  window.myModuleInstance = new MyModuleClass();

  // Optional: Auto-initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.myModuleInstance.init();
    });
  } else {
    window.myModuleInstance.init();
  }

})();
```

### ❌ FORBIDDEN PATTERNS

```javascript
// ❌ NO ES6 MODULES
import { something } from './module.js';
export class MyClass {}
export default MyClass;

// ❌ NO COMMONJS
const module = require('./module');
module.exports = MyClass;

// ❌ NO AMD
define(['dependency'], function(dep) {
  return MyClass;
});

// ❌ NO BARE CLASSES WITHOUT IIFE
class MyClass {
  // This will cause issues
}
```

## 🎯 IMPLEMENTATION REQUIREMENTS

### 1. **IIFE Wrapper**

- All code must be wrapped in `(function() { 'use strict'; ... })()`
- Use strict mode for better error handling

### 2. **Global Availability**

- Classes must be attached to `window` object: `window.ClassName = ClassName`
- Instances can be created globally: `window.instanceName = new ClassName()`

### 3. **No Import/Export Statements**

- Never use `import`, `export`, `require`, or `module.exports`
- All dependencies must be available globally (e.g., `window.d3`, `window.jQuery`)

### 4. **Webflow Compatibility**

- Code must work as standalone script tags in Webflow
- No build process or module bundlers required

## 📚 REAL EXAMPLES FROM PROJECT

### Example 1: Simple Hover Module

```javascript
/**
 * Simple Hover Module
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class SimpleHoverModule {
    constructor(options = {}) {
      this.options = { ...defaultOptions, ...options };
      this.state = { isVisible: false };
    }

    attachHoverEvents(selection, options) {
      // Implementation
    }

    destroy() {
      // Cleanup
    }
  }

  // Make globally available
  window.SimpleHoverModule = SimpleHoverModule;

})();
```

### Example 2: Chart System with Auto-initialization

```javascript
/**
 * D3.js Chart System
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class D3ChartSystem {
    constructor() {
      this.isInitialized = false;
      this.charts = new Map();
    }

    async init() {
      if (this.isInitialized) return;

      try {
        await this.loadDependencies();
        this.setupEventListeners();
        this.isInitialized = true;
      } catch (error) {
        console.error('Chart system initialization failed:', error);
      }
    }

    async loadDependencies() {
      // Wait for D3.js to be available
      while (!window.d3) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // Create global instance
  window.ReinoD3ChartSystem = new D3ChartSystem();

  // Auto-initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoD3ChartSystem.init();
    });
  } else {
    window.ReinoD3ChartSystem.init();
  }

})();
```

## 🔧 DEPENDENCY MANAGEMENT

### Global Dependencies

All external libraries must be loaded globally before your modules:

```html
<!-- Load dependencies first -->
<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
<script src="https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js"></script>

<!-- Then load your modules -->
<script src="src/modules/simple-hover-module.js"></script>
<script src="src/modules/chart-system.js"></script>
```

### Accessing Global Dependencies

```javascript
(function() {
  'use strict';

  class MyClass {
    init() {
      // Access global D3
      if (!window.d3) {
        throw new Error('D3.js not loaded');
      }

      // Use D3
      const svg = window.d3.select('body').append('svg');
    }
  }

  window.MyClass = MyClass;
})();
```

## 🚀 BENEFITS OF THIS PATTERN

1. **Webflow Compatible**: Works directly in Webflow without build process
2. **No Build Tools**: No webpack, rollup, or other bundlers needed
3. **Simple Debugging**: Easy to debug in browser dev tools
4. **Global Access**: Classes available everywhere in the application
5. **Namespace Control**: IIFE prevents global namespace pollution
6. **Progressive Loading**: Modules can check for dependencies and wait

## ⚠️ COMMON MISTAKES TO AVOID

1. **Forgetting IIFE Wrapper**

   ```javascript
   // ❌ Wrong
   class MyClass {}
   window.MyClass = MyClass;
   ```

2. **Using Import/Export**

   ```javascript
   // ❌ Wrong
   import { d3 } from 'd3';
   export class MyClass {}
   ```

3. **Not Making Classes Global**

   ```javascript
   // ❌ Wrong - class not accessible outside IIFE
   (function() {
     class MyClass {}
     // Missing: window.MyClass = MyClass;
   })();
   ```

4. **Assuming Dependencies Are Loaded**

   ```javascript
   // ❌ Wrong - should check if d3 exists
   (function() {
     const svg = d3.select('body'); // May fail
   })();
   ```

## 📝 CHECKLIST FOR NEW MODULES

- [ ] Code wrapped in IIFE: `(function() { 'use strict'; ... })()`
- [ ] No import/export statements
- [ ] Class attached to window: `window.ClassName = ClassName`
- [ ] Dependencies checked before use
- [ ] Auto-initialization if needed
- [ ] Comment indicating "Versão sem imports/exports para uso direto no Webflow"

## 🎯 ENFORCEMENT

This pattern is **MANDATORY** for all JavaScript modules in this project. Any code that doesn't follow this pattern will cause runtime errors and break the Webflow integration.

**Remember**: This project prioritizes Webflow compatibility over modern JavaScript module patterns.
