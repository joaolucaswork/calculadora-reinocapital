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
      if (this.isInitialized) {
        return;
      }

      if (this.supportsFocusVisible()) {
        return;
      }

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
      document.addEventListener('keydown', (e) => {
        this.onKeyDown(e);
      });

      document.addEventListener('mousedown', () => {
        this.onPointerDown();
      });

      document.addEventListener('touchstart', () => {
        this.onPointerDown();
      });

      document.addEventListener(
        'focus',
        (e) => {
          this.onFocus(e);
        },
        true
      );

      document.addEventListener(
        'blur',
        (e) => {
          this.onBlur(e);
        },
        true
      );
    }

    onKeyDown(e) {
      if (e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }

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

        if (this.keyboardThrottleTimeoutID) {
          clearTimeout(this.keyboardThrottleTimeoutID);
        }

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
      if (this.hadKeyboardEvent) {
        return true;
      }

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

      if (element.contentEditable === 'true') {
        return true;
      }

      const role = element.getAttribute('role');
      if (role === 'textbox' || role === 'searchbox') {
        return true;
      }

      return false;
    }

    destroy() {
      document.documentElement.classList.remove('js-focus-visible');

      const focusVisibleElements = document.querySelectorAll('.focus-visible');
      focusVisibleElements.forEach((el) => {
        el.classList.remove('focus-visible');
      });

      this.isInitialized = false;
    }
  }

  window.ReinoFocusVisiblePolyfill = new FocusVisiblePolyfill();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoFocusVisiblePolyfill.init();
    });
  } else {
    window.ReinoFocusVisiblePolyfill.init();
  }
})();
