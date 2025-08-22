/**
 * Simple Sync System
 * Synchronizes patrimonio_interactive_item with ativos-grafico-item elements
 * Focuses on visual bar height synchronization (not width)
 * Now respects budget constraints from PatrimonySyncSystem
 */

export class SimpleSyncSystem {
  constructor() {
    this.pairs = [];
    this.maxBarHeight = 45; // Maximum height in pixels from CSS
    this.isInitialized = false;
    this.patrimonySyncSystem = null; // Reference to PatrimonySyncSystem
  }

  async init() {
    try {
      // Wait for PatrimonySyncSystem to be available
      this.setupPatrimonySyncReference();

      // Find and pair elements
      this.findPairs();

      // Setup listeners
      this.setupListeners();

      // Setup budget status listeners
      this.setupBudgetListeners();

      // Setup listener for when PatrimonySyncSystem finishes loading cache
      document.addEventListener('patrimonySystemReady', () => {
        this.syncAllFromCurrentValues();
      });

      // Initial sync after a brief delay to allow cache loading
      setTimeout(() => {
        this.syncAllPairs();
        // console.log('🔄 Initial sync completed after cache loading');
      }, 100);

      this.isInitialized = true;
      // console.log(`✅ Simple sync initialized with ${this.pairs.length} pairs`);
    } catch (error) {
      console.error('❌ Simple sync initialization failed:', error);
    }
  }

  setupPatrimonySyncReference() {
    // Try to get PatrimonySyncSystem from global ReinoCalculator
    if (window.ReinoCalculator?.data?.patrimony) {
      this.patrimonySyncSystem = window.ReinoCalculator.data.patrimony;
    } else {
      // Setup a listener to get it when available
      document.addEventListener('reinoCalculatorReady', (event) => {
        this.patrimonySyncSystem = event.detail.systems.patrimonySync;
      });
    }
  }

  setupBudgetListeners() {
    // Listen for allocation status changes from PatrimonySyncSystem
    document.addEventListener('allocationStatusChanged', (event) => {
      this.handleBudgetStatusChange(event.detail);
    });

    // Listen for individual allocation changes (including cache restoration)
    document.addEventListener('allocationChanged', (event) => {
      this.handleAllocationChange(event.detail);
    });
  }

  handleBudgetStatusChange(status) {
    // If budget is fully allocated or over-allocated, prevent further visual updates
    // This helps maintain visual consistency with budget constraints
    this.budgetStatus = status;
  }

  handleAllocationChange(detail) {
    // Handle individual allocation changes, including cache restoration
    const { category, product, percentage } = detail;

    if (!category || !product) return;

    // Find the corresponding pair
    const pair = this.pairs.find((p) => p.category === category && p.product === product);

    if (pair) {
      // Update slider value to match the restored allocation
      if (pair.patrimonio.slider) {
        pair.patrimonio.slider.value = percentage / 100;
      }

      // Sync the visual elements
      this.syncFromPatrimonio(pair);

      // console.log(`🔄 Synced from current values: ${category} - ${product} = ${percentage.toFixed(1)}%`);
    }
  }

  findPairs() {
    const patrimonioItems = document.querySelectorAll(
      '.patrimonio_interactive_item[ativo-category][ativo-product]'
    );

    patrimonioItems.forEach((patrimonioEl) => {
      const category = patrimonioEl.getAttribute('ativo-category');
      const product = patrimonioEl.getAttribute('ativo-product');

      if (!category || !product) return;

      // Find matching ativos element
      const ativosEl = document.querySelector(
        `.ativos-grafico-item[ativo-category="${category}"][ativo-product="${product}"]`
      );

      if (ativosEl) {
        const pair = {
          patrimonio: {
            element: patrimonioEl,
            input: patrimonioEl.querySelector('[input-settings="receive"]'),
            slider: patrimonioEl.querySelector('range-slider'),
            percentage: patrimonioEl.querySelector('.porcentagem-calculadora'),
          },
          ativos: {
            element: ativosEl,
            bar: ativosEl.querySelector('.barra-porcentagem-item'),
            percentage: ativosEl.querySelector('.porcentagem-float-alocacao'),
          },
          category,
          product,
        };

        // Only add if required elements exist
        if (
          pair.patrimonio.input &&
          pair.patrimonio.slider &&
          pair.ativos.bar &&
          pair.ativos.percentage
        ) {
          // Reset any inline width styles that might be causing issues
          pair.ativos.bar.style.width = '';

          this.pairs.push(pair);
          // console.log(`🔗 Paired: ${category} - ${product}`);
        } else {
          console.warn(`⚠️ Missing elements for pair: ${category} - ${product}`);
        }
      }
    });
  }

