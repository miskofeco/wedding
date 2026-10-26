# Svadba Barbory a Michala — wedding site

Next.js 16 (App Router, TypeScript) build of the locked design in `../DESIGN.md` (prototype v7). One page in Slovak at `/`, an RSVP form at `/rsvp`, and a private `/admin` for the couple. Answers, the guest list and the edited content live in a libSQL database (Turso in production, a git-ignored file locally); answers and the guest list are mirrored to a Google Sheet.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (checks the photos and masks exist first)
npm run start      # serve the build
npm run lint
npm run typecheck
npm test           # validation, session, calendar, guest records, the database, content checks and Code.gs
npm run test:authz # builds and starts the site, then asks every admin page, export and action without a cookie, and checks the action body limit
```

GitHub Actions runs typecheck, lint and tests on every push (`.github/workflows/ci.yml`). It can't build, because the photos and masks are not in git; see Deploy.

Add `?static` to any URL to switch off motion (useful for screenshots).

## Where the facts go

Every unconfirmed fact is `null` in `src/content/` and shows a Slovak placeholder („Čas upresníme“, „Adresu doplníme“). The programme, „Pár prosieb“, the FAQ, the RSVP deadline and contact, and the ceremony and party times can also be edited in `/admin` → „Obsah webu“; those edits are stored in the database and override the files, which stay as the defaults („Vrátiť na pôvodný obsah“ goes back to them). Fill the rest in as details arrive:

| What | File | Field |
| --- | --- | --- |
| Church name, address, ceremony time, map link | `src/content/places.ts` | `church.name`, `address`, `time`, `mapUrl` |
| Venue address, start time, map link | `src/content/places.ts` | `venue.address`, `time`, `mapUrl` |
| Programme and times | `src/content/events.ts` | one entry per moment, `time: "14:00"` |
| Accommodation | `src/content/stays.ts` | add `{ name, distanceKm, note, url }` |
| FAQ answers | `src/content/faq.ts` | `answer` |
| „Pár prosieb“ wording (arrive early, phones, confetti rule) | `src/content/requests.ts` | `requests`, `requestsIntro` |
| RSVP deadline and direct contact | `src/content/rsvp.ts` | `deadline: "2027-04-30"`, `contact` |
| Privacy note under the RSVP button (who sees it, what the kitchen gets, where, when it's deleted; the form adds the contact for corrections) | `src/content/rsvp.ts` | `privacy` |
| Photo captions | `src/content/photos.ts` | `caption` |
| Palette meanings, dress-code wording | `src/content/palette.ts` | `paletteIntro`, `meaning` |
| „Zlatá hodina v Zlatníku“ wording (phases, moments, tips) | `src/content/light.ts` | `lightIntro`, `lightPhases`, `lightMoments`, `lightTips` |

Only add a `mapUrl` you have opened and checked. Hlinné has three churches, so the church entry stays empty until confirmed. The programme in `events.ts` is a proposal until replaced; the road on the page follows the array order.

## Countdown, calendar, map and golden hour

- **Countdown:** below the hero, counted in Slovak time and refreshed every minute. It shows „Dnes“ on the day and „Svoji“ afterwards. Without JavaScript it shows the date.
- **Add to calendar:** a Google Calendar link and `/svadba.ics` for Apple, Outlook and others, both built from `src/lib/calendar.ts`. The event is all-day until the ceremony time is set in `src/content/events.ts`, then it runs from the ceremony to 23:59. It includes both addresses and a reminder a week before. Set `NEXT_PUBLIC_SITE_URL` to add the site link to the description.
- **Map:** `src/components/sections/Journey.tsx`. It's drawn and not to scale, but oriented from the real village coordinates. Its links use `mapUrl` from `src/content/places.ts`. Accommodation is linked to its section until places to stay are confirmed.
- **Golden hour:** `src/components/sections/GoldenHour.tsx` with the client part `SunLive.tsx`. Its numbers come from `src/content/sun.ts`, which `npm run sun` (`scripts/sun-data.mjs`) generates offline. The script uses the sun algorithm in `src/lib/sun.ts`, the elevation and weather samples saved in `scripts/sun/` (each file names its source and fetch date), the barn's OpenStreetMap footprint and the U.S. Naval Observatory moonrise. Nothing is fetched while the site runs. The time the sun goes behind the hill is a terrain estimate (±10 min); if you check it on site, adjust `scripts/sun/terrain.json` or the copy.

## RSVP, database, Google Sheet and admin

The **database** is the record: RSVP answers, the guest list („Pozvaní“) and the content edited in `/admin` (`src/lib/db.ts` creates the tables on first use). In production it is a Turso database added from the Vercel Marketplace (Storage → Turso), which sets `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`; traffic is TLS and Turso encrypts it at rest. Locally, with no `TURSO_DATABASE_URL`, the same SQL runs on `.data/svadba.db`, which is git-ignored; delete the folder to start over.

The **Google Sheet** keeps a readable copy of the answers (tab „Odpovede“) and the guest list (tab „Pozvaní“) through a small Apps Script (`google-sheet/Code.gs`). Follow `google-sheet/SETUP.md` once to create it and connect it. Every write goes to the database first; the copy to the Sheet runs right after the reply, and a row the Sheet didn't take stays marked until the next sync („Synchronizovať“ in the admin sidebar). Edits made by hand in the Sheet are not read back.

- **Guests** answer at `/rsvp`. The server validates the answer and stores it in the database. The guest sees „Ďakujeme“ only when the database confirms the row was written. If the database isn't connected, the form says plainly that the answer was not received. On an error it keeps what they typed.
- **You** sign in at `/admin` with `ADMIN_PASSWORD`:
  - **Prehľad:** guests coming (adults and children), reply rate against the guest list, households still to answer, days to the RSVP deadline, a chart of confirmed guests over time against the number invited, people per side (bride, groom, both), the latest answers, who hasn't replied, what is still missing on the site, and portions for the kitchen.
  - **Odpovede:** a sortable, searchable table with filters (coming, not coming, diet, children, with a message, not matched to an invitation), a detail panel with edit, delete and invitation assignment, „Pridať odpoveď“ for answers received by phone, and CSV export.
  - **Pozvaní:** the guest list, one row per household with expected headcount, side, group and contact. Answers are matched to invitations by name (any guest name equal to a name on exactly one invitation, ignoring case and diacritics), or by hand. Filter by status and side, paste a whole list at once („Vložiť zoznam“: „Novákovci; 4“ or „Ján Kováč, Eva Kováčová“ per line), and send a reminder: a ready message with the RSVP link to copy, or to open as SMS or e-mail, then mark the household as reminded.
  - **Hostia a kuchyňa:** everyone coming, one row per person (adult or child, household, side, group), and the households with diets or allergies. Print it or download CSV (semicolon-separated for Slovak Excel).
  - **Obsah webu:** editors for the programme (title, time or „Po obrade“, place, text, drawing and its two tint colours, playlist), „Pár prosieb“, the FAQ, and the deadline, contact and place times. „Uložiť a zverejniť“ rebuilds the guest pages on their next visit.
- **No duplicates:** the browser gives each answer a random key, and the database stores an answer with a key it has already seen only once. A retry after a timeout returns the stored row instead of adding a second one.
- **E-mail:** set the script property `NOTIFY_EMAIL` and every new answer from the website sends a short e-mail (name, yes/no, number of guests). The details stay in the Sheet.
- **Security:** the database token, the Sheet secret and the admin password live only in server environment variables. All SQL uses parameters. `ADMIN_PASSWORD` must be at least 12 characters; use a random passphrase. The login cookie is HttpOnly, signed, limited to `/admin` and valid for a week. If a device is lost, „Odhlásiť všetky zariadenia“ at the bottom of „Prehľad“ signs out every other device at once (sessions issued before it stop counting; the cut-off is a row in the `content` table). Changing `ADMIN_PASSWORD` or `ADMIN_SESSION_SECRET` also signs everyone out. Every admin action and the CSV downloads check the session again. Guest text is stored so the Sheet never runs it as a formula, and CSV cells that start like a formula are prefixed. Answers are never written to logs.
- **Limits:** every failed login waits 600 ms, and each address gets 8 tries in 15 minutes, counted in the database (`login_attempts`, keyed by a hash of the address, never the address itself) so all server instances share the count; signing in resets it. RSVPs are limited to ten per address in ten minutes, and an in-memory login brake per address answers before the database; those two counters live in each server instance. There is deliberately no limit across all addresses, which anyone could use to lock you out; a long random password is the defence against guessing from many addresses. Also add the Firewall rule under Deploy. The honeypot field quietly drops bot answers.
- **Headers:** guest pages send a baseline Content Security Policy and HSTS (`next.config.ts`). `/admin` gets a strict per-request policy with a nonce (`src/proxy.ts`); the inline boot script (`src/lib/boot.ts`) is allowed by its hash, computed automatically.
- After the deadline (set in `/admin` → „Obsah webu“ → „Termín a časy“, default `src/content/rsvp.ts`) the form closes and points to the contact.
- The fields (name, attending, number of guests, the name of every guest, diet, message) are a proposal. Each guest after the respondent needs a name; the Sheet keeps them one per line in „Mená hostí“, the respondent first, and each guest after the respondent is marked adult or child (column „Dospelý / dieťa“, same lines). Change them in `src/lib/rsvp.ts`, `src/components/RsvpForm.tsx`, `src/components/admin/AnswerEditor.tsx`, the `answers` table in `src/lib/db.ts` and the columns in `google-sheet/Code.gs`.

### Try it locally without Google

The database needs nothing: `npm run dev` creates `.data/svadba.db`. `npm run sheet:mock` runs the real `Code.gs` against an in-memory sheet. In `.env.local`:

```
RSVP_SHEET_URL=http://localhost:8790
RSVP_SHEET_SECRET=dev-secret
ADMIN_PASSWORD=choose-a-local-password
ADMIN_SESSION_SECRET=any-random-string-of-at-least-32-characters
```

```bash
RSVP_SHEET_SECRET=dev-secret npm run sheet:mock
```

```bash
npm run dev
```

Plain HTTP to localhost and a local database file are accepted only outside production. Production requires HTTPS and `TURSO_DATABASE_URL`. The mock forgets everything when stopped; the database file doesn't, so after restarting the mock press „Synchronizovať“ or expect only new changes in it.

## Drawings and photos

- `art-manifest.json` lists the 18 drawings used, their source file in `../doodles/whimsical/`, and the inks each needs. `npm run art` regenerates `public/art/` and `src/lib/art.generated.ts`. An entry with `crop` (`box` [x, y, w, h] on the 1080 artboard, optional `clip` polygon) takes one figure out of a larger drawing. Coordinates are copied exactly; rounding breaks the thin outlines.
- `public/gowns.svg` is the palette section's line-up of the bride and five bridesmaids (kept outside `public/art/`, which `npm run art` rebuilds). `npm run fills` regenerates `public/fills/gown-1.png` … `gown-6.png`: each woman's dress as a mask, flood-filled from seed points in `scripts/sync-fills.mjs`. The n-th colour in `src/content/palette.ts` dresses the n-th woman from the left.
- `npm run photos` converts the three chosen originals from `../Photos/` into `src/assets/photos/` and fails if any location (GPS) metadata survives. Next.js serves AVIF and WebP sizes from them.
- `npm run og` renders `scripts/og-image.html` (1200 × 630, the date with the couple and bouquets) to `src/app/opengraph-image.png`, the picture chat apps show when someone shares a link. Next.js adds the `og:image` tags, with the alt text from `src/app/opengraph-image.alt.txt` and absolute URLs from `NEXT_PUBLIC_SITE_URL`. It needs Chrome (or `CHROME=<path>`) and network access for Google Fonts, and refuses to write the file if a font or drawing failed to load. Chat apps cache previews, so after changing it on a link already shared, refresh the link in Facebook's Sharing Debugger.
- **Licence:** no licence terms were found in the illustration pack. Keep the purchase or licence record for web use and modification before publishing.

## Deploy to Vercel

See [DEPLOYMENT.md](DEPLOYMENT.md) for the complete Vercel and Websupport setup.

- `baskamisko.sk` redirects to `www.baskamisko.sk`: project `wedding-site`, the public coming-soon page while `comingSoon` in `src/content/launch.ts` is true.
- `test.baskamisko.sk`: project `wedding-site-test`, the full invitation behind a browser password prompt (username `test`, server-only `TEST_SITE_PASSWORD`). Admin has its own separate login.
- Both use Vercel's **Production** environment, with `SITE_VARIANT=public` and `SITE_VARIANT=test` respectively. The test variant is fixed into its build and stays protected on every hostname.
- Git pushes don't deploy. Photos and masks aren't in git, so build and upload from this computer, with Node 24.

```bash
npm run deploy:check  # validate both projects' settings without deploying
npm run deploy        # build and deploy test, then public, from the same pushed commit
npm run deploy:public # update only the public site
npm run deploy:test   # update only the protected full site
```

Site changes must be committed and pushed before deploying. Assets can be regenerated with `npm run photos`, `npm run fills`, or `npm run og` when needed. The script checks both projects before either deploy, selects project/team explicitly, and restores the original local Vercel settings afterwards. The two releases are sequential; a later failure doesn't roll back an earlier successful release.

Use a separate test database and Sheet for working RSVP/admin testing. Without them, the invitation can be previewed, but submissions and admin login are unavailable. Reusing production credentials makes test changes affect real data.

Public launch: set `comingSoon` to `false`, commit, push, deploy. The test site stays protected. Content saved through each project's admin refreshes that project's pages without a deploy. Rollback is per project in Vercel → Deployments → Promote to Production.

## Structure

```
src/app/            root layout (fonts, metadata), error pages; (site)/ public page and rsvp/; admin/ (app)/ pages, login, actions, export/ CSV
src/proxy.ts        the strict Content Security Policy for /admin (the only path it runs on)
src/components/     Nav, RouteTimeline (the road), RevealObserver, Tint, Drawing, RsvpForm, admin/
src/lib/            db (libSQL), answers + invites (records, Sheet mirror), mirror (sync), records (matching, totals, CSV), content + site-content (editable content), sheet (Google Sheet client), rsvp (validation), auth + session (admin login), limit, csp, ics, art, format, sun
google-sheet/       Code.gs (Apps Script) and SETUP.md
scripts/            sync-art, sync-fills, prepare-photos, check-assets, sheet-mock + sheet-fake, sun-data (+ sun/ samples)
tests/              node --test suites
src/components/sections/  Hero, Programme, Places, Requests, Palette, GoldenHour, Photos, Stay, Faq, RsvpCta, Closing
src/content/        all words and facts, typed
src/styles/         tokens → base → components → sections → motion on every page; rsvp.css on /rsvp, admin.css on /admin
```

Without JavaScript every section is visible. The road between programme landmarks needs JavaScript, and the RSVP form still submits. With reduced motion everything appears in place.
