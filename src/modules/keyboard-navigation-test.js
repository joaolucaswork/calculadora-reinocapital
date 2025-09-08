/**
 * Keyboard Navigation Test Module
 * Simple test utilities for keyboard navigation functionality
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class KeyboardNavigationTest {
    constructor() {
      this.testResults = [];
    }

    runTests() {
      console.log('🧪 Running Keyboard Navigation Tests...');
      
      this.testResults = [];
      
      // Test 1: Check if keyboard navigation system is loaded
      this.testSystemLoaded();
      
      // Test 2: Check if main input exists
      this.testMainInputExists();
      
      // Test 3: Check if step navigation system is available
      this.testStepNavigationSystem();
      
      // Test 4: Simulate Enter key press
      this.testEnterKeySimulation();
      
      this.displayResults();
    }

    testSystemLoaded() {
      const test = {
        name: 'Keyboard Navigation System Loaded',
        passed: false,
        message: ''
      };

      if (window.ReinoKeyboardNavigationSystem) {
        if (window.ReinoKeyboardNavigationSystem.isInitialized) {
          test.passed = true;
          test.message = '✅ System loaded and initialized';
        } else {
          test.message = '⚠️ System loaded but not initialized';
        }
      } else {
        test.message = '❌ System not loaded';
      }

      this.testResults.push(test);
    }

    testMainInputExists() {
      const test = {
        name: 'Main Currency Input Exists',
        passed: false,
        message: ''
      };

      const mainInput = document.querySelector('input[is-main="true"].currency-input');
      if (mainInput) {
        test.passed = true;
        test.message = `✅ Main input found: ${mainInput.id || 'no id'}`;
      } else {
        test.message = '❌ Main input not found';
      }

      this.testResults.push(test);
    }

    testStepNavigationSystem() {
      const test = {
        name: 'Step Navigation System Available',
        passed: false,
        message: ''
      };

      if (window.ReinoStepNavigationProgressSystem) {
        if (window.ReinoStepNavigationProgressSystem.isInitialized) {
          test.passed = true;
          test.message = '✅ Step navigation system available and initialized';
        } else {
          test.message = '⚠️ Step navigation system available but not initialized';
        }
      } else {
        test.message = '❌ Step navigation system not available';
      }

      this.testResults.push(test);
    }

    testEnterKeySimulation() {
      const test = {
        name: 'Enter Key Simulation',
        passed: false,
        message: ''
      };

      try {
        if (window.ReinoKeyboardNavigationSystem && window.ReinoKeyboardNavigationSystem.simulateEnterKey) {
          // Store current step before simulation
          const currentStep = window.ReinoStepNavigationProgressSystem ? 
            window.ReinoStepNavigationProgressSystem.currentStep : null;
          
          // Simulate Enter key
          window.ReinoKeyboardNavigationSystem.simulateEnterKey();
          
          test.passed = true;
          test.message = `✅ Enter key simulation executed (current step: ${currentStep})`;
        } else {
          test.message = '❌ Simulation method not available';
        }
      } catch (error) {
        test.message = `❌ Simulation failed: ${error.message}`;
      }

      this.testResults.push(test);
    }

    displayResults() {
      console.log('\n📊 Keyboard Navigation Test Results:');
      console.log('=====================================');
      
      let passedCount = 0;
      
      this.testResults.forEach((test, index) => {
        console.log(`${index + 1}. ${test.name}`);
        console.log(`   ${test.message}`);
        
        if (test.passed) {
          passedCount++;
        }
        
        console.log('');
      });
      
      console.log(`Summary: ${passedCount}/${this.testResults.length} tests passed`);
      
      if (passedCount === this.testResults.length) {
        console.log('🎉 All tests passed!');
      } else {
        console.log('⚠️ Some tests failed. Check the results above.');
      }
    }

    // Manual test method for developers
    manualTest() {
      console.log('🔧 Manual Test Instructions:');
      console.log('1. Navigate to step 1 (patrimony input section)');
      console.log('2. Click on the main currency input field');
      console.log('3. Enter a value (e.g., 1000000)');
      console.log('4. Press Enter key');
      console.log('5. The calculator should advance to the next step');
      console.log('\nTo run automated tests, call: window.ReinoKeyboardNavigationTest.runTests()');
    }
  }

  // Create global instance
  window.ReinoKeyboardNavigationTest = new KeyboardNavigationTest();

  // Auto-run tests in debug mode
  if (window.location.search.includes('debug=true')) {
    setTimeout(() => {
      if (document.readyState === 'complete') {
        window.ReinoKeyboardNavigationTest.runTests();
      }
    }, 2000); // Wait for all systems to initialize
  }

})();
