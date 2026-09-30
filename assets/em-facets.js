/**
 * Emasole filtering: a sticky sidebar on desktop and a drawer on phones, with a two-handle
 * price slider that speaks the shopper's currency.
 *
 * Filters, sorting, chips and paging are plain links and one GET form, so everything works
 * without JavaScript. This script upgrades them to in-place updates through the Section
 * Rendering API and keeps the address bar in sync.
 *
 * @module em-facets
 */
import { Money } from './em-money.js';

const DENSITY_KEY = 'em:grid-density';

class EmFacets extends HTMLElement {
  static DRAWER_QUERY = '(max-width: 989px)';

  connectedCallback() {
    this.drawerQuery = window.matchMedia(EmFacets.DRAWER_QUERY);
    this.addEventListener('change', this.onChange);
    this.addEventListener('input', this.onInput);
    this.addEventListener('submit', this.onSubmit);
    this.addEventListener('click', this.onClick);
    this.addEventListener('keydown', this.onKeydown);
    window.addEventListener('popstate', this.onPopState);
    this.applyDensity();
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.onPopState);
    this.unlockScroll();
  }

  get form() {
    return this.querySelector('[data-em-facets-form]');
  }

  get inDrawer() {
    return this.drawerQuery.matches;
  }

  /* Events ------------------------------------------------------------------------------- */

  onChange = (event) => {
    const target = event.target;
    if (target.matches('[data-em-density]')) return this.setDensity(target.value);

    const form = this.form;
    if (!form || target.form !== form) return;
    if (target.matches('[data-em-facet-search]')) return;

    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.render(this.urlFromForm()), 120);
  };

  onInput = (event) => {
    const search = event.target.closest('[data-em-facet-search]');
    if (!search) return;

    const needle = search.value.trim().toLowerCase();
    const facet = search.closest('[data-em-facet]');
    let visible = 0;
    facet.querySelectorAll('.em-facet__list > li').forEach((item) => {
      const match = !needle || item.textContent.toLowerCase().includes(needle);
      item.hidden = !match;
      if (match) visible += 1;
    });
    facet.toggleAttribute('data-empty', visible === 0);
    facet.toggleAttribute('data-searching', needle !== '');
  };

  onSubmit = (event) => {
    if (event.target !== this.form) return;
    event.preventDefault();
    this.close();
    this.render(this.urlFromForm());
  };

  onClick = (event) => {
    const target = event.target.closest(
      '[data-em-facets-open], [data-em-facets-close], [data-em-facets-link], [data-em-facet-more]'
    );
    if (!target || !this.contains(target)) return;

    if (target.hasAttribute('data-em-facet-more')) {
      const facet = target.closest('[data-em-facet]');
      const expanded = facet.toggleAttribute('data-expanded');
      target.setAttribute('aria-expanded', String(expanded));
    } else if (target.hasAttribute('data-em-facets-open')) {
      this.open(target);
    } else if (target.hasAttribute('data-em-facets-close')) {
      this.close();
    } else {
      event.preventDefault();
      this.render(target.href);
    }
  };

  onKeydown = (event) => {
    if (event.key === 'Escape' && this.hasAttribute('data-drawer-open')) {
      event.stopPropagation();
      this.close();
    }
  };

  onPopState = () => {
    this.render(window.location.href, false);
  };

  /* Drawer ------------------------------------------------------------------------------- */

  open(opener) {
    const panel = this.querySelector('[data-em-facets-panel]');
    if (!panel) return;

    this.setAttribute('data-drawer-open', '');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    opener.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
    this.scrollLocked = true;
    panel.querySelector('[data-em-facets-close]')?.focus();
  }

  close() {
    if (!this.hasAttribute('data-drawer-open')) return;

    const panel = this.querySelector('[data-em-facets-panel]');
    this.removeAttribute('data-drawer-open');
    panel?.removeAttribute('role');
    panel?.removeAttribute('aria-modal');
    this.unlockScroll();

    const opener = this.querySelector('[data-em-facets-open]');
    opener?.setAttribute('aria-expanded', 'false');
    opener?.focus();
  }

  unlockScroll() {
    if (!this.scrollLocked) return;
    document.documentElement.style.overflow = '';
    this.scrollLocked = false;
  }

  /* Grid density ------------------------------------------------------------------------- */

  get density() {
    try {
      return window.localStorage.getItem(DENSITY_KEY);
    } catch (error) {
      return null;
    }
  }

  setDensity(value) {
    try {
      window.localStorage.setItem(DENSITY_KEY, value);
    } catch (error) {
      // Private mode: the choice simply lasts for this page view.
    }
    this.applyDensity(value);
  }

  applyDensity(value = this.density) {
    const grid = this.querySelector('[data-em-results-grid]');
    const group = this.querySelector('[data-em-density-group]');
    if (!grid || !group) return;

    const inputs = [...group.querySelectorAll('[data-em-density]')];
    const choice = inputs.find((input) => input.value === value) ?? inputs.find((input) => input.defaultChecked);
    if (!choice) return;

    grid.style.setProperty('--em-cols', choice.value);
    choice.checked = true;
  }

  /* Rendering ---------------------------------------------------------------------------- */

  urlFromForm() {
    const form = this.form;
    const url = new URL(form.getAttribute('action'), window.location.origin);
    for (const [key, value] of new FormData(form)) {
      if (String(value).trim() !== '') url.searchParams.append(key, value);
    }
    return url.toString();
  }

  async render(href, pushState = true) {
    const url = new URL(href, window.location.origin);
    const request = new URL(url);
    request.searchParams.set('section_id', this.dataset.sectionId);

    this.controller?.abort();
    this.controller = new AbortController();
    this.setAttribute('data-loading', '');

    const focusedId = document.activeElement && this.contains(document.activeElement) ? document.activeElement.id : null;
    const groups = this.querySelector('.em-facets__groups');
    const groupsScroll = groups?.scrollTop ?? 0;
    const openFacets = new Map(
      [...this.querySelectorAll('[data-em-facet]')].map((details) => [
        details.dataset.emFacet,
        { open: details.open, expanded: details.hasAttribute('data-expanded') },
      ])
    );

    try {
      const response = await fetch(request.toString(), { signal: this.controller.signal });
      if (!response.ok) throw new Error(response.statusText);

      const html = new DOMParser().parseFromString(await response.text(), 'text/html');
      const next = html.querySelector('[data-em-results]');
      const current = this.querySelector('[data-em-results]');
      if (!next || !current) throw new Error('Missing results');

      next.querySelectorAll('[data-em-facet]').forEach((details) => {
        const state = openFacets.get(details.dataset.emFacet);
        if (!state) return;
        details.open = state.open;
        details.toggleAttribute('data-expanded', state.expanded);
      });
      current.replaceWith(next);

      const nextGroups = this.querySelector('.em-facets__groups');
      if (nextGroups) nextGroups.scrollTop = groupsScroll;

      this.applyDensity();
      if (pushState) window.history.pushState({ emFacets: true }, '', url.toString());
      if (focusedId) document.getElementById(focusedId)?.focus({ preventScroll: true });

      // The live region sits outside the swapped results so screen readers hear the update.
      const status = this.querySelector('[data-em-results-status]');
      if (status) status.textContent = next.dataset.message || '';

      if (!this.inDrawer && this.getBoundingClientRect().top < 0) this.scrollIntoView({ block: 'start' });
    } catch (error) {
      if (error.name === 'AbortError') return;
      window.location.href = url.toString();
    } finally {
      this.removeAttribute('data-loading');
    }
  }
}

