class HeroSlider extends HTMLElement {
  connectedCallback() {
    this.init();
  }

  disconnectedCallback() {
    this.swiper?.destroy(true, true);
    window.removeEventListener('resize', this.updateVideosBound);
  }

  init() {
    if (typeof Swiper === 'undefined') return;

    const container = this.querySelector('.swiper');
    if (!container) return;

    const nextEl = this.querySelector('.swiper-button-next');
    const prevEl = this.querySelector('.swiper-button-prev');
    const paginationEl = this.querySelector('.swiper-pagination');
    const speed = parseInt(this.dataset.autoplaySpeed, 10) || 5000;

    this.swiper = new Swiper(container, {
      loop: this.dataset.loop === 'true',
      autoplay:
        this.dataset.autoplay === 'true'
          ? { delay: speed, disableOnInteraction: false, pauseOnMouseEnter: true }
          : false,
      navigation: nextEl && prevEl ? { nextEl, prevEl } : false,
      pagination: paginationEl ? { el: paginationEl, clickable: true } : false,
      on: {
        init: () => this.updateVideos(),
        slideChangeTransitionStart: () => this.updateVideos(),
      },
    });

    this.updateVideosBound = () => this.updateVideos();
    window.addEventListener('resize', this.updateVideosBound);
  }

  updateVideos() {
    this.querySelectorAll('video').forEach((video) => {
      const slide = video.closest('.swiper-slide');
      const isActiveSlide = slide && slide.classList.contains('swiper-slide-active');
      const isVisible = video.offsetParent !== null;

      if (isActiveSlide && isVisible) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }

  pause() {
    this.swiper?.autoplay?.stop();
  }

  play() {
    this.swiper?.autoplay?.start();
  }

  slideToElement(slideElement) {
    if (!this.swiper) return;
    const index = Array.from(slideElement.parentElement.children).indexOf(slideElement);
    if (index === -1) return;
    this.pause();
    if (this.dataset.loop === 'true') {
      this.swiper.slideToLoop(index);
    } else {
      this.swiper.slideTo(index);
    }
  }
}

customElements.define('hero-slider', HeroSlider);
