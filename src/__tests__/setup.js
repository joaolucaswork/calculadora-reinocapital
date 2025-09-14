/**
 * Vitest Setup File
 * Configurações globais para testes Vitest
 */

import { vi } from 'vitest';

// Mock global objects that would exist in browser
global.window = {
  ReinoAppState: null,
  ReinoEventContracts: null,
  ReinoAppStateValidators: null,
  calcularCustoProduto: null,
  ReinoRotationIndexController: null,
  ReinoSupabaseIntegration: null,
  ReinoSimpleResultadoSync: null,
  ReinoResultadoComparativoCalculator: null,
};

global.document = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
  createElement: vi.fn(),
  dispatchEvent: vi.fn(),
};

global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch for API calls
global.fetch = vi.fn();

// Custom matchers
expect.extend({
  toBeValidCurrency(received) {
    const pass = typeof received === 'number' && received >= 0;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid currency value`,
        pass: true,
      };
    }
    return {
      message: () => `expected ${received} to be a valid currency value (positive number)`,
      pass: false,
    };
  },

  toBeValidPercentage(received) {
    const pass = typeof received === 'number' && received >= 0 && received <= 1;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid percentage (0-1)`,
        pass: true,
      };
    }
    return {
      message: () => `expected ${received} to be a valid percentage between 0 and 1`,
      pass: false,
    };
  },
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();

  // Note: NOT resetting global.window here to allow IIFE modules to work
  // Each test should manage its own window state if needed
});
