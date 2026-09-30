/**
 * Emasole product page behaviour.
 *
 * Everything a shopper reads as a price, stock level or availability is rendered by Liquid,
 * so it always matches the active market and currency. This script swaps those server-rendered
 * regions when a variant changes, runs the gallery and lightbox, enforces quantity rules, and
 * adds to cart through Shopify's standard cart action. Without JavaScript the page still works:
 * options are radio buttons and the form posts to /cart/add.
 *
 * @module em-product
 */
import { Money } from './em-money.js';

const HOVER_ZOOM = window.matchMedia('(hover: hover) and (pointer: fine)');

/* Gallery --------------------------------------------------------------------------------- */

class EmGallery extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('[data-em-gallery-track]');
    this.slides = [...this.querySelectorAll('.em-gallery__slide')];
    this.thumbs = [...this.querySelectorAll('[data-em-gallery-thumb]')];
    this.dots = [...this.querySelectorAll('[data-em-gallery-dot]')];
    this.counter = this.querySelector('[data-em-gallery-index]');
    this.lightbox = this.querySelector('em-lightbox');
    this.active = 0;

    this.addEventListener('click', this.onClick);
    this.addEventListener('pointermove', this.onPointerMove);
    this.track?.addEventListener('keydown', this.onKeydown);

    if ('IntersectionObserver' in window && this.slides.length > 1) {
      this.observer = new IntersectionObserver(this.onIntersect, { root: this.track, threshold: 0.6 });
      this.slides.forEach((slide) => this.observer.observe(slide));
    }
  }

  disconnectedCallback() {
    this.observer?.disconnect();
  }

  onIntersect = (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      this.show(this.slides.indexOf(entry.target), false);
    });
  };

  /**
   * Marks a slide active in the thumbnails, dots and counter.
   * @param {number} index
   * @param {boolean} scroll - Whether to scroll the track to the slide
   */
  show(index, scroll = true) {
    if (index < 0 || index >= this.slides.length) return;
    this.active = index;
    const mediaId = this.slides[index].dataset.mediaId;

    this.slides.forEach((slide, i) => slide.toggleAttribute('data-active', i === index));
    this.dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    if (this.counter) this.counter.textContent = String(index + 1);

    this.thumbs.forEach((thumb) => {
      const current = thumb.dataset.emGalleryThumb === mediaId;
      thumb.setAttribute('aria-current', String(current));
      if (current) this.revealThumb(thumb);
    });

    this.querySelectorAll('video').forEach((video) => {
      if (!video.closest(`[data-media-id="${mediaId}"]`)) video.pause();
    });

    if (scroll && this.track) {
      this.track.scrollTo({ left: this.slides[index].offsetLeft - this.track.offsetLeft });
    }
  }

  /** Scrolls only the thumbnail rail, never the page. */
  revealThumb(thumb) {
    const rail = thumb.closest('.em-gallery__thumbs');
    if (!rail) return;
    const railRect = rail.getBoundingClientRect();
    const rect = thumb.getBoundingClientRect();
    const vertical = rail.scrollHeight > rail.clientHeight + 1;

    if (vertical && (rect.top < railRect.top || rect.bottom > railRect.bottom)) {
      rail.scrollBy({ top: rect.top - railRect.top - (railRect.height - rect.height) / 2 });
    } else if (!vertical && (rect.left < railRect.left || rect.right > railRect.right)) {
      rail.scrollBy({ left: rect.left - railRect.left - (railRect.width - rect.width) / 2 });
    }
  }

  goTo(index) {
    this.show((index + this.slides.length) % this.slides.length);
  }

  /** Jumps to the media a variant points at. */
  select(mediaId) {
    const index = this.slides.findIndex((slide) => slide.dataset.mediaId === String(mediaId));
    if (index >= 0) this.show(index);
  }

  onClick = (event) => {
    const thumb = event.target.closest('[data-em-gallery-thumb]');
    if (thumb) return this.select(thumb.dataset.emGalleryThumb);

    const dot = event.target.closest('[data-em-gallery-dot]');
    if (dot) return this.goTo(Number(dot.dataset.emGalleryDot));

    if (event.target.closest('[data-em-gallery-prev]')) return this.goTo(this.active - 1);
    if (event.target.closest('[data-em-gallery-next]')) return this.goTo(this.active + 1);

    const zoom = event.target.closest('[data-em-zoom]');
    if (zoom) this.lightbox?.open(zoom.dataset.emZoomIndex);
  };

  /** Follows the pointer so the image magnifies under the cursor. */
  onPointerMove = (event) => {
    if (!HOVER_ZOOM.matches) return;
    const zoom = event.target.closest('[data-em-zoom]');
    if (!zoom) return;

    const rect = zoom.getBoundingClientRect();
    zoom.style.setProperty('--em-zx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
    zoom.style.setProperty('--em-zy', `${((event.clientY - rect.top) / rect.height) * 100}%`);
  };

  onKeydown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.goTo(this.active + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.goTo(this.active - 1);
    }
  };
}

