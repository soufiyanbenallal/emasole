import { Component } from '@theme/component';
import { isClickedOutside } from '@theme/utilities';

/**
 * Manages the always-visible desktop header search bar: reveals the floating
 * predictive search panel when the input is focused, and closes it again on
 * outside click, Escape, or blur.
 *
 * @extends {Component}
 */
class SearchBarComponent extends Component {
  #controller = new AbortController();

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#controller.abort();
  }

  get #panel() {
    return this.querySelector('.header-search-bar__panel');
  }

  get #input() {
    return this.querySelector('.search-input');
  }

  get isExpanded() {
    return this.hasAttribute('expanded');
  }

  /**
   * Expands the search bar and reveals the results panel.
   */
  showPanel = () => {
    if (this.isExpanded) return;

    this.setAttribute('expanded', '');
    this.#panel?.removeAttribute('hidden');
    this.#input?.setAttribute('aria-expanded', 'true');

    const { signal } = this.#controller;
    document.addEventListener('click', this.#handleClickOutside, { signal });
    document.addEventListener('keydown', this.#handleKeyDown, { signal });
  };

  /**
   * Collapses the search bar and hides the results panel.
   */
  hidePanel = () => {
    if (!this.isExpanded) return;

    this.removeAttribute('expanded');
    this.#panel?.setAttribute('hidden', '');
    this.#input?.setAttribute('aria-expanded', 'false');

    // Abort clears both listeners in one shot; swap in a fresh controller for next time.
    this.#controller.abort();
    this.#controller = new AbortController();
  };

  /**
   * @param {MouseEvent} event
   */
  #handleClickOutside = (event) => {
    if (isClickedOutside(event, this)) this.hidePanel();
  };

  /**
   * @param {KeyboardEvent} event
   */
  #handleKeyDown = (event) => {
    if (event.key !== 'Escape') return;
    this.hidePanel();
    this.#input?.blur();
  };
}

if (!customElements.get('search-bar-component')) {
  customElements.define('search-bar-component', SearchBarComponent);
}
