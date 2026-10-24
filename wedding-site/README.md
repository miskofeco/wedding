# Svadba Barbory a Michala — wedding site

Next.js 16 (App Router, TypeScript) build of the locked design in `../DESIGN.md` (prototype v7). One page in Slovak at `/`, an RSVP form at `/rsvp`, and a private `/admin` for the couple, backed by a Google Sheet.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the build
npm run lint
npm run typecheck
```

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
- **Security:** the Sheet secret and admin password live only in server environment variables. The login cookie is HttpOnly, signed and valid for a week. Every admin action checks the session again. Failed logins are slowed and limited per server instance. Guest text is stored so the Sheet never runs it as a formula. Answers are never written to logs.
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

1. Put `wedding-site/` in a Git repository (it can be the repository root, or set Root Directory to `wedding-site` in Vercel).
2. Import the repository at vercel.com/new. The framework is detected as Next.js; no build settings are needed.
3. Under Settings → Environment Variables add the five variables from `google-sheet/SETUP.md` for Production.
4. Deploy, submit one test RSVP, and check it appears in `/admin` and in the Sheet. Then delete it.
5. Optional: add a custom domain under Settings → Domains.

The site asks search engines not to index it (`robots: noindex`), because it is a private invitation.

## Structure

```
src/app/            root layout (fonts, metadata); (site)/ public page and rsvp/; admin/ page, login, actions
src/components/     Nav, RouteTimeline (the road), RevealObserver, Tint, Drawing, RsvpForm, admin/
src/lib/            rsvp (validation), sheet (Google Sheet client), auth (admin session), art, format
google-sheet/       Code.gs (Apps Script) and SETUP.md
scripts/            sync-art, prepare-photos, sheet-mock
src/components/sections/  Hero, Programme, Places, Requests, Palette, Photos, Stay, Faq, RsvpCta, Closing
src/content/        all words and facts, typed
src/styles/         tokens → base → components → sections → rsvp → motion
```

Without JavaScript every section is visible. The road between programme landmarks needs JavaScript, and the RSVP form still submits. With reduced motion everything appears in place.
