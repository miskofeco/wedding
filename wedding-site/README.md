# Svadba Barbory a Michala — wedding site

Next.js 16 (App Router, TypeScript) build of the locked design in `../DESIGN.md` (prototype v7). One page in Slovak at `/`, an RSVP form at `/rsvp`, and a private `/admin` for the couple, backed by a Google Sheet.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (checks the photos and masks exist first)
npm run start      # serve the build
npm run lint
npm run typecheck
npm test           # validation, session, calendar, Sheet client and Code.gs
```

GitHub Actions runs typecheck, lint and tests on every push (`.github/workflows/ci.yml`). It can't build, because the photos and masks are not in git; see Deploy.

Add `?static` to any URL to switch off motion (useful for screenshots).

## Where the facts go

Every unconfirmed fact is `null` in `src/content/` and shows a Slovak placeholder („Čas upresníme“, „Adresu doplníme“). Fill these in as details arrive:

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

## RSVP, Google Sheet and admin

Answers are stored in a Google Sheet through a small Apps Script (`google-sheet/Code.gs`). Follow `google-sheet/SETUP.md` once to create it and connect it.

- **Guests** answer at `/rsvp`. The server validates the answer and writes a row to the Sheet. The guest sees „Ďakujeme“ only when the Sheet confirms the row was written. If the Sheet isn't connected, the form says plainly that the answer was not received. On an error it keeps what they typed.
- **You** sign in at `/admin` with `ADMIN_PASSWORD`. The page shows totals, households coming and not coming, number of guests, and a list for the kitchen with diets and allergies. It also has search, filters, edit and delete with a confirm step, and „Pridať odpoveď“ for answers received by phone. Every change goes straight to the Sheet, and edits made in the Sheet show up in `/admin` on reload.
- **No duplicates:** the browser gives each answer a random key, and `Code.gs` stores an answer with a key it has already seen only once. A retry after a timeout returns the stored row instead of adding a second one.
- **E-mail:** set the script property `NOTIFY_EMAIL` and every answer from the website sends a short e-mail (name, yes/no, number of guests). The details stay in the Sheet.
- **Security:** the Sheet secret and admin password live only in server environment variables. `ADMIN_PASSWORD` must be at least 12 characters; use a random passphrase. The login cookie is HttpOnly, signed, limited to `/admin` and valid for a week. Changing `ADMIN_PASSWORD` or `ADMIN_SESSION_SECRET` signs everyone out, so rotate either one if a device is lost. Every admin action checks the session again. Guest text is stored so the Sheet never runs it as a formula. Answers are never written to logs.
- **Limits:** failed logins are slowed and limited per address and overall, and RSVPs to ten per address in ten minutes. These counters live in each server instance, so also add the two Firewall rules under Deploy. The honeypot field quietly drops bot answers.
- **Headers:** guest pages send a baseline Content Security Policy and HSTS (`next.config.ts`). `/admin` gets a strict per-request policy with a nonce (`src/proxy.ts`); the inline boot script (`src/lib/boot.ts`) is allowed by its hash, computed automatically.
- After `deadline` in `src/content/rsvp.ts` the form closes and points to `contact`.
- The fields (name, attending, number of guests, the name of every guest, diet, message) are a proposal. Each guest after the respondent needs a name; the Sheet keeps them one per line in „Mená hostí“, the respondent first, and each guest after the respondent is marked adult or child (column „Dospelý / dieťa“, same lines). Change them in `src/lib/rsvp.ts`, `src/components/RsvpForm.tsx`, `src/components/admin/AnswerEditor.tsx` and the columns in `google-sheet/Code.gs`.

### Try it locally without Google

`npm run sheet:mock` runs the real `Code.gs` against an in-memory sheet. In `.env.local`:

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

Plain HTTP to localhost is accepted only by the dev server. Production requires HTTPS. The mock forgets everything when stopped.

## Drawings and photos

- `art-manifest.json` lists the 18 drawings used, their source file in `../doodles/whimsical/`, and the inks each needs. `npm run art` regenerates `public/art/` and `src/lib/art.generated.ts`. An entry with `crop` (`box` [x, y, w, h] on the 1080 artboard, optional `clip` polygon) takes one figure out of a larger drawing; the palette figures use it. Coordinates are copied exactly; rounding breaks the thin outlines.
- `npm run fills` regenerates `public/fills/`: the suit and dress of the palette figures as masks, flood-filled from seed points in `scripts/sync-fills.mjs` (the bride's open train is closed by traced walls there).
- `npm run photos` converts the three chosen originals from `../Photos/` into `src/assets/photos/` and fails if any location (GPS) metadata survives. Next.js serves AVIF and WebP sizes from them.
- **Licence:** no licence terms were found in the illustration pack. Keep the purchase or licence record for web use and modification before publishing.

## Deploy to Vercel (not done yet)

The photos and palette masks are not in git, so Vercel can't build from the repository. The site is built on this machine and the finished build is uploaded. `vercel.json` turns off deploys on git push, so pushes never trigger a build that would fail.

Once:

1. Create a project at vercel.com/new without connecting a repository, or run `npx vercel@63.1.2 link` in `wedding-site/` and follow the prompts. Log in first with `npx vercel@63.1.2 login`.
2. Under Settings → Environment Variables add the five variables from `google-sheet/SETUP.md` for Production.
3. Under Settings → General → Node.js Version choose 24.x (the same as `.nvmrc`).
4. Under Firewall add two rate-limit rules: POST requests to `/admin/login`, 10 per IP per 15 minutes, and POST requests to `/rsvp`, 20 per IP per 10 minutes. Both deny when exceeded.
5. Optional: add a custom domain under Settings → Domains.

Every deploy, from `wedding-site/` with Node 24:

```bash
npm run photos     # only if the photos changed
npm run fills      # only if the palette figures changed
npm run deploy     # pulls the settings, builds here, uploads the build to production
```

After the first deploy, submit one test RSVP, check it appears in `/admin` and in the Sheet, then delete it.

The site asks search engines not to index it (`robots: noindex`), because it is a private invitation.

## Structure

```
src/app/            root layout (fonts, metadata), error pages; (site)/ public page and rsvp/; admin/ page, login, actions
src/proxy.ts        the strict Content Security Policy for /admin
src/components/     Nav, RouteTimeline (the road), RevealObserver, Tint, Drawing, RsvpForm, admin/
src/lib/            rsvp (validation), sheet (Google Sheet client), auth + session (admin login), limit, csp, ics, art, format
google-sheet/       Code.gs (Apps Script) and SETUP.md
scripts/            sync-art, sync-fills, prepare-photos, check-assets, sheet-mock + sheet-fake
tests/              node --test suites
src/components/sections/  Hero, Programme, Places, Requests, Palette, Photos, Stay, Faq, RsvpCta, Closing
src/content/        all words and facts, typed
src/styles/         tokens → base → components → sections → motion on every page; rsvp.css on /rsvp and /admin, admin.css on /admin
```

Without JavaScript every section is visible. The road between programme landmarks needs JavaScript, and the RSVP form still submits. With reduced motion everything appears in place.
