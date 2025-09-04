# Debug Guide - Typebot Integration Issues

## Problema Atual

1. **Nome e email chegam como null no Supabase**
2. **Dados da calculadora não chegam no Typebot**
3. **handleTypebotCompletion recebe dados vazios `{}`**

## Logs Atuais Observados

```
📊 [TypebotIntegration] Collected form data: {nome: '', email: '', telefone: '', patrimonio: 'R$ 1.000.000', ...}
🤖 [TypebotIntegration] handleTypebotCompletion called with data: {}
📝 [TypebotIntegration] Extracted user info from Typebot: {nome: null, email: null, telefone: null}
```

## Testes para Executar

### 1. Verificar se postMessage está chegando

Abra o console e execute:

```javascript
// Teste 1: Verificar se há mensagens chegando
window.addEventListener('message', (event) => {
  console.log('🔍 DEBUG: Message received:', event.data);
});
```

### 2. Verificar se o evento customizado funciona

```javascript
// Teste 2: Simular evento customizado
document.dispatchEvent(new CustomEvent('typebotEnhancedCompletion', {
  detail: {
    nome: 'Teste Nome',
    email: 'teste@email.com',
    completed: true
  }
}));
```

### 3. Verificar dados da calculadora

```javascript
// Teste 3: Verificar se dados estão sendo coletados
if (window.ReinoButtonCoordinator) {
  const data = window.ReinoButtonCoordinator.collectFormData();
  console.log('📊 Calculator data:', data);
}
```

### 4. Verificar se Typebot está recebendo dados

```javascript
// Teste 4: Verificar currentFormData no Typebot
if (window.ReinoTypebotIntegrationSystem) {
  console.log('🤖 Current form data:', window.ReinoTypebotIntegrationSystem.currentFormData);
  console.log('🤖 Status:', window.ReinoTypebotIntegrationSystem.getStatus());
}
```

## Script Typebot Atualizado

Use este script no Typebot (substitua o atual):

```javascript
// ✅ ENHANCED TYPEBOT SCRIPT - VERSÃO DEBUG
console.log('=== ENHANCED TYPEBOT COMPLETION SCRIPT ===');
console.log('Nome variável:', {{nome}});
console.log('Email variável:', {{email}});

// Prepare completion data
const completionData = {
  nome: {{nome}},
  email: {{email}},
  completed: true,
  timestamp: new Date().toISOString(),
  method: 'enhanced-script-block'
};

console.log('Dados de conclusão preparados:', completionData);

// 1. Send via postMessage
console.log('📤 Sending postMessage...');
window.parent.postMessage({
  type: 'typebot-completion',
  data: completionData
}, '*');

// 2. Send via custom event
console.log('📤 Sending custom event...');
try {
  window.parent.document.dispatchEvent(new CustomEvent('typebotEnhancedCompletion', {
    detail: completionData
  }));
  console.log('✅ Custom event dispatched');
} catch (error) {
  console.error('❌ Failed to dispatch custom event:', error);
}

// 3. Direct call to integration system
console.log('📤 Trying direct call...');
try {
  if (window.parent.ReinoTypebotIntegrationSystem) {
    window.parent.ReinoTypebotIntegrationSystem.handleTypebotCompletion(completionData);
    console.log('✅ Direct call successful');
  } else {
    console.log('❌ ReinoTypebotIntegrationSystem not found');
  }
} catch (error) {
  console.error('❌ Direct call failed:', error);
}

// Rest of the script...
setTimeout(() => {
  console.log('🔄 Forcing navigation to section 5...');
  // ... navigation code
}, 500);
```

## Possíveis Causas e Soluções

### Causa 1: postMessage não está chegando
**Solução**: Usar evento customizado em vez de postMessage

### Causa 2: currentFormData está vazio
**Solução**: Verificar se `startTypebotFlow` está sendo chamado com dados

### Causa 3: Dados da calculadora não estão sendo coletados
**Solução**: Verificar se `button-coordinator.js` está funcionando

### Causa 4: Callback não está registrado
**Solução**: Verificar se `form-submission.js` está registrando o callback

## Próximos Passos

1. **Execute os testes acima**
2. **Substitua o script do Typebot**
3. **Verifique os logs no console**
4. **Reporte quais testes funcionaram/falharam**

## Logs Esperados (Funcionando)

```
📊 [TypebotIntegration] Collected form data: {patrimonio: 1000000, ativosEscolhidos: [...], ...}
📬 [TypebotIntegration] ALL postMessage received: {type: 'typebot-completion', data: {nome: 'Lucas', email: 'lucas@email.com'}}
🎯 [TypebotIntegration] typebot-completion message detected
📝 [TypebotIntegration] Extracted user info from Typebot: {nome: 'Lucas', email: 'lucas@email.com'}
📝 [FormSubmission] Processing Typebot completion data
✅ [FormSubmission] Data saved to Supabase via Typebot completion
```
