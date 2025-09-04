# Guia de Debugging e Testes - Calculadora Reino Capital

## Índice

1. [Scripts de Debug](#1-scripts-de-debug)
2. [Pontos de Verificação](#2-pontos-de-verificação)
3. [Testes Automatizados](#3-testes-automatizados)
4. [Troubleshooting](#4-troubleshooting)
5. [Monitoramento em Produção](#5-monitoramento-em-produção)

---

## 1. Scripts de Debug

### 1.1 Script Principal de Debug

**Arquivo**: `docs/supabase-data-debug.js`

```javascript
/**
 * Script principal para debug do sistema de coleta de dados
 * Execute no console do browser: debugSupabaseDataCollection()
 */
function debugSupabaseDataCollection() {
  console.log('=== SUPABASE DATA COLLECTION DEBUG ===');
  
  // 1. Verificar elementos DOM
  const activeItems = document.querySelectorAll('.patrimonio_interactive_item .active-produto-item');
  console.log(`✅ Encontrados ${activeItems.length} itens ativos no DOM`);
  
  if (activeItems.length === 0) {
    console.warn('⚠️ Nenhum item ativo encontrado. Verifique se há produtos selecionados.');
    return { error: 'No active items found' };
  }

  // 2. Testar coleta de dados (formato correto)
  const formSubmissionData = [];
  activeItems.forEach((item, index) => {
    const container = item.closest('.patrimonio_interactive_item');
    const product = container.getAttribute('ativo-product');
    const category = container.getAttribute('ativo-category');
    
    console.log(`Item ${index + 1}:`, { product, category });
    
    if (product && category) {
      formSubmissionData.push({ product: product, category: category });
    } else {
      console.error(`❌ Item ${index + 1} tem atributos faltando:`, { product, category });
    }
  });
  
  console.log('✅ Dados coletados (formato correto):', formSubmissionData);

  // 3. Testar integração Typebot
  let typebotData = [];
  if (window.ReinoTypebotIntegrationSystem) {
    try {
      typebotData = window.ReinoTypebotIntegrationSystem.getSelectedAssetsDetailed();
      console.log('✅ Typebot Integration:', typebotData);
    } catch (error) {
      console.error('❌ Erro no Typebot Integration:', error);
    }
  } else {
    console.warn('⚠️ ReinoTypebotIntegrationSystem não encontrado');
  }

  // 4. Testar Button Coordinator
  let buttonCoordinatorData = [];
  if (window.ReinoButtonCoordinator) {
    try {
      buttonCoordinatorData = window.ReinoButtonCoordinator.getSelectedAssetsDetailed();
      console.log('✅ Button Coordinator:', buttonCoordinatorData);
    } catch (error) {
      console.error('❌ Erro no Button Coordinator:', error);
    }
  } else {
    console.warn('⚠️ ReinoButtonCoordinator não encontrado');
  }

  // 5. Verificar fonte problemática (deve ser ignorada)
  let assetFilterData = [];
  if (window.ReinoAssetSelectionFilter && window.ReinoAssetSelectionFilter.selectedAssets) {
    assetFilterData = Array.from(window.ReinoAssetSelectionFilter.selectedAssets);
    console.log('❌ Asset Selection Filter (formato antigo - NÃO usar):', assetFilterData);
    
    if (assetFilterData.some(asset => asset.includes('|'))) {
      console.warn('⚠️ ATENÇÃO: Asset Selection Filter ainda usa formato pipe-separated');
    }
  }

  // 6. Testar dados de alocação
  const allocationData = {};
  let totalValue = 0;
  
  activeItems.forEach((item, index) => {
    const container = item.closest('.patrimonio_interactive_item');
    const product = container.getAttribute('ativo-product');
    const category = container.getAttribute('ativo-category');
    const input = container.querySelector('.currency-input');
    const slider = container.querySelector('.slider');
    
    if (product && category && (input || slider)) {
      const rawValue = input ? input.value : '0';
      const value = parseFloat(rawValue.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const percentage = slider ? parseFloat(slider.value) * 100 : 0;
      
      allocationData[category + '-' + product] = {
        value: value,
        percentage: percentage,
        category: category,
        product: product
      };
      
      totalValue += value;
      console.log(`Alocação ${index + 1}:`, { product, category, value, percentage });
    }
  });
  
  console.log('✅ Dados de alocação:', allocationData);
  console.log(`✅ Total alocado: R$ ${totalValue.toLocaleString('pt-BR')}`);

  // 7. Validações
  const validations = {
    hasCorrectFormat: formSubmissionData.every(asset => 
      asset.hasOwnProperty('product') && 
      asset.hasOwnProperty('category') &&
      typeof asset.product === 'string' &&
      typeof asset.category === 'string'
    ),
    noPipeSeparators: !JSON.stringify(formSubmissionData).includes('|'),
    noGenericCategories: formSubmissionData.every(asset => asset.category !== 'Outros'),
    hasAllocation: Object.keys(allocationData).length > 0,
    totalIs100Percent: Math.abs(Object.values(allocationData).reduce((sum, item) => sum + item.percentage, 0) - 100) < 0.01
  };

  console.log('\n=== VALIDAÇÕES ===');
  Object.entries(validations).forEach(([key, value]) => {
    console.log(`${value ? '✅' : '❌'} ${key}:`, value);
  });

  // 8. Simular dados para Supabase
  const supabaseData = {
    patrimonio: totalValue,
    ativos_escolhidos: formSubmissionData,
    alocacao: allocationData,
    total_alocado: totalValue,
    percentual_alocado: Object.values(allocationData).reduce((sum, item) => sum + item.percentage, 0),
    submitted_at: new Date().toISOString()
  };

  console.log('\n=== DADOS PARA SUPABASE ===');
  console.log('Dados que seriam salvos:', supabaseData);

  return {
    success: true,
    data: {
      formSubmission: formSubmissionData,
      allocation: allocationData,
      typebot: typebotData,
      buttonCoordinator: buttonCoordinatorData,
      assetFilter: assetFilterData,
      supabase: supabaseData
    },
    validations: validations,
    summary: {
      activeItems: activeItems.length,
      totalValue: totalValue,
      allValidationsPassed: Object.values(validations).every(v => v === true)
    }
  };
}

// Auto-executar se estiver no console
if (typeof window !== 'undefined') {
  console.log('🔍 Execute debugSupabaseDataCollection() para testar coleta de dados');
}
```

### 1.2 Script de Debug do Typebot

```javascript
/**
 * Debug específico para integração Typebot
 */
function debugTypebotIntegration() {
  console.log('=== TYPEBOT INTEGRATION DEBUG ===');

  // 1. Verificar se sistema está disponível
  if (!window.ReinoTypebotIntegrationSystem) {
    console.error('❌ ReinoTypebotIntegrationSystem não encontrado');
    return { error: 'System not found' };
  }

  const system = window.ReinoTypebotIntegrationSystem;

  // 2. Verificar estado do sistema
  console.log('Estado do sistema:', {
    isInitialized: system.isInitialized,
    isTypebotActive: system.isTypebotActive,
    hasLibrary: !!system.typebotLibrary
  });

  // 3. Testar coleta de dados
  try {
    const formData = system.collectFormData();
    console.log('✅ Dados coletados:', formData);

    // 4. Testar formatação para Typebot
    const patrimonio = system.getPatrimonioValue();
    const ativos = system.getSelectedAssets();
    const totalAlocado = system.formatCurrency(system.getTotalAllocated());

    console.log('✅ Variáveis para Typebot:', {
      patrimonio,
      ativos,
      totalAlocado
    });

    // 5. Verificar se dados estão no formato correto
    const assetsDetailed = system.getSelectedAssetsDetailed();
    const hasCorrectFormat = assetsDetailed.every(asset => 
      asset.product && asset.category && 
      !asset.product.includes('|') && 
      asset.category !== 'Outros'
    );

    console.log(`${hasCorrectFormat ? '✅' : '❌'} Formato dos ativos está correto:`, hasCorrectFormat);

    return {
      success: true,
      data: formData,
      typebotVariables: { patrimonio, ativos, totalAlocado },
      formatValid: hasCorrectFormat
    };

  } catch (error) {
    console.error('❌ Erro na coleta de dados:', error);
    return { error: error.message };
  }
}
```

### 1.3 Script de Debug do Supabase

```javascript
/**
 * Debug específico para integração Supabase
 */
function debugSupabaseIntegration() {
  console.log('=== SUPABASE INTEGRATION DEBUG ===');

  // 1. Verificar se sistema está disponível
  if (!window.ReinoSupabaseIntegration) {
    console.error('❌ ReinoSupabaseIntegration não encontrado');
    return { error: 'System not found' };
  }

  const system = window.ReinoSupabaseIntegration;

  // 2. Verificar status
  const status = system.getStatus();
  console.log('Status do Supabase:', status);

  // 3. Testar configuração
  if (!status.ready) {
    console.error('❌ Supabase não está pronto');
    return { error: 'Supabase not ready' };
  }

  // 4. Simular dados de teste
  const testData = {
    patrimonio: 1000000,
    ativosEscolhidos: [
      { product: "CDB", category: "Renda Fixa" },
      { product: "Ações", category: "Fundo de Investimento" }
    ],
    alocacao: {
      "Renda Fixa-CDB": {
        value: 600000,
        percentage: 60,
        category: "Renda Fixa",
        product: "CDB"
      },
      "Fundo de Investimento-Ações": {
        value: 400000,
        percentage: 40,
        category: "Fundo de Investimento",
        product: "Ações"
      }
    },
    totalAlocado: 1000000,
    percentualAlocado: 100,
    patrimonioRestante: 0,
    session_id: 'debug_' + Date.now()
  };

  // 5. Testar mapeamento
  try {
    const mappedData = system.mapFormDataToSupabase(testData);
    console.log('✅ Dados mapeados para Supabase:', mappedData);

    // 6. Testar validação
    const validation = system.validateFormData(testData);
    console.log('✅ Validação:', validation);

    return {
      success: true,
      status: status,
      mappedData: mappedData,
      validation: validation
    };

  } catch (error) {
    console.error('❌ Erro no mapeamento:', error);
    return { error: error.message };
  }
}
```

---

## 2. Pontos de Verificação

### 2.1 Checklist de Verificação Rápida

```javascript
/**
 * Checklist rápido para verificar se tudo está funcionando
 */
function quickHealthCheck() {
  console.log('=== QUICK HEALTH CHECK ===');

  const checks = {
    // Sistemas disponíveis
    typebotSystem: !!window.ReinoTypebotIntegrationSystem,
    supabaseSystem: !!window.ReinoSupabaseIntegration,
    buttonCoordinator: !!window.ReinoButtonCoordinator,
    assetFilter: !!window.ReinoAssetSelectionFilter,

    // DOM elements
    patrimonioInput: !!document.querySelector('#currency'),
    activeItems: document.querySelectorAll('.patrimonio_interactive_item .active-produto-item').length > 0,
    sendButton: !!document.querySelector('[element-function="send"]'),

    // Dados básicos
    hasPatrimonio: false,
    hasActiveAssets: false,
    is100PercentAllocated: false
  };

  // Verificar patrimônio
  const patrimonioInput = document.querySelector('#currency');
  if (patrimonioInput && patrimonioInput.value) {
    const value = parseFloat(patrimonioInput.value.replace(/[^\d,]/g, '').replace(',', '.'));
    checks.hasPatrimonio = value > 0;
  }

  // Verificar ativos ativos
  const activeItems = document.querySelectorAll('.patrimonio_interactive_item .active-produto-item');
  checks.hasActiveAssets = activeItems.length > 0;

  // Verificar alocação 100%
  let totalPercentage = 0;
  activeItems.forEach(item => {
    const slider = item.closest('.patrimonio_interactive_item').querySelector('.slider');
    if (slider) {
      totalPercentage += parseFloat(slider.value) * 100;
    }
  });
  checks.is100PercentAllocated = Math.abs(totalPercentage - 100) < 0.01;

  // Mostrar resultados
  console.log('Resultados do Health Check:');
  Object.entries(checks).forEach(([key, value]) => {
    console.log(`${value ? '✅' : '❌'} ${key}:`, value);
  });

  const allPassed = Object.values(checks).every(check => check === true);
  console.log(`\n${allPassed ? '✅' : '❌'} Status geral:`, allPassed ? 'TUDO OK' : 'PROBLEMAS ENCONTRADOS');

  return { checks, allPassed };
}
```

### 2.2 Verificações por Etapa

#### Etapa 1: Coleta de Dados
```javascript
function checkDataCollection() {
  const activeItems = document.querySelectorAll('.patrimonio_interactive_item .active-produto-item');
  
  console.log('=== VERIFICAÇÃO: COLETA DE DADOS ===');
  console.log(`Itens ativos encontrados: ${activeItems.length}`);
  
  activeItems.forEach((item, index) => {
    const container = item.closest('.patrimonio_interactive_item');
    const product = container.getAttribute('ativo-product');
    const category = container.getAttribute('ativo-category');
    const input = container.querySelector('.currency-input');
    const slider = container.querySelector('.slider');
    
    console.log(`Item ${index + 1}:`, {
      product,
      category,
      hasInput: !!input,
      hasSlider: !!slider,
      inputValue: input ? input.value : 'N/A',
      sliderValue: slider ? slider.value : 'N/A'
    });
  });
}
```

#### Etapa 2: Validação
```javascript
function checkValidation() {
  console.log('=== VERIFICAÇÃO: VALIDAÇÃO ===');
  
  if (window.ReinoTypebotIntegrationSystem) {
    const formData = window.ReinoTypebotIntegrationSystem.collectFormData();
    
    if (window.ReinoSupabaseIntegration) {
      const validation = window.ReinoSupabaseIntegration.validateFormData(formData);
      console.log('Resultado da validação:', validation);
      
      if (!validation.isValid) {
        console.error('❌ Erros de validação:', validation.errors);
      }
    }
  }
}
```

#### Etapa 3: Integração Typebot
```javascript
function checkTypebotIntegration() {
  console.log('=== VERIFICAÇÃO: TYPEBOT ===');
  
  if (!window.ReinoTypebotIntegrationSystem) {
    console.error('❌ Sistema Typebot não encontrado');
    return;
  }
  
  const system = window.ReinoTypebotIntegrationSystem;
  
  console.log('Estado do Typebot:', {
    isInitialized: system.isInitialized,
    isActive: system.isTypebotActive,
    hasLibrary: !!system.typebotLibrary
  });
  
  // Testar variáveis
  try {
    const patrimonio = system.getPatrimonioValue();
    const ativos = system.getSelectedAssets();
    const totalAlocado = system.formatCurrency(system.getTotalAllocated());
    
    console.log('Variáveis para Typebot:', {
      patrimonio,
      ativos,
      totalAlocado
    });
    
    // Verificar se não são undefined
    const hasUndefined = [patrimonio, ativos, totalAlocado].some(v => v === undefined || v === 'undefined');
    console.log(`${hasUndefined ? '❌' : '✅'} Variáveis válidas:`, !hasUndefined);
    
  } catch (error) {
    console.error('❌ Erro ao coletar variáveis:', error);
  }
}
```

---

## 3. Testes Automatizados

### 3.1 Suite de Testes Principal

```javascript
/**
 * Suite de testes automatizados
 */
function runAutomatedTests() {
  console.log('=== TESTES AUTOMATIZADOS ===');
  
  const tests = [];
  
  // Teste 1: Sistemas disponíveis
  tests.push({
    name: 'Sistemas Disponíveis',
    test: () => {
      return window.ReinoTypebotIntegrationSystem && 
             window.ReinoSupabaseIntegration && 
             window.ReinoButtonCoordinator;
    }
  });
  
  // Teste 2: DOM elements
  tests.push({
    name: 'Elementos DOM',
    test: () => {
      return document.querySelector('#currency') && 
             document.querySelectorAll('.patrimonio_interactive_item').length > 0;
    }
  });
  
  // Teste 3: Coleta de dados
  tests.push({
    name: 'Coleta de Dados',
    test: () => {
      if (!window.ReinoTypebotIntegrationSystem) return false;
      
      try {
        const data = window.ReinoTypebotIntegrationSystem.collectFormData();
        return data && data.patrimonio && data.ativosEscolhidos;
      } catch (error) {
        return false;
      }
    }
  });
  
  // Teste 4: Formato de dados
  tests.push({
    name: 'Formato de Dados',
    test: () => {
      if (!window.ReinoTypebotIntegrationSystem) return false;
      
      try {
        const assets = window.ReinoTypebotIntegrationSystem.getSelectedAssetsDetailed();
        return assets.every(asset => 
          asset.product && 
          asset.category && 
          !asset.product.includes('|') && 
          asset.category !== 'Outros'
        );
      } catch (error) {
        return false;
      }
    }
  });
  
  // Teste 5: Validação
  tests.push({
    name: 'Validação de Dados',
    test: () => {
      if (!window.ReinoSupabaseIntegration || !window.ReinoTypebotIntegrationSystem) return false;
      
      try {
        const data = window.ReinoTypebotIntegrationSystem.collectFormData();
        const validation = window.ReinoSupabaseIntegration.validateFormData(data);
        return validation.isValid;
      } catch (error) {
        return false;
      }
    }
  });
  
  // Executar testes
  let passed = 0;
  let failed = 0;
  
  tests.forEach((test, index) => {
    try {
      const result = test.test();
      console.log(`${result ? '✅' : '❌'} Teste ${index + 1}: ${test.name}`);
      
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Teste ${index + 1}: ${test.name} - Erro:`, error);
      failed++;
    }
  });
  
  console.log(`\n=== RESULTADO DOS TESTES ===`);
  console.log(`✅ Passou: ${passed}`);
  console.log(`❌ Falhou: ${failed}`);
  console.log(`📊 Total: ${tests.length}`);
  
  const success = failed === 0;
  console.log(`\n${success ? '🎉' : '⚠️'} Status: ${success ? 'TODOS OS TESTES PASSARAM' : 'ALGUNS TESTES FALHARAM'}`);
  
  return { passed, failed, total: tests.length, success };
}
```

### 3.2 Testes de Performance

```javascript
/**
 * Testes de performance
 */
