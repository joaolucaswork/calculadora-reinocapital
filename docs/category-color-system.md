# Sistema de Cores das Categorias - Documentação

## Visão Geral

Este documento descreve o sistema de cores das categorias usado no calculador Reino Capital, incluindo as estruturas HTML e a estilização CSS correspondente.

## Estruturas HTML

### 1. Lista de Produtos Selecionados (`lista-produtos-selecionados`)

Localizada na seção 3 do calculador, esta div exibe um resumo das categorias selecionadas com seus valores e porcentagens.

```html
<div class="lista-produtos-selecionados">
  <div ativo-category="Renda Fixa" class="categoria-porcentagem">
    <div class="porcentagem">
      <div class="produt-categoria">
        <a ativo-category="Renda Fixa" href="#" class="categoria-ativo v2">Renda Fixa</a>
        <div class="valor-categoria">
          <div class="brl_tag v2 v3">R$</div>
          <div>0,00</div>
        </div>
      </div>
      <div>10%</div>
    </div>
  </div>
  
  <div ativo-category="Fundo de Investimento" class="categoria-porcentagem">
    <div class="porcentagem">
      <div class="produt-categoria">
        <a ativo-category="Fundo de Investimento" href="#" class="categoria-ativo v2">Fundo de Investimento</a>
        <div class="valor-categoria">
          <div class="brl_tag v2 v3">R$</div>
          <div>0,00</div>
        </div>
      </div>
      <div>10%</div>
    </div>
  </div>
  
  <div ativo-category="Renda Variável" class="categoria-porcentagem">
    <div class="porcentagem">
      <div>10%</div>
      <div class="produt-categoria">
        <a ativo-category="Renda Variável" href="#" class="categoria-ativo v2">Renda Variável</a>
        <div class="valor-categoria">
          <div class="brl_tag v2 v3">R$</div>
          <div>0,00</div>
        </div>
      </div>
    </div>
  </div>
  
  <div ativo-category="Internacional" class="categoria-porcentagem">
    <div class="porcentagem">
      <div>10%</div>
      <div class="produt-categoria">
        <a ativo-category="Internacional" href="#" class="categoria-ativo v2">Internacional</a>
        <div class="valor-categoria">
          <div class="brl_tag v2 v3">R$</div>
          <div>0,00</div>
        </div>
      </div>
    </div>
  </div>
  
  <div ativo-category="COE" class="categoria-porcentagem">
    <div class="porcentagem">
      <div class="produt-categoria">
        <a ativo-category="COE" href="#" class="categoria-ativo v2">COE</a>
        <div class="valor-categoria">
          <div class="brl_tag v2 v3">R$</div>
          <div>0,00</div>
        </div>
      </div>
      <div>10%</div>
    </div>
  </div>
  
  <div ativo-category="Previdência" class="categoria-porcentagem">
    <div class="porcentagem">
      <div class="produt-categoria">
        <a ativo-category="Previdência" href="#" class="categoria-ativo v2">Previdência</a>
        <div class="valor-categoria">
          <div class="brl_tag v2 v3">R$</div>
          <div>0,00</div>
        </div>
      </div>
      <div>10%</div>
    </div>
  </div>
  
  <div ativo-category="Outros" class="categoria-porcentagem last">
    <div class="porcentagem">
      <div class="produt-categoria">
        <a ativo-category="Outros" href="#" class="categoria-ativo v2">Outros</a>
        <div class="valor-categoria">
          <div class="brl_tag v2 v3">R$</div>
          <div>0,00</div>
        </div>
      </div>
      <div>10%</div>
    </div>
  </div>
</div>
```

### 2. Container de Patrimônio Interativo (`patrimonio_interactive_content-wrapper`)

Esta div contém os itens individuais de produtos para alocação de patrimônio.

