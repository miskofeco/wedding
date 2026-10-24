# Motion proposal — Svadba 29. 05. 2027

Status: phases A–D built 24 Oct 2026 (see DESIGN.md, Motion). Deviations: the palette cycle stops on hover, tap, click or focus but not on page scrolling; the hero breathing runs only after the march has stopped; the route crossfade needs no `next.config.ts` flag (React 19.3 `<ViewTransition>`). Built rows are recorded in `DESIGN.md` (Motion), `wedding-site/src/styles/motion.css` and the components named below.

## 1. What the page does today (audit)

The site already has a motion foundation: `html.js` gating, a `.rv` reveal class driven by one IntersectionObserver, a staggered hero rise, a scroll-drawn programme road (`animation-timeline: view()`), the car on the map, hover transforms on tints, discs and dabs, and full `prefers-reduced-motion` and `?static` handling. That foundation is sound and should stay. What follows is what each section does now and how it reads.

| Section | Today | How it reads |
| --- | --- | --- |
| Nav | Per-link apricot underline scales from the left; menu panel toggles `hidden` instantly | Fine on desktop. The phone menu snaps open with no transition, the one place the page feels unfinished. |
| Hero | Every child rises 24 px over 800 ms, 60–80 ms stagger; blooms fade; road is static | Pleasant but generic: drawings, names and buttons all do the same thing. The road, the page's main idea, does nothing. |
| Milestone | Whole stone rises as one block; calendar menu fades open | The big number is the strongest element on the screen and it just appears. |
| Programme | Road draws with scroll (ends at 70 % of the viewport); each event rises as a block; disc tilts on hover | Good bones. Text and landmark rise together, so the alternating left/right layout is not used by the motion. The disc can appear before the road reaches it (reveal threshold and road end are not aligned). |
| Places (triptych) | Three panels rise with 0/120/240 ms delay | The oversized cropped drawings, the best part of the section, move exactly like the text. |
| Journey (map) | Car drives the road 1:1 with scroll; landmarks lift on hover; the whole figure reveals as one block | The car is a great idea but feels rigid: it jumps with every scroll tick and stops dead. The map's road, river and labels all appear at once. |
| Palette | Figures crossfade 450 ms; dab tilts on hover/pick; figure sticks on desktop | The interaction is lovely. Nothing happens until the mouse arrives, so phones (no hover) see one figure unless they tap. |
| Stay | Copy and the whole stop list rise as two blocks; card nudges on hover | The dashed road and pins, which continue the page's road, are static. |
| FAQ | `details` opens instantly; background colour fades; the plus rotates | The height jump is the harshest motion on the page. |
| RSVP band | Title, lead and button rise with stagger; envelope static | Solid. The envelope could carry the section. |
| Photos | Each instax card rises with 120 ms stagger; straightens and zooms on hover | Good. Cards could land the way photos land on a table. |
| Closing | No reveal at all | Reads flat after a page full of motion. |
| RSVP page | Cover rises like the hero; pins turn sage via colour transition; guest rows animate in; conditional steps toggle `display` instantly; success screen appears instantly | The form's road and numbered stops are a strong idea; the moments that matter (a stop answered, the final answer) are silent. |

Three mechanical issues also surfaced:

1. **Hash landings flash.** Arriving on `/#farby` (links from the RSVP page and the footer) paints hidden `.rv` blocks until hydration, then everything in view animates at once.
2. **Block-level reveals.** `.faq__list`, `.stops`, `.journey__map` and `.milestone__stone` each reveal as a single block, so long lists pop in whole.
3. **Native smooth scroll is uncontrolled.** `scroll-behavior: smooth` gives Chrome a fast scroll and Safari a slow one, with no easing of our own. For „Pozrieť program“ (hero to programme, one screen) this is acceptable; for footer links that travel the whole page it is not.

## 2. The motion language

The visual grammar is black ink on paper, coloured by soft risograph fills, tied together by one dashed road. The motion should come from the same three things and nothing else.

