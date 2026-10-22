# Content inventory and sources

## How to read the live site
- Fetch any page's authored markup: `curl https://frescopa.coffee/<path>.plain.html` (the live site is itself an Edge Delivery site; `.plain.html` returns the content without chrome). For the homepage use `/index.plain.html` or `/.plain.html`.
- Page list: `https://frescopa.coffee/sitemap.xml` (also lists `/content/dam/...` fragments and `locations/locationlist`; those are not pages to migrate).
- The live source repo is public: `AdobeDevXSC/frescopa` (AEM Cloud + Universal Editor + Commerce dropins). Read it for block behaviour (`teaser`, `offer`, `store-locator`, `cards`, `reward`, `hero`), do not copy its commerce code.
- Source blocks on the homepage: `teaser` (hero), `offer`, `store-locator`, `cards` (two instances), `reward`, then `hero` blocks that render as an unconstrained image stack (not migrated).

## Pages (initial; confirm in Phase 0)
Status of `<path>.plain.html` was checked on 2026-10-19.

| Path | `.plain.html` | Proposed handling |
|---|---|---|
| `/` | 200 | Migrate (Phase 2, D1 homepage) |
| `/coffee` | 200 | Migrate as category landing; product grid is commerce-driven, so link out per product |
| `/machines` | 200 | same as `/coffee` |
| `/accessories` | 200 | same as `/coffee` |
| `/tea` | 404 | Check in a browser; may be a commerce listing. Link out unless it has authored content |
| `/locations` | 200 | Migrate content; the dynamic locations list needs a decision (ask the human) |
| `/sustainability` | 200 | Migrate (content page) |
| `/about-us` | 200 | Migrate (content page) |
| `/business.html` | 200 (`/business`) | Migrate (content page, "Fréscopa Enterprise") |
| `/subscription` | 200 | Check: likely commerce/interactive. Link out unless authored content only |
| `/quiz` | 200 | Interactive. Link out |
| `/blog` | 404 | Check; link out if it is a listing |
| `/signup`, `/login`, `/customer/*`, `/products/*`, cart, checkout | n/a | Commerce/account. Link out, absolute URLs to `https://frescopa.coffee` |

## Homepage copy (verbatim from the live site, with approved corrections marked)

Announcement bar: "Free shipping from $35 & free coffee samples with code FRESCOPA." Link "Shop Now" → `/subscription`.

Hero: label "MyBarista Coffee Quiz" **[correction: live text ends in a literal "..."; dropped]**; h1 "Your perfect coffee is four questions away." **[correction: live reads "in four questions away!"]**; CTA "Take our Coffee Quiz" → `/quiz`.

Dawn: h2 "Fall in love with rich aromas and bold flavors—every single day"; paragraph "With a MyBarista subscription, savor hand-selected coffees—each chosen for their unique taste and aroma—delivered right to your door every month. Experience new flavors, curated for your lifestyle."; CTA "Shop Now" → `/subscription`.

Tasting: h2 "Elevate Your Coffee Game"; sentence "Experience the bright, citrusy notes and smooth finish of House Blend Dark Roast. A perfect start to any day."; CTA "Learn More" → `/coffee`.

Personal: h2 "Coffee Made Personal"; paragraph "Enjoy coffee crafted for you, delivered monthly. Hear from satisfied subscribers who love MyBarista's unique service. Exclusive deal: First month half-price. Dive into the ease of personalized coffee with MyBarista now."; CTA "Subscribe" → `/subscription`. (The live page repeats this card four times; use it once.)

Shop: h2 "Shop all Fréscopa products."; labels "Coffee Machines", "Bagged Coffee", "Coffee Pods", "Bundles" **[correction: live reads "Bundles!!!"]**, "Accessories".

Locator: h2 "Try a new roast at a Fréscopa near you!"; label "Find another location now"; field placeholder "ZIP code" **[correction: live reads "Post Code"]**; button "Search". Card: "Fréscopa Coffee & Tea", "Smiles one cup at a time.", "3900 Adobe Way, Lehi, UT 84043", `info@frescopa.coffee`, "(385) 345-0000".

