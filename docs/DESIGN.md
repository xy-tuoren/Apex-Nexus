---
version: alpha
name: apex-nexus-monochrome
description: A product admin console built on neutral black-and-white surfaces. The canvas is near-white (#fafafa) with true near-black ink (#0a0a0a). Typography is Inter throughout — headings use 600 weight, body uses 400/500. No display serif, no pastel gradient orbs. CTAs are ink pills on light mode and inverted pills on dark mode. Visual hierarchy comes from weight, spacing, and hairline borders — not decorative color or editorial type.

colors:
  primary: "#171717"
  primary-active: "#000000"
  ink: "#0a0a0a"
  body: "#525252"
  body-strong: "#171717"
  muted: "#737373"
  muted-soft: "#a3a3a3"
  hairline: "#e5e5e5"
  hairline-soft: "#f5f5f5"
  hairline-strong: "#d4d4d4"
  canvas: "#fafafa"
  canvas-soft: "#ffffff"
  canvas-deep: "#0a0a0a"
  surface-card: "#ffffff"
  surface-strong: "#f5f5f5"
  surface-dark: "#0a0a0a"
  surface-dark-elevated: "#171717"
  on-primary: "#ffffff"
  on-dark: "#ffffff"
  on-dark-soft: "#a3a3a3"
  semantic-error: "#dc2626"
  semantic-success: "#16a34a"

typography:
  heading-xl:
    fontFamily: "'Inter', sans-serif"
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.02em
  heading-lg:
    fontFamily: "'Inter', sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.01em
  heading-md:
    fontFamily: "'Inter', sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  title-md:
    fontFamily: "'Inter', sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: 0
  title-sm:
    fontFamily: "'Inter', sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "'Inter', sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-strong:
    fontFamily: "'Inter', sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "'Inter', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "'Inter', sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0
  caption-uppercase:
    fontFamily: "'Inter', sans-serif"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.08em
    textTransform: uppercase
  button:
    fontFamily: "'Inter', sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: 0
  nav-link:
    fontFamily: "'Inter', sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 24px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  base: 16px
  md: 20px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 64px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 10px 20px
    height: 40px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
  button-outline:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 9px 19px
    height: 40px
  button-tertiary-text:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button}"
  hero-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-xl}"
    padding: 96px
  feature-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.xl}"
    padding: 24px
  product-card-stack:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 0
  voice-row:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    padding: 12px 0
  voice-icon-circular:
    backgroundColor: "{colors.surface-strong}"
    rounded: "{rounded.full}"
    size: 32px
  pricing-tier-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 32px
  pricing-tier-featured:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 32px
  text-input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px 16px
    height: 44px
  select:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 0 16px
    height: 44px
    icon: "right aligned chevron with at least 16px inset"
    implementation: "Use components/ui/select.tsx; do not style native select in feature files"
  badge-pill:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.ink}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  cta-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-lg}"
    padding: 96px
  testimonial-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.body}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 32px
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    padding: 64px 48px
  footer-link:
    backgroundColor: transparent
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
---

## Overview

Apex Nexus is a **monochrome product console** — neutral near-white canvas, near-black ink, and Inter for every text role. There is no display serif, no pastel atmospheric gradient, and no editorial magazine voice. Hierarchy comes from **font weight (600 headings / 400 body), spacing, and 1px hairlines**.

CTAs stay subtle: an ink pill (`{component.button-primary}`) for primary actions, a transparent outline (`{component.button-outline}`) for secondary. The palette is intentionally restrained so data, tables, and operational UI stay readable.

**Key Characteristics:**
- Near-white canvas, near-black ink. Neutral gray body text.
- Single primary action color: ink pill at `{rounded.pill}`.
- **Inter only** — headings at 600, body at 400/500. No serif display fonts.
- No decorative color blobs or gradient orbs.
- Soft pill geometry for CTAs; `{rounded.xl}` for cards.
- 96px section rhythm where applicable.

