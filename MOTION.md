# MOTION.md — Svadba 29. 05. 2027

How the site moves, and the rules for anything added later. This is the living reference: `DESIGN.md` keeps the tokens and points here, and `planning/MOTION-PROPOSAL.md` keeps the reasoning behind phases A–D. Change a decision here first, then in code, and update the inventory below in the same change.

Code: `wedding-site/src/styles/motion.css` (entrances, scroll, loops, keyframed responses), hover and press styles beside each component in `components.css`, `sections.css` and `rsvp.css`, tokens in `tokens.css`, and the scripts named in [Mechanics](#mechanics).

## 1. Language

The page is black ink on paper, coloured by soft risograph fills and tied together by one dashed road. Motion comes from those three things and nothing else.

| Verb | What it looks like | Used for |
| --- | --- | --- |
| **Stamp** | A drawing lands: opacity 0 → 1, scale 1.04 → 1, rotate −2° → 0, with a hair of overshoot | Every black or white drawing entering |
| **Settle** | The riso colour starts 6px off register at 0.92 scale and slides into place 120ms after its ink | Every `Tint`, the palette garment |
| **Draw** | The road grows along its direction of travel with scroll, and what sits on the road appears only once the road reaches it | Hero → milestone → programme → map → stay → RSVP form |
| **Rise** | Text and buttons come up 22px (phones 12px) while fading in; where the layout has a side, they slide 16px from that side | All text |

Interaction adds four smaller verbs built from the same materials:

| Verb | What it looks like | Used for |
| --- | --- | --- |
| **Nudge** | On hover a drawing, card or pin moves a little: lift ≤ 8px, tilt ≤ 4°, scale ≤ 1.06, over 450ms | Programme discs, map landmarks, photos, stay cards and pins, places drawings |
| **Slip** | On hover the riso colour slips off register under the ink: the large blob turns −4° and grows 4%, the small one shifts 3px | Every `Tint`, and the tile that holds one |
| **Underline draws** | A 2px underline draws in from the left, like the road | Nav links, every text link (`.link`) |
| **Nod** | Something chosen answers once: a drawing nods, a check pops, a dab squashes | RSVP yes/no cards, chips, palette dabs |

## 2. Tokens

Source: `wedding-site/src/styles/tokens.css`. Use these, never raw values, for anything that has a token.

| Token | Value | Use |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(.22, 1, .36, 1)` | Default for everything that moves |
| `--ease-stamp` | `cubic-bezier(.2, .9, .3, 1.08)` | Stamps, pin drops, pops, nods (4% overshoot at most) |
| `--ease-settle` | `cubic-bezier(.3, .7, .2, 1)` | Riso fills sliding into register |
| `--t-press` | 140ms | Press down and release |
| `--t-hover` | 180ms | Colour changes on hover and state |
| `--t-sweep` | 260ms | Underlines drawing in |
| `--t-nudge` | 450ms | Hover motion on drawings, cards and pins |
| `--t-reveal` | 700ms (phones 550ms) | Text rise |
| `--t-stamp` | 600ms (phones 550ms) | Drawing stamp |
| `--t-settle` | 700ms (phones 600ms) | Colour settle |
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
| 550–900ms | Entrances: rise, stamp, settle, hero beats (800), places push-in and envelope (900), count-up (900) |
| Scroll-linked | Every road draw, the car, the desktop drift. No duration; they follow the scrollbar |
| Loops | Hero road march (1.6s per step), hero breathing (7s), lantern sway (4.5s), palette cycle (4s per colour), playlist logo while hovered (2.4s), send button road while sending (0.8s) |

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
| `.rv--settle` | Ink stamps, colour settles 120ms later. `Tint` adds this itself; pass `reveal={false}` where a section runs its own sequence (hero, RSVP cover, RSVP tiles) |
| `.rv--draw` | Grows down from its top |
| `.rv--fade` | Opacity only |

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

### Property lanes

Each kind of motion owns its own CSS properties, so they never overwrite each other. Keep to the lanes.

| Lane | Properties | Who uses it |
| --- | --- | --- |
| Entrances and one-shot responses | `opacity`, `translate`, `scale`, `rotate` | `.rv*`, `stamp`, `settle`, `rise`, `nod`, `hop`, `pop`, `drop`, `squash` keyframes |
| Hover and press | `transform`, colours | Every `:hover` and `:active` |
| Scroll drift | `--px` (registered with `@property`) composed into `transform`, or `translate` on an element with no entrance | Places drawings, RSVP envelope, hero drawings |
| Wipes | `clip-path`, `background-size`, `stroke-dashoffset`, `mask` | Road draws, palette pour, link underlines, map roads |
| Open and close | `height` with `interpolate-size`, `display` with `allow-discrete` | FAQ, calendar, RSVP fold, phone menu |

An element whose `transform` is part of its layout (the mirrored hero bloom, the centred places drawing) keeps that in the same `transform` declaration as its hover value.

## 4. Inventory

Everything that moves today. Update this table when you add or change motion.

### Entrances and scroll

| Where | What happens |
| --- | --- |
| Hero | Names and date rise; the couple stamps (120ms) and the blooms (200, 320ms) with their colour settling 120ms behind; place, intro and buttons rise (420–540ms); the road draws down (700ms), then marches until the first scroll; after that the hero colour breathes (scale 1.03, 7s). Desktop: as the hero leaves, the couple lags 32px and the blooms lead (−20, −48px) |
| Milestone | The road above and below draws with scroll; the number counts up from n − 24 over 900ms; „Dnes“ and „Svoji“ stamp instead |
| Programme | The road's drawn end sits at 70% of the viewport; each row reveals as it crosses that line: landmark stamps, text slides in from its side (90ms), playlist card from the other (180ms); phones from the right |
| Places | Panels 120ms apart; text rises; each cropped drawing is pushed in from the edge that crops it (48px, centre 56px from below, 900ms). Desktop: drawings drift ±20px with scroll |
| Map | Labels fade; church, barn and lanterns stamp in order; pins drop; north and scale last (750ms). The road draws just ahead of the car; the Vranov road draws in the second half; at the barn the pin pulses once and the barn lifts once. Legend items reveal 90ms apart |
| Palette | Dabs reveal 60ms apart; a new colour pours into the garment from the top (520ms); auto-cycle every 4s until touched |
| Photos | The camera stamps; the cards land like prints dropped on a table (from 1.04, 6px higher, 3° more tilt, 700ms stamp easing), the dropped middle one last |
| Stay | The dashed road draws with scroll; each pin drops as the road reaches it and its card slides in from the right; the coffee stamps; the lantern sways (±2°, 4.5s) |
| FAQ | Rows reveal 50ms apart |
| RSVP band | The envelope slides in from its cropped corner while turning, the rose fades in after it; desktop: the envelope drifts ±24px |
| Footer | The garland stamps; thanks, names, date and links rise in one chain (80ms apart) |
| RSVP page | Cover text rises; envelope and rose stamp with colour settling; the road draws down into the form. Thank-you: the last road segment draws, the peony pin drops, the drawing stamps, the words rise (about 1.3s) |
| Page change | Home ↔ `/rsvp` crossfades in 240ms |

### Interaction

| Element | Hover (mouse only) | Press, choose or open |
| --- | --- | --- |
| Buttons (`.btn`) | Invert to ink | Scale 0.97; on touch the press also inverts, so nothing stays inverted after a tap |
| Nav monogram „B & M“ | The ampersand tilts −12° and turns apricot | — |
| Nav links | Apricot underline draws in; one shared underline slides to the current section (260ms) | Phone menu slides open (220ms, links 30ms apart) and closes (160ms); menu links dim while pressed |
| Text links (`.link`) | A second underline draws over the first from the left in `--sweep` (apricot; white on the map, butter in the footer) | Same underline while pressed or focused |
| `Tint` drawings | The colour slips off register | — |
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
3. **Loops have a budget.** Idle loops are the hero march (until the first scroll), the hero breathing (after it), the palette cycle (until touched) and the lantern. Never two in one viewport. A loop a guest starts and can see the end of (playlist logo while hovered, send road while sending) does not count against the budget. Adding a loop means removing or gating one.
4. **No parallax on text.** Drift only on oversized cropped drawings, desktop only (≥ 900px), ±24px at most.
5. **Overshoot only on drawings, pins and checks**, through `--ease-stamp` (4% at most). Never on text or buttons.
6. **Lanes and cheap properties.** Animate only what the lanes table lists. Layout properties (`height`, `margin`) animate only in the open/close lane. No `transition: all`.
7. **No shadows, no sparkles, no blur.** Motion never adds a visual the static design rejects.
8. **Every hidden state sits under `html.mo:not(.land) … :not(.in)`.** Then no JavaScript, reduced motion, `?static` and hash landings show everything in place, with no extra rules.
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

1. **Entrance.** Start with `.rv` on each block. Order inside a block with `--d`; reveal a block as one with `data-rv-group`; reveal a list item by item with `data-rv-stagger`. Drawings use `Tint` (stamps and settles by itself) or `Drawing` with `rv rv--stamp`.
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
