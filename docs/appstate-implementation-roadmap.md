# AppState Implementation Roadmap - Reino Capital

## 📊 **STATUS ATUAL (6/11 TASKS COMPLETAS - 55%)**

### ✅ **COMPLETADO:**

- [x] **ReinoAppState Base** - Módulo central criado com padrão IIFE
- [x] **Sistema de Eventos Padronizado** - Contratos consistentes implementados
- [x] **Migração Patrimony-Sync** - Primeira integração com AppState funcionando
- [x] **Migração Asset-Selection-Filter** - Segunda integração com AppState funcionando
- [x] **Ordem Correta no index.ts** - AppState carregando primeiro
- [x] **Migração Rotation-Index-Controller** - Terceira integração com AppState funcionando

### 🔄 **PENDENTE (5 TASKS RESTANTES):**

---

## 🎯 **PRÓXIMAS TASKS PRIORITÁRIAS**

### **1. ✅ MIGRAR ROTATION-INDEX-CONTROLLER** ⭐ **COMPLETADO**

**UUID:** `3APMGAHwZ2HjfvLeYn4dS6`

**✅ IMPLEMENTADO COM SUCESSO:**

- ✅ Integração com AppState no constructor
- ✅ Getter/setter inteligentes para `currentIndex`
- ✅ Sincronização bidirecional (Controller ↔ AppState)
- ✅ Cálculos passados automaticamente para AppState
- ✅ Compatibilidade com código existente mantida
- ✅ Eventos padronizados implementados
- ✅ Listener para mudanças externas do AppState

**Testes realizados:**

- ✅ Mudança via controller sincroniza com AppState
- ✅ Mudança via AppState sincroniza com controller
- ✅ Cálculos são passados corretamente
- ✅ Eventos são disparados com source tracking

---

### **2. ATUALIZAR MÓDULOS DE INTEGRAÇÃO** ⭐ **ALTA PRIORIDADE**

**UUID:** `vDioCQuNTwctRyzjpoHAdT`

**Objetivo:** Modificar supabase-integration.js e salesforce-integration.js para consumir dados do AppState

**Arquivos a modificar:**

- `src/modules/supabase-integration.js`
- `src/modules/salesforce-integration.js`

**Implementação:**

1. Remover acesso direto a módulos individuais
2. Usar apenas `window.ReinoAppState.getStateSnapshot()`
3. Implementar event listeners para capturar mudanças
4. Seguir padrão event-driven conforme regra `supabase-data-capture-pattern.md`

**Exemplo de refatoração:**

```javascript
// ❌ ANTES (acesso direto)
const indiceGiro = window.ReinoRotationIndexController?.getCurrentIndex() || 2;
const patrimonio = window.patrimonySystemInstance?.getMainValue() || 0;

// ✅ DEPOIS (via AppState)
const snapshot = window.ReinoAppState.getStateSnapshot();
const indiceGiro = snapshot.rotationIndex.value;
const patrimonio = snapshot.patrimonio.value;
```

---

### **3. IMPLEMENTAR SISTEMA DE VALIDAÇÃO** 🔧 **MÉDIA PRIORIDADE**

**UUID:** `w3gSCt7Wohs4n7Ss4tMeju`

**Objetivo:** Criar validadores para garantir consistência do AppState

**Arquivo a criar:**

- `src/modules/reino-app-state-validators.js`

**Validações necessárias:**

1. **Alocações somam 100%** (ou menos)
2. **Ativos selecionados correspondem às alocações**
3. **Patrimônio restante não é negativo**
4. **Índice de giro está no range válido (1-4)**
5. **Valores numéricos são válidos**

**Implementação:**

```javascript
class ReinoAppStateValidators {
  validateAllocations(state) {
    const total = Object.values(state.alocacoes).reduce((sum, val) => sum + val, 0);
    return {
      isValid: total <= state.patrimonio.value,
      errors: total > state.patrimonio.value ? ['Total allocation exceeds patrimony'] : []
    };
  }
}
```

---

### **4. CRIAR TESTES DE INTEGRAÇÃO** 🧪 **MÉDIA PRIORIDADE**

**UUID:** `uq5gX4vRMf65HWXznYhTpo`

**Objetivo:** Implementar testes para verificar fluxo completo

**Arquivo a expandir:**

- `src/modules/appstate-integration-test.js` (já existe, expandir)

**Testes a adicionar:**

1. **Teste de fluxo completo:** patrimônio → seleção → alocação → cálculos
2. **Teste de sincronização UI:** mudanças no AppState refletem na UI
3. **Teste de integrações:** Supabase/Salesforce recebem dados corretos
4. **Teste de validação:** validadores funcionam corretamente
5. **Teste de eventos:** todos os eventos são disparados corretamente

---

### **5. DOCUMENTAR API DO APPSTATE** 📚 **BAIXA PRIORIDADE**

**UUID:** `aDSr3wKn4fEdL6iV5q3PxZ`

