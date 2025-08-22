/**
 * Step Navigation and Progress Bar System
 * Manages step navigation, validation, and progress bar interactions
 */

export class StepNavigationProgressSystem {
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
        validator: () => true, // Results section is always valid
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
          // Don't reinitialize sections - this preserves current step state
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

      if (event.target.matches('.step-btn.prev-btn, [element-function="prev"]')) {
        event.preventDefault();
        this.previousStep();
      }
    });
  }

  setupValidation() {
    this.setupRealtimeValidation();
  }

  setupSectionIndicatorNavigation() {
    // Adiciona event listeners para todos os section-indicator
    const sectionIndicators = document.querySelectorAll('.section-indicator');

    sectionIndicators.forEach((indicator) => {
      indicator.addEventListener('click', (event) => {
        event.preventDefault();

        // Usa o número dentro do number-indicator para identificar o step
        const numberIndicator = indicator.querySelector('.number-indicator div');
        const stepNumber = numberIndicator ? parseInt(numberIndicator.textContent) : null;
        // Mapeamento correto: número 1 = step 1 (seção _1-section-calc-money)
        // número 2 = step 2, etc. Mas número 1 não é step 0!
        const targetStep = stepNumber ? stepNumber : null;
        const hasPointer = indicator.classList.contains('pointer');

        // Verifica se o indicador tem a classe pointer (só navega se tiver)
        if (hasPointer && targetStep !== null) {
          if (targetStep >= 1 && targetStep <= this.steps.length) {
            this.goToStepFromIndicator(targetStep);
          }
        } else {
        }
      });
    });
  }

  setupRealtimeValidation() {
    // Currency input validation
    document.addEventListener('input', (event) => {
      if (event.target.matches('#currency, .currency-input')) {
        this.debouncedValidation();
      }
    });

    // Asset allocation validation
    document.addEventListener('input', (event) => {
      if (event.target.matches('[data-allocation]')) {
        this.debouncedValidation();
      }
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
        console.warn(
          '🔓 Removida classe "disabled-item" das interactive-main-item (exceto originais)'
        );
      }
    }
  }

  /**
   * Verifica se um item deve manter a classe disabled-item originalmente
   * @param {Element} item - Elemento interactive-main-item
   * @returns {boolean}
   */
  shouldKeepOriginalDisabled(item) {
    // Verifica se tem animation-source-wrapper disabled-item dentro
    const animationWrapper = item.querySelector('.animation-source-wrapper.disabled-item');
    return !!animationWrapper;
  }

  /**
   * Adiciona classe personalizada à progress bar
   * @param {string} className - Nome da classe a ser adicionada
   */
  addProgressBarClass(className) {
    if (this.progressBar) {
      this.progressBar.classList.add(className);

      if (this.config.enableLogging) {
        console.warn(`➕ Adicionada classe "${className}" à progress bar`);
      }
    }
  }

  /**
   * Remove classe personalizada da progress bar
   * @param {string} className - Nome da classe a ser removida
   */
  removeProgressBarClass(className) {
    if (this.progressBar) {
      this.progressBar.classList.remove(className);

      if (this.config.enableLogging) {
        console.warn(`➖ Removida classe "${className}" da progress bar`);
      }
    }
  }

  /**
   * Verifica se a progress bar tem uma classe específica
   * @param {string} className - Nome da classe a verificar
   * @returns {boolean}
   */
  hasProgressBarClass(className) {
    return this.progressBar ? this.progressBar.classList.contains(className) : false;
  }

  /**
   * Define uma classe condicional baseada no step
   * @param {string} className - Nome da classe
   * @param {number|number[]} steps - Step(s) onde a classe deve estar presente
   */
  setConditionalClass(className, steps) {
    if (!this.progressBar) return;

    const stepsArray = Array.isArray(steps) ? steps : [steps];
    const shouldHaveClass = stepsArray.includes(this.currentStep);

    if (shouldHaveClass) {
      this.addProgressBarClass(className);
    } else {
      this.removeProgressBarClass(className);
    }
  }

  /**
   * Obtém informações sobre o estado atual da progress bar
   * @returns {Object}
   */
  getProgressBarState() {
    if (!this.progressBar) return null;

    return {
      currentStep: this.currentStep,
      classes: Array.from(this.progressBar.classList),
      hasFirstSection: this.hasProgressBarClass('first-section'),
      totalSections: this.sectionIndicators.length,
      element: this.progressBar,
    };
  }

  /**
   * Força uma atualização completa do estado da progress bar
   */
  forceUpdate() {
    if (!this.isInitialized) return;

    this.updateProgressBarState(this.currentStep);
  }

  /**
   * Notifica outros sistemas sobre mudanças de estado
   * @param {number} previousStep - Step anterior
   * @param {number} currentStep - Step atual
   */
  notifyStateChange(previousStep, currentStep) {
    // Dispara evento customizado para outros sistemas
    const event = new CustomEvent('progressBarStateChange', {
      detail: {
        previousStep,
        currentStep,
        progressBarState: this.getProgressBarState(),
      },
    });

    document.dispatchEvent(event);

    if (this.config.enableLogging) {
      console.warn('📡 Progress bar state change notificado:', {
        previousStep,
        currentStep,
      });
    }
  }

  /**
   * Atualiza configuração do sistema
   * @param {Object} newConfig - Nova configuração
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Método para ser chamado quando o step muda (interface para outros sistemas)
   * @param {number} stepIndex - Novo step index
   */
  onStepChange(stepIndex) {
    this.updateProgressBarState(stepIndex);
  }

  /**
   * Destrói o sistema e limpa recursos
   */
  destroy() {
    this.progressBar = null;
    this.sectionIndicators = [];
    this.currentStep = 0;
    this.isInitialized = false;

    if (this.config.enableLogging) {
      console.warn('🔄 StepNavigationProgressSystem destruído');
    }
  }

  // Navigation methods
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

    // Verifica se o step é válido
    if (targetStep < 0 || targetStep >= this.steps.length) {
      if (this.config.enableLogging) {
        console.warn(`❌ Step ${targetStep} inválido (max: ${this.steps.length - 1})`);
      }
      return;
    }

    // Sempre permite voltar para steps anteriores ou atual
    if (targetStep <= this.currentStep) {
      this.showStep(targetStep);
      return;
    }

    // Para avançar, verifica se pode ir para o próximo step
    if (targetStep === this.currentStep + 1) {
      // Usar validação local
      if (this.canProceedToNext()) {
        this.showStep(targetStep);
        // Notifica button system após navegação bem-sucedida
        this.notifyWebflowButtonSystem();
      } else {
        this.showValidationError();
      }
    } else {
      // Não permite pular múltiplos steps de uma vez
      if (this.config.enableLogging) {
        console.warn(`❌ Não é possível pular do step ${this.currentStep} para ${targetStep}`);
      }
      this.showValidationError();
    }
  }

  /**
   * Notifica o button system sobre mudanças de navegação
   */
  notifyWebflowButtonSystem() {
    const buttonSystem = window.ReinoCalculator?.systems?.buttonSystem;

    if (buttonSystem && typeof buttonSystem.updateNextButtonsState === 'function') {
      // Força atualização do estado dos botões
      setTimeout(() => {
        buttonSystem.updateNextButtonsState();
        if (typeof buttonSystem.forceUpdateButtons === 'function') {
          buttonSystem.forceUpdateButtons();
        }
      }, 50);
    }
  }

  // Validation methods
  canProceedToNext() {
    // Usar sempre validação local para evitar loop infinito
    return this.steps[this.currentStep]?.validator() || false;
  }

  validateIntroStep() {
    if (this.config.enableLogging) {
      console.warn('✅ validateIntroStep: sempre true');
    }
    return true;
  }

  validateMoneyStep() {
    const currencyInput = document.querySelector('#currency, .currency-input[is-main="true"]');
    if (!currencyInput) {
      if (this.config.enableLogging) {
        console.warn('❌ validateMoneyStep: input não encontrado');
      }
      return false;
    }

    const value = this.parseInputValue(currencyInput.value);
    const isValid = value > 0;

    if (this.config.enableLogging) {
      console.warn(`${isValid ? '✅' : '❌'} validateMoneyStep: valor=${value}, válido=${isValid}`);
    }

    return isValid;
  }

  validateAssetsStep() {
    const selectedAssets = document.querySelectorAll('.selected-asset');
    const isValid = selectedAssets.length > 0;

    if (this.config.enableLogging) {
      console.warn(
        `${isValid ? '✅' : '❌'} validateAssetsStep: ${selectedAssets.length} assets selecionados`
      );
    }

    return isValid;
  }

  validateAllocationStep() {
    const totalAllocation = this.calculateTotalAllocation();
    // Changed: Allow any allocation percentage, just check if there's any allocation
    const hasAnyAllocation = totalAllocation > 0;

    if (this.config.enableLogging) {
      console.warn(
        `${hasAnyAllocation ? '✅' : '❌'} validateAllocationStep: total=${totalAllocation}%, válido=${hasAnyAllocation}`
      );
    }

    return hasAnyAllocation;
  }

  updateAccessibility(stepIndex) {
    const currentStepData = this.steps[stepIndex];
    if (currentStepData) {
      document.title = `Reino Calculator - ${currentStepData.title}`;
    }
  }

  focusManagement(stepIndex) {
    setTimeout(() => {
      const section = this.sectionCache.get(this.steps[stepIndex]?.id);
      if (section) {
        const firstInput = section.querySelector('input, button, select, textarea');
        if (firstInput && typeof firstInput.focus === 'function') {
          try {
            firstInput.focus();
          } catch {
            // Ignore focus errors
          }
        }
      }
    }, 100);
  }

  showValidationError() {
    const currentStepData = this.steps[this.currentStep];
    let message = 'Por favor, complete os campos obrigatórios.';

    if (currentStepData?.name === 'money') {
      message = 'Por favor, insira um valor válido para seu patrimônio.';
    } else if (currentStepData?.name === 'assets') {
      message = 'Por favor, selecione pelo menos um ativo.';
    } else if (currentStepData?.name === 'allocation') {
      message = 'Por favor, insira valores de alocação para continuar.';
    }

    this.showToast(message, 'error');
  }

  showToast(message, type = 'info') {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      background: ${type === 'error' ? '#f56565' : '#4299e1'};
      color: white;
      border-radius: 8px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  parseInputValue(value) {
    return parseFloat(value?.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  }

  calculateTotalAllocation() {
    const allocationInputs = document.querySelectorAll('[data-allocation]');
    let total = 0;

    allocationInputs.forEach((input) => {
      const value = this.parseInputValue(input.value);
      total += value;
    });

    return total;
  }

  saveStepData(stepIndex) {
    const stepData = this.collectStepData(stepIndex);
    const stepName = this.steps[stepIndex]?.name;
    if (stepName && stepData) {
      // Data saving removed - no longer using localStorage
    }
  }

  collectStepData(stepIndex) {
    const section = this.sectionCache.get(this.steps[stepIndex]?.id);
    if (!section) return null;

    const data = {};
    const inputs = section.querySelectorAll('input, select, textarea');

    inputs.forEach((input) => {
      if (input.name || input.id) {
        const key = input.name || input.id;
        if (input.type === 'checkbox' || input.type === 'radio') {
          data[key] = input.checked;
        } else {
          data[key] = input.value;
        }
      }
    });

    return data;
  }

  async submitForm() {
    try {
      const formData = this.collectAllFormData();
      console.warn('📊 Formulário submetido:', formData);
      this.onSubmissionSuccess();
    } catch (error) {
      console.error('❌ Erro ao submeter formulário:', error);
    }
  }

  collectAllFormData() {
    const data = { submittedAt: new Date().toISOString(), totalTime: this.getTotalTime() };

    this.steps.forEach((step, index) => {
      const stepData = this.collectStepData(index);
      if (stepData) {
        data[step.name] = stepData;
      }
    });

    return data;
  }

  onSubmissionSuccess() {
    this.showToast('Formulário enviado com sucesso!', 'success');
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
    return Math.round((Date.now() - this.startTime) / 1000);
  }

  reinitializeSections() {
    // Preserve current step when reinitializing sections
    const { currentStep } = this;
    this.setupSections();
    // Restore the current step visibility
    if (currentStep > 0) {
      this.showStepSimple(currentStep);
    }
  }

  clearSavedData() {
    // Data clearing removed - no longer using localStorage
  }

  updateNavigationState() {
    // Update navigation buttons state based on current validation
    // This will be called by other systems
  }

  getCurrentStep() {
    return this.currentStep;
  }

  canProceed() {
    return this.canProceedToNext();
  }

  cleanup() {
    window.removeEventListener('resize', this.debounce);
    this.sectionCache.clear();
    this.currentStep = 0;
    this.isInitialized = false;
  }
}

// Backward compatibility exports
export const ProgressBarSystem = StepNavigationProgressSystem;
export const StepNavigationSystem = StepNavigationProgressSystem;

export default StepNavigationProgressSystem;
