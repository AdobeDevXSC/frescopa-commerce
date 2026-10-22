# Homepage spec: D1 "The Ritual"

Reference: `tools/prototypes/d1-ritual.html` (motion) and `d1-ritual-static.html` (static). This spec says what each section must do and how it maps to EDS. Copy lives in `content-inventory.md`; tokens in `design-d1.md`.

Breakpoints used by the prototype: 1120px (header collapses to hamburger), 1100px (card grid 5 → 3 columns; also the minimum width for scroll story), 900px (stacked layouts, mobile gutters), 640px (small tweaks). Content column max width 1360px, desktop gutter 40px, mobile 16px. Section vertical padding 128px (64px ≤ 900px).

## Section order

1. Announcement bar
2. Header
3. Hero (midnight roast)
4. Scene "dawn" (amber)
5. Scene "tasting" (crema)
6. Scene "personal" (coral)
7. Shop all products (midnight roast)
8. Store locator (amber)
9. Rewards (teal panel on midnight roast)
10. Footer (midnight roast)

## 1–2. Announcement bar and header
- Bar: ember `oklch(0.45 0.15 27)` ground, crema text, uppercase label type (0.85rem, 600, +0.1em), message on the left, "Shop Now" link to `https://frescopa.coffee/subscription` on the right, min height 44px. Put it in the `nav` fragment as its own first section.
- Header: sticky, crema ground, 72px tall, 1px border at 12% ink. Left: logo (`/icons/` or a block asset; source `tools/prototypes/assets/logo.svg`, one variant only). Then six links (Coffee, Tea, Machines, Accessories, Locations, Sustainability), then tools on the right: search button, cart button (both inert placeholders, real `<button>`s with `aria-label`), account link, "Sign in".
- ≤1120px: hamburger. Use a real `<button aria-expanded aria-controls>` (the prototype used a CSS checkbox trick; replace it). Escape closes it and returns focus to the button; links close the menu.
- Include a "Skip to content" link as the first focusable element.

