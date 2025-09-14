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

- Vitest: pnpm test (ou pnpm test:coverage, pnpm test:ui)
- Playwright: pnpm test:playwright (primeira vez: pnpm playwright install)

Escopo: E2E foca na funcionalidade central da calculadora até/através da Seção 3; testes de Typebot simulam completion evitando dependências reais de captura de leads.

## Configuração de Desenvolvimento

Requisitos: pnpm >= 10

### Workflow de Release Automatizado

Este projeto usa [Changesets](https://github.com/changesets/changesets) para versionamento automático e publicação no npm.

Instalar dependências:

```bash
pnpm install
```

Servidor de desenvolvimento com live reload:

```bash
pnpm dev
```

Build de produção:

```bash
pnpm build
```

Durante o desenvolvimento, os assets são servidos em <http://localhost:3000>. No Webflow, é possível referenciar os arquivos gerados via servidor de dev quando necessário.

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