function runPerformanceTests() {
  console.log('=== TESTES DE PERFORMANCE ===');
  
  const tests = [
    {
      name: 'Coleta de Dados',
      test: () => {
        if (!window.ReinoTypebotIntegrationSystem) return null;
        return window.ReinoTypebotIntegrationSystem.collectFormData();
      }
    },
    {
      name: 'Validação',
      test: () => {
        if (!window.ReinoSupabaseIntegration || !window.ReinoTypebotIntegrationSystem) return null;
        const data = window.ReinoTypebotIntegrationSystem.collectFormData();
        return window.ReinoSupabaseIntegration.validateFormData(data);
      }
    },
    {
      name: 'Mapeamento Supabase',
      test: () => {
        if (!window.ReinoSupabaseIntegration || !window.ReinoTypebotIntegrationSystem) return null;
        const data = window.ReinoTypebotIntegrationSystem.collectFormData();
        return window.ReinoSupabaseIntegration.mapFormDataToSupabase(data);
      }
    }
  ];
  
  tests.forEach(test => {
    const start = performance.now();
    
    try {
      const result = test.test();
      const end = performance.now();
      const duration = end - start;
      
      console.log(`⏱️ ${test.name}: ${duration.toFixed(2)}ms`);
      
      if (duration > 100) {
        console.warn(`⚠️ ${test.name} demorou mais que 100ms`);
      }
      
    } catch (error) {
      console.error(`❌ ${test.name} falhou:`, error);
    }
  });
}
```

---

## 4. Troubleshooting

### 4.1 Problemas Comuns

#### Problema: "ReinoTypebotIntegrationSystem não encontrado"
```javascript
// Verificação
if (!window.ReinoTypebotIntegrationSystem) {
  console.error('Sistema não carregado');
  
  // Soluções
  // 1. Verificar se script foi carregado
  console.log('Scripts carregados:', document.querySelectorAll('script[src*="typebot"]'));
  
  // 2. Verificar erros no console
  console.log('Verificar console para erros de carregamento');
  
  // 3. Tentar recarregar
  location.reload();
}
```

#### Problema: "Dados undefined no Typebot"
```javascript
// Debug
function debugTypebotUndefined() {
  console.log('=== DEBUG: TYPEBOT UNDEFINED ===');
  
  // 1. Verificar coleta de dados
  const data = window.ReinoTypebotIntegrationSystem.collectFormData();
  console.log('Dados coletados:', data);
  
  // 2. Verificar métodos individuais
  console.log('Patrimônio:', window.ReinoTypebotIntegrationSystem.getPatrimonioValue());
  console.log('Ativos:', window.ReinoTypebotIntegrationSystem.getSelectedAssets());
  console.log('Total:', window.ReinoTypebotIntegrationSystem.getTotalAllocated());
  
  // 3. Verificar DOM
  console.log('Input patrimônio:', document.querySelector('#currency'));
  console.log('Itens ativos:', document.querySelectorAll('.patrimonio_interactive_item .active-produto-item').length);
}
```

#### Problema: "Formato incorreto no Supabase"
```javascript
// Verificação
function debugSupabaseFormat() {
  const data = window.ReinoTypebotIntegrationSystem.getSelectedAssetsDetailed();
  
  // Verificar formato
  const hasIncorrectFormat = data.some(asset => 
    asset.product.includes('|') || 
    asset.category === 'Outros'
  );
  
  if (hasIncorrectFormat) {
    console.error('❌ Formato incorreto detectado:', data);
    
    // Mostrar fonte do problema
    if (window.ReinoAssetSelectionFilter) {
      console.log('Fonte problemática:', Array.from(window.ReinoAssetSelectionFilter.selectedAssets));
    }
  } else {
    console.log('✅ Formato correto:', data);
  }
}
```

### 4.2 Logs de Erro Comuns

#### Erro: "Cannot read property 'getAttribute' of null"
```javascript
// Causa: Elemento DOM não encontrado
// Solução: Verificar se elementos existem antes de acessar
const container = item.closest('.patrimonio_interactive_item');
if (container) {
  const product = container.getAttribute('ativo-product');
  // ... resto do código
}
```

#### Erro: "Typebot library not loaded"
```javascript
// Causa: Biblioteca Typebot não carregou
// Solução: Aguardar carregamento
async function waitForTypebot() {
  while (!window.Typebot) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log('✅ Typebot carregado');
}
```

#### Erro: "Supabase not ready"
```javascript
// Causa: Cliente Supabase não inicializado
// Solução: Verificar configuração
if (!window.ReinoSupabaseIntegration.isReady) {
  console.error('Supabase não está pronto');
  console.log('Status:', window.ReinoSupabaseIntegration.getStatus());
}
```

---

## 5. Monitoramento em Produção

### 5.1 Métricas Importantes

```javascript
/**
 * Coleta métricas para monitoramento
 */
function collectMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    page: window.location.href,
    userAgent: navigator.userAgent,
    
    // Sistemas
    systems: {
      typebot: !!window.ReinoTypebotIntegrationSystem,
      supabase: !!window.ReinoSupabaseIntegration,
      buttonCoordinator: !!window.ReinoButtonCoordinator
    },
    
    // DOM
    dom: {
      patrimonioInput: !!document.querySelector('#currency'),
      activeItems: document.querySelectorAll('.patrimonio_interactive_item .active-produto-item').length,
      sendButton: !!document.querySelector('[element-function="send"]')
    },
    
    // Dados
    data: {
      hasPatrimonio: false,
      hasActiveAssets: false,
      totalValue: 0,
      assetCount: 0
    }
  };
  
  // Coletar dados se disponível
  if (window.ReinoTypebotIntegrationSystem) {
    try {
      const formData = window.ReinoTypebotIntegrationSystem.collectFormData();
      metrics.data.hasPatrimonio = formData.patrimonio > 0;
      metrics.data.hasActiveAssets = formData.ativosEscolhidos.length > 0;
      metrics.data.totalValue = formData.totalAlocado;
      metrics.data.assetCount = formData.ativosEscolhidos.length;
    } catch (error) {
      metrics.error = error.message;
    }
  }
  
  return metrics;
}
```

### 5.2 Alertas Automáticos

```javascript
/**
 * Sistema de alertas para problemas críticos
 */