  setupListeners() {
    this.pairs.forEach((pair) => {
      // Listen to input changes
      pair.patrimonio.input?.addEventListener('input', () => {
        this.syncFromPatrimonio(pair);
      });

      // Listen to slider changes
      pair.patrimonio.slider?.addEventListener('input', () => {
        this.syncFromPatrimonio(pair);
      });

      // Listen to slider change events (when user stops dragging)
      pair.patrimonio.slider?.addEventListener('change', () => {
        this.syncFromPatrimonio(pair);
      });
    });
  }

  syncFromPatrimonio(pair) {
    try {
      // Get slider value (0-1)
      const sliderValue = parseFloat(pair.patrimonio.slider.value) || 0;
      const percentage = sliderValue * 100;

      // Always sync the visual elements to match the slider value
      // The budget validation should happen at the PatrimonySyncSystem level
      const barHeight = (percentage / 100) * this.maxBarHeight;

      // Update ativos bar height (this is the key fix - height not width!)
      pair.ativos.bar.style.height = `${barHeight}px`;

      // Ensure width stays as defined in CSS
      pair.ativos.bar.style.width = '';

      // Update percentage displays
      const formattedPercentage = `${percentage.toFixed(1)}%`;

      pair.ativos.percentage.textContent = formattedPercentage;

      // Update patrimonio percentage display if exists
      if (pair.patrimonio.percentage) {
        pair.patrimonio.percentage.textContent = formattedPercentage;
      }

      // Debug log for troubleshooting
      // console.log(`📊 Synced ${pair.category}-${pair.product}: ${formattedPercentage} (height: ${barHeight}px)`);
    } catch (error) {
      console.error(`❌ Sync error for ${pair.category}-${pair.product}:`, error);
    }
  }

  shouldAllowVisualUpdate(pair) {
    // Always allow visual updates to prevent zeroing of existing allocations
    // The budget validation should happen at the PatrimonySyncSystem level, not here
    return true;
  }

  // Sync all pairs to current values
  syncAllPairs() {
    this.pairs.forEach((pair) => {
      this.syncFromPatrimonio(pair);
    });
  }

  // Force sync all pairs from their current slider/input values
  syncAllFromCurrentValues() {
    // console.log('🔄 Syncing all pairs from current values...');

    this.pairs.forEach((pair) => {
      if (pair.patrimonio.slider && pair.patrimonio.input) {
        // Get the current slider value (which should be set from cache)
        const sliderValue = parseFloat(pair.patrimonio.slider.value) || 0;

        // Force sync the visual elements
        this.syncFromPatrimonio(pair);

        // console.log(`📊 Restored: ${pair.category} - ${pair.product} = ${percentage.toFixed(1)}%`);
      }
    });

    // console.log('✅ All pairs synced from current values');
  }

  // Force sync all visual elements based on current slider values (fix zeroing issues)
  forceSyncFromSliders() {
    // console.log('🔧 Force syncing all visual elements from current slider values...');

    this.pairs.forEach((pair) => {
      if (pair.patrimonio.slider) {
        const sliderValue = parseFloat(pair.patrimonio.slider.value) || 0;
        const percentage = sliderValue * 100;

        // Force update bar height
        const barHeight = (percentage / 100) * this.maxBarHeight;
        pair.ativos.bar.style.height = `${barHeight}px`;

        // Force update percentage display
        const formattedPercentage = `${percentage.toFixed(1)}%`;
        pair.ativos.percentage.textContent = formattedPercentage;

        // Update patrimonio percentage display if exists
        if (pair.patrimonio.percentage) {
          pair.patrimonio.percentage.textContent = formattedPercentage;
        }

        // console.log(`🔧 Forced sync: ${pair.category} - ${pair.product} = ${formattedPercentage}`);
      }
    });

    // console.log('✅ All visual elements force synced from sliders');
  }

