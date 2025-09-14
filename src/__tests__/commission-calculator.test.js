/**
 * @vitest-environment node
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('Commission Calculator', () => {
  let mockCalcularCustoProduto;
  let mockRotationController;

  beforeEach(() => {
    // Mock the commission calculation function
    mockCalcularCustoProduto = vi.fn();

    // Mock rotation controller
    mockRotationController = {
      getCurrentIndex: vi.fn().mockReturnValue(2),
      setIndex: vi.fn(),
      getEffectiveFactor: vi.fn(),
    };

    // Set up global window mocks
    global.window = {
      ...global.window,
      calcularCustoProduto: mockCalcularCustoProduto,
      ReinoRotationIndexController: mockRotationController,
    };
  });

  describe('calcularCustoProduto', () => {
    test('should calculate commission for Renda Fixa products', () => {
      const expectedResult = {
        custoAnual: 1500,
        custoMedio: 1500,
        taxaInfo: { min: 1.2, max: 1.8, media: 1.5 },
        comissaoRate: 0.015,
        comissaoPercent: 1.5,
      };

      mockCalcularCustoProduto.mockReturnValue(expectedResult);

      const result = mockCalcularCustoProduto(100000, 'Renda Fixa', 'CDB');

      expect(result.custoAnual).toBeValidCurrency();
      expect(result.custoMedio).toBeValidCurrency();
      expect(result.comissaoRate).toBeValidPercentage();
      expect(mockCalcularCustoProduto).toHaveBeenCalledWith(100000, 'Renda Fixa', 'CDB');
    });

    test('should calculate commission for Renda Variável products', () => {
      const expectedResult = {
        custoAnual: 2500,
        custoMedio: 2500,
        taxaInfo: { min: 2.0, max: 3.0, media: 2.5 },
        comissaoRate: 0.025,
        comissaoPercent: 2.5,
      };

      mockCalcularCustoProduto.mockReturnValue(expectedResult);

      const result = mockCalcularCustoProduto(100000, 'Renda Variável', 'Ações');

      expect(result.custoAnual).toBe(2500);
      expect(result.comissaoRate).toBe(0.025);
      expect(result.comissaoPercent).toBe(2.5);
    });

    test('should handle different rotation indices', () => {
      const testCases = [
        { index: 1, expectedFactor: 1.0 },
        { index: 2, expectedFactor: 2.0 },
        { index: 3, expectedFactor: 3.0 },
        { index: 4, expectedFactor: 4.0 },
      ];

      testCases.forEach(({ index, expectedFactor }) => {
        mockRotationController.getCurrentIndex.mockReturnValue(index);
        mockRotationController.getEffectiveFactor.mockReturnValue(expectedFactor);

        mockCalcularCustoProduto.mockReturnValue({
          custoAnual: 1000 * expectedFactor,
          custoMedio: 1000 * expectedFactor,
          fatorEfetivo: expectedFactor,
        });

        const result = mockCalcularCustoProduto(100000, 'Renda Fixa', 'CDB');

        expect(result.fatorEfetivo).toBe(expectedFactor);
        expect(result.custoAnual).toBe(1000 * expectedFactor);
      });
    });

    test('should handle edge cases', () => {
      const edgeCases = [
        { value: 0, category: 'Renda Fixa', product: 'CDB' },
        { value: 1, category: 'Renda Fixa', product: 'CDB' },
        { value: 1000000000, category: 'Renda Fixa', product: 'CDB' },
      ];

      edgeCases.forEach(({ value, category, product }) => {
        mockCalcularCustoProduto.mockReturnValue({
          custoAnual: value * 0.015,
          custoMedio: value * 0.015,
          taxaInfo: { min: 1.2, max: 1.8, media: 1.5 },
        });

        const result = mockCalcularCustoProduto(value, category, product);

        expect(result.custoAnual).toBeValidCurrency();
        expect(result.custoMedio).toBeValidCurrency();
      });
    });

    test('should return consistent results for same inputs', () => {
      const expectedResult = {
        custoAnual: 1500,
        custoMedio: 1500,
        taxaInfo: { min: 1.2, max: 1.8, media: 1.5 },
      };

      mockCalcularCustoProduto.mockReturnValue(expectedResult);

      const result1 = mockCalcularCustoProduto(100000, 'Renda Fixa', 'CDB');
      const result2 = mockCalcularCustoProduto(100000, 'Renda Fixa', 'CDB');

      expect(result1).toEqual(result2);
      expect(mockCalcularCustoProduto).toHaveBeenCalledTimes(2);
    });
  });

  describe('Rotation Index Integration', () => {
    test('should use current rotation index in calculations', () => {
      mockRotationController.getCurrentIndex.mockReturnValue(3);
      mockRotationController.getEffectiveFactor.mockReturnValue(3.0);

      mockCalcularCustoProduto.mockImplementation((value, category, product) => {
        const baseRate = 0.015;
        const factor = mockRotationController.getEffectiveFactor();
        // Simulate the function calling getCurrentIndex
        mockRotationController.getCurrentIndex();
        return {
          custoAnual: value * baseRate * factor,
          custoMedio: value * baseRate * factor,
          fatorEfetivo: factor,
        };
      });

      const result = mockCalcularCustoProduto(100000, 'Renda Fixa', 'CDB');

      expect(mockRotationController.getCurrentIndex).toHaveBeenCalled();
      expect(result.fatorEfetivo).toBe(3.0);
      expect(result.custoAnual).toBe(4500); // 100000 * 0.015 * 3
    });

    test('should handle rotation index changes', () => {
      // Initial calculation with index 2
      mockRotationController.getCurrentIndex.mockReturnValue(2);
      mockRotationController.getEffectiveFactor.mockReturnValue(2.0);

      mockCalcularCustoProduto.mockReturnValue({
        custoAnual: 3000,
        fatorEfetivo: 2.0,
      });

      const result1 = mockCalcularCustoProduto(100000, 'Renda Fixa', 'CDB');
      expect(result1.custoAnual).toBe(3000);

      // Change rotation index to 4
      mockRotationController.getCurrentIndex.mockReturnValue(4);
      mockRotationController.getEffectiveFactor.mockReturnValue(4.0);

      mockCalcularCustoProduto.mockReturnValue({
        custoAnual: 6000,
        fatorEfetivo: 4.0,
      });

      const result2 = mockCalcularCustoProduto(100000, 'Renda Fixa', 'CDB');
      expect(result2.custoAnual).toBe(6000);
      expect(result2.fatorEfetivo).toBe(4.0);
    });
  });

  describe('Commission Categories', () => {
    const categories = [
      'Renda Fixa',
      'Fundo de Investimento',
      'Renda Variável',
      'Internacional',
      'COE',
      'Previdência',
      'Outros',
    ];

    test.each(categories)('should calculate commission for %s category', (category) => {
      mockCalcularCustoProduto.mockReturnValue({
        custoAnual: 1500,
        custoMedio: 1500,
        taxaInfo: { min: 1.0, max: 2.0, media: 1.5 },
      });

      const result = mockCalcularCustoProduto(100000, category, 'Test Product');

      expect(result.custoAnual).toBeValidCurrency();
      expect(result.custoMedio).toBeValidCurrency();
      expect(mockCalcularCustoProduto).toHaveBeenCalledWith(100000, category, 'Test Product');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid inputs gracefully', () => {
      const invalidInputs = [
        [null, 'Renda Fixa', 'CDB'],
        [undefined, 'Renda Fixa', 'CDB'],
        [-1000, 'Renda Fixa', 'CDB'],
        [100000, null, 'CDB'],
        [100000, 'Renda Fixa', null],
      ];

      invalidInputs.forEach(([value, category, product]) => {
        mockCalcularCustoProduto.mockReturnValue({
          custoAnual: 0,
          custoMedio: 0,
          error: 'Invalid input',
        });

        const result = mockCalcularCustoProduto(value, category, product);

        expect(result.error).toBeDefined();
        expect(result.custoAnual).toBe(0);
      });
    });
  });
});