**Objetivo:** Criar documentação completa da API do AppState

**Arquivo a criar:**

- `docs/appstate-api-documentation.md`

**Conteúdo necessário:**

1. **Métodos públicos** com exemplos
2. **Eventos emitidos** com payloads
3. **Padrões de uso** para desenvolvedores
4. **Exemplos práticos** de integração
5. **Troubleshooting** comum

---

## 🛠️ **ARQUIVOS PRINCIPAIS JÁ IMPLEMENTADOS**

### **AppState Core:**

- ✅ `src/modules/reino-app-state.js` - Módulo principal
- ✅ `src/modules/reino-event-contracts.js` - Contratos de eventos
- ✅ `src/modules/appstate-integration-test.js` - Testes básicos

### **Módulos Migrados:**

- ✅ `src/modules/patrimony-sync.js` - Integrado com AppState
- ✅ `src/modules/asset-selection-filter.js` - Integrado com AppState
- ✅ `src/modules/rotation-index-controller.js` - Integrado com AppState

### **Configuração:**

- ✅ `src/index.ts` - Ordem correta de imports

---

## 🎮 **COMANDOS ÚTEIS PARA DESENVOLVIMENTO**

### **Controle de Logs:**

```javascript
// Desabilitar spam de logs
window.ReinoAppStateTest.setLogLevel('off')

// Logs básicos apenas
window.ReinoAppStateTest.setLogLevel('basic')

// Todos os logs (debug)
window.ReinoAppStateTest.setLogLevel('verbose')
```

### **Testes e Debug:**

```javascript
// Rodar todos os testes
window.ReinoAppStateTest.runTests()

// Verificar estado atual
window.ReinoAppStateTest.getAppStateSnapshot()

// Teste manual de patrimônio
window.ReinoAppStateTest.testPatrimony(1000000)

// Teste manual de seleção de ativos
window.ReinoAppStateTest.testAssetSelection('Renda Fixa', 'CDB')

// Verificar dependências
window.ReinoAppStateTest.checkDependencies()
```

### **Acesso Direto ao AppState:**

```javascript
// Estado completo
window.ReinoAppState.getStateSnapshot()

// Patrimônio
window.ReinoAppState.getPatrimonio()
window.ReinoAppState.setPatrimonio(1000000, 'manual')

// Ativos selecionados
window.ReinoAppState.getSelectedAssets()
window.ReinoAppState.addSelectedAsset('Renda Fixa', 'CDB', 'manual')

// Alocações
window.ReinoAppState.getAllAllocations()
window.ReinoAppState.setAllocation('Renda Fixa', 'CDB', 500000, 'manual')

// Índice de giro
window.ReinoAppState.getRotationIndex()
window.ReinoAppState.setRotationIndex(3, null, 'manual')
```

---

## 📋 **CHECKLIST PARA PRÓXIMO DESENVOLVEDOR**

### **Antes de começar:**

- [ ] Ler `docs/iife-architecture-recommendations.md`
- [ ] Entender padrão IIFE obrigatório
- [ ] Verificar regras em `.augment/rules/`
- [ ] Testar AppState atual: `window.ReinoAppStateTest.runTests()`

### **Para cada migração:**

- [ ] Seguir padrão de aguardar AppState: `waitForAppState()`
- [ ] Implementar getter/setter inteligentes
- [ ] Manter compatibilidade com código existente
- [ ] Usar eventos padronizados do `reino-event-contracts.js`
- [ ] Adicionar testes na `appstate-integration-test.js`
- [ ] Testar no console antes de finalizar

### **Padrões obrigatórios:**

- [ ] Módulos em IIFE: `(function() { 'use strict'; ... })()`
- [ ] Classes globais: `window.Reino<ClassName>`
- [ ] Source tracking: sempre passar `source` nos métodos
- [ ] Event-driven: usar eventos ao invés de acesso direto
- [ ] Fallback: sempre ter modo legacy para compatibilidade

---

## 🚀 **BENEFÍCIOS JÁ ALCANÇADOS**

- ✅ **Estado Centralizado** - Patrimônio e seleção de ativos têm fonte única
- ✅ **Eventos Consistentes** - Payloads padronizados e documentados
- ✅ **Debug Inteligente** - Sistema de logging com throttling
- ✅ **Compatibilidade** - Código existente continua funcionando
- ✅ **Ordem de Inicialização** - AppState carrega antes dos controllers
- ✅ **Testes Automatizados** - Validação contínua do funcionamento

---

## 📞 **SUPORTE**

- **Documentação:** `docs/iife-architecture-recommendations.md`
- **Regras:** `.augment/rules/` (especialmente `javascript-module-pattern.md`)
- **Testes:** Console do browser com comandos acima
- **Debug:** `window.ReinoAppStateTest.setLogLevel('verbose')`

**Próxima task recomendada:** Atualizar módulos de integração (UUID: vDioCQuNTwctRyzjpoHAdT)
