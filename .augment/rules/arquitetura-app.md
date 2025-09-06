---
type: "always_apply"
---

# HTML Structure Analysis - Reino Capital Calculator

## Overview

The Reino Capital calculator is a multi-step form application with 6 main sections (data-step 0-5) that guides users through a financial assessment process. Each section has specific functionality and integrates with JavaScript modules for interactivity.

## Section Breakdown

### Section 0: Introduction (`data-step="0"`)

**Class:** `_0-home-section-calc-intro step-section`
**Purpose:** Landing page with hero content and call-to-action

**Key Elements:**

- `.interactive-cards-wrapper` - Container for animated cards
- `button[element-function="next"]` - Primary CTA button
- `.button-hero.variation` - Styled action button with arrow effect

**JavaScript Integration:**

- `element-function="next"` - Handled by simple-button-system.js
- Animation targets for motion-animation.js
- Lottie animation containers

### Section 1: Patrimony Input (`data-step="1"`)

**Class:** `_1-section-calc-money step-section`
**Purpose:** User inputs their total investment amount

**Key Elements:**

```html
<input id="currency" data-currency="true" is-main="true" class="currency-input">
<button currency-control="decrease" class="button-decrease">
<button currency-control="increase" class="button-increase">
<button element-function="next" class="button-hero variation money">
```

**JavaScript Integration:**

- `data-currency="true"` - Currency formatting module
- `currency-control` attributes - Value adjustment controls
- `data-animation-target="patrimonio"` - Animation system

### Section 2: Asset Selection (`data-step="2"`)

**Class:** `_2-section-calc-ativos step-section`
**Purpose:** User selects investment categories and products

**Key Elements:**

- Dropdown menus with `w-dropdown` classes
- Asset items with `ativo-product` and `ativo-category` attributes
- Categories: Renda Fixa, Fundo de Investimento, Renda Variável, Internacional, COE, Previdência, Outros

**Asset Categories & Products:**

```html
<!-- Renda Fixa -->
<a ativo-product="CDB" ativo-category="Renda Fixa">CDB, LCI, LCA</a>
<a ativo-product="CRI" ativo-category="Renda Fixa">CRI, CRA, DEBÊNTURE</a>
<a ativo-product="Títulos Públicos" ativo-category="Renda Fixa">Títulos Públicos</a>

<!-- Fundo de Investimento -->
<a ativo-product="Ações" ativo-category="Fundo de Investimento">Ações (FIA)</a>
<a ativo-product="Liquidez" ativo-category="Fundo de Investimento">Liquidez (DI/D0/D1)</a>
<!-- ... more products -->
```

**JavaScript Integration:**

- Asset selection system tracks `ativo-product` and `ativo-category`
- Dropdown interaction handlers
- Product state management

### Section 3: Portfolio Allocation (`data-step="3"`)

**Class:** `_3-section-patrimonio-alocation step-section`
**Purpose:** User allocates percentage of patrimony to selected assets

**Key Elements:**

- `.patrimonio_interactive_content-wrapper` - Grid container for allocation items
- `.patrimonio_interactive_item` - Individual asset allocation controls
- Range sliders for percentage allocation
- Currency inputs for absolute values

**Range Slider Structure:**

```html
<div class="patrimonio_interactive_item" ativo-product="CDB" ativo-category="Renda Fixa">
  <div class="active-produto-item">
    <input data-currency="true" input-settings="receive" class="currency-input individual">
    <range-slider min="0" max="1" value="0" step="0.01" class="slider"></range-slider>
    <p class="porcentagem-calculadora">0%</p>
  </div>
</div>
```

**Category Summary Panel:**

```html
<div class="lista-produtos-selecionados">
  <div ativo-category="Renda Fixa" class="categoria-porcentagem">
    <a ativo-category="Renda Fixa" class="categoria-ativo v2">Renda Fixa</a>
    <div class="valor-categoria">R$ 0,00</div>
    <div class="porcentagem-categoria">0%</div>
  </div>
</div>
```

**JavaScript Integration:**

- Range slider synchronization with currency inputs
- Real-time percentage calculations
- Category color coding via CSS
- Validation for 100% allocation requirement

### Section 4: Results Chart (`data-step="4"`)

**Class:** `_4-section-resultado step-section`
**Purpose:** Displays commission calculations and donut chart

**Key Elements:**

- `.resultado-grafico-wrapper` - Chart container
- `.lista-resultado` - Category legend with hover interactions
- Commission indicators and calculations

**Chart Legend:**

```html
<div class="lista-resultado">
  <a ativo-category="Renda Fixa" class="lista-resultado-item">
    <div class="color-ball renda-fixa"></div>
    Renda Fixa
  </a>
  <!-- ... other categories -->
</div>
```

**JavaScript Integration:**

- D3.js donut chart rendering
- Hover effects on legend items
- Commission calculation display
- Chart data binding to user selections

### Section 5: Final Report (`data-step="5"`)

**Class:** `_5-section-resultado step-section`
**Purpose:** Comprehensive report with rotation index and final calculations

**Key Elements:**

- User name display with `nome-definido="typebot"`
- Rotation index slider (`range-slider.indice-giro`)
- Detailed asset breakdown
- Final commission calculations

**Rotation Index Slider:**

```html
<range-slider min="1" max="4" value="2" step="1" class="indice-giro" id="indice-giro">
</range-slider>
```

**JavaScript Integration:**

- Rotation index calculations
- Tooltip system for explanations
- Final report generation
- Data export functionality

## CSS Class System

### State Management Classes

- `.step-section` - Base class for all sections
- `.active-produto-item` / `.disabled-produto-item` - Product state toggles
- `.categoria-ativo` - Category styling with color indicators

### Color Coding System

Categories have consistent color schemes across all components:

- **Renda Fixa:** #a2883b
- **Fundo de Investimento:** #e3ad0c
- **Renda Variável:** #5d4e2a
- **Internacional:** #bdaa6f
- **COE:** #d17d00
- **Previdência:** #8c5e00
- **Outros:** #4f4f4f

### Responsive Grid System

- Desktop (991px+): 3-column grid
- Tablet (768-990px): 2-column grid  
- Mobile (≤767px): 1-column grid

## Data Attributes Reference

### Core Navigation

- `data-step` - Section identifier (0-5)
- `element-function` - Button action type (next, send)

### Asset System

- `ativo-category` - Investment category
- `ativo-product` - Specific product within category

### Input System  

- `data-currency` - Currency formatting flag
- `currency-control` - Value adjustment (increase/decrease)
- `input-settings` - Input behavior configuration

### Animation System

- `data-animation-target` - Animation target identifier
- Animation containers for Lottie and GSAP

## JavaScript Module Integration Points

### Button System

- `element-function="next"` buttons
- Step navigation controls
- Form submission handling

### Currency System

- `data-currency="true"` inputs
- Currency formatting and validation
- Value synchronization between inputs and sliders

### Asset Management

- Product selection tracking
- Category aggregation
- State persistence across steps

### Chart System

- D3.js integration for donut chart
- Data binding from user selections
- Interactive legend with hover effects

### Animation System

- Lottie animations for step 0
- GSAP transitions between sections
- Range slider animations

This structure provides a comprehensive foundation for understanding how the HTML elements connect to the JavaScript functionality and how data flows through the application.