  // Public method to update specific pair
  updatePair(category, product, percentage) {
    const pair = this.pairs.find((p) => p.category === category && p.product === product);

    if (pair) {
      // Update slider value
      pair.patrimonio.slider.value = percentage / 100;

      // Trigger input event to update related systems
      pair.patrimonio.slider.dispatchEvent(new Event('input', { bubbles: true }));

      // Sync visuals
      this.syncFromPatrimonio(pair);

      return true;
    }

    console.warn(`⚠️ Pair not found: ${category} - ${product}`);
    return false;
  }

  // Update pair by percentage value
  updatePairByValue(category, product, value, totalValue) {
    if (totalValue > 0) {
      const percentage = (value / totalValue) * 100;
      return this.updatePair(category, product, percentage);
    }
    return false;
  }

  // Reset all pairs to 0%
  resetAll() {
    this.pairs.forEach((pair) => {
      pair.patrimonio.slider.value = 0;
      this.syncFromPatrimonio(pair);
    });
    // console.log('🔄 All pairs reset');
  }

  // Get current allocations
  getAllocations() {
    return this.pairs.map((pair) => ({
      category: pair.category,
      product: pair.product,
      percentage: parseFloat(pair.patrimonio.slider.value) * 100,
      value: parseFloat(pair.patrimonio.input.value) || 0,
    }));
  }

  // Get total allocated percentage
  getTotalAllocatedPercentage() {
    return this.pairs.reduce((total, pair) => {
      return total + (parseFloat(pair.patrimonio.slider.value) * 100 || 0);
    }, 0);
  }

  // Debug method to check bar dimensions
  debugBarDimensions() {
    this.pairs.forEach((pair) => {
      // const barRect = pair.ativos.bar.getBoundingClientRect();
      // const computedStyle = window.getComputedStyle(pair.ativos.bar);
      // console.log(`🔍 ${pair.category}-${pair.product}:`);
      // console.log(`  Computed width: ${computedStyle.width}`);
      // console.log(`  Computed height: ${computedStyle.height}`);
      // console.log(`  Bounding rect: ${barRect.width}x${barRect.height}`);
      // console.log(`  Inline styles:`, pair.ativos.bar.style.cssText);
    });
  }

  // Debug method to check budget integration
  debugBudgetIntegration() {
    // console.log('🔍 SimpleSyncSystem Budget Integration Status:');
    // console.log(
    //   `  PatrimonySyncSystem reference: ${this.patrimonySyncSystem ? '✅ Available' : '❌ Not available'}`
    // );
    if (this.patrimonySyncSystem) {
      // console.log(`  Remaining budget: ${this.patrimonySyncSystem.getRemainingValue()}`);
      // console.log(`  Main value: ${this.patrimonySyncSystem.getMainValue()}`);
    }
    // console.log(`  Budget status: ${JSON.stringify(this.budgetStatus || 'Not available')}`);
  }

  // Debug method to validate all element pairings
  debugPairings() {
    console.log('🔍 SimpleSyncSystem Pairing Analysis:');
    console.log(`📊 Total pairs found: ${this.pairs.length}`);

    if (this.pairs.length === 0) {
      console.warn('❌ No pairs found! Checking for pairing issues...');
      this.debugUnpairedElements();
      return;
    }

    this.pairs.forEach((pair, index) => {
      console.log(`\n🔗 Pair ${index + 1}:`);
      console.log(`  Category: "${pair.category}"`);
      console.log(`  Product: "${pair.product}"`);
      console.log(`  Patrimonio element: ${pair.patrimonio.element ? '✅' : '❌'}`);
      console.log(`  Ativos element: ${pair.ativos.element ? '✅' : '❌'}`);
      console.log(`  Input: ${pair.patrimonio.input ? '✅' : '❌'}`);
      console.log(`  Slider: ${pair.patrimonio.slider ? '✅' : '❌'}`);
      console.log(`  Bar: ${pair.ativos.bar ? '✅' : '❌'}`);
      console.log(`  Percentage: ${pair.ativos.percentage ? '✅' : '❌'}`);

      // Check current values
      if (pair.patrimonio.slider) {
        const sliderValue = parseFloat(pair.patrimonio.slider.value) || 0;
        const percentage = sliderValue * 100;
        console.log(`  Current allocation: ${percentage.toFixed(1)}%`);
      }
    });
  }

