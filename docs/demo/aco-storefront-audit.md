# ACO storefront audit and plan

(Markdown is not served by EDS; this guide lives in the repo only.)

Compares this repo with [hlxsites/aem-boilerplate-commerce](https://github.com/hlxsites/aem-boilerplate-commerce) (v11.0.0, read 2026-11-04) and lists what is missing to run a storefront on Adobe Commerce Optimizer (ACO).

## Summary

This repo has the **catalog supply side** of ACO and none of the **storefront side**.

- Have: DA product schema, seed products, settings sheet, and a CLI that validates, syncs, verifies and resets against ACO (`demo/`, `docs/demo/catalog.md`).
- Missing: everything that makes a storefront read from ACO. The site is vanilla `adobe/aem-boilerplate`: no commerce runtime, no drop-ins, no commerce config, no PLP/PDP/search blocks.

## Decisions needed before building

1. **AGENTS.md forbids this work.** It says "Commerce is out of scope", "do not port `commerce-*` blocks or dropins", "no new runtime dependencies", "no frameworks". Drop-ins are Preact-based npm packages. Amend AGENTS.md and `docs/migration/PROMPT.md` for the ACO scope, or keep the storefront on the live site and stop at catalog sync.
2. **Backend for cart, checkout, account and auth: DECIDED, browse-only.** PDP/PLP/search/recs read from ACO; "buy", cart, checkout and account link out to `https://frescopa.coffee/...`. No Commerce backend, no `commerce-core-endpoint`.
3. **Scope of drop-ins: DECIDED.** Only `product-discovery`, `pdp`, `recommendations` and `tools` (plus the event SDK, ACDL and their build tooling). Cart, checkout, order, account, auth, wishlist and payment-services are out. The `commerce-*` blocks are out. This keeps AGENTS.md's "do not port `commerce-*` blocks" rule intact; only the "no dropins / no new runtime dependencies" lines need an amendment.
4. **Inputs I do not have.** ACO tenant id, region, environment, catalog view id and price book ids. `demo/.env` and the settings sheet hold them; nothing in git does.

## Audit

Status: **Have**, **Partial**, **Missing**.

### Catalog ingestion

| Item | Status | Notes |
| --- | --- | --- |
| Product schema, DA form editor | Have | `demo/schema/aco-product.schema.json` |
| Seed products, settings | Have | `demo/seed` |
| Sync, verify, reset, validate CLI | Have | Uses `@adobe-commerce/aco-ts-sdk` 2.0.0 |
| Price books, metadata, shoppers | Have | `settings` sheet |
| Catalog view id | Partial | Setting exists, warns when empty; must be created in the ACO UI |
| Real sandbox run recorded | Unknown | No evidence in git that `sync` and `verify` ran against a tenant |

### Storefront config

| Item | Status | Notes |
| --- | --- | --- |
| `public.default` config with `commerce-endpoint` | Missing | Boilerplate ACO shape: `https://{region}-sandbox.api.commerce.adobe.com/{tenantId}/graphql` |
| `"adobe-commerce-optimizer": true` flag | Missing | Switches initializers from customer-group to price-book mode |
| `headers.cs` with `ac-view-id` and `ac-price-book-id` | Missing | Identify the catalog view and price book |
| `analytics` block (environment-id, view-id, locale, currencies) | Missing | |
| Where it lives | | Config Service at tools.aem.live (retired `config.json` files are not used). `demo/lib/config.mjs` `graphqlEndpoint()` already builds the endpoint string. |

### Runtime code

| Item | Status | Boilerplate path |
| --- | --- | --- |
| Commerce runtime (GraphQL clients, config and header helpers, history tracking) | Missing | `scripts/commerce.js` (921 lines) |
| Drop-in initializers incl. ACO price-book header | Missing | `scripts/initializers/*` |
| ACO-aware `getStoreIdentifier()` (uses `ac-view-id`) | Missing | `scripts/commerce.js` |
| `scripts/scripts.js` commerce integration (config init, page-type detection) | Missing | Keep changes minimal and generic per AGENTS.md |
| Drop-in assets | Missing | `scripts/__dropins__/` (11 packages, about 1,900 files in upstream) |
| Drop-in build and GraphQL overrides | Missing | `build.mjs`, `postinstall.js`, `npm run install:dropins` |
| Dependencies | Missing | `@dropins/*`, `@dropins/tools`, `@adobe/adobe-client-data-layer`, Adobe event SDK and collector, `@dropins/build-tools`, `npm-run-all`, `merge-json-cli`, `husky` |
| `.npmrc` (`ignore-scripts=true`) | Missing | Needed because `install:dropins` must be run by hand |
| Consent gate | Partial | `consent-check.js` and `consented.js` exist; upstream `consented.js` also loads the event SDK and collector |
| Event SDK, collector, ACDL and schemas | Missing | `scripts/commerce-events-*.js`, `scripts/acdl/` |

### Blocks

| Block | Status | Needed for |
| --- | --- | --- |
| `product-list-page` (with `search-url.js`) | Missing | Category and search results from ACO |
| `product-details` | Missing | PDP |
| `product-recommendations` | Missing | Recs (ACO recs e2e shards exist upstream) |
| `header` search and mini-cart | Partial | Header is restyled D1 and has no search or cart wiring |
| `commerce-mini-cart`, `commerce-cart`, `commerce-checkout*`, `commerce-*` account and order blocks | Out of scope | Browse-only decision |
| `modal`, `enrichment`, `targeted-block`, `accordion`, `carousel` | Missing | Supporting blocks used by PDP and PLP |
| `blocks/*/README.md` and husky README check | Missing | Upstream convention |

### Content and authoring

| Item | Status | Notes |
| --- | --- | --- |
| PLP and PDP pages in DA | Missing | Product pages need `sku` metadata. Check the URL convention upstream before choosing a path. |
| Placeholders (`placeholders/search.json` and others) | Missing | Initializers fetch these; upstream repo ships only `placeholders/checkout.json` |
| `/products/**` noindex | Documented | Step 4 of the template setup in `catalog.md`; not verified as done |
| Product `visibleIn`, categories, brand attributes surfaced as facets | Partial | Metadata rows exist; no UI |
| Sitemap for product pages | Missing | Upstream has `default-sitemap.yaml` and `sitemap-index.xml` (verify they apply to config-service sites) |

### Design and quality

| Item | Status | Notes |
| --- | --- | --- |
| D1 theme for drop-in components | Missing | Drop-ins ship their own CSS; re-skin through tokens in `styles/styles.css`. AGENTS.md bans `!important` and inline styles, so overrides need specificity, not force. |
| Lint and serving of vendored files | Risk | `scripts/__dropins__` must be in `.eslintignore`; it is not. Every committed file is served unless in `.hlxignore`. |
| CI | Missing | Upstream has ACO e2e (`run-e2e-tests-aco.yaml`), dependency-update and `protect-aem-js` workflows |
| Lighthouse floor (performance 90, a11y 95) | Risk | Drop-ins add JS; PDP/PLP must not push the LCP out |

## Plan

Each phase is one branch `migrate/aco-<topic>` and one PR with the `.aem.page` link. Nothing goes to `main` or live without being asked.

### Phase A: Decide and prove the supply side (no storefront code)
1. Get decisions 1–4 above.
2. Run `validate`, `sync --dry-run`, then `sync` and `verify` against the sandbox tenant. Record the result here.
3. Create the catalog view and confirm price book ids (`west_coast_inc` is the upstream demo's; ours come from `settings`).
- Done when `verify` passes for every searchable seed SKU.

### Phase B: Config and runtime skeleton
1. Add the ACO `public.default` config in the Config Service (endpoint, `adobe-commerce-optimizer`, `ac-view-id`, `ac-price-book-id`, analytics). Needs the tenant values and Config Service access.
2. Add `.npmrc`, dependencies for the chosen drop-ins only, `build.mjs`, `postinstall.js`; commit `scripts/__dropins__` for those packages; add to `.eslintignore`.
3. Add `scripts/commerce.js` and `scripts/initializers/` trimmed to browse-only, plus the minimal hook in `scripts/scripts.js`. Keep the consent gate; move the event SDK behind `consented.js`.
- Done when a blank page on the preview logs the config and reaches the ACO GraphQL endpoint with `ac-view-id` set.

### Phase C: Browse (PLP and PDP)
1. Add `product-list-page`, `product-details`, supporting blocks and READMEs.
2. Author a category page and one PDP in DA with `sku` metadata; add the placeholders.
3. Wire header search to the PLP block.
4. Link "add to cart" and checkout to `https://frescopa.coffee/...` unless decision 2 says otherwise.
- Done when seed products list, filter by `brand` and `category`, sort, search, and open a PDP showing the right price per price book.

### Phase D: Personalisation and recommendations
1. Add `product-recommendations` and the `auth/adobe-commerce-optimizer` price-book switch, mapped to the `shoppers` groups.
2. Gate analytics on consent.
- Done when switching shopper changes the displayed price and recs request the current SKU.

### Phase E: D1 skin and quality
1. Map drop-in CSS variables to D1 tokens; check the ground and focus rules in AGENTS.md.
2. Run lint, the 360–1920 overflow check, and Lighthouse on PLP and PDP.
3. Add a `verify`-style smoke check to CI.

### Out of scope (browse-only)
Cart, mini-cart, checkout, account, auth, order, wishlist and payment blocks and drop-ins. Revisit only if a backend is added later.

## Not verified

- Whether the boilerplate's PDP/PLP initializers run cleanly without the cart and auth initializers (browse-only trimming of `initializers/index.js` is untested; check in Phase B).
- Exact PDP URL convention and sitemap handling for config-service sites.
- Whether the live ACO tenant is provisioned; this repo contains no tenant values.
- Block-level ACO differences: a grep of `product-list-page`, `product-details`, `commerce-mini-cart`, `header` and `scripts.js` found no ACO references, so the ACO behaviour sits in config, `commerce.js` and `initializers/index.js`. I did not read the other blocks.
