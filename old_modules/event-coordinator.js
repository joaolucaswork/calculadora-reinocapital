/**
 * EventCoordinator - Sistema centralizado CORRIGIDO para gerenciar eventos do input principal
 * Evita conflitos entre múltiplos módulos e memory leaks
 */

export class EventCoordinator {
  constructor() {
    this.input = null;
    this.listeners = new Map();
    this.isProcessing = false;
    this.eventQueue = [];
    this.boundHandlers = new Map(); // Para rastrear handlers bound
    this.isDestroyed = false;

    this.init();
  }

  init() {
    // Aguarda o DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.findAndSetupInput());
    } else {
      this.findAndSetupInput();
    }
  }

  findAndSetupInput() {
    this.input = document.querySelector('[is-main="true"]');
    if (this.input && !this.isDestroyed) {
      this.setupMainListeners();
    }
  }

  setupMainListeners() {
    if (!this.input || this.boundHandlers.has('main')) return;

    // Cria handlers bound uma única vez
    const inputHandler = (e) => this.handleInputEvent(e);
    const focusHandler = (e) => this.processFocusEvent(e);
    const blurHandler = (e) => this.processBlurEvent(e);
    const changeHandler = (e) => this.processChangeEvent(e);

    // Armazena referências para cleanup posterior
    this.boundHandlers.set('main', {
      input: inputHandler,
      focus: focusHandler,
      blur: blurHandler,
      change: changeHandler,
    });

    // Adiciona listeners apenas uma vez
    this.input.addEventListener('input', inputHandler, { passive: true });
    this.input.addEventListener('focus', focusHandler, { passive: true });
    this.input.addEventListener('blur', blurHandler, { passive: true });
    this.input.addEventListener('change', changeHandler, { passive: true });
  }

  handleInputEvent(e) {
    if (this.isProcessing || this.isDestroyed) {
      return;
    }

    this.isProcessing = true;

    // Usa requestAnimationFrame para melhor performance
    requestAnimationFrame(() => {
      this.processInputEvent(e);
      this.isProcessing = false;

      // Processa queue se houver
      if (this.eventQueue.length > 0) {
        const nextEvent = this.eventQueue.shift();
        requestAnimationFrame(() => this.handleInputEvent(nextEvent));
      }
    });
  }

  // Registra um listener para um módulo específico
  registerListener(moduleId, eventType, callback) {
    if (this.isDestroyed) return;

    const key = `${moduleId}_${eventType}`;

    // Remove listener anterior se existir (evita duplicação)
    this.unregisterListener(moduleId, eventType);

    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }

    this.listeners.get(key).push(callback);
  }

  // Remove listener de um módulo
  unregisterListener(moduleId, eventType, specificCallback = null) {
    const key = `${moduleId}_${eventType}`;

    if (this.listeners.has(key)) {
      if (specificCallback) {
        const callbacks = this.listeners.get(key);
        const index = callbacks.indexOf(specificCallback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      } else {
        // Remove todos os callbacks do módulo para este evento
        this.listeners.delete(key);
      }
    }
  }

  // Remove todos os listeners de um módulo
  unregisterModule(moduleId) {
    const keysToRemove = [];
    for (const key of this.listeners.keys()) {
      if (key.startsWith(`${moduleId}_`)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => this.listeners.delete(key));
  }

  processInputEvent(e) {
    if (this.isDestroyed) return;

    const inputCallbacks = this.getCallbacksForEvent('input');

    // Executa callbacks em ordem de prioridade
    const priorityOrder = ['currency-formatting', 'motion-animation', 'patrimony-sync'];

    for (const moduleId of priorityOrder) {
      const moduleCallbacks = inputCallbacks.filter((cb) => cb.moduleId === moduleId);
      for (const callbackInfo of moduleCallbacks) {
        try {
          callbackInfo.callback(e);
        } catch (error) {
          console.error(`EventCoordinator: Error in ${moduleId} listener:`, error);
        }
      }
    }
  }

  processFocusEvent(e) {
    if (this.isDestroyed) return;
    this.executeCallbacksForEvent('focus', e);
  }

  processBlurEvent(e) {
    if (this.isDestroyed) return;
    this.executeCallbacksForEvent('blur', e);
  }

  processChangeEvent(e) {
    if (this.isDestroyed) return;
    this.executeCallbacksForEvent('change', e);
  }

  executeCallbacksForEvent(eventType, e) {
    const callbacks = this.getCallbacksForEvent(eventType);
    callbacks.forEach(({ callback, moduleId }) => {
      try {
        callback(e);
      } catch (error) {
        console.error(`EventCoordinator: Error in ${moduleId} ${eventType} listener:`, error);
      }
    });
  }

  getCallbacksForEvent(eventType) {
    const callbacks = [];
    for (const [key, callbackList] of this.listeners.entries()) {
      if (key.endsWith(`_${eventType}`)) {
        const moduleId = key.replace(`_${eventType}`, '');
        callbackList.forEach((callback) => {
          callbacks.push({ moduleId, callback });
        });
      }
    }
    return callbacks;
  }

  // Método para disparar eventos programaticamente
  dispatchInputEvent(sourceModule = 'unknown') {
    if (this.isProcessing || this.isDestroyed || !this.input) {
      return;
    }

    const event = new Event('input', { bubbles: true });
    event.sourceModule = sourceModule;
    this.input.dispatchEvent(event);
  }

  // Método para atualizar valor sem disparar eventos
  setSilentValue(value) {
    if (this.isDestroyed || !this.input) return;

    this.isProcessing = true;
    this.input.value = value;

    // Usa requestAnimationFrame para reset mais confiável
    requestAnimationFrame(() => {
      this.isProcessing = false;
    });
  }

  // Getter para o valor atual
  getValue() {
    return this.input ? this.input.value : '';
  }

  // Setter que dispara eventos controlados
  setValue(value, sourceModule = 'unknown') {
    if (this.isDestroyed || !this.input) return;

    this.input.value = value;
    this.dispatchInputEvent(sourceModule);
  }

  // Método de cleanup para prevenir memory leaks
  destroy() {
    this.isDestroyed = true;

    // Remove todos os event listeners
    if (this.input && this.boundHandlers.has('main')) {
      const handlers = this.boundHandlers.get('main');
      this.input.removeEventListener('input', handlers.input);
      this.input.removeEventListener('focus', handlers.focus);
      this.input.removeEventListener('blur', handlers.blur);
      this.input.removeEventListener('change', handlers.change);
    }

    // Limpa todas as referências
    this.listeners.clear();
    this.boundHandlers.clear();
    this.eventQueue.length = 0;
    this.input = null;
    this.isProcessing = false;
  }

  // Método para reinicializar se necessário
  reinitialize() {
    this.destroy();
    this.isDestroyed = false;
    this.init();
  }
}

// Instância singleton
export const eventCoordinator = new EventCoordinator();

// Cleanup automático quando a página é descarregada
window.addEventListener('beforeunload', () => {
  eventCoordinator.destroy();
});
