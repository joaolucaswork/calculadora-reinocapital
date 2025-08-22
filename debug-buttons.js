/**
 * Debug Script para Botões de Navegação
 * Execute no console do navegador para diagnosticar problemas
 */

function debugButtonSystems() {
  console.log('🔍 === DEBUG BUTTON SYSTEMS ===');

  // 1. Verificar se os sistemas estão disponíveis
  console.log('\n📋 Sistemas Disponíveis:');
  console.log('ReinoStepNavigationProgressSystem:', !!window.ReinoStepNavigationProgressSystem);
  console.log('ReinoNavigationButtons:', !!window.ReinoNavigationButtons);
  console.log('ReinoSimpleButtonSystem:', !!window.ReinoSimpleButtonSystem);
  console.log('ReinoButtonCoordinator:', !!window.ReinoButtonCoordinator);

  // 2. Verificar estado do sistema de navegação
  if (window.ReinoStepNavigationProgressSystem) {
    const nav = window.ReinoStepNavigationProgressSystem;
    console.log('\n🧭 Estado do Sistema de Navegação:');
    console.log('isInitialized:', nav.isInitialized);
    console.log('currentStep:', nav.currentStep);
    console.log(
      'canProceedToNext():',
      nav.canProceedToNext ? nav.canProceedToNext() : 'método não disponível'
    );
    console.log('steps.length:', nav.steps ? nav.steps.length : 'steps não disponível');
  }

  // 3. Verificar botões no DOM
  console.log('\n🔘 Botões no DOM:');
  const nextButtons = document.querySelectorAll('[element-function="next"]');
  const prevButtons = document.querySelectorAll('.step-btn.prev-btn');
  console.log('Next buttons encontrados:', nextButtons.length);
  console.log('Prev buttons encontrados:', prevButtons.length);

  // 4. Verificar estado dos botões
  console.log('\n⚡ Estado dos Botões:');
  nextButtons.forEach((btn, i) => {
    console.log(`Next button ${i}:`, {
      disabled: btn.disabled,
      style: btn.style.cssText,
      classes: btn.className,
    });
  });

  prevButtons.forEach((btn, i) => {
    console.log(`Prev button ${i}:`, {
      disabled: btn.disabled,
      style: btn.style.cssText,
      classes: btn.className,
    });
  });

  // 5. Verificar event listeners
  console.log('\n👂 Testando Event Listeners:');
  if (nextButtons.length > 0) {
    console.log('Clicando no primeiro botão Next...');
    nextButtons[0].click();
  }

  // 6. Verificar inicialização do ButtonCoordinator
  if (window.ReinoButtonCoordinator) {
    console.log('\n🎛️ Button Coordinator:');
    console.log('isInitialized:', window.ReinoButtonCoordinator.isInitialized);
    console.log('navigationButtons:', !!window.ReinoButtonCoordinator.navigationButtons);
  }

  // 7. Verificar se há conflitos
  console.log('\n⚠️ Verificando Conflitos:');
  const simpleSystemActive =
    window.ReinoSimpleButtonSystem && window.ReinoSimpleButtonSystem.stepNavigationSystem;
  const navigationButtonsActive =
    window.ReinoNavigationButtons && window.ReinoNavigationButtons.stepNavigationSystem;

  console.log('SimpleButtonSystem ativo:', simpleSystemActive);
  console.log('NavigationButtons ativo:', navigationButtonsActive);

  if (simpleSystemActive && navigationButtonsActive) {
    console.warn('⚠️ CONFLITO: Ambos os sistemas de botões estão ativos!');
  }

  console.log('\n✅ Debug concluído');
}

// Função para forçar reinicialização
function forceReinitializeButtons() {
  console.log('🔄 Forçando reinicialização dos botões...');

  if (window.ReinoButtonCoordinator && window.ReinoStepNavigationProgressSystem) {
    window.ReinoButtonCoordinator.init(window.ReinoStepNavigationProgressSystem);
    console.log('✅ ButtonCoordinator reinicializado');
  }

  if (window.ReinoNavigationButtons && window.ReinoStepNavigationProgressSystem) {
    window.ReinoNavigationButtons.init(window.ReinoStepNavigationProgressSystem);
    console.log('✅ NavigationButtons reinicializado');
  }
}

// Função para testar botões manualmente
function testButtons() {
  console.log('🧪 Testando botões manualmente...');

  const nextButtons = document.querySelectorAll('[element-function="next"]');
  const prevButtons = document.querySelectorAll('.step-btn.prev-btn');

  console.log('Simulando clique no botão Next...');
  if (nextButtons.length > 0) {
    nextButtons[0].dispatchEvent(new Event('click', { bubbles: true }));
  }

  setTimeout(() => {
    console.log('Simulando clique no botão Prev...');
    if (prevButtons.length > 0) {
      prevButtons[0].dispatchEvent(new Event('click', { bubbles: true }));
    }
  }, 1000);
}

// Executar debug automaticamente
console.log('🚀 Executando debug dos botões...');
setTimeout(() => {
  debugButtonSystems();
}, 1000);

// Disponibilizar funções globalmente para uso no console
window.debugButtonSystems = debugButtonSystems;
window.forceReinitializeButtons = forceReinitializeButtons;
window.testButtons = testButtons;

console.log('\n📝 Funções disponíveis no console:');
console.log('- debugButtonSystems() - Executa debug completo');
console.log('- forceReinitializeButtons() - Força reinicialização');
console.log('- testButtons() - Testa botões manualmente');