/**
 * Two-handle price slider with typed fields, in the shopper's currency.
 *
 * All amounts are minor units (cents), the unit Shopify reports `range_max` and the active
 * values in. Filter URLs take major units, so the hidden inputs submit `Money.toParam()`.
 * A bound left untouched submits nothing, keeping URLs clean.
 */
class EmPriceRange extends HTMLElement {
  connectedCallback() {
    this.money = Money.from(this);
    this.min = 0;
    this.max = Number(this.dataset.max) || 0;
    this.from = this.clamp(Number(this.dataset.from || this.min));
    this.to = this.clamp(Number(this.dataset.to || this.max));

    this.sliders = {
      from: this.querySelector('[data-em-range="from"]'),
      to: this.querySelector('[data-em-range="to"]'),
    };
    this.fields = {
      from: this.querySelector('[data-em-range-field="from"]'),
      to: this.querySelector('[data-em-range-field="to"]'),
    };
    this.label = this.querySelector('[data-em-range-label]');

    // Without JavaScript the typed fields submit directly. Here the hidden inputs take over.
    this.params = {};
    for (const key of ['from', 'to']) {
      const field = this.fields[key];
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = field.getAttribute('name');
      field.removeAttribute('name');
      field.after(input);
      this.params[key] = input;
    }

    const step = this.step();
    for (const slider of Object.values(this.sliders)) {
      slider.min = String(this.min);
      slider.max = String(this.max);
      slider.step = String(step);
      slider.addEventListener('input', this.onSlide);
      slider.addEventListener('change', this.onCommit);
    }
    for (const field of Object.values(this.fields)) {
      field.addEventListener('change', this.onType);
      field.addEventListener('keydown', this.onFieldKey);
    }

    this.removeAttribute('data-pending');
    this.sync();
    this.syncHidden();
  }

