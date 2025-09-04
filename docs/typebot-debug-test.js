// ✅ TYPEBOT DEBUG TEST - VERIFICAR VARIÁVEIS
console.log('=== TYPEBOT DEBUG TEST ===');

// Testar se as variáveis estão disponíveis
console.log('Testando variáveis do Typebot:');

// Dados de contato
console.log('1. nome:', typeof {{nome}}, '=', {{nome}});
console.log('2. email:', typeof {{email}}, '=', {{email}});
console.log('3. telefone:', typeof {{telefone}}, '=', {{telefone}});

// Dados da calculadora
console.log('4. patrimonio:', typeof {{patrimonio}}, '=', {{patrimonio}});
console.log('5. totalAlocado:', typeof {{totalAlocado}}, '=', {{totalAlocado}});
console.log('6. ativos:', typeof {{ativos}}, '=', {{ativos}});

// Verificar se as variáveis existem
const variables = {
  nome: {{nome}},
  email: {{email}},
  telefone: {{telefone}},
  patrimonio: {{patrimonio}},
  totalAlocado: {{totalAlocado}},
  ativos: {{ativos}}
};

console.log('Todas as variáveis:', variables);

// Verificar quais estão undefined
const undefinedVars = [];
const definedVars = [];

Object.keys(variables).forEach(key => {
  if (variables[key] === undefined) {
    undefinedVars.push(key);
  } else {
    definedVars.push(key);
  }
});

console.log('✅ Variáveis definidas:', definedVars);
console.log('❌ Variáveis undefined:', undefinedVars);

// Se alguma variável da calculadora está undefined, há problema na integração
if (undefinedVars.includes('patrimonio') || undefinedVars.includes('totalAlocado') || undefinedVars.includes('ativos')) {
  console.error('🚨 PROBLEMA: Variáveis da calculadora não estão chegando no Typebot!');
  console.log('Isso indica que o prefilledVariables não está funcionando corretamente.');
} else {
  console.log('🎉 SUCESSO: Todas as variáveis da calculadora estão disponíveis!');
}

// Prepare completion data (só com dados de contato que funcionam)
const completionData = {
  nome: {{nome}},
  email: {{email}},
  telefone: {{telefone}},
  completed: true,
  timestamp: new Date().toISOString(),
  method: 'debug-test'
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

console.log('✅ Debug test completed');
