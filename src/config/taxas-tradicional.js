/**
 * Configuração das Taxas do Modelo Tradicional - Versão Webflow TXT
 * Baseado na especificação TAXAS_REINO_VS_TRADICIONAL.md
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  const TAXAS_TRADICIONAL = {
    'Renda Fixa': {
      CDB: { min: 1.0, max: 1.5, media: 1.25, nome: 'CDB,LCI,LCA' },
      CRI: { min: 3.0, max: 5.5, media: 4.25, nome: 'CRI,CRA,DEBENTURE' },
      'Títulos Públicos': { min: 3.0, max: 5.5, media: 4.25, nome: 'Títulos Públicos' },
    },
    'Fundo de Investimento': {
      Ações: { min: 0.5, max: 1.0, media: 0.75, nome: 'Ações' },
      Liquidez: { min: 0.2, max: 0.5, media: 0.35, nome: 'Liquidez' },
      'Renda Fixa': { min: 0.3, max: 0.8, media: 0.55, nome: 'Renda Fixa' },
      Multimercado: { min: 0.3, max: 0.8, media: 0.55, nome: 'Multimercado' },
      Imobiliários: { min: 0.2, max: 0.5, media: 0.35, nome: 'Imobiliários' },
      'Private Equity': { min: 1.0, max: 2.0, media: 1.5, nome: 'Private Equity' },
    },
    'Renda Variável': {
      Ações: { min: 0.1, max: 0.3, media: 0.2, nome: 'Ações' },
      Estruturada: { min: 3.5, max: 7.0, media: 5.25, nome: 'Estruturada' },
      'Carteira administrada': { min: 1.5, max: 1.5, media: 1.5, nome: 'Carteira administrada' },
    },
    Internacional: {
      Ouro: { min: 1.0, max: 2.0, media: 1.5, nome: 'Ouro' },
      Dólar: { min: 1.0, max: 2.0, media: 1.5, nome: 'Dólar' },
      ETF: { min: 1.0, max: 2.0, media: 1.5, nome: 'ETF' },
    },
    Previdência: {
      Ações: { min: 1.5, max: 2.0, media: 1.75, nome: 'Ações (FIA)' },
      Multimercado: { min: 1.5, max: 2.0, media: 1.75, nome: 'Multimercado' },
      'Renda Fixa': { min: 0.5, max: 1.0, media: 0.75, nome: 'Renda Fixa' },
    },
    Outros: {
      Poupança: { min: 0.2, max: 0.2, media: 0.2, nome: 'Poupança' },
      Previdência: { min: 0.5, max: 1.5, media: 1.0, nome: 'Previdencia' },
      Imóvel: { min: 0.5, max: 1.0, media: 0.75, nome: 'Imóvel' },
      COE: { min: 5.0, max: 6.0, media: 5.5, nome: 'COE' },
      'Operação compromissada': { min: 0.3, max: 0.5, media: 0.4, nome: 'Operação compromissada' },
      Criptoativos: { min: 0.0, max: 0.0, media: 0.0, nome: 'Criptoativos' },
    },
  };

  const MAPEAMENTO_ATRIBUTOS = {
    'Renda Fixa:CDB': 'Renda Fixa.CDB',
    'Renda Fixa:CRI': 'Renda Fixa.CRI',
    'Renda Fixa:Títulos Públicos': 'Renda Fixa.Títulos Públicos',

    'Fundo de Investimento:Ações': 'Fundo de Investimento.Ações',
    'Fundo de investimento:Ações': 'Fundo de Investimento.Ações',
    'Fundo de Investimento:Liquidez': 'Fundo de Investimento.Liquidez',
    'Fundo de investimento:Liquidez': 'Fundo de Investimento.Liquidez',
    'Fundo de Investimento:Renda Fixa': 'Fundo de Investimento.Renda Fixa',
    'Fundo de investimento:Renda Fixa': 'Fundo de Investimento.Renda Fixa',
    'Fundo de Investimento:Multimercado': 'Fundo de Investimento.Multimercado',
    'Fundo de investimento:Multimercado': 'Fundo de Investimento.Multimercado',
    'Fundo de Investimento:Imobiliários': 'Fundo de Investimento.Imobiliários',
    'Fundo de investimento:Imobiliários': 'Fundo de Investimento.Imobiliários',
    'Fundo de Investimento:Private Equity': 'Fundo de Investimento.Private Equity',
    'Fundo de investimento:Private Equity': 'Fundo de Investimento.Private Equity',

    'Renda Variável:Ações': 'Renda Variável.Ações',
    'Renda variável:Ações': 'Renda Variável.Ações',
    'Renda Variável:Estruturada': 'Renda Variável.Estruturada',
    'Renda variável:Estruturada': 'Renda Variável.Estruturada',
    'Renda Variável:Carteira administrada': 'Renda Variável.Carteira administrada',
    'Renda variável:Carteira administrada': 'Renda Variável.Carteira administrada',

    'Internacional:Ouro': 'Internacional.Ouro',
    'Internacional:Dólar': 'Internacional.Dólar',
    'Internacional:ETF': 'Internacional.ETF',

    'Previdência:Ações': 'Previdência.Ações',
    'Previdência:Multimercado': 'Previdência.Multimercado',
    'Previdência:Renda Fixa': 'Previdência.Renda Fixa',

    'Outros:Poupança': 'Outros.Poupança',
    'Outros:Previdência': 'Outros.Previdência',
    'Outros:Imóvel': 'Outros.Imóvel',
    'Outros:COE': 'Outros.COE',
    'Outros:Operação compromissada': 'Outros.Operação compromissada',
    'Outros:Criptoativos': 'Outros.Criptoativos',
  };

  function obterTaxaPorAtributos(category, product) {
    const chave = `${category}:${product}`;
    const caminho = MAPEAMENTO_ATRIBUTOS[chave];

    if (!caminho) {
      console.warn(`⚠️ Taxa não encontrada para: ${chave}`);
      return null;
    }

    const [cat, prod] = caminho.split('.');
    return TAXAS_TRADICIONAL[cat]?.[prod] || null;
  }

  function calcularCustoProduto(valorAlocado, category, product) {
    const taxaConfig = obterTaxaPorAtributos(category, product);

    if (!taxaConfig || valorAlocado <= 0) {
      return {
        valorAlocado: valorAlocado,
        taxaMinima: 0,
        taxaMaxima: 0,
        taxaMedia: 0,
        custoMinimo: 0,
        custoMaximo: 0,
        custoMedio: 0,
        produto: product,
        categoria: category,
      };
    }

    const custoMinimo = valorAlocado * (taxaConfig.min / 100);
    const custoMaximo = valorAlocado * (taxaConfig.max / 100);
    const custoMedio = valorAlocado * (taxaConfig.media / 100);

    return {
      valorAlocado: valorAlocado,
      taxaMinima: taxaConfig.min,
      taxaMaxima: taxaConfig.max,
      taxaMedia: taxaConfig.media,
      custoMinimo: custoMinimo,
      custoMaximo: custoMaximo,
      custoMedio: custoMedio,
      produto: taxaConfig.nome,
      categoria: category,
    };
  }

  function obterCategorias() {
    return Object.keys(TAXAS_TRADICIONAL);
  }

  function obterProdutosCategoria(categoria) {
    return Object.keys(TAXAS_TRADICIONAL[categoria] || {});
  }

  // Funções de compatibilidade com módulos antigos
  function getTaxaTradicional(category, product) {
    return obterTaxaPorAtributos(category, product);
  }

  function calcularCustoTradicional(category, product, valor) {
    return calcularCustoProduto(valor, category, product);
  }

  function shouldCalculateTraditionalRates(chartType) {
    return chartType === 'tradicional';
  }

  function formatarPercentual(percentual, casasDecimais = 2) {
    return `${percentual.toFixed(casasDecimais).replace('.', ',')}%`;
  }

  // ComissoesUtils para compatibilidade
  const ComissoesUtils = {
    getComissaoData: function (category, product) {
      const taxaConfig = obterTaxaPorAtributos(category, product);
      if (!taxaConfig) return null;

      return {
        min: taxaConfig.min,
        max: taxaConfig.max,
        media: taxaConfig.media,
        nome: taxaConfig.nome,
      };
    },
  };

  // Exporta globalmente
  window.TAXAS_TRADICIONAL = TAXAS_TRADICIONAL;
  window.MAPEAMENTO_ATRIBUTOS = MAPEAMENTO_ATRIBUTOS;
  window.obterTaxaPorAtributos = obterTaxaPorAtributos;
  window.calcularCustoProduto = calcularCustoProduto;
  window.obterCategorias = obterCategorias;
  window.obterProdutosCategoria = obterProdutosCategoria;

  // Funções de compatibilidade
  window.getTaxaTradicional = getTaxaTradicional;
  window.calcularCustoTradicional = calcularCustoTradicional;
  window.shouldCalculateTraditionalRates = shouldCalculateTraditionalRates;
  window.formatarPercentual = formatarPercentual;
  window.ComissoesUtils = ComissoesUtils;
})();
