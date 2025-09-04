# Supabase Integration Guide

## Overview

O novo módulo `supabase-integration.js` centraliza toda a lógica de integração com Supabase, substituindo a implementação anterior que estava espalhada entre diferentes arquivos.

## Principais Melhorias

### 1. **Centralização da Lógica**
- Todo código Supabase agora está em um módulo dedicado
- Mapeamento consistente de dados
- Tratamento de erros padronizado

### 2. **Mapeamento de Dados Corrigido**
- `ativosEscolhidos` → `ativos_escolhidos` (corrigido)
- Campos de contato (nome, email) incluídos corretamente
- Cálculos derivados (total_alocado, percentual_alocado, patrimonio_restante)

### 3. **Fluxo Dual de Submissão**
- **Typebot Flow**: Coleta dados da calculadora → Typebot coleta contato → Salva no Supabase + Salesforce
- **Direct Flow**: Salva dados da calculadora diretamente no Supabase + Salesforce

## Estrutura de Dados

### Dados Coletados da Calculadora
```javascript
{
  patrimonio: 100000,
  ativosEscolhidos: [
    { product: "CDB", category: "Renda Fixa" },
    { product: "Ações", category: "Fundo de Investimento" }
  ],
  alocacao: {
    "Renda Fixa-CDB": {
      value: 50000,
      percentage: 50,
      category: "Renda Fixa",
      product: "CDB"
    }
  },
  totalAlocado: 100000,
  percentualAlocado: 100,
  patrimonioRestante: 0
}
```

### Dados do Typebot (quando disponível)
```javascript
{
  nome: "João Silva",
  email: "joao@email.com",
  telefone: "(11) 99999-9999",
  sessionId: "typebot_session_123",
  resultId: "typebot_result_456"
}
```

### Dados Finais no Supabase
```javascript
{
  patrimonio: 100000,
  ativos_escolhidos: [...],
  alocacao: {...},
  nome: "João Silva",
  email: "joao@email.com",
  user_agent: "Mozilla/5.0...",
  session_id: "calc_1234567890_abc123",
  total_alocado: 100000,
  percentual_alocado: 100,
  patrimonio_restante: 0,
  typebot_session_id: "typebot_session_123",
  typebot_result_id: "typebot_result_456",
  submitted_at: "2024-01-15T10:30:00.000Z"
}
```

## API do Módulo

### Métodos Principais

#### `saveCalculatorSubmission(formData, typebotData = null)`
Salva uma submissão completa da calculadora no Supabase.

```javascript
// Uso com Typebot
const result = await window.ReinoSupabaseIntegration
  .saveCalculatorSubmission(formData, typebotData);

// Uso direto
const result = await window.ReinoSupabaseIntegration
  .saveCalculatorSubmission(formData);
```

#### `getSubmissionHistory(sessionId)`
Busca histórico de submissões por session_id.

#### `updateSubmissionWithTypebot(submissionId, typebotData)`
Atualiza uma submissão existente com dados do Typebot.

#### `validateFormData(formData)`
Valida os dados do formulário antes da submissão.

### Status e Debug

#### `getStatus()`
Retorna o status atual da integração:
```javascript
{
  ready: true,
  hasClient: true,
  tableName: "calculator_submissions",
  debugMode: false
}
```

## Fluxo de Integração

### 1. Inicialização
```javascript
// O módulo aguarda o ReinoSupabase estar disponível
// Auto-inicialização quando DOM estiver pronto
```

### 2. Submissão com Typebot
```
Usuário clica "Enviar" → 
Coleta dados da calculadora → 
Inicia Typebot → 
Typebot coleta contato → 
Salva no Supabase (dados + contato) → 
Envia para Salesforce → 
Sucesso
```

### 3. Submissão Direta
```
Usuário clica "Enviar" → 
Coleta dados da calculadora → 
Salva no Supabase (só dados) → 
Envia para Salesforce → 
Sucesso
```

## Tratamento de Erros

### Cenários Cobertos
1. **Supabase não disponível**: Fallback gracioso
2. **Dados inválidos**: Validação antes da submissão
3. **Falha na conexão**: Retry automático (futuro)
4. **Campos obrigatórios**: Validação específica

### Debug Mode
Ative com `?debug=true` na URL para ver logs detalhados:
```
🗄️ [SupabaseIntegration] ✅ Supabase integration initialized
🗄️ [SupabaseIntegration] 📤 Sending data to Supabase: {...}
🗄️ [SupabaseIntegration] ✅ Data saved to Supabase successfully
```

## Migração da Implementação Anterior

### Removido
- `FormSubmission.prototype.sendToSupabase()` (método antigo)
- Mapeamento inconsistente de dados
- Lógica Supabase espalhada

### Adicionado
- `ReinoSupabaseIntegration` (módulo centralizado)
- Mapeamento consistente de dados
- Validação robusta
- Melhor tratamento de erros

## Próximos Passos

1. **Monitoramento**: Implementar métricas de sucesso/falha
2. **Retry Logic**: Adicionar tentativas automáticas em caso de falha
3. **Offline Support**: Cache local para submissões offline
4. **Performance**: Otimizar queries e indexação
