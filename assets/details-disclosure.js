class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector('details');
    this.content = this.mainDetailsToggle.querySelector('summary').nextElementSibling;

    this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
    this.mainDetailsToggle.addEventListener('toggle', this.onToggle.bind(this));
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }

  close() {
    this.mainDetailsToggle.removeAttribute('open');
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
  }
}

customElements.define('details-disclosure', DetailsDisclosure);

class HeaderMenu extends DetailsDisclosure {
  constructor() {
    super();
    this.header = document.querySelector('.header-wrapper');
    this.hoverCloseDelay = 200;
    this.columnsClass = 'header__submenu--columns';

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      this.addEventListener('mouseenter', this.onMouseEnter.bind(this));
      this.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    }

    window.addEventListener('resize', this.updateColumnLayout.bind(this));
  }

  onMouseEnter() {
    clearTimeout(this.hoverTimeout);

    document.querySelectorAll('header-menu').forEach((menu) => {
      if (menu !== this) {
        clearTimeout(menu.hoverTimeout);
        menu.close();
      }
    });

    this.mainDetailsToggle.setAttribute('open', '');
  }

  onMouseLeave() {
    this.hoverTimeout = setTimeout(() => this.close(), this.hoverCloseDelay);
  }

  onToggle() {
    if (!this.header) return;
    this.header.preventHide = this.mainDetailsToggle.open;

    if (document.documentElement.style.getPropertyValue('--header-bottom-position-desktop') === '') {
      document.documentElement.style.setProperty(
        '--header-bottom-position-desktop',
        `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
      );
    }

    this.updateColumnLayout();
  }

  updateColumnLayout() {
    if (!this.content || !this.header) return;

    this.content.classList.remove(this.columnsClass);

    if (!this.mainDetailsToggle.hasAttribute('open')) return;

    const availableHeight = window.innerHeight - this.header.getBoundingClientRect().bottom - 64;

    if (this.content.scrollHeight > availableHeight) {
      this.content.classList.add(this.columnsClass);
    }
  }
}

customElements.define('header-menu', HeaderMenu);
