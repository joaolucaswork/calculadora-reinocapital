# VITEST TESTING STRATEGY - Reino Capital Calculator

## 🎯 Objetivo

Implementar uma estratégia de testes robusta para o calculador Reino Capital usando Vitest, com foco em testes unitários dos módulos de cálculo e validação.

## 📋 Estratégia de Testes

### 1. Tipos de Testes

#### Testes Unitários (Vitest)
- **Módulos de Cálculo**: Testar funções de cálculo de comissão
- **Validadores**: Testar validação de entrada de dados
- **Utilitários**: Testar funções auxiliares
- **Estado da Aplicação**: Testar gerenciamento de estado

#### Testes de Integração (Comentados)
- **Fluxo Completo**: Testar integração entre módulos
- **Eventos**: Testar comunicação entre componentes
- **Persistência**: Testar salvamento de dados

#### Debug Tools (Comentados)
- **Ferramentas de Debug**: Para desenvolvimento e troubleshooting
- **Testes Manuais**: Para validação visual

### 2. Configuração Vitest

#### Instalação
```bash
pnpm add -D vitest @vitest/ui @vitest/coverage-v8 jsdom
```

#### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
    setupFiles: ['src/__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      include: ['src/modules/**/*.js', 'src/config/**/*.js'],
      exclude: ['src/modules/dev/**', 'src/tests/**'],
      thresholds: {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },
    globals: true,
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
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
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:integration": "ENABLE_INTEGRATION_TESTS=true npm run dev",
    "build:production": "NODE_ENV=production npm run build",
    "dev:debug": "NODE_ENV=development ENABLE_INTEGRATION_TESTS=true npm run dev"
  }
}
```

## 🏗️ Estrutura de Arquivos

### Estrutura Atual
```
src/
├── __tests__/                    # Vitest unit tests
│   ├── setup.js                  # Global test setup
│   ├── commission-calculator.test.js  # 15 tests
│   └── validators.test.js         # 13 tests
├── tests/
│   ├── debug/                     # Debug tools (comentados)
│   └── integration/               # Integration tests (comentados)
├── modules/                       # Production modules
└── modules/dev/                   # Legacy tests (organizados)
```

### Setup File (src/__tests__/setup.js)
```javascript
import { vi } from 'vitest';

// Mock global objects
global.window = {
  ReinoAppState: null,
  ReinoEventContracts: null,
  // ... outros mocks
};

global.document = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  // ... outros mocks
};

// Custom matchers
expect.extend({
  toBeValidCurrency(received) {
    const pass = typeof received === 'number' && received >= 0;
    return {
      message: () => pass 
        ? `expected ${received} not to be a valid currency value`
        : `expected ${received} to be a valid currency value (positive number)`,
      pass,
    };
  },
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(global.window).forEach((key) => {
    global.window[key] = null;
  });
});
```

## 🧪 Testes Implementados

### Commission Calculator Tests (15 testes)
- Cálculo de comissão para diferentes categorias
- Validação de tipos de dados
- Integração com rotation index
- Testes de edge cases

### Validators Tests (13 testes)
- Validação de patrimônio
- Validação de alocação
- Validação de ativos selecionados
- Validação de rotation index

## 🚀 Comandos Úteis

```bash
# Executar todos os testes unitários
pnpm test

# Executar testes em modo watch
pnpm test:watch

# Executar testes com coverage
pnpm test:coverage

# Executar testes com UI
pnpm test:ui

# Executar testes de integração (desenvolvimento)
pnpm test:integration

# Build de produção
pnpm build:production

# Desenvolvimento com debug
pnpm dev:debug
```

## 🔄 Migração de Jest para Vitest

### Principais Mudanças

1. **Configuração**: `jest.config.js` → `vitest.config.ts`
2. **Mocks**: `jest.fn()` → `vi.fn()`
3. **Setup**: Importar `vi` do Vitest
4. **Scripts**: Atualizar package.json
5. **Environment**: `@jest-environment` → `@vitest-environment`

### Benefícios do Vitest

- **Performance**: Execução mais rápida
- **ESM Support**: Suporte nativo a ES modules
- **Vite Integration**: Integração com Vite
- **TypeScript**: Melhor suporte TypeScript
- **UI**: Interface gráfica para testes
- **Watch Mode**: Modo watch mais eficiente

## 📈 Métricas de Sucesso

- ✅ **28 testes passando** (15 commission + 13 validators)
- ✅ **Cobertura configurada** com V8 provider
- ✅ **Mocks funcionando** corretamente
- ✅ **Scripts atualizados** no package.json
- ✅ **Documentação atualizada**

## 🔧 Troubleshooting

### Problemas Comuns

1. **Imports ESM**: Usar `import` em vez de `require`
2. **Mocks**: Trocar `jest.fn()` por `vi.fn()`
3. **Setup**: Importar funções do Vitest
4. **Coverage**: Instalar `@vitest/coverage-v8`

### Debug

```javascript
// Habilitar debug mode
const debugMode = true;
if (debugMode) {
  console.log('Debug info:', data);
}
```
