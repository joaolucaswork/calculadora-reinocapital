# Calendly Minimalist Widget

A custom, space-efficient Calendly implementation designed for small spaces and mobile-first experiences.

## Overview

This module replaces the bulky default Calendly widget with a streamlined, minimalist implementation that:

- Takes up minimal space with a compact trigger button
- Expands to show booking interface only when needed
- Optimized for mobile and desktop usage
- Follows the project's IIFE pattern for Webflow compatibility
- Provides extensive customization options

## Features

### ✅ Minimalist Design
- Compact trigger button (replaces large iframe)
- Expandable widget interface
- Clean, modern styling
- Mobile-optimized layout

### ✅ Space Efficient
- Default height: 400px (desktop) / 350px (mobile)
- Minimum width: 280px
- Collapsible interface
- Smart responsive behavior

### ✅ Customizable
- Theme colors (primary, background, text)
- Custom trigger button text
- Hide event details and GDPR banner
- Prefill user data from URL parameters

### ✅ Event Handling
- Custom events for widget open/close
- Booking completion events
- Automatic height adjustment
- Responsive resize handling

## Basic Usage

### HTML Setup

```html
<!-- Container for the widget -->
<div id="calendly-widget-container"></div>

<!-- The widget will automatically initialize -->
<script>
  // Widget is available globally as window.ReinoCalendlyWidget
  document.addEventListener('DOMContentLoaded', function() {
    // Attach to specific container
    window.ReinoCalendlyWidget.attachTo('#calendly-widget-container');
  });
</script>
```

### Custom Configuration

```javascript
// Create custom instance with options
const customWidget = new window.CalendlyMinimalistWidget({
  calendlyUrl: 'https://calendly.com/your-link/30min',
  hideEventDetails: true,
  hideGdprBanner: true,
  compactHeight: '350px',
  mobileHeight: '300px',
  theme: {
    primaryColor: '#006BFF',
    backgroundColor: '#ffffff',
    textColor: '#333333'
  }
});

// Initialize and attach
customWidget.init().then(() => {
  customWidget.attachTo('#my-container');
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `calendlyUrl` | string | `'https://calendly.com/tecnologia-reinocapital/30min'` | Your Calendly booking URL |
| `hideEventDetails` | boolean | `true` | Hide event details in widget |
| `hideGdprBanner` | boolean | `true` | Hide GDPR cookie banner |
| `minimalistMode` | boolean | `true` | Enable minimalist styling |
| `compactHeight` | string | `'400px'` | Widget height on desktop |
| `mobileHeight` | string | `'350px'` | Widget height on mobile |
| `theme.primaryColor` | string | `'#006BFF'` | Primary button color |
| `theme.backgroundColor` | string | `'#ffffff'` | Widget background |
| `theme.textColor` | string | `'#333333'` | Text color |

## Methods

### `init()`
Initializes the widget and loads Calendly dependencies.

```javascript
await widget.init();
```

### `attachTo(element)`
Attaches the widget to a DOM element.

```javascript
widget.attachTo('#container');
// or
widget.attachTo(document.getElementById('container'));
```

### `showWidget()`
Programmatically show the booking interface.

```javascript
widget.showWidget();
```

### `hideWidget()`
Programmatically hide the booking interface.

```javascript
widget.hideWidget();
```

### `toggleWidget()`
Toggle widget visibility.

```javascript
widget.toggleWidget();
```

### `destroy()`
Clean up and remove the widget.

```javascript
widget.destroy();
```

## Events

The widget dispatches custom events that you can listen for:

### `calendlyWidgetOpened`
Fired when the widget is opened.

```javascript
document.addEventListener('calendlyWidgetOpened', function() {
  console.log('Calendly widget opened');
});
```

### `calendlyWidgetClosed`
Fired when the widget is closed.

```javascript
document.addEventListener('calendlyWidgetClosed', function() {
  console.log('Calendly widget closed');
});
```

### `calendlyEventScheduled`
Fired when a meeting is successfully scheduled.

```javascript
document.addEventListener('calendlyEventScheduled', function(event) {
  console.log('Meeting scheduled:', event.detail);
  // Handle successful booking
});
```

## URL Parameters

The widget automatically reads URL parameters for prefilling:

- `?name=John%20Doe` - Prefills the name field
- `?email=john@example.com` - Prefills the email field

Example: `https://yoursite.com/page?name=John%20Doe&email=john@example.com`

## Responsive Behavior

The widget automatically adapts to different screen sizes:

- **Desktop (>768px)**: Full height and features
- **Mobile (≤768px)**: Compact height and optimized layout
- **Auto-resize**: Adjusts when window is resized

## Styling

The widget includes built-in responsive CSS and animations. You can override styles:

```css
/* Custom trigger button styling */
.calendly-minimalist-trigger {
  background: your-color !important;
  border-radius: your-radius !important;
}

/* Custom container styling */
.calendly-minimalist-container {
  box-shadow: your-shadow !important;
  border: your-border !important;
}
```

## Integration Examples

### With Existing Forms

```javascript
// Trigger widget after form submission
document.getElementById('contact-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  // Get form data
  const formData = new FormData(this);
  const name = formData.get('name');
  const email = formData.get('email');
  
  // Update URL with prefill data
  const url = new URL(window.location);
  url.searchParams.set('name', name);
  url.searchParams.set('email', email);
  window.history.replaceState({}, '', url);
  
  // Show widget
  window.ReinoCalendlyWidget.showWidget();
});
```

### With Analytics

```javascript
// Track widget interactions
document.addEventListener('calendlyWidgetOpened', function() {
  // Google Analytics
  gtag('event', 'calendly_widget_opened', {
    event_category: 'engagement',
    event_label: 'calendly'
  });
});

document.addEventListener('calendlyEventScheduled', function(event) {
  // Track successful bookings
  gtag('event', 'calendly_booking_completed', {
    event_category: 'conversion',
    event_label: 'calendly',
    value: 1
  });
});
```

## Troubleshooting

### Widget Not Showing
1. Check that the container element exists
2. Verify Calendly URL is correct
3. Check browser console for errors

### Styling Issues
1. Ensure no CSS conflicts with existing styles
2. Check responsive breakpoints
3. Verify theme colors are valid

### Mobile Issues
1. Test on actual devices, not just browser resize
2. Check viewport meta tag is present
3. Verify touch interactions work properly

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Lazy loads Calendly script only when needed
- Minimal DOM footprint when collapsed
- Optimized animations and transitions
- Mobile-first responsive design

## Security

- Uses official Calendly widget.js script
- No external dependencies beyond Calendly
- Follows GDPR compliance options
- Secure iframe implementation
