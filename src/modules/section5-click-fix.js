/**
 * Section 5 Click Fix - Addresses clickability issues with section 5
 * This module ensures section 5 is properly clickable by managing overlapping elements
 */

(function() {
  'use strict';

  class Section5ClickFix {
    constructor() {
      this.isInitialized = false;
      this.progressBar = null;
      this.section5 = null;
      this.config = {
        enableLogging: window.location.search.includes('debug=true'),
      };
    }

    init() {
      if (this.isInitialized) return;

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      try {
        this.cacheElements();
        this.setupClickHandlers();
        this.setupProgressBarFix();
        this.setupSectionObserver();
        this.isInitialized = true;

        if (this.config.enableLogging) {
          console.log('✅ Section 5 Click Fix initialized successfully');
        }
      } catch (error) {
        console.error('❌ Section 5 Click Fix initialization failed:', error);
      }
    }

    cacheElements() {
      this.progressBar = document.querySelector('.progress-bar');
      this.section5 = document.querySelector('[data-step="5"]');

      if (!this.section5) {
        throw new Error('Section 5 not found');
      }

      if (this.config.enableLogging) {
        console.log('📍 Section 5 found:', this.section5);
        console.log('📍 Progress bar found:', this.progressBar);
      }
    }

    setupClickHandlers() {
      // Add click event delegation to handle clicks on section 5
      document.addEventListener('click', (event) => {
        const section5Element = event.target.closest('[data-step="5"]');
        if (section5Element) {
          this.handleSection5Click(event);
        }
      }, true); // Use capture phase to intercept before other handlers

      // Ensure section 5 has proper pointer events
      if (this.section5) {
        this.section5.style.pointerEvents = 'auto';
        this.section5.style.position = 'relative';
        this.section5.style.zIndex = '10000';
      }
    }

    setupProgressBarFix() {
      if (!this.progressBar) return;

      // Force pointer-events: none when section 5 is visible
      const observer = new MutationObserver(() => {
        this.checkAndFixProgressBar();
      });

      observer.observe(this.progressBar, {
        attributes: true,
        attributeFilter: ['class', 'style']
      });

      // Initial check
      this.checkAndFixProgressBar();
    }

    checkAndFixProgressBar() {
      if (!this.progressBar || !this.section5) return;

      const section5Visible = this.isSection5Visible();
      
      if (section5Visible) {
        // Force pointer-events: none on progress bar when section 5 is visible
        this.progressBar.style.pointerEvents = 'none';
        this.progressBar.classList.add('aloca-section');
        
        if (this.config.enableLogging) {
          console.log('🔧 Fixed progress bar pointer events for section 5');
        }
      }
    }

    isSection5Visible() {
      if (!this.section5) return false;
      
      const style = window.getComputedStyle(this.section5);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }

    setupSectionObserver() {
      // Watch for section visibility changes
      const observer = new MutationObserver(() => {
        if (this.isSection5Visible()) {
          this.ensureSection5Clickable();
        }
      });

      if (this.section5) {
        observer.observe(this.section5, {
          attributes: true,
          attributeFilter: ['style', 'class']
        });
      }

      // Also observe the parent container for display changes
      const mainWrapper = document.querySelector('.main-wrapper');
      if (mainWrapper) {
        observer.observe(mainWrapper, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class']
        });
      }
    }

    ensureSection5Clickable() {
      if (!this.section5) return;

      // Ensure section 5 has the highest z-index and proper pointer events
      this.section5.style.position = 'relative';
      this.section5.style.zIndex = '10000';
      this.section5.style.pointerEvents = 'auto';

      // Fix any overlapping elements
      this.fixOverlappingElements();

      if (this.config.enableLogging) {
        console.log('🎯 Ensured section 5 is clickable');
      }
    }

    fixOverlappingElements() {
      // Fix progress bar
      if (this.progressBar) {
        this.progressBar.style.pointerEvents = 'none';
      }

      // Fix any other high z-index elements that might interfere
      const highZIndexElements = document.querySelectorAll('[style*="z-index"]');
      highZIndexElements.forEach(element => {
        const zIndex = parseInt(window.getComputedStyle(element).zIndex);
        if (zIndex > 9000 && element !== this.section5) {
          element.style.pointerEvents = 'none';
        }
      });
    }

    handleSection5Click(event) {
      if (this.config.enableLogging) {
        console.log('🖱️ Section 5 click detected:', event.target);
      }

      // Ensure the click is properly handled
      event.stopPropagation();
      
      // Dispatch a custom event for other systems to handle
      document.dispatchEvent(new CustomEvent('section5Clicked', {
        detail: {
          originalEvent: event,
          target: event.target,
          section: this.section5
        }
      }));
    }

    // Public API
    forceFixSection5() {
      this.ensureSection5Clickable();
      this.checkAndFixProgressBar();
    }

    getStatus() {
      return {
        initialized: this.isInitialized,
        section5Found: !!this.section5,
        progressBarFound: !!this.progressBar,
        section5Visible: this.isSection5Visible(),
        section5Clickable: this.section5 ? this.section5.style.pointerEvents !== 'none' : false
      };
    }
  }

  // Initialize the fix
  const section5ClickFix = new Section5ClickFix();
  section5ClickFix.init();

  // Expose to global scope for debugging
  window.Section5ClickFix = section5ClickFix;

  // Auto-fix when page loads
  window.addEventListener('load', () => {
    setTimeout(() => {
      section5ClickFix.forceFixSection5();
    }, 1000);
  });

})();
