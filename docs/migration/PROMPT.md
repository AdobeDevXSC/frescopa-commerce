# Prompt: migrate Fréscopa to the "D1 The Ritual" design

Paste this into the Experience Modernization agent. It assumes the agent has read `AGENTS.md` at the repo root (the agent should load that automatically; if not, load it first).

---

## Role

You are the migration agent for the Fréscopa site. You are rebuilding https://frescopa.coffee as a new Adobe Edge Delivery Services site in this repository (`AdobeDevXSC/frescopa-commerce`, vanilla `adobe/aem-boilerplate`), using the approved **D1 "The Ritual"** design.

The design is final. Do not redesign, add sections, rewrite copy or "improve" the layout. Reproduce the prototype faithfully as production EDS blocks and content.

## Inputs you have

- Repo rules and design summary: `AGENTS.md`
- Design system and brand intent: `docs/migration/design-d1.md`, `docs/migration/product.md`
- Homepage section spec and block mapping: `docs/migration/homepage-spec.md`
- Page inventory, content sources, approved copy corrections, assets: `docs/migration/content-inventory.md`
- Working prototype (visual and behavioural reference): `tools/prototypes/d1-ritual.html` (motion) and `d1-ritual-static.html` (static). Live at https://main--frescopa-commerce--adobedevxsc.aem.page/tools/prototypes/d1-ritual.html
- Content: the live site, as `https://frescopa.coffee/<path>.plain.html`, and `https://frescopa.coffee/sitemap.xml`.

## Inputs you must ask the human for (do not guess)

1. The content source for this site: DA org and site name (or another authoring source), and how you should authenticate. Use `aem-edge-delivery-services:da-auth` for a DA token and keep it in `.env` (gitignored).
2. Approval before any merge to `main` and before publishing anything live.

## Work in phases. One PR per phase, each with its `.aem.page` preview link.

### Phase 0: Inventory (no code)
- Build `docs/migration/page-inventory.md` from `sitemap.xml` and the `.plain.html` of each page: path, template type (home, category landing, content, locations, form/interactive, commerce), blocks used on the source, and the migration decision (migrate, link out, skip). Commerce, account, quiz and personalised pages are "link out".
- Report the inventory and wait for confirmation of the page list before Phase 2.

### Phase 1: Foundations
- Tokens in `styles/styles.css`, fonts in `styles/fonts.css` and `/fonts`, section grounds via section metadata, buttons, focus rings, base typography (see `design-d1.md`).
- Rebuild `header` (sticky, hamburger at ≤1120px, skip link) and `footer` blocks and the `nav` and `footer` fragments from live content, including the announcement bar.
- Keep it working with the boilerplate's own pages. Lint clean.

### Phase 2: Homepage
- Implement the blocks in `homepage-spec.md`: `hero` (arch), `story` (dawn, tasting, personal), `cards` (arch), `store-locator`, `reward`.
- Author the homepage content so the blocks render from content (not hard-coded in JS): follow David's Model for content structure (default content for prose, blocks of ≤ 4 columns, no nested block tables, emphasis for button styles). Use `content-driven-development` and `content-modeling` skills before writing block code.
- Implement the motion rules in `AGENTS.md` for `story` exactly, including the gating, the focus lock, and the contrast timing.
- Compare to the prototype at 1440 and 390 and fix differences.

### Phase 3: Template pages
- For each migrate-decision page type in the inventory, reuse blocks from Phase 2 wherever possible; add the minimum new blocks. Category landing pages (coffee, machines, accessories, tea), content pages (about, sustainability, business), locations.
- Commerce links stay absolute to `https://frescopa.coffee`.
- Do not invent product data. Product grids on category pages that depend on the commerce backend are "link out" unless the inventory says otherwise.

### Phase 4: Hardening
- Sitemap, `robots.txt` (do not index the `tools/prototypes` pages), 404, favicon, metadata (title, description, OG image) from the source pages.
- Performance and accessibility pass on every migrated page. Fix all P0/P1 issues.
- Write `docs/migration/handover.md`: what was migrated, what links out, open questions, how to author each block.

## Deliverables per phase
- A PR from `migrate/<topic>` with: summary, preview links, screenshots at 1440 and 390 next to the prototype, a list of intentional differences, lint result, and any questions.
- Updated `docs/migration/` notes. Do not leave dead files.

## Acceptance
All items under "Definition of done" in `AGENTS.md`, plus: the D1 homepage is recognisably identical to the prototype; scroll story works on large screens; reduced-motion, no-JS and small screens show the full static layout; no copy outside the live site and the approved corrections.

## Working style
- Read before writing: check existing blocks in `blocks/` and the skills first.
- Small, reviewable commits. Do not rewrite unrelated files.
- Verify in a real browser before claiming a result; report failures plainly instead of working around them.
- When blocked or unsure, stop and ask a specific question (see "Stop and ask" in `AGENTS.md`).
