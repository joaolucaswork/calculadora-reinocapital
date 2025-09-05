# SUPABASE DATA CAPTURE PATTERN - EVENT-DRIVEN INTEGRATION

## 🎯 CORE PRINCIPLE

**ALWAYS leverage existing computed values rather than duplicating calculation logic.**

When integrating Supabase with existing calculation systems, use **event-driven data capture** instead of recreating calculations.

## 📋 MANDATORY PATTERN

### ✅ CORRECT APPROACH: Event-Driven Data Capture

```javascript
class SupabaseIntegration {
  constructor() {
    this.lastCommissionData = null;
    this.lastEconomyData = null;
    this.lastRotationData = null;
  }

  setupEventListeners() {
    // Listen to existing calculation events
    document.addEventListener('totalComissaoChanged', (e) => {
      this.lastCommissionData = {
        total: e.detail.total,
        details: e.detail.details,
        timestamp: new Date().toISOString()
      };
    });



    document.addEventListener('rotationIndexChanged', (e) => {
      this.lastRotationData = {
        index: e.detail.index,
        calculations: e.detail.calculations
      };
    });
  }

  mapFormDataToSupabase(formData) {
    const baseData = {
      // Standard form data
      patrimonio: formData.patrimonio || 0,
      ativos_escolhidos: formData.ativosEscolhidos || [],
      
      // Use captured calculated values
      comissao_total_calculada: this.lastCommissionData?.total || 0,
      indice_giro_usado: this.lastRotationData?.index || 2,
      detalhes_comissao: this.lastCommissionData?.details || []
    };
    
    return baseData;
  }
}
```

### ❌ INCORRECT APPROACH: Calculation Duplication

```javascript
// DON'T DO THIS - Duplicates existing logic
class SupabaseIntegration {
  calculateCommissionData(formData) {
    let totalComissao = 0;
    
    // This duplicates resultado-sync.js logic
    Object.entries(formData.alocacao).forEach(([key, allocation]) => {
      if (window.calcularCustoProduto) {
        const resultado = window.calcularCustoProduto(allocation.value, allocation.category, allocation.product);
        totalComissao += resultado.custoMedio || 0;
      }
    });
    
    // This duplicates rotation-index-controller.js logic
    const indiceGiro = window.ReinoRotationIndexController?.getCurrentIndex() || 2;
    
    return { total: totalComissao, indiceGiro };
  }
}
```

## 🎪 REINO CAPITAL SYSTEM EVENTS

### Available Events for Data Capture

| Event Name | Source Module | Data Available | Usage |
|------------|---------------|----------------|-------|
| `totalComissaoChanged` | `resultado-sync.js` | `{ total, formatted }` | Total commission calculation |
| `resultadoComparativoUpdated` | `resultado-comparativo-calculator.js` | `{ reino, tradicional }` | Comparative analysis results |
| `rotationIndexChanged` | `rotation-index-controller.js` | `{ index, calculations }` | Rotation index and product calculations |
| `patrimonyMainValueChanged` | `currency-formatting.js` | `{ value, formatted }` | Main patrimony value updates |
| `allocationChanged` | `currency-formatting.js` | `{ allocations, total }` | Asset allocation changes |
| `assetSelectionChanged` | `asset-selection-filter.js` | `{ selectedAssets }` | Selected assets updates |

### Event Data Structures

```javascript
// totalComissaoChanged
{
  detail: {
    total: 15000.50,           // Total commission in BRL
    formatted: "R$ 15.000,50", // Formatted currency string
    details: [                 // Individual product details
      {
        category: "Renda Fixa",
        product: "CDB",
        value: 100000,
        custoAnual: 1500,
        taxaInfo: { min: 1.2, max: 1.8, media: 1.5 }
      }
    ]
  }
}

// resultadoComparativoUpdated
{
  detail: {
    reino: {
      annual: 5000,
      patrimony: 1000000,
      formatted: { annual: "R$ 5.000,00", patrimony: "R$ 1.000.000,00" }
    },
    tradicional: {
      total: 15000,
      details: [...]
    }
  }
}

// rotationIndexChanged
{
  detail: {
    index: 2,
    calculations: {
      "Renda Fixa:CDB": {
        comissaoRate: 0.015,
        comissaoPercent: 1.5,
        fatorEfetivo: 2.0
      }
    }
  }
}
```

## 🚀 BENEFITS OF EVENT-DRIVEN APPROACH

### Performance Benefits

- **No Recalculation**: Uses already computed values
- **Real-time Sync**: Always captures current state
- **Minimal CPU Usage**: No duplicate processing

### Maintainability Benefits

- **Single Source of Truth**: Calculations remain in original modules
- **No Code Duplication**: Reduces maintenance burden
- **Automatic Updates**: Changes to calculation logic automatically reflected
- **Reduced Bug Risk**: No divergence between displayed and stored values

### Data Integrity Benefits

- **Exact Match**: Stored data matches what user sees
- **Consistent State**: No timing issues between calculations
- **Validated Data**: Uses data that passed through existing validation

## 📝 IMPLEMENTATION CHECKLIST

### For New Supabase Integrations

- [ ] Identify existing calculation modules and their events
- [ ] Set up event listeners in constructor or init method
- [ ] Cache captured data in instance variables
- [ ] Use cached data in `mapFormDataToSupabase()` method
- [ ] Add fallback values for cases where events haven't fired yet
- [ ] Include timestamp for data freshness tracking

### For Existing Integrations

- [ ] Audit for calculation duplication
- [ ] Replace custom calculation methods with event listeners
- [ ] Remove redundant calculation logic
- [ ] Test that captured data matches original calculations
- [ ] Verify performance improvements

## ⚠️ COMMON MISTAKES TO AVOID

1. **Creating calculation methods** that duplicate existing logic
2. **Direct DOM querying** instead of using events
3. **Synchronous calculation** during form submission
4. **Missing fallback values** when events haven't fired
5. **Not caching data** and recalculating on every submission

## 🔧 DEBUGGING TIPS

```javascript
// Add debug logging to verify data capture
setupEventListeners() {
  document.addEventListener('totalComissaoChanged', (e) => {
    this.lastCommissionData = e.detail;
    if (this.debugMode) {
      console.log('📊 Commission data captured:', this.lastCommissionData);
    }
  });
}

// Verify data freshness
getCurrentCommissionData() {
  const age = this.lastCommissionData ? 
    Date.now() - new Date(this.lastCommissionData.timestamp).getTime() : 
    Infinity;
    
  if (age > 30000) { // 30 seconds
    console.warn('⚠️ Commission data may be stale');
  }
  
  return this.lastCommissionData;
}
```

## 📚 RELATED PATTERNS

- **Observer Pattern**: Event-driven architecture
- **Cache-Aside Pattern**: Caching computed results
- **Single Source of Truth**: Centralized calculation logic

---

**Remember**: The goal is to **capture** existing calculations, not **recreate** them.
