if (!customElements.get('media-gallery')) {
  customElements.define(
    'media-gallery',
    class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.elements = {
          liveRegion: this.querySelector('[id^="GalleryStatus"]'),
          viewer: this.querySelector('[id^="GalleryViewer"]'),
          thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
          dots: this.querySelector('[id^="GalleryDots"]'),
        };
        this.mql = window.matchMedia('(min-width: 750px)');
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!this.elements.thumbnails && !this.elements.dots) return;

        this.elements.viewer.addEventListener('slideChanged', debounce(this.onSlideChanged.bind(this), 500));

        if (this.elements.thumbnails) {
          this.elements.thumbnails.querySelectorAll('[data-target]').forEach((mediaToSwitch) => {
            mediaToSwitch
              .querySelector('button')
              .addEventListener('click', this.setActiveMedia.bind(this, mediaToSwitch.dataset.target, false));
          });
        }

        if (this.elements.dots) {
          this.elements.dots.querySelectorAll('[data-target]').forEach((dot) => {
            dot.addEventListener('click', this.setActiveMedia.bind(this, dot.dataset.target, false));
          });
        }

        if (this.dataset.desktopLayout.includes('thumbnail') && this.mql.matches) this.removeListSemantic();

        if (this.elements.thumbnails) {
          this.matchThumbnailColumnHeight();
          this.resizeObserver = new ResizeObserver(() => this.matchThumbnailColumnHeight());
          this.resizeObserver.observe(this.elements.viewer);
        }
      }

      // Flexbox sizes a row by its tallest child's content, not by a chosen
      // "driver" child — align-items: stretch alone can't cap the thumbnail
      // column to the main image's height when the column's own content is
      // taller. Measuring and applying max-height directly sidesteps that.
      matchThumbnailColumnHeight() {
        if (!this.isThumbnailColumnVertical()) {
          this.elements.thumbnails.style.maxHeight = '';
          return;
        }
        this.elements.thumbnails.style.maxHeight = `${this.elements.viewer.offsetHeight}px`;
      }

      onSlideChanged(event) {
        const mediaId = event.detail.currentElement.dataset.mediaId;
        if (this.elements.thumbnails) {
          this.setActiveThumbnail(this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`));
        }
        if (this.elements.dots) {
          this.setActiveDot(this.elements.dots.querySelector(`[data-target="${mediaId}"]`));
        }
      }

      setActiveMedia(mediaId, prepend) {
        const activeMedia =
          this.elements.viewer.querySelector(`[data-media-id="${mediaId}"]`) ||
          this.elements.viewer.querySelector('[data-media-id]');
        if (!activeMedia) {
          return;
        }
        this.elements.viewer.querySelectorAll('[data-media-id]').forEach((element) => {
          element.classList.remove('is-active');
        });
        activeMedia?.classList?.add('is-active');

        if (prepend) {
          activeMedia.parentElement.firstChild !== activeMedia && activeMedia.parentElement.prepend(activeMedia);

          if (this.elements.thumbnails) {
            const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
            activeThumbnail.parentElement.firstChild !== activeThumbnail && activeThumbnail.parentElement.prepend(activeThumbnail);
          }

          if (this.elements.viewer.slider) this.elements.viewer.resetPages();
        }

        this.preventStickyHeader();
        window.setTimeout(() => {
          if (!this.mql.matches || this.elements.thumbnails) {
            activeMedia.parentElement.scrollTo({ left: activeMedia.offsetLeft });
          }
          const activeMediaRect = activeMedia.getBoundingClientRect();
          // Don't scroll if the image is already in view
          if (activeMediaRect.top > -0.5) return;
          const top = activeMediaRect.top + window.scrollY;
          window.scrollTo({ top: top, behavior: 'smooth' });
        });
        this.playActiveMedia(activeMedia);

        let announceTarget;
        if (this.elements.thumbnails) {
          announceTarget = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
          this.setActiveThumbnail(announceTarget);
        }
        if (this.elements.dots) {
          const activeDot = this.elements.dots.querySelector(`[data-target="${mediaId}"]`);
          this.setActiveDot(activeDot);
          announceTarget = announceTarget || activeDot;
        }
        if (announceTarget) this.announceLiveRegion(activeMedia, announceTarget.dataset.mediaPosition);
      }

      setActiveDot(dot) {
        if (!this.elements.dots || !dot) return;

        this.elements.dots.querySelectorAll('.slider-dot').forEach((element) => {
          element.classList.remove('slider-dot--active');
          element.removeAttribute('aria-current');
        });
        dot.classList.add('slider-dot--active');
        dot.setAttribute('aria-current', true);
      }

      setActiveThumbnail(thumbnail) {
        if (!this.elements.thumbnails || !thumbnail) return;

        this.elements.thumbnails
          .querySelectorAll('button')
          .forEach((element) => element.removeAttribute('aria-current'));
        thumbnail.querySelector('button').setAttribute('aria-current', true);

        if (this.isThumbnailColumnVertical()) {
          // The scrollable element here is the .thumbnail-slider wrapper
          // itself (this.elements.thumbnails), not the inner .slider list —
          // that's just a plain flex column with no overflow of its own.
          const scroller = this.elements.thumbnails;
          const scrollerRect = scroller.getBoundingClientRect();
          const thumbRect = thumbnail.getBoundingClientRect();
          const top = thumbRect.top - scrollerRect.top + scroller.scrollTop;
          const bottom = top + thumbRect.height;
          if (top >= scroller.scrollTop && bottom <= scroller.scrollTop + scroller.clientHeight) return;
          scroller.scrollTo({
            top: top - (scroller.clientHeight - thumbRect.height) / 2,
            behavior: this.reducedMotion ? 'auto' : 'smooth',
          });
          return;
        }

        if (this.elements.thumbnails.isSlideVisible(thumbnail, 10)) return;
        this.elements.thumbnails.slider.scrollTo({
          left: thumbnail.offsetLeft,
          behavior: this.reducedMotion ? 'auto' : 'smooth',
        });
      }

      isThumbnailColumnVertical() {
        const list = this.elements.thumbnails?.slider;
        return !!list && getComputedStyle(list).flexDirection === 'column';
      }

      announceLiveRegion(activeItem, position) {
        const image = activeItem.querySelector('.product__modal-opener--image img');
        if (!image) return;
        image.onload = () => {
          this.elements.liveRegion.setAttribute('aria-hidden', false);
          this.elements.liveRegion.innerHTML = window.accessibilityStrings.imageAvailable.replace('[index]', position);
          setTimeout(() => {
            this.elements.liveRegion.setAttribute('aria-hidden', true);
          }, 2000);
        };
        image.src = image.src;
      }

      playActiveMedia(activeItem) {
        window.pauseAllMedia();
        const deferredMedia = activeItem.querySelector('.deferred-media');
        if (deferredMedia) deferredMedia.loadContent(false);
      }

      preventStickyHeader() {
        this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
        if (!this.stickyHeader) return;
        this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
      }

      removeListSemantic() {
        if (!this.elements.viewer.slider) return;
        this.elements.viewer.slider.setAttribute('role', 'presentation');
        this.elements.viewer.sliderItems.forEach((slide) => slide.setAttribute('role', 'presentation'));
      }
    }
  );
}