/* Lightbox -------------------------------------------------------------------------------- */

class EmLightbox extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector('dialog');
    this.image = this.querySelector('[data-em-lightbox-img]');
    this.counter = this.querySelector('[data-em-lightbox-index]');
    this.items = [...this.querySelectorAll('[data-em-lightbox-item]')];
    this.index = 0;

    this.addEventListener('click', this.onClick);
    this.dialog?.addEventListener('keydown', this.onKeydown);
  }

  open(index = 0) {
    if (!this.dialog?.showModal) return;
    this.dialog.showModal();
    this.show(Number(index) || 0);
  }

  show(index) {
    if (!this.items.length) return;
    this.index = (index + this.items.length) % this.items.length;
    const item = this.items[this.index];

    this.image.classList.add('is-changing');
    this.image.src = item.dataset.src;
    this.image.alt = item.dataset.alt || '';
    this.image.onload = () => this.image.classList.remove('is-changing');
    if (this.counter) this.counter.textContent = String(this.index + 1);

    this.items.forEach((el, i) => el.setAttribute('aria-current', String(i === this.index)));
    item.scrollIntoView({ block: 'nearest', inline: 'center' });

    // Warm the neighbours so stepping through feels instant.
    for (const offset of [1, -1]) {
      const neighbour = this.items[(this.index + offset + this.items.length) % this.items.length];
      if (neighbour) new Image().src = neighbour.dataset.src;
    }
  }

  onClick = (event) => {
    if (event.target.closest('[data-em-lightbox-prev]')) return this.show(this.index - 1);
    if (event.target.closest('[data-em-lightbox-next]')) return this.show(this.index + 1);
    if (event.target.closest('[data-em-lightbox-close]')) return this.dialog.close();

    const item = event.target.closest('[data-em-lightbox-item]');
    if (item) return this.show(this.items.indexOf(item));

    // A click on the dialog's own backdrop closes it.
    if (event.target === this.dialog) this.dialog.close();
  };

  onKeydown = (event) => {
    if (event.key === 'ArrowRight') this.show(this.index + 1);
    else if (event.key === 'ArrowLeft') this.show(this.index - 1);
  };
}

/* Product --------------------------------------------------------------------------------- */

