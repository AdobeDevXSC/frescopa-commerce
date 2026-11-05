# AGENTS.md

Edge Delivery Services. Read a block first. Omissions are in the repo or known.

## Avoid
- `scripts/aem.js` is vendored. Never edit.
- Markup comes from the backend. `curl localhost:3000/x.plain.html` first.
- `buildAutoBlocks` rewrites content before your block runs.
- Authors omit and add cells. Decorate defensively.
- No build step; devDependencies only, except the ACO browse-only drop-ins (see "ACO catalog exception"). `npm run install:dropins` vendors them into `scripts/__dropins__` and must be re-run after any `@dropins/*` or `@adobe/*` change.
- Scope CSS to `.blockname`; `-wrapper`/`-container` are section classes.
- `fragment/fragment.js` is the only cross-block import. Otherwise use `/scripts/`.

## Outdated
- `fstab.yaml`, `helix-query.yaml`, `paths.json` are retired. Config lives at tools.aem.live.

## Remember
- `npx -y @adobe/aem-cli up`: local code, previewed content.
- Merging `main` ships code; content publishes separately.
- A PR without a `{branch}--frescopa-commerce--AdobeDevXSC.aem.page/{path}` link is rejected.
- All committed files are served. Use `.hlxignore`.
- Skills: `/plugin marketplace add adobe/skills`, then `aem-edge-delivery-services` (24 skills, incl. `docs-search`).

---

# Mission: migrate the Fréscopa site to the "D1 The Ritual" design

You are migrating https://frescopa.coffee to this repo as a new Edge Delivery site with a new design. The design is decided and prototyped; your job is to rebuild it as real blocks, styles and content, not to redesign it.

Start here, in order:
1. `docs/migration/PROMPT.md` — the task, phases, and deliverables.
2. `docs/migration/design-d1.md` and `docs/migration/product.md` — design system and brand intent.
3. `docs/migration/homepage-spec.md` — section-by-section spec, block mapping, motion rules.
4. `docs/migration/content-inventory.md` — page inventory, content sources, approved copy corrections, assets.
5. The working prototype: `tools/prototypes/d1-ritual.html` (with scroll motion) and `d1-ritual-static.html` (no motion). Read it for visuals and behaviour. Do not copy it wholesale: it is one self-contained file with inline CSS and JS, and EDS needs scoped block CSS and block JS.

Live prototype: https://main--frescopa-commerce--adobedevxsc.aem.page/tools/prototypes/d1-ritual.html

## Source of truth, in priority order
1. Copy and links: the live site, fetched as `https://frescopa.coffee/<path>.plain.html`. Use the sitemap at `https://frescopa.coffee/sitemap.xml` to inventory pages.
2. Look and behaviour: the D1 prototype and `docs/migration/*.md`.
3. Block patterns: this repo's existing blocks first, then `aem-edge-delivery-services` skills (`content-driven-development`, `building-blocks`, `content-modeling`, `page-import`, `docs-search`).

If two sources conflict, stop and ask rather than choosing silently (see "Stop and ask").

## Hard rules
- **No invented content.** Every heading, sentence, label, link, price, address and phone number comes from the live site or from `docs/migration/content-inventory.md`. If something the design needs is missing, leave a clearly marked placeholder block comment in the PR description and ask; do not write it yourself.
- **Approved copy corrections only** (the complete list of six is in `content-inventory.md`): hero grammar, hero label without its trailing "...", "Bundles", "ZIP code", "Kettles & Carafes" (duplicate removed), and the trimmed rewards body. Anything else stays verbatim, including awkward copy.
- **The 10% discount offer is not placed** (the live site gives no terms).
- **No third-party embeds** in the first viewport or anywhere above the fold; no Google Maps embed (the live one is broken). The store locator is a ZIP form plus a static address card.
- **Commerce is out of scope.** Product detail, cart, checkout, account, login and quiz flows stay on the live site. Link to them with absolute `https://frescopa.coffee/...` URLs. Do not port `commerce-*` blocks or the cart, checkout, order, account, payment-services and personalization dropins. Exception: the ACO browse-only catalog, below.
- **Do not edit `scripts/aem.js`.** Keep `scripts/scripts.js` changes minimal and generic.
- **No files named `media_*` in the code repo.** Code sync returns 404 for them. (Authored images go through DA and the media bus, which is fine.)
- **No inline `<script>`, inline `style=""`, or `!important`** in blocks. No new runtime dependencies beyond the ACO exception. No frameworks outside the vendored drop-ins (Preact inside `scripts/__dropins__` only; never in site blocks), no animation libraries (no Lenis, GSAP).
- **Do not push to or merge into `main`.** Work on branches named `migrate/<topic>` and open PRs with the `.aem.page` preview link. Do not publish content live without being asked.
- Keep secrets out of git: `.env`, `.env.*`, `.DS_Store`, `qa/` must be in `.gitignore` before any token is created.

