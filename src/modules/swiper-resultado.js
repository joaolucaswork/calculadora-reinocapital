/**
 * Swiper Resultado System - Standalone for Webflow
 * Creates synchronized button and content swipers for results section
 */

class ReinoSwiperResultado {
  constructor() {
    this.menuSwiper = null;
    this.resultadoSwiper = null;
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.waitForSwiper());
    } else {
      this.waitForSwiper();
    }
  }

  waitForSwiper() {
    if (typeof Swiper !== 'undefined') {
      this.initializeSwipers();
    } else {
      setTimeout(() => this.waitForSwiper(), 100);
    }
  }

  initializeSwipers() {
    const buttonContainer = document.querySelector('.swiper.is-button');
    const resultadoContainer = document.querySelector('.swiper.is-resultado');

    if (!buttonContainer || !resultadoContainer) {
      setTimeout(() => this.initializeSwipers(), 100);
      return;
    }

    try {
      // Initialize button swiper (horizontal navigation)
      this.menuSwiper = new Swiper('.swiper.is-button', {
        slidesPerView: 'auto',
        spaceBetween: 24,
        keyboard: true,
        centeredSlides: false,
        on: {
          init: () => {
            this.setupButtonContainer();
            this.updateButtonStyles();
          },
          slideChange: () => {
            this.updateButtonStyles();
          },
        },
      });

      // Initialize content swiper (vertical slides)
      this.resultadoSwiper = new Swiper('.swiper.is-resultado', {
        direction: 'vertical',
        slidesPerView: 'auto',
        spaceBetween: 32,
        followFinger: true,
        keyboard: true,
        slideToClickedSlide: true,
        allowTouchMove: false,
        // grabCursor: true,
        height: 500,
        centeredSlides: true,
        mousewheel: {
          enabled: true,
          forceToAxis: true,
          sensitivity: 1,
          thresholdDelta: 50,
          thresholdTime: 500,
        },
        on: {
          init: () => {
            this.setupResponsiveContainer();
            this.updateSlideOpacity();
          },
          slideChange: () => {
            this.updateSlideOpacity();
            this.updateButtonStyles();
          },
        },
      });

      // Sync swipers together
      if (this.menuSwiper && this.resultadoSwiper) {
        this.menuSwiper.controller.control = this.resultadoSwiper;
        this.resultadoSwiper.controller.control = this.menuSwiper;
      }

      this.setupResponsiveContainer();
      this.setupButtonInteractions();
      this.setupSectionScrollHandler();
      this.updateButtonStyles();
      this.updateSlideOpacity();

      setTimeout(() => {
        this.setInitialState();
      }, 100);
    } catch (error) {
      console.error('❌ Error initializing swipers:', error);
    }
  }

  setupButtonContainer() {
    const buttonContainer = document.querySelector('.swiper.is-button');
    if (buttonContainer) {
      buttonContainer.style.maxWidth = '470px';
    }
  }

  setupResponsiveContainer() {
    const resultadoContainer = document.querySelector('.swiper.is-resultado');
    if (resultadoContainer) {
      resultadoContainer.style.maxWidth = '940px';
      resultadoContainer.style.minWidth = '800px';
      resultadoContainer.style.margin = '0 auto';
      resultadoContainer.style.width = '100%';
      resultadoContainer.style.position = 'relative';
    }
  }

  setupButtonInteractions() {
    const buttonSlides = document.querySelectorAll('.swiper-slide.is-button');

    buttonSlides.forEach((slide, index) => {
      slide.addEventListener('click', (e) => {
        e.preventDefault();
        this.goToSlide(index);
      });

      slide.style.cursor = 'pointer';
    });
  }

  setupSectionScrollHandler() {
    const section = document.querySelector('._5-section-resultado');
    if (section) {
      section.addEventListener(
        'wheel',
        (e) => {
          if (this.resultadoSwiper) {
            e.preventDefault();
            if (e.deltaY > 0) {
              this.resultadoSwiper.slideNext();
            } else {
              this.resultadoSwiper.slidePrev();
            }
          }
        },
        { passive: false }
      );
    }
  }

  updateButtonStyles() {
    const buttonSlides = document.querySelectorAll('.swiper-slide.is-button');
    const activeIndex = this.resultadoSwiper ? this.resultadoSwiper.activeIndex : 0;

    buttonSlides.forEach((slide, index) => {
      slide.style.transition = 'all 0.3s ease';
      slide.style.cursor = 'pointer';

      if (index === activeIndex) {
        slide.style.backgroundColor = '#a2801a';
        slide.style.color = '#ffffff';
      } else {
        slide.style.backgroundColor = 'transparent';
        slide.style.color = 'black';
      }
    });
  }

  updateSlideOpacity() {
    const resultadoSlides = document.querySelectorAll('.swiper-slide.is-resultado');
    const activeIndex = this.resultadoSwiper ? this.resultadoSwiper.activeIndex : 0;

    resultadoSlides.forEach((slide, index) => {
      slide.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      slide.style.transformOrigin = 'center center';

      if (index === activeIndex) {
        slide.style.opacity = '1';
        slide.style.transform = 'scale(1)';
        slide.style.zIndex = '2';
      } else {
        slide.style.opacity = '0.5';
        slide.style.transform = 'scale(0.95)';
        slide.style.zIndex = '1';
      }
    });
  }

  setInitialState() {
    if (this.menuSwiper && this.resultadoSwiper) {
      this.menuSwiper.slideTo(0, 0);
      this.resultadoSwiper.slideTo(0, 0);
      this.updateButtonStyles();
      this.updateSlideOpacity();
    }
  }

  goToSlide(index) {
    if (this.menuSwiper && this.resultadoSwiper) {
      this.menuSwiper.slideTo(index, 300);
      this.resultadoSwiper.slideTo(index, 300);
    }
  }

  getActiveIndex() {
    return this.resultadoSwiper ? this.resultadoSwiper.activeIndex : 0;
  }
}

// Auto-initialize for standalone use (matching original pattern)
// DESATIVADO - mantido para uso futuro
/*
if (typeof window !== 'undefined') {
  const initWhenReady = () => {
    if (typeof Swiper !== 'undefined') {
      if (!window.ReinoSwiperResultado) {
        window.ReinoSwiperResultado = new ReinoSwiperResultado();
      }
    } else {
      setTimeout(initWhenReady, 100);
    }
  };

  initWhenReady();
}
*/
