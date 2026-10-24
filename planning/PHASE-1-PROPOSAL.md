# Phase 1 — Direction proposal

24 October 2026 · Barbora & Michal · 29. 05. 2027 · Hlinné → Stodola Zlatník

## Revision v7 — flowers, colour story, the road home (same day, evening)

Requests: flowers instead of stars in the hero and subtle floral marks across the page; a more creative, professional palette presentation; an accommodation section with a story.

- **Flowers.** Two rose sprays from the pack (`D_Diagonal Rose Corner Spray`) flank the hero couple, black line on apricot/butter and sage/peony fills, mirrored. A cropped rose sprig (`D_Rose Floral Border`) sits under the programme, photos and FAQ titles as a quiet recurring mark. Large white sprays are cropped into a corner of the RSVP band and the closing. The daisy bouquet sits beside the palette title.
- **Palette as a colour story.** Six organic paint dabs in a staggered row, each with its name and the thing it stands for on the day: šalviová – garden and napkins (from the palette sheet), pivonková – flowers, marhuľová – the church façade in Hlinné (from the photo), masložltá – May sun and meadow flowers, ľan – barn wood and linens, slonovina – invitation paper. Assignments are marked as a proposal to confirm. No codes.
- **Accommodation: „Cesta domov môže počkať“.** The road grammar continues: a dashed route with three stops (flat white cards with distance from the barn) and a final white stop with a coffee drawing and „Ráno bez ponáhľania.“ A white lantern marks the night. No facts invented: entries, distances and contacts remain placeholders.

## Revision v6 — landmarks as black line with hand-tint (same day, evening)

Request: timeline drawings black, coloured the same way as the hero drawing.

Change: the die-cut sticker rendering is switched off (the canvas routine stays in the file, unused). Each landmark is the black drawing on two soft colour fills (a large one behind the body, a small one at the base), mirrored on alternating rows. Pairs: church apricot + butter, car sage + butter, toast butter + peony, dinner peony + sage, dance sage + peony, cake peony + butter, music apricot + sage. This makes hero and programme one visual grammar.

## Revision v5 — die-cut sticker landmarks (superseded)

Request: timeline drawings as stickers without a circle: coloured inside, thick coloured outline, line art in white.

Implementation (prototype, client-side): the pack's drawings are filled paths, so a true sticker is rendered on a canvas at load. For each landmark the renderer loads the black SVG, closes small gaps in the lines, flood-fills the exterior to find the silhouette body (lines plus every enclosed interior), then composes three layers: a thick outline (body dilated ~22 px at 640 px, in the colour darkened to 78 %), the body in the palette colour, and the original line art tinted white. The result replaces the image source; without JavaScript the plain black drawing remains. Colours: church apricot, car linen, toast butter, dinner peony, dance sage, cake apricot, music peony. Landmarks grew to 190–260 px (desktop) and 104 px (phone). The white backing disc is kept only so the road stops before the sticker.

For the Next.js build these stickers should be pre-rendered once (same algorithm in a Node script with `canvas`, or exported PNG/SVG) and shipped as static images, not computed in the browser.

## Revision v4 — flat, hand-tinted (same day, evening)

Guidance received: a blend of v2 and v3; remove every offset "shadow" shape; timeline keeps a sticker feel but on white; drop the sentence in the triptych centre panel; buttons, sections and photos without borders or offset shapes; find another modern, minimal, artistic use of colour; colour in the hero drawing; palette without hex codes.

Changes in `planning/prototype/index.html`:
- **Colour grammar → risograph tint.** Black line drawings sit on loose, soft colour fills (organic blobs) as if hand-tinted: the hero couple on a peony fill with a small butter fill at the feet. No offsets, no outlines.
- **Programme on white.** Each landmark is a black drawing on a full-colour disc with a white ring (sticker on white): apricot, linen, butter, peony, sage, ivory, peony. Road stays a black dashed line.
- **Buttons** are flat pills: black fill for primary, a palette tint (ivory, peony, sage, white) for secondary; hover inverts to black.
- **Cards, FAQ rows, photos** have no borders and no shadows; FAQ rows are ivory and take their colour (butter, peony, sage) when open; photos have rounded corners and a slow scale on hover.
- **Palette** is a cluster of flat overlapping discs in three sizes with names only; no hex codes.
- **Triptych** centre panel is the ivory couple drawing on apricot, image only.

