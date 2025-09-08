# Category Commission Display - Integration Guide

## Overview

The Category Commission Display module provides dynamic value display and conditional visibility for category-specific commission calculations in the Reino Capital calculator. It integrates seamlessly with existing calculation systems and follows the event-driven data capture pattern.

## HTML Structure Required

Add this HTML structure to your results section where you want the category commission values to be displayed:

```html
<div class="valores-categorias-grafico">
  <div ativo-category="Renda Fixa" class="valores-categoria-item">
    <div class="nome-categoria-item">Renda Fixa: </div>
    <div class="valor-categoria-preco">0,00</div>
  </div>
  <div ativo-category="Fundo de Investimento" class="valores-categoria-item">
    <div class="nome-categoria-item">Fundo de Investimento</div>
    <div class="valor-categoria-preco">0,00</div>
  </div>
  <div ativo-category="Renda Variável" class="valores-categoria-item">
    <div class="nome-categoria-item">Renda Variável</div>
    <div class="valor-categoria-preco">0,00</div>
  </div>
  <div ativo-category="Internacional" class="valores-categoria-item">
    <div class="nome-categoria-item">Internacional</div>
    <div class="valor-categoria-preco">0,00</div>
  </div>
  <div ativo-category="COE" class="valores-categoria-item">
    <div class="nome-categoria-item">COE</div>
    <div class="valor-categoria-preco">0,00</div>
  </div>
  <div ativo-category="Previdência" class="valores-categoria-item">
    <div class="nome-categoria-item">Previdência</div>
    <div class="valor-categoria-preco">0,00</div>
  </div>
  <div ativo-category="Outro" class="valores-categoria-item last">
    <div class="nome-categoria-item">Outro</div>
    <div class="valor-categoria-preco">0,00</div>
  </div>
</div>
```

## Key Features

### 1. Dynamic Value Display

- Updates `.valor-categoria-preco` elements with calculated commission values
- Values match exactly with donut chart center totals
- Real-time currency formatting in Brazilian Real

### 2. Conditional Visibility

- Only shows categories with active products (allocations > 0)
- Automatically hides categories with zero allocation
- Smooth show/hide transitions

### 3. Real-time Updates

- Responds to allocation changes in patrimony section
- Updates when products are added/removed
- Synchronizes with commission recalculations

### 4. Data Synchronization

- Leverages existing `calcularCustoProduto` function
- Integrates with `totalComissaoChanged` events
- Uses `allocationChanged` and `assetSelectionChanged` events

## Event Integration

The module listens to these existing events:

```javascript
// Allocation changes
document.addEventListener('allocationChanged', (e) => {
  // Updates commission calculations for changed category
});

// Total commission updates
document.addEventListener('totalComissaoChanged', (e) => {
  // Recalculates all category totals
});

// Asset selection changes
document.addEventListener('assetSelectionChanged', (e) => {
  // Updates visible categories based on selections
});

// Comparative results updates
document.addEventListener('resultadoComparativoUpdated', (e) => {
  // Uses detailed commission data from calculations
});
```

## CSS Classes and Styling

### Core Classes

- `.valores-categorias-grafico` - Main container
- `.valores-categoria-item` - Individual category item
- `.nome-categoria-item` - Category name
- `.valor-categoria-preco` - Commission value display

### Responsive Design

- Basic responsive behavior
- Clean, minimal styling

## API Reference

### Global Instance

```javascript
// Access the global instance
window.categoryCommissionDisplayInstance

// Force update calculations
window.categoryCommissionDisplayInstance.forceUpdate();

// Get current category commissions
const commissions = window.categoryCommissionDisplayInstance.getCategoryCommissions();

// Get total commission across all categories
const total = window.categoryCommissionDisplayInstance.getTotalCommission();

// Reset all values
window.categoryCommissionDisplayInstance.reset();
```

### Configuration Options

```javascript
const config = {
  enableLogging: false,           // Enable debug logging
  updateDelay: 50,               // Delay between updates (ms)
  containerSelector: '.valores-categorias-grafico',
  itemSelector: '.valores-categoria-item',
  priceSelector: '.valor-categoria-preco',
  nameSelector: '.nome-categoria-item'
};
```

## Integration Steps

### 1. Add HTML Structure

Place the HTML structure in your results section (typically in section 4 or 5).

### 2. Verify Dependencies

Ensure these modules are loaded before the category commission display:

- `currency-formatting.js`
- `patrimony-sync.js`
- `resultado-sync.js`
- `taxas-tradicional.js`

### 3. Test Event Flow

1. Select assets in section 2
2. Allocate patrimony in section 3
3. Navigate to results section
4. Verify category values appear and update correctly

### 4. Customize Styling

Modify `category-commission-display.css` to match your design requirements.

## Troubleshooting

### Values Not Updating

- Check if `calcularCustoProduto` function is available globally
- Verify event listeners are properly attached
- Enable logging: `window.categoryCommissionDisplayInstance.config.enableLogging = true`

### Categories Not Showing

- Ensure `ativo-category` attributes match exactly
- Check if assets are properly selected in section 2
- Verify allocation values are greater than 0

### Styling Issues

- Check CSS import order in `index.ts`
- Verify category color mappings
- Test responsive behavior on different screen sizes

## Performance Considerations

- Updates are debounced with configurable delay
- Element caching reduces DOM queries
- Event-driven updates prevent unnecessary recalculations
- Efficient show/hide logic minimizes layout thrashing

## Browser Compatibility

- Modern browsers (ES6+ support required)
- Mobile Safari and Chrome
- Desktop Firefox, Chrome, Safari, Edge
- Graceful degradation for older browsers

## Future Enhancements

- Animation options for value changes
- Tooltip integration for detailed breakdowns
- Export functionality for category data
- Integration with chart hover effects
