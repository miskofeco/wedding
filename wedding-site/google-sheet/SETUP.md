# Google Sheet setup (about 10 minutes)

The Sheet keeps a readable copy of every RSVP and of the guest list. The site's database is the record; after each change the site copies it to the Sheet through a small Apps Script. You can open the Sheet at any time, but edits made there are not read back: change answers and guests in `/admin`.

## 1. Create the Sheet and the script

1. Create a new Google Sheet, for example „Svadba – odpovede“. Keep it private: share it only with each other.
2. Open **Extensions → Apps Script**.
3. Replace the contents of `Code.gs` with this folder's `Code.gs` and save.

## 2. Set the shared secret

1. Generate a long random string, for example with `openssl rand -hex 32`.
2. In Apps Script, open **Project Settings (gear) → Script properties → Add script property**.
3. Name it `RSVP_SECRET` and paste the string as its value. Save.

## 3. Deploy as a web app

1. Click **Deploy → New deployment**, choose the type **Web app**.
2. Set **Execute as: Me** and **Who has access: Anyone**. „Anyone“ is needed so the site's server can reach it. Every request without the secret is refused.
3. Click **Deploy** and allow the permissions Google asks for (access to this spreadsheet).
4. Copy the **Web app URL**. It ends in `/exec`.

The first answer creates a sheet tab „Odpovede“ with Slovak column headers, and the first invitation in `/admin` → „Pozvaní“ creates the tab „Pozvaní“. Don't rename the tabs or reorder their columns. Rows are matched by the „ID“ column, so leave it as it is. „Pozvánka“ (last column of „Odpovede“) holds the ID of the invitation an answer was assigned to by hand. „Mená hostí“ lists everyone coming, one name per line, the person who answered first. If you pasted an older `Code.gs` before this column existed, paste the new one, deploy a new version, and add a „Mená hostí“ column after „Počet hostí“ (or delete the tab so the next answer recreates it). „Dospelý / dieťa“ (the last column) has one line per name in „Mená hostí“, saying whether that guest is an adult or a child; it feeds the seating plan and portion sizes. If you paste this `Code.gs` over an older one, deploy a new version: missing headers are added to the existing tab by themselves, and older answers count as all adults. „Kľúč odoslania“ (the last column) is a technical key that stops a retried answer from being stored twice; leave it as it is. Sorting or filtering the rows in the Sheet is fine.

## 4. Optional: an e-mail for every answer

Add a second script property `NOTIFY_EMAIL` with your address. Every new answer sent from the website then sends a short e-mail: the name, yes or no, and the number of guests. The details stay in the Sheet. The first time, Google asks you to allow the script to send e-mail; redeploy (see "Updating the script later") after adding it.

## 5. Connect the site

Set these in Vercel → Settings → Environment Variables, or in `.env.local` for local testing:

| Variable | Value |
| --- | --- |
| `RSVP_SHEET_URL` | the Web app URL ending in `/exec` |
| `RSVP_SHEET_SECRET` | the same string as `RSVP_SECRET` |
| `RSVP_SHEET_VIEW_URL` | the normal link to the Sheet (optional, adds „Otvoriť tabuľku“ in /admin) |
| `ADMIN_PASSWORD` | the password you will use at `/admin`, at least 12 characters (a random passphrase) |
| `ADMIN_SESSION_SECRET` | another random string, at least 32 characters (`openssl rand -base64 48`) |

The database variables (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`) come from the Turso integration in Vercel → Storage; see the README.

Redeploy (`npm run deploy`) after changing variables. Then send one test RSVP from `/rsvp`, check it in `/admin` and in the Sheet, and delete it.

**Pasting this version over the first one:** the site now sends `upsert` instead of `create`/`update`, so paste the new `Code.gs` and deploy a new version before deploying the site. Existing rows keep working; missing headers are added by themselves.

## Updating the script later

After editing `Code.gs`, use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. This keeps the same URL. A brand-new deployment would get a new URL.

## Privacy

The Sheet and the database hold names, phone numbers or e-mails of invited guests, dietary needs (which can be health information) and messages. Keep the Sheet shared only with the two of you, and delete the data in both places by the date the RSVP page promises (`privacy` in `src/content/rsvp.ts`, three months after the wedding): delete the answers and invitations in `/admin` (which removes them from the Sheet too), then the Turso database. Put a reminder in your calendar now.
