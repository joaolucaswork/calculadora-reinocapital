# Donut Tutorial Checkboxes - Integration Guide

## Overview

The Donut Tutorial Checkboxes system provides interactive tutorial guidance for users learning to interact with the donut chart in section 5 (step 4) of the calculator.

## HTML Structure Required

Add these elements to section 5 (data-step="4") near the donut chart:

```html
<div class="tutorial-container">
  <div class="item-info-interativa" info="mouse-hover">
    <div class="tutorial-text">Passe o mouse sobre o gráfico para ver detalhes</div>
  </div>
  
  <div class="item-info-interativa" info="click">
    <div class="tutorial-text">Clique em uma fatia para fixar o tooltip</div>
  </div>
</div>
```

## Placement Recommendations

### Option 1: Above the Chart
Place the tutorial container above the donut chart for immediate visibility:

```html
<div class="resultado-grafico-wrapper">
  <!-- Tutorial Container Here -->
  <div class="tutorial-container">
    <div class="item-info-interativa" info="mouse-hover">
      <div class="tutorial-text">Passe o mouse sobre o gráfico</div>
    </div>
    <div class="item-info-interativa" info="click">
      <div class="tutorial-text">Clique para fixar o tooltip</div>
    </div>
  </div>
  
  <!-- Existing chart content -->
  <div class="resultados-float-wrapper">
    <!-- ... existing content ... -->
  </div>
</div>
```

### Option 2: Beside the Chart
Place the tutorial container beside the chart legend:

```html
<div class="caracteristicas-tradicional">
  <!-- Tutorial Container Here -->
  <div class="tutorial-container">
    <div class="item-info-interativa" info="mouse-hover">
      <div class="tutorial-text">Hover no gráfico</div>
    </div>
    <div class="item-info-interativa" info="click">
      <div class="tutorial-text">Clique para fixar</div>
    </div>
  </div>
  
  <!-- Existing legend -->
  <div class="lista-resultado">
    <!-- ... existing legend items ... -->
  </div>
</div>
```

## Behavior

### Checkbox States

1. **Initial State**: Both checkboxes are unchecked with gray background
2. **Hover Completed**: First checkbox turns green with checkmark when user hovers over any chart slice
3. **Click Completed**: Second checkbox turns green with checkmark when user clicks to pin a tooltip
4. **Tutorial Complete**: Both elements slide out to the right with premium animation

### Event Integration

The system automatically listens for:

- `donutTutorialHover` - Dispatched when user hovers over chart slices
- `donutTutorialClick` - Dispatched when user clicks to pin tooltips
- `donutCategoryHover` - Fallback for existing hover events
- `simple-hover-tooltip-pinned` - Fallback for tooltip pinning

### Auto-Detection

The tutorial automatically:

- Shows when user navigates to section 5 (data-step="4")
- Hides when user leaves section 5
- Resets when user returns to section 5
- Creates fallback structure if HTML elements are missing

## Customization

### Text Content

Modify the tutorial text by changing the content in `.tutorial-text` elements:

```html
<div class="tutorial-text">Your custom instruction text</div>
```

### Styling

The system uses CSS custom properties for easy theming:

```css
.tutorial-container {
  --tutorial-bg: rgba(255, 255, 255, 0.95);
  --tutorial-border: #e5e7eb;
  --tutorial-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.checkbox-box {
  --checkbox-size: 22px;
  --checkbox-border: #d1d5db;
  --checkbox-bg: #ffffff;
  --checkbox-completed: #10b981;
}
```

### Animation Timing

Adjust animation timing in the JavaScript module:

```javascript
// In triggerCompletionAnimation method
animate(element, {
  x: [0, 100],
  opacity: [1, 0],
  scale: [1, 0.9]
}, {
  duration: 0.8,        // Adjust completion animation duration
  delay: index * 0.1,   // Adjust stagger delay
  ease: [0.25, 0.46, 0.45, 0.94]  // Adjust easing curve
});
```

## API Methods

### Global Instance

Access the tutorial system via `window.ReinoDonutTutorialCheckboxes`:

```javascript
// Reset tutorial state
window.ReinoDonutTutorialCheckboxes.reset();

// Force show tutorial
window.ReinoDonutTutorialCheckboxes.showTutorial();

// Force hide tutorial
window.ReinoDonutTutorialCheckboxes.hideTutorial();

// Check completion status
const isHoverComplete = window.ReinoDonutTutorialCheckboxes.checkboxStates.hover;
const isClickComplete = window.ReinoDonutTutorialCheckboxes.checkboxStates.click;
```

### Manual Completion

Trigger completion manually if needed:

```javascript
// Mark hover as completed
window.ReinoDonutTutorialCheckboxes.markHoverCompleted();

// Mark click as completed
window.ReinoDonutTutorialCheckboxes.markClickCompleted();
```

## Accessibility

The tutorial system includes:

- High contrast mode support
- Reduced motion preferences
- Focus management
- Screen reader friendly markup
- Keyboard navigation support

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- MotionDev library for animations
- D3.js for chart integration
- ES6+ JavaScript features

## Troubleshooting

### Tutorial Not Showing

1. Check if section 5 is active: `document.querySelector('[data-step="4"]')`
2. Verify MotionDev library is loaded: `window.Motion`
3. Check console for initialization errors

### Checkboxes Not Completing

1. Verify donut chart events are firing: Check browser dev tools for custom events
2. Check if D3 chart system is initialized: `window.ReinoD3DonutChartSection5`
3. Ensure hover module is working: Test chart hover functionality

### Animation Issues

1. Check MotionDev library version compatibility
2. Verify CSS transitions are not disabled
3. Test with reduced motion preferences disabled

## Integration Checklist

- [ ] Add HTML structure to section 5
- [ ] Include CSS file in build system
- [ ] Include JavaScript module in build system
- [ ] Test hover detection
- [ ] Test click detection
- [ ] Test completion animation
- [ ] Test step navigation
- [ ] Test responsive behavior
- [ ] Test accessibility features