function checkForCriticalIssues() {
  const issues = [];
  
  // Verificar sistemas críticos
  if (!window.ReinoTypebotIntegrationSystem) {
    issues.push('CRITICAL: Typebot system not loaded');
  }
  
  if (!window.ReinoSupabaseIntegration) {
    issues.push('CRITICAL: Supabase system not loaded');
  }
  
  // Verificar DOM crítico
  if (!document.querySelector('#currency')) {
    issues.push('CRITICAL: Patrimonio input not found');
  }
  
  if (!document.querySelector('[element-function="send"]')) {
    issues.push('CRITICAL: Send button not found');
  }
  
  // Verificar dados
  if (window.ReinoTypebotIntegrationSystem) {
    try {
      const assets = window.ReinoTypebotIntegrationSystem.getSelectedAssetsDetailed();
      const hasIncorrectFormat = assets.some(asset => 
        asset.product.includes('|') || asset.category === 'Outros'
      );
      
      if (hasIncorrectFormat) {
        issues.push('WARNING: Incorrect data format detected');
      }
    } catch (error) {
      issues.push(`ERROR: Data collection failed - ${error.message}`);
    }
  }
  
  // Reportar issues
  if (issues.length > 0) {
    console.error('🚨 ISSUES DETECTADOS:', issues);
    
    // Enviar para sistema de monitoramento (se disponível)
    if (window.analytics) {
      window.analytics.track('Calculator Issues', {
        issues: issues,
        timestamp: new Date().toISOString(),
        page: window.location.href
      });
    }
  }
  
  return issues;
}