  /** One major unit, widened for large ranges so the slider stays usable. */
  step() {
    const major = this.max / this.money.divisor;
    const factor = major > 10000 ? 100 : major > 1000 ? 10 : 1;
    return this.money.divisor * factor;
  }

  clamp(value) {
    return Math.min(this.max, Math.max(this.min, Number.isFinite(value) ? value : 0));
  }

  onSlide = (event) => {
    const step = this.step();
    const value = this.clamp(Number(event.target.value));
    if (event.target === this.sliders.from) this.from = Math.min(value, this.to - step >= this.min ? this.to - step : this.to);
    else this.to = Math.max(value, this.from + step <= this.max ? this.from + step : this.from);
    this.sync();
  };

  onType = (event) => {
    event.stopPropagation();
    const key = event.target === this.fields.from ? 'from' : 'to';
    const parsed = this.money.parse(event.target.value);

    if (parsed === null) {
      this.sync();
      return;
    }
    if (key === 'from') this.from = Math.min(this.clamp(parsed), this.to);
    else this.to = Math.max(this.clamp(parsed), this.from);

    this.sync();
    this.commit();
  };

  onFieldKey = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.target.dispatchEvent(new Event('change', { bubbles: false }));
    }
  };

  onCommit = (event) => {
    event.stopPropagation();
    this.commit();
  };

  sync() {
    this.sliders.from.value = String(this.from);
    this.sliders.to.value = String(this.to);
    this.fields.from.value = this.from > this.min ? this.money.formatNumber(this.from) : '';
    this.fields.to.value = this.to < this.max ? this.money.formatNumber(this.to) : '';

    const span = Math.max(1, this.max - this.min);
    this.style.setProperty('--em-from', `${((this.from - this.min) / span) * 100}%`);
    this.style.setProperty('--em-to', `${((this.to - this.min) / span) * 100}%`);

    if (this.label) this.label.textContent = `${this.money.format(this.from)} – ${this.money.format(this.to)}`;
  }

  syncHidden() {
    this.params.from.value = this.from > this.min ? this.money.toParam(this.from) : '';
    this.params.to.value = this.to < this.max ? this.money.toParam(this.to) : '';
  }

  commit() {
    this.syncHidden();
    this.params.to.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

if (!customElements.get('em-facets')) customElements.define('em-facets', EmFacets);
if (!customElements.get('em-price-range')) customElements.define('em-price-range', EmPriceRange);