**Three verbs**

| Verb | What it is | Where |
| --- | --- | --- |
| **Stamp** | A drawing lands on the paper: scale 1.04 → 1, rotate −2° → 0, opacity 0 → 1, 600 ms with a hair of overshoot. The whimsical SVGs are filled paths, so they cannot „draw“ themselves; stamping is the honest equivalent for printed line art. | Every black drawing: hero couple and blooms, save-the-date, programme landmarks, map landmarks, camera, envelope, closing garland. |
| **Settle** | The riso colour under a drawing starts 6 px off-register and 0.92 scale and slides into place 120 ms after the ink lands, 700 ms. Riso prints are always slightly misregistered; the page shows the registration happening. | Every `.tint` (hero, milestone, programme, RSVP cover) and the palette garment fills. |
| **Draw** | The road grows along its direction of travel, linked to scroll, never to a timer. Things on the road (pins, landmarks, the car) only appear once the road has reached them. | Hero road → milestone road → programme route → stay stops → RSVP form road. The map road is a real stroke, so it can draw for real. |

Text never stamps or settles. Text **rises** (the current 22 px / 700 ms reveal) and, where the layout has a direction, slides in from that side (16 px). Buttons rise with their text.

**Rules**

- One hero moment per section. Each section gets exactly one thing that moves in an unusual way (the road draws, the car drives, the colour pours, the cards land). Everything else is a plain rise.
- Scroll-linked for the road and what sits on it; time-based for everything else. Scroll-linked motion must be smoothed (CSS scroll timelines, or a lerp in JS), never mapped 1:1 to scroll ticks.
- At most three idle (looping) motions on the whole page, never two in one viewport: the hero road march until the first scroll, the palette auto-cycle until the first interaction, the lantern sway. Nothing else loops.
- No parallax on text. Gentle parallax on oversized cropped drawings only, desktop only (≥ 900 px), ±24 px at most.
- No bounce on text or buttons. Overshoot (max 4 %) only on stamps and pin drops.
- Only `transform`, `opacity`, `clip-path`, `mask` and colours animate. No width/height animation except the FAQ, which uses the native `::details-content` height transition.
- Reduced motion and `?static`: every element in its final place, car parked, no loops, FAQ opens instantly. Phones under 760 px: reveal distances halve (12 px) and durations drop to 550 ms; no parallax.

**New tokens** (add to `tokens.css`, document in `DESIGN.md`)

| Token | Value | Use |
| --- | --- | --- |
| `--ease-stamp` | `cubic-bezier(0.2, 0.9, 0.3, 1.08)` | stamps, pin drops |
| `--ease-settle` | `cubic-bezier(0.3, 0.7, 0.2, 1)` | riso fills sliding into register |
| `--t-stamp` | 600 ms | |
| `--t-settle` | 700 ms | |
| `--t-draw` | n/a (scroll-linked) | |
| `--rv-y` | 22 px desktop, 12 px phone | rise distance |
| `--rv-x` | 16 px | directional slide |

**Reveal classes** replace the single `.rv`: `.rv` (rise, default), `.rv--left`, `.rv--right`, `.rv--stamp`, `.rv--settle` (applied by `Tint` automatically), `.rv--draw` (scaleY from the top). All keep `--d` for stagger and the same observer. The observer gains two things: a `data-rv-threshold` override for tall elements (map, triptych) and an „already in view on first observation“ path that adds `.in` without a transition, which fixes the hash-landing flash.

## 3. Section by section

Priority: **P1** = the page feels unfinished without it; **P2** = the boost the brief asks for; **P3** = polish once P1–P2 are in.

### Nav (P1)

