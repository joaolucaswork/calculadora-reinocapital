# Calculadora Reino Capital

Calculadora financeira multi‑etapas que modela a alocação de investimentos, estima comissões de corretoras tradicionais por categoria e compara com o modelo de assessoria da Reino Capital. Construída para Webflow usando módulos JavaScript autônomos (IIFE), AppState centralizado, sincronização orientada a eventos e visualizações com D3.js.

- Aplicativo ao vivo: <https://reinocapital.webflow.io/taxas-app>
- Observação: A pasta Modelo - Webflow/ (e quaisquer exports do Webflow) é somente leitura neste repositório e serve apenas como referência estrutural.

## Sumário

- Visão Geral
- Arquitetura
- Recursos Principais
- Gráfico Donut D3 (Seção 5)
- Integração com Supabase
- Testes e Cobertura
- Configuração de Desenvolvimento
- Estrutura do Projeto

## Visão Geral

A aplicação é uma experiência guiada em 6 etapas (data-step 0–5) em que os usuários:

- Informam o patrimônio total (BRL)
- Selecionam produtos de investimento por categoria
- Alocam o patrimônio por produto (valor e porcentagem)
- Visualizam o detalhamento de comissões e totais por categoria
- Veem resultados comparativos finais com ajustes do índice de giro

Todos os módulos seguem o padrão IIFE com exposição global via window.*, permitindo inclusão direta no Webflow sem bundler em tempo de execução. O repositório empacota módulos para desenvolvimento local e testes via esbuild.

## Arquitetura

- Central State: src/modules/reino-app-state.js
  - Fonte única de verdade para patrimônio, ativos selecionados, alocações, índice de giro e resultados
  - Emite eventos padronizados: patrimonyMainValueChanged, assetSelectionChanged, allocationChanged, rotationIndexChanged, totalComissaoChanged, appStateReady
- Event Contracts: src/modules/reino-event-contracts.js
  - Documenta nomes de eventos e formatos de payload; logging/throttling de debug opcional
- Controllers
  - Patrimônio/Alocação: src/modules/patrimony-sync.js
  - Seleção de Ativos: src/modules/asset-selection-filter.js
  - Índice de Giro: src/modules/rotation-index-controller.js (baseado em range-slider-element, 1–4, padrão 2)
- Calculations
  - Custo da corretora tradicional por produto via window.calcularCustoProduto (src/config/taxas-tradicional.js)
  - Sincronização de resultados e comparativo: src/modules/resultado-comparativo-calculator.js
- Visualização e Interação
  - Gráfico donut D3 para totais por categoria: src/modules/d3-donut-chart-section5.js
  - Ponte entre legenda e gráfico: src/modules/lista-resultado-chart-bridge.js
  - Efeitos de hover na lista: src/modules/donut-list-interaction.js
- Integrações
  - Supabase: src/modules/supabase-integration.js (captura orientada a eventos)
  - Módulos de Typebot e submissão de formulário (carregados via src/index.ts)

Todos os módulos são carregados em ordem definida a partir de src/index.ts: AppState → Configs → Controllers → Calculation → Sync/Bridges → UI → Charts → Buttons → Effects → Tooltips → Utilities → Debug opcional.

## Recursos Principais

- Fluxo multi‑etapas (0–5) com controladores de seção orientados a eventos e progresso
- Formatação de moeda BRL, inputs e sliders sincronizados, validação de alocação (deve atingir 100%)
- Seleção de ativos (Seção 2) filtrando o que aparece na alocação (Seção 3)
- Slider do índice de giro (Seção 5) afetando a matemática de comissão para produtos dependentes de turnover
- Agregação de comissão por categoria, atualizações em tempo real e saídas comparativas “Reino vs Tradicional”

## Gráfico Donut D3 (Seção 5)

Arquivo: src/modules/d3-donut-chart-section5.js

- Renderiza um donut com totais de comissão tradicional por categoria
- Esquema de cores alinhado à paleta de categorias do app
- Interações
  - Hover: atenua fatias não‑alvo e mostra valor no centro; dispara donutCategoryHover
  - Click: tooltip fixa (click‑to‑pin) com detalhamento por produto e posicionamento inteligente; clicar fora desfixa
  - Ponte com legenda: clicar em .lista-resultado-item simula clique na fatia (src/modules/lista-resultado-chart-bridge.js)
