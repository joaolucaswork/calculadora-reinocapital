# Keyboard Navigation - Reino Capital Calculator

## Overview

The keyboard navigation module enables users to advance through the calculator steps using the Enter key when focused on the main currency input field. This provides a more fluid user experience for keyboard users.

## Features

- **Enter Key Navigation**: Press Enter while focused on the main currency input to advance to the next step
- **Integration with Existing System**: Uses the same validation and navigation logic as the "Next" button
- **Validation Respect**: Only advances if the current step passes validation
- **Error Handling**: Shows validation errors if step cannot be completed

## Technical Implementation

### Target Element

The keyboard navigation specifically targets:
```html
<input id="currency" data-currency="true" is-main="true" class="currency-input">
```

### Key Attributes

- `is-main="true"` - Identifies the main currency input
- `class="currency-input"` - Currency input styling class
- `data-currency="true"` - Enables currency formatting

### Event Handling

- **Event Type**: `keydown`
- **Target Key**: `Enter` (key code 13)
- **Behavior**: `preventDefault()` to avoid form submission
- **Integration**: Uses `stepNavigationSystem.nextStep()` method

## Usage

### For Users

1. Navigate to the patrimony input section (Step 1)
2. Click on or tab to the main currency input field
3. Enter your patrimony value
4. Press **Enter** to advance to the next step

### For Developers

#### Testing

```javascript
// Run automated tests (in debug mode)
window.ReinoKeyboardNavigationTest.runTests();

// Manual simulation
window.ReinoKeyboardNavigationSystem.simulateEnterKey();

// Check if system is initialized
console.log(window.ReinoKeyboardNavigationSystem.isInitialized);
```

#### Debug Mode

Add `?debug=true` to the URL to enable debug logging:
```
https://reinocapital.webflow.io/taxas-app?debug=true
```

Debug output includes:
- System initialization status
- Keyboard listener attachment
- Enter key press detection
- Navigation success/failure

## Integration Points

### Dependencies

The keyboard navigation module depends on:

1. **Step Navigation System**: `window.ReinoStepNavigationProgressSystem`
2. **Main Currency Input**: `input[is-main="true"].currency-input`
3. **Validation System**: Uses existing step validation logic

### Initialization Order

1. Document ready or immediate if already loaded
2. Wait for `ReinoStepNavigationProgressSystem` to be initialized
3. Attach keyboard listeners to main input
4. Ready for user interaction

### Event Flow

```
User presses Enter
    ↓
handleKeyDown() called
    ↓
preventDefault() to stop form submission
    ↓
triggerNextStep() called
    ↓
Check stepNavigationSystem.canProceedToNext()
    ↓
If valid: stepNavigationSystem.nextStep()
If invalid: stepNavigationSystem.showValidationError()
```

## Browser Compatibility

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **Event API**: Uses standard `KeyboardEvent` API
- **Fallback**: Graceful degradation if system not available

## Error Handling

### Common Issues

1. **Main input not found**: Warning logged, no keyboard navigation
2. **Step navigation system unavailable**: Warning logged, retries with delay
3. **Validation failure**: Shows existing validation error messages

### Debug Information

Enable debug mode to see:
- System initialization status
- Event listener attachment
- Key press detection
- Navigation attempts and results

## Performance Considerations

- **Lightweight**: Minimal overhead, only listens to specific input
- **Event Delegation**: Direct event listener on target element
- **Memory Management**: Proper cleanup in destroy() method
- **Initialization Delay**: 500ms delay to ensure other systems are loaded

## Future Enhancements

Potential improvements:
- Support for other navigation keys (Tab, Arrow keys)
- Keyboard shortcuts for specific sections
- Enhanced accessibility features
- Multi-input keyboard navigation

## Testing

### Automated Tests

The test module (`keyboard-navigation-test.js`) provides:

1. **System Load Test**: Verifies module is loaded and initialized
2. **Input Existence Test**: Confirms main input element exists
3. **Navigation System Test**: Checks step navigation availability
4. **Simulation Test**: Tests Enter key simulation functionality

### Manual Testing

1. Load the calculator page
2. Navigate to step 1 (patrimony input)
3. Enter a value in the currency input
4. Press Enter
5. Verify navigation to step 2 (asset selection)

### Test Commands

```javascript
// Run all tests
window.ReinoKeyboardNavigationTest.runTests();

// Get manual test instructions
window.ReinoKeyboardNavigationTest.manualTest();

// Simulate Enter key press
window.ReinoKeyboardNavigationSystem.simulateEnterKey();
```

## Troubleshooting

### Navigation Not Working

1. Check if main input exists: `document.querySelector('input[is-main="true"].currency-input')`
2. Verify system initialization: `window.ReinoKeyboardNavigationSystem.isInitialized`
3. Check step navigation system: `window.ReinoStepNavigationProgressSystem.isInitialized`
4. Enable debug mode for detailed logging

### Validation Errors

If Enter key shows validation errors:
1. Ensure patrimony value is entered
2. Check if value meets minimum requirements
3. Verify step validation logic is working
4. Test with "Next" button to compare behavior
