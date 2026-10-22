# Page inventory (Phase 0)

Built on 2026-10-22 from `https://frescopa.coffee/sitemap.xml` (116 URLs) and `sitemap-content.xml` (117 URLs; the one extra is `/rise-and-shine`), plus each page's `.plain.html`. I checked rendered pages in a browser to see runtime product grids, forms and link targets. This replaces the "initial" table in `content-inventory.md`; status codes there are from 2026-10-19.

**Status: draft, waiting for confirmation of the page list before Phase 2.**

## Summary

| Decision | Count | What |
|---|---|---|
| Migrate | 11 | Home, 4 category landings, 4 content pages, locations, subscription |
| Migrate as fragment | 2 | `/nav`, `/footer` (Phase 1) |
| Link out | 3 types | Product detail pages, quiz, account/cart/checkout/login |
| Skip | 104 sitemap URLs | Content fragments (27), other locales (57), `/en/*` duplicates and drafts (13), experiments and variations (3), `/rise-and-shine`, `/search`, `/locations/locationlist`, the enquiry form definition |
| Needs a decision | see [Open questions](#open-questions) | `/tea` source, `/contact-us`, `/rise-and-shine`, locales, forms, dead link targets |

Template types: **home**, **category landing** (teaser + commerce product grid), **content** (default content and/or teaser + cards), **locations**, **form/interactive**, **commerce**.

## Migrate

| Path | Template | Source blocks (`.plain.html`) | Decision and notes | Phase |
|---|---|---|---|---|
| `/` | home | `teaser` (dark right, yellow), `offer`, `store-locator`, `cards` ×3, `reward` (light left), `hero` ×2, `section-metadata` ×3 | Migrate as the D1 homepage, per `homepage-spec.md`. `offer`, the Google Maps embed and the trailing `hero` image stack are not migrated (see `content-inventory.md`). Live head has `experiment=exp-20250911-1` with split 0 and a challenger path that returns 404; it is not migrated. | 2 |
| `/coffee` | category landing | `teaser` (left, red, half-height; image "Three cups"; label "There's nothing quite like"; h3 "Frescopa Coffee"), h3 "Bagged Coffee" + `product-list-page-custom` (category 27), `dm-scene7-template` (Scene7 "TimeSensitiveOffer" image), h3 "Coffee Pods" + `product-list-page-custom` (category 23), `article` (fragment "The Magic of Espresso"), empty `store-locator` | Migrate teaser and section headings. Product grids are commerce-driven and render at runtime (6 products: `hbdr212`, `hbex213`, `hbmr211`, `pod311`, `pod341`, `pod351`), so link out. The Scene7 offer image, article fragment and empty locator need a decision (Q6). | 3 |
| `/machines` | category landing | `teaser` (blue, half-height; h3 "Frescopa Coffee Machines"), `product-list-page-custom` (category 29), h2 "Enquiry form" + 2 paragraphs + `embed-adaptive-form` (`/content/forms/af/frescopa/enquire`), `sticky-cta` "Register for Webinar" → `/event-registration` | Migrate teaser and enquiry intro. Product grid links out (3 products: `csm5125`, `csm5131`, `csm5148`). The AEM adaptive form needs a decision (Q5). Skip `sticky-cta`: its target returns 404. | 3 |
| `/accessories` | category landing | `teaser` (left, black, half-height; label "The perfect combination of"; h3 "Frescopa Accessories"; no image), `product-list-page-custom` (category 28) | Migrate teaser. Product grid links out (5 products: `acc341`, `acc511`, `acc558`, `acc563`, `itt743`). | 3 |
| `/tea` | category landing | `/tea` returns **404** on the live site (page and `.plain.html`), but nav links to it. Content exists at `/en/tea`: `teaser` (left, yellow, half-height; label "There's nothing quite like"; h3 "Frescopa Tea"), `product-list-page-custom` (category 30) | Proposed: migrate `/en/tea` content to `/tea` (Q1). Product grid links out (3 products: `tea103`, `tea105`, `tea106`). | 3 |
| `/about-us` | content | Default content only: h2, paragraphs, h3 ×3, a 3-item list | Migrate verbatim as default content. | 3 |
| `/sustainability` | content | `teaser` (left, blue; h3 "Frescopa & Sustainability"), h2 + `cards` (5 long cards, section style `blog`/`numbered`), `dm-video` (Dynamic Media video, autoplay muted) | Migrate teaser, heading and cards. The `dm-video` is a third-party player, so it needs a decision (Q7). | 3 |
| `/business` | content | `teaser` (light left; image; h3 "Frescopa for Business"); nothing else | Migrate. Very thin page (one image and one heading). The footer links to `/business.html`, which is a **404** (Q3). | 3 |
| `/locations` | locations | h3 "Our Locations", `store-locator` (h "Try a new roast at a Fréscopa near you!", label "Find A Location", placeholder "Post Code", button "Search") | Migrate with the Phase 2 `store-locator` (ZIP form + static address card, "ZIP code" correction). The dynamic list source (`/locations/locationlist`, `/en/locations/locationslist`) is empty on the live site and the map is broken (Q4). | 3 |
| `/subscription` | content | `teaser` (left, light, `bg-spectrum-red-700`; label "MyBarista Subscription"; h3; paragraph; CTA "Subscribe to MyBarista" → `#`), `cards` (3 numbered steps) | Authored content only, not commerce-driven, so migrate. Homepage CTAs and the announcement bar point here. The CTA target is `#` on the live site (Q3). | 3 |
| `/contact-us` | content + form | `teaser` (blue; **h1** "Contact Us"), default content (Customer Service, Media Contacts), `teaser` (dark right, yellow; "FIND YOUR ANSWERS"; "Visit the Help Center" → `/`), `form` (AEM form JSON) | **Not in the initial inventory** and not linked from nav, footer or home. Proposed: migrate the copy; the form follows Q5 (Q2). | 3 |

## Migrate as fragment (Phase 1)

| Path | Content | Notes |
|---|---|---|
| `/nav` | Section 1: announcement text + "SHOP NOW"; section 2: logo icon → `/`; section 3: 6 links (Coffee `/coffee`, Tea `/tea`, Machines `/machines`, Accessories `/accessories`, Locations `/locations`, Sustainability `/sustainability`) | The live fragment text reads "FREE SHIPPING FROM $35 & FREE COFFEE SAMPLES with code Frescopa." and "SHOP NOW" is **plain text, not a link** (Q8). The live header throws a JS error and does not show the announcement bar at all. Rendered header also has Cart, Search, "My Account" → `/customer/account` and "Sign in" → `/login?redirect=…` (both 404). |
| `/footer` | Brand block (logo, "Fréscopa Coffee & Tea", tagline, address, email, phone), `columns` with 5 link columns, legal row | As in `content-inventory.md`. Live link targets `/business.html` and `/blog` return 404 (Q3). |

## Link out (absolute `https://frescopa.coffee/...`)

| Path / pattern | Type | Notes |
|---|---|---|
| `/products/<sku>/<sku>` | commerce (PDP) | 17 SKUs are reachable from the 4 category grids (listed above). Live PDPs render (example: `/products/hbdr212/hbdr212`). |
| `/quiz` | interactive | `teaser` + `quiz` block driven by 23 DAM fragments under `/content/dam/frescopa/en/quiz/`. Homepage hero CTA links here. |
| `/customer/account`, `/login`, `/signup`, cart, checkout | account/commerce | All return **404** as standalone URLs (`/signup` is the homepage "Claim Rewards" target, see Q3). The cart is a header drop-in, with no page. |

## Skip

| Group | Paths | Reason |
|---|---|---|
| Content fragments (27) | `/content/dam/frescopa/en/quiz/*` (23), `/content/dam/frescopa/en/articles/*` (3), `/content/dam/frescopa/en/offers/fall-in-love-my-barista-subscription` (1) | Not pages; consumed by `quiz`, `article` and `offer` blocks. |
| Other locales (57) | `/es/*` (20), `/fr/*` (18), `/jp/*` (18), `/content/frescopa/es/` | Translations of the English site (example: `/es/coffee` "Café Frescopa"). The brief covers English only (Q9). |
| `/en/*` duplicates (13) | `/en`, `/en/`, `/en/coffee`, `/en/machines`, `/en/tea`, `/en/products`, `/en/products/default`, `/en/subscription`, `/en/locations`, `/en/locations/locationslist`, `/en/drafts/jalagari/{signup,signup1,machines}` | `/en/` is empty. The rest are older copies of the root pages (with forms instead of embeds) or drafts. Exception: `/en/tea` is the proposed source for `/tea` (Q1). |
| Experiments and variations (3) | `/experiments/value-prop-headline-test/challenger-1`, `/variations/subscription-var1`, `/variations/machines` | A/B test copies of `/subscription` and `/machines` (alternative headlines, inline form). |
| Campaign page (1) | `/rise-and-shine` | Homepage clone with a dated offer ("before November 30, 2026 — from $19.99/month, first month free") and a video. Not linked from nav, footer or home (Q10). |
| Empty or data pages | `/search` (empty shell), `/locations/locationlist`, `/en/locations/locationslist` (empty), `/es/placeholders` (and other locales' placeholders), `/es/products/default/metadata` | No authored content. Header search stays an inert button per `homepage-spec.md`. |
| Commerce templates | `/en/products`, `/en/products/default`, `/products/default` | `product-list-page` and `product-details` shells for the commerce runtime. |
| Form definition | `/content/forms/af/frescopa/enquire` | AEM adaptive form embedded on `/machines` (Q5). |

The Commerce page-type classifier (`excat-commerce`) returned `CONTENT` for every page. Product data is not in the authored markup, so it only saw the `product-list-page` and `product-details` block signals. Product grids were confirmed by rendering the live pages.

## Dead or empty link targets on the live site

| Target | Linked from | Live status |
|---|---|---|
| `/tea` | nav; `homepage-spec.md` (Bundles card → `/tea`); prototype (6×) | 404 (content is at `/en/tea`) |
| `/signup` | homepage Rewards "Claim Rewards"; prototype | 404 |
| `/business.html` | footer "Fréscopa Enterprise"; prototype | 404 (`/business` is 200) |
| `/blog` | footer "Blog"; prototype | 404 |
| `/login?redirect=…`, `/customer/account` | header; prototype | 404 |
| `/event-registration` | `/machines` sticky CTA | 404 |
| `#` | `/subscription` CTA "Subscribe to MyBarista" | no target |
| `/` | `/contact-us` "Visit the Help Center" | homepage, not a help centre |
| (empty href) | `/contact-us` "press@frescopa.coffee" | no target |

## Open questions

1. **`/tea`**: the root page is 404 but `/en/tea` has content. Migrate `/en/tea` content to `/tea`, or treat Tea as link-out to a broken page?
2. **`/contact-us`**: migrate it (it has the only `h1` on the live site and real contact copy), or skip it because nothing links to it?
3. **Dead targets** (table above): for `/signup`, `/business.html`, `/blog`, `/login`, `/customer/account` and the `#` CTA, should I (a) keep the live URL as-is, (b) point at a working equivalent (`/business.html` → `/business`), or (c) render the label as plain text? `/signup` is the only Rewards CTA on the homepage.
4. **`/locations`**: the dynamic location list is empty on the live site. OK to render only the ZIP form and the single static address card from the homepage?
5. **Forms**: `/machines` (enquiry) and `/contact-us` embed AEM adaptive forms. Link out, skip the form and keep the intro copy, or treat forms as a separate phase?
6. **`/coffee` extras**: migrate or skip the Scene7 "TimeSensitiveOffer" image (third-party host, no copy), the "The Magic of Espresso" article fragment and the empty store locator?
7. **`/sustainability` video**: the Dynamic Media video is a third-party player below the fold. Keep as a link/poster, or skip?
8. **Announcement bar**: the live nav reads "...with code Frescopa." and "SHOP NOW" has no link. `content-inventory.md` says "...with code FRESCOPA." and links "Shop Now" to `/subscription`. Which is right?
9. **Locales** (`/es`, `/fr`, `/jp`, 57 URLs): confirm they are out of scope for this migration.
10. **`/rise-and-shine`**: confirm it is skipped (campaign variant of the homepage with a dated offer and no terms).
