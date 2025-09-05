/**
 * Focus-Visible Polyfill
 * Provides focus-visible behavior for browsers that don't support it natively
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  class FocusVisiblePolyfill {
    constructor() {
      this.hadKeyboardEvent = false;
      this.keyboardThrottleTimeout = 100;
      this.keyboardThrottleTimeoutID = 0;
      this.isInitialized = false;
    }

    init() {
      if (this.isInitialized) return;

      // Check if browser supports :focus-visible natively
      if (this.supportsFocusVisible()) {
        return;
      }

      // Add class to document for CSS targeting
      document.documentElement.classList.add('js-focus-visible');

      this.setupEventListeners();
      this.isInitialized = true;
    }

    supportsFocusVisible() {
      try {
        document.querySelector(':focus-visible');
        return true;
      } catch (e) {
        return false;
      }
    }

    setupEventListeners() {
      // Track keyboard events
      document.addEventListener('keydown', (e) => {
        this.onKeyDown(e);
      });

      // Track pointer events
      document.addEventListener('mousedown', () => {
        this.onPointerDown();
      });

      document.addEventListener('touchstart', () => {
        this.onPointerDown();
      });

      // Handle focus events
      document.addEventListener('focus', (e) => {
        this.onFocus(e);
      }, true);

      // Handle blur events
      document.addEventListener('blur', (e) => {
        this.onBlur(e);
      }, true);
    }

    onKeyDown(e) {
      // Only consider keyboard events that indicate navigation intent
      if (e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }

      // Tab, Arrow keys, Enter, Space, Escape
      if (
        e.key === 'Tab' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'Enter' ||
        e.key === ' ' ||
        e.key === 'Escape'
      ) {
        this.hadKeyboardEvent = true;

        // Clear any existing timeout
        if (this.keyboardThrottleTimeoutID) {
          clearTimeout(this.keyboardThrottleTimeoutID);
        }

        // Reset keyboard flag after a delay
        this.keyboardThrottleTimeoutID = setTimeout(() => {
          this.hadKeyboardEvent = false;
        }, this.keyboardThrottleTimeout);
      }
    }

    onPointerDown() {
      this.hadKeyboardEvent = false;
    }

    onFocus(e) {
      if (this.shouldShowFocusRing(e.target)) {
        e.target.classList.add('focus-visible');
      }
    }

    onBlur(e) {
      e.target.classList.remove('focus-visible');
    }

    shouldShowFocusRing(element) {
      // Always show focus ring if user was using keyboard
      if (this.hadKeyboardEvent) {
        return true;
      }

      // Show focus ring for text inputs and textareas
      if (
        element.type === 'text' ||
        element.type === 'email' ||
        element.type === 'password' ||
        element.type === 'number' ||
        element.type === 'search' ||
        element.type === 'tel' ||
        element.type === 'url' ||
        element.tagName === 'TEXTAREA'
      ) {
        return true;
      }

      // Show focus ring for elements with contenteditable
      if (element.contentEditable === 'true') {
        return true;
      }

      // Show focus ring for elements with specific roles
      const role = element.getAttribute('role');
      if (role === 'textbox' || role === 'searchbox') {
        return true;
      }

      return false;
    }

    destroy() {
      document.documentElement.classList.remove('js-focus-visible');
      
      // Remove all focus-visible classes
      const focusVisibleElements = document.querySelectorAll('.focus-visible');
      focusVisibleElements.forEach(el => {
        el.classList.remove('focus-visible');
      });

      this.isInitialized = false;
    }
  }

  // Create global instance
  window.ReinoFocusVisiblePolyfill = new FocusVisiblePolyfill();

  // Auto-initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoFocusVisiblePolyfill.init();
    });
  } else {
    window.ReinoFocusVisiblePolyfill.init();
  }
})();
