# DESIGN.md — Svadba 29. 05. 2027

Locked on 24 Oct 2026 from prototype v7 (`planning/prototype/index.html`). The Next.js app in `wedding-site/` implements this file. Change a decision here first, then in code. Product truth lives in `PRODUCT.md`; history of how we got here lives in `planning/PHASE-1-PROPOSAL.md`.

## Concept

**Chvíle.** One day told as one road. The page starts with the couple in sunglasses (hero drawing `couple-cool`, chosen by the couple on 24 Oct 2026), the road leaves the hero as a dashed line, connects every moment of the programme, and later carries guests on to a bed for the night. Black ink drawings on white, coloured by soft hand-tinted fills, with whole sections in the colours of the palette „Májová záhrada“.

Tone: minimal, professional, cheerful. Warm Slovak, *vy* form, short sentences.

## Visual grammar (do / don't)

| Do | Don't (rejected in review) |
| --- | --- |
| Black #111111 for text, controls and line drawings on white or ivory | Dark olive ink |
| Colour as a flat full-width section (ivory, apricot, sage, peony) | Offset coloured copies, hard or soft shadows |
| White or ivory drawings on coloured sections, oversized and cropped by the section edge | Borders on buttons, cards, photos or swatches |
| „Riso tint“: two soft organic colour blobs under a black drawing | Coloured discs behind landmarks; die-cut stickers |
| Flowers from the same pack as small accents | Stars or sparkles as decoration |
| Palette shown as named dabs with what each colour stands for | Hex codes shown to guests |
| Flat pill buttons; hover inverts to black | Text on the triptych's centre panel |
| Text links: 2px underline, a second one draws in from the left on hover (`.link`) | Underlines that change thickness or colour without moving |

## Tokens

Three layers. Components reference semantic or component tokens, never primitives directly. Source: `wedding-site/src/styles/tokens.css`.

### Primitive colour

| Token | Value | Name in the palette |
| --- | --- | --- |
| `--white` | #FFFFFF | Biela |
| `--ivory` | #F6F2EA | Teplá slonovina |
| `--sage` | #93A17F | Šalviová |
| `--peony` | #D8A0A6 | Pivonková |
| `--apricot` | #D98962 | Marhuľová |
| `--butter` | #E4C765 | Masložltá |
| `--linen` | #C7B69A | Prírodný ľan |
| `--blue` | #7C9CBC | Holubia modrá (palette section only; replaces Slonovina there). Derived to match sage: OKLCH lightness 0.68, chroma 0.06 |
| `--olive` | #46513D | Tmavá oliva (reserved; not used as ink) |
| `--black` | #111111 | Ink |
| `--black-soft` | #4A4A4A | Secondary ink |

### Semantic

| Token | Maps to | Use |
| --- | --- | --- |
| `--ground` | white | Page background |
| `--ink` | black | Text, drawings, primary button |
| `--ink-soft` | black-soft | Secondary text on white and ivory only |
| `--surface-quiet` | ivory | Quiet bands, FAQ rows, triptych sides |
| `--accent-underline` | apricot | Nav current-section underline |
| `--selection` | butter | Text selection |

Contrast: black on every palette colour passes AA for body text (lowest is black on sage, 6.9:1). White text is never set on palette colours. `--ink-soft` is used only on white and ivory (on sage or apricot it falls to 3.2:1).

### Component

| Token | Value |
| --- | --- |
| `--btn-h` | 52px (42px in the nav) |
| `--btn-radius` | 999px |
| `--card-radius` | 20px |
| `--photo-radius` | 18px |
| `--route-width` | 2.5px, dash 7 / 9 |
| `--nav-h` | 68px |

### Type

Fraunces (variable, opsz, weight 600 for display, 300 italic for the ampersand) and DM Sans (400–600). Both SIL OFL, self-hosted through `next/font`, subsets latin and latin-ext (Slovak glyphs verified: ľ š č ť ž ý á í é ä ô ň ď ĺ ŕ).

| Role | Family | Size (fluid) | Notes |
| --- | --- | --- | --- |
| Names (hero) | Fraunces 600 | 3rem → 11rem (capped at 14.5svh so the hero fits one screen) | `&` italic 300 |
| Section title h2 | Fraunces 600 | 2.4rem → 5rem | line-height .96, tracking −.025em |
| RSVP title | Fraunces 600 | 3rem → 7.5rem | |
| h3 | Fraunces 600 | 1.4rem → 2rem | |
| Date | Fraunces 500 | 1.5rem → 2.8rem | tabular figures |
| Lead | DM Sans 400 | 1.1rem → 1.35rem | max 46ch |
| Body | DM Sans 400 | 17px | line-height 1.5 |
| Small | DM Sans | 14–15px | captions, places |

### Space and layout

Gutter `clamp(16px, 4vw, 64px)`, content width 1200px, section padding `clamp(64px, 9vw, 140px)`. Breakpoints: 900px (triptych, palette, FAQ and stay stack), 760px (nav collapses, programme becomes single column), 520px (dense palette). No horizontal scroll at 320px.

### Motion

Language: drawings **stamp**, riso colour **settles** into register, the road **draws** with scroll, text **rises**. On interaction drawings **nudge**, colour **slips** off register, underlines **draw** from the left, and a choice **nods** once. The full inventory, mechanics, rules and the checklist for new components live in `MOTION.md`; the reasoning behind phases A–D is in `planning/MOTION-PROPOSAL.md`.