## Design system (D1 "The Ritual") in short
Full detail in `docs/migration/design-d1.md`.

- **Grounds, one per scene:** midnight roast `oklch(0.20 0.03 55)`, dawn amber `oklch(0.80 0.15 75)`, crema `oklch(0.94 0.025 78)`, coral `oklch(0.70 0.15 38)`, teal `oklch(0.467 0.087 222.7)`, ember red `oklch(0.45 0.15 27)` for CTAs and announcement bar, ink `oklch(0.28 0.08 20)` for text on light.
- **Type:** Bodoni Moda (display, variable, weights 400–900) and Hanken Grotesk (body, variable, 300–700). Self-host the latin woff2 files from `tools/prototypes/assets/fonts/` into `/fonts/`, declare in `styles/fonts.css`, remove the Roboto files only if nothing uses them. Use `font-display: swap` and a size-adjusted fallback. Hero h1 clamp tops out at 7.6rem.
- **Shapes:** arch (`border-radius: 999px 999px 24px 24px`) for the hero photo and shop cards, pill buttons (`999px`), one circle (the dawn sun). Product photos are tinted into the ground with `mix-blend-mode: multiply` only where the image has an opaque white background (machine, mug); transparent PNG/WebP cut-outs (bag, pod) use normal blend.
- **Colour tokens go in `styles/styles.css` `:root`**, section grounds are applied with section metadata `style` values (`roast`, `amber`, `crema`, `coral`, `teal`) and CSS like `.section.roast { ... }`.
- **Accessibility floor:** body text ≥ 4.5:1, large text ≥ 3:1, one `h1`, visible focus ring on every ground (roast ring with crema halo on light grounds; crema ring with roast halo on dark grounds), touch targets ≥ 44px, `prefers-reduced-motion` and no-JS show the complete finished layout.

## Block plan (homepage)
Full mapping in `docs/migration/homepage-spec.md`.

| Prototype section | Block / mechanism | Notes |
|---|---|---|
| Announcement bar | first section of the `nav` fragment | ember ground, crema text |
| Header | existing `header` block, restyled | sticky, 72px, hamburger at ≤1120px |
| Hero | `hero` with variant `arch` | h1 with an emphasised phrase, note line, CTA, café photo in an arch with amber circle and floating beans (decorative CSS/SVG only) |
| Dawn, Tasting, Personal scenes | new `story` block with variants `dawn`, `tasting`, `personal` | one block per scene section; scroll choreography is progressive enhancement |
| Shop all products | `cards` with variant `arch` | five arch cards: four product photos, Bundles keeps its icon |
| Store locator | new `store-locator` block | ZIP form + static address card, no map |
| Rewards | new `reward` block | teal panel, captured ribbon art as a CSS background |
| Footer | existing `footer` block + `footer` fragment | midnight roast ground, logo reversed with a CSS filter (no reversed logo file exists) |