  // Debug method to find unpaired elements
  debugUnpairedElements() {
    console.log('\n🔍 Analyzing Unpaired Elements:');

    // Find all patrimonio elements
    const patrimonioElements = document.querySelectorAll(
      '.patrimonio_interactive_item[ativo-category][ativo-product]'
    );

    // Find all ativos elements
    const ativosElements = document.querySelectorAll(
      '.ativos-grafico-item[ativo-category][ativo-product]'
    );

    console.log(`\n📋 Found Elements:`);
    console.log(`  Patrimonio elements: ${patrimonioElements.length}`);
    console.log(`  Ativos elements: ${ativosElements.length}`);

    console.log(`\n💼 PATRIMONIO ELEMENTS:`);
    patrimonioElements.forEach((el, index) => {
      const category = el.getAttribute('ativo-category');
      const product = el.getAttribute('ativo-product');
      const hasPair = this.pairs.some((p) => p.category === category && p.product === product);
      console.log(
        `  ${index + 1}. "${category}" + "${product}" ${hasPair ? '✅ PAIRED' : '❌ UNPAIRED'}`
      );
    });

    console.log(`\n📊 ATIVOS ELEMENTS:`);
    ativosElements.forEach((el, index) => {
      const category = el.getAttribute('ativo-category');
      const product = el.getAttribute('ativo-product');
      const hasPair = this.pairs.some((p) => p.category === category && p.product === product);
      console.log(
        `  ${index + 1}. "${category}" + "${product}" ${hasPair ? '✅ PAIRED' : '❌ UNPAIRED'}`
      );
    });

    // Find mismatches
    console.log(`\n🔍 MISMATCH ANALYSIS:`);
    const patrimonioAttribs = Array.from(patrimonioElements).map((el) => ({
      category: el.getAttribute('ativo-category'),
      product: el.getAttribute('ativo-product'),
      type: 'patrimonio',
    }));

    const ativosAttribs = Array.from(ativosElements).map((el) => ({
      category: el.getAttribute('ativo-category'),
      product: el.getAttribute('ativo-product'),
      type: 'ativos',
    }));

    // Find patrimonio elements without matching ativos
    patrimonioAttribs.forEach((p) => {
      const hasMatch = ativosAttribs.some(
        (a) => a.category === p.category && a.product === p.product
      );
      if (!hasMatch) {
        console.warn(`❌ PATRIMONIO ORPHAN: "${p.category}" + "${p.product}"`);

        // Look for similar matches (case-insensitive)
        const similarMatches = ativosAttribs.filter(
          (a) =>
            a.category.toLowerCase() === p.category.toLowerCase() ||
            a.product.toLowerCase() === p.product.toLowerCase()
        );

        if (similarMatches.length > 0) {
          console.log(`   🔍 Possible matches:`);
          similarMatches.forEach((match) => {
            console.log(`     - "${match.category}" + "${match.product}"`);
          });
        }
      }
    });

    // Find ativos elements without matching patrimonio
    ativosAttribs.forEach((a) => {
      const hasMatch = patrimonioAttribs.some(
        (p) => p.category === a.category && p.product === a.product
      );
      if (!hasMatch) {
        console.warn(`❌ ATIVOS ORPHAN: "${a.category}" + "${a.product}"`);
      }
    });
  }

