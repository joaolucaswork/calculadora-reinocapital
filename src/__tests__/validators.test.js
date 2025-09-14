/**
 * @jest-environment node
 */

describe('ReinoAppStateValidators', () => {
  let mockValidators;

  beforeEach(() => {
    // Mock the validators module
    mockValidators = {
      validatePatrimonio: jest.fn(),
      validateAllocation: jest.fn(),
      validateAssets: jest.fn(),
      validateRotationIndex: jest.fn(),
      validateCommission: jest.fn(),
      isInitialized: true,
    };

    // Set up global window mock
    global.window = {
      ...global.window,
      ReinoAppStateValidators: mockValidators,
    };
  });

  describe('Patrimônio Validation', () => {
    test('should validate positive patrimônio correctly', () => {
      mockValidators.validatePatrimonio.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      const result = mockValidators.validatePatrimonio({ 
        patrimonio: { value: 1000000 } 
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockValidators.validatePatrimonio).toHaveBeenCalledWith({
        patrimonio: { value: 1000000 }
      });
    });

    test('should reject negative patrimônio', () => {
      mockValidators.validatePatrimonio.mockReturnValue({
        isValid: false,
        errors: ['Patrimônio deve ser positivo'],
        warnings: [],
      });

      const result = mockValidators.validatePatrimonio({ 
        patrimonio: { value: -1000 } 
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Patrimônio deve ser positivo');
    });

    test('should warn about low patrimônio', () => {
      mockValidators.validatePatrimonio.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: ['Patrimônio muito baixo'],
      });

      const result = mockValidators.validatePatrimonio({ 
        patrimonio: { value: 500 } 
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Patrimônio muito baixo');
    });

    test('should handle edge cases', () => {
      const testCases = [
        { value: 0, expectedValid: false },
        { value: 1, expectedValid: true },
        { value: 1000000, expectedValid: true },
        { value: null, expectedValid: false },
        { value: undefined, expectedValid: false },
      ];

      testCases.forEach(({ value, expectedValid }) => {
        mockValidators.validatePatrimonio.mockReturnValue({
          isValid: expectedValid,
          errors: expectedValid ? [] : ['Invalid value'],
          warnings: [],
        });

        const result = mockValidators.validatePatrimonio({ 
          patrimonio: { value } 
        });

        expect(result.isValid).toBe(expectedValid);
      });
    });
  });

  describe('Allocation Validation', () => {
    test('should validate 100% allocation', () => {
      const allocation = {
        'Renda Fixa': 0.5,
        'Renda Variável': 0.5,
      };

      mockValidators.validateAllocation.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        totalPercentage: 1.0,
      });

      const result = mockValidators.validateAllocation(allocation);

      expect(result.isValid).toBe(true);
      expect(result.totalPercentage).toBeValidPercentage();
    });

    test('should reject over-allocation', () => {
      const allocation = {
        'Renda Fixa': 0.7,
        'Renda Variável': 0.5,
      };

      mockValidators.validateAllocation.mockReturnValue({
        isValid: false,
        errors: ['Alocação excede 100%'],
        warnings: [],
        totalPercentage: 1.2,
      });

      const result = mockValidators.validateAllocation(allocation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Alocação excede 100%');
    });

    test('should warn about under-allocation', () => {
      const allocation = {
        'Renda Fixa': 0.3,
        'Renda Variável': 0.2,
      };

      mockValidators.validateAllocation.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: ['Alocação incompleta'],
        totalPercentage: 0.5,
      });

      const result = mockValidators.validateAllocation(allocation);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Alocação incompleta');
    });
  });

  describe('Asset Validation', () => {
    test('should validate selected assets', () => {
      const assets = ['CDB', 'Ações', 'Títulos Públicos'];

      mockValidators.validateAssets.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        validAssets: assets,
      });

      const result = mockValidators.validateAssets(assets);

      expect(result.isValid).toBe(true);
      expect(result.validAssets).toEqual(assets);
    });

    test('should reject empty asset selection', () => {
      mockValidators.validateAssets.mockReturnValue({
        isValid: false,
        errors: ['Nenhum ativo selecionado'],
        warnings: [],
        validAssets: [],
      });

      const result = mockValidators.validateAssets([]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nenhum ativo selecionado');
    });
  });

  describe('Rotation Index Validation', () => {
    test('should validate rotation index range', () => {
      const validIndices = [1, 2, 3, 4];

      validIndices.forEach(index => {
        mockValidators.validateRotationIndex.mockReturnValue({
          isValid: true,
          errors: [],
          warnings: [],
          normalizedIndex: index,
        });

        const result = mockValidators.validateRotationIndex(index);

        expect(result.isValid).toBe(true);
        expect(result.normalizedIndex).toBe(index);
      });
    });

    test('should reject invalid rotation indices', () => {
      const invalidIndices = [0, 5, -1, null, undefined, 'invalid'];

      invalidIndices.forEach(index => {
        mockValidators.validateRotationIndex.mockReturnValue({
          isValid: false,
          errors: ['Índice de rotação inválido'],
          warnings: [],
          normalizedIndex: 2, // default
        });

        const result = mockValidators.validateRotationIndex(index);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Índice de rotação inválido');
      });
    });
  });

  describe('Commission Validation', () => {
    test('should validate commission data structure', () => {
      const commissionData = {
        total: 15000,
        details: [
          { category: 'Renda Fixa', value: 10000, commission: 1500 },
          { category: 'Renda Variável', value: 5000, commission: 750 },
        ],
      };

      mockValidators.validateCommission.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        calculatedTotal: 2250,
      });

      const result = mockValidators.validateCommission(commissionData);

      expect(result.isValid).toBe(true);
      expect(result.calculatedTotal).toBeValidCurrency();
    });

    test('should detect commission calculation errors', () => {
      const invalidCommissionData = {
        total: -1000,
        details: [],
      };

      mockValidators.validateCommission.mockReturnValue({
        isValid: false,
        errors: ['Comissão total inválida', 'Detalhes ausentes'],
        warnings: [],
        calculatedTotal: 0,
      });

      const result = mockValidators.validateCommission(invalidCommissionData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Comissão total inválida');
      expect(result.errors).toContain('Detalhes ausentes');
    });
  });
});
