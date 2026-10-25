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
npm run test:authz # builds and starts the site, then asks every admin page, export and action without a cookie
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
| Privacy note under the RSVP button (who sees it, where, when it's deleted) | `src/content/rsvp.ts` | `privacy` |
| Photo captions | `src/content/photos.ts` | `caption` |
| Palette meanings, dress-code wording | `src/content/palette.ts` | `paletteIntro`, `meaning` |

Only add a `mapUrl` you have opened and checked. Hlinné has three churches, so the church entry stays empty until confirmed. The programme in `events.ts` is a proposal until replaced; the road on the page follows the array order.

## Countdown, calendar and map

- **Countdown:** below the hero, counted in Slovak time and refreshed every minute. It shows „Dnes“ on the day and „Svoji“ afterwards. Without JavaScript it shows the date.
- **Add to calendar:** a Google Calendar link and `/svadba.ics` for Apple, Outlook and others, both built from `src/lib/calendar.ts`. The event is all-day until the ceremony time is set in `src/content/events.ts`, then it runs from the ceremony to 23:59. It includes both addresses and a reminder a week before. Set `NEXT_PUBLIC_SITE_URL` to add the site link to the description.
- **Map:** `src/components/sections/Journey.tsx`. It's drawn and not to scale, but oriented from the real village coordinates. Its links use `mapUrl` from `src/content/places.ts`. Accommodation is linked to its section until places to stay are confirmed.

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
- **Security:** the database token, the Sheet secret and the admin password live only in server environment variables. All SQL uses parameters. `ADMIN_PASSWORD` must be at least 12 characters; use a random passphrase. The login cookie is HttpOnly, signed, limited to `/admin` and valid for a week. Changing `ADMIN_PASSWORD` or `ADMIN_SESSION_SECRET` signs everyone out, so rotate either one if a device is lost. Every admin action and the CSV downloads check the session again. Guest text is stored so the Sheet never runs it as a formula, and CSV cells that start like a formula are prefixed. Answers are never written to logs.
- **Limits:** every failed login waits 600 ms, and each address gets 8 tries in 15 minutes, counted in the database (`login_attempts`, keyed by a hash of the address, never the address itself) so all server instances share the count; signing in resets it. RSVPs are limited to ten per address in ten minutes, and there are in-memory login brakes per address and overall; those counters live in each server instance. Also add the Firewall rule under Deploy. The honeypot field quietly drops bot answers.
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

- `art-manifest.json` lists the 18 drawings used, their source file in `../doodles/whimsical/`, and the inks each needs. `npm run art` regenerates `public/art/` and `src/lib/art.generated.ts`. An entry with `crop` (`box` [x, y, w, h] on the 1080 artboard, optional `clip` polygon) takes one figure out of a larger drawing; the palette figures use it. Coordinates are copied exactly; rounding breaks the thin outlines.
- `npm run fills` regenerates `public/fills/`: the suit and dress of the palette figures as masks, flood-filled from seed points in `scripts/sync-fills.mjs` (the bride's open train is closed by traced walls there).
- `npm run photos` converts the three chosen originals from `../Photos/` into `src/assets/photos/` and fails if any location (GPS) metadata survives. Next.js serves AVIF and WebP sizes from them.
- **Licence:** no licence terms were found in the illustration pack. Keep the purchase or licence record for web use and modification before publishing.

## Deploy to Vercel

Production: https://www.baskamisko.sk (`baskamisko.sk` redirects to it). The domain is registered at Websupport, whose DNS keeps an A record for `@` and a CNAME for `www` with the values shown in Vercel → Settings → Domains; `NEXT_PUBLIC_SITE_URL` is `https://www.baskamisko.sk`.

The photos and palette masks are not in git, so Vercel can't build from the repository. The site is built on this machine and the finished build is uploaded. `vercel.json` turns off deploys on git push, so pushes never trigger a build that would fail.

Once:

1. Create the project: import the repository at vercel.com/new with Root Directory `wedding-site` (its first build fails on the missing photos, as it should), or run `npx vercel@63.1.2 link` in `wedding-site/`. Either way, link this machine to it with `npx vercel@63.1.2 login` and `npx vercel@63.1.2 link`.
2. Under Storage add a Turso database from the Marketplace and connect it to the project for Production (it adds `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`). Under Settings → Environment Variables add the five variables from `google-sheet/SETUP.md` for Production.
3. Under Settings → General → Node.js Version choose 24.x (the same as `.nvmrc`).
4. Under Settings → Functions set the Function Region to the database's region (Dublin `dub1` for a Turso database in Ireland).
5. Under Firewall add one rate-limit rule (the free plan allows one, with a window of at most 10 minutes): if Request Method equals `POST`, on any path, rate limit 60 requests per IP per 10 minutes, then deny. Don't narrow it to `/rsvp` or `/admin/login`: the login and the RSVP form are server actions, which Next.js runs for a POST to any page that carries a `Next-Action` header. The limit leaves room for editing in `/admin`, where every save is a POST too; the login's own limit (8 tries per address per 15 minutes) is in the database.
6. Optional: add a custom domain under Settings → Domains.

Every deploy, from `wedding-site/` with Node 24:

```bash
npm run photos     # only if the photos changed
npm run fills      # only if the palette figures changed
npm run deploy     # pulls the settings, builds here, uploads the build to production
```

After the first deploy, submit one test RSVP, check it appears in `/admin` and in the Sheet, then delete it. While „Pripravujeme“ is on, `/rsvp` is closed in production, so add the test answer in `/admin` → Odpovede → „Pridať odpoveď“ instead.

### „Pripravujeme“ (coming soon)

While `comingSoon` in `src/content/launch.ts` is `true`, production shows only `/pripravujeme`: `src/proxy.ts` rewrites every guest page to it, `/rsvp` included (sending an answer is refused too). `/admin`, `/svadba.ics` (the page's calendar button), drawings and Next.js assets stay reachable. The address bar keeps the URL the guest opened. Local dev and preview deploys always show the full site; open `/pripravujeme` there to see the page. To open the invitation, set `comingSoon` to `false` and deploy.

The guest pages are static. The build reads the edited content from the production database (`vercel pull` brings the Turso variables), and saving in „Obsah webu“ rebuilds them on Vercel on the next visit, so content edits need no deploy.

The site asks search engines not to index it (`robots: noindex`), because it is a private invitation.

## Structure

```
src/app/            root layout (fonts, metadata), error pages; (site)/ public page and rsvp/; admin/ (app)/ pages, login, actions, export/ CSV
src/proxy.ts        the strict Content Security Policy for /admin, and the „Pripravujeme“ gate in production
src/components/     Nav, RouteTimeline (the road), RevealObserver, Tint, Drawing, RsvpForm, admin/
src/lib/            db (libSQL), answers + invites (records, Sheet mirror), mirror (sync), records (matching, totals, CSV), content + site-content (editable content), sheet (Google Sheet client), rsvp (validation), auth + session (admin login), limit, csp, ics, art, format
google-sheet/       Code.gs (Apps Script) and SETUP.md
scripts/            sync-art, sync-fills, prepare-photos, check-assets, sheet-mock + sheet-fake
tests/              node --test suites
src/components/sections/  Hero, Programme, Places, Requests, Palette, Photos, Stay, Faq, RsvpCta, Closing
src/content/        all words and facts, typed
src/styles/         tokens → base → components → sections → motion on every page; rsvp.css on /rsvp, admin.css on /admin
```

Without JavaScript every section is visible. The road between programme landmarks needs JavaScript, and the RSVP form still submits. With reduced motion everything appears in place.