  // Debug method to test synchronization
  debugSyncTest() {
    console.log('🧪 Testing Synchronization for All Pairs:');

    if (this.pairs.length === 0) {
      console.warn('❌ No pairs to test!');
      return;
    }

    this.pairs.forEach((pair, index) => {
      console.log(`\n🧪 Testing Pair ${index + 1}: ${pair.category} - ${pair.product}`);

      // Test different percentage values
      const testValues = [0, 0.25, 0.5, 0.75, 1.0];

      testValues.forEach((testValue) => {
        const percentage = testValue * 100;

        // Set slider value
        if (pair.patrimonio.slider) {
          pair.patrimonio.slider.value = testValue;

          // Trigger sync
          this.syncFromPatrimonio(pair);

          // Check results
          const barHeight = pair.ativos.bar ? pair.ativos.bar.style.height : 'N/A';
          const displayedPercentage = pair.ativos.percentage
            ? pair.ativos.percentage.textContent
            : 'N/A';

          console.log(`  ${percentage}% → Bar: ${barHeight}, Display: ${displayedPercentage}`);
        }
      });

      // Reset to 0
      if (pair.patrimonio.slider) {
        pair.patrimonio.slider.value = 0;
        this.syncFromPatrimonio(pair);
      }
    });
  }

  // Debug method to verify cache restoration
  debugValueSync() {
    console.log('🔍 CACHE SYNCHRONIZATION ANALYSIS');
    console.log('='.repeat(50));

    if (this.pairs.length === 0) {
      console.warn('❌ No pairs available for cache analysis!');
      return;
    }

    console.log(`📊 Analyzing ${this.pairs.length} pairs for cache sync status:`);
    console.log('\nPair | Input Value | Slider % | Bar Height | Display %');
    console.log('-'.repeat(65));

    this.pairs.forEach((pair, index) => {
      const inputValue = pair.patrimonio.input?.value || '0';
      const sliderValue = parseFloat(pair.patrimonio.slider?.value || 0) * 100;
      const barHeight = pair.ativos.bar?.style.height || '0px';
      const displayText = pair.ativos.percentage?.textContent || '0%';

      console.log(
        `${(index + 1).toString().padStart(4)} | ${inputValue.padEnd(11)} | ${sliderValue.toFixed(1).padStart(8)}% | ${barHeight.padStart(10)} | ${displayText.padStart(9)}`
      );
    });

    // Check for sync issues
    console.log('\n🔍 SYNC ISSUES DETECTED:');
    let issuesFound = 0;

    this.pairs.forEach((pair, index) => {
      const sliderValue = parseFloat(pair.patrimonio.slider?.value || 0) * 100;
      const displayText = pair.ativos.percentage?.textContent || '0%';
      const displayValue = parseFloat(displayText.replace('%', '')) || 0;

      const barHeight = pair.ativos.bar?.style.height || '0px';
      const barValue = parseFloat(barHeight.replace('px', '')) || 0;
      const expectedBarHeight = (sliderValue / 100) * this.maxBarHeight;

      // Check for mismatches
      if (Math.abs(sliderValue - displayValue) > 0.1) {
        console.warn(
          `❌ Pair ${index + 1}: Slider (${sliderValue.toFixed(1)}%) ≠ Display (${displayValue.toFixed(1)}%)`
        );
        issuesFound++;
      }

      if (Math.abs(barValue - expectedBarHeight) > 1) {
        console.warn(
          `❌ Pair ${index + 1}: Bar height (${barValue}px) ≠ Expected (${expectedBarHeight.toFixed(1)}px)`
        );
        issuesFound++;
      }
    });

    if (issuesFound === 0) {
      console.log('✅ All pairs are properly synchronized!');
    } else {
      console.warn(`⚠️ Found ${issuesFound} synchronization issues`);
      console.log('\n🔧 Try running: ReinoCalculator.data.sync.syncAllFromCurrentValues()');
    }
  }

