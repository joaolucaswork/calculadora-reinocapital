# Arquitetura IIFE – Recomendações Práticas

## Objetivo
Guia curto e acionável para consolidar sua arquitetura baseada em módulos IIFE, mantendo integração nativa com Webflow e evolução segura das features (sliders, D3, integrações, validação e UX).

---

## TL;DR (Resumo Rápido)
- Mantenha o padrão IIFE com exposição mínima no `window`.
- Padronize um AppState global leve (única fonte de verdade) + eventos.
- Inicialize em ordem determinística: Configs → Controllers → Bridges/Sync → UI.
- D3: seguir estritamente a regra “Documentation-First” (API oficial).
- Sliders: usar recursos nativos do `range-slider-element` para ticks.
- Webflow: tratar `static_files/` como snapshot somente leitura; substituir o diretório inteiro quando houver export.
- Envio: botão “send” desabilitado até 100% da alocação; validação reativa por eventos.

---

## 1) Padrão IIFE e Escopo Global Mínimo
- Todos os módulos como IIFE: `(function(){ 'use strict'; ... })()`.
- Anexar no `window` apenas o necessário (classes/instâncias realmente consumidas externamente).
- Evitar dependências cruzadas entre módulos; preferir comunicação por eventos.

Sugestão de nomenclatura no `window`:
- Classes: `window.Reino<Class>`
- Instâncias/singletons: `window.reino<Nome>`

---

## 2) AppState Global Leve (Source of Truth)
Centralize em um objeto único somente os estados que precisam ser compartilhados:
- `patrimonio` (valor principal)
- `ativosSelecionados` (categorias/produtos)
- `alocacoes` (por produto/categoria)
- `indiceGiro` (valor atual)
- `resultados` (comissão total, comparativo, detalhes)

Regras:
- Apenas controllers escrevem no AppState (+ emitem eventos).
- Módulos de “sync/bridge” apenas escutam e refletem na UI (sem recalcular).

---

## 3) Contrato de Eventos (Event-Driven)
Padronize nomes e payloads consistentes. Exemplos de eventos e dados esperados:

- `patrimonyMainValueChanged`
  - `{ value: number, formatted: string }`
- `assetSelectionChanged`
  - `{ selectedAssets: Array<{ category: string, product: string }> }`
- `allocationChanged`
  - `{ allocations: Record<string, number>, total: number }`
- `rotationIndexChanged`
  - `{ index: number, calculations?: Record<string, any> }`
- `totalComissaoChanged`
  - `{ total: number, formatted: string, details?: Array<any> }`
- `resultadoComparativoUpdated`
  - `{ reino: {...}, tradicional: {...} }`

Diretrizes:
- Sempre que um controller atualizar estado, emita um evento correspondente.
- Integrações (Supabase/Salesforce) capturam dados somente por eventos (sem duplicar lógicas de cálculo).

---

## 4) Ordem de Inicialização (Determinística)
1. Configurações base (taxas, supabase, etc.)
2. Controllers (moedas, seleção de ativos, rotação, cálculos)
3. Bridges/Sync (sincronização UI ↔ estado, tooltips, lista-resultado, etc.)
4. Camada de UI/efeitos (animações, hover/click, tooltips visuais)

Evite circularidades: controllers emitem eventos; bridges escutam; UI reage.

---

## 5) D3 – Documentation-First (Obrigatório)
- Antes de qualquer alteração, consultar a documentação oficial (Context7: `/d3/d3`).
- Priorizar APIs oficiais: `selection.on`, `data/enter/update/exit`, `transition`, `arc/pie`.
- Tooltips/Interações: usar padrão de eventos nativo (`mouseover`, `mouseout`, `click`) e gerenciar “pinned tooltip” com estado único.
- Entradas animadas do donut: transições D3 (sem gambiarras de CSS), conforme guideline do projeto.

Checklist rápido:
- [ ] Documentação consultada para o tópico específico
- [ ] Uso exclusivo de APIs oficiais
- [ ] Sem workarounds para features já existentes no D3

---

## 6) Range Sliders (range-slider-element)
- Use recursos nativos da lib para ticks e labels (sem overlays que quebrem interação).
- Garanta handles maiores para melhor usabilidade mobile/desktop.
- Sincronize slider ↔ input monetário via eventos, sem loops (throttle onde necessário).

Referência: `docs/range-slider-implementation.md`.

---

## 7) Integração com Webflow e HTML Contratual
- `static_files/` é snapshot de referência; não editar arquivos individualmente; quando houver alterações, exportar do Webflow e substituir a pasta inteira.
- Tratar atributos como contrato entre HTML e JS:
  - Navegação: `data-step`, `element-function`
  - Sistema de ativos: `ativo-category`, `ativo-product`
  - Inputs: `data-currency`, `currency-control`, `input-settings`
- Evitar acoplamento a classes visuais; selecionar por atributos.

---

## 8) Envio e Validação
- Botão `element-function="send"` desativado enquanto a alocação total ≠ 100%.
- Atualizar estado e tooltip em tempo real conforme `allocationChanged`.
- Submissão deve consumir dados do AppState + últimos eventos (sem recalcular nada).

---

## 9) Donut/Legenda e Tooltips (Seções 4 e 5)
- Hover: destacar categoria correspondente (opacidade/scale sincronizados com a legenda).
- Click-to-pin: apenas um tooltip “pinned” ativo; desabilitar hovers enquanto fixado; trocar pin ao clicar outra fatia/legenda.
- Clique na legenda deve acionar o mesmo comportamento da fatia correspondente.
- Animações: usar `transition()` do D3; duração 1.5–2s na entrada da seção 4.

---

## 10) Cores e Categorias
- Manter a paleta unificada entre donut, indicadores e sliders.
- Mapeamento por `ativo-category` consistente com a documentação de cores.
- Evitar strings “soltas”; centralizar nomes das categorias numa config única.

Referência: `docs/category-color-system.md`.

---

## 11) Próximos Passos Sugeridos
1. Padronizar wrappers IIFE e nomes globais (auditoria rápida dos arquivos de `src/modules`).
2. Consolidar AppState global leve e mover gravações para controllers.
3. Revisar `d3-donut-chart-section5.js` frente à doc oficial para garantir compliance total.
4. Criar um único mapa de categorias/produtos em `config/` e reutilizar em todos os módulos.
5. Verificar init order no `src/index.ts` e documentar dependências implícitas.

---

## 12) Critérios de Qualidade
- Sem cálculos duplicados fora dos controllers.
- Eventos com payload consistente e estável.
- D3 apenas com APIs oficiais e padrões canônicos.
- Sliders responsivos, sem overlays que prejudiquem interação.
- Webflow como fonte de HTML/CSS; reexport total quando mudar estrutura.

