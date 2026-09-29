class StickyAddToCart extends HTMLElement {
  connectedCallback() {
    this.trigger = document.getElementById(this.dataset.triggerId);
    this.button = this.querySelector('button');
    if (!this.trigger || !this.button) return;

    this.spinner = this.button.querySelector('.loading__spinner');
    this.label = this.button.querySelector('span');

    this.syncButtonState();

    this.mutationObserver = new MutationObserver(() => this.syncButtonState());
    this.mutationObserver.observe(this.trigger, {
      attributes: true,
      attributeFilter: ['disabled', 'aria-disabled', 'class'],
      childList: true,
      subtree: true,
      characterData: true,
    });

    this.triggerScrolledAbove = false;
    this.pastHideBoundary = false;

    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.triggerScrolledAbove = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
        this.queueVisibilityUpdate();
      },
      { threshold: 0 }
    );
    this.intersectionObserver.observe(this.trigger);

    // Hide again as soon as a later section (the newsletter signup) reaches
    // the viewport - not only once fully scrolled past - so the bar is gone
    // by the time the newsletter comes into view. Section id is dynamic per
    // instance, hence the prefix match.
    this.hideBoundary = document.querySelector('[id^="Newsletter-"]');
    if (this.hideBoundary) {
      this.hideBoundaryObserver = new IntersectionObserver(
        ([entry]) => {
          this.pastHideBoundary = entry.boundingClientRect.top < window.innerHeight;
          this.queueVisibilityUpdate();
        },
        { threshold: 0 }
      );
      this.hideBoundaryObserver.observe(this.hideBoundary);
    }

    this.button.addEventListener('click', () => this.trigger.click());
  }

  queueVisibilityUpdate() {
    // Debounced: momentum scroll can report a flickering isIntersecting
    // right as an observed element crosses the viewport edge, which would
    // otherwise restart the show/hide transition mid-flight and look
    // like the bar is shaking.
    clearTimeout(this.visibilityTimeout);
    this.visibilityTimeout = setTimeout(() => {
      this.classList.toggle('sticky-add-to-cart--visible', this.triggerScrolledAbove && !this.pastHideBoundary);
    }, 100);
  }

  disconnectedCallback() {
    this.intersectionObserver?.disconnect();
    this.hideBoundaryObserver?.disconnect();
    this.mutationObserver?.disconnect();
    clearTimeout(this.visibilityTimeout);
  }

  syncButtonState() {
    const isDisabled = this.trigger.disabled || this.trigger.getAttribute('aria-disabled') === 'true';
    const isLoading = this.trigger.classList.contains('loading');
    const triggerSpinnerHidden = this.trigger.querySelector('.loading__spinner')?.classList.contains('hidden') ?? true;
    const triggerLabel = this.trigger.querySelector('span');

    this.button.disabled = isDisabled;
    this.button.classList.toggle('loading', isLoading);
    this.spinner?.classList.toggle('hidden', triggerSpinnerHidden);
    if (triggerLabel && this.label) this.label.textContent = triggerLabel.textContent;
  }
}

customElements.define('sticky-add-to-cart', StickyAddToCart);
