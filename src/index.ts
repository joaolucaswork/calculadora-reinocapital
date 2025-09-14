// Import all JavaScript modules to include them in the bundle for live reloading
// ORDEM OTIMIZADA: AppState → Configs → Core Controllers → Calculation → Sync/Bridge → UI/Effects

// ==================== 1. APPSTATE CORE (PRIMEIRO) ====================
// Fonte única de verdade - deve carregar antes de tudo
import './modules/reino-app-state.js';
import './modules/reino-event-contracts.js';
import './modules/reino-app-state-validators.js';
// ==================== 2. CONFIGURAÇÕES BASE ====================
// Configurações que não dependem de AppState
import './config/honorarios-reino-config.js';
import './config/supabase.js';
import './config/taxas-tradicional.js';
// ==================== 3. CORE CONTROLLERS ====================
// Controladores fundamentais que aguardam AppState
import './modules/event-coordinator.js'; // Coordenação de eventos (independente)
import './modules/patrimony-sync.js'; // ✅ AppState integrado
import './modules/asset-selection-filter.js'; // ✅ AppState integrado
import './modules/rotation-index-controller.js'; // ✅ AppState integrado
import './modules/currency-formatting.js'; // ✅ AppState integrado
import './modules/currency-control.js'; // ✅ AppState integrado
// ==================== 4. CALCULATION MODULES ====================
// Módulos de cálculo que dependem dos controllers
import './modules/resultado-sync.js'; // ✅ AppState integrado
import './modules/resultado-comparativo-calculator.js'; // ✅ AppState integrado
import './modules/rotation-index-integration.js'; // Integração de cálculos (logs removidos)
import './modules/final-rotation-fix.js'; // Fix definitivo para rotação (logs removidos)
// ==================== 5. SYNC & BRIDGE MODULES ====================
// Módulos que sincronizam estado com UI e integrações externas
import './modules/category-summary-sync.js';
import './modules/category-commission-display.js';
import './modules/selected-products-list.js';
import './modules/simple-sync.js';
import './modules/supabase-integration.js'; // ✅ AppState integrado
import './modules/salesforce-integration.js'; // ✅ AppState integrado
import './modules/salesforce-sync.js';
import './modules/typebot-integration.js';
// ==================== 6. UI CONTROLLERS ====================
// Controladores de interface que dependem do estado
import './modules/section-visibility.js';
import './modules/navbar-visibility-controller.js';
import './modules/settings-modal-controller.js';
import './modules/progress-bar-system.js';
import './modules/product-system.js';
import './modules/click-product-system.js';
import './modules/simple-button-system.js';
// ==================== 7. CHART & VISUALIZATION ====================
// Gráficos e visualizações que dependem de dados calculados
import './modules/d3-donut-chart-section5.js';
import './modules/lista-resultado-chart-bridge.js';
import './modules/donut-list-interaction.js';
// import './modules/d3-pie-chart-webflow.js'; // COMENTADO - Gráfico de pizza da seção 4 desabilitado
// ==================== 8. BUTTON SYSTEM ====================
// Sistema de botões coordenado
import './button-system/button-coordinator.js';
import './button-system/external-integrations.js';
import './button-system/form-submission.js';
import './button-system/navigation-buttons.js';
// ==================== 9. UI EFFECTS & INTERACTIONS ====================
// Efeitos visuais e interações que não afetam estado
import './modules/motion-animation.js';
import './modules/simple-hover-module.js';
import './modules/category-hover-highlight.js';
import './modules/chamada-hover-effects.js';
import './modules/popup-cta-modal.js';
// ==================== 10. TOOLTIPS & HELP ====================
// Sistema de tooltips e ajuda
import './modules/tippy-tooltip-module.js';
import './modules/rotation-slider-tooltip.js';
import './modules/detalhes-calculo-tooltip.js';
import './modules/send-button-tooltip.js';
import './modules/donut-tutorial-checkboxes.js';
// ==================== 11. ACCESSIBILITY & UTILITIES ====================
// Funcionalidades de acessibilidade e utilitários
import './modules/focus-visible-polyfill.js';
import './modules/keyboard-navigation.js';
import './modules/lottie-lifecycle-manager.js';
import './modules/calendly-minimalist-widget.js';
// ==================== 12. DEBUG & TESTING ====================
// IMPORTANTE: Testes e debug tools foram movidos para carregamento condicional
// Para habilitar debug tools em desenvolvimento, use: ENABLE_DEBUG_TOOLS=true
// Para habilitar testes de integração, use: ENABLE_INTEGRATION_TESTS=true
// Para habilitar testes legacy, use: ENABLE_LEGACY_TESTS=true
// Por padrão, NENHUM teste é carregado no browser para evitar interferência na UI
// Os testes unitários Jest rodam separadamente via 'pnpm test'
// Descomente as linhas abaixo apenas para debug específico:
// import('./tests/debug/index.js');
// import('./tests/integration/index.js');
// import('./modules/dev/index.js');
// Módulos de debug de rotação (descomente se necessário):
// import('./modules/rotation-index-integration.js');
// import('./modules/final-rotation-fix.js');
// import './modules/swiper-resultado.js'; // DESATIVADO - mantido para uso futuro
// Import CSS files
import './css/tippy-custom.css';
import './css/simple-button.css';
import './css/asset-selection-filter.css';
import './css/range-slider.css';
import './css/donut-list-interaction.css';
import './css/lista-resultado-click-enhancement.css';
import './css/lista-resultado-toggle.css';
import './css/category-hover-effects.css';
import './css/category-commission-display.css';
import './css/settings-reset-button.css';
import './css/donut-tutorial-checkboxes.css';
import './css/send-button-tooltip.css';
import './css/focus-management.css';
import './css/progress-bar-fix.css';
import './css/tooltip-accordion.css';
import './css/donut-tooltip-text-truncation.css';
import './styles/components/asset-selection.css';