// Executar verificação a cada 30 segundos
setInterval(checkForCriticalIssues, 30000);
```

### 5.3 Dashboard de Status

```javascript
/**
 * Dashboard simples de status no console
 */
function showStatusDashboard() {
  console.clear();
  console.log('🏠 REINO CAPITAL - CALCULATOR STATUS DASHBOARD');
  console.log('=' .repeat(50));
  
  // Status dos sistemas
  console.log('📊 SISTEMAS:');
  console.log(`  Typebot: ${window.ReinoTypebotIntegrationSystem ? '✅' : '❌'}`);
  console.log(`  Supabase: ${window.ReinoSupabaseIntegration ? '✅' : '❌'}`);
  console.log(`  Button Coordinator: ${window.ReinoButtonCoordinator ? '✅' : '❌'}`);
  
  // Status do DOM
  console.log('\n🎯 DOM:');
  console.log(`  Patrimônio Input: ${document.querySelector('#currency') ? '✅' : '❌'}`);
  console.log(`  Itens Ativos: ${document.querySelectorAll('.patrimonio_interactive_item .active-produto-item').length}`);
  console.log(`  Botão Enviar: ${document.querySelector('[element-function="send"]') ? '✅' : '❌'}`);
  
  // Status dos dados
  if (window.ReinoTypebotIntegrationSystem) {
    try {
      const data = window.ReinoTypebotIntegrationSystem.collectFormData();
      console.log('\n💰 DADOS:');
      console.log(`  Patrimônio: R$ ${data.patrimonio.toLocaleString('pt-BR')}`);
      console.log(`  Ativos Selecionados: ${data.ativosEscolhidos.length}`);
      console.log(`  Total Alocado: R$ ${data.totalAlocado.toLocaleString('pt-BR')}`);
      console.log(`  Percentual Alocado: ${data.percentualAlocado.toFixed(1)}%`);
    } catch (error) {
      console.log('\n❌ ERRO NA COLETA DE DADOS:', error.message);
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🔄 Atualizado em:', new Date().toLocaleTimeString());
}

// Atualizar dashboard a cada 10 segundos
setInterval(showStatusDashboard, 10000);
```

---

## Conclusão

Este guia fornece todas as ferramentas necessárias para debugar, testar e monitorar o sistema da calculadora Reino Capital. Use os scripts de debug durante o desenvolvimento e os sistemas de monitoramento em produção para garantir que tudo funcione corretamente.

**Comandos principais para usar no console:**
- `debugSupabaseDataCollection()` - Debug completo
- `quickHealthCheck()` - Verificação rápida
- `runAutomatedTests()` - Testes automatizados
- `showStatusDashboard()` - Dashboard de status