- Phone menu panel opens with opacity + translate −8 px → 0 over 220 ms; links stagger 30 ms. Closing reverses in 160 ms. Implementation: `@starting-style` plus `transition-behavior: allow-discrete` on `display`, so `hidden` keeps working without JavaScript; no JS timers.
- Desktop current-section underline becomes a single sliding underline (one element positioned under the active link, moved with a transform transition, 260 ms). Hover keeps the per-link scaleX so hover and current do not fight. P2.
- Nav CTA: no change. The peony pill is already the loudest element in the bar.

### Hero (P1)

A four-beat opening, 1.4 s total, instead of nine equal rises:

1. **0 ms** — names and date rise (as today, 800 ms). Ink first: the page is about two people.
2. **120 ms** — the couple stamps; **240 ms** — its peony and butter tints settle under it. **200 / 320 ms** — left and right blooms stamp, their tints settle 120 ms later. The blooms keep their mirror/rotate transforms, so the stamp is applied to the inner `img` + pseudo-elements, not the wrapper.
3. **420 ms** — where, intro and the two buttons rise with a 60 ms stagger (as today).
4. **700 ms** — the road draws downward (`scaleY` 0 → 1 from the top, 600 ms, `--ease-out`). Then the dashes **march** slowly downward (`background-position` 16 px per 1.6 s, linear, infinite) as the page's only scroll cue. The march stops on the first scroll (a `scrolled` class on `html`, set once by the observer component) and is never shown with reduced motion.

