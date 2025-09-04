/**
 * Supabase Data Debug Script
 * Use this in browser console to check data collection consistency
 */

function debugSupabaseDataCollection() {
  console.log('=== SUPABASE DATA COLLECTION DEBUG ===');
  
  // 1. Check DOM elements
  const activeItems = document.querySelectorAll('.patrimonio_interactive_item .active-produto-item');
  console.log(`Found ${activeItems.length} active items in DOM`);
  
  // 2. Test form-submission.js method (correct format)
  const formSubmissionData = [];
  activeItems.forEach((item) => {
    const container = item.closest('.patrimonio_interactive_item');
    const product = container.getAttribute('ativo-product');
    const category = container.getAttribute('ativo-category');
    if (product && category) {
      formSubmissionData.push({ product: product, category: category });
    }
  });
  
  console.log('✅ Form Submission Format (CORRECT):', formSubmissionData);
  
  // 3. Test typebot-integration.js method
  let typebotData = [];
  if (window.ReinoTypebotIntegrationSystem) {
    typebotData = window.ReinoTypebotIntegrationSystem.getSelectedAssetsDetailed();
  }
  console.log('✅ Typebot Integration Format:', typebotData);
  
  // 4. Test button-coordinator.js method
  let buttonCoordinatorData = [];
  if (window.ReinoButtonCoordinator) {
    buttonCoordinatorData = window.ReinoButtonCoordinator.getSelectedAssetsDetailed();
  }
  console.log('✅ Button Coordinator Format:', buttonCoordinatorData);
  
  // 5. Check ReinoAssetSelectionFilter (problematic source)
  let assetFilterData = [];
  if (window.ReinoAssetSelectionFilter && window.ReinoAssetSelectionFilter.selectedAssets) {
    assetFilterData = Array.from(window.ReinoAssetSelectionFilter.selectedAssets);
  }
  console.log('❌ Asset Selection Filter Format (OLD):', assetFilterData);
  
  // 6. Test allocation data
  const allocationData = {};
  activeItems.forEach((item) => {
    const container = item.closest('.patrimonio_interactive_item');
    const product = container.getAttribute('ativo-product');
    const category = container.getAttribute('ativo-category');
    const input = container.querySelector('.currency-input');
    const slider = container.querySelector('.slider');
    
    if (product && category && (input || slider)) {
      const value = input ? parseFloat(input.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0 : 0;
      const percentage = slider ? parseFloat(slider.value) * 100 : 0;
      
      allocationData[category + '-' + product] = {
        value: value,
        percentage: percentage,
        category: category,
        product: product,
      };
    }
  });
  
  console.log('✅ Allocation Data Format (CORRECT):', allocationData);
  
  // 7. Compare formats
  console.log('\n=== FORMAT COMPARISON ===');
  console.log('CORRECT FORMAT (should be used):');
  console.log('ativosEscolhidos:', formSubmissionData);
  console.log('alocacao:', allocationData);
  
  console.log('\nINCORRECT FORMAT (should NOT be used):');
  console.log('ReinoAssetSelectionFilter:', assetFilterData);
  
  // 8. Test what would be saved to Supabase
  const supabaseData = {
    patrimonio: 1000000,
    ativos_escolhidos: formSubmissionData, // This should be the correct format
    alocacao: allocationData,
    total_alocado: Object.values(allocationData).reduce((sum, item) => sum + item.value, 0),
    submitted_at: new Date().toISOString()
  };
  
  console.log('\n=== FINAL SUPABASE DATA ===');
  console.log('Data that should be saved to Supabase:', supabaseData);
  
  // 9. Validation
  const hasCorrectFormat = formSubmissionData.every(asset => 
    asset.hasOwnProperty('product') && 
    asset.hasOwnProperty('category') &&
    !asset.product.includes('|') &&
    !asset.category.includes('|')
  );
  
  console.log('\n=== VALIDATION ===');
  console.log('✅ Data format is correct:', hasCorrectFormat);
  console.log('✅ No pipe separators found:', !JSON.stringify(formSubmissionData).includes('|'));
  console.log('✅ Categories are not "Outros":', formSubmissionData.every(asset => asset.category !== 'Outros'));
  
  return {
    correct: formSubmissionData,
    allocation: allocationData,
    incorrect: assetFilterData,
    supabaseReady: supabaseData
  };
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('Run debugSupabaseDataCollection() to test data collection');
}
