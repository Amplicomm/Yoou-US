function hideProductModal() {
  const productModal = document.querySelectorAll('product-modal[open]');
  productModal && productModal.forEach((modal) => modal.hide());
}

document.addEventListener('shopify:block:select', function (event) {
  hideProductModal();
  const blockSelectedIsSlide = event.target.classList.contains('slideshow__slide');
  const blockSelectedIsHeroSlide = event.target.classList.contains('hero-slider__slide');
  const blockSelectedIsSwiperSlide = event.target.classList.contains('swiper-component__slide');

  if (blockSelectedIsHeroSlide) {
    const parentHeroSlider = event.target.closest('hero-slider');
    parentHeroSlider?.slideToElement(event.target);
    return;
  }

  if (blockSelectedIsSwiperSlide) {
    const parentSwiperComponent = event.target.closest('swiper-component');
    parentSwiperComponent?.slideToElement(event.target);
    return;
  }

  if (!blockSelectedIsSlide) return;

  const parentSlideshowComponent = event.target.closest('slideshow-component');
  parentSlideshowComponent.pause();

  setTimeout(function () {
    parentSlideshowComponent.slider.scrollTo({
      left: event.target.offsetLeft,
    });
  }, 200);
});

document.addEventListener('shopify:block:deselect', function (event) {
  const blockDeselectedIsSlide = event.target.classList.contains('slideshow__slide');
  const blockDeselectedIsHeroSlide = event.target.classList.contains('hero-slider__slide');
  const blockDeselectedIsSwiperSlide = event.target.classList.contains('swiper-component__slide');

  if (blockDeselectedIsHeroSlide) {
    const parentHeroSlider = event.target.closest('hero-slider');
    if (parentHeroSlider?.dataset.autoplay === 'true') parentHeroSlider.play();
    return;
  }

  if (blockDeselectedIsSwiperSlide) {
    const parentSwiperComponent = event.target.closest('swiper-component');
    if (parentSwiperComponent?.dataset.autoplay === 'true') parentSwiperComponent.play();
    return;
  }

  if (!blockDeselectedIsSlide) return;
  const parentSlideshowComponent = event.target.closest('slideshow-component');
  if (parentSlideshowComponent.autoplayButtonIsSetToPlay) parentSlideshowComponent.play();
});

document.addEventListener('shopify:section:load', () => {
  hideProductModal();
  const zoomOnHoverScript = document.querySelector('[id^=EnableZoomOnHover]');
  if (!zoomOnHoverScript) return;
  if (zoomOnHoverScript) {
    const newScriptTag = document.createElement('script');
    newScriptTag.src = zoomOnHoverScript.src;
    zoomOnHoverScript.parentNode.replaceChild(newScriptTag, zoomOnHoverScript);
  }
});

document.addEventListener('shopify:section:unload', (event) => {
  document.querySelectorAll(`[data-section="${event.detail.sectionId}"]`).forEach((element) => {
    element.remove();
    document.body.classList.remove('overflow-hidden');
  });
});

document.addEventListener('shopify:section:reorder', () => hideProductModal());

document.addEventListener('shopify:section:select', () => hideProductModal());

document.addEventListener('shopify:section:deselect', () => hideProductModal());

document.addEventListener('shopify:inspector:activate', () => hideProductModal());

document.addEventListener('shopify:inspector:deactivate', () => hideProductModal());