class EmProduct extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('.em-buy__form');
    this.variantInput = this.querySelector('[data-em-variant-input]');
    this.gallery = this.querySelector('em-gallery');
    this.money = Money.from(this);

    this.addEventListener('change', this.onChange);
    this.addEventListener('input', this.onInput);
    this.addEventListener('click', this.onClick);
    this.form?.addEventListener('submit', this.onSubmit);

    this.applyRules();
    this.updateTotal();
    this.setupStickyBar();
  }

  disconnectedCallback() {
    if (this.onScroll) window.removeEventListener('scroll', this.onScroll);
    this.stickyBound = false;
    this.form?.removeEventListener('submit', this.onSubmit);
  }

  string(key) {
    const template = this.querySelector('template[data-em-strings]');
    return template?.content.querySelector(`[data-key="${key}"]`)?.textContent.trim() || '';
  }

  get quantityInput() {
    return this.querySelector('.em-qty__input');
  }

  /* Variants ----------------------------------------------------------------------------- */

  onChange = (event) => {
    const target = event.target;

    if (target.matches('.em-option__input')) {
      const ids = [...this.querySelectorAll('[data-em-option]')]
        .map((fieldset) => fieldset.querySelector('.em-option__input:checked')?.dataset.optionValueId)
        .filter(Boolean);
      this.renderVariant(ids, target.id);
    } else if (target.matches('.em-qty__input')) {
      this.normalizeQuantity();
      this.updateTotal();
    } else if (target.matches('[name="selling_plan"]')) {
      this.updateTotal();
    }
  };

  onInput = (event) => {
    if (event.target.matches('.em-qty__input')) this.updateTotal();
  };

  async renderVariant(optionValueIds, focusId) {
    const url = new URL(this.dataset.productUrl, window.location.origin);
    url.searchParams.set('option_values', optionValueIds.join(','));
    url.searchParams.set('section_id', this.dataset.sectionId);

    this.controller?.abort();
    this.controller = new AbortController();
    this.setAttribute('data-loading', '');

    try {
      const response = await fetch(url.toString(), { signal: this.controller.signal });
      if (!response.ok) throw new Error(response.statusText);

      const html = new DOMParser().parseFromString(await response.text(), 'text/html');
      const next = html.querySelector('em-product');
      if (!next) throw new Error('Missing product');

      this.querySelectorAll('[data-em-live]').forEach((region) => {
        const replacement = next.querySelector(`[data-em-live="${region.dataset.emLive}"]`);
        if (replacement) region.replaceWith(replacement);
      });

      const variantId = next.dataset.variantId;
      this.dataset.variantId = variantId;
      if (this.variantInput) {
        this.variantInput.value = variantId;
        this.variantInput.disabled = !variantId;
      }

      if (variantId) {
        const pageUrl = new URL(window.location.href);
        pageUrl.searchParams.set('variant', variantId);
        window.history.replaceState(window.history.state, '', pageUrl.toString());
      }

      if (next.dataset.mediaId && next.dataset.mediaId !== this.dataset.mediaId) {
        this.dataset.mediaId = next.dataset.mediaId;
        this.gallery?.select(next.dataset.mediaId);
      }

      if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
      this.applyRules();
      this.updateTotal();
      this.syncStickyBar();
    } catch (error) {
      if (error.name !== 'AbortError') console.error(error);
    } finally {
      this.removeAttribute('data-loading');
    }
  }

  /* Quantity ----------------------------------------------------------------------------- */

  get rules() {
    const node = this.querySelector('[data-em-rules]');
    return {
      min: Number(node?.dataset.min) || 1,
      max: node?.dataset.max ? Number(node.dataset.max) : Infinity,
      step: Number(node?.dataset.step) || 1,
      price: Number(node?.dataset.price) || 0,
    };
  }

  /** Applies the selected variant's minimum, maximum and increment to the quantity field. */
  applyRules() {
    const input = this.quantityInput;
    if (!input) return;
    const { min, max, step } = this.rules;

    input.min = String(min);
    input.step = String(step);
    if (Number.isFinite(max)) input.max = String(max);
    else input.removeAttribute('max');
    this.normalizeQuantity();
  }

  normalizeQuantity() {
    const input = this.quantityInput;
    if (!input) return;
    const { min, max, step } = this.rules;

    let value = Math.round(Number(input.value)) || min;
    if (value > min && (value - min) % step !== 0) value = min + Math.round((value - min) / step) * step;
    input.value = String(Math.min(max, Math.max(min, value)));
  }

  onClick = (event) => {
    const stepButton = event.target.closest('[data-em-qty-step]');
    if (stepButton) {
      const input = this.quantityInput;
      if (!input) return;
      const { min, max, step } = this.rules;
      const direction = Number(stepButton.dataset.emQtyStep);
      const current = Number(input.value) || min;

      input.value = String(Math.min(max, Math.max(min, current + direction * step)));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    if (event.target.closest('[data-em-share]')) this.share(event.target.closest('[data-em-share]'));
  };

  /** Shows the line total while the quantity is above one, in the shopper's currency. */
  updateTotal() {
    const output = this.querySelector('[data-em-total]');
    const input = this.quantityInput;
    if (!output || !input) return;

    const plan = this.querySelector('[name="selling_plan"]:checked');
    const unit = plan?.dataset.price ? Number(plan.dataset.price) : this.rules.price;
    const quantity = Number(input.value) || 1;
    const visible = quantity > 1 && unit > 0;

    output.hidden = !visible;
    if (visible) output.querySelector('[data-em-total-value]').textContent = this.money.format(unit * quantity);

    this.querySelectorAll('[data-em-plan-hint]').forEach((hint) => {
      hint.hidden = !plan || !plan.value;
    });
  }

  /* Cart --------------------------------------------------------------------------------- */

  onSubmit = async (event) => {
    const actions = window.Shopify?.actions;
    const data = new FormData(this.form);
    const hasExtras = [...data.keys()].some((key) => key.startsWith('properties')) || Boolean(data.get('selling_plan'));
    if (!actions?.updateCart || hasExtras) return;

    event.preventDefault();
    if (this.hasAttribute('data-adding')) return;

    const id = data.get('id');
    const quantity = Math.max(1, Number(data.get('quantity')) || 1);
    const error = this.querySelector('[data-em-error]');
    const status = this.querySelector('[data-em-status]');
    if (!id) return;

    this.setAttribute('data-adding', '');
    if (error) error.hidden = true;
    if (status) status.textContent = this.string('adding');

    try {
      const result = await actions.updateCart({ lines: [{ merchandiseId: String(id), quantity }] });
      if (result?.userErrors?.length) throw new Error(result.userErrors[0].message);

      this.setAttribute('data-added', '');
      if (status) status.textContent = this.string('added');
      this.bumpInCart(quantity);
      actions.openCart?.();
      window.setTimeout(() => this.removeAttribute('data-added'), 2200);
    } catch (err) {
      if (error) {
        error.textContent = err?.message || this.string('error');
        error.hidden = false;
      }
      if (status) status.textContent = '';
    } finally {
      this.removeAttribute('data-adding');
    }
  };

  /** Keeps the "already in your cart" note truthful after an add, without a reload. */
  bumpInCart(quantity) {
    const note = this.querySelector('[data-em-in-cart]');
    if (!note) return;
    const count = (Number(note.dataset.count) || 0) + quantity;
    note.dataset.count = String(count);
    note.hidden = false;
    const value = note.querySelector('[data-em-in-cart-count]');
    if (value) value.textContent = String(count);
  }

  /* Share -------------------------------------------------------------------------------- */

  async share(button) {
    const data = { title: document.title, url: window.location.href };
    const status = this.querySelector('[data-em-status]');

    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(data.url);
      button.setAttribute('data-copied', '');
      if (status) status.textContent = this.string('copied');
      window.setTimeout(() => button.removeAttribute('data-copied'), 2000);
    } catch (error) {
      // The shopper dismissed the share sheet, or the clipboard is unavailable.
    }
  }

  /* Sticky buy bar ----------------------------------------------------------------------- */

  setupStickyBar() {
    // The add button's wrapper is replaced on variant changes, so always look it up fresh.
    // A scroll check is used instead of an IntersectionObserver because an observer only fires
    // when the button crosses the viewport, and a shopper can land below it (restored scroll
    // position, in-page jump) without ever crossing it.
    if (this.stickyBound || !this.querySelector('[data-em-sticky]')) return;
    this.stickyBound = true;

    let queued = false;
    this.onScroll = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(() => {
        queued = false;
        const anchor = this.querySelector('.em-buy__actions');
        const passed = Boolean(anchor) && anchor.getBoundingClientRect().bottom < 0;
        if (passed === this.hasAttribute('data-sticky-visible')) return;
        this.toggleAttribute('data-sticky-visible', passed);
        this.syncStickyBar();
      });
    };

    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();
  }

  syncStickyBar() {
    const bar = this.querySelector('[data-em-sticky]');
    if (!bar) return;
    const visible = this.hasAttribute('data-sticky-visible');
    bar.setAttribute('aria-hidden', String(!visible));
    bar.querySelectorAll('button').forEach((button) => (button.tabIndex = visible ? 0 : -1));
  }
}

if (!customElements.get('em-gallery')) customElements.define('em-gallery', EmGallery);
if (!customElements.get('em-lightbox')) customElements.define('em-lightbox', EmLightbox);
if (!customElements.get('em-product')) customElements.define('em-product', EmProduct);
