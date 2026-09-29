// Delegated at the document level (rather than bound directly to each
// button) so a single listener covers both the inline card and every card
// in the expandable "View All Coupons" list.
document.addEventListener('click', (event) => {
  const copyButton = event.target.closest('.coupon-card__copy');
  if (copyButton) {
    const value = copyButton.dataset.copyValue;
    if (!value || !navigator.clipboard) return;

    navigator.clipboard.writeText(value).then(() => {
      copyButton.classList.add('coupon-card__copy--copied');
      window.clearTimeout(copyButton.copiedTimeout);
      copyButton.copiedTimeout = window.setTimeout(() => {
        copyButton.classList.remove('coupon-card__copy--copied');
      }, 1500);
    });
    return;
  }

  const viewAllButton = event.target.closest('.coupons__view-all');
  if (viewAllButton) {
    const list = document.getElementById(viewAllButton.getAttribute('aria-controls'));
    if (!list) return;

    const expanded = viewAllButton.getAttribute('aria-expanded') === 'true';
    viewAllButton.setAttribute('aria-expanded', String(!expanded));
    viewAllButton.classList.toggle('coupons__view-all--expanded', !expanded);
    list.hidden = expanded;
  }
});
