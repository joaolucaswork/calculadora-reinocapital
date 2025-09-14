/**
 * Commission Quick Test
 * Teste rápido para verificar o fluxo de comissões
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  function quickCommissionTest() {
    console.log('🧪 Starting Quick Commission Test...');

    // Test 1: Check if modules are loaded
    console.log('\n📋 Module Status:');
    const modules = {
      ReinoAppState: window.ReinoAppState,
      ReinoSupabaseIntegration: window.ReinoSupabaseIntegration,
      ReinoSimpleResultadoSync: window.ReinoSimpleResultadoSync,
      ReinoResultadoComparativoCalculator: window.ReinoResultadoComparativoCalculator,
    };

    Object.entries(modules).forEach(([name, module]) => {
      console.log(`${module ? '✅' : '❌'} ${name}`);
    });

    // Test 2: Check current commission data
    console.log('\n💰 Current Commission Data:');

    if (window.ReinoAppState) {
      const snapshot = window.ReinoAppState.getStateSnapshot();
      console.log('AppState commission:', snapshot.commission);
    }

    if (window.ReinoSupabaseIntegration) {
      console.log('Supabase last commission:', window.ReinoSupabaseIntegration.lastCommissionData);
    }

    // Test 3: Check DOM elements
    console.log('\n🖥️ DOM Elements:');
    const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');
    console.log(
      'Traditional element:',
      tradicionalElement ? tradicionalElement.textContent : 'NOT FOUND'
    );

    const totalComissaoElement = document.querySelector('.total-comissao-valor');
    console.log(
      'Total commission element:',
      totalComissaoElement ? totalComissaoElement.textContent : 'NOT FOUND'
    );

    // Test 4: Dispatch test event and monitor
    console.log('\n📡 Testing Event Flow:');

    let supabaseCaptured = false;
    let domUpdated = false;
    const testTotal = 12345;

    // Monitor Supabase
    if (window.ReinoSupabaseIntegration) {
      const originalData = window.ReinoSupabaseIntegration.lastCommissionData;

      setTimeout(() => {
        if (window.ReinoSupabaseIntegration.lastCommissionData !== originalData) {
          supabaseCaptured = true;
          console.log('✅ Supabase captured event');
        } else {
          console.log('❌ Supabase did NOT capture event');
        }
      }, 200);
    }

    // Dispatch test event
    document.dispatchEvent(
      new CustomEvent('totalComissaoChanged', {
        detail: {
          total: testTotal,
          formatted: 'R$ 12.345,00',
          details: [
            {
              category: 'Test Category',
              product: 'Test Product',
              value: 500000,
              commission: testTotal,
            },
          ],
          source: 'quick-test',
        },
      })
    );

    console.log('📤 Test event dispatched with total:', testTotal);

    // Check results after a delay
    setTimeout(() => {
      console.log('\n📊 Test Results:');

      // Check Supabase
      if (window.ReinoSupabaseIntegration?.lastCommissionData?.total === testTotal) {
        console.log('✅ Supabase integration working');
      } else {
        console.log('❌ Supabase integration failed');
        console.log('Expected:', testTotal);
        console.log('Got:', window.ReinoSupabaseIntegration?.lastCommissionData?.total);
      }

      // Check DOM
      const updatedTradicionalElement = document.querySelector('[data-resultado="tradicional"]');
      if (updatedTradicionalElement) {
        const displayedValue =
          parseFloat(
            updatedTradicionalElement.textContent.replace(/[^\d,]/g, '').replace(',', '.')
          ) || 0;
        if (displayedValue === testTotal) {
          console.log('✅ DOM update working');
        } else {
          console.log('❌ DOM update failed');
          console.log('Expected:', testTotal);
          console.log('Displayed:', displayedValue);
        }
      } else {
        console.log('ℹ️ DOM element [data-resultado="tradicional"] not found (may be optional)');
      }

      // Test Supabase mapping
      if (window.ReinoSupabaseIntegration) {
        try {
          const testFormData = {
            patrimonio: 1000000,
            ativosEscolhidos: ['Test Category:Test Product'],
            alocacao: { 'Test Category:Test Product': 500000 },
          };

          const mappedData = window.ReinoSupabaseIntegration.mapFormDataToSupabase(testFormData);

          if (mappedData.comissao_total_calculada === testTotal) {
            console.log('✅ Supabase mapping working');
          } else {
            console.log('❌ Supabase mapping failed');
            console.log('Expected:', testTotal);
            console.log('Mapped:', mappedData.comissao_total_calculada);
          }
        } catch (error) {
          console.log('❌ Supabase mapping error:', error.message);
        }
      }

      console.log('\n🏁 Quick test completed!');
    }, 500);
  }

  // Test if commission calculation is working
  function testCommissionCalculation() {
    console.log('🧮 Testing Commission Calculation...');

    if (!window.ReinoSimpleResultadoSync) {
      console.log('❌ ReinoSimpleResultadoSync not available');
      return;
    }

    const sync = window.ReinoSimpleResultadoSync;

    // Test calculation method
    if (typeof sync.calculateCommissionForValue === 'function') {
      const testValue = 500000;
      const commission = sync.calculateCommissionForValue(testValue, 'Renda Fixa', 'CDB');
      console.log(
        `✅ Commission calculation: R$ ${testValue.toLocaleString('pt-BR')} → R$ ${commission.toLocaleString('pt-BR')}`
      );
    } else {
      console.log('❌ calculateCommissionForValue method not found');
    }

    // Test update method
    if (typeof sync.updateTotalComissao === 'function') {
      console.log('✅ updateTotalComissao method available');
    } else {
      console.log('❌ updateTotalComissao method not found');
    }

    // Test force sync
    if (typeof sync.forceSync === 'function') {
      sync.forceSync();
      console.log('✅ Force sync triggered');
    } else {
      console.log('❌ forceSync method not found');
    }
  }

  // Test DOM update specifically
  function testDOMUpdate() {
    console.log('🖥️ Testing DOM Update...');

    const testValue = 54321;
    const tradicionalElement = document.querySelector('[data-resultado="tradicional"]');

    if (!tradicionalElement) {
      console.log('❌ Traditional element not found');
      return;
    }

    console.log('📊 Before update:', tradicionalElement.textContent);

    // Test direct DOM update via resultado-comparativo-calculator
    if (window.ReinoResultadoComparativoCalculator) {
      const calculator = window.ReinoResultadoComparativoCalculator;

      // Enable debug mode to see logs
      calculator.enableDebug();

      // Test direct method call
      if (typeof calculator.updateTradicionalDOMElement === 'function') {
        calculator.updateTradicionalDOMElement(testValue);
        console.log('✅ Direct DOM update method called');
      } else {
        console.log('❌ updateTradicionalDOMElement method not found');
      }

      // Test via event
      calculator.onTradicionalValueChange(testValue);
      console.log('✅ onTradicionalValueChange called');

      setTimeout(() => {
        console.log('📊 After update:', tradicionalElement.textContent);
        const displayedValue =
          parseFloat(tradicionalElement.textContent.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

        if (displayedValue === testValue) {
          console.log('✅ DOM update successful!');
        } else {
          console.log('❌ DOM update failed');
          console.log('Expected:', testValue);
          console.log('Got:', displayedValue);
        }
      }, 100);
    } else {
      console.log('❌ ReinoResultadoComparativoCalculator not available');
    }
  }

  // Make functions globally available
  window.quickCommissionTest = quickCommissionTest;
  window.testCommissionCalculation = testCommissionCalculation;
  window.testDOMUpdate = testDOMUpdate;

  // Auto-run if debug parameter is present
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.search.includes('debug=commission')) {
        setTimeout(quickCommissionTest, 1000);
      }
    });
  } else {
    if (window.location.search.includes('debug=commission')) {
      setTimeout(quickCommissionTest, 1000);
    }
  }

  console.log('🔧 Commission Quick Test loaded. Run with: quickCommissionTest()');
  console.log('🔧 Additional tests: testDOMUpdate(), testCommissionCalculation()');
})();
