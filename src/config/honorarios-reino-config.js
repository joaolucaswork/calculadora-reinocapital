/**
 * Configuração de Honorários Reino Capital - Versão Webflow TXT
 * Sistema de cobrança por faixas de patrimônio
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  const FAIXAS_HONORARIOS_REINO = [
    { min: 0, max: 999999.99, taxa: null, valorFixo: 799, tipo: 'fixo', descricao: '< 1M' },
    {
      min: 1000000,
      max: 2999999.99,
      taxa: 1.0,
      valorFixo: null,
      tipo: 'percentual',
      descricao: '1M - 3M',
    },
    {
      min: 3000000,
      max: 4999999.99,
      taxa: 0.9,
      valorFixo: null,
      tipo: 'percentual',
      descricao: '3M - 5M',
    },
    {
      min: 5000000,
      max: 9999999.99,
      taxa: 0.8,
      valorFixo: null,
      tipo: 'percentual',
      descricao: '5M - 10M',
    },
    {
      min: 10000000,
      max: 19999999.99,
      taxa: 0.7,
      valorFixo: null,
      tipo: 'percentual',
      descricao: '10M - 20M',
    },
    {
      min: 20000000,
      max: 49999999.99,
      taxa: 0.6,
      valorFixo: null,
      tipo: 'percentual',
      descricao: '20M - 50M',
    },
    {
      min: 50000000,
      max: Infinity,
      taxa: 0.5,
      valorFixo: null,
      tipo: 'percentual',
      descricao: '50M+',
    },
  ];

  function getTaxaReino(patrimonio) {
    if (patrimonio <= 0) {
      return {
        taxa: 0,
        faixa: null,
        custoAnual: 0,
        descricao: 'Patrimônio inválido',
      };
    }

    if (patrimonio < 1000000) {
      return {
        taxa: null,
        valorFixo: 799,
        faixa: '< 1M',
        custoAnual: 799,
        tipo: 'fixo',
        descricao: 'Faixa < 1M: R$ 799/ano',
      };
    }

    for (const faixa of FAIXAS_HONORARIOS_REINO) {
      if (
        faixa.tipo === 'percentual' &&
        patrimonio >= faixa.min &&
        (faixa.max === Infinity || patrimonio < faixa.max)
      ) {
        const custoAnual = (patrimonio * faixa.taxa) / 100;
        return {
          taxa: faixa.taxa,
          valorFixo: null,
          faixa: faixa.descricao,
          custoAnual,
          tipo: 'percentual',
          descricao: `Faixa ${faixa.descricao}: ${faixa.taxa}% a.a.`,
        };
      }
    }

    return {
      taxa: 0,
      valorFixo: null,
      faixa: 'Erro',
      custoAnual: 0,
      tipo: 'erro',
      descricao: 'Erro no cálculo de faixa',
    };
  }

  function calcularCustoReino(patrimonioTotal) {
    const taxaInfo = getTaxaReino(patrimonioTotal);

    return {
      patrimonioTotal,
      taxaAnual: taxaInfo.taxa,
      valorFixoAnual: taxaInfo.valorFixo,
      custoAnual: taxaInfo.custoAnual,
      custoMensal: taxaInfo.custoAnual / 12,
      faixa: taxaInfo.faixa,
      tipo: taxaInfo.tipo,
      descricao: taxaInfo.descricao,
      modelo: 'Reino Capital - Consultivo',
      vantagens: [
        'Transparência total',
        'Sem conflito de interesses',
        'Arquitetura aberta',
        'Consultoria personalizada',
        'Planejamento patrimonial',
      ],
    };
  }

  // function compararReinoVsTradicional - REMOVED: Economy comparison functionality disabled

  function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  function formatarPercentual(percentual, casasDecimais = 2) {
    return `${percentual.toFixed(casasDecimais).replace('.', ',')}%`;
  }

  function gerarSimulacaoFaixas() {
    const exemplos = [
      500000, // 500k
      1000000, // 1M
      2000000, // 2M
      3500000, // 3.5M
      7500000, // 7.5M
      15000000, // 15M
      35000000, // 35M
      75000000, // 75M
    ];

    return exemplos.map((patrimonio) => {
      const custoReino = calcularCustoReino(patrimonio);
      return {
        patrimonio: formatarMoeda(patrimonio),
        patrimonioNumerico: patrimonio,
        taxa: formatarPercentual(custoReino.taxaAnual),
        custoAnual: formatarMoeda(custoReino.custoAnual),
        custoMensal: formatarMoeda(custoReino.custoMensal),
        faixa: custoReino.faixa,
      };
    });
  }

  // Exporta globalmente
  window.FAIXAS_HONORARIOS_REINO = FAIXAS_HONORARIOS_REINO;
  window.getTaxaReino = getTaxaReino;
  window.calcularCustoReino = calcularCustoReino;
  // window.compararReinoVsTradicional = compararReinoVsTradicional; // REMOVED: Economy comparison disabled
  window.formatarMoeda = formatarMoeda;
  window.formatarPercentual = formatarPercentual;
  window.gerarSimulacaoFaixas = gerarSimulacaoFaixas;
})();