Checks: 1440 and 390 screenshots of hero, programme, places, palette, photos, stay, FAQ; 320 px overflow re-check not repeated (layout unchanged below 760 px except palette). Screenshots refreshed in `planning/prototype/screenshots/`.

## Revision v3 — full-page prototype (same day)

Guidance received: more creative and modern; outlines, with colour acting as a "second outline"; more full-width colour sections; oversized drawings on colour backgrounds cropped by the section; a wedding-palette section; FAQ; where to stay; a CTA to the RSVP page; the hero needs colour and life; animations; minimal and professional but cheerful.

Deliverable: a real single-page prototype at `planning/prototype/index.html` (serve "planning" on 8766 → `/planning/prototype/`; `?static` disables motion for screenshots). Screenshots in `planning/prototype/screenshots/` (`d*` desktop 1440, `m*` phone 390).

Needs analysis → sections (each answers one guest question):
1. Hero: who, when, where, one sentence, two actions (program, RSVP). Road begins under the hero.
2. Chvíle nášho dňa: the day as a road; landmarks are black drawings with a palette-coloured offset copy.
3. Miesta: triptych (ivory · apricot · ivory), oversized drawings cropped at panel edges, map buttons.
4. Farby nášho dňa: the Májová záhrada palette as outlined colour discs, with copy inviting (not requiring) guests to match. Copy to confirm.
5. Naše chvíle doteraz: three photos with a coloured offset "second outline".
6. Kde prespať: sage full-width section, oversized white keys drawing, three outlined cards (placeholders).
7. Časté otázky: outlined accordions with alternating offset colours (answers placeholders).
8. Prídete?: peony full-width CTA with oversized white envelope, button to `rsvp.html` (page not built; fields and destination to confirm).
9. Closing on sage with the names at full width.

Visual grammar v3: black #111 ink; the "second outline" = a palette-coloured copy of a drawing, button, card or photo offset 8 px down-right behind the black-outlined original; full-width colour sections (ivory, apricot, sage, peony) with white or ivory drawings cropped by `overflow:hidden`; hero gets colour through the peony offset copy and butter/apricot sparkles; Fraunces 600 for display, DM Sans for text.

Motion v3: hero entrance (staggered rise, 800 ms, ease-out), reveals in reading order via IntersectionObserver (once), route drawn with a scroll-driven animation where supported, hover lift on buttons/cards/discs/accordions (180 ms), offset copies drift on hover; everything disabled under `prefers-reduced-motion` and complete without JavaScript.

Checks run: 1440 and 390 screenshots of every section; 320 px horizontal-overflow check (see result in the chat log); mobile menu, sticky nav with scroll offset and current-section underline implemented. Not run: contrast tooling, Lighthouse, keyboard walk-through, real device.

## Revision v2 (same day, after Barbora & Michal's notes)

