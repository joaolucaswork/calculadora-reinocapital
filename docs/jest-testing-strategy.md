# Jest Testing Strategy - Reino Capital Calculator

## Análise dos Testes Atuais

### Categorização dos Arquivos em `src/modules/dev/`

#### 🧪 **Testes Unitários Puros** (Candidatos para Jest)
- `validators-test.js` - Testa validadores de AppState (lógica pura)
- `test-key-normalization.js` - Testa normalização de chaves
- `calcular-custo-debug.js` - Testa função de cálculo de custo
- `commission-flow-analyzer.js` - Analisa fluxo de comissões (lógica)

#### 🔗 **Testes de Integração** (Precisam do DOM/Browser)
- `appstate-integration-test.js` - Testa integração entre módulos
- `currency-formatting-appstate-test.js` - Testa formatação + AppState
- `resultado-sync-appstate-test.js` - Testa sincronização de resultados
- `commission-integration-test.js` - Testa integração de comissões
- `rotation-integration-test.js` - Testa integração de rotação

#### 🛠️ **Ferramentas de Debug** (Manter como estão)
- `reino-debug-module.js` - Konami code para debug (UX feature)
- `commission-flow-debug.js` - Debug em tempo real
- `commission-quick-test.js` - Teste rápido manual
- `separator-fix-analysis.js` - Análise de separadores

#### ⚠️ **Testes Problemáticos** (Interferem com UX)
- `currency-control-appstate-test.js` - Preenche campos automaticamente
- `commission-final-test.js` - Modifica estado da UI
- `rotation-index-dom-update-test.js` - Altera DOM diretamente

## Estratégia de Implementação

### 1. Nova Estrutura de Pastas

```
src/
├── __tests__/                    # Jest unit tests
│   ├── validators.test.js
│   ├── commission-calculator.test.js
│   ├── key-normalization.test.js
│   └── utils/
├── tests/
│   ├── integration/              # Browser integration tests
│   │   ├── appstate-integration.js
│   │   ├── currency-formatting.js
│   │   └── commission-flow.js
│   └── debug/                    # Debug tools (conditional loading)
│       ├── reino-debug-module.js
│       ├── commission-flow-debug.js
│       └── quick-test.js
└── modules/
    └── dev/                      # Temporary (será removido)
```

### 2. Configuração Jest

#### Instalação
```bash
npm install --save-dev jest @babel/preset-env babel-jest
```

#### jest.config.js
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  collectCoverageFrom: [
    'src/modules/**/*.js',
    '!src/modules/dev/**',
    '!src/tests/**',
  ],
};
```

### 3. Sistema de Flags de Ambiente

#### Implementação no src/index.ts
```typescript
// ==================== 12. DEBUG & TESTING ====================
// Conditional loading based on environment
if (process.env.NODE_ENV === 'development') {
  import('./tests/debug/index.js');
}

if (process.env.ENABLE_INTEGRATION_TESTS === 'true') {
  import('./tests/integration/index.js');
}
```

#### Scripts package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "ENABLE_INTEGRATION_TESTS=true npm run dev",
    "build:production": "NODE_ENV=production npm run build",
    "dev:debug": "NODE_ENV=development ENABLE_INTEGRATION_TESTS=true npm run dev"
  }
}
```

### 4. Refatoração de Testes

#### Exemplo: validators-test.js → __tests__/validators.test.js
```javascript
// Jest unit test (sem DOM, sem browser)
import { ReinoAppStateValidators } from '../modules/reino-app-state-validators.js';

describe('ReinoAppStateValidators', () => {
  let validators;

  beforeEach(() => {
    validators = new ReinoAppStateValidators();
  });

  test('should validate patrimonio correctly', () => {
    expect(validators.validatePatrimonio(1000000)).toBe(true);
    expect(validators.validatePatrimonio(-1000)).toBe(false);
  });

  test('should validate allocation percentages', () => {
    const allocation = { 'Renda Fixa': 0.5, 'Renda Variável': 0.5 };
    expect(validators.validateAllocation(allocation)).toBe(true);
  });
});
```

### 5. Benefícios da Nova Estratégia

#### ✅ **Problemas Resolvidos**
- Testes não interferem mais com UX em produção
- Testes unitários executam rapidamente (sem DOM)
- Separação clara entre tipos de teste
- CI/CD pode executar testes automaticamente

#### 🚀 **Melhorias**
- Cobertura de código automática
- Testes executam em paralelo
- Debugging melhorado com Jest
- Integração com IDEs

#### 🎯 **Ambiente de Produção**
- Zero interferência com usuário final
- Bundle menor (sem testes)
- Performance otimizada
- Debug tools opcionais via flag

## Próximos Passos

1. **Configurar Jest** - Instalar e configurar ambiente
2. **Criar estrutura** - Organizar pastas __tests__/ e tests/
3. **Implementar flags** - Sistema condicional de loading
4. **Refatorar testes** - Converter lógica pura para Jest
5. **Manter integração** - Preservar testes DOM quando necessário
6. **Configurar CI** - Automatizar execução de testes

## Decisões Arquiteturais

### Manter vs Remover
- **Manter**: Debug tools úteis (reino-debug-module.js)
- **Converter**: Testes de lógica pura para Jest
- **Condicional**: Testes de integração via flag
- **Remover**: Testes que interferem com UX

### Compatibilidade
- Jest para testes unitários (Node.js)
- Browser para testes de integração (quando necessário)
- Flags de ambiente para controle granular
- Backward compatibility durante transição
