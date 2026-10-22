---
name: Fréscopa D1 The Ritual
description: Scroll-story rebrand: midnight roast to dawn amber, Bodoni Moda, arch frames.
colors:
  midnight-roast: "oklch(0.20 0.03 55)"
  crema: "oklch(0.94 0.025 78)"
  dawn-amber: "oklch(0.80 0.15 75)"
  ember-red: "oklch(0.45 0.15 27)"
  pod-teal: "oklch(0.467 0.087 222.7)"
  coral: "oklch(0.70 0.15 38)"
  ink-maroon: "oklch(0.28 0.08 20)"
typography:
  display:
    fontFamily: "'Bodoni Moda', 'Bodoni 72', Didot, Georgia, serif"
    fontSize: "clamp(3rem, 1rem + 7.4vw, 8.5rem)"
    fontWeight: 500
    lineHeight: 0.94
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Bodoni Moda', 'Bodoni 72', Didot, Georgia, serif"
    fontSize: "clamp(2.4rem, 1rem + 4.4vw, 5.5rem)"
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: "-0.015em"
  title:
    fontFamily: "'Bodoni Moda', 'Bodoni 72', Didot, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 500
    lineHeight: 1.1
  body:
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.12em"
rounded:
  sm: "8px"
  md: "24px"
  arch: "999px 999px 24px 24px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "48px"
  xl: "96px"
  2xl: "160px"
components:
  button-primary:
    backgroundColor: "{colors.midnight-roast}"
    textColor: "{colors.crema}"
    rounded: "{rounded.pill}"
    padding: "14px 30px"
    typography: "{typography.label}"
  button-sun:
    backgroundColor: "{colors.dawn-amber}"
    textColor: "{colors.midnight-roast}"
    rounded: "{rounded.pill}"
    padding: "14px 30px"
  arch-card:
    backgroundColor: "{colors.crema}"
    textColor: "{colors.ink-maroon}"
    rounded: "{rounded.arch}"
    padding: "32px 24px"
---
# Design System: Fréscopa — D1 "The Ritual"

## Overview

**Creative North Star: "The Pour"**

A scroll story told in four colours of the day: midnight roast, dawn amber, crema, coral, with captured teal for the reward. Type is huge, high-contrast and slightly theatrical (Bodoni Moda over Hanken Grotesk). Product photography is tinted into each ground (multiply) so the bag, pod and mug feel printed on the colour. An arch, the shape of a café window, repeats as the hero image frame and the product cards.

**Key Characteristics:**
- One scene per idea; background colour changes carry the story
- Display type up to 8.5rem, italic for one emphasised phrase per headline
- Arch frames; one big circular "sun" in the dawn scene
- Motion is scroll-linked and optional: the static layout is complete

## Colors
- **Midnight Roast** (oklch(0.20 0.03 55)): hero, shop and footer grounds; crema text 14:1.
- **Dawn Amber** (oklch(0.80 0.15 75)): dawn scene, locator; ink text.
- **Crema** (oklch(0.94 0.025 78)): tasting scene, cards, text on dark.
- **Coral** (oklch(0.70 0.15 38)): "Coffee Made Personal" scene; midnight text.
- **Pod Teal** (oklch(0.467 0.087 222.7)): reward panel (captured value, so the captured ribbon art blends).
- **Ember Red** (oklch(0.45 0.15 27)) and **Ink Maroon**: primary cta fill and text on light.
### Named Rules
**The One Ground Rule.** Each scene owns one ground colour; no gradients except the dawn transition.

## Typography
Display: Bodoni Moda (variable, self-hosted). Body: Hanken Grotesk (variable, self-hosted). Ratio ≥ 1.25; display clamps to 8.5rem.

## Layout
1440 design width, 12-col; scenes are full-bleed. Pinned scenes (≥ 768px, motion enabled) are 200–220vh tall with a sticky 100vh stage.

## Elevation & Depth
Flat colour fields; the only shadow is a soft one under arch cards. Product cut-outs use multiply, not shadows.

## Shapes
Arch (999px 999px 24px 24px), full pill buttons, one circle.

## Motion
Scroll-linked via one CSS variable per scene (--p, 0 to 1). Opacity and transform only. Reduced-motion and no-JS get the static layout. At most one infinite loop (floating beans).

## Do's and Don'ts
- **Do** end every scroll move in a complete layout.
- **Don't** hide content behind motion; **don't** add copy.