Guidance received: black text and drawings instead of dark olive; more palette colour on backgrounds with white drawings on them; a centred, minimal hero that starts the story; names Barbora & Michal; and "more design style" in the manner of the Love Doodles references (flat two-tone panels, bold headings in the panel's ink, one big drawing per panel, sticker-style coloured figures with a die-cut outline).

What changed on the board (`planning/direction-board/index.html`; v1 kept as `v1.html`):

| Layer | v1 | v2 |
| --- | --- | --- |
| Ink | dark olive #46513D | black #111111 for all text, controls, road and drawings on white |
| Ground | white 85–90 %, one ivory field | white ~70 %; sections become flat panels: programme on ivory, places as a triptych (ivory · apricot · ivory), photos on ivory, closing on sage |
| Drawings | olive, one treatment | three treatments by panel: black on white, ivory/white on a colour panel, palette-coloured sticker drawing with white die-cut outline on ivory |
| Hero | split, drawing on ivory field | centred and minimal: couple drawing, "Barbora & Michal", date, places line, one sentence, one button, the dashed road starting underneath |
| Programme | sage route bed + dashed line, olive landmarks | black dashed road; landmarks are the drawings themselves in apricot, sage, peony and black with a sticker outline |
| Places | two-column list | triptych in the reference grammar: "Sobáš v Hlinnom" (apricot church) · apricot panel with an ivory couple drawing and the line "Z kostola do záhrady. Jedna cesta, jeden deň." · "Oslava v Zlatníku" (sage barn) |
| Type | Fraunces 400/500 | Fraunces 600 for names and headings (bolder, poster-like), DM Sans unchanged |
| Contrast | — | black on sage 7.6:1, on apricot 8.2:1, on peony 9.6:1, on butter 12:1, on ivory 17:1; white/ivory drawings on colour panels are decorative |

Alternatives (Alt 1, Alt 2) are retired; v2 is the single direction being shaped. Screenshots `30–35` in the screenshots folder. The browser pane downscales 1440 px captures, so the live board is the accurate reference.

Still open before Phase 2 can lock: which church in Hlinné and its official name, the venue's official name and address, the real programme and times, RSVP and practical sections, the three photos, the licence record for the whimsical pack.

---

## Original proposal (v1)

Open the live board: start the "planning" preview (`.claude/launch.json`) and visit `http://localhost:8766/planning/direction-board/` (add `?static` to show the full route without the scroll reveal). Screenshots of every inspection are in `planning/direction-board/screenshots/`.

Legend used everywhere: **supplied** = your artwork, recoloured only · **proposal** = my layout, route, type and colour decisions · **placeholder** = facts you must confirm.

---

## 1. Evidence

### Icon families, inspected at 72 px and 200 px on white

| Family | What I saw | Verdict |
| --- | --- | --- |
| `doodles/whimsical/` (203 SVG) | Fine, lively, slightly irregular line; detailed people, buildings, florals, stationery. Weak below ~100 px, excellent from 150 px up. SVGs are 1080×1080 Illustrator exports; every outline is a **filled path** with no fill attribute, so recolouring is one attribute on the root and stroke-drawing animation is not possible. | **Selected.** The only family that covers church, barn, toast, dinner, dance, cake, music, car, camera and florals in one hand. |
| `doodles/hand-drawn-wedding-icons/` Regular/Outline (115 SVG) | Bold marker line, compact, uniform; 64×64 viewBox, `fill="#1d1d1b"`. Reads strongly at 72 px, reads as clip art at 200 px. Has a church, no barn. | Not used. It would need to be the only family and it fights a light serif. |
| `doodles/outline-doodles/` (two bundles) | Cartoon couples with solid black areas, open decorative frames and flowers; Inkscape mm units. Charming, different humour, no church, barn or cake. | Not used. Mixing it in for one topic would break the single language. |

Screenshots: `01–09` in the screenshots folder; the board's section 3 shows the same subjects side by side live.

### Photos (all nine verified, orientation correct)

| File | Content | Use |
| --- | --- | --- |
| `IMG_4884.JPG` | Couple selfie, autumn light, both smiling | Primary personal photo |
| `IMG_9388.HEIC` | Couple selfie in a formal flower garden (parterre, arcaded building) | Strong fit with the garden theme |
| `IMG_0376.heic` | Detail: two pairs of shoes on a bench, engagement ring visible | Quiet, invitation-like detail shot |
| `IMG_5022.HEIC` | Dressed-up mirror selfie at an event | Optional, playful |
| `IMG_0163.HEIC` | Couple selfie on a hike by a transmitter | Optional |
| `IMG_9394.JPG` | Snowboarding at night | Personality shot, off-theme |
| `IMG_0949.heic`, `IMG_4853.JPG`, `IMG_9046.JPG` | Individual portraits | Not needed |

Observed, not inferred: in five of nine photos you both wear sunglasses. The pack has `G_sunglasses.svg`; it is the one drawing that is about you.

### Church photo
`hlinne-kostol.jpg`: cream/ochre walls, apricot trim, dark red-brown spire, pointed arches. The palette's Marhuľová (#D98962) is nearly the trim colour, which is why apricot is reserved for "church" in the system. Slovak Wikipedia lists three churches in Hlinné (Greek Catholic, Roman Catholic Sacred Heart 1939–40, Evangelical); the photo's style is consistent with the Roman Catholic one, but **you must confirm**.

### References
- Six screenshots: one shared grammar — a single ink drawing on a flat ground, big type beside one large drawing, two colours per composition. Taken as principles only; none of the pictured artwork is in the local packs.
- Swan Agency / RoyalWed / Peno Lab references: oversized wordmark, one controlled photo relationship, large editorial labels, a closing wordmark. Agency content (services, stats, tickers) excluded.
- Max & Sophie and Danielle & Christopher (fetched as text; the live sites are blocked in the browser pane by org policy): anchored navigation with 3–5 links, vertically stacked schedule with an illustration per event and date/time/venue lines, information sections (getting there, transport, dress code, dinner, photo sharing, weather, children, gifts), accommodation, a near-empty footer. Useful as a checklist of guest needs; their facts do not transfer.

### Licence status (unchanged, unverified)
No standalone licence terms, receipts or metadata were found in any pack. The hand-drawn pack's `!fonts.rtf` states its template fonts are not included. I am treating all packs as "supplied under the couple's licence, record pending". Before final asset clearance please provide the purchase/licence record for the whimsical pack (web use, modification, credit requirements). Fonts proposed below are SIL Open Font License and avoid that problem.

---

## 2. Recommended concept: „Chvíle“

**Message:** *Chvíle, ktoré sa oplatí zdieľať.* Your own sentence, „Ľúbime chvíle, ktoré môžeme zdieľať spolu,“ is the page's argument: the day is a sequence of moments and every guest is asked to share them.

**Concept statement:** The programme is a walk through the day. One drawn footpath leaves the church in Hlinné and winds into the garden at Zlatník; each moment is a landmark drawing on the path. Everything else on the page is the quiet white room around that walk.

**How the message becomes design**

| Layer | Decision |
| --- | --- |
| Structure | Sections are moments, not template blocks: the invitation, the walk (programme), the two places, our moments so far (photos), what you need to know, see you there. |
| Imagery | Whimsical drawings only, 14 selected, shown large (150–560 px) in dark olive. The route is the only proposal artwork. |
| Colour | White 85–90 %. Olive ink. Sage for the route and small marks. One peony-pink floral per screen. Apricot only where it means the church. |
| Type | Fraunces (opsz 144, SOFT and WONK on) for names and headings; DM Sans for everything read. |
| Motion | The route draws itself as you scroll (signature). Sections enter in reading order. Controls answer in 140–180 ms. Reduced motion: full static route. |
| Print | Same ink, drawings and type on ivory stock: invitation card, a one-column programme card with the path, place cards with one drawing and the sunglasses mark. |

### Two genuinely different alternatives
- **Alt 1 · „Dve miesta, jeden deň“** — the two buildings carry the page: church in its real apricot, barn in sage, every programme item colour-coded to its place. Clearest information design, more graphic, less tender. Same type, ink and drawings, so switching costs little.
- **Alt 2 · „Pozvánka na stole“** — the site behaves like the printed suite laid on an ivory table: invitation card, long programme card with the path, RSVP card, envelope. Most literal print extension; ivory tends to become the ground, which conflicts with white-first unless the cards fill the screen.

---

## 3. Typography

Tested in the browser with real Slovak copy and long names (screenshots `10`, `11`, `15`). All three pairings load from Google Fonts and render Ľ Š Č Ť Ž Ď Ň Ô Ŕ Ĺ correctly.

| Pairing | Finding |
| --- | --- |
| **A · Fraunces + DM Sans (recommended)** | Soft, slightly wonky serif with the same hand-made warmth as the drawings; DM Sans is quiet with tabular figures. Both SIL OFL. |
| B · Instrument Serif + Instrument Sans | Elegant, condensed, cooler; suits a photo-led invitation more than an illustrated one. |
| C · Young Serif + Figtree | Friendly and sturdy; heavy strokes compete with the fine line of the drawings. |

Roles (A): names and closing wordmark Fraunces 400 opsz 144, tracking −0.03em, leading 0.92 · section headings Fraunces 400–500 opsz 72 · event titles Fraunces 500 · times DM Sans 600 tabular · body DM Sans 400 17–19 px / 1.5 · navigation and buttons DM Sans 500 15–16 px · captions DM Sans 14 px soft ink. Five sizes. Fonts to be self-hosted via `next/font` with latin-ext subset.

---

## 4. Proposed section map (one page, anchored navigation)

| # | Section | Anchor | Content | Drawing |
| --- | --- | --- | --- | --- |
| 1 | Pozvánka (hero) | — | Names, 29. 05. 2027, "sobota · kostol v Hlinnom · Stodola Zlatník", one sentence, **Pozrieť program**, secondary **Kde to bude** | couple walking, daisy bouquet (pink), sunglasses |
| 2 | Chvíle nášho dňa | `#program` | The connected programme (ordered list + route) | church, car, toast, table, dance, cake, music |
| 3 | Kde to bude | `#miesta` | Two places, each with name, address, map link, note (parking, arrival) | church (apricot), barn (sage) |
| 4 | Naše chvíle | `#fotky` | Three photos, same ratio, square corners, one line of copy | camera |
| 5 | Dobré vedieť | `#informacie` | Only confirmed items: transport, dress, children, gifts, accommodation, contact | envelope |
| 6 | Tešíme sa na vás | — | Names at full width, date, garland, contact line, anchor links | garland |

A short welcome paragraph is folded into the hero sentence; a separate welcome section is not needed unless you want a longer personal text. RSVP, countdown, album and dietary questions stay out until confirmed.

### Key copy (Slovak, draft)
- Hero: **[Meno] & [Meno]** · **29. 05. 2027** · sobota · kostol v Hlinnom · Stodola Zlatník · "Pozývame vás zdieľať s nami deň, na ktorý sa budeme pamätať celý život. Obrad v kostole v Hlinnom, oslava v záhrade a stodole v Zlatníku."
- Programme intro: "Jedna cesta, jeden deň: z kostola v Hlinnom do záhrady v Zlatníku. Časy doplníme, len čo budú isté."
- Event titles (proposal, order to confirm): Sobáš · Cesta do Zlatníka · Prípitok v záhrade · Večera · Prvý tanec · Torta · Zábava do noci. Each with „Čas upresníme“ until confirmed.
- Closing: "Tešíme sa na vás." + names + date.

---

## 5. Design-system outline (tokens before build)

- **Primitives:** the eight palette colours plus derived `sage-tint #E9EDE3` and `olive-soft #6B7561`; space scale 4/8/12/16/24/32/48/64/96/128/160; radii 0 (media), pill (buttons), 50 % (landmark backing); type steps small 14, body 17–19, lead 20–26, head 32–64, display clamp(3.1rem … 8.2rem); motion `ease-out cubic-bezier(.22,1,.36,1)`, 140 / 180 / 240 / 700 ms.
- **Semantic:** `ground`, `ground-warm`, `ink`, `ink-soft`, `accent`, `accent-tint`, `flower`, `place-church`, `place-barn`; `font-display`, `font-text`; `space-section` 120–200 px; `measure` 62ch; `content` 1200 px, `gutter` clamp(16, 3vw, 48).
- **Component:** button (fill, ghost; hover darker ink, active scale .97, focus 3 px olive ring offset 3), nav link (sage underline grows on hover/focus), landmark (drawing on white disc so the route never crosses the art), event (title/time/place/description), route (bed 18 px tint + 2.5 px dashed sage; recomputed from milestone positions with ResizeObserver), photo (square corners, fixed ratio), place card (two-column, map link as text button).
- **States:** hover, focus-visible, active, current-section in nav, pending time, reduced motion, no-JS (route pre-rendered straight).

---

## 6. Implementation plan (Phase 3, after your choice)

1. `wedding-site/` with `create-next-app` (App Router, TypeScript, no Tailwind; CSS Modules + custom properties from DESIGN.md). Check current Next.js docs for `next/font` and image settings.
2. `content/` typed data: `couple.ts`, `events.ts` (id, title, description, time | pending, place, illustration), `places.ts`, `info.ts`; one `assets/map.ts` to the selected SVGs (copied, namespaced ids, recoloured).
3. Server components for every section; one client component for the route geometry and one for the mobile menu. No scroll-driven React state.
4. Photos: convert the chosen HEIC/JPG to AVIF/WebP at 3 sizes, strip metadata, reserve dimensions.
5. Verify at 1440 / 768 / 390 (+320 overflow), fonts, long names, order, route geometry, anchors with sticky offset, keyboard, reduced motion, no-JS, contrast, 200 % zoom; `tsc`, lint, production build; Lighthouse locally (reported as local, not field).
6. README with setup and Vercel steps. No deploy.

---

## 7. Questions (only unresolved items)

1. **Names and order** for the hero, e.g. "Mária & Michal" vs "Michal & Mária", and the short mark for the nav ("M & M").
2. **Language:** Slovak only, as assumed? Any need for a second language for some guests?
3. **Direction:** „Chvíle“ as recommended, or Alt 1 „Dve miesta“ or Alt 2 „Pozvánka na stole“? Any veto on a drawing (e.g. the vintage car for the transfer)?
4. **Programme:** the actual sequence and known times; which church in Hlinné (there are three), its official name; the venue's official name and address; whether anything runs past midnight.
5. **Guest actions:** is RSVP needed (fields, destination, deadline)? Which practical sections are real: transport/parking, accommodation, gifts, children, dress, dietary? Do you want the photo moment, and which three photos?

---

## Inspection limitations
- Live wedsites.com references were blocked in the browser pane by the organisation's browsing policy; they were read as text via WebFetch, so their visual composition comes from the prior audit plus the text structure.
- Web search for venue facts returned a bot check; only sk.wikipedia.org was readable. No venue facts were inferred.
- Browser-pane screenshots are capped near 800 px wide, so 1440 px captures are downscaled; the live board is the accurate reference.
- The `impeccable` launcher ran via `sh` (not executable directly); no PRODUCT.md existed, so `PRODUCT.md` was written from the brief with assumptions labelled. DESIGN.md is deferred to Phase 2.
- No performance, accessibility or animation audit was run on anything yet; nothing has been built.

## Lock and build (24 Oct 2026)

The couple locked v7. Decisions now live in `DESIGN.md`; the app is `wedding-site/` (Next.js 16.4.3, React 19.3, TypeScript 5.9, ESLint 10). Changes from the prototype:

- Bracketed placeholders became natural Slovak („Čas upresníme“, „Adresu doplníme“, „Mapu doplníme“) driven by `null` fields in `src/content/`. Notes to the couple were removed from the page and listed in `wedding-site/README.md`.
- Grey secondary text is no longer used on sage or peony (3.2:1). It stays on white and ivory only.
- The road reveal now clips the whole SVG with a scroll timeline. A path length of 1 would have turned the dashes solid.
- The hero drawing also scales with viewport height, so both buttons fit a 1440 × 900 screen.
- The RSVP page is built: server validation, delivery to an HTTPS webhook, success only after a 2xx answer, honest „not received“ state when unconfigured.
- Drawings are generated by `npm run art` from the original pack files with exact geometry. Photos come from `npm run photos` with GPS stripped.

Checks run: typecheck, lint, production build; headless renders at 1440, 768, 390 and 320 (no horizontal overflow); RSVP validation, unconfigured, delivered (HTTPS stub, secret header received) and refused paths; keyboard (skip link, focus rings, menu Escape); no-JS (nothing hidden in served HTML, form posts natively); reduced motion. Design-inspector flags not acted on, because they contradict the brief: few raster pictures, the couple's own cream and apricot palette, the italic ampersand, no video.

## Admin and Google Sheet (24 Oct 2026)

The couple asked for an admin page to see and manage answers, plus a Google Sheet. Answers now live in a Sheet behind an Apps Script web app (`wedding-site/google-sheet/`). `/admin` is protected by one password and a signed HttpOnly cookie. It shows totals, a kitchen list, search, filters, add, edit and delete. Tested end to end against `npm run sheet:mock`, which runs the real `Code.gs`. Not tested against a real Google account: the Apps Script redirect and deployment steps are documented but unverified here.
