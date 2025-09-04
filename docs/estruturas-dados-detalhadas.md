# Estruturas de Dados Detalhadas - Calculadora Reino Capital

## Índice

1. [Dados da Interface (DOM)](#1-dados-da-interface-dom)
2. [Transformações de Dados](#2-transformações-de-dados)
3. [Estruturas por Sistema](#3-estruturas-por-sistema)
4. [Validações e Regras](#4-validações-e-regras)
5. [Exemplos Práticos](#5-exemplos-práticos)

---

## 1. Dados da Interface (DOM)

### 1.1 Elementos de Entrada

#### Campo de Patrimônio
```html
<input 
  id="currency" 
  data-currency="true" 
  is-main="true" 
  class="currency-input"
  value="1.000.000"
>
```

**Atributos:**
- `data-currency="true"`: Formatação monetária automática
- `is-main="true"`: Campo principal de patrimônio
- `value`: Valor formatado (ex: "1.000.000")

#### Itens de Patrimônio Interativo
```html
<div class="patrimonio_interactive_item" 
     ativo-product="CDB" 
     ativo-category="Renda Fixa">
  
  <!-- Estado Ativo -->
  <div class="active-produto-item">
    <input data-currency="true" 
           input-settings="receive" 
           class="currency-input individual"
           value="500.000">
    
    <range-slider min="0" max="1" value="0.5" step="0.01" class="slider">
    </range-slider>
    
    <p class="porcentagem-calculadora">50%</p>
  </div>
  
  <!-- Estado Inativo -->
  <div class="disabled-produto-item" style="display: none;">
    <!-- Controles para ativar o produto -->
  </div>
</div>
```

**Atributos Críticos:**
- `ativo-product`: Nome do produto (fonte de verdade)
- `ativo-category`: Categoria do investimento (fonte de verdade)
- `.active-produto-item`: Indica produto selecionado
- `.disabled-produto-item`: Indica produto não selecionado

### 1.2 Estados dos Elementos

#### Estado Ativo
```css
.patrimonio_interactive_item .active-produto-item {
  display: block;
}
.patrimonio_interactive_item .disabled-produto-item {
  display: none;
}
```

#### Estado Inativo
```css
.patrimonio_interactive_item .active-produto-item {
  display: none;
}
.patrimonio_interactive_item .disabled-produto-item {
  display: block;
}
```

---

## 2. Transformações de Dados

### 2.1 Fluxo de Transformação

```
DOM Elements
    ↓ (getAttribute, querySelector)
Raw Data Collection
    ↓ (parsing, formatting)
Structured Data Objects
    ↓ (validation, calculation)
System-Specific Formats
    ↓ (API calls)
External Systems
```

### 2.2 Transformações por Etapa

#### Etapa 1: Coleta Raw
```javascript
// DOM → Raw Data
const rawData = {
  patrimonioInput: "1.000.000",           // String do input
  activeItems: NodeList[3],               // Lista de elementos DOM
  sliderValues: ["0.3", "0.5", "0.2"],   // Strings dos sliders
  currencyInputs: ["300.000", "500.000", "200.000"] // Strings dos inputs
}
```

#### Etapa 2: Parsing e Estruturação
```javascript
// Raw Data → Structured Data
const structuredData = {
  patrimonio: 1000000,                    // Number
  patrimonioFormatted: "R$ 1.000.000",   // String formatada
  ativosEscolhidos: [                     // Array de objetos
    { product: "CDB", category: "Renda Fixa" },
    { product: "Ações", category: "Fundo de Investimento" },
    { product: "ETF", category: "Internacional" }
  ],
  alocacao: {                             // Objeto com cálculos
    "Renda Fixa-CDB": {
      value: 300000,
      percentage: 30,
      category: "Renda Fixa",
      product: "CDB"
    }
  }
}
```

#### Etapa 3: Formatação para Sistemas
```javascript
// Structured Data → System Formats

// Para Typebot (String legível)
const typebotFormat = {
  patrimonio: "R$ 1.000.000",
  ativos: "CDB (Renda Fixa), Ações (Fundo de Investimento), ETF (Internacional)",
  totalAlocado: "R$ 1.000.000"
}

// Para Supabase (Dados estruturados)
const supabaseFormat = {
  patrimonio: 1000000,
  ativos_escolhidos: [
    { product: "CDB", category: "Renda Fixa" }
  ],
  alocacao: {
    "Renda Fixa-CDB": { value: 300000, percentage: 30 }
  }
}

// Para Salesforce (JSON strings)
const salesforceFormat = {
  Patrimonio__c: 1000000,
  Ativos_Escolhidos__c: '[{"product":"CDB","category":"Renda Fixa"}]',
  Alocacao__c: '{"Renda Fixa-CDB":{"value":300000,"percentage":30}}'
}
```

---

## 3. Estruturas por Sistema

### 3.1 Typebot Variables

#### Estrutura Completa
```javascript
const typebotVariables = {
  // Dados de contato (preenchidos pelo usuário no Typebot)
  nome: "",                               // String vazia inicialmente
  email: "",                              // String vazia inicialmente
  telefone: "",                           // String vazia inicialmente
  
  // Dados da calculadora (pré-preenchidos)
  patrimonio: "R$ 1.000.000",            // String formatada
  ativos: "CDB (Renda Fixa), Ações (Fundo de Investimento)", // String legível
  totalAlocado: "R$ 1.000.000",          // String formatada
  
  // Metadados
  source: "webflow_calculator"           // String identificadora
}
```

#### Regras de Formatação
- **patrimonio**: Sempre formato "R$ X.XXX.XXX"
- **ativos**: Formato "Produto (Categoria), Produto (Categoria)"
- **totalAlocado**: Sempre formato "R$ X.XXX.XXX"
- **Campos de contato**: Sempre strings vazias inicialmente

### 3.2 Supabase Schema

#### Tabela: calculator_submissions
```sql
CREATE TABLE calculator_submissions (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE,
  
  -- Dados financeiros
  patrimonio NUMERIC NOT NULL,
  total_alocado NUMERIC DEFAULT 0,
  percentual_alocado NUMERIC DEFAULT 0,
  patrimonio_restante NUMERIC DEFAULT 0,
  
  -- Dados de investimento
  ativos_escolhidos JSONB,               -- Array de {product, category}
  alocacao JSONB,                        -- Objeto detalhado de alocação
  
  -- Dados de contato
  nome TEXT,
  email TEXT,
  telefone TEXT,
  
  -- Metadados
  user_agent TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Integração Typebot
  typebot_session_id TEXT,
  typebot_result_id TEXT
);
```

#### Índices Recomendados
```sql
CREATE INDEX idx_calculator_submissions_session_id ON calculator_submissions(session_id);
CREATE INDEX idx_calculator_submissions_email ON calculator_submissions(email);
CREATE INDEX idx_calculator_submissions_submitted_at ON calculator_submissions(submitted_at);
CREATE INDEX idx_calculator_submissions_typebot_session ON calculator_submissions(typebot_session_id);
```

#### Estrutura JSONB: ativos_escolhidos
```json
[
  {
    "product": "CDB",
    "category": "Renda Fixa"
  },
  {
    "product": "Ações",
    "category": "Fundo de Investimento"
  },
  {
    "product": "ETF",
    "category": "Internacional"
  }
]
```

#### Estrutura JSONB: alocacao
```json
{
  "Renda Fixa-CDB": {
    "value": 300000,
    "percentage": 30,
    "category": "Renda Fixa",
    "product": "CDB"
  },
  "Fundo de Investimento-Ações": {
    "value": 500000,
    "percentage": 50,
    "category": "Fundo de Investimento",
    "product": "Ações"
  },
  "Internacional-ETF": {
    "value": 200000,
    "percentage": 20,
    "category": "Internacional",
    "product": "ETF"
  }
}
```

### 3.3 Salesforce Lead Object

#### Campos Padrão
```javascript
const standardFields = {
  FirstName: "João",                      // String
  LastName: "Silva",                      // String (obrigatório)
  Email: "joao@email.com",               // Email
  Phone: "+5511999999999",               // Phone
  Company: "Reino Capital - Calculadora", // String (obrigatório)
  LeadSource: "Website Calculator"        // Picklist
}
```

#### Campos Personalizados
```javascript
const customFields = {
  // Dados financeiros
  Patrimonio__c: 1000000,                // Number(18,2)
  Total_Alocado__c: 1000000,            // Number(18,2)
  Percentual_Alocado__c: 100,           // Number(5,2)
  Patrimonio_Restante__c: 0,            // Number(18,2)
  
  // Dados de investimento (JSON strings)
  Ativos_Escolhidos__c: '[{"product":"CDB","category":"Renda Fixa"}]', // Long Text Area(32768)
  Alocacao__c: '{"Renda Fixa-CDB":{"value":300000}}',                  // Long Text Area(32768)
  
  // Metadados
  Session_ID__c: "calc_1704374400000_abc123",    // Text(255)
  User_Agent__c: "Mozilla/5.0...",               // Long Text Area(32768)
  Page_URL__c: "https://reinocapital.webflow.io/taxas-app", // URL(255)
  Submitted_At__c: "2025-01-04T14:30:00.000Z",   // DateTime
  
  // Integração Typebot
  Typebot_Session_ID__c: "typebot_session_123",  // Text(255)
  Typebot_Result_ID__c: "result_456"             // Text(255)
}
```

---

## 4. Validações e Regras

### 4.1 Regras de Negócio

#### Patrimônio
- **Mínimo**: R$ 1.000 (mil reais)
- **Máximo**: R$ 999.999.999 (novecentos e noventa e nove milhões)
- **Formato**: Sempre numérico positivo

#### Alocação
- **Total**: Deve somar exatamente 100%
- **Mínimo por ativo**: 1%
- **Máximo por ativo**: 100%
- **Valor mínimo**: R$ 1.000 por ativo

#### Ativos Selecionados
- **Mínimo**: 1 ativo
- **Máximo**: Todos os ativos disponíveis
- **Obrigatório**: Pelo menos um ativo com valor > 0

### 4.2 Validações Técnicas

#### Validação de Dados
```javascript
function validateFormData(formData) {
  const errors = [];

  // Patrimônio
  if (!formData.patrimonio || formData.patrimonio <= 0) {
    errors.push('Patrimônio deve ser maior que zero');
  }
  if (formData.patrimonio < 1000) {
    errors.push('Patrimônio mínimo é R$ 1.000');
  }

  // Ativos selecionados
  if (!formData.ativosEscolhidos || formData.ativosEscolhidos.length === 0) {
    errors.push('Pelo menos um ativo deve ser selecionado');
  }

  // Alocação
  if (formData.percentualAlocado && formData.percentualAlocado < 100) {
    errors.push('Patrimônio deve estar 100% alocado');
  }

  // Estrutura dos ativos
  formData.ativosEscolhidos.forEach((asset, index) => {
    if (!asset.product || !asset.category) {
      errors.push(`Ativo ${index + 1} tem estrutura inválida`);
    }
    if (asset.product.includes('|')) {
      errors.push(`Ativo ${index + 1} tem formato incorreto (pipe encontrado)`);
    }
    if (asset.category === 'Outros' && asset.product.includes('|')) {
      errors.push(`Ativo ${index + 1} tem categoria genérica incorreta`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

#### Validação de Formato
```javascript
function validateDataFormat(data) {
  const checks = {
    // Verificar se ativos_escolhidos é array
    isArrayFormat: Array.isArray(data.ativos_escolhidos),
    
    // Verificar se não tem pipe separators
    noPipeSeparators: !JSON.stringify(data.ativos_escolhidos).includes('|'),
    
    // Verificar se categorias não são "Outros"
    noGenericCategories: data.ativos_escolhidos.every(asset => asset.category !== 'Outros'),
    
    // Verificar se alocacao é objeto
    isObjectFormat: typeof data.alocacao === 'object' && data.alocacao !== null,
    
    // Verificar consistência entre ativos_escolhidos e alocacao
    consistentData: data.ativos_escolhidos.every(asset => {
      const key = `${asset.category}-${asset.product}`;
      return data.alocacao.hasOwnProperty(key);
    })
  };

  return {
    isValid: Object.values(checks).every(check => check === true),
    checks
  };
}
```

---

## 5. Exemplos Práticos

### 5.1 Cenário Completo: Usuário com 3 Ativos

#### Entrada do Usuário
- **Patrimônio**: R$ 1.000.000
- **Ativos selecionados**:
  - CDB (Renda Fixa): R$ 400.000 (40%)
  - Ações (Fundo de Investimento): R$ 350.000 (35%)
  - ETF (Internacional): R$ 250.000 (25%)

#### Dados Coletados do DOM
```javascript
const domData = {
  patrimonioInput: "1.000.000",
  activeItems: [
    {
      element: HTMLDivElement,
      product: "CDB",
      category: "Renda Fixa",
      value: "400.000",
      percentage: "0.4"
    },
    {
      element: HTMLDivElement,
      product: "Ações",
      category: "Fundo de Investimento", 
      value: "350.000",
      percentage: "0.35"
    },
    {
      element: HTMLDivElement,
      product: "ETF",
      category: "Internacional",
      value: "250.000", 
      percentage: "0.25"
    }
  ]
}
```

#### Dados Estruturados
```javascript
const structuredData = {
  timestamp: "2025-01-04T14:30:00.000Z",
  patrimonio: 1000000,
  patrimonioFormatted: "R$ 1.000.000",
  ativosEscolhidos: [
    { product: "CDB", category: "Renda Fixa" },
    { product: "Ações", category: "Fundo de Investimento" },
    { product: "ETF", category: "Internacional" }
  ],
  alocacao: {
    "Renda Fixa-CDB": {
      value: 400000,
      percentage: 40,
      category: "Renda Fixa",
      product: "CDB"
    },
    "Fundo de Investimento-Ações": {
      value: 350000,
      percentage: 35,
      category: "Fundo de Investimento",
      product: "Ações"
    },
    "Internacional-ETF": {
      value: 250000,
      percentage: 25,
      category: "Internacional",
      product: "ETF"
    }
  },
  totalAlocado: 1000000,
  percentualAlocado: 100,
  patrimonioRestante: 0,
  session_id: "calc_1704374400000_abc123"
}
```

#### Variáveis do Typebot
```javascript
const typebotVariables = {
  nome: "",
  email: "",
  telefone: "",
  patrimonio: "R$ 1.000.000",
  ativos: "CDB (Renda Fixa), Ações (Fundo de Investimento), ETF (Internacional)",
  totalAlocado: "R$ 1.000.000",
  source: "webflow_calculator"
}
```

#### Dados Salvos no Supabase
```javascript
const supabaseRecord = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  patrimonio: 1000000,
  ativos_escolhidos: [
    { product: "CDB", category: "Renda Fixa" },
    { product: "Ações", category: "Fundo de Investimento" },
    { product: "ETF", category: "Internacional" }
  ],
  alocacao: {
    "Renda Fixa-CDB": {
      value: 400000,
      percentage: 40,
      category: "Renda Fixa",
      product: "CDB"
    },
    "Fundo de Investimento-Ações": {
      value: 350000,
      percentage: 35,
      category: "Fundo de Investimento",
      product: "Ações"
    },
    "Internacional-ETF": {
      value: 250000,
      percentage: 25,
      category: "Internacional",
      product: "ETF"
    }
  },
  total_alocado: 1000000,
  percentual_alocado: 100,
  patrimonio_restante: 0,
  nome: "João Silva",
  email: "joao@email.com",
  telefone: "+5511999999999",
  session_id: "calc_1704374400000_abc123",
  submitted_at: "2025-01-04T14:30:00.000Z",
  typebot_session_id: "typebot_session_123",
  typebot_result_id: "result_456"
}
```

#### Lead Criado no Salesforce
```javascript
const salesforceLead = {
  FirstName: "João",
  LastName: "Silva",
  Email: "joao@email.com",
  Phone: "+5511999999999",
  Company: "Reino Capital - Calculadora",
  LeadSource: "Website Calculator",
  Patrimonio__c: 1000000,
  Total_Alocado__c: 1000000,
  Percentual_Alocado__c: 100,
  Patrimonio_Restante__c: 0,
  Ativos_Escolhidos__c: '[{"product":"CDB","category":"Renda Fixa"},{"product":"Ações","category":"Fundo de Investimento"},{"product":"ETF","category":"Internacional"}]',
  Alocacao__c: '{"Renda Fixa-CDB":{"value":400000,"percentage":40,"category":"Renda Fixa","product":"CDB"},"Fundo de Investimento-Ações":{"value":350000,"percentage":35,"category":"Fundo de Investimento","product":"Ações"},"Internacional-ETF":{"value":250000,"percentage":25,"category":"Internacional","product":"ETF"}}',
  Session_ID__c: "calc_1704374400000_abc123",
  Submitted_At__c: "2025-01-04T14:30:00.000Z",
  Typebot_Session_ID__c: "typebot_session_123",
  Typebot_Result_ID__c: "result_456"
}
```

### 5.2 Cenário de Erro: Dados Inconsistentes

#### Problema: Formato Antigo (Incorreto)
```javascript
const incorrectData = {
  ativosEscolhidos: [
    { product: "renda fixa|cdb", category: "Outros" },
    { product: "fundo de investimento|ações", category: "Outros" }
  ]
}
```

#### Validação
```javascript
const validation = validateDataFormat(incorrectData);
console.log(validation);
// {
//   isValid: false,
//   checks: {
//     isArrayFormat: true,
//     noPipeSeparators: false,      // ❌ Falhou
//     noGenericCategories: false,   // ❌ Falhou
//     isObjectFormat: true,
//     consistentData: false         // ❌ Falhou
//   }
// }
```

#### Correção Automática
```javascript
function fixIncorrectFormat(incorrectData) {
  return incorrectData.ativosEscolhidos.map(asset => {
    if (asset.product.includes('|')) {
      const [category, product] = asset.product.split('|');
      return {
        product: product.trim(),
        category: category.trim()
      };
    }
    return asset;
  });
}

const correctedData = fixIncorrectFormat(incorrectData);
console.log(correctedData);
// [
//   { product: "cdb", category: "renda fixa" },
//   { product: "ações", category: "fundo de investimento" }
// ]
```

---

## Conclusão

Esta documentação detalha todas as estruturas de dados utilizadas no sistema da calculadora Reino Capital, desde a coleta no DOM até o armazenamento nos sistemas externos. As transformações são bem definidas e validadas em cada etapa, garantindo a integridade e consistência dos dados em todo o fluxo.