- Animações
  - Animação de entrada na etapa 4: rotação + crescimento sequencial das fatias
- Origem de dados
  - Prefere dados de resultado-sync; recorre ao DOM se necessário

Regra de documentação primeiro: o uso de D3 segue as APIs oficiais de selection, event, arc, pie e transition. Ver .augment/rules/d3-documentation-first.md.

## Integração com Supabase

Arquivo: src/modules/supabase-integration.js

- Captura de dados orientada a eventos; nunca duplica lógica de cálculo
- Escuta totalComissaoChanged e appStateReady para armazenar totais computados e snapshots de estado
- Persiste submissões na tabela calculator_submissions com campos como:
  - patrimonio, ativos_escolhidos[], alocacao{}, total_alocado, percentual_alocado, patrimonio_restante
  - comissao_total_calculada, indice_giro_usado, detalhes_comissao[]
  - nome, email, telefone, session_id, submitted_at

Padrão de referência: .augment/rules/supabase-data-capture-pattern.md

## Testes e Cobertura

A suíte utiliza Vitest e Playwright.

- Unitário/Integração (Vitest)
  - src/__tests__/commission-calculator.test.js
    - Mocks de window.calcularCustoProduto e ReinoRotationIndexController
    - Valida saídas de comissão entre categorias e índices de giro; casos de borda e consistência
  - src/__tests__/integration-real.test.js
    - Carrega taxas-tradicional.js e rotation-index-controller.js reais em jsdom
    - Verifica faixas de cálculo por categoria e integração com o controlador de giro

- End‑to‑end (Playwright) contra o site ao vivo <https://reinocapital.webflow.io/taxas-app>
  - tests/integration-live.test.js
    - Fluxo principal: patrimônio → seleção → alocação (slider) → validação (100% obrigatório)
  - tests/typebot-simple.test.js e tests/typebot-completion-flow.test.js
    - Simulam completion do Typebot via postMessage e utilitários
    - Validam navegação para resultados e callbacks de integração

Como executar:

- __Vitest__: `pnpm test` (ou `pnpm test:coverage`, `pnpm test:ui`)
- __Playwright__: `pnpm test:playwright` (primeira vez: `npx playwright install chromium`)

Escopo: E2E foca na funcionalidade central da calculadora até/através da Seção 3; testes de Typebot simulam completion evitando dependências reais de captura de leads.

