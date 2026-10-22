# Demo catalog: DA structured content to Adobe Commerce Optimizer

(Markdown is not served by EDS; this guide lives in the repo only.)

## What the catalog is

- **Products** are DA (da.live) structured-content documents under `/products`, each using the `aco-product` schema (`demo/schema/aco-product.schema.json`). Authors edit them in the DA form editor.
- **Demo-wide settings** live in one sheet at `/commerce/settings` (locale, SKU prefix, price books, attribute metadata, shoppers).
- A local Node CLI (`demo/`) validates both and syncs them to ACO with `@adobe-commerce/aco-ts-sdk`.
- The minimum a product needs: `sku`, `name`, `slug`, `status` (ENABLED or DISABLED). `source.locale` comes from settings. Each product also needs at least one price.

## One-time template setup (site owner)

1. Create a `/products` folder in the DA site.
2. Add an org config entry at `https://da.live/config#/<org>/`: key `editor.path`, value `/<org>/<site>/products=https://da.live/form#`. This opens documents in `/products` in the form editor.
3. Create a schema named `aco-product` at `https://da.live/apps/schema` by pasting the contents of `demo/schema/aco-product.schema.json`.
4. Keep `/products/` out of the sitemap: add a bulk metadata row (path `/products/**`, `robots` = `noindex`).
5. Create the `/commerce/settings` sheet (see below), or run `npm run seed:push` to create the seed content.

## Settings sheet (`/commerce/settings`)

Multi-sheet with these tabs (a single plain sheet is read as the `settings` tab).

| Tab | Columns | Notes |
| --- | --- | --- |
| `settings` | `key`, `value` | Keys: `locale` (default `en-US`), `skuPrefix` (prepended to every SKU at sync, so demos on a shared tenant do not collide), `catalogViewId`, `defaultPriceBookId` (defaults to the first price book), `customer`, `label`, `demoId`. Other keys are kept as-is. |
| `price-books` | `priceBookId`, `name`, `currency`, `shopperGroup`, `derivedFrom`, `adjustPercent` | `currency` defaults to USD. `derivedFrom` + `adjustPercent` computes a book from another one (14.99 at -15 gives 12.74). A price set explicitly on the product wins over a derived one. `shopperGroup` ties the book to a customer group for segment pricing. |
| `metadata` | `code`, `label`, `dataType`, `filterable`, `searchable`, `sortable`, `visibleIn` | One row per ACO attribute. `dataType` defaults to TEXT. Booleans accept `true`, `yes`, `y`, `1`, `x`. `visibleIn` is a comma list (default `PRODUCT_DETAIL,PRODUCT_LISTING,SEARCH_RESULTS`). Every attribute code used on a product must have a row; add `brand` and `category` rows to make them filterable. |
| `shoppers` | `email`, `name`, `group` | Demo shoppers and their segment (matches `shopperGroup`). |

## Editing products

Open a document under `/products` in the form editor: fill in sku, name, slug (lowercase, digits, hyphens), status, category, brand, descriptions, `visibleIn` (CATALOG_AND_SEARCH, CATALOG, SEARCH, HIDDEN), images (https URLs; the first image becomes BASE, SMALL, THUMBNAIL), prices (one per price book id) and extra attributes (code + value). SKUs and slugs must be unique across the catalog. Save, then run `npm run validate`.

## ACO prerequisites

- An OAuth Server-to-Server credential in Adobe Developer Console with the **Adobe Commerce Optimizer Ingestion** API added.
- Tenant id, region and environment, from the instance access URLs in Commerce Cloud Manager: `https://{region}[-sandbox].api.commerce.adobe.com/{tenantId}/v1/catalog`.
- A catalog view created in the ACO UI. Put its id in the `catalogViewId` setting (needed by `verify` and the storefront).

## Environment (`demo/.env`)

Copy `demo/.env.example` to `demo/.env` and fill it in (ACO credentials and tenant, `DA_ORG`, `DA_SITE`, `DA_TOKEN`). Never commit `.env`.

## Commands

Run from `demo/`.

| Command | What it does | Flags |
| --- | --- | --- |
| `npm run validate` | Schema and cross-document checks (duplicate SKUs/slugs, unknown price books or attributes) | `--source=local\|da` |
| `npm run sync` | Push attribute metadata, price books, products and prices to ACO, in that order; only changes are sent | `--source=local\|da`, `--dry-run` (no ACO calls, credentials optional), `--prune` (delete demo SKUs, prices, books and attributes that disappeared), `--force` (resend everything), `--debug` |
| `npm run verify` | Query the storefront GraphQL per price book and check every searchable demo SKU and its price | `--source=local\|da`, `--view=<catalogViewId>` (default: settings) |
| `npm run reset` | Delete this demo's prices and products (only SKUs starting with `skuPrefix`) | `--yes` (required), `--all` (also price books and attributes), `--dry-run`, `--source=local\|da` |
| `npm run seed:push` | Write `demo/seed` into DA (skips documents that already exist) | `--dry-run`, `--overwrite` (replace existing docs), `--only=slug1,slug2` |
| `npm run seed:from-live` | Rebuild `demo/seed/products` from the live Fréscopa catalog | none |
| `npm test` / `npm run lint` | Unit tests (node:test) / ESLint for the demo tooling | |

`--source=local` reads `demo/seed`; the default reads DA. Last-synced hashes are kept in `demo/.state/<tenant>.json` (gitignored); delete it or use `--force` to resend everything.

## Limits

Batches are capped at 100 items and 190 KB (ACO allows about 200 KB). The CLI paces requests to roughly 270 per minute, under ACO's 300 requests/min limit, and the ACO SDK retries 408/413/429/5xx responses. Ingestion is asynchronous: allow a few minutes before `verify`.

## Troubleshooting

- **DA 401/403**: `DA_TOKEN` is missing, expired or has no access to the site. Get a fresh IMS token and update `.env`.
- **ACO 401/403**: wrong client id/secret, or the Ingestion API is not on the credential; also check `ACO_TENANT_ID`, `ACO_REGION`, `ACO_ENVIRONMENT`.
- **Warning "catalogViewId is empty"**: create a catalog view in ACO and set `catalogViewId`. Validation still passes, but `verify` and the storefront need it.
- **"attribute ... has no row in settings > metadata"**: add the code to the `metadata` tab.
- **A product was skipped**: its document is not using the `aco-product` schema.
