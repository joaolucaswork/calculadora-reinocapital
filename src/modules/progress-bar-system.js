/**
 * Step Navigation and Progress Bar System - Versão Webflow TXT
 * Manages step navigation, validation, and progress bar interactions
 * Versão sem imports/exports para uso direto no Webflow
 */

(function() {
  'use strict';

  class StepNavigationProgressSystem {
    constructor() {
      this.isInitialized = false;
      this.progressBar = null;
      this.sectionIndicators = [];
      this.currentStep = 0;
      this.sectionCache = new Map();
      this.startTime = Date.now();

      // Step definitions
      this.steps = [
        {
          id: '_0-home-section-calc-intro',
          name: 'intro',
          title: 'Introdução',
          validator: () => this.validateIntroStep(),
        },
        {
          id: '_1-section-calc-money',
          name: 'money',
          title: 'Renda',
          validator: () => this.validateMoneyStep(),
        },
        {
          id: '_2-section-calc-ativos',
          name: 'assets',
          title: 'Ativos',
          validator: () => this.validateAssetsStep(),
        },
        {
          id: '_3-section-patrimonio-alocation',
          name: 'allocation',
          title: 'Alocação',
          validator: () => this.validateAllocationStep(),
        },
        {
          id: '_4-section-resultado',
          name: 'pre-results',
          title: 'Pré-Resultados',
          validator: () => true,
        },
        {
          id: '_5-section-resultado',
          name: 'results',
          title: 'Resultados',
          validator: () => true,
        },
      ];

      // Device capabilities detection
      this.supportsAnimations = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.isTouch = 'ontouchstart' in window;
      this.isMobile = window.innerWidth < 768;

      this.config = {
        enableLogging: false,
        animationDuration: 300,
      };

      // Validation function with debounce
      this.debouncedValidation = this.debounce(() => {
        this.updateNavigationState();
      }, 300);
    }

    async init(config = {}) {
      if (this.isInitialized) {
        return;
      }

      this.config = { ...this.config, ...config };

      try {
        await this.waitForDOM();
        await this.cacheSections();
        this.cacheElements();
        this.setupSections();
        this.setupEventListeners();
        this.setupSectionIndicatorNavigation();
        this.setupValidation();
        this.setupInitialState();

        // Mostra primeira seção
        this.showStep(0);

        this.isInitialized = true;

        // Escuta mudanças de orientação/resize
        window.addEventListener(
          'resize',
          this.debounce(() => {
            this.isMobile = window.innerWidth < 768;
            this.updateProgressBarState(this.currentStep);
          }, 250)
        );

        // Notifica estado inicial após inicialização completa
        setTimeout(() => {
          this.notifyStateChange();
        }, 50);

      } catch (error) {
        console.error('❌ Erro ao inicializar StepNavigationProgressSystem:', error);
        throw error;
      }
    }

    waitForDOM() {
      return new Promise((resolve) => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', resolve);
        } else {
          resolve();
        }
      });
    }

    async cacheSections() {
      for (const step of this.steps) {
        const section = document.querySelector(`.${step.id}`);
        if (section) {
          this.sectionCache.set(step.id, section);
        }
      }
    }

    setupSections() {
      this.steps.forEach((step, index) => {
        const section = this.sectionCache.get(step.id);
        if (section) {
          this.setupSimpleSection(section, index);
        }
      });
    }

    setupSimpleSection(section, index) {
      section.style.display = index === 0 ? 'block' : 'none';
    }

    setupEventListeners() {
      // Setup listeners for navigation buttons
      document.addEventListener('click', (event) => {
        if (event.target.matches('[element-function="next"]')) {
          event.preventDefault();
          this.nextStep();
        }

        if (event.target.closest('.step-btn.prev-btn')) {
          event.preventDefault();
          this.previousStep();
        }
      });

      this.setupRealtimeValidation();
    }

    setupValidation() {
      this.updateNavigationState();
    }

    setupSectionIndicatorNavigation() {
      this.sectionIndicators.forEach((indicatorContainer, index) => {
        const indicator = indicatorContainer.querySelector('.section-indicator');

        if (indicator) {
          indicator.addEventListener('click', (event) => {
            event.preventDefault();

            const sectionMainElement = indicatorContainer.querySelector('[section-main]');
            if (!sectionMainElement) return;

            const sectionNumber = parseInt(sectionMainElement.getAttribute('section-main'));

            if (this.config.enableLogging) {
              console.warn(`🎯 Clicked on section indicator ${sectionNumber}`);
            }

            this.goToStepFromIndicator(sectionNumber);
          });
        }
      });
    }

    setupRealtimeValidation() {
      document.addEventListener('input', (e) => {
        if (e.target.matches('[is-main="true"]')) {
          this.debouncedValidation();
        }
      });

      document.addEventListener('assetSelectionChanged', () => {
        this.debouncedValidation();
      });

      document.addEventListener('allocationChanged', () => {
        this.debouncedValidation();
      });
    }

    cacheElements() {
      // Cache da progress bar principal
      this.progressBar = document.querySelector('.progress-bar');
      if (!this.progressBar) {
        throw new Error('Progress bar não encontrada (.progress-bar)');
      }

      // Cache dos indicadores de seção
      this.sectionIndicators = Array.from(document.querySelectorAll('.item-section-indicator'));

      if (this.config.enableLogging) {
        console.warn('Progress bar encontrada:', this.progressBar);
        console.warn('Indicadores encontrados:', this.sectionIndicators.length);
      }
    }

    setupInitialState() {
      // Define o estado inicial
      this.currentStep = 0;

      // Garante que a progress bar tenha o estado correto inicialmente
      if (this.progressBar) {
        // Remove todas as classes especiais e adiciona first-section
        this.progressBar.classList.remove('first-section', 'aloca-section');
        this.progressBar.classList.add('first-section');
      }

      // Atualiza indicadores para o estado inicial
      this.updateSectionIndicators(0);
    }

    /**
     * Atualiza o estado da progress bar baseado no step atual
     * @param {number} stepIndex - Índice do step atual (0-based)
     */
    updateProgressBarState(stepIndex) {
      if (!this.progressBar) return;

      const previousStep = this.currentStep;
      this.currentStep = stepIndex;

      // Remove todas as classes especiais primeiro
      this.progressBar.classList.remove('first-section', 'aloca-section');

      // Aplica a classe apropriada baseada no step atual
      if (stepIndex === 0) {
        // Seção 0: adiciona first-section
        this.progressBar.classList.add('first-section');

        if (this.config.enableLogging) {
          console.warn('🔄 Adicionada classe "first-section" à progress bar');
        }
      } else if (stepIndex === 3 || stepIndex === 4 || stepIndex === 5) {
        // Seções 3, 4 e 5: adiciona aloca-section
        this.progressBar.classList.add('aloca-section');

        if (this.config.enableLogging) {
          console.warn('🎯 Adicionada classe "aloca-section" à progress bar');
        }
      } else {
        // Seções 1 e 2: sem classe especial
        if (this.config.enableLogging) {
          console.warn('🎯 Progress bar sem classe especial (seções 1-2)');
        }
      }

      // Atualiza indicadores de seção
      this.updateSectionIndicators(stepIndex);

      // Atualiza classes pointer nos indicadores
      this.updateSectionIndicatorPointers(stepIndex);

      // Aplica disabled-item nas interactive-main-item após sair do step 0
      this.updateInteractiveMainItems(stepIndex);

      // Notifica mudança de estado
      this.notifyStateChange(previousStep, stepIndex);
    }

    /**
     * Atualiza os indicadores visuais das seções
     * @param {number} activeStepIndex - Índice do step ativo
     */
    updateSectionIndicators(activeStepIndex) {
      this.sectionIndicators.forEach((indicator, index) => {
        const sectionMain = indicator.querySelector('[section-main]');
        const sectionIndicator = indicator.querySelector('.section-indicator');
        const numberIndicator = indicator.querySelector('.number-indicator');

        if (!sectionMain) return;

        const sectionNumber = parseInt(sectionMain.getAttribute('section-main')) || index + 1;

        // Comportamento especial para step 0: todos os indicadores ficam ativos
        if (activeStepIndex === 0) {
          // Na seção inicial, todos os indicadores devem ter classe active
          if (sectionIndicator) {
            sectionIndicator.classList.add('active');
            sectionIndicator.classList.remove('completed');
          }

          if (numberIndicator) {
            numberIndicator.classList.add('active');
            numberIndicator.classList.remove('completed');
          }

          // Adiciona active no item principal também
          const interactiveItem = indicator.querySelector('.interactive-cards-item');
          if (interactiveItem) {
            interactiveItem.classList.add('active');
            interactiveItem.classList.remove('completed');
          }
        } else {
          // Comportamento normal para steps > 0
          const isActive = activeStepIndex === sectionNumber;
          const isCompleted = activeStepIndex > sectionNumber;

          // Atualiza classes do indicador
          if (sectionIndicator) {
            sectionIndicator.classList.toggle('active', isActive);
            sectionIndicator.classList.toggle('completed', isCompleted);
          }

          if (numberIndicator) {
            numberIndicator.classList.toggle('active', isActive);
            numberIndicator.classList.toggle('completed', isCompleted);
          }

          // Adiciona/remove classes no item principal
          const interactiveItem = indicator.querySelector('.interactive-cards-item');
          if (interactiveItem) {
            interactiveItem.classList.toggle('active', isActive);
            interactiveItem.classList.toggle('completed', isCompleted);
          }
        }
      });
    }

    /**
     * Atualiza as classes pointer nos section-indicator baseado no step atual
     * @param {number} activeStepIndex - Índice do step ativo
     */
    updateSectionIndicatorPointers(activeStepIndex) {
      const sectionIndicators = document.querySelectorAll('.section-indicator');

      sectionIndicators.forEach((indicator) => {
        if (activeStepIndex > 0) {
          // Quando sair da seção 0, todos os indicadores ganham a classe pointer
          indicator.classList.add('pointer');
        } else {
          // Na seção 0, remove a classe pointer de todos
          indicator.classList.remove('pointer');
        }
      });

      if (this.config.enableLogging) {
        if (activeStepIndex > 0) {
          console.warn('🔗 Adicionada classe "pointer" a todos os section-indicator');
        } else {
          console.warn('🔗 Removida classe "pointer" de todos os section-indicator');
        }
      }
    }

    /**
     * Atualiza o estado das divs interactive-main-item
     * @param {number} activeStepIndex - Índice do step ativo
     */
    updateInteractiveMainItems(activeStepIndex) {
      const interactiveMainItems = document.querySelectorAll('.interactive-main-item');

      if (activeStepIndex > 0) {
        // Após sair da seção 0, todas as interactive-main-item ficam disabled
        interactiveMainItems.forEach((item) => {
          item.classList.add('disabled-item');
        });

        if (this.config.enableLogging) {
          console.warn('🔒 Aplicada classe "disabled-item" em todas as interactive-main-item');
        }
      } else {
        // Na seção 0, remove disabled-item de todas (exceto as que já tinham originalmente)
        interactiveMainItems.forEach((item) => {
          // Verifica se não é uma das que devem permanecer disabled originalmente
          const shouldStayDisabled = this.shouldKeepOriginalDisabled(item);

          if (!shouldStayDisabled) {
            item.classList.remove('disabled-item');
          }
        });

        if (this.config.enableLogging) {
          console.warn('🔓 Removida classe "disabled-item" das interactive-main-item apropriadas');
        }
      }
    }

    /**
     * Determina se um item deve manter o estado disabled originalmente
     */
    shouldKeepOriginalDisabled(item) {
      // Adicione aqui lógica se houver itens que devem permanecer disabled por padrão
      // Por exemplo, itens com uma classe especial ou atributo
      return item.dataset.alwaysDisabled === 'true' || item.classList.contains('permanent-disabled');
    }

    /**
     * Adiciona uma classe à progress bar se ela ainda não existir
     */
    addProgressBarClass(className) {
      if (this.progressBar && !this.progressBar.classList.contains(className)) {
        this.progressBar.classList.add(className);
      }
    }

    /**
     * Remove uma classe da progress bar se ela existir
     */
    removeProgressBarClass(className) {
      if (this.progressBar && this.progressBar.classList.contains(className)) {
        this.progressBar.classList.remove(className);
      }
    }

    /**
     * Verifica se a progress bar tem uma classe específica
     */
    hasProgressBarClass(className) {
      return this.progressBar ? this.progressBar.classList.contains(className) : false;
    }

    /**
     * Aplica ou remove uma classe condicionalmente
     */
    setConditionalClass(element, className, condition) {
      if (!element) return;

      if (condition) {
        element.classList.add(className);
      } else {
        element.classList.remove(className);
      }
    }

    /**
     * Retorna o estado atual da progress bar
     */
    getProgressBarState() {
      return {
        currentStep: this.currentStep,
        hasFirstSection: this.hasProgressBarClass('first-section'),
        hasAlocaSection: this.hasProgressBarClass('aloca-section'),
        classes: this.progressBar ? Array.from(this.progressBar.classList) : []
      };
    }

    /**
     * Força uma atualização completa do sistema
     */
    forceUpdate() {
      this.updateProgressBarState(this.currentStep);
      this.updateNavigationState();
    }

    /**
     * Notifica mudanças de estado para outros sistemas
     */
    notifyStateChange(previousStep = null, currentStep = null) {
      const eventData = {
        previousStep: previousStep,
        currentStep: currentStep || this.currentStep,
        canProceed: this.canProceedToNext(),
        stepName: this.steps[this.currentStep]?.name,
        progressBarState: this.getProgressBarState()
      };

      // Dispatch eventos customizados
      document.dispatchEvent(new CustomEvent('stepChanged', {
        detail: eventData
      }));

      document.dispatchEvent(new CustomEvent('progressBarStateChanged', {
        detail: this.getProgressBarState()
      }));
    }

    /**
     * Atualiza configuração do sistema
     */
    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
    }

    /**
     * Callback para quando o step muda
     */
    onStepChange(callback) {
      document.addEventListener('stepChanged', callback);
    }

    /**
     * Limpa recursos e event listeners
     */
    destroy() {
      // Remove listeners se necessário
      this.isInitialized = false;
      this.sectionCache.clear();
      this.progressBar = null;
      this.sectionIndicators = [];
    }

    async showStep(stepIndex) {
      if (stepIndex < 0 || stepIndex >= this.steps.length) return;

      const previousStep = this.currentStep;
      this.currentStep = stepIndex;

      // Salva dados do step anterior
      if (previousStep !== stepIndex) {
        this.saveStepData(previousStep);
      }

      this.showStepSimple(stepIndex);
      this.updateProgressBarState(stepIndex);
      this.updateAccessibility(stepIndex);
      this.focusManagement(stepIndex);

      // Notifica o button system sobre mudança de step
      this.notifyWebflowButtonSystem();

      // Scroll para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showStepSimple(stepIndex) {
      this.steps.forEach((step, index) => {
        const section = this.sectionCache.get(step.id);
        if (!section) return;

        if (index === stepIndex) {
          section.style.display = 'block';
          section.style.opacity = '1';
          section.style.transform = 'translateY(0)';
          section.style.pointerEvents = 'auto';
        } else {
          section.style.display = 'none';
          section.style.opacity = '0';
          section.style.transform = 'translateY(20px)';
          section.style.pointerEvents = 'none';
        }
      });
    }

    nextStep() {
      if (this.currentStep >= this.steps.length - 1) {
        this.submitForm();
        return;
      }

      if (this.canProceedToNext()) {
        this.showStep(this.currentStep + 1);
      } else {
        this.showValidationError();
      }
    }

    previousStep() {
      if (this.currentStep > 0) {
        this.showStep(this.currentStep - 1);
      }
    }

    goToStep(stepIndex) {
      // Sempre permite voltar para steps anteriores
      if (stepIndex <= this.currentStep) {
        this.showStep(stepIndex);
        // Notifica button system após navegação
        this.notifyWebflowButtonSystem();
        return;
      }

      // Para avançar, usa a mesma validação do button system
      if (this.canProceedToNext()) {
        this.showStep(stepIndex);
        // Notifica button system após navegação bem-sucedida
        this.notifyWebflowButtonSystem();
      } else {
        this.showValidationError();
      }
    }

    goToStepFromIndicator(sectionNumber) {
      // Mapeamento de seção para step:
      // Seção 1 = Step 1 (_1-section-calc-money)
      // Seção 2 = Step 2 (_2-section-calc-ativos)
      // Seção 3 = Step 3 (_3-section-patrimonio-alocation)
      // Seção 4 = Step 4 (não existe ainda, seria resultado)

      const targetStep = sectionNumber;

      if (this.config.enableLogging) {
        console.warn(`🔄 goToStepFromIndicator: seção ${sectionNumber} -> step ${targetStep}`);
      }

      // Se está tentando ir para um step que não existe ou está além do permitido
      if (targetStep >= this.steps.length) {
        if (this.config.enableLogging) {
          console.warn(`❌ Step ${targetStep} não existe ou não está disponível`);
        }
        return;
      }

      // Se está tentando ir para a seção 0 (intro), sempre permite
      if (targetStep === 0) {
        this.showStep(targetStep);
        this.notifyWebflowButtonSystem();
        return;
      }

      // Verifica se pode navegar para o step solicitado
      // Sempre permite voltar para steps já visitados
      if (targetStep <= this.currentStep) {
        if (this.config.enableLogging) {
          console.warn(`✅ Navegando para step anterior/atual: ${targetStep}`);
        }
        this.showStep(targetStep);
        this.notifyWebflowButtonSystem();
        return;
      }

      // Para avançar, verifica se o step atual está válido
      if (this.canProceedToNext()) {
        if (this.config.enableLogging) {
          console.warn(`✅ Navegando para próximo step: ${targetStep}`);
        }
        this.showStep(targetStep);
        this.notifyWebflowButtonSystem();
      } else {
        if (this.config.enableLogging) {
          console.warn(`❌ Não é possível navegar para step ${targetStep}: validação falhou`);
        }
        this.showValidationError();
      }
    }

    /**
     * Notifica o sistema de botões sobre mudanças de step
     */
    notifyWebflowButtonSystem() {
      // Dispara evento para que o button system possa se atualizar
      document.dispatchEvent(new CustomEvent('stepValidationChanged', {
        detail: {
          currentStep: this.currentStep,
          canProceed: this.canProceedToNext(),
          isFirstStep: this.currentStep === 0,
          isLastStep: this.currentStep === this.steps.length - 1
        }
      }));
    }

    canProceedToNext() {
      const currentStepData = this.steps[this.currentStep];
      return currentStepData ? currentStepData.validator() : false;
    }

    validateIntroStep() {
      // Step 0 sempre é válido
      return true;
    }

    validateMoneyStep() {
      const input = document.querySelector('[is-main="true"]');
      if (!input) {
        if (this.config.enableLogging) {
          console.warn('❌ Input principal não encontrado');
        }
        return false;
      }

      const value = this.parseInputValue(input.value);
      const isValid = value > 0;

      if (this.config.enableLogging) {
        console.warn(`💰 Validação money step: valor=${value}, válido=${isValid}`);
      }

      return isValid;
    }

    validateAssetsStep() {
      // Verifica se há assets selecionados usando o sistema de checkbox
      const selectedCheckboxes = document.querySelectorAll('.asset-checkbox:checked');
      if (selectedCheckboxes.length > 0) {
        return true;
      }

      // Fallback: verifica o sistema antigo
      const selectedAssets = document.querySelectorAll('.ativos_item.selected-asset');
      return selectedAssets.length > 0;
    }

    validateAllocationStep() {
      const allocationInputs = document.querySelectorAll('[input-settings="receive"]');
      
      for (const input of allocationInputs) {
        const value = this.parseInputValue(input.value);
        if (value > 0) {
          return true;
        }
      }

      return false;
    }

    updateAccessibility(stepIndex) {
      // Atualiza estados de acessibilidade se necessário
    }

    focusManagement(stepIndex) {
      // Gerencia foco entre steps
      const currentSection = this.sectionCache.get(this.steps[stepIndex].id);
      if (currentSection) {
        const focusableElement = currentSection.querySelector('input, button, [tabindex]:not([tabindex="-1"])');
        if (focusableElement) {
          setTimeout(() => focusableElement.focus(), 100);
        }
      }
    }

    showValidationError() {
      const currentStep = this.steps[this.currentStep];
      let message = 'Complete este passo antes de continuar.';

      switch (currentStep.name) {
        case 'money':
          message = 'Por favor, informe o valor do seu patrimônio.';
          break;
        case 'assets':
          message = 'Por favor, selecione pelo menos um tipo de ativo.';
          break;
        case 'allocation':
          message = 'Por favor, aloque valores nos ativos selecionados.';
          break;
      }

      this.showToast(message, 'warning');
    }

    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      toast.textContent = message;

      document.body.appendChild(toast);

      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 4000);
    }

    parseInputValue(value) {
      if (!value || typeof value !== 'string') return 0;
      const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
      return parseFloat(cleanValue) || 0;
    }

    calculateTotalAllocation() {
      const inputs = document.querySelectorAll('[input-settings="receive"]');
      let total = 0;
      
      inputs.forEach(input => {
        total += this.parseInputValue(input.value);
      });
      
      return total;
    }

    saveStepData(stepIndex) {
      // Salva dados do step se necessário
      const stepData = this.collectStepData(stepIndex);
      if (stepData) {
        localStorage.setItem(`step_${stepIndex}_data`, JSON.stringify(stepData));
      }
    }

    collectStepData(stepIndex) {
      const step = this.steps[stepIndex];
      if (!step) return null;

      const section = this.sectionCache.get(step.id);
      if (!section) return null;

      const inputs = section.querySelectorAll('input, select, textarea');
      const data = {};

      inputs.forEach(input => {
        if (input.name || input.id) {
          data[input.name || input.id] = input.value;
        }
      });

      return {
        stepIndex,
        stepName: step.name,
        timestamp: Date.now(),
        data
      };
    }

    async submitForm() {
      const formData = this.collectAllFormData();
      
      // Dispara evento de submissão
      document.dispatchEvent(new CustomEvent('formSubmission', {
        detail: formData
      }));
    }

    collectAllFormData() {
      const allData = {};
      
      this.steps.forEach((step, index) => {
        const stepData = this.collectStepData(index);
        if (stepData) {
          allData[step.name] = stepData;
        }
      });
      
      return allData;
    }

    onSubmissionSuccess() {
      // Callback após submissão bem-sucedida
    }

    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    getTotalTime() {
      return Date.now() - this.startTime;
    }

    reinitializeSections() {
      this.sectionCache.clear();
      this.cacheSections().then(() => {
        this.setupSections();
        this.forceUpdate();
      });
    }

    clearSavedData() {
      this.steps.forEach((step, index) => {
        localStorage.removeItem(`step_${index}_data`);
      });
    }

    updateNavigationState() {
      this.notifyWebflowButtonSystem();
    }

    getCurrentStep() {
      return this.currentStep;
    }

    canProceed() {
      return this.canProceedToNext();
    }

    cleanup() {
      this.clearSavedData();
      this.destroy();
    }
  }

  // Cria instância global
  window.ReinoStepNavigationProgressSystem = new StepNavigationProgressSystem();

  // Auto-inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoStepNavigationProgressSystem.init();
    });
  } else {
    window.ReinoStepNavigationProgressSystem.init();
  }

})();