| Token | Value |
| --- | --- |
| `--ease-out` | cubic-bezier(.22, 1, .36, 1) |
| `--ease-stamp` | cubic-bezier(.2, .9, .3, 1.08) (stamps, pin drops, pops, nods) |
| `--ease-settle` | cubic-bezier(.3, .7, .2, 1) (riso fills) |
| `--t-press` / `--t-hover` / `--t-sweep` / `--t-nudge` | 140 / 180 / 260 / 450ms |
| `--t-reveal` / `--t-stamp` / `--t-settle` | 700 / 600 / 700ms (phones 550 / 550 / 600) |
| `--rv-y` / `--rv-x` | 22px (phones 12px) / 16px |
| `--press` / `--press-card` / `--press-small` | 0.97 / 0.985 / 0.94 |

- Every hidden state sits under `html.mo` (JavaScript, no `?static`, no reduced motion), so no JavaScript, reduced motion and `?static` show everything in place; reduced motion makes every remaining transition snap.
- Hover only on devices that hover (`@media (hover: hover)`); every tappable control presses; focus is instant.
- One hero moment per section; at most one idle loop per viewport; no parallax on text; overshoot only on drawings, pins and checks.

## Components

| Component | Spec |
| --- | --- |
| Tint | Wrapper around a black drawing with `--c` (large blob) and `--c2` (small blob). Mirrored variant for even programme rows. |
| Button | Pill, no border. Variants: solid (ink), tint (`--c`, default ivory). Hover (mouse): ink background, white text. Press: scale 0.97; on touch the press also inverts. Focus: 3px ink outline, 3px offset. |
| Nav | Sticky, white at 92% with blur. Mark „B & M“, five anchors, peony pill to RSVP. Under 760px a Menu button opens a panel; Escape closes it. Current section gets the apricot underline. |
| Programme | `<ol>` of events from `content/events.ts`. Desktop: landmarks alternate left and right of the centre with text opposite; the dashed road is an SVG path through landmark centres. Phone: landmark left, text right. Unknown time renders „Čas upresníme“. |
| Milestone | Where the hero's road leaves the first screen: the dashed road passes a large Fraunces number of days left („217 dní do svadby“; „Dnes“ on the day; „Svoji“ after), the save-the-date drawing tinted peony and butter, and a butter „Pridať do kalendára“ disclosure with Google and .ics links. No JavaScript: the date instead of the number. |
| Places | Triptych: ivory, apricot (couple-kiss only), ivory. Oversized coloured drawings cropped by the panel. Map button only when a verified URL exists. |
| Map („Z Hlinného do Zlatníka“) | Butter field, edge-to-edge drawn map oriented from real coordinates (Zlatník north-west of Hlinné, the Topľa east of Hlinné), not to scale. White road band with the dashed centre line of the programme road; sage river and pond; church, barn and lantern as black drawings with the white sticker edge, each a link. The wedding car drives the road with scroll (halfway when the map is centred), parked halfway without JavaScript or with reduced motion. Legend of three stops with addresses and navigation links below. |
| Palette | Six dabs with organic radii, name and meaning, three per row. Dove blue stands in for ivory here only. Each colour has its own figure that tries it on: suits for sage (walking groom), linen (dancing groom) and dove blue (groom portrait with a buttonhole); dresses for peony (bride with bouquet), apricot (bride raising a champagne glass) and butter (standing bride). The figure takes the colour under the mouse on desktop, or the last one tapped. The figure sticks beside the dabs on desktop and sits between text and dabs on phones. |
| Photos | Ivory band, three rounded photos, middle one dropped; camera drawing by the title. |
| Stay | Sage band, white lantern, stops on a dashed road, last stop is the morning (coffee). |
| FAQ | Native `<details>`, ivory rows, open row takes butter, peony or sage. |
| RSVP CTA | Peony band, „Prídete?“, white envelope cropped, white rose corner on desktop. |
| Closing | Sage band, white garland, names in Fraunces, date, links. |
| RSVP page | Separate route `/rsvp`, the last stop of the road. Cover: italic kicker „Posledná zastávka na ceste“, „Prídete?“, tinted envelope with a rose spray; the cover's dashed road runs straight down into the form. Form: numbered stops on the road (black pin, sage once answered, peony end stop at the button): name → yes/no picture cards (champagne on sage, bouquet on peony, round check) → guests −/+ stepper with a required name for every guest after the respondent (respondent shown as place 1, „vy“; names come back if the count goes up again) → diet chips over free text → message (`#sprava`). „No“ hides the guest and diet stops and the numbers close up. Ivory invitation card beside it (date, Sobáš, Oslava, Odpoveď), sticky on desktop, after the form on phones. Errors focus the first wrong field and clear once answered. Thank-you: the road ends at a drawing (dance for yes with calendar buttons and links, bouquet for no). Never reports success unless the server confirms delivery. Every „Potvrdiť účasť“ (hero, nav, menu, CTA band, footer) links to `/rsvp`. |
| Admin `/admin` | Operate mode on the same tokens: no illustrations, no motion. Sticky white bar, four flat stat tiles (sage, butter, peony, ivory), search, filter pills (active = ink), table that becomes ivory cards under 820px, attendance badges in sage and peony, text-link row actions, butter „Pre kuchyňu“ panel. Row dividers use `--rule` (linen mixed with white). |

## Illustration

One family: the whimsical pack (`doodles/whimsical/`). Outlines are filled paths, so colour is set on the root `<svg>` with a `fill` attribute; stroke-drawing is impossible. Curated set and colours: `wedding-site/art-manifest.json`. Licence record for the pack is still pending.

## Writing

Slovak only. Unknown facts are written as natural Slovak placeholders („Čas upresníme“, „Adresu doplníme“), never invented. Placeholders live in content data as `null` so they are easy to find.
