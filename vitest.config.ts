import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment (node for unit tests, jsdom for integration)
    environment: 'node',
    environmentMatchGlobs: [['**/*integration*.test.js', 'jsdom']],

    // Test file patterns
    include: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],

    // Setup files
    setupFiles: ['src/__tests__/setup.js'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      include: ['src/modules/**/*.js', 'src/config/**/*.js'],
      exclude: [
        'src/modules/dev/**',
        'src/tests/**',
        'src/**/*.test.js',
        'src/**/*.spec.js',
        'node_modules/**',
        'dist/**',
      ],
      thresholds: {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },

    // Ignore patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      'src/modules/dev/**',
      'src/tests/**',
      '**/*live*.test.js', // Exclude Playwright tests from Vitest
      '**/typebot*.test.js', // Exclude Typebot Playwright tests from Vitest
    ],

    // Clear mocks between tests
    clearMocks: true,

    // Restore mocks after each test
    restoreMocks: true,

    // Globals (similar to Jest)
    globals: true,
  },

  // Resolve aliases (similar to Jest moduleNameMapper)
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
