/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, test } from 'vitest';

describe('Reino Capital Calculator - Real Commission Tests', () => {
  beforeEach(() => {
    // Setup clean global environment
    global.window = {
      calcularCustoProduto: null,
      TAXAS_TRADICIONAL: null,
      obterTaxaPorAtributos: null,
    };
  });

  describe('Real Commission Calculation', () => {
    test('should import and execute taxas-tradicional module', async () => {
      // Import the module - this should execute the IIFE
      await import('../config/taxas-tradicional.js');

      // Check if functions are available on window
      expect(window.calcularCustoProduto).toBeDefined();
      expect(typeof window.calcularCustoProduto).toBe('function');
      expect(window.TAXAS_TRADICIONAL).toBeDefined();
      expect(window.obterTaxaPorAtributos).toBeDefined();
    });

    test('should calculate commission for Renda Fixa CDB with real data', async () => {
      // Import module
      await import('../config/taxas-tradicional.js');

      const valorAlocado = 100000; // R$ 100,000
      const category = 'Renda Fixa';
      const product = 'CDB';

      const result = window.calcularCustoProduto(valorAlocado, category, product);

      // Verify basic structure
      expect(result).toBeDefined();
      expect(result.valorAlocado).toBe(valorAlocado);
      expect(result.categoria).toBe(category);

      // Verify tax rates (from TAXAS_TRADICIONAL config)
      expect(result.taxaMinima).toBe(1.0);
      expect(result.taxaMaxima).toBe(1.5);
      expect(result.taxaMedia).toBe(1.25);

      // Verify calculated costs
      expect(result.custoMinimo).toBe(1000); // 100,000 * 1.0%
      expect(result.custoMaximo).toBe(1500); // 100,000 * 1.5%
      expect(result.custoMedio).toBe(1250); // 100,000 * 1.25%

      // Verify product name
      expect(result.produto).toBe('CDB,LCI,LCA');
    });

    test('should calculate commission for Renda Variável Ações', async () => {
      await import('../config/taxas-tradicional.js');

      const valorAlocado = 50000;
      const category = 'Renda Variável';
      const product = 'Ações';

      const result = window.calcularCustoProduto(valorAlocado, category, product);

      // Verify tax rates for Renda Variável Ações (0.1% - 0.3%)
      expect(result.taxaMinima).toBe(0.1);
      expect(result.taxaMaxima).toBe(0.3);
      expect(result.taxaMedia).toBe(0.2);

      // Verify calculated costs
      expect(result.custoMinimo).toBe(50); // 50,000 * 0.1%
      expect(result.custoMaximo).toBe(150); // 50,000 * 0.3%
      expect(result.custoMedio).toBe(100); // 50,000 * 0.2%
    });

    test('should handle invalid inputs gracefully', async () => {
      await import('../config/taxas-tradicional.js');

      // Test with zero value
      const resultZero = window.calcularCustoProduto(0, 'Renda Fixa', 'CDB');
      expect(resultZero.custoMedio).toBe(0);

      // Test with negative value
      const resultNegative = window.calcularCustoProduto(-1000, 'Renda Fixa', 'CDB');
      expect(resultNegative.custoMedio).toBe(0);

      // Test with invalid category/product
      const resultInvalid = window.calcularCustoProduto(100000, 'Invalid', 'Invalid');
      expect(resultInvalid.custoMedio).toBe(0);
    });

    test('should calculate for all major investment categories', async () => {
      await import('../config/taxas-tradicional.js');

      const testCases = [
        {
          valor: 100000,
          category: 'Renda Fixa',
          product: 'CDB',
          expectedTaxaMedia: 1.25,
        },
        {
          valor: 100000,
          category: 'Fundo de Investimento',
          product: 'Ações',
          expectedTaxaMedia: 0.75,
        },
        {
          valor: 100000,
          category: 'Renda Variável',
          product: 'Ações',
          expectedTaxaMedia: 0.2,
        },
        {
          valor: 100000,
          category: 'Internacional',
          product: 'Dólar',
          expectedTaxaMedia: 1.5,
        },
        {
          valor: 100000,
          category: 'COE',
          product: 'COE',
          expectedTaxaMedia: 5.5,
        },
        {
          valor: 100000,
          category: 'Previdência',
          product: 'Ações',
          expectedTaxaMedia: 1.75,
        },
        {
          valor: 100000,
          category: 'Outros',
          product: 'Poupança',
          expectedTaxaMedia: 0.2,
        },
      ];

      testCases.forEach(({ valor, category, product, expectedTaxaMedia }) => {
        const result = window.calcularCustoProduto(valor, category, product);
        expect(result.taxaMedia).toBe(expectedTaxaMedia);
        expect(result.custoMedio).toBe(valor * (expectedTaxaMedia / 100));
      });
    });

    test('should handle large values correctly', async () => {
      await import('../config/taxas-tradicional.js');

      const largeValue = 10000000; // R$ 10 million
      const result = window.calcularCustoProduto(largeValue, 'Renda Fixa', 'CDB');

      expect(result.custoMedio).toBe(125000); // 10M * 1.25%
      expect(result.valorAlocado).toBe(largeValue);
    });

    test('should handle decimal values correctly', async () => {
      await import('../config/taxas-tradicional.js');

      const decimalValue = 123456.78;
      const result = window.calcularCustoProduto(decimalValue, 'Renda Fixa', 'CDB');

      expect(result.custoMedio).toBeCloseTo(1543.21, 2); // 123456.78 * 1.25%
    });

    test('should be consistent across multiple calls', async () => {
      await import('../config/taxas-tradicional.js');

      const valor = 100000;
      const category = 'Renda Fixa';
      const product = 'CDB';

      const result1 = window.calcularCustoProduto(valor, category, product);
      const result2 = window.calcularCustoProduto(valor, category, product);
      const result3 = window.calcularCustoProduto(valor, category, product);

      expect(result1.custoMedio).toBe(result2.custoMedio);
      expect(result2.custoMedio).toBe(result3.custoMedio);
      expect(result1.taxaMedia).toBe(result2.taxaMedia);
    });

    test('should access tax configuration directly', async () => {
      await import('../config/taxas-tradicional.js');

      // Test direct access to tax configuration
      expect(window.TAXAS_TRADICIONAL).toBeDefined();
      expect(window.TAXAS_TRADICIONAL['Renda Fixa']).toBeDefined();
      expect(window.TAXAS_TRADICIONAL['Renda Fixa']['CDB']).toBeDefined();

      const cdbConfig = window.TAXAS_TRADICIONAL['Renda Fixa']['CDB'];
      expect(cdbConfig.min).toBe(1.0);
      expect(cdbConfig.max).toBe(1.5);
      expect(cdbConfig.media).toBe(1.25);
      expect(cdbConfig.nome).toBe('CDB,LCI,LCA');
    });

    test('should use obterTaxaPorAtributos function correctly', async () => {
      await import('../config/taxas-tradicional.js');

      const taxaConfig = window.obterTaxaPorAtributos('Renda Fixa', 'CDB');

      expect(taxaConfig).toBeDefined();
      expect(taxaConfig.min).toBe(1.0);
      expect(taxaConfig.max).toBe(1.5);
      expect(taxaConfig.media).toBe(1.25);
      expect(taxaConfig.nome).toBe('CDB,LCI,LCA');
    });
  });
});
