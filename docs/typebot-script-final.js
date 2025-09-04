// ✅ TYPEBOT SCRIPT FINAL - COM TODAS AS VARIÁVEIS DA CALCULADORA
console.log('=== TYPEBOT COMPLETION SCRIPT ===');

// Dados de contato do usuário
console.log('Nome:', {{nome}});
console.log('Email:', {{email}});
console.log('Telefone:', {{telefone}});

// Dados da calculadora (agora disponíveis)
console.log('Patrimônio:', {{patrimonio}});
console.log('Total Alocado:', {{totalAlocado}});
console.log('Ativos Selecionados:', {{ativos}});

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

// Send completion data to parent window
window.parent.postMessage({
  type: 'typebot-completion',
  data: completionData
}, '*');

// Force navigation to section 5
setTimeout(() => {
  console.log('🔄 Forcing navigation to section 5...');
  
  try {
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
    
    // Dispatch events as backup
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

// Force close Typebot popup
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