## 3. Hero → `hero` block, variant `arch`
- Ground midnight roast, crema text. Padding 112px 40px 136px.
- Two columns, 7fr / 5fr, gap up to 64px, items aligned to the bottom.
- Left: h1 (the page's only h1) in Bodoni Moda 500, `clamp(3rem, 1rem + 7vw, 7.6rem)`, line height 0.94, tracking -0.02em. The emphasised phrase ("four questions") is an `<em>` rendered **roman** (not italic), weight 400, amber. Under it a label line (amber, uppercase, 0.85rem) and the amber pill CTA.
- Right: the café photo in an arch frame (aspect 3/4, `border-radius: 999px 999px 24px 24px`, max width 440px) with an amber circle behind it (78% of the frame width, offset right -14% and top -8%).
- Four decorative coffee beans (small inline SVG, ember / amber / ember / crema-2) float with one 9s ease-in-out alternating `translate` animation. Decorative only: `aria-hidden`, created in block JS or CSS, not authored.
- Image: eager, `fetchpriority=high`, responsive sources (1200w and 2000w), explicit width and height. This is the LCP element.
- Content model (4 rows max): row 1 picture; row 2 heading + label + CTA.

## 4. Scene "dawn" → `story` block, variant `dawn`
- Ground amber, ink/roast text. Two columns 5fr / 6fr.
- Left: a circle (max 460px) containing the sunrise photo (750×500, `object-fit: cover`) with a neutral soft shadow (not coloured).
- Right: h2 (Bodoni, `clamp(2.4rem, 1rem + 4.4vw, 5.5rem)`, line height 1), paragraph, roast pill "Shop Now".
- Enhanced (see motion): ground interpolates roast → amber; the circle rises (`translateY` 46vh → 0) and grows (scale 0.5 → 1) over `--p` 0 to 0.59; text steps fade/slide in at `--p` 0.27, 0.36, 0.45.

## 5. Scene "tasting" → `story`, variant `tasting`
- Ground crema, ink text. Columns 6fr / 5fr.
- Left: h2 "Elevate Your Coffee Game"; the sentence in Bodoni **italic**, ember, ~1.95rem; ember pill "Learn More".
- Right: the House Blend bag photo (transparent cut-out, max 460px) with four small beans around it.
- Enhanced: bag tilts from -10° and rises from 14vh to rest over `--p` 0 to 0.67; beans drift (`translate`/`rotate` by `--p`); steps at `--p` 0.04, 0.14, 0.26.

## 6. Scene "personal" → `story`, variant `personal`
- Ground coral, roast text. Giant h2 "Coffee Made Personal" (`clamp(3.2rem, 1rem + 8.4vw, 9.5rem)`, line height 0.9) above a two-column row: paragraph + roast pill "Subscribe" on the left; on the right a crema ellipse (aspect 1.45, soft neutral shadow) holding the pod photo (transparent, drop shadow) and the mug photo (opaque white background, `mix-blend-mode: multiply`).
- Enhanced: h2 rises 6vh and fades in; pod and mug rise and rotate into place over `--p` 0 to 0.67; steps at 0.1 and 0.22.

## 7. Shop all products → `cards` block, variant `arch`
- Ground midnight roast, crema h2 "Shop all Fréscopa products.".
- Five cards (`ul`), 5 columns ≥1100px, 3 columns ≤1100px, 2 columns ≤900px with the fifth centred at half width. Card: crema ground, arch top radius, min height 420px, centred product photo (max 200px, aspect 1, `object-fit: contain`), Bodoni 1.65rem label. Hover: lift 8px and amber ground.
- Products and links: Coffee Machines (machine photo) → `/machines`; Bagged Coffee (bag) → `/coffee`; Coffee Pods (pod) → `/coffee`; Bundles (coral line icon, no photo exists) → `/tea`; Accessories (mug) → `/accessories`. Use the migrated paths once those pages exist, else absolute live URLs.
- Machine and mug images have opaque white backgrounds, so use `mix-blend-mode: multiply` on crema. Bag and pod are transparent: normal blend.

## 8. Store locator → `store-locator` block
- Ground amber, roast text. Columns 7fr / 5fr.
- Left: h2 "Try a new roast at a Fréscopa near you!", `<label for>` "Find another location now", a pill form (roast ground, crema text) with a text input (placeholder "ZIP code", `autocomplete="postal-code"`) and an amber "Search" button. The form `action` is `https://frescopa.coffee/locations` (GET, parameter `q`); the live site has no documented query parameter, so flag this to the human.
- Right: crema card with an arch top: "Fréscopa Coffee & Tea", "Smiles one cup at a time.", address, email link, phone.
- No map embed. No JavaScript required.

## 9. Rewards → `reward` block
- Midnight roast section containing a teal panel (radius 24px, min height 200px) with the captured ribbon artwork (`tools/prototypes/assets/media/reward-banner-v1.svg`) as a left-anchored background, h2, one-sentence body, crema pill "Claim Rewards" → `https://frescopa.coffee/signup`.
- ≤1024px the ribbon is dropped and the panel stacks.

## 10. Footer
- Midnight roast ground, crema text. Left block: reversed logo (CSS `filter` on the logo, no reversed asset exists), name, tagline, address, email, phone. Then five link columns (Machines, Coffee, Tea, Accessories, About Fréscopa) inside a `<nav aria-label="Footer">`, then a rule and a legal row.
- Link targets: see `content-inventory.md`. Items with no known URL are plain text (not links).
- Footer link targets are ≥ 44px tall on touch and ≤ 900px.

## Motion rules for `story` (summary; full rules in AGENTS.md)
- Enabled only at ≥ 1100×720 with motion allowed; otherwise (and with no JS) the full static layout shows.
- The prototype's implementation is a good reference: a single scroll listener sets `--p` on each scene; CSS reads `--p` through `calc()`, `min()`, `clamp()`, and `color-mix()`; a focus handler forces `--p = 1` while focus is inside a scene.
- Port that into `blocks/story/story.js` and `story.css`, with the sticky stage and the enhancement class on the block (not `<html>`) where practical.
- Do not use `overflow: hidden` on any ancestor of the sticky stage.

## Accessibility notes already decided
- One `h1` (hero); scenes use `h2`; cards `h3`.
- Decorative beans and ribbons: `aria-hidden`/empty alt. Product photos: alt text is the product name from the live site.
- Focus ring: roast outline + crema halo on light grounds; crema outline + roast halo on dark grounds (hero, shop, footer, reward panel, announcement bar).
- Search and Cart controls are inert buttons for now; do not wire commerce.
