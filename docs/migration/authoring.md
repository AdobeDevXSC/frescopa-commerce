# Authoring notes

How authored content maps to the D1 foundations. Block-specific notes are added per phase; `handover.md` (Phase 4) links here.

## Nav fragment (`/nav`)

Sections, in order (separate them with `---` in the document):

1. **Announcement bar.** Message paragraph, then a paragraph with the "Shop Now" link. Section metadata `Style: announcement`. If this section is missing, the header simply has no bar.
2. **Brand.** One paragraph containing a link to `/` whose only content is the `:frescopa-logo:` icon.
3. **Primary links.** One bulleted list of links. A list item with a nested list becomes a dropdown.
4. **Tools.** One bulleted list of links. Put an icon before the text (`:account: My Account`) to show it as an icon button; the text remains as its accessible name. Search and Cart buttons are added by the header and do nothing yet (commerce is out of scope).

## Footer fragment (`/footer`)

1. **Brand.** Logo link (`:frescopa-logo:` linked to `/`), the name in bold, the tagline, then address, email link and phone in one paragraph separated by line breaks.
2. **Link columns.** Repeat *heading + bulleted list* once per column. Link the heading if it has a target. List items without a link stay plain text.
3. **Legal.** The copyright paragraph, then a bulleted list of legal items.

The logo is reversed for the dark ground with a CSS filter; no separate asset is needed.

## Section grounds

Set with section metadata `Style`: `roast`, `amber`, `crema`, `coral`, `teal`. Each ground sets text, link, button and focus-ring colours, and gives the section 128px vertical padding (64px at 900px and below). Sections without a style keep the default crema page ground.

## Homepage blocks

The homepage is seven sections, each with its own ground (section metadata `Style`), in this order:

| # | Section `Style` | Content |
|---|---|---|
| 1 | `roast` | **Hero (arch)** |
| 2 | `amber` | **Story (dawn)** |
| 3 | `crema` | **Story (tasting)** |
| 4 | `coral` | **Story (personal)** |
| 5 | `roast` | Heading "Shop all Fréscopa products." (default content), then **Cards (arch)** |
| 6 | `amber` | **Store Locator** |
| 7 | `roast` | **Reward** |

### Hero (arch)
Every page opens with one: the homepage, category pages, content pages and Locations.

| Row | Content |
|---|---|
| 1 | The photo (shown in the arch frame; loaded first, so keep it one image). Leave this row out for a text-only hero. |
| 2 | The page's only **h1**. Put a highlighted phrase in *italics* (it renders upright, in amber). A paragraph that is entirely **bold** is a label line (small amber capitals): put it above the h1 as an eyebrow, or below it as a note. Other paragraphs are body text. End with the CTA as a **bold** link. |

The amber circle and floating coffee beans are decoration added by the block; there is nothing to author for them.

### Story (dawn / tasting / personal)
| Row | Content |
|---|---|
| 1 | The image: one photo for `dawn` (shown in the circle) and `tasting` (the bag); two for `personal`, pod first, then mug. |
| 2 | **h2**, one paragraph, then the CTA: a **bold** link (roast pill) or a ***bold italic*** link (ember pill, used in `tasting`). |

Product photos with an opaque white background are blended into the ground automatically; transparent cut-outs are left as they are. On large screens with motion allowed, each scene pins and animates as you scroll; everywhere else (and for keyboard users) the finished layout shows.

### Cards (arch)
One row per card: the image in the first cell, then an **h3** containing the link in the second cell. The whole card is clickable. Use an icon instead of a photo when no product photo exists (Bundles).

### Store Locator
One row, two cells:
| Cell | Content |
|---|---|
| 1 | **h2**, the field label paragraph, the field placeholder paragraph, then a link: its text is the button label and its URL is the page the search goes to (the query is sent as `?q=`). |
| 2 | The address card: **h3** (name), tagline paragraph, then one paragraph with address, email link and phone separated by line breaks. |

No map is shown.

### Reward
One row: **h2**, one paragraph, then the CTA as a **bold** link. The teal panel and ribbon artwork come from the block.

## Template pages (Phase 3)

| Page type | Sections (`Style`) |
|---|---|
| Category (`/coffee`, `/machines`, `/accessories`, `/tea`) | Hero (`roast`); one section per product group: optional h2, then **Cards (arch)** (`roast`); prose such as the article teaser or enquiry copy (`crema`). |
| Content (`/about-us`, `/sustainability`, `/business`, `/subscription`, `/contact-us`) | Hero (`roast`); prose (`crema`); **Columns** for image-and-text features (`crema`, or `amber` for a call-out such as "FIND YOUR ANSWERS"). |
| Locations | Hero (`roast`), **Store Locator** (`amber`). |

### Cards (arch) for products
One row per product: the product photo, then an **h3** whose link goes to the live product page (`https://frescopa.coffee/products/<sku>/<sku>`). No prices: the store stays on the live site (D11).

### Columns
One row per feature: the image in one cell, the text in the other (heading, then paragraphs). A paragraph that is entirely **bold** is a lead-in or sub-heading. On wide screens the image side alternates from row to row; on small screens the image comes first.

## Links
Pages being migrated are linked site-relative (`/coffee`). Everything else on frescopa.coffee (quiz, products, account, sign-up, blog) is linked absolute to the live site.

## Buttons

A link alone in its paragraph becomes a button when emphasised:

| Authoring | Result |
|---|---|
| **bold** link | Primary pill. Its colour follows the ground: roast on light grounds, amber on `roast`, crema on `teal`. |
| **_bold italic_** link | Accent pill (ember red). |
| _italic_ link | Secondary (outlined) pill. |