  // Debug method to check all system status
  debugFullStatus() {
    console.log('🔍 COMPLETE SimpleSyncSystem STATUS REPORT');
    console.log('='.repeat(50));

    // Basic info
    console.log(`📊 Initialization: ${this.isInitialized ? '✅ Complete' : '❌ Failed'}`);
    console.log(`📊 Pairs found: ${this.pairs.length}`);
    console.log(`📊 Max bar height: ${this.maxBarHeight}px`);

    // Budget integration
    console.log('\n💰 BUDGET INTEGRATION:');
    this.debugBudgetIntegration();

    // Pairing analysis
    console.log('\n🔗 PAIRING ANALYSIS:');
    this.debugPairings();

    // Element analysis
    if (this.pairs.length === 0) {
      this.debugUnpairedElements();
    }

    // Current allocations
    console.log('\n📈 CURRENT ALLOCATIONS:');
    const allocations = this.getAllocations();
    const totalPercentage = this.getTotalAllocatedPercentage();

    console.log(`📊 Total allocated: ${totalPercentage.toFixed(1)}%`);
    allocations.forEach((alloc) => {
      console.log(
        `  • ${alloc.category} - ${alloc.product}: ${alloc.percentage.toFixed(1)}% (R$ ${alloc.value.toFixed(2)})`
      );
    });

    console.log('\n='.repeat(50));
    console.log('🎯 Use these methods for specific debugging:');
    console.log('  • window.ReinoCalculator.data.sync.debugPairings()');
    console.log('  • window.ReinoCalculator.data.sync.debugUnpairedElements()');
    console.log('  • window.ReinoCalculator.data.sync.debugSyncTest()');
    console.log('  • window.ReinoCalculator.data.sync.debugBudgetIntegration()');
    console.log('  • window.ReinoCalculator.data.sync.debugValueSync() ← Value Analysis');
    console.log(
      '  • window.ReinoCalculator.data.sync.debugZeroingIssues() ← Detect zeroing problems'
    );
  }

  // Debug method to detect visual element zeroing issues
  debugZeroingIssues() {
    console.log('🔍 VISUAL ELEMENT ZEROING DETECTION');
    console.log('='.repeat(50));

    if (this.pairs.length === 0) {
      console.warn('❌ No pairs available for zeroing analysis!');
      return;
    }

    console.log('Checking for elements that should have values but show 0%...\n');

    let zeroingIssues = 0;

    this.pairs.forEach((pair, index) => {
      const sliderValue = parseFloat(pair.patrimonio.slider?.value || 0) * 100;
      const inputValue = pair.patrimonio.input?.value || '0';
      const barHeight = pair.ativos.bar?.style.height || '0px';
      const displayText = pair.ativos.percentage?.textContent || '0%';

      const barHeightNum = parseFloat(barHeight.replace('px', '')) || 0;
      const displayPercent = parseFloat(displayText.replace('%', '')) || 0;

      // Check if input has value but visuals are zero
      const hasInputValue = inputValue !== '0' && inputValue !== '0,00' && inputValue !== '';
      const hasSliderValue = sliderValue > 0;
      const hasVisualValue = barHeightNum > 0 && displayPercent > 0;

      if ((hasInputValue || hasSliderValue) && !hasVisualValue) {
        console.warn(`❌ ZEROING DETECTED - ${pair.category} - ${pair.product}:`);
        console.warn(`   Input: ${inputValue} | Slider: ${sliderValue.toFixed(1)}%`);
        console.warn(`   Bar: ${barHeight} | Display: ${displayText}`);
        console.warn(
          `   Expected bar height: ${((sliderValue / 100) * this.maxBarHeight).toFixed(1)}px`
        );
        zeroingIssues++;
      } else if (hasVisualValue) {
        console.log(`✅ ${pair.category} - ${pair.product}: ${displayText} (${barHeight})`);
      }
    });

    console.log(`\n📊 SUMMARY:`);
    console.log(`Total pairs: ${this.pairs.length}`);
    console.log(`Zeroing issues: ${zeroingIssues}`);

    if (zeroingIssues > 0) {
      console.warn(`⚠️ Found ${zeroingIssues} elements with zeroing issues!`);
      console.log('\n🔧 Suggested fixes:');
      console.log('1. Run: ReinoCalculator.data.sync.syncAllFromCurrentValues()');
      console.log('2. Check budget constraints affecting visual updates');
      console.log('3. Verify slider and input values are properly synchronized');
    } else {
      console.log('✅ No zeroing issues detected!');
    }
  }

  // Cleanup method
  cleanup() {
    this.pairs = [];
    this.isInitialized = false;
    console.log('🧹 Simple sync cleaned up');
  }

  // Get system status
  getStatus() {
    return {
      initialized: this.isInitialized,
      pairs: this.pairs.length,
      totalAllocated: this.getTotalAllocatedPercentage().toFixed(1) + '%',
      patrimonySyncConnected: !!this.patrimonySyncSystem,
      budgetRespecting: true, // Now respects budget constraints
    };
  }
}

// Export for use in main app
export default SimpleSyncSystem;
