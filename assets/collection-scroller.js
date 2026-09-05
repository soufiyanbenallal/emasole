import { Component } from '@theme/component';
import { getIntersectionRoot } from '@theme/scroll-container';

const GRID_REGION_ID = 'AllProductsGridRegion';

/**
 * A custom element that pins itself to the top of the scroll container and
 * switches to a compact nav-like appearance once it becomes stuck. Its items
 * also act as filter tabs for the all-products-grid section elsewhere on the
 * page: selecting one swaps that grid's contents in place via Shopify's
 * Section Rendering API, without navigating away from the homepage.
 *
 * Uses the same threshold-1 self-observation technique as the site header:
 * once less than 100% of this sticky element intersects the scroll root, it
 * has reached its pinned position.
 *
 * @extends {Component}
 */
class CollectionScrollerComponent extends Component {
  /** @type {IntersectionObserver | null} */
  #observer = null;

  /** @type {AbortController | null} */
  #abortController = null;

  connectedCallback() {
    super.connectedCallback();

    this.#observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        this.dataset.stickyState = entry.isIntersecting ? 'inactive' : 'active';
      },
      {
        threshold: 1,
        root: getIntersectionRoot(),
      }
    );

    this.#observer.observe(this);

    this.#activateDefaultItem();
    this.addEventListener('click', this.#handleItemClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer?.disconnect();
    this.#abortController?.abort();
  }

  /** @returns {HTMLAnchorElement[]} */
  get #items() {
    return Array.from(this.querySelectorAll('[data-collection-scroller-item]'));
  }

  #activateDefaultItem() {
    const items = this.#items;
    if (items.length === 0) return;

    const defaultItem = items.find((item) => item.dataset.defaultActive === 'true') ?? items[0];
    if (defaultItem) this.#setActiveItem(defaultItem);
  }

  /** @param {HTMLElement} activeItem */
  #setActiveItem(activeItem) {
    for (const item of this.#items) {
      item.setAttribute('aria-current', item === activeItem ? 'true' : 'false');
    }
  }

  /** @param {MouseEvent} event */
  #handleItemClick = (event) => {
    const item = /** @type {HTMLElement | null} */ (
      event.target instanceof Element ? event.target.closest('[data-collection-scroller-item]') : null
    );
    if (!(item instanceof HTMLAnchorElement)) return;
    if (item.target === '_blank') return; // Let "open in new tab" items navigate normally.

    event.preventDefault();

    if (item.getAttribute('aria-current') === 'true') return;

    this.#setActiveItem(item);
    this.#loadGrid(item.href);
  };

  /** @param {string} url */
  async #loadGrid(url) {
    const region = document.getElementById(GRID_REGION_ID);
    const sectionId = region?.querySelector('[section-id]')?.getAttribute('section-id');
    if (!region || !sectionId) {
      window.location.href = url;
      return;
    }

    this.#abortController?.abort();
    this.#abortController = new AbortController();

    const separator = url.includes('?') ? '&' : '?';
    const fetchUrl = `${url}${separator}section_id=${sectionId}`;

    region.setAttribute('aria-busy', 'true');

    try {
      const response = await fetch(fetchUrl, { signal: this.#abortController.signal });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

      const html = await response.text();
      const newRegion = new DOMParser().parseFromString(html, 'text/html').getElementById(GRID_REGION_ID);
      if (!newRegion) throw new Error('Could not find the products grid in the response.');

      region.replaceWith(newRegion);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('[collection-scroller] Failed to load filtered products:', error);
      window.location.href = url;
    } finally {
      region.removeAttribute('aria-busy');
    }
  }
}

if (!customElements.get('collection-scroller')) {
  customElements.define('collection-scroller', CollectionScrollerComponent);
}
