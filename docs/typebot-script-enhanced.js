// ✅ ENHANCED TYPEBOT SCRIPT - VERSÃO FINAL CORRIGIDA COM EVENTOS
console.log('=== ENHANCED TYPEBOT COMPLETION SCRIPT ===');
console.log('Nome variável:', {{nome}});
console.log('Email variável:', {{email}});

// Prepare completion data
const completionData = {
  nome: {{nome}},
  email: {{email}},
  completed: true,
  timestamp: new Date().toISOString(),
  method: 'enhanced-script-block'
};

console.log('Dados de conclusão preparados:', completionData);

// 1. Send completion data to parent window via postMessage
window.parent.postMessage({
  type: 'typebot-completion',
  data: completionData
}, '*');

// 2. Also dispatch a custom event on parent document
try {
  window.parent.document.dispatchEvent(new CustomEvent('typebotEnhancedCompletion', {
    detail: completionData
  }));
  console.log('✅ Custom event dispatched');
} catch (error) {
  console.error('❌ Failed to dispatch custom event:', error);
}

// 3. Force navigation to section 5 with proper visibility
setTimeout(() => {
  console.log('🔄 Forcing navigation to section 5...');

  try {
    // Method 1: Use progress bar system for proper state management
    if (window.parent.ReinoProgressBarSystem && window.parent.ReinoProgressBarSystem.showStep) {
      console.log('✅ Using progress bar system for navigation');
      window.parent.ReinoProgressBarSystem.showStep(5);
    } else {
      // Method 2: Direct DOM manipulation with pointer-events fix
      console.warn('⚠️ Progress bar system not available, using DOM manipulation');
      const currentSections = window.parent.document.querySelectorAll('.step-section');
      const targetSection = window.parent.document.querySelector('[data-step="5"]');

      if (targetSection) {
        // Hide all sections
        currentSections.forEach(section => {
          section.style.display = 'none';
          section.style.visibility = 'hidden';
          section.style.pointerEvents = 'none';
        });

        // Show target section with proper pointer events
        targetSection.style.display = 'block';
        targetSection.style.visibility = 'visible';
        targetSection.style.opacity = '1';
        targetSection.style.position = 'relative';
        targetSection.style.zIndex = '1';
        targetSection.style.pointerEvents = 'auto';

        console.log('✅ Section 5 forced visible via DOM with pointer-events fix');

        // Scroll to top
        window.parent.scrollTo(0, 0);
      }
    }

    // Method 3: Dispatch events as backup
    window.parent.document.dispatchEvent(new CustomEvent('forceNavigateToResults', {
      detail: {
        step: 5,
        source: 'typebot-enhanced',
        data: completionData
      }
    }));

  } catch (error) {
    console.error('❌ Navigation failed:', error);
  }
}, 500);

// 4. Force close Typebot popup
setTimeout(() => {
  console.log('🔐 Forcing Typebot closure...');
  
  try {
    // Close via parent methods
    if (window.parent.ReinoTypebotIntegrationSystem) {
      window.parent.ReinoTypebotIntegrationSystem.closeTypebot();
    }
    if (window.parent.Typebot) {
      window.parent.Typebot.close();
    }
    
    // Force hide container
    const container = window.parent.document.getElementById('typebot-embed-container');
    if (container) {
      container.style.display = 'none';
      container.style.visibility = 'hidden';
    }
    
    // Hide all typebot elements
    const typebotElements = window.parent.document.querySelectorAll('*[id*="typebot"], *[class*="typebot"], iframe[src*="typebot"]');
    typebotElements.forEach(el => {
      el.style.display = 'none';
    });
    
    console.log('✅ Typebot closure forced');
    
  } catch (error) {
    console.error('❌ Closure failed:', error);
  }
}, 1500);

console.log('✅ Enhanced completion script executed');
