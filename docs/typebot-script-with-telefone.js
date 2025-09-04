// ✅ ENHANCED TYPEBOT SCRIPT - VERSÃO COM TELEFONE
console.log('=== ENHANCED TYPEBOT COMPLETION SCRIPT ===');
console.log('Nome variável:', {{nome}});
console.log('Email variável:', {{email}});
console.log('Telefone variável:', {{telefone}});

// Prepare completion data
const completionData = {
  nome: {{nome}},
  email: {{email}},
  telefone: {{telefone}},
  completed: true,
  timestamp: new Date().toISOString(),
  method: 'enhanced-script-block'
};

console.log('Dados de conclusão preparados:', completionData);

// 1. Send completion data to parent window
window.parent.postMessage({
  type: 'typebot-completion',
  data: completionData
}, '*');

// 2. Force navigation to section 5 with proper visibility
setTimeout(() => {
  console.log('🔄 Forcing navigation to section 5...');
  
  try {
    // Method 1: Direct DOM manipulation (most reliable)
    const currentSections = window.parent.document.querySelectorAll('.step-section');
    const targetSection = window.parent.document.querySelector('[data-step="5"]');
    
    if (targetSection) {
      // Hide all sections
      currentSections.forEach(section => {
        section.style.display = 'none';
        section.style.visibility = 'hidden';
      });
      
      // Show target section
      targetSection.style.display = 'block';
      targetSection.style.visibility = 'visible';
      targetSection.style.opacity = '1';
      targetSection.style.position = 'relative';
      targetSection.style.zIndex = '1';
      
      console.log('✅ Section 5 forced visible via DOM');
      
      // Scroll to top
      window.parent.scrollTo(0, 0);
    }
    
    // Method 2: Dispatch events as backup
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

// 3. Force close Typebot popup
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
