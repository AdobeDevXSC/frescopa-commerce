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

## Buttons

A link alone in its paragraph becomes a button when emphasised:

| Authoring | Result |
|---|---|
| **bold** link | Primary pill. Its colour follows the ground: roast on light grounds, amber on `roast`, crema on `teal`. |
| **_bold italic_** link | Accent pill (ember red). |
| _italic_ link | Secondary (outlined) pill. |