> 📋 __Para lista completa de comandos__, veja a seção [Scripts e Comandos](#scripts-e-comandos) abaixo.

## Configuração de Desenvolvimento

Requisitos: pnpm >= 10

### Workflow de Release Automatizado

Este projeto usa [Changesets](https://github.com/changesets/changesets) para versionamento automático e publicação no npm.

__Processo automatizado:__

1. Criar changeset: `npx changeset`
2. Commit e push para master
3. GitHub Actions publica automaticamente no npm

## Scripts e Comandos

### 📦 Instalação e Configuração

Instalar dependências:

```bash
pnpm install
```

Configurar hooks do Git (executado automaticamente após install):

```bash
pnpm prepare
```

### 🚀 Comandos de Desenvolvimento

__Servidor de desenvolvimento com live reload:__

```bash
pnpm dev
```

- Inicia servidor de desenvolvimento em `http://localhost:3000`
- Ativa live reload para mudanças em tempo real
- Usa `NODE_ENV=development`

__Build de produção:__

```bash
pnpm build
```

- Gera arquivos otimizados em `dist/`
- Minifica JavaScript e CSS
- Usa `NODE_ENV=production`
- __Executado automaticamente__ antes da publicação npm (`prepublishOnly`)

### 🧪 Comandos de Teste

__Testes unitários (Vitest):__

```bash
pnpm test                    # Executa todos os testes unitários
pnpm test:watch             # Executa testes em modo watch
pnpm test:coverage          # Executa testes com relatório de cobertura
pnpm test:ui                # Interface gráfica para testes
```

__Testes E2E (Playwright):__

```bash
pnpm test:playwright        # Executa todos os testes E2E
pnpm test:playwright:ui     # Interface gráfica do Playwright
pnpm test:integration       # Testes de integração (Chromium apenas)
pnpm test:isolation         # Testes de isolamento de banco de dados
```

__Primeira execução do Playwright:__

```bash
npx playwright install chromium  # Instala browser Chromium
```

### 🗄️ Comandos de Banco de Dados

__Limpeza de dados de teste:__

```bash
pnpm db:cleanup:testing           # Remove dados de teste do ambiente testing
pnpm db:cleanup:testing:dry       # Simula limpeza (dry-run) com logs detalhados
pnpm db:cleanup:development       # Remove dados de teste do ambiente development
pnpm db:status                    # Verifica status dos dados de teste
```

__Configuração e validação:__

```bash
pnpm db:setup                     # Configura ambientes de teste
pnpm validate:env                 # Valida configuração de ambiente
pnpm validate:env:testing         # Valida ambiente de testing
pnpm validate:env:production      # Valida ambiente de production
```

__⚠️ Produção (somente dry-run):__

```bash
pnpm db:cleanup:production        # APENAS dry-run - nunca executa limpeza real
```

### 📋 Comandos de Qualidade de Código

__Linting e formatação:__

```bash
pnpm lint                   # Verifica problemas de código (ESLint + Prettier)
pnpm lint:fix              # Corrige problemas automaticamente
pnpm format                # Formata código com Prettier
pnpm check                 # Verificação de tipos TypeScript (sem build)
```

### 🚀 Comandos de Release e Publicação

__Versionamento com Changesets:__

```bash
npx changeset              # Cria novo changeset para próxima versão
pnpm release               # Publica pacote no npm (usado pelo GitHub Actions)
```

__Atualizações de dependências:__

```bash
pnpm update                # Atualiza dependências interativamente
```

### 🔧 Comandos Avançados

__Workflow completo de desenvolvimento:__

```bash
# 1. Desenvolvimento
pnpm dev                   # Desenvolver com live reload

# 2. Testes locais
pnpm test                  # Testes unitários
pnpm test:integration      # Testes E2E

# 3. Qualidade de código
pnpm lint                  # Verificar código
pnpm format                # Formatar código

# 4. Release (quando pronto)
npx changeset              # Criar changeset
git add . && git commit    # Commitar mudanças
git push origin master     # GitHub Actions faz o resto automaticamente
```

__Validação completa antes de release:__

```bash
pnpm test && pnpm test:integration && pnpm lint && pnpm build
```

### 📝 Notas Importantes

__Pré-requisitos:__

- Node.js 18+ (recomendado: Node.js 20+)
- pnpm >= 10
- Variáveis de ambiente configuradas (`.env.testing`, `.env.production`)

__Ambientes:__

- __Development__: `http://localhost:3000` - assets servidos localmente
- __Testing__: Ambiente isolado para testes com Supabase
- __Production__: Ambiente de produção com dados reais

__Integração com Webflow:__

- Durante desenvolvimento: referencie `http://localhost:3000/dist/index.js` e `http://localhost:3000/dist/index.css`
- Em produção: use links do CDN npm (ex: `https://cdn.jsdelivr.net/npm/reinocapital-calculadora@1.2.12/dist/`)

__Workflow de Release Automatizado:__

- Changesets gerencia versionamento automático
- GitHub Actions publica automaticamente no npm
- CDN é atualizado automaticamente após publicação
- __Nunca edite__ manualmente a versão no `package.json`

## Estrutura do Projeto (seleção)

- src/index.ts — ordem de carregamento de módulos e imports de CSS
- src/modules/
  - reino-app-state.js, reino-event-contracts.js
  - patrimony-sync.js, asset-selection-filter.js
  - rotation-index-controller.js
  - resultado-comparativo-calculator.js
  - d3-donut-chart-section5.js, lista-resultado-chart-bridge.js, donut-list-interaction.js
  - supabase-integration.js
- tests/ — E2E com Playwright (site ao vivo, Typebot)
- src/__tests__/ — Unitário/integração com Vitest

## Contribuição

- Siga o padrão IIFE; exponha classes/instâncias em window para compatibilidade com Webflow
- Respeite os contratos de eventos e reutilize eventos existentes em vez de criar canais paralelos
- Não modifique Modelo - Webflow/; atualize via export do Webflow se necessário
- Mantenha o código D3 alinhado às APIs e padrões oficiais
