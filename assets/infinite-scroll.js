if (!customElements.get('infinite-scroll-loader')) {
  class InfiniteScrollLoader extends HTMLElement {
    constructor() {
      super();
      this.sectionId = this.dataset.sectionId;
      this.nextUrl = this.dataset.nextUrl;
      this.loading = false;
      // Fetches usually resolve almost instantly, which makes the spinner flash by
      // unnoticed. Hold it on screen for a minimum duration so loading is legible.
      this.minLoadingMs = 2000;
    }

    connectedCallback() {
      this.observer = new IntersectionObserver(this.onIntersect.bind(this), {
        rootMargin: '0px 0px 300px 0px',
      });
      this.observer.observe(this);
    }

    disconnectedCallback() {
      this.observer?.disconnect();
    }

    onIntersect(entries) {
      if (entries[0].isIntersecting && !this.loading && this.nextUrl) {
        this.loadMore();
      }
    }

    async loadMore() {
      this.loading = true;
      this.classList.add('loading');

      try {
        const separator = this.nextUrl.includes('?') ? '&' : '?';
        const url = `${this.nextUrl}${separator}section_id=${this.sectionId}`;
        const minDelay = new Promise((resolve) => setTimeout(resolve, this.minLoadingMs));
        const [response] = await Promise.all([fetch(url), minDelay]);
        const text = await response.text();
        const html = document.createElement('div');
        html.innerHTML = text;

        const newGrid = html.querySelector(`#product-grid[data-id="${this.sectionId}"]`);
        const currentGrid = document.querySelector(`#product-grid[data-id="${this.sectionId}"]`);

        if (newGrid && currentGrid) {
          // Newly injected items never get picked up by the page's scroll-reveal
          // IntersectionObserver (it only scans the DOM once, on load), so strip the
          // reveal classes here instead of leaving them to fade in with a stacked delay.
          newGrid.querySelectorAll('.scroll-trigger').forEach((item) => {
            item.classList.remove('scroll-trigger', 'animate--slide-in', 'animate--fade-in');
            item.removeAttribute('data-cascade');
            item.style.removeProperty('--animation-order');
          });
          currentGrid.append(...newGrid.childNodes);
        }

        const newProgress = html.querySelector(`#InfiniteScrollProgress-${this.sectionId}`);
        const currentProgress = document.querySelector(`#InfiniteScrollProgress-${this.sectionId}`);
        if (newProgress && currentProgress) {
          currentProgress.innerHTML = newProgress.innerHTML;
        }

        const newLoader = html.querySelector('infinite-scroll-loader');
        this.nextUrl = newLoader && newLoader.dataset.nextUrl ? newLoader.dataset.nextUrl : null;

        if (!this.nextUrl) {
          this.remove();
          return;
        }
      } catch (error) {
        console.error('Infinite scroll failed to load more products', error);
        this.nextUrl = null;
        this.remove();
        return;
      } finally {
        this.loading = false;
        this.classList.remove('loading');
      }
    }
  }

  customElements.define('infinite-scroll-loader', InfiniteScrollLoader);
}
