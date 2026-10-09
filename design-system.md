# Emasole design system

This is the system the storefront is built from. Every value below is taken from `assets/emasole.css`, which holds the shared tokens and primitives. Components add their own styles next to their markup, using `em-` class names. Nothing uses a hardcoded price or currency symbol.

## 1. Principles

1. **Marketplace energy, calm structure.** The page is a soft grey canvas with white rounded panels. Colour appears only where it means something: action, deal, trust.
2. **Orange acts, green reassures.** Ember orange is for buying and prices. Mint green is for stock, guarantees and savings. Dark ink is for everything else.
3. **Real data only.** Prices, currency, stock, payment methods and policies come from Shopify. Copy never contains a typed amount, because it wouldn't follow the shopper's market.
4. **Works without JavaScript.** Links and forms carry the experience. Scripts upgrade it.
5. **Accessible by default.** Focus rings, labelled controls, reduced-motion support, and 44px touch targets on primary actions.

## 2. Colour

### Brand

| Token            | Value     | Use                                              |
| ---------------- | --------- | ------------------------------------------------ |
| `--em-ember-50`  | `#fff1ea` | Tinted backgrounds, selected states              |
| `--em-ember-100` | `#ffdccb` | Soft borders, meter track                        |
| `--em-ember-500` | `#ff6a2b` | Decorative only                                  |
| `--em-ember-600` | `#cc3500` | **Action, price, focus**                         |
| `--em-ember-700` | `#a82b00` | Hover, text on tint                              |
| `--em-sun-100`   | `#fff4d1` | Highlight tint                                   |
| `--em-sun-400`   | `#ffc53d` | Flash deals and highlights, always with ink text |

### Trust

| Token           | Value     | Use                              |
| --------------- | --------- | -------------------------------- |
| `--em-mint-50`  | `#e6f5ec` | Reassurance panels               |
| `--em-mint-700` | `#0a7a4a` | In stock, guarantees, "You save" |

### Neutrals

| Token          | Value     | Use                         |
| -------------- | --------- | --------------------------- |
| `--em-ink-900` | `#17171c` | Text, dark buttons          |
| `--em-ink-600` | `#55555f` | Muted text                  |
| `--em-ink-400` | `#85858f` | Disabled, icons             |
| `--em-ink-200` | `#dedee3` | Borders                     |
| `--em-ink-100` | `#ededf1` | Image backgrounds, dividers |
| `--em-surface` | `#f5f5f7` | Page canvas                 |
| `--em-card`    | `#ffffff` | Panels and cards            |

### Semantic roles

`--em-color-text`, `-text-muted`, `-border`, `-border-strong`, `-action` (ember-600), `-action-hover` (ember-700), `-on-action` (white), `-price` (ember-600), `-focus` (ember-600). Components use these roles, not raw colours.

### Gradients

- `--em-grad-ember` (135°, `#ff7a3d` to `#e63a00`): primary buy button, badges, slider fill.
- `--em-grad-sun` (`#ffd873` to `#ffbd1f`): highlights.
- `--em-grad-ink` (160°, `#2a2a33` to `#121217`): dark banners.
- `--em-grad-mint` (`#d9f3e4` to `#b8e8cc`): trust panels.

## 3. Typography

| Role                 | Token               | Default                          |
| -------------------- | ------------------- | -------------------------------- |
| Display and headings | `--em-font-display` | theme heading font, else Poppins |
| Body and UI          | `--em-font-body`    | theme body font, else Inter      |

| Step    | Token               | Size              |
| ------- | ------------------- | ----------------- |
| Caption | `--em-text-xs`      | 0.75rem (12px)    |
| Small   | `--em-text-sm`      | 0.8125rem (13px)  |
| Body    | `--em-text-md`      | 0.9375rem (15px)  |
| Lead    | `--em-text-lg`      | 1.125rem (18px)   |
| Title   | `--em-text-xl`      | 1.375rem (22px)   |
| Section | `--em-text-2xl`     | fluid, 24 to 32px |
| Display | `--em-text-display` | fluid, 30 to 52px |

Headings are weight 700 to 800 with tight tracking (`-0.01em` to `-0.03em`) and `text-wrap: balance`. Prices use the display font. Numbers that change (counts, prices) use tabular figures.

## 4. Spacing, radius, elevation

**Space** follows a 4px grid: `--em-space-1` 4, `-2` 8, `-3` 12, `-4` 16, `-5` 24, `-6` 32, `-7` 48.

**Radius**
| Token | Value | Use |
|---|---|---|
| `--em-radius-xs` | 4px | Badges, small rows |
| `--em-radius-sm` | 8px | Inputs, option buttons |
| `--em-radius-md` | 12px | Cards, media |
| `--em-radius-lg` | 16px | Panels, banners |
| `--em-radius-pill` | 999px | Buttons, chips, tags |