Rewards: h2 "Rewards unclaimed is a Gift missed!"; body "Surprise your loved ones with the ultimate coffee experience." **[correction: the live body has a second sentence about gift cards that contradicts the headline and CTA; dropped]**; CTA "Claim Rewards" → `/signup`.

Footer: columns and links as on the live site. Known targets: Machines → `/machines`, Coffee → `/coffee`, Tea → `/tea`, Accessories → `/accessories`; items Espresso Machines, Fréscopa Major, Fréscopa Minor, Autodrip Coffee Makers, Coffee Grinders → `/machines`; Bagged Coffee, Coffee Pods → `/coffee`; Loose Leaf, Pods, Bundles → `/tea`; Replacement Parts, Cups & Mugs, Travel Mugs → `/accessories`; **Kettles & Carafes** → `/accessories` **[correction: live has "Kettles & Carafs" plus a duplicate "Carafs"; one item kept]**; About Us → `/about-us`; Find a Retailer → `/locations`; Fréscopa Enterprise → `/business.html`; Sustainability → `/sustainability`; Blog → `/blog`. Plain text (no known URL): Fréscopa Affiliate, Support, Terms of Use, Privacy Policy, Cookie Notice, Diversity & Inclusion, Social Responsibility, Site Map. Copyright: "© Fréscopa, Inc. All rights reserved."

## Approved corrections (the complete list)
1. Hero h1 grammar ("is four questions away.").
2. Hero label: trailing "..." removed.
3. "Bundles!!!" → "Bundles".
4. "Post Code" → "ZIP code" (US address).
5. "Kettles & Carafs" → "Kettles & Carafes", duplicate "Carafs" removed.
6. Rewards body trimmed to its first sentence.

Everything else stays verbatim, even if awkward. Report other copy problems in the PR; do not fix them.

## Deliberately not migrated
- The 10% discount stamp and offer (no terms on the live site).
- The Google Maps embed (renders an error on the live site).
- The unplaced image stack and empty hero blocks below the live rewards banner (luggage, supercar, duplicate café photos, packaging illustration).
- Three of the four repeated "Coffee Made Personal" cards.

## Assets
Local copies for reference are in `tools/prototypes/assets/` (media, fonts, logo). Production images should come from the live site/DAM at full quality and go through the media bus (DA), not be committed under `media_*` names.

| Use | Live source |
|---|---|
| Hero café photo (people at a table) | on the live homepage, `./media_18d60179b76dac9356845e1f7c7a9355d2f6640d0.png` (2978×2048) |
| Sunrise cup and bean sack (750×500, low resolution; request a larger master) | AEM asset `urn:aaid:aem:63c05d5d-dc5c-46e9-815f-c0fdff5ec78c` (`Frescopa-coffee-landscape-113.png`) |
| Hiker with cup (spare, used in other prototypes) | live homepage card image |
| Machine "Fresco Original" | https://delivery-p149891-e1546481.adobeaemcloud.com/adobe/assets/urn:aaid:aem:8e7990e0-4758-4fe1-9357-9e6d7f555160 (opaque white background) |
| Bag "House Blend - Dark Roast" | https://delivery-p149891-e1546482.adobeaemcloud.com/adobe/assets/urn:aaid:aem:5f861728-7e97-4513-ab01-d6d174f244d6 (transparent) |
| Pod "Morning Muse - Light Roast" | https://delivery-p149891-e1546481.adobeaemcloud.com/adobe/assets/urn:aaid:aem:0eff15fc-5599-4b47-8b52-cd1a788bc2da (transparent) |
| Mug "Cappuccino Mug" | https://delivery-p149891-e1546481.adobeaemcloud.com/adobe/assets/urn:aaid:aem:d99d2ffb-650f-48c3-803e-5af07960da05 (opaque white background) |
| Category line icons (Bundles uses the beans icon) | live homepage tiles |
| Logo (single full-colour variant) | `tools/prototypes/assets/logo.svg` |
| Reward ribbon art | `tools/prototypes/assets/media/reward-banner-v1.svg` |

Open asset items for the human: a larger sunrise photo, a reversed logo, a bundle/tea product photo.