## Colors

### Brand & Accent
- **Ink Primary** (`{colors.primary}` — #171717): Primary action — near-black pill.
- **Ink Primary Active** (`{colors.primary-active}` — #000000): Press state.

### Surface
- **Canvas** (`{colors.canvas}` — #fafafa): Page floor.
- **Canvas Soft** (`{colors.canvas-soft}` — #ffffff): Pure white bands and inset panels.
- **Canvas Deep** (`{colors.canvas-deep}` — #0a0a0a): Dark mode page floor.
- **Surface Card** (`{colors.surface-card}` — #ffffff): Card surface.
- **Surface Strong** (`{colors.surface-strong}` — #f5f5f5): Badges, icon plates, muted fills.
- **Surface Dark** (`{colors.surface-dark}` — #0a0a0a): Dark hero / featured tier.
- **Surface Dark Elevated** (`{colors.surface-dark-elevated}` — #171717): Cards on dark canvas.

### Hairlines
- **Hairline** (`{colors.hairline}` — #e5e5e5): Default 1px divider.
- **Hairline Soft** (`{colors.hairline-soft}` — #f5f5f5): Lighter divider / hover wash.
- **Hairline Strong** (`{colors.hairline-strong}` — #d4d4d4): Stronger panel outline.

### Text
- **Ink** (`{colors.ink}` — #0a0a0a): Headings, primary text.
- **Body** (`{colors.body}` — #525252): Running text.
- **Body Strong** (`{colors.body-strong}` — #171717): Emphasis within body.
- **Muted** (`{colors.muted}` — #737373): Labels, secondary copy.
- **Muted Soft** (`{colors.muted-soft}` — #a3a3a3): Disabled / tertiary.
- **On Primary** (`{colors.on-primary}` — #ffffff): Text on ink pill.
- **On Dark** (`{colors.on-dark}` — #ffffff): Text on dark surfaces.
- **On Dark Soft** (`{colors.on-dark-soft}` — #a3a3a3): Muted on dark.

### Semantic
- **Success** (`{colors.semantic-success}` — #16a34a): Confirmation only.
- **Error** (`{colors.semantic-error}` — #dc2626): Validation errors only.

Semantic colors are the **only** chromatic accents in the system. Do not introduce brand accent colors beyond black, white, and neutral gray.

## Typography

### Font Family
**Inter** carries headings, body, navigation, captions, and buttons. No secondary display face.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.heading-xl}` | 36px | 600 | 1.2 | -0.02em | Page hero h1 |
| `{typography.heading-lg}` | 24px | 600 | 1.25 | -0.01em | Section heads |
| `{typography.heading-md}` | 20px | 600 | 1.3 | 0 | Panel titles |
| `{typography.title-md}` | 18px | 500 | 1.35 | 0 | Card titles |
| `{typography.title-sm}` | 16px | 500 | 1.4 | 0 | List labels |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | Default body |
| `{typography.body-strong}` | 16px | 500 | 1.5 | 0 | Emphasized body |
| `{typography.body-sm}` | 14px | 400 | 1.5 | 0 | Secondary body |
| `{typography.caption}` | 13px | 400 | 1.45 | 0 | Meta text |
| `{typography.caption-uppercase}` | 11px | 600 | 1.4 | 0.08em | Section labels, badges |
| `{typography.button}` | 14px | 500 | 1.0 | 0 | CTA pill |
| `{typography.nav-link}` | 14px | 500 | 1.4 | 0 | Top-nav menu |

### Principles
- **Headings use Inter 600.** Never light-weight serif display type.
- **Body stays 400/500** for legibility in dense admin UI.
- **Minimal letter-spacing.** Slight negative tracking on large headings only.
- **Tabular nums** for metrics and counts.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.base}` 16px · `{spacing.md}` 20px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- **Section padding:** 96px for marketing-style bands; 24–48px for console sections.

### Grid & Container
- Max content width: ~1200px.
- Console body: 12-column grid.
- Feature card grids: 2-up at tablet, 3–4-up at desktop for stat rows.

### Whitespace Philosophy
Clear operational pacing — enough air for scanability, tight enough for data density. Cards inside sections use 16–24px gaps.

## Elevation & Depth

Depth is **hairline + soft drop only**. No colored atmospheric layers.

| Level | Treatment | Use |
|---|---|---|
| Flat (canvas) | `{colors.canvas}` | Body bands, footer |
| Card | `{colors.surface-card}` | Content cards |
| Hairline border | 1px `{colors.hairline}` | Card outlines, row dividers |
| Soft drop | `0 4px 16px rgba(0, 0, 0, 0.04)` | Hovered cards |

## Shapes

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Inline tags |
| `{rounded.sm}` | 6px | Compact rows |
| `{rounded.md}` | 8px | Form inputs |
| `{rounded.lg}` | 12px | Compact cards |
| `{rounded.xl}` | 16px | Feature cards |
| `{rounded.pill}` | 9999px | CTAs, badges |
| `{rounded.full}` | 9999px | Icon circles, avatars |

## Components

### Top Navigation

**`top-nav`** — Background `{colors.canvas}`, text `{colors.ink}`, height 64px, 1px bottom hairline. Wordmark left, horizontal menu center/left, actions right.

### Buttons

**`button-primary`** — Near-black pill. Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}`, height 40px, rounded `{rounded.pill}`.

**`button-outline`** — Transparent pill with 1px `{colors.hairline-strong}` border.

**`button-tertiary-text`** — Inline ink text link.

### Hero

**`hero-band`** — Background `{colors.canvas}`, headline in `{typography.heading-xl}`, subhead in `{typography.body-md}`, two CTAs. No decorative background blobs.

### Cards

**`feature-card`** — Background `{colors.surface-card}`, rounded `{rounded.xl}`, padding 24px, 1px hairline border.

**`testimonial-card`** — Quote card on white surface, `{rounded.xl}`, padding 32px.

### Forms & Tags

**`text-input`** — White background, `{rounded.md}`, 1px `{colors.hairline-strong}` border. Focus: 2px ink border.

**`badge-pill`** — `{colors.surface-strong}` fill, `{typography.caption-uppercase}`, `{rounded.pill}`.

### Footer

**`footer`** — Background `{colors.canvas}`, text `{colors.body}`, multi-column links.

## Do's and Don'ts

### Do
- Use Inter 600 for all headings and page titles.
- Reserve `{colors.primary}` for primary CTAs.
- Use hairlines and neutral gray fills for structure.
- Keep semantic green/red for status only.

### Don't
- Don't use serif or light display fonts for headings.
- Don't add pastel gradient orbs, colored blooms, or decorative gradients.
- Don't introduce saturated brand accent colors (purple, blue CTA, neon).
- Don't use warm stone palette — stay neutral gray.
- Don't bold headings beyond weight 600 — avoid shouty marketing type.

## Responsive Behavior

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 640px | Hero h1 scales down; stat cards 1-up; nav scroll/hamburger |
| Tablet | 640–1024px | Stat cards 2-up |
| Desktop | 1024–1280px | Full layout, 4-up stat row |
| Wide | > 1280px | Content caps at 1200px |

### Touch Targets
- Primary pill at 40px height minimum.
- Icon plates 32px with padded row for 48px tap zone.

## Iteration Guide

1. Focus on one component at a time.
2. CTAs default to `{rounded.pill}`. Cards use `{rounded.xl}`.
3. Use `{token.refs}` — never inline hex in components.
4. Inter 600 for headings, Inter 400/500 for body.
5. Monochrome first — add color only via semantic tokens when needed.

## Known Gaps

- Animation timings out of scope.
- In-product editor surfaces only partially specified.
- Form validation states beyond focus not fully documented.
