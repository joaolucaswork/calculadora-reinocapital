/**
 * Jest Setup File
 * Configurações globais para testes Jest
 */

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
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  createElement: jest.fn(),
  dispatchEvent: jest.fn(),
};

global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch for API calls
global.fetch = jest.fn();

// Custom matchers
expect.extend({
  toBeValidCurrency(received) {
    const pass = typeof received === 'number' && received >= 0;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid currency value`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid currency value (positive number)`,
        pass: false,
      };
    }
  },
  
  toBeValidPercentage(received) {
    const pass = typeof received === 'number' && received >= 0 && received <= 1;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid percentage (0-1)`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid percentage between 0 and 1`,
        pass: false,
      };
    }
  },
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset global window objects
  Object.keys(global.window).forEach(key => {
    global.window[key] = null;
  });
});
