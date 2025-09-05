# Copilot Instructions for AI Coding Agents

## Project Overview

This is a financial calculator web application for Reino Capital, built as a hybrid Webflow integration with modular JavaScript components. The app handles complex financial calculations, data visualizations, and external service integrations while maintaining compatibility with Webflow's export system.

## Architecture & Major Components

- **src/**: Main source code organized by feature and responsibility.
  - `modules/`: Standalone IIFE modules for UI/data logic (charts, currency controls, event coordination).
  - `button-system/`: Coordinated button system with navigation, form submission, and external integrations.
  - `config/`: External service configurations (Supabase, Salesforce) using IIFE pattern.
  - `css/`: Custom styles for enhanced UI components.
- **static_files/**: **STRICTLY READ-ONLY** - Webflow-exported HTML/CSS/JS. Never modify these files.
- **bin/**: esbuild configuration with live reload (`build.js`) and development server.
- **docs/**: Technical documentation, debugging guides, and implementation details.
- **tests/**: Playwright test specifications.

## Developer Workflows

- **Development**: Run `pnpm dev` - builds with esbuild, serves at `localhost:3000` with live reload enabled.
- **Production**: Run `pnpm build` - outputs minified bundles to `dist/` folder.
- **Entry Points**: Modify `ENTRY_POINTS` array in `bin/build.js` to build multiple files or add CSS entries.
- **Live Reload**: Automatic page refresh on file changes (configurable in `bin/build.js`).
- **Testing**: `pnpm test` runs Playwright tests with dev server automatically started in background.
- **Webflow Integration**: Development files served from localhost can be imported directly in Webflow projects.

## Critical Patterns & Conventions

### Module Architecture

- **IIFE Pattern**: All modules use `(function() { 'use strict'; })()` wrapper for Webflow compatibility.
- **No Imports/Exports**: Modules attach to `window` object (e.g., `window.ReinoEventCoordinator`).
- **Event Coordination**: Use `EventCoordinator` class to prevent memory leaks and listener conflicts.
- **Main Input**: Core input element identified by `[is-main="true"]` selector across modules.

### Webflow Integration Model

- **Static Files**: `static_files/` contains exported Webflow assets - **NEVER EDIT THESE**.
- **Development Workflow**: Make changes in `src/`, test via localhost:3000, then reference in Webflow.
- **Hybrid Architecture**: Static HTML/CSS from Webflow + dynamic JavaScript from this codebase.

### Component Organization

- **Feature-Based**: Group related functionality in `src/modules/` (e.g., `currency-control.js`, `event-coordinator.js`).
- **System Coordination**: Button system uses coordinator pattern to manage navigation, forms, and integrations.
- **Initialization**: Most modules check `document.readyState` and handle both loaded and loading states.

## Integration Points

- **Supabase**: Database integration in `src/config/supabase.js` - handles calculator submissions and data persistence.
- **Salesforce**: CRM integration in `src/config/salesforce.js` - manages lead data and customer information.
- **Typebot**: Chat/form workflow integration - referenced in docs and button system coordination.
- **D3.js**: Data visualization modules (`d3-donut-chart-section5.js`, `d3-pie-chart-webflow.js`) for financial charts.
- **Webflow**: Static assets and HTML structure exported from Webflow platform.

## Examples

### Adding a New Module

```javascript
// src/modules/new-feature.js
(function () {
  'use strict';

  class NewFeatureSystem {
    constructor() {
      this.isInitialized = false;
    }

    init() {
      if (this.isInitialized) return;
      // Implementation here
      this.isInitialized = true;
    }
  }

  // Attach to window for global access
  window.ReinoNewFeature = new NewFeatureSystem();
  window.ReinoNewFeature.init();
})();
```

### Integrating with Event Coordinator

```javascript
// Register with centralized event system
if (window.ReinoEventCoordinator) {
  window.ReinoEventCoordinator.subscribe('input-change', (data) => {
    // Handle input changes
  });
}
```

## Key Files

- `src/index.ts`: Main entry point that imports all modules for bundling.
- `bin/build.js`: esbuild configuration with entry points and development server.
- `src/modules/event-coordinator.js`: Centralized event management system.
- `src/config/`: External service configurations (Supabase, Salesforce).
- `static_files/`: Webflow exports (read-only).
- `docs/`: Implementation guides and debugging documentation.

---

For questions or unclear conventions, review `README.md` or ask for clarification. Please suggest improvements if you find missing or outdated instructions.