**Elevation**
| Token | Value |
|---|---|
| `--em-shadow-1` | `0 1px 2px rgb(23 23 28 / .06)` (panels at rest) |
| `--em-shadow-2` | `0 6px 20px rgb(23 23 28 / .10)` (hover, popovers) |
| `--em-shadow-3` | `0 16px 40px rgb(23 23 28 / .16)` (drawers) |
| `--em-shadow-float` | layered, with a warm orange underglow (floating product images) |

## 5. Layout

- **Container:** `--em-container` is 1320px plus the gutter, centred.
- **Gutter:** 12px on phones, 24px from 750px.
- **Section gap:** 12px on phones, 16px from 750px.
- **Breakpoints:** 750px (tablet) and 990px (desktop, where the filter drawer becomes a sidebar).
- **Canvas:** product, collection, search and catalog pages all sit on `--em-surface`, with content in white `.em-panel` blocks.
- **Product grid (`.em-grid`):** 2 columns on phones, 3 on tablets, 4 or 5 on desktop (set by `--em-cols`).

## 6. Brand surfaces

These replace flat vector art.

| Class            | What it is                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `.em-mesh`       | Warm mesh gradient (ember and sun glows on cream), a fine dot lattice, and film grain                   |
| `.em-mesh--ink`  | The dark variant: ink gradient with ember and sun glows                                                 |
| `.em-glass`      | Frosted white panel for content over a mesh or photo                                                    |
| `.em-float`      | A real product image with a white border, a tilt (`--em-tilt`) and the floating shadow, used in banners |
| `.em-float__tag` | Dark price pill on a floating image                                                                     |
| `.em-ticket`     | Coupon-style notches on the left and right edges (used on the deal price box)                           |
| `.em-shimmer`    | Skeleton loading gradient                                                                               |

## 7. Components

### Buttons (`.em-btn`)

Pill-shaped, 44px tall, 700 weight, scale to 98% when pressed.

- Default is solid ember-600. The product "Add to cart" button uses `--em-grad-ember` with a soft orange shadow and turns green while the item is being confirmed.
- `--secondary`: white with an ink outline. `--dark`: ink fill. `--light`: white fill.
- Modifiers: `--sm` (36px) and `--block` (full width).
- `.em-icon-btn` is a 40px round icon button.

### Badges (`.em-badge`)

| Variant   | Meaning                             |
| --------- | ----------------------------------- |
| `--deal`  | Ember fill, discount percentage     |
| `--hot`   | Sun fill, best seller               |
| `--trust` | Mint, savings and guarantees        |
| `--soft`  | Ember tint, neutral highlights      |
| `--dark`  | Ink, "New"                          |
| `--pick`  | Ink with sun text, the store's pick |

Merchant badges on products come from tags: `bestseller`, `new`, `ema-pick`. The discount badge is calculated from the real compare-at price.

### Price (`.em-price`)

Display font. The current price is ink, turning ember when on sale. The compare-at price is small and struck through. Sale prices are always paired with "You save" in mint. All amounts are rendered by Shopify's money filters.

### Chips (`.em-chip`)

32px pills. Selected state is inverted (ink fill, white text). Used for subcategories, suggestions and active filters (the active-filter variant uses the ember tint).

### Product card (`em-product-card` snippet)

White card, 12px radius, square image with the second image on hover, up to two badges, two-line title, rating, price, and a round quick-add button. Products with options link to the product page instead. A stock hint only appears when real inventory is low.

### Collection tile (`em-collection-tile`)

4:3 image, or a three-image mosaic of the collection's own products when it has no image.

### Rails (`.em-rail`)

Horizontal scroll-snap track with round arrows that appear on desktop and hide at the ends.

### Form controls

`.em-input` and `.em-select` are 40px tall, 8px radius, with an ember focus ring. Checkboxes use a 20px box that fills with the ember gradient. Switches are 40×24 and turn mint. Radios in purchase options are cards with an ember border when selected.

### Empty states (`.em-empty`)

A round ember-tint icon, a title, a short explanation, and one clear action.

### Rich text (`.em-rte`)

Merchant-written content: 1.65 line height, rounded images, bordered tables, ember links.

## 8. Page patterns

**Banner.** Every list page opens with a rounded `.em-mesh` banner: an eyebrow pill, a display title, a short description and fact pills (product count, top price). Collections float their first three real product images on the right, or show the collection image with a fade.

**Product page.**

