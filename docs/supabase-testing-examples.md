# Supabase Integration Testing Examples

## Console Testing Commands

### 1. Verificar Status da Integração

```javascript
// Verificar se o módulo está carregado
console.log('Supabase Integration:', window.ReinoSupabaseIntegration);

// Verificar status
console.log('Status:', window.ReinoSupabaseIntegration.getStatus());
```

### 2. Testar Submissão Direta

```javascript
// Dados de exemplo da calculadora
const testFormData = {
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
    },
    "Fundo de Investimento-Ações": {
      value: 50000,
      percentage: 50,
      category: "Fundo de Investimento",
      product: "Ações"
    }
  },
  totalAlocado: 100000,
  percentualAlocado: 100,
  patrimonioRestante: 0,
  session_id: "test_session_" + Date.now(),
  user_agent: navigator.userAgent,
  page_url: window.location.href
};

// Testar submissão
window.ReinoSupabaseIntegration.saveCalculatorSubmission(testFormData)
  .then(result => {
    console.log('✅ Teste de submissão bem-sucedido:', result);
  })
  .catch(error => {
    console.error('❌ Erro no teste:', error);
  });
```

### 3. Testar Submissão com Typebot

```javascript
// Dados do Typebot simulados
const testTypebotData = {
  nome: "João Silva Teste",
  email: "joao.teste@email.com",
  telefone: "(11) 99999-9999",
  sessionId: "typebot_test_" + Date.now(),
  resultId: "result_test_" + Date.now()
};

// Testar submissão com Typebot
window.ReinoSupabaseIntegration.saveCalculatorSubmission(testFormData, testTypebotData)
  .then(result => {
    console.log('✅ Teste com Typebot bem-sucedido:', result);
  })
  .catch(error => {
    console.error('❌ Erro no teste com Typebot:', error);
  });
```

### 4. Testar Validação

```javascript
// Dados inválidos para testar validação
const invalidData = {
  patrimonio: 0, // Inválido
  ativosEscolhidos: [], // Inválido
  alocacao: {}
};

const validation = window.ReinoSupabaseIntegration.validateFormData(invalidData);
console.log('Validação (deve falhar):', validation);
// Esperado: { isValid: false, errors: [...] }
```

### 5. Testar Histórico

```javascript
// Buscar histórico por session_id
const sessionId = "test_session_123"; // Use um session_id real
window.ReinoSupabaseIntegration.getSubmissionHistory(sessionId)
  .then(result => {
    console.log('📊 Histórico encontrado:', result);
  })
  .catch(error => {
    console.error('❌ Erro ao buscar histórico:', error);
  });
```

## Verificação de Dados no Supabase

### Query SQL para Verificar Submissões

```sql
-- Verificar últimas submissões
SELECT 
  id,
  nome,
  email,
  patrimonio,
  total_alocado,
  percentual_alocado,
  submitted_at,
  typebot_session_id IS NOT NULL as has_typebot_data
FROM calculator_submissions 
ORDER BY submitted_at DESC 
LIMIT 10;
```

### Query para Verificar Estrutura de Dados

```sql
-- Verificar estrutura dos ativos escolhidos
SELECT 
  id,
  ativos_escolhidos,
  jsonb_array_length(ativos_escolhidos) as total_ativos
FROM calculator_submissions 
WHERE ativos_escolhidos IS NOT NULL
ORDER BY submitted_at DESC 
LIMIT 5;
```

### Query para Verificar Alocações

```sql
-- Verificar estrutura das alocações
SELECT 
  id,
  alocacao,
  jsonb_object_keys(alocacao) as allocation_keys
FROM calculator_submissions 
WHERE alocacao IS NOT NULL
ORDER BY submitted_at DESC 
LIMIT 5;
```

## Debugging no Browser

### 1. Ativar Debug Mode

Adicione `?debug=true` na URL para ver logs detalhados:
```
https://reinocapital.webflow.io/taxas-app?debug=true
```

### 2. Monitorar Network Tab

1. Abra DevTools (F12)
2. Vá para a aba Network
3. Filtre por "supabase" ou "dwpsyresppubuxbrwrkc"
4. Execute uma submissão
5. Verifique as requisições POST para a API do Supabase

### 3. Verificar Console Logs

Com debug ativo, você verá logs como:
```
🗄️ [SupabaseIntegration] ✅ Supabase integration initialized
📝 [FormSubmission] Send button clicked
🗄️ [SupabaseIntegration] 📤 Sending data to Supabase: {...}
🗄️ [SupabaseIntegration] ✅ Data saved to Supabase successfully
```

## Cenários de Teste

### Cenário 1: Submissão Completa com Typebot
1. Preencher calculadora com valores válidos
2. Alocar 100% do patrimônio
3. Clicar em "Enviar"
4. Completar Typebot com nome e email
5. Verificar dados no Supabase

### Cenário 2: Submissão Direta (sem Typebot)
1. Desabilitar Typebot temporariamente
2. Preencher calculadora
3. Clicar em "Enviar"
4. Verificar dados no Supabase (sem nome/email)

### Cenário 3: Validação de Erros
1. Tentar enviar com patrimônio = 0
2. Tentar enviar sem ativos selecionados
3. Tentar enviar com alocação < 100%
4. Verificar mensagens de erro

### Cenário 4: Falha de Conexão
1. Desconectar internet
2. Tentar submissão
3. Verificar tratamento de erro
4. Reconectar e tentar novamente

## Métricas de Sucesso

### Indicadores Positivos
- ✅ Status `ready: true`
- ✅ Submissões aparecem no Supabase
- ✅ Dados mapeados corretamente
- ✅ Typebot data incluída quando disponível
- ✅ Validação funcionando
- ✅ Erros tratados graciosamente

### Indicadores de Problemas
- ❌ Status `ready: false`
- ❌ Erros 400/500 nas requisições
- ❌ Dados malformados no banco
- ❌ Campos obrigatórios nulos
- ❌ Timeouts ou falhas de conexão
