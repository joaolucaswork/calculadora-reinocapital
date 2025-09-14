## Organização de Módulos: Separar Testes e Debug

### Objetivo
Isolar todos os arquivos de testes e debug em uma pasta separada, mantendo o bundle sob controle e evitando mistura com módulos de produção.

### Contexto Atual
- Arquivos de testes/debug estão misturados em `src/modules`.
- `src/index.ts` importa um grande bloco "DEBUG & TESTING" diretamente de `src/modules`.

### Nova Estrutura Proposta
- Pasta dedicada para dev: `src/modules/dev`
- Importação agregadora única no bundle: `src/modules/dev/index.js`

### Passo a Passo
1) Criar a pasta
- `src/modules/dev`

2) Mover arquivos de testes/debug para `src/modules/dev` (lista abaixo)

3) Atualizar `src/index.ts`
- Substituir todas as imports do bloco “DEBUG & TESTING” por uma única linha:
<augment_code_snippet path="src/index.ts" mode="EXCERPT">
````ts
// ==================== 12. DEBUG & TESTING ====================
// Módulos de debug e teste (carregam por último)
import './modules/dev/index.js';
````
</augment_code_snippet>

4) Criar `src/modules/dev/index.js`
- Reimportar, na mesma ordem atual, todos os arquivos movidos:
<augment_code_snippet path="src/modules/dev/index.js" mode="EXCERPT">
````js
import './reino-debug-module.js';
import './appstate-integration-test.js';
import './integration-appstate-test.js';
import './resultado-sync-appstate-test.js';
import './validators-test.js';
````
</augment_code_snippet>

5) Opcional (depois): controlar inclusão no bundle por ambiente
- Ex.: só importar `./modules/dev/index.js` em ambiente de desenvolvimento.

### Arquivos a mover (confirmados pelo bloco do src/index.ts)
- `reino-debug-module.js`
- `appstate-integration-test.js`
- `integration-appstate-test.js`
- `resultado-sync-appstate-test.js`
- `validators-test.js`
- `currency-formatting-appstate-test.js`
- `resultado-comparativo-appstate-test.js`
- `currency-control-appstate-test.js`
- `commission-flow-debug.js`
- `commission-integration-test.js`
- `commission-quick-test.js`
- `commission-flow-analyzer.js`
- `commission-flow-fix-test.js`
- `commission-simple-test.js`
- `commission-debug-test.js`
- `commission-final-test.js`
- `commission-final-fix-test.js`
- `separator-fix-analysis.js`
- `separator-consistency-test.js`
- `taxas-debug-test.js`
- `keyboard-navigation-test.js`

### Arquivos opcionais para incluir em `dev/` (também parecem testes/debug)
- `rotation-debug-test.js`
- `rotation-fix-test.js`
- `rotation-index-dom-update-test.js`
- `rotation-integration-test.js`
- `calcular-custo-debug.js`
- `test-key-normalization.js`

### Nomes alternativos
- Você pode usar `src/modules/tests` ou `src/modules/debug`. Padrão sugerido: `dev` (abrange testes, debug e ferramentas de desenvolvimento).

### Verificação rápida após a mudança
- Build sem erros (imports resolvidos)
- Console do navegador sem referências quebradas
- Funcionalidades principais inalteradas
- Recursos de debug/teste continuam disponíveis

### Rollback (se necessário)
- Reverter `src/index.ts` para o bloco original de imports
- Mover arquivos de volta de `src/modules/dev` para `src/modules`

### Observações
- Mantenha a ordem das imports na agregação de `dev/index.js` igual à atual para preservar a sequência de inicialização.
- Esta mudança não altera o código interno dos módulos; apenas sua organização e ponto de importação.