- **Gallery:** a vertical thumbnail rail and a large stage with hover magnify. On phones it swipes, with dots and a counter.
- **Buy box order:** brand and type, title, rating, deal price box, options, stock, purchase options, quantity and notes, price breaks, add to cart, express checkout, pickup, trust panel, accepted payment methods.
- **Below:** accordions for details, specifications and policies.
- **Phones:** a sticky buy bar appears after the main button scrolls away.

**Filters.** A sticky sidebar from 990px, a slide-in drawer below with a live "Show N results" button. Facets appear in this order: availability switches, price slider, swatches, long lists with search, and plain lists.

## 9. Currency and markets

- Final prices use Shopify `money` filters, so they follow the active market. The `currency_code_enabled_*` settings can append the ISO code.
- For values formatted live in the browser, `assets/em-money.js` reads the currency and locale the store reports. It formats with `Intl` for that currency and keeps the store's `{{amount_*}}` placeholder for number fields.
- Filter URLs always use dot-decimal major units (`150.50`), whatever the shopper typed.
- Copy and defaults never contain typed amounts, so the theme editor text stays correct in every market.

## 10. Motion

- **Easing:** `--em-ease` is `cubic-bezier(.2, .7, .2, 1)`, the default for every transition.
- **Duration:** `--em-duration` is 180ms for hovers. Drawers and sticky bars use 240 to 280ms.
- **Hover lift:** cards rise 2px with a larger shadow, on devices that can hover.
- **Reduced motion:** `prefers-reduced-motion` switches transitions, zoom, shimmer and the loading line off.

## 11. Accessibility

- Visible focus: a 2px ember outline with a 2px offset on every `em-` element.
- Every icon-only control has a label. Decorative icons are hidden from screen readers.
- Results updates are announced in a live region.
- Unavailable options stay selectable but are marked with a strikethrough and a spoken "Sold out".
- Colour is never the only signal: swatches show a check when selected, and stock has text plus an icon.
- Dialogs (filter drawer, lightbox) trap scroll, close on Escape and return focus.

## 12. Naming and structure

- **Prefix:** everything is `em-`. Block, element and modifier use `em-card__title` and `em-btn--dark` style names.
- **Custom elements:** `em-facets`, `em-price-range`, `em-product`, `em-gallery`, `em-lightbox`, `em-rail`, `em-tabs`, `em-feed`, `em-recommendations`.
- **Where things live:**
  - Shared tokens and primitives: `assets/emasole.css`.
  - Component styles: in a `{% stylesheet %}` tag beside each section or snippet.
  - Interactive scripts: `assets/em-facets.js`, `em-product.js`, `em-money.js`.
  - Translations: `emasole.*` keys in `locales/en.default.json`.
  - Editor labels: `emasole.*` keys in `locales/en.default.schema.json`.
- **Icons:** the `em-icon` snippet draws branded, soft, and partially colored duotone icons on a 24px grid with a 1.8px stroke. Each icon features a soft background/secondary fill (`.em-icon__soft`), focal brand accents (`.em-icon__accent` in Ember, Mint, or Sun), and crisp structural outlines that inherit `currentColor`.
  - **Tones:** automatically selected by role (`trust` for guarantees, `deal` for actions and discounts, `sun` for reviews and highlights, `brand` for store utility, `nav` for controls), or overridden via `tone: 'trust' | 'deal' | 'sun' | 'brand' | 'nav' | 'mono'`.
  - **Tokens:** `--em-icon-stroke`, `--em-icon-soft`, `--em-icon-soft-op`, `--em-icon-accent`, `--em-icon-accent-soft`. Automatically adapts with luminous contrast on dark buttons and ink surfaces.
  - **Available glyphs:** search, user, heart, truck, shield, return, tag, bolt, chevron-left, chevron-right, chevron-down, star, menu, close, gift, clock, check, headset, grid, percent, lock, copy, arrow-right, package, flame, globe, mail, cart-plus, badge-check, sliders, plus, minus, home, share, zoom, bag, sparkles, info, eye, trash.

## 13. Do and don't

| Do                                              | Don't                              |
| ----------------------------------------------- | ---------------------------------- |
| Use ember for buying and price only             | Use ember for decoration           |
| Use mint for stock, savings and guarantees      | Use green for anything promotional |
| Show discounts from real compare-at prices      | Invent "was" prices or urgency     |
| Use `money` filters for prices                  | Type `$` or a number into copy     |
| Keep sun yellow paired with ink text            | Put white text on sun              |
| Use a real product image in banners             | Use generic clip-art               |
| Make every list page start with the mesh banner | Mix in unrelated banner styles     |

A note on scope: the brand gradients and mesh surfaces were added with the latest PR. The homepage hero and a few older sections still use the earlier flat brand artwork (`em-brand-art`), so they'll need a pass to match.
