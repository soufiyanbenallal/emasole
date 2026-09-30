/**
 * Currency-aware money helper for Emasole components.
 *
 * Anything a shopper sees as a final price is rendered by Liquid (`money` filters), which
 * already follows the active market and currency. This helper only covers values that must be
 * formatted in the browser while the shopper is interacting: price sliders, quantity totals.
 *
 * It never hardcodes a currency. The host element carries what the store reports:
 *   data-currency     localization.country.currency.iso_code  (the currency being shown)
 *   data-locale       the active language and market, e.g. "fr-CA"
 *   data-money-format shop.money_format, used for its `{{amount_*}}` placeholder
 *
 * `shop.money_format` describes the shop's primary currency, so its symbol is not reused for
 * other currencies. Only the placeholder is kept, to honour the merchant's number format,
 * and the symbol and its position come from `Intl` for the currency actually being shown.
 *
 * @module em-money
 */
import { convertMoneyToMinorUnits, formatMoney, getCurrencyPrecision } from '@theme/money-formatting';

const PLACEHOLDER = /{{\s*amount\w*\s*}}/;

export class Money {
  /**
   * Builds a Money from the nearest ancestor carrying `data-currency`.
   * @param {Element} element
   * @returns {Money}
   */
  static from(element) {
    const host = element.closest('[data-currency]');
    return new Money({
      currency: host?.getAttribute('data-currency') || 'USD',
      locale: host?.getAttribute('data-locale') || document.documentElement.lang || undefined,
      format: host?.getAttribute('data-money-format') || '{{amount}}',
    });
  }

  /**
   * @param {{ currency: string, locale?: string, format?: string }} options
   */
  constructor({ currency, locale, format = '{{amount}}' }) {
    this.currency = currency;
    this.locale = locale;
    this.placeholder = format.match(PLACEHOLDER)?.[0] ?? '{{amount}}';
    this.precision = getCurrencyPrecision(currency);
    this.divisor = Math.pow(10, this.precision);
    this.formatters = new Map();
  }

  /** @param {number} fractionDigits */
  #formatter(fractionDigits) {
    let formatter = this.formatters.get(fractionDigits);
    if (formatter) return formatter;

    for (const locale of [this.locale, this.locale?.split('-')[0], undefined]) {
      try {
        formatter = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: this.currency,
          minimumFractionDigits: fractionDigits,
          maximumFractionDigits: fractionDigits,
        });
        break;
      } catch (error) {
        // Unknown locale or currency: try the next, less specific option.
      }
    }

    if (formatter) this.formatters.set(fractionDigits, formatter);
    return formatter;
  }

  /**
   * Formats minor units as a price for display, with the currency's own symbol.
   * Whole amounts drop their decimals ("$20", not "$20.00") so labels stay short.
   * @param {number} minor - Amount in minor units (cents for USD)
   * @returns {string}
   */
  format(minor) {
    const whole = minor % this.divisor === 0;
    const formatter = this.#formatter(whole ? 0 : this.precision);
    if (formatter) return formatter.format(minor / this.divisor);
    return formatMoney(minor, `${this.placeholder} {{currency}}`, this.currency);
  }

  /**
   * Formats minor units as a bare number following the store's `{{amount_*}}` convention,
   * for text fields that sit next to a currency symbol.
   * @param {number} minor
   * @returns {string}
   */
  formatNumber(minor) {
    return formatMoney(minor, this.placeholder, this.currency);
  }

  /**
   * Parses what a shopper typed ("1.000,50", "1 000.50", "12") into minor units.
   * @param {string} text
   * @returns {number | null}
   */
  parse(text) {
    return convertMoneyToMinorUnits(text, this.currency);
  }

  /**
   * Converts minor units to the dot-decimal major-unit string that filter URLs expect.
   * @param {number} minor
   * @returns {string}
   */
  toParam(minor) {
    return (minor / this.divisor).toFixed(this.precision);
  }
}
