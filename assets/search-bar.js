import { Component } from '@theme/component';
import { isClickedOutside, requestIdleCallback } from '@theme/utilities';

const VALUE_STORAGE_KEY = 'theme:header-search:value';
const HISTORY_STORAGE_KEY = 'theme:header-search:history';
const HISTORY_LIMIT = 8;

/**
 * Reads the search history from session storage, newest first.
 * @returns {string[]}
 */
function getHistory() {
  try {
    const raw = sessionStorage.getItem(HISTORY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * @param {string[]} history
 */
function setHistory(history) {
  try {
    sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Storage unavailable (private browsing, disabled storage, etc.) — fail silently.
  }
}

/**
 * Manages the always-visible desktop header search bar: reveals the floating
 * predictive search panel when the input is focused, and closes it again on
 * outside click, Escape, or blur. Also persists the in-progress query and a
 * short history of past searches for the current browser session.
 *
 * @extends {Component}
 */
class SearchBarComponent extends Component {
  #controller = new AbortController();
  #lifecycle = new AbortController();

  connectedCallback() {
    super.connectedCallback();

    const { signal } = this.#lifecycle;
    this.#input?.addEventListener('input', this.#handleInput, { signal });
    this.#form?.addEventListener('submit', this.#handleSubmit, { signal });

    this.#renderHistory();

    // Deferred: dispatching a synthetic input event here needs
    // predictive-search-component already upgraded, which requestIdleCallback
    // safely guarantees regardless of relative script execution order.
    requestIdleCallback(() => this.#restoreValue());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#controller.abort();
    this.#lifecycle.abort();
  }

  get #panel() {
    return this.querySelector('.header-search-bar__panel');
  }

  get #input() {
    return /** @type {HTMLInputElement | null} */ (this.querySelector('.search-input'));
  }

  get #form() {
    return this.querySelector('.predictive-search-form');
  }

  get #historyContainer() {
    return this.querySelector('.header-search-bar__history');
  }

  get #historyList() {
    return this.querySelector('.header-search-bar__history-list');
  }

  get isExpanded() {
    return this.hasAttribute('expanded');
  }

  /**
   * Expands the search bar and reveals the results panel.
   */
  showPanel = () => {
    this.#updateHistoryVisibility();

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
   * Applies a past search term: fills the input, replays it through the
   * existing predictive search input handler, and keeps the panel open.
   * @param {string} term
   */
  #applyHistoryTerm(term) {
    const input = this.#input;
    if (!input) return;

    input.value = term;
    input.focus();
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: term }));
  }

  /**
   * Restores the last in-progress query for this session, replaying it
   * through the same input handler predictive search already listens to.
   */
  #restoreValue() {
    const input = this.#input;
    if (!input) return;

    let value = '';
    try {
      value = sessionStorage.getItem(VALUE_STORAGE_KEY) ?? '';
    } catch {
      return;
    }

    if (!value) return;

    input.value = value;
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
  }

  /**
   * Renders the session's search history as clickable pills.
   */
  #renderHistory() {
    const list = this.#historyList;
    if (!list) return;

    const history = getHistory();
    list.replaceChildren(
      ...history.map((term) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'button-unstyled pills__pill predictive-search-results__pill header-search-bar__history-pill';
        pill.textContent = term;
        pill.addEventListener('click', () => this.#applyHistoryTerm(term));
        return pill;
      })
    );

    this.#updateHistoryVisibility();
  }

  /**
   * Shows the history list only while the input is empty and history exists.
   */
  #updateHistoryVisibility() {
    const container = this.#historyContainer;
    if (!container) return;

    const hasValue = Boolean(this.#input?.value.trim());
    container.hidden = hasValue || getHistory().length === 0;
  }

  /**
   * Persists the in-progress query for the session and hides/shows history.
   */
  #handleInput = () => {
    const value = this.#input?.value ?? '';

    try {
      sessionStorage.setItem(VALUE_STORAGE_KEY, value);
    } catch {
      // Storage unavailable — the search itself still works, it just won't persist.
    }

    this.#updateHistoryVisibility();
  };

  /**
   * Records a submitted query in the session's search history. Fires for both
   * the "View all results" button and a plain Enter with no result selected —
   * predictive-search.js only calls `preventDefault()` when a specific result
   * is chosen, so the native form submit still reaches this listener otherwise.
   */
  #handleSubmit = () => {
    const term = this.#input?.value.trim();
    if (!term) return;

    const history = [term, ...getHistory().filter((entry) => entry.toLowerCase() !== term.toLowerCase())].slice(
      0,
      HISTORY_LIMIT
    );

    setHistory(history);
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
