---
name: em-duotone-icons
description: Draw Emasole interface icons as solid duotone glyphs (no strokes) with two tones, for the em-icon snippet. Use when adding or redrawing an icon.
---

# Emasole Bulk icons

Solid chunky glyphs, no strokes, two tones, in the style of **Hugeicons Bulk Rounded** (style Bulk, not Duotone).

## Why Bulk (Not Duotone)

- In Hugeicons, **Duotone** uses thin outline wireframes with a light background tint.
- **Bulk** uses **solid chunky filled shapes** with two tones. There are no thin wireframe outlines or hollow rims.
- Bulk creates high-impact depth, visual weight, and premium branding suited for modern e-commerce.

## The look

- **Primary** (`.p`, default 100% opacity) is the focal defining element, drawn in solid `currentColor`.
- **Accent** (`.a`, 35% opacity) is the solid bulk volume or depth partner. By default it is `currentColor` at 35% opacity, or mapped to a secondary theme color.
- Never use `stroke`. Every shape is a closed, filled path.
- Rounded ends and corners everywhere (`rx=1` to `rx=3.5`). Nothing sharp except where the object demands it (lightning bolt tip).

## Grid & Dimensions

- `viewBox="0 0 24 24"`. Live area is 2 to 22 (2px of padding on all sides).
- Chunky line/ribbon thickness is 2.2 to 2.6 units.
- Optical center, not mathematical center.
- Perfectly legible at 18px, 22px (benefit bar), 24px, and 48px.

## Two-tone Bulk rules

1. **Accent = the volume / backdrop.** The solid base shape: a cargo container, an aura badge, a torso mantle, a padlock body, or the shaded facet.
2. **Primary = the identity / focal punch.** What makes it unmistakable: a truck cab & wheels, rotating exchange arrows with flared arrowheads, user head & collar, a striking bolt, an arched shackle.
3. Primary sits on top of or alongside accent, creating cohesive depth.
4. Never more than two tones in an icon.
5. If primary alone is unrecognisable, the icon fails.

## Key Icon Patterns (Bulk Rounded)

- **Delivery Truck (`truck`):** Solid rounded cargo box (`.a`) + aerodynamic cab with windshield, express stripes, chassis bar, and solid wheels (`.p`).
- **Return Loop (`return`):** Two chunky circular ribbon arrows revolving in dynamic rotation with distinct flared arrowheads (Top arrow `.p`, bottom arrow `.a`).
- **Heart Wishlist (`heart`):** Solid sculpted heart with 50/50 dual-tone depth (Left `.p`, Right `.a`) and upper-left shine pill.
- **User Account (`user`):** Solid circular head (`.p`) + rounded shoulders mantle (`.a`) with crisp collar placket tab and neckline bar (`.p`).
- **Flash Deals (`bolt`):** Soft circular aura badge (`.a`) + bold, chunky, dynamic lightning bolt (`.p`) centered with rounded vertices.
- **Security Shield (`shield`):** Contoured shield silhouette (`.a`) + bold chunky checkmark (`.p`).
- **Secure Padlock (`lock`):** Chunky rounded padlock body (`.a`) + heavy rounded shackle and keyhole (`.p`).
- **Review Star (`star`):** Full 5-pointed star (`.a`) + left gem facet (`.p`) for iconic 3D rating depth.

## Template

```svg
<svg class="em-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <!-- accent first (volume / back), primary second (identity / front) -->
  <circle class="a" cx="12" cy="12" r="9.5"/>
  <path class="p" d="…"/>
</svg>
```
