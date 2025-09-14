import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        // Global variables for the Reino Capital project
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        // D3.js global
        d3: 'readonly',
        // Lottie global
        Lottie: 'readonly',
        // Tippy.js global
        tippy: 'readonly',
        // GSAP globals
        gsap: 'readonly',
        ScrollTrigger: 'readonly',
        // Custom globals
        ReinoAppState: 'writable',
        ReinoEventContracts: 'writable',
        ReinoButtonCoordinator: 'writable',
        ReinoSupabaseIntegration: 'writable',
        ReinoTypebotIntegration: 'writable',
        ReinoD3ChartSystem: 'writable',
        ReinoRotationIndexController: 'writable',
        ReinoResultadoSync: 'writable',
        ReinoProgressBarSystem: 'writable',
        ReinoCurrencyFormatting: 'writable',
        ReinoAssetSelectionFilter: 'writable',
        ReinoSimpleButtonSystem: 'writable',
        ReinoNavbarVisibilityController: 'writable',
        ReinoKeyboardNavigation: 'writable',
        ReinoPopupCTAModal: 'writable',
        ReinoSettingsModalController: 'writable',
        ReinoCalendlyMinimalistWidget: 'writable',
        ReinoSalesforceSync: 'writable',
        ReinoFocusVisiblePolyfill: 'writable',
        ReinoSimpleHoverModule: 'writable',
        ReinoTippyTooltipModule: 'writable',
        ReinoDetalhesCalculoTooltip: 'writable',
        ReinoSendButtonTooltip: 'writable',
        ReinoRotationSliderTooltip: 'writable',
        ReinoCategoryCommissionDisplay: 'writable',
        ReinoCategoryHoverHighlight: 'writable',
        ReinoCategorySummarySync: 'writable',
        ReinoListaResultadoChartBridge: 'writable',
        ReinoSelectedProductsList: 'writable',
        ReinoPatrimonySync: 'writable',
        ReinoResultadoComparativoCalculator: 'writable',
        ReinoRotationIndexIntegration: 'writable',
        ReinoSimpleSync: 'writable',
        ReinoSwiperResultado: 'writable',
        ReinoProductSystem: 'writable',
        ReinoAppStateValidators: 'writable',
        ReinoCurrencyControl: 'writable',
        ReinoFinalRotationFix: 'writable',
        ReinoForceRotationIntegration: 'writable',
        // Test globals
        calcularCustoProduto: 'readonly',
        calcularCustoMedio: 'readonly',
        calcularCustoRotacao: 'readonly',
        // Playwright test globals
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        // Vitest globals
        vi: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      // Disable TypeScript-specific rules for JavaScript
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-redeclare': 'off',

      // JavaScript-appropriate rules
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-redeclare': 'warn',
      'no-undef': 'off', // Handled by globals
      'no-console': ['warn', { allow: ['error'] }],
      'no-plusplus': 'off', // Allow ++ operator in JavaScript
      'prefer-destructuring': 'off',

      // Keep some useful rules
      'no-var': 'error',
      'prefer-const': 'warn',
      eqeqeq: 'warn',
      curly: 'warn',
    },
  },
  {
    // Specific rules for test files
    files: ['**/*.test.js', '**/tests/**/*.js', '**/__tests__/**/*.js'],
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    // Specific rules for debug files
    files: ['**/debug/**/*.js', '**/dev/**/*.js'],
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
    },
  },
];