```html
<div class="patrimonio_interactive_content-wrapper">
  <div ativo-product="CDB" ativo-category="Renda Fixa" class="patrimonio_interactive_item">
    <div class="ativo_alocated_top-wrapper">
      <div>
        <div class="categoria-ativo">Renda Fixa</div>
      </div>
      <div class="produto">CDB,LCI,LCA</div>
    </div>
    <div class="active-produto-item">
      <div class="patrimonio_value_input">
        <input data-currency="true" placeholder="0,00" input-settings="receive" class="currency-input individual">
        <div class="brl_tag v2">R$</div>
      </div>
      <div class="range_wrap">
        <div class="percent-wrapper">
          <range-slider min="0" max="1" value="0" step="0.01" class="slider"></range-slider>
          <div>
            <p class="porcentagem-calculadora">0%</p>
          </div>
        </div>
      </div>
    </div>
    <!-- Estados disabled e botões... -->
  </div>
  
  <!-- Outros itens de patrimônio... -->
</div>
```

## Estilização CSS

### Sistema de Cores das Categorias

```css
/**
 * Category Color Indicators
 * Travessões coloridos que aparecem antes do texto da categoria
 * Usando as mesmas cores do gráfico de donut
 */

/* Base styling para todos os indicadores de categoria */
.categoria-ativo::before {
  content: '';
  display: inline-block;
  width: 18px;
  height: 5px;
  border-radius: 1.5px; /* Bordas levemente arredondadas */
  margin-right: 8px;
  vertical-align: middle;
  flex-shrink: 0;
}

/* Cores específicas para cada categoria baseadas no gráfico de donut */

/* Renda Fixa */
.lista-produtos-selecionados .categoria-porcentagem[ativo-category="Renda Fixa"] .categoria-ativo::before,
.patrimonio_interactive_content-wrapper .patrimonio_interactive_item[ativo-category="Renda Fixa"] .categoria-ativo::before,
.categoria-ativo[ativo-category="Renda Fixa"]::before {
  background-color: #a2883b;
}

/* Fundo de Investimento */
.lista-produtos-selecionados .categoria-porcentagem[ativo-category="Fundo de Investimento"] .categoria-ativo::before,
.patrimonio_interactive_content-wrapper .patrimonio_interactive_item[ativo-category="Fundo de Investimento"] .categoria-ativo::before,
.categoria-ativo[ativo-category="Fundo de Investimento"]::before {
  background-color: #e3ad0c;
}

/* Renda Variável */
.lista-produtos-selecionados .categoria-porcentagem[ativo-category="Renda Variável"] .categoria-ativo::before,
.patrimonio_interactive_content-wrapper .patrimonio_interactive_item[ativo-category="Renda Variável"] .categoria-ativo::before,
.categoria-ativo[ativo-category="Renda Variável"]::before {
  background-color: #776a41;
}

/* Internacional */
.lista-produtos-selecionados .categoria-porcentagem[ativo-category="Internacional"] .categoria-ativo::before,
.patrimonio_interactive_content-wrapper .patrimonio_interactive_item[ativo-category="Internacional"] .categoria-ativo::before,
.categoria-ativo[ativo-category="Internacional"]::before {
  background-color: #bdaa6f;
}

/* COE */
.lista-produtos-selecionados .categoria-porcentagem[ativo-category="COE"] .categoria-ativo::before,
.patrimonio_interactive_content-wrapper .patrimonio_interactive_item[ativo-category="COE"] .categoria-ativo::before,
.categoria-ativo[ativo-category="COE"]::before {
  background-color: #d17d00;
}

/* Previdência */
.lista-produtos-selecionados .categoria-porcentagem[ativo-category="Previdência"] .categoria-ativo::before,
.patrimonio_interactive_content-wrapper .patrimonio_interactive_item[ativo-category="Previdência"] .categoria-ativo::before,
.categoria-ativo[ativo-category="Previdência"]::before {
  background-color: #8c5e00;
}

/* Outros */
.lista-produtos-selecionados .categoria-porcentagem[ativo-category="Outros"] .categoria-ativo::before,
.patrimonio_interactive_content-wrapper .patrimonio_interactive_item[ativo-category="Outros"] .categoria-ativo::before,
.categoria-ativo[ativo-category="Outros"]::before {
  background-color: #4f4f4f;
}

/* Fallback para categorias não mapeadas */
.categoria-ativo::before {
  background-color: #c0c0c0;
}

/* Ajustes responsivos para mobile */
@media (max-width: 768px) {
  .categoria-ativo::before {
    width: 16px;
    height: 3px;
    margin-right: 6px;
  }
}

/* Garantir que o texto da categoria tenha display flex para alinhamento */
.categoria-ativo {
  display: flex;
  align-items: center;
}
```

