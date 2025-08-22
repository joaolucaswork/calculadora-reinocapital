/**
 * EventCoordinator - Sistema centralizado para gerenciar eventos do input principal
 * Versão Webflow TXT - Sem imports/exports
 * Evita conflitos entre múltiplos módulos e memory leaks
 */

(function() {
  'use strict';

  class EventCoordinator {
    constructor() {
      this.input = null;
      this.listeners = new Map();
      this.isProcessing = false;
      this.eventQueue = [];
      this.boundHandlers = new Map();
      this.isDestroyed = false;

      this.init();
    }

    init() {
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

      const inputHandler = (e) => this.handleInputEvent(e);
      const focusHandler = (e) => this.processFocusEvent(e);
      const blurHandler = (e) => this.processBlurEvent(e);
      const changeHandler = (e) => this.processChangeEvent(e);

      this.boundHandlers.set('main', {
        input: inputHandler,
        focus: focusHandler,
        blur: blurHandler,
        change: changeHandler,
      });

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

      requestAnimationFrame(() => {
        this.processInputEvent(e);
        this.isProcessing = false;

        if (this.eventQueue.length > 0) {
          const nextEvent = this.eventQueue.shift();
          requestAnimationFrame(() => this.handleInputEvent(nextEvent));
        }
      });
    }

    registerListener(moduleId, eventType, callback) {
      if (this.isDestroyed) return;

      const key = `${moduleId}_${eventType}`;

      this.unregisterListener(moduleId, eventType);

      if (!this.listeners.has(key)) {
        this.listeners.set(key, []);
      }

      this.listeners.get(key).push(callback);
    }

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
          this.listeners.delete(key);
        }
      }
    }

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

    dispatchInputEvent(sourceModule = 'unknown') {
      if (this.isProcessing || this.isDestroyed || !this.input) {
        return;
      }

      const event = new Event('input', { bubbles: true });
      event.sourceModule = sourceModule;
      this.input.dispatchEvent(event);
    }

    setSilentValue(value) {
      if (this.isDestroyed || !this.input) return;

      this.isProcessing = true;
      this.input.value = value;

      requestAnimationFrame(() => {
        this.isProcessing = false;
      });
    }

    getValue() {
      return this.input ? this.input.value : '';
    }

    setValue(value, sourceModule = 'unknown') {
      if (this.isDestroyed || !this.input) return;

      this.input.value = value;
      this.dispatchInputEvent(sourceModule);
    }

    destroy() {
      this.isDestroyed = true;

      if (this.input && this.boundHandlers.has('main')) {
        const handlers = this.boundHandlers.get('main');
        this.input.removeEventListener('input', handlers.input);
        this.input.removeEventListener('focus', handlers.focus);
        this.input.removeEventListener('blur', handlers.blur);
        this.input.removeEventListener('change', handlers.change);
      }

      this.listeners.clear();
      this.boundHandlers.clear();
      this.eventQueue.length = 0;
      this.input = null;
      this.isProcessing = false;
    }

    reinitialize() {
      this.destroy();
      this.isDestroyed = false;
      this.init();
    }
  }

  // Cria instância global
  window.ReinoEventCoordinator = new EventCoordinator();

  // Cleanup automático
  window.addEventListener('beforeunload', () => {
    if (window.ReinoEventCoordinator) {
      window.ReinoEventCoordinator.destroy();
    }
  });

})();