Scroll: the couple drifts up 32 px slower than the text (`animation-timeline: scroll()` over the hero's exit), blooms at −20 px and −48 px for depth. Desktop only. P2.

Idle: the hero tints breathe (scale 1 → 1.03, 7 s, alternate, ease-in-out). This is the quietest possible life in the first screen and is cheap. P3; drop it if it fights the march.

### Milestone (P1)

- The road entering and leaving the stone (`::before` / `::after`) draws with scroll, continuing the hero road, so from the hero to the first landmark there is one unbroken draw.
- **Count-up.** The number rolls from `n − 24` to `n` over 900 ms when the stone enters (tabular figures keep the width stable). Runs once per page view; „Dnes“ and „Svoji“ stamp instead. Implementation inside `Countdown` with `requestAnimationFrame`; the server number is the end value so there is no layout shift without JavaScript.
- Save-the-date drawing stamps, its tint settles.
- Calendar disclosure: keep the open animation; add the toggle chevron easing already present. No close animation (native `details`).

### Programme (P1)

- **Align the road and the landmarks.** The road's drawn end sits at 70 % of the viewport, so landmarks should reveal when their centre crosses roughly that line: observe `.ev` with `rootMargin: 0 0 -30% 0`, threshold 0. The disc then stamps exactly as the road reaches it.
- **Directional reveal.** Odd events: text slides in from the left (`.rv--left`), landmark stamps; even events: text from the right. The playlist card follows its side. On phones everything comes from the right (text) with the disc stamping first. Landmark at 0 ms, text at 90 ms, playlist card at 180 ms.
- Tints settle under each landmark (automatic via `Tint`).
- Hover: keep the disc tilt. Add nothing.

### Places, triptych (P2)

- Panels no longer rise as blocks. The panel backgrounds are static (colour is the section); inside each panel the text rises, and the oversized drawing **slides in from the edge that crops it** (church and barn from the bottom-right, 48 px; the kissing couple from the bottom, 56 px), 900 ms `--ease-out`, 120 ms after the text. The crop makes the drawing look like it was pushed into frame.
- Scroll parallax on the three drawings (±20 px over the section's pass), desktop only.
- Hover on a panel lifts its drawing 8 px (400 ms). Buttons unchanged.

### Journey, the map (P2, the page's set piece)

- **The road draws for real.** The map road is a stroked SVG path, so it can be drawn: a solid white mask stroke over the dashed road, `pathLength="1"`, `stroke-dashoffset` from 1 → 0, driven by the same scroll progress the car uses. The road draws just ahead of the car; the Vranov road draws after it (it is where the hotel is, so it draws in the second half).
- **Landmarks stamp in order.** River and town labels fade first (0 ms), church stamps (150 ms), barn (300 ms), lantern marks (450 / 600 ms), north arrow and scale last. One stagger chain when the figure enters, independent of scroll.
- **Smooth the car.** The car's target position still comes from scroll, but the drawn position follows it with a lerp (≈ 0.12 per frame, running only while the gap is above 0.001). Scroll jitter disappears and the car coasts to a stop. Keep smoothstep on the scroll → progress mapping. Add a 1 px vertical bob proportional to speed so it reads as driving on a dirt road, not sliding.
- **Arrival.** When progress reaches 1 the barn pin pulses once (a ring scales 1 → 2.2 and fades, 700 ms), and the barn drawing does its hover lift once. Runs once per page view.
- The stops list below the map keeps the plain rise.

### Palette (P2)

- **Pour.** When a colour is picked or previewed, the garment fill is revealed from the top down (`clip-path: inset(0 0 100% 0)` → `inset(0)`, 520 ms, `--ease-out`) on the incoming figure while the figure itself crossfades as today. The colour pours into the dress or suit. The dab that was picked does one quick squash (scale 1.06 → 0.98 → 1.06, 360 ms).
- **Auto-cycle until touched.** With no interaction, the figure moves to the next colour every 4 s (pour included), starting when the section enters the viewport and stopping forever on the first hover, tap, focus or scroll inside the section. This is what makes phones see all six figures. Off with reduced motion. The caption updates with it; `aria-live` stays off so the cycle does not chatter.
- Dabs reveal with a 60 ms stagger (six separate `.rv`, not one list).

### Stay (P2)

- The dashed road down the stops **draws with scroll** (`.rv--draw` on the `::before`, `animation-timeline: view()`), and each **pin drops** (scale 0 → 1, `--ease-stamp`, 420 ms) when the road reaches it, with its card sliding in from the right 90 ms later. The morning stop (white pin, coffee) comes last.
- **Lantern sway**: rotate −2° ↔ 2° around its top, 4.5 s, ease-in-out, infinite. The only loop in the lower half of the page. The coffee drawing stamps.

### FAQ (P1)

- Animated open/close: `interpolate-size: allow-keywords` on the list, `::details-content` transitions `height` 0 → auto and opacity over 300 ms, `transition-behavior: allow-discrete` on `content-visibility`. Browsers without it open instantly (today's behaviour), no JS fallback needed. The background colour and plus rotation stay.
- Rows reveal individually with a 50 ms stagger; the button in the head rises last.

### RSVP band (P2)

- The envelope slides in from its cropped corner (48 px from the bottom-right) while rotating −14° → −8°, 900 ms, the moment the band enters. The white rose corner fades 200 ms later.
- Scroll parallax on the envelope (−24 px), desktop only.
- Title, lead and button keep their rise.

### Photos (P2)

- Cards **land** instead of rising: each starts at scale 1.04, 6 px higher and 3° further rotated than its resting tilt, and lands over 700 ms with `--ease-stamp`, 140 ms stagger, middle card last (it is the dropped one). The camera stamps with the heading.
- Hover unchanged (straighten and zoom).

### Closing (P3)

- Garland stamps; thanks, names, date and links rise with 80 ms stagger. One `.rv` chain, nothing more. The footer should feel like the last page of a book, not a finale.

### RSVP page (P2)

- **Stop answered.** When a pin turns sage it also pops (scale 1 → 1.12 → 1, 360 ms, `--ease-stamp`). Colour transition stays.
- **Conditional steps.** When „Nie“ hides the guest and diet stops, they fold away (opacity + translate −8 px, 220 ms) and the road below closes up with a height transition; when „Áno“ brings them back they unfold. `@starting-style` + `allow-discrete` on `display`, same technique as the menu.
- **Yes/No tiles.** The chosen tile's background colour transition stays; the check mark scales in (0.6 → 1, 240 ms).
- **Ending.** On the thank-you screen the final road segment draws down (400 ms), the peony pin drops (at 400 ms), the drawing stamps (at 650 ms), the heading and links rise (from 800 ms). About 1.3 s in total, run once. The heading still receives focus as it does now, after the sequence starts (focus does not wait).
- **Route change.** Home → `/rsvp` and back: a 240 ms crossfade of `main` with the nav persisting, using the View Transitions API via Next's `experimental.viewTransition`. P3; if it misbehaves with the sticky nav, skip it. The cover's own rise already masks the route change well enough.

## 4. Scrolling and navigation („autoscroll“)

Nothing on the page should scroll by itself. Auto-scrolling a guest who is reading an invitation is the one motion that would feel wrong here. What „autoscroll“ should mean on this page:

1. **Eased anchor scrolling.** Replace native `scroll-behavior: smooth` for in-page links with one small function: duration = clamp(500 ms, distance × 0.6, 1100 ms), `--ease-out` curve, cancelled by any wheel, touch or key input, and skipped (instant) under reduced motion. Same feel in every browser, and a footer link no longer takes three seconds in Safari. Keep `scroll-padding-top` for the nav. Hash in the URL updates on arrival (`history.replaceState`), not before.
2. **The road is the scroll cue.** The marching hero road replaces any arrow or „scroll“ label.
3. **Scroll-linked, not scroll-jacked.** The road draws, the car drives, the oversized drawings drift, all tied to the guest's own scrolling. No section snapping, no pinned scenes, no scrollytelling that takes over the wheel.
4. **Reveal once.** Everything reveals on its first entry and stays. Scrolling back up never re-hides anything.
5. **Hash landings** show whatever is already in view instantly (the observer fix above), then animate only what comes next.

## 5. Order of work

| Phase | Scope | Files | Size |
| --- | --- | --- | --- |
| A — foundation | tokens, `.rv` variants, observer fixes (threshold override, hash landing, `scrolled` class), eased anchor scroll, menu panel transition, FAQ open/close, individual reveals for lists, closing reveal | `tokens.css`, `motion.css`, `RevealObserver.tsx`, `Nav.tsx`, `Faq.tsx`, `Closing.tsx`, `Stay.tsx`, `base.css` | ½ day |
| B — the road | hero choreography + march + parallax, milestone draw + count-up, programme alignment + directional reveals, map road draw + car lerp + arrival | `motion.css`, `sections.css`, `Hero.tsx`, `Milestone.tsx`, `Countdown.tsx`, `Programme.tsx`, `Journey.tsx`, `MapCar.tsx`, `Tint.tsx` | 1 day |
| C — set pieces | triptych slide-in + parallax, palette pour + auto-cycle, stay draw + pin drops + lantern, photos landing, RSVP band envelope, RSVP page micro-interactions and ending | `sections.css`, `rsvp.css`, `Places.tsx`, `PaletteStory.tsx`, `Stay.tsx`, `Photos.tsx`, `RsvpCta.tsx`, `RsvpForm.tsx` | 1 day |
| D — optional | sliding nav underline, hero breathing tints, route crossfade | `Nav.tsx`, `motion.css`, `next.config.ts` | ½ day |

Each phase ends with the same check: desktop and phone render with `inspect.mjs`, a reduced-motion pass, a `?static` pass, and a scroll through on a mid-range phone for jank. The sticker filter re-rasterises on transform in some browsers; if a stamp stutters, stamp the wrapper and keep the filter on the inner `img` (test this first on the programme landmarks, the biggest filtered drawings).

## 6. What not to add

- No stroke-drawing of the whimsical drawings (filled paths; it would need retracing the pack).
- No scroll snapping, pinned sections or horizontal scroll scenes.
- No shadows or offset copies, even in motion (rejected in v4).
- No bounce or elastic easing on text and buttons.
- No confetti, hearts, petals, sparkles or particle effects.
- No continuous motion in a section with no reason for it (the sway belongs to the lantern because lanterns sway; nothing else on the page hangs).
