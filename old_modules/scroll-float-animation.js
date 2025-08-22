import { eventCoordinator } from './event-coordinator.js';

/**
 * Scroll Float Animation System
 * Handles scroll-triggered animations for the componente-alocao-float component
 * Uses Motion.js inView to detect when _3-section-patrimonio-alocation reaches viewport center
 */
export class ScrollFloatAnimationSystem {
  constructor() {
    this.isInitialized = false;
    this.Motion = null;
    this.floatComponent = null;
    this.targetSection = null;
    this.inViewCleanup = null;
    this.isAnimated = false;
  }

  init() {
    if (this.isInitialized) {
      return;
    }

    document.addEventListener('DOMContentLoaded', () => {
      this.waitForMotion();
    });

    this.isInitialized = true;
  }

  waitForMotion() {
    if (window.Motion && window.Motion.inView) {
      this.Motion = window.Motion;
      this.initScrollAnimation();
    } else {
      setTimeout(() => this.waitForMotion(), 50);
    }
  }

  initScrollAnimation() {
    const { animate, inView } = this.Motion;

    // Find the target elements
    this.floatComponent = document.querySelector('.componente-alocao-float');
    this.targetSection = document.querySelector('._3-section-patrimonio-alocation');

    if (!this.floatComponent || !this.targetSection) {
      console.warn('ScrollFloatAnimation: Required elements not found');
      return;
    }

    // Set initial state - hidden and scaled down
    this.setInitialState();

    // Setup scroll-triggered animation using inView
    this.setupScrollTrigger(animate, inView);
  }

  setInitialState() {
    // Set initial hidden state - positioned below
    this.floatComponent.style.transform = 'translate(-50%, 30px)';
    this.floatComponent.style.opacity = '0';
  }

  setupScrollTrigger(animate, inView) {
    // Use inView to detect when the section enters and leaves viewport
    this.inViewCleanup = inView(
      this.targetSection,
      (element, enterInfo) => {
        // Element enters viewport - show animation
        if (!this.isAnimated) {
          this.animateFloatIn(animate);
          this.isAnimated = true;
        }

        // Return function that fires when element leaves viewport
        return (leaveInfo) => {
          this.animateFloatOut(animate);
          this.isAnimated = false;
        };
      },
      {
        // Trigger when 50% of the section is visible (middle of viewport)
        amount: 0.5,
        // Add margin to trigger earlier for better UX
        margin: '-10% 0px -10% 0px',
      }
    );
  }

  animateFloatIn(animate) {
    // Animate sliding up from bottom to final position
    animate(
      this.floatComponent,
      {
        transform: 'translate(-50%, 0px)',
        opacity: 1,
      },
      {
        duration: 0.6,
        ease: 'backOut',
      }
    );

    // Register animation completion event
    document.dispatchEvent(
      new CustomEvent('scrollFloatAnimated', {
        detail: {
          component: this.floatComponent,
          section: this.targetSection,
        },
      })
    );
  }

  addFloatingEffect(animate) {
    // Floating effect removed to prevent interference with CSS centering
    return;
  }

  animateFloatOut(animate) {
    // Animate sliding down and fade out
    animate(
      this.floatComponent,
      {
        transform: 'translate(-50%, 30px)',
        opacity: 0,
      },
      {
        duration: 0.4,
        ease: 'circIn',
      }
    );

    // Dispatch exit event
    document.dispatchEvent(
      new CustomEvent('scrollFloatExited', {
        detail: {
          component: this.floatComponent,
          section: this.targetSection,
        },
      })
    );
  }

  /**
   * Reset the animation state (useful for testing or re-triggering)
   */
  reset() {
    if (!this.Motion || !this.floatComponent) return;

    const { animate, inView } = this.Motion;

    this.isAnimated = false;
    this.setInitialState();

    // Clean up existing inView instance
    if (this.inViewCleanup && typeof this.inViewCleanup === 'function') {
      this.inViewCleanup();
    }

    // Re-initialize scroll trigger
    this.setupScrollTrigger(animate, inView);
  }

  /**
   * Force show the component (bypass scroll trigger)
   */
  forceShow() {
    if (!this.Motion || !this.floatComponent) return;

    const { animate } = this.Motion;

    animate(
      this.floatComponent,
      {
        transform: 'translate(-50%, 0px)',
        opacity: 1,
      },
      {
        duration: 0.5,
        ease: 'backOut',
      }
    );

    this.isAnimated = true;
  }

  /**
   * Force hide the component
   */
  forceHide() {
    if (!this.Motion || !this.floatComponent) return;

    const { animate } = this.Motion;

    animate(
      this.floatComponent,
      {
        transform: 'translate(-50%, 30px)',
        opacity: 0,
      },
      {
        duration: 0.4,
        ease: 'circIn',
      }
    );

    this.isAnimated = false;
  }

  /**
   * Cleanup method for proper disposal
   */
  cleanup() {
    if (this.inViewCleanup && typeof this.inViewCleanup === 'function') {
      this.inViewCleanup();
    }

    this.Motion = null;
    this.floatComponent = null;
    this.targetSection = null;
    this.inViewCleanup = null;
    this.isAnimated = false;
    this.isInitialized = false;
  }

  /**
   * Get current animation state for debugging
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasMotion: !!this.Motion,
      hasInView: !!(this.Motion && this.Motion.inView),
      hasFloatComponent: !!this.floatComponent,
      hasTargetSection: !!this.targetSection,
      isAnimated: this.isAnimated,
      hasInViewCleanup: !!this.inViewCleanup,
    };
  }
}