## Paleta de Cores

| Categoria | Cor | Hex Code |
|-----------|-----|----------|
| Renda Fixa | ![#a2883b](https://via.placeholder.com/15/a2883b/000000?text=+) | `#a2883b` |
| Fundo de Investimento | ![#e3ad0c](https://via.placeholder.com/15/e3ad0c/000000?text=+) | `#e3ad0c` |
| Renda Variável | ![#776a41](https://via.placeholder.com/15/776a41/000000?text=+) | `#776a41` |
| Internacional | ![#bdaa6f](https://via.placeholder.com/15/bdaa6f/000000?text=+) | `#bdaa6f` |
| COE | ![#d17d00](https://via.placeholder.com/15/d17d00/000000?text=+) | `#d17d00` |
| Previdência | ![#8c5e00](https://via.placeholder.com/15/8c5e00/000000?text=+) | `#8c5e00` |
| Outros | ![#4f4f4f](https://via.placeholder.com/15/4f4f4f/000000?text=+) | `#4f4f4f` |

## Atributos Importantes

- `ativo-category`: Define a categoria do investimento
- `ativo-product`: Define o produto específico dentro da categoria
- `categoria-ativo`: Classe CSS para elementos de texto da categoria
- `categoria-porcentagem`: Container para informações de categoria na lista de produtos selecionados
- `patrimonio_interactive_item`: Item individual no container de patrimônio interativo

## Sistema de Atualização Automática

### Módulo Category Summary Sync

O módulo `category-summary-sync.js` foi criado para atualizar automaticamente os valores e porcentagens das categorias na `lista-produtos-selecionados`.

#### Funcionalidades

1. **Cálculo Automático**: Soma todos os produtos de cada categoria em tempo real
2. **Atualização de Valores**: Atualiza elementos `.valor-categoria-esquerda` com valores monetários
3. **Atualização de Porcentagens**: Atualiza elementos `.porcentagem-categoria` com porcentagens calculadas
4. **Integração com Sistema Existente**: Usa eventos do `patrimony-sync.js` para sincronização

#### Eventos Monitorados

- `allocationChanged` - Quando um produto tem seu valor alterado
- `patrimonyMainValueChanged` - Quando o patrimônio total muda
- `patrimonySyncReady` - Quando o sistema de patrimônio está pronto
- `totalAllocationChange` - Quando o total alocado muda

#### Métodos Públicos

```javascript
// Instância global disponível
window.ReinoCategorySummarySync

// Métodos úteis
.refresh()              // Recalcula tudo
.enableDebug()          // Ativa logs de debug
.getCategoryTotals()    // Retorna totais por categoria
.getTotalAllocated()    // Retorna total alocado
```

#### Tratamento de Inconsistências

O módulo trata automaticamente a inconsistência estrutural da categoria "Renda Fixa", que não possui a classe `.valor-categoria-esquerda`, usando um seletor alternativo.

## Notas de Implementação

1. **Consistência Visual**: As cores são consistentes entre o gráfico de donut, os travessões das categorias e os sliders de range
2. **Responsividade**: O sistema inclui ajustes para dispositivos móveis
3. **Fallback**: Existe uma cor padrão (#c0c0c0) para categorias não mapeadas
4. **Flexibilidade**: Os seletores CSS cobrem ambas as estruturas HTML principais
5. **Atualização Automática**: O sistema agora atualiza valores e porcentagens automaticamente via JavaScript
