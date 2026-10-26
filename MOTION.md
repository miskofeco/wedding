# MOTION.md — Svadba 29. 05. 2027

How the site moves, and the rules for anything added later. This is the living reference: `DESIGN.md` keeps the tokens and points here, and `planning/MOTION-PROPOSAL.md` keeps the reasoning behind phases A–D. Change a decision here first, then in code, and update the inventory below in the same change.

Code: `wedding-site/src/styles/motion.css` (entrances, scroll, loops, keyframed responses), hover and press styles beside each component in `components.css`, `sections.css` and `rsvp.css`, tokens in `tokens.css`, and the scripts named in [Mechanics](#mechanics).

## 1. Language

The page is black ink on paper, coloured by soft risograph fills and tied together by one dashed road. Motion comes from those three things and nothing else.

**„Pozvánka sa kreslí“** (the coming-soon page's own words): the invitation is drawn in front of the guest as they read it. Every entrance is one of the hand's tools at work: the pen inks the drawings and the words, the paint drops, the brush paints, the print develops. Nothing slides in from nowhere.

| Verb | What it looks like | Used for |
| --- | --- | --- |
| **Ink** | The line drawing comes first, on its own: a soft nib edge sweeps from its top left to its bottom right while the line settles from 1.025 scale (950ms, phones 850ms). The oversized cropped drawings are inked from the edge that crops them, bottom up; map landmarks are drawn in from their top left corner | Every black or white drawing, the map landmarks, the palette figure |
| **Drop** | Then each colour lands under the ink as a drop of paint: it falls in small and round (from 30%, 18px higher), hits the paper and splashes 15% wider than its shape, surface tension pulls it back, it wobbles once and rests in its own blob outline (720ms, phones 660ms). It lands wet, deeper and richer, and dries to the riso tone (1.6s). The large drop once a third of the ink is down (`--p1`), the small one 140ms later (`--p2`); the palette swatches drop one after another along their stagger, and the palette figure's colour pours in only after its ink | Every `Tint`, the palette dabs and figure |
| **Write** | Text is inked in the direction of reading: one soft edge runs along it, line after line, the brush's mask turned to the line. The text is never split, so it keeps its kerning and ligatures and reads as text the whole time; each letter comes up over about a sixth of the sweep. Three lengths, each a base plus a little per letter: titles 360–620ms (headings, names, captions), lines 280–460ms (dates, times, kickers, the hero's place line, the places' details), prose 420–820ms (paragraphs, with a narrower edge). The edge always runs several times faster than a guest reads. The ampersand in the names comes last, as the flourish (480ms). FAQ answers are inked again each time a row opens | All text that is read on the guest pages |
| **Brush** | A card, pill or button is painted in left to right behind a soft edge, rising 6px (640ms) | Hero and band buttons, „when“ pills, places map buttons, playlist card, stay cards, FAQ rows, calendar on „Pripravujeme“, footer links |
| **Develop** | A photo, once it has landed, comes up from pale and flat to its full colour like an instant print (2.6s) | The three Instax prints |
| **Draw** | The road grows along its direction of travel with scroll, and what sits on the road appears only once the road reaches it | Hero → milestone → programme → map → stay → RSVP form |
| **Rise** | Blocks come up 22px (phones 12px) while fading in; where the layout has a side, they slide 16px from that side | Wrappers around written text, the programme and stay cards' side slide |
| **Stamp** | A small thing lands: opacity 0 → 1, scale 1.04 → 1, rotate −2° → 0, with a hair of overshoot | Map landmarks and pins, „Dnes“ / „Svoji“, checks |

Interaction adds four smaller verbs built from the same materials:

| Verb | What it looks like | Used for |
| --- | --- | --- |
| **Nudge** | On hover a drawing, card or pin moves a little: lift ≤ 8px, tilt ≤ 4°, scale ≤ 1.06, over 450ms | Programme discs, map landmarks, photos, stay cards and pins, places drawings |
| **Slip** | On hover the riso colour slips off register under the ink: the large blob turns −4° and grows 4%, the small one shifts 3px | Every `Tint`, and the tile that holds one |
| **Drift** | As the mouse moves, the colour plates of every drawing on screen drift up to 6px off register, away from the pointer, the two plates in opposite directions; the ink stays | Every `Tint` (mouse only) |
| **Brush** | On hover the ink is brushed across a button from the left | Every tinted `.btn` |
| **Underline draws** | A 2px underline draws in from the left, like the road | Nav links, every text link (`.link`) |
| **Nod** | Something chosen answers once: a drawing nods, a check pops, a dab squashes | RSVP yes/no cards, chips, palette dabs |

## 2. Tokens

Source: `wedding-site/src/styles/tokens.css`. Use these, never raw values, for anything that has a token.

| Token | Value | Use |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(.22, 1, .36, 1)` | Default for everything that moves |
| `--ease-stamp` | `cubic-bezier(.2, .9, .3, 1.08)` | Stamps, pin drops, pops, nods (4% overshoot at most) |
| `--ease-settle` | `cubic-bezier(.3, .7, .2, 1)` | Prints developing |
| `--t-press` | 140ms | Press down and release |
| `--t-hover` | 180ms | Colour changes on hover and state |
| `--t-sweep` | 260ms | Underlines drawing in |
| `--t-nudge` | 450ms | Hover motion on drawings, cards and pins |
| `--t-reveal` | 700ms (phones 550ms) | Text rise |
| `--t-stamp` | 600ms (phones 550ms) | Drawing stamp |
| `--t-ink` | 950ms (phones 850ms) | A drawing inked in |
| `--t-drop` | 720ms (phones 660ms) | A colour drop falls, splashes and rests |
| `--t-dry` | 1600ms | The drop dries from wet to its riso tone |
| `--ease-ink` | `cubic-bezier(.45, .05, .25, 1)` | Ink: unhurried start, steady line, gentle stop |
| `--ease-write` | `cubic-bezier(.25, .4, .3, 1)` | Text inked: moving from the first letter, easing onto the last |
| `--rv-y` / `--rv-x` | 22px (phones 12px) / 16px | Rise and side-slide distance |
| `--press` | 0.97 | Buttons and pills while pressed |
| `--press-card` | 0.985 | Cards, tiles, FAQ rows while pressed |
| `--press-small` | 0.94 | Round and small controls while pressed (stepper) |

One-shot keyframed responses have their duration written in place, because each is used once. Their values are listed in [Durations](#durations).

### Durations

| Range | What |
| --- | --- |
| 140–260ms | Press (140), colour hover (180), crossfade between pages (240), check pop (240), underline draw and nav bar slide (260) |
| 300–520ms | FAQ and calendar open and close (300), FAQ answer rise (360), pop (360), squash (360), notice rise and dot drop (420), nudge (450), nod and hop (520), palette pour (520) |
| 280–820ms | Text written: lines 280–460, titles 360–620, prose 420–820 |
| 550–900ms | Entrances: rise, stamp, brush (640), drop (720), places push-in and envelope (900), count-up (900) |
| 900–1600ms | Ink (950), places ink from the edge (1100), a drop drying (1600) |
| Over 2s, once | The hero sequence (about 2.6s; names and date down by 1.2s), the „Pripravujeme“ sequence (about 3.6s before the car parks; text down by 2.4s), the footer signature (about 2.6s), develop (2.6s) |
| Scroll-linked | Every road draw, the car, the desktop drift. No duration; they follow the scrollbar |
| Loops | Hero road march (1.6s per step), „Pripravujeme“ road march (1.2s per step), hero breathing (7s), lantern sway (4.5s), palette cycle (4s per colour), playlist logo while hovered (2.4s), send button road while sending (0.8s) |

Feedback is under 300ms; arrivals take 500–900ms; nothing a guest waits on is slower than that.

## 3. Mechanics

### Gating classes on `<html>`

Set by the boot script in `app/layout.tsx` before first paint.

| Class | Meaning |
| --- | --- |
| `js` | JavaScript runs. Transitions for reveals are declared under it |
| `mo` | Motion allowed: JavaScript, no `?static`, no `prefers-reduced-motion: reduce`. **Every hidden "from" state, loop, scroll-linked animation and keyframed response lives under `html.mo`** |
| `land` | The page opened somewhere other than the top (a `#hash`, a reload, back/forward). Removed by `RevealObserver` once it has shown what is already on screen without animation |
| `static` | `?static` in the URL (screenshots, print) |
| `scrolled` | The guest has scrolled once (stops the hero road's march, starts the breathing) |

If the app has not hydrated within 3 seconds, the boot script removes `js`, `mo` and `land`, so a failed load shows everything in place.

### Reveals (`RevealObserver.tsx`)

Add `.rv` and the observer adds `.in` once, when the element scrolls into view.

| Class | Entrance |
| --- | --- |
| `.rv` | Rise |
| `.rv--left` / `.rv--right` | Slide in from that side |
| `.rv--stamp` | Stamp (a drawing) |
| `.rv--settle` | The drawing is inked, then its colour drops land one by one. `Tint` adds this itself; pass `reveal={false}` where a section runs its own sequence (hero, RSVP cover, RSVP tiles) |
| `.rv--draw` | Grows down from its top |
| `.rv--fade` | Opacity only |
| `.rv--ink` | Ink (a `Drawing` that is not a `Tint`) |
| `.rv--write` | Holds a `<Write>`: the element itself stays put, its text is written |
| `.rv--brush` | Brush (a card, pill, button or row) |

| Attribute or property | Effect |
| --- | --- |
| `style={{ "--d": "120ms" }}` | The element's own delay, for order inside a group |
| `data-rv-group` | The element and every `.rv` inside it reveal together; their `--d` set the order |
| `data-rv-stagger="60"` | On a list: items entering in the same frame get `--g` 0, 60, 120ms… added to their `--d` |
| `data-rv-margin`, `data-rv-threshold` | Observer options for this element (default `0px 0px -10% 0px`, 0.15) |
| `data-rv-done` | Set 2s after a reveal; it zeroes the delays so hovers answer at once |
| `data-rv-instant` | Set when shown without animation (a landing); `whenRevealed(el, cb)` passes it on as `instant` |

`whenRevealed(el, (instant) => …)` runs code once an element is revealed (the count-up uses it).

### Other moving parts

| Piece | Where | What it does |
| --- | --- | --- |
| `AnchorScroll` | `components/AnchorScroll.tsx` | Same-page `#links` scroll with one eased curve, 500–1100ms by distance, cancelled by any wheel, touch, key or mouse input; focuses the target on arrival. There is no native smooth scroll |
| `MapCar` | `components/MapCar.tsx` | The car follows the road with scroll through a lerp (0.12) and a bob that grows with speed; it draws the road through a mask just ahead of itself; arrival at the barn adds `.arrived` once. Convention: road `#id`, mask `#id-mask`, reveal path `#id-reveal` |
| `Countdown` | `components/Countdown.tsx` | Counts up from n − 24 over 900ms once revealed; keeps `rv` on every render branch so `.in` survives |
| `PaletteStory` | `components/PaletteStory.tsx` | Auto-cycles colours every 4s while on screen until the first hover, tap, click or focus |
| `Nav` | `components/Nav.tsx` | Positions the sliding underline (`--bar-x`, `--bar-y`, `--bar-w`) under the current section |
| `<ViewTransition>` | `app/(site)/layout.tsx` | Home ↔ `/rsvp` crossfade, 240ms; the nav stays outside it |
| `Write` | `components/Write.tsx` | Renders the text as one plain inline run with its start (`--t`) and length (`--wd`). `mode` is `title` (default: headings, names, captions), `line` (dates, times, kickers, short facts) or `prose` (paragraphs); the length comes from the mode and the number of letters, the same on server and browser. `start` with `writeTime()` chains one text after another. The mask is laid over the inline box, which is sliced across its lines (CSS `box-decoration-break: slice`, the default), so a paragraph is inked line after line. `Names` writes „Barbora & Michal“ with the ampersand last. `--w0` on an ancestor delays a line. Without motion the text sits in place |
| `Registration` | `components/Registration.tsx` | Mouse only, under `html.mo`: sets `--rx` / `--ry` on each `Tint` on screen from the pointer's distance (6px at most, full at 420px); the plates' `transform` transition smooths it |

### Property lanes

Each kind of motion owns its own CSS properties, so they never overwrite each other. Keep to the lanes.

| Lane | Properties | Who uses it |
| --- | --- | --- |
| Entrances and one-shot responses | `opacity`, `translate`, `scale`, `rotate` | `.rv*`, `stamp`, `rise`, `nod`, `hop`, `pop`, `drop`, `squash` keyframes |
| Hover and press | `transform`, colours | Every `:hover` and `:active` |
| Scroll drift | `--px` (registered with `@property`) composed into `transform`, or `translate` on an element with no entrance | Places drawings, RSVP envelope, hero drawings |
| Wipes | `clip-path`, `background-size`, `stroke-dashoffset`, `mask` | Road draws, palette pour, link underlines, map roads, button brush |
| Hand-made keyframes | `mask-*` (ink, brush), `scale` as a multiple of `--s`, `translate`, `border-radius` and `filter` (splash, dry), `mask` (write), `clip-path`, `rotate` and `scale` (the ampersand's flourish), `filter` (develop) | Ink, drop, write, brush, develop |
| Open and close | `height` with `interpolate-size`, `display` with `allow-discrete` | FAQ, calendar, RSVP fold, phone menu |

An element whose `transform` is part of its layout (the mirrored hero bloom, the centred places drawing) keeps that in the same `transform` declaration as its hover value.

## 4. Inventory

Everything that moves today. Update this table when you add or change motion.

### Entrances and scroll

| Where | What happens |
| --- | --- |
| Hero | The invitation is drawn: the couple is inked (0ms), then their peony drop lands (about 330ms) and their butter one after it; the names are written from 150ms, the second as the first is nearly down, the ampersand last with its flourish; the date is written from 900ms as the flourish turns; the blooms are inked either side (450, 650ms), each drop after its ink; the place line is written fact by fact from 1050ms and the intro from 1600ms; the buttons are brushed in (1850, 1950ms); the road draws down (2150ms), then marches until the first scroll; after that the hero colour breathes (scale 1.03, 7s). Desktop: as the hero leaves, the couple lags 32px and the blooms lead (−20, −48px) |
| Milestone | The road above and below draws with scroll; the number counts up from n − 24 over 900ms; „Dnes“ and „Svoji“ stamp instead |
| Programme | Title written, lead written (420ms), the rose sprig inked (450ms). The road's drawn end sits at 70% of the viewport; each row reveals as it crosses that line: the landmark is inked, then its two drops land one by one; the text slides in from its side (90ms) while its title is written, then its time, place and description are written as the title is nearly down (place +180ms, description +380ms); the playlist card is brushed in from the other side (600ms); phones from the right |
| Places | Panels 120ms apart; titles written, then name, address and time written line by line (from 620ms, 300ms apart); the map button and town pill brushed in (1450ms); each cropped drawing is pushed in from the edge that crops it (48px, centre 56px from below, 900ms) and inked bottom up as it comes (1100ms). Desktop: drawings drift ±20px with scroll |
| Requests | Title written, lead written (350ms), sprig inked (450ms). Each request reveals as one, 110ms after the previous: the drawing is inked, its drops land one by one, the „when“ pill is brushed in (500ms), the title written (650ms), the text written (1050ms). Hover on a request slips the colour under its drawing |
| Map | Title written, lead written (480ms); legend titles written. Labels fade; church, barn and lanterns are drawn in from their top left corner, in order; pins drop; north and scale last (750ms). The road draws just ahead of the car; the Vranov road draws in the second half; at the barn the pin pulses once and the barn lifts once. Legend items reveal 90ms apart |
| Palette | Title written, lead (400ms) and hint (1050ms) written; the figure is inked and only then its colour poured in; each swatch lands as a drop of paint, one after another along the stagger; a new colour pours into the garment from the top (520ms); auto-cycle every 4s until touched |
| Photos | Title written, lead written (450ms), sprig (500ms) and camera inked; the cards land like prints dropped on a table (from 1.04, 6px higher, 3° more tilt, 700ms stamp easing), the dropped middle one last; then each print develops (2.6s) and its caption is written under it |
| Stay | The lantern is inked, the title written (400ms), the lead written (850ms). The dashed road draws with scroll; each pin drops as the road reaches it and its card is brushed in from the right while its name is written; the coffee is inked and „Ráno bez ponáhľania.“ written; the lantern sways (±2°, 4.5s) |
| FAQ | Title written, lead written (400ms), sprig inked (450ms), the button brushed in (900ms); rows are brushed in 50ms apart; an opened answer is written, every time it opens |
| RSVP band | The envelope slides in from its cropped corner while turning and is inked as it comes, the rose is inked after it; „Prídete?“ is written (350ms), the lead written (600ms), the button brushed in (1350ms); desktop: the envelope drifts ±24px |
| Footer | The invitation is signed: the garland is inked, „Tešíme sa na vás.“ written (300ms), the names signed (from 700ms, the ampersand last), the date line written under them (1550ms), the links brushed in (2000ms) |
| RSVP page | Cover: the kicker is written (80ms), „Prídete?“ (400ms), the lead (650ms), the deadline pill brushed in (1250ms); the envelope is inked, then its drops land one by one, then the rose the same way (900ms); the road draws down into the form (1450ms). Thank-you: the last road segment draws, the peony pin drops, the drawing is inked and its drops land, the words rise (about 1.3s) |
| Page change | Home ↔ `/rsvp` crossfades in 240ms |
| Pripravujeme | The page does what its kicker says: the couple is inked, then its drops land one by one; „Pozvánka sa ešte kreslí“ is written (from 150ms); the names (450ms), the date (1150ms), the places (1350ms) and the sentence (1700ms) are written after it; the blooms are inked and their drops land (500, 700ms); the calendar is brushed in (2100ms). The road draws in from the right edge (2000ms, 800ms long), the car drives in after it from the right (2250ms, 1300ms) and brakes with a nod onto its front wheel (−2.5°, 520ms); then the road marches under the parked car, the page's one loop. Hovering the car hops it. Time-based, because the page doesn't scroll |

### Interaction

| Element | Hover (mouse only) | Press, choose or open |
| --- | --- | --- |
| Buttons (`.btn`) | The ink is brushed across from the left (260ms) and the label turns white; the solid ink button deepens | Scale 0.97; on touch the press also inverts, so nothing stays inverted after a tap |
| Nav monogram „B & M“ | The ampersand tilts −12° and turns apricot | — |
| Nav links | Apricot underline draws in; one shared underline slides to the current section (260ms) | Phone menu slides open (220ms, links 30ms apart) and closes (160ms); menu links dim while pressed |
| Text links (`.link`) | A second underline draws over the first from the left in `--sweep` (apricot; white on the map, butter in the footer) | Same underline while pressed or focused |
| `Tint` drawings | The colour slips off register; on screen, the plates drift with the mouse | — |
| Programme disc | Tilts −3° and grows 3% | — |
| Playlist button | The Spotify logo turns like a record | Button press |
| Places panel | Its drawing lifts 8px (desktop) | — |
| Map landmarks and legend | Hovering a landmark or its legend entry lifts the drawing, draws its dashed outline, grows its pin 1.5× and its legend dot 1.35×; the „Nocľah“ entry lifts both lanterns. Keyboard focus does the same | — |
| Map car | Hops once | — |
| Palette dab | The dab tilts and grows (preview), the name gets a linen underline | The picked dab squashes once; its name keeps the apricot underline; the auto-cycle stops |
| Photos | The print is picked up 6px, straightens, and the photo leans in 3% | — |
| Stay card | Leans 4px along the road, and its pin grows 1.25× | — |
| FAQ row (closed) | Previews the colour it opens in; the plus turns a quarter | Row presses (0.985); opens and closes with height (300ms), and the answer rises 8px |
| Calendar disclosure | Chevron turns | Menu opens and closes with height (300ms) |
| RSVP yes/no cards | Background warms; the drawing's colour slips | Card presses (0.985); the round check pops in; the drawing nods (−8°, 520ms) |
| Stepper −/+ | Inverts to ink | Scale 0.94; a new guest row slides in |
| Diet chips, adult/child pills, choices | Invert or warm | Scale 0.97; on chips and pills the ✓ pops in |
| Info „i“ | Bubble fades in and rises 4px | Same on tap or focus |
| Answered step | — | Its number pops as it turns sage |
| „Nie“ / „Áno“ | — | Guest and diet steps fold away and the road closes up / unfold |
| Send button | Inverts to black | While sending, a dashed road marches under „Odosielam…“ |
| Error after send | — | The notice rises; each error's dot drops in; focus goes to the first wrong field |

`/admin` is operate mode: flat colour hovers and the shared button press only, no entrances.

## 5. Rules

### Every motion

1. **One hero moment per section.** Each section has one thing that moves in an unusual way (the road draws, the car drives, the colour pours, the cards land). Everything else rises.
2. **Scroll-linked for the road and what sits on it; time-based for everything else.** Scroll-linked motion is smoothed (CSS scroll timelines, or a lerp in JavaScript), never mapped 1:1 to scroll ticks. Nothing scrolls the page by itself.
3. **Loops have a budget.** Idle loops are the hero march (until the first scroll), the hero breathing (after it), the palette cycle (until touched), the lantern, and the road under the car on „Pripravujeme“. Never two in one viewport. A loop a guest starts and can see the end of (playlist logo while hovered, send road while sending) does not count against the budget. Adding a loop means removing or gating one.
4. **No parallax on text.** Drift only on oversized cropped drawings, desktop only (≥ 900px), ±24px at most.
5. **Overshoot only on drawings, colour drops, pins and checks**, through `--ease-stamp` (4% at most), or the drop's own splash (15%, then one wobble). Never on text or buttons; the ampersand's flourish turns with `--ease-out`.
6. **Lanes and cheap properties.** Animate only what the lanes table lists. Layout properties (`height`, `margin`) animate only in the open/close lane. No `transition: all`.
7. **No shadows, no sparkles, no blur.** Motion never adds a visual the static design rejects.
8. **Every hidden state sits under `html.mo:not(.land) … :not(.in)`.** Then no JavaScript, reduced motion, `?static` and hash landings show everything in place, with no extra rules. The hand-made verbs (ink, drop, write, brush, develop) are keyframes with fill `backwards` that start on `.in` and skip `[data-rv-instant]`: they hide their element only until their turn and leave no clip, mask or filter behind.
8a. **Text is written live, in the direction of reading, and stays text.** All text that is read (headings, leads, paragraphs, dates, times, captions) goes through `<Write>`, with its host marked `rv--write` so it never also rises. Never split text into letters or words for motion: it breaks kerning and ligatures, doubles the markup for screen readers and makes the guest wait letter by letter. One writer at a time in a block: chain texts with `start` and `writeTime()` (the next one starts as the previous one is nearly down, at about 70%), and give the next block a `--d` that does the same. Buttons, pills and links are not written; they are brushed in.
8b. **An illustration is drawn piece by piece.** Its line drawing is inked first; each colour lands afterwards as its own drop, one at a time. Never let ink and colour arrive as one.
8c. **Text never keeps a guest waiting.** A heading is written in at most 620ms, a paragraph in at most 820ms, and the edge always runs ahead of the eye. A first screen is readable (names, date) within about 1.2s and complete within 3s.
9. **Tokens first.** Durations and easings come from tokens; a one-shot keyframe may write its duration in place and must be added to [Durations](#durations).
10. **Phones are lighter, not different.** Distances halve and durations shorten through tokens; no drift; everything else is the same.

### Interaction

11. **Hover previews, press confirms, focus is instant.** Hover shows what will happen (colour preview, lift, underline); press answers within 140ms; the focus ring appears at once and is never animated.
12. **Hover lives in `@media (hover: hover)`.** On touch screens `:hover` sticks after a tap, so hover styles never apply there. Touch gets `:active` instead; buttons invert on press under `@media (hover: none)`.
13. **Every tappable control presses.** Use `--press` (buttons, pills), `--press-card` (cards, tiles, rows) or `--press-small` (round and small controls). Disabled controls never press.
14. **Hover limits.** Drawings lift ≤ 8px, tilt ≤ 4° (the monogram's ampersand is the one exception at 12°), scale ≤ 1.06; cards move ≤ 4–6px; text never moves on hover, only its underline.
15. **No delay on response.** Hover and press transitions have no `transition-delay`. Reveal delays are cleared by `data-rv-done`; an element that is not `.rv` but carries `--d` (map stamps and drops) must keep its hover in the `transform` lane, whose transition has no delay.
16. **What hover reveals, focus reveals.** If hover shows information (the map's outline and legend link-up, the info bubble), `:focus-visible` or `:focus-within` shows the same.
17. **Choosing answers once.** A selection gets one short keyframed response (nod, pop, squash) under `html.mo`; it never loops.
18. **Waiting shows progress.** Anything a guest waits on (the RSVP submit) changes its label and shows a moving road while pending.

### Reduced motion and fallbacks

19. **One catch-all.** Under `prefers-reduced-motion: reduce`, `motion.css` sets every transition and animation to 0s. State changes still happen, instantly. Do not add per-component reduced-motion lists.
20. **Progressive features degrade to "in place".** No scroll timelines (Firefox, older Safari): roads are whole and drift is off. No `::details-content` (older Safari): FAQ rows and the calendar open instantly. No `@starting-style`: the menu and the RSVP fold snap. Never write a fallback that hides content.
21. **`overflow: clip`, not `hidden`,** on sections that contain a scroll timeline or a sticky element: `hidden` makes a scroll container and breaks both.

## 6. Adding or changing a component

1. **Entrance.** Start with `.rv` on each block. A heading takes `rv rv--write` around `<Write text=… />`, a date or short fact the same with `mode="line"`, a paragraph with `mode="prose"`; a card, pill or button wrapper `rv rv--brush`; a drawing `rv rv--ink` (or use `Tint`, which inks it and drops its colour by itself). Order inside a block with `--d`; reveal a block as one with `data-rv-group`; reveal a list item by item with `data-rv-stagger`. Drawings use `Tint` (inks and drops its colour by itself) or `Drawing` with `rv rv--stamp`.
2. **Is it the section's hero moment?** If the section already has one, stop at step 1.
3. **Hidden state.** Write any new "from" state as `html.mo:not(.land) .thing:not(.in) { … }` and its transition under `html.js`, using the entrance lane.
4. **Hover.** Inside `@media (hover: hover)`, on `transform` or colour, within the hover limits, with `--t-nudge` (motion) or `--t-hover` (colour) and no delay.
5. **Press.** Add `:active { transform: scale(var(--press…)) }` and include `transform var(--t-press) var(--ease-out)` in the transition.
6. **Focus.** Check the global focus ring is visible; mirror any informative hover onto `:focus-visible`.
7. **Text links** get `className="link"`; set `--sweep` on the section if apricot is weak on its background.
8. **One-shot responses and loops** go in the Interaction section of `motion.css`, under `html.mo`. Check the loop budget.
9. **Scroll-linked work** goes under `@supports (animation-timeline: view())`, desktop-only drift under `@media (min-width: 900px)`.
10. **Update this file:** the inventory row, any new token or duration.
11. **Test** (below).

## 7. Testing

Run these before calling motion work done:

| Check | How | Expect |
| --- | --- | --- |
| Desktop entrances and scroll | Scroll the home page top to bottom at 1440 × 900 | Every block reveals once, in order, nothing pops |
| Phone | 390 × 844 with touch emulation | Shorter distances, no drift, palette cycles, taps leave nothing tilted or inverted |
| Reduced motion | Emulate `prefers-reduced-motion: reduce` | Everything in place, no running animations, hover and state changes snap |
| `?static` | Open `/?static` | Everything in place, car parked halfway, roads whole |
| Hash landing | Open `/#otazky`, reload mid-page, go back and forward | What is on screen shows at once; the rest still animates |
| Hover and press | Hover and press every control in the interaction table | Answers within 140ms (press) or 180–450ms (hover), with no delay after reveals |
| Keyboard | Tab through the page | Focus ring at once; map landmarks and legend link up on focus |
| RSVP | Empty send, yes/no, chips, a full send against the sheet mock | Notice rises, dots drop, nod and pops run once, road marches while sending, thank-you sequence plays |
| Real devices | A mid-range Android phone and Safari on iPhone and Mac | No stutter on stamps (watch the sticker filter), drift and the RSVP fold behave |

Headless checks so far were one-off scripts driving Chrome through the DevTools Protocol (not kept in the repo): wheel scrolling for scroll-linked work, `Input.dispatchMouseEvent` for hover and press, `Emulation.setTouchEmulationEnabled` for phones (it also makes `(hover: hover)` false), `CSS.forcePseudoState` to check `:active` on touch, and `document.getAnimations()` to see what runs. Screenshot clips are in document coordinates, so add `scrollY`. A hidden browser pane throttles `requestAnimationFrame` and IntersectionObserver, so test motion headless or with the pane visible.

**Still open:** a pass on a real phone and in Safari has not been done yet.
