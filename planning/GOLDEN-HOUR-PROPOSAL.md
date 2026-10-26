# Zlatá hodina v Zlatníku: návrh sekcie

Proposal, 26 Oct 2026. A new section on the guest page about the light on the evening of **Saturday 29 May 2027** at Stodola Zlatník: when the golden hour is, where the sun goes down, and what that means for the guests. Every number below was computed or fetched for this place and date. Nothing is generic.

**Built 26 Oct 2026** (`GoldenHour.tsx`, `SunLive.tsx`, `content/sun.ts` from `npm run sun`). The final numbers live in the generated file and differ slightly from the figures below. The moonrise is 1:36 (USNO), not 1:32. The weather now covers 63 evenings (2016–2025 without 2020), with a 22:00 median of 14.3 °C.

Prototype: `planning/golden-hour/index.html` (serve with launch config „planning“, then open http://localhost:8766/planning/golden-hour/). It is a design reference, not production code.

## 1. What the section has to do

| Who | What they need | How the section answers |
| --- | --- | --- |
| Guests | When is it nice outside, will it be cold, what to bring | One headline fact (sunset 20:26, behind the hill about 20:00), three practical tips |
| The couple and the photographer | When the best light is and where it comes from | The golden window (19:37 to about 20:00), azimuth 296–305°, the glazed west wall |
| Everyone | A reason to stay on the page | One live thing: move through the evening and watch the sun go down over Zlatník |

Mode: Read with one interactive moment. It must be fully readable without JavaScript and without touching the slider.

## 2. Real data

Venue: Stodola Zlatník, Zlatník 28. OSM way 69609630, 48.96848° N, 21.54797° E, 267 m above sea level. Time is CEST (UTC+2).

### Sun, 29 May 2027

| Event | Time | Sun | Azimuth |
| --- | --- | --- | --- |
| Civil dawn | 03:56 | −6° | 47° |
| Sunrise | 04:37 | 0° | 55° (NE) |
| Morning golden hour ends | 05:25 | +6° | 64° |
| Solar noon | 12:31 | 62.6° | 180° |
| **Golden hour starts** | **19:37** | +6° | 296° |
| **Sun goes behind the hill** | **≈ 19:59** | ≈ +3.2° | 300° |
| **Sunset (flat horizon)** | **20:26** | −0.83° | **305° (NW)** |
| Golden hour ends / blue hour | 20:50 | −4° | 310° |
| Civil dusk (lights on) | 21:07 | −6° | 313° |
| Nautical dusk | 22:03 | −12° | 325° |
| Full dark | 23:29 | −18° | 345° |
| Moonrise (30 May) | 01:32 | waning crescent, about 34 % lit | 87° |

Day length 15 h 49 min, three weeks before the longest day of the year.

Sources and checks:
- My own implementation of the NOAA solar position algorithm (with refraction). It matches [sunrise-sunset.org](https://api.sunrise-sunset.org/json?lat=48.96848&lng=21.54797&date=2027-05-29&formatted=0&tzid=Europe/Bratislava) to the minute: 04:36:34, 20:25:49, civil 21:06:24, nautical 22:02:12 and astronomical 23:27:33. Use the API's seconds where they differ; my rounding is up to 2 min.
- The moon comes from a low-precision lunar model, accurate to a few minutes. Check the moonrise against one more source before publishing it.

### The hill: the real local sunset

Zlatník sits in a valley. Copernicus DEM profiles from Open-Meteo, taken towards the evening sun (azimuth 270–330°, 50 m to 26 km out), show ground rising to the west and north-west. It stands 2.4–3.4° above the eye 0.2–1.7 km away. The distant ridges on these bearings (up to 790 m, about 17 km out) stay lower than that near hill.

**The sun drops below the hill at about 19:59, roughly 25 minutes before the official sunset.** The DEM is a 90 m grid (Copernicus GLO-90), and the orchard trees aren't in it, so the estimate is ±10 minutes. It should be checked on site (see section 7).

What follows from it:
- The real golden light at the barn runs from about 19:00 (sun at 12°) to about 20:00. The textbook 19:37–20:50 doesn't apply here.
- From 20:00 to 20:50 the yard is in soft shade while the sky stays bright. That's the best light for portraits.

### The barn and the light

- The building's footprint comes from OSM: the long axis runs at 78°/258° (ENE–WSW). The short gable faces WSW (258°).
- The venue's own site describes a **glazed west wall** and a partly glazed south wall, with the yard, pond and garden on the west side ([stodola-zlatnik.sk](https://www.stodola-zlatnik.sk/)).
- During the golden hour the sun stands at 290–301°, 32–43° off the gable's normal. Light comes in obliquely through the glass and crosses the hall diagonally until about 20:00.
- The north-north-west long wall (348°) also gets direct sun in the evening.

### Evening weather

ERA5 reanalysis from the Open-Meteo archive, taken at the venue's grid cell for the evenings of 26 May to 1 June in 2021–2025 (35 evenings):
- At 20:00 the median is 14.5 °C (10–90 %: 10.7–16.8 °C).
- At 22:00 the median is 13.2 °C (10 %: 9.6 °C).
- At 20:00, 19 of the 35 evenings were mostly clear (cloud cover ≤ 30 %) and 13 were overcast (≥ 90 %).

This sample was read by hand and is a rough first look. The build script will compute the final figures from 30 years of data (section 6).

## 3. The idea

> **Zlatník has gold in its name; on 29 May the gold is in the air.** The sun's real road over Zlatník becomes the same dashed road that runs through the whole page, and it disappears behind the real hill.

This fails the competitor test on purpose. No other venue has this village name, this hill, this glass wall or this date. It also extends the site's concept („Chvíle“: one day told as one road). The programme road ends at night. This section shows the sky above that road.

## 4. Design

The section lives at `#zlata-hodina`, between **Palette** and **Stay**. Palette is about colour, this section is about light, and Stay („Cesta domov môže počkať“) takes over at night, so the page keeps moving through the day. It gets no nav link, like Pár prosieb, which keeps five anchors.

### Composition, desktop

1. **Head.** H2 „Zlatá hodina v Zlatníku“ on the left (two lines, Fraunces 600, h2 size). The lead sits on the right: „Zlatník má zlato už v mene. 29. mája zapadá slnko o **20:26**, no za kopcom nad dedinou sa schová už okolo **20:00**. Polhodina pred tým je najkrajšie svetlo celého dňa.“
2. **The sky.** A full-bleed band, 40vw tall (380–600 px), and the one big thing in the section.
   - **Horizontal axis:** time, 18:30–22:30, linear.
   - **Vertical axis:** sun elevation, −7° to +17°, with quiet „5° 10° 15°“ labels and no grid lines.
   - **Phase fields:** each phase of light is a flat field of the palette, as wide as it lasts. Podvečer is ivory, Zlatá hodina butter, Za kopcom apricot, Západ peony, Modrá hodina dove blue, Súmrak olive (white text). Each field is labelled at its top-left with its time and name.
   - **The land:** sage, with its top edge following the real terrain horizon along the sun's azimuth, so the hill sits about 3° above the line.
   - **The sun's road:** the site's dashed route (2.5 px, dash 7/9). It is ink in the sky and white under the ground, where it keeps sinking and is marked at −4° and −6°.
   - **The sun:** a black line circle over two riso plates, butter and apricot off register, like the hero's tints. It sinks behind the hill at about 20:00 because the hill is drawn over it.
   - **The night field:** the white lantern drawing, and the line „Úplná tma o 23:29. Mesiac vyjde až o 1:32.“
3. **The slider (the live thing).** A native `<input type="range">` (18:30–22:30, 1-minute steps) whose track spans the sky's time axis exactly. The thumb sits under the sun, and the track is the dashed road. Beneath it, the hours 19:00, 20:00, 21:00 and 22:00 line up with the fields.
4. **Readout row,** live (`aria-live="polite"`). It shows the time in Fraunces at about 7 rem, then the phase name and one sentence, then three figures: sun height, direction (compass point and degrees) and „Váš tieň“. The shadow of a 1.7 m person is 8 m at 19:00, 16 m at 19:37 and 19 m at 19:45, then „žiadny“ once the sun is behind the hill. A shadow is something a guest can picture, unlike degrees.
5. **„Odkiaľ bude svietiť“.** Two columns.
   - **Left:** a north-up compass on an ivory disc. It shows the real barn footprint in ink with the glazed west gable in butter, and the day's arc from sunrise at 55° to sunset at 305° as a dashed road. The golden sector (296–305°) is thick butter and apricot. The sun sits at the current azimuth, and butter rays fall on the glass wall while it's above the hill. The compass follows the slider.
   - **Right:** an h3 and one paragraph, then three tips, each with a tinted drawing from the existing set:
     - **„Okuliare sa zídu“** (couple-cool, the hero's couple in sunglasses): podvečer bude slnko nízko a v očiach.
     - **„Fotky medzi 19:30 a 20:00“** (camera): long warm shadows, then soft light.
     - **„Sveter do auta“** (lantern): about 13 °C at ten o'clock.
6. **Sources line** in small text: the method, the coordinates, the DEM ±10 min, ERA5 years, © OpenStreetMap contributors (required by the ODbL).

### Phones (390 px)

- The sky is 300 px tall and full-bleed. The labels inside it are hidden.
- The slider follows it with hour ticks, then the readout: time and phase on one row, the three figures beneath.
- A **list of moments** carries the timeline. It holds six rows (colour dab, time, one sentence). On desktop the same list is visually hidden but stays for screen readers, because the sky itself is `aria-hidden`.
- The compass sits full width with the copy and tips under it.

### Motion (MOTION.md language)

- **Scroll-linked sunset.** The sun moves along its road as the section scrolls through the viewport, from 19:00 at entry to 21:00 when the section leaves, the way the car drives the map. Once a guest touches the slider, scroll hands control to them for the rest of the visit.
- **Without JavaScript, or with reduced motion,** the sun is parked at 19:45, which is the most useful moment.
- The fields **settle** (riso) as the section enters. The lantern **stamps** at 21:07. Text **rises**.
- **On the wedding day,** if the guest opens the page on 29 May 2027 between 18:30 and 22:30, the slider starts at the current time and the readout says „Práve teraz“. No other idle animation.

### Accessibility and honesty

- Every colour carries a label, so the information never depends on colour alone. Black text on butter, apricot, peony and blue passes AA (as on the rest of the site); white on olive is about 9:1.
- The slider has `aria-valuetext` („19:45, zlatá hodina“) and works with arrow keys, Page Up/Down and Home/End.
- The compass has a text alternative that states the key directions.
- Every estimate is marked as one („okolo“, „odhad z terénu“), and no programme times are invented. If the couple confirms the toast or dinner time, the programme moments can be pinned onto the sky (section 7).

## 5. Why this design and not another

- **A 24-hour sun diagram or a polar sun chart.** Guests can't read them, and the morning is irrelevant to a wedding.
- **A gradient sky.** It's banned by DESIGN.md. Flat fields are also more honest, because each phase has a defined start.
- **Cards or a stat row („20:26 | 305° | 15 h 49 min“).** They're forgettable and don't explain anything.
- **What this design does instead:** it reuses three things the guest already knows from the page (the dashed road, the riso tints, the drawings). The new section feels native and is still the most data-rich one on the site.

## 6. Implementation plan

All data is computed once and committed as numbers, like `content/routes.ts`. The site makes no runtime API calls and needs no new dependency, and the CSP is unchanged.

| Step | Work | Files |
| --- | --- | --- |
| 1 | **Data script.** Node, no dependencies, run by hand. It contains the NOAA sun algorithm (ported from the prototype) and samples the evening every minute (18:00–23:59), plus the events above. It also fetches Open-Meteo elevations along azimuths 270–330° at 1° steps (≈ 60 × 100 points), computes the horizon with earth curvature and refraction, and finds the sun-behind-hill minute. Finally it pulls ERA5 hourly temperature and cloud cover for 26 May–1 June over 1996–2025 and computes the medians, percentiles and share of clear evenings. It writes a generated, commented `src/content/sun.ts` that records the sources and the date of the fetch. | `wedding-site/scripts/sun-data.mjs`, `src/content/sun.ts`, `package.json` script `sun` |
| 2 | **Tests.** Check the algorithm against sunrise-sunset.org (sunrise, sunset and the three dusks within 1 min), check that the phase order is monotonic, and check the shadow-length formula. | `src/lib/sun.test.ts` (next to the existing tests) |
| 3 | **Server component.** It renders the head, a static SVG sky (fields, land, road, labels, sun parked at 19:45), the list of moments, the compass with the OSM footprint (stored in `sun.ts`) and the sources line. This is the complete no-JS version. | `src/components/sections/GoldenHour.tsx` |
| 4 | **Client island.** It holds the slider, the readout, sun and compass updates, the scroll-linked sunset with hand-over on first input, and the wedding-day „Práve teraz“. It looks values up in the precomputed table rather than computing them. | `src/components/SunScrub.tsx` |
| 5 | **Styles.** A `.gold` block in `sections.css` built on tokens only (no new colours; olive is already a token). Motion goes in `motion.css` under `html.mo`, with the reduced-motion catch-all. | `src/styles/sections.css`, `src/styles/motion.css` |
| 6 | **Page and docs.** Insert `<GoldenHour />` between `<Palette />` and `<Stay />`. Add the DESIGN.md Components row, add a MOTION.md inventory entry with its checklist, and add the README field table entry. | `src/app/(site)/page.tsx`, `DESIGN.md`, `MOTION.md`, `wedding-site/README.md` |
| 7 | **Verify.** Run the taste skill's `inspect.mjs` at 1440, 768 and 390. Test keyboard and screen reader on the slider, `?static` and no-JS, reduced motion and Safari. Check scroll hand-over with `lib/cdp.mjs`. Run the existing tests. | none |
| 8 | **Commit and push,** one commit for data and one for the section. Deploy only when you ask. | none |

**Effort:** about one focused session. Step 1 is the only part with network work.

**Sequencing:** another session currently has uncommitted edits in `Palette.tsx`, `Stay.tsx`, `motion.css` and `tokens.css`. Start step 3 after those land, to avoid editing the same files twice.

## 7. Open questions

1. **Programme times.** If the toast or dinner time is known, show it on the sky as a black pin on the road (for example „Prípitok 18:30“). That links the section to the programme and could move the photo tip to a real moment. Until then the section names no programme times.
2. **Check the hill on site.** Ask the venue when the sun leaves the yard in late May. Or stand at the barn on any clear evening around 15–20 May 2027 (sun azimuth within 2° of the wedding day) with a sun-path app such as PhotoPills or Sun Seeker. The estimate is ±10 min until then.
3. **Couple's photos in the golden window.** Do you want to suggest 19:30–20:00 to the photographer? The tip already says so for guests.
4. **Nav link.** None is proposed. Add „Svetlo“ if you want the section reachable from the menu.
5. **Name a ridge.** The terrace looks towards the Slanské vrchy (Šimonka, Oblík), but the sunset itself is at 305°, over the hill north-west of the village. A named landmark on the compass would need a verified peak and bearing, which isn't done yet.