## Motion rules (the `story` block)
- Enhance only when `matchMedia('(min-width:1100px) and (min-height:720px)')` matches and `prefers-reduced-motion` is not `reduce`. Otherwise render the full static layout. The same must be true with JavaScript disabled.
- Pinned scenes: a `.story` section is 170vh (dawn) or 150vh (tasting, personal) tall with a sticky stage `top: var(--nav-height)` and `height: calc(100vh - var(--nav-height))`. Use `overflow: clip` (with `overflow-clip-margin`) on the stage, never `overflow: hidden` on any ancestor of a sticky element.
- Drive scenes with one CSS variable `--p` (0 to 1) per scene, set in a single passive `scroll` listener batched through `requestAnimationFrame`. Animate only `opacity`, `transform` and the dawn `background-color`. At most one infinite animation on the page (the floating beans), paused under reduced motion.
- Dawn ground interpolates midnight roast to amber and must be fully amber by `--p = 0.25`; text steps start at `--p >= 0.27`; all steps finish by `--p <= 0.66`. Measured contrast of any visible text must stay ≥ 4.5:1 (≥ 3:1 for large text) at every progress value.
- Keyboard: when focus enters a scene, force it to its final state (`--p = 1`) and keep it locked until focus leaves.
- No JS-hidden content: nothing is `opacity: 0` unless the enhancement class is present.

## ACO catalog exception (browse-only)
Approved: product listing, search, product detail and recommendations read from Adobe Commerce Optimizer. Plan: `docs/demo/aco-storefront-audit.md`.
- Allowed drop-ins: `storefront-product-discovery`, `-pdp`, `-recommendations`, `-auth`, `-cart`, `-wishlist` and `tools`, plus `@adobe/adobe-client-data-layer` and the Adobe event SDK and collector. `auth`, `cart` and `wishlist` are present only because the upstream blocks import them. They are not a commerce backend.
- Allowed blocks and scripts: `product-list-page`, `product-details`, `product-recommendations`, `modal`, `scripts/commerce.js`, `scripts/initializers/`. Keep them close to upstream `hlxsites/aem-boilerplate-commerce` so they can be diffed.
- Buy, cart, checkout and account links go to absolute `https://frescopa.coffee/...` URLs.
- Config is `config.json` (ACO endpoint, view id, price book). Public values only. Client id/secret live in the gitignored `demo/.env`, never in git.
- Commerce loads only on pages that contain one of the commerce blocks (`isCommercePage` in `scripts/scripts.js`). Other pages must not need it.
- `scripts/__dropins__` is vendored output: do not hand-edit, and keep it in `.eslintignore`. Do not commit `*.map`.
- Drop-in CSS keeps its BEM class names (stylelint `selector-class-pattern` is off). Site-authored CSS still follows the Hard rules.
- Third-party analytics (event SDK) loads only after consent, via `scripts/consented.js`.

## Demo accounts (approved)
- Sign-up, sign-in and the member switch are allowed, through the `frescopa-demo-services` App Builder app (`shopper-api` and `demo-id` in `config.json`, public values only).
- The welcome email provider is an approved server-side service. No email or third-party script runs in the browser.
- The session token lives in `sessionStorage` (`scripts/account.js`), never in `localStorage` or a cookie. Only `guest` and `member` price books are used.
- The `commerce-*` blocks, cart, checkout and the account/order dropins stay out of scope. Account pages are plain blocks (`create-account`, `sign-in`, `account`).

## Definition of done (every PR)
- `npm run lint` passes.
- PR description has the `{branch}--frescopa-commerce--AdobeDevXSC.aem.page/{path}` link(s) for every page touched.
- Real-browser check at 1440 and 390: no console errors, no failed requests, no broken images, no horizontal scroll at 360/390/768/1024/1440/1920.
- Homepage preview: LCP image is eager and sized, CLS ≈ 0, mobile Lighthouse performance ≥ 90, accessibility ≥ 95.
- Side-by-side with `tools/prototypes/d1-ritual.html` at 1440 and 390 shows no unexplained differences (list intentional ones in the PR).
- Content check: every text node traces to the live site or to an approved correction.

## Stop and ask
Stop and ask the human, with a specific question, when:
- DA (or other) content-source coordinates, or a token, are needed and not provided.
- A page is commerce-driven, interactive (quiz) or personalised and the right handling is unclear.
- Copy is missing, contradictory, or looks wrong beyond the approved corrections.
- A block would need a third-party script, a library, or a change to `scripts/aem.js`.
- ACO work would add a drop-in beyond the approved list, a `commerce-core-endpoint`, or a cart/checkout/account flow.
- You are about to merge, push to `main`, publish live, or delete anything.
