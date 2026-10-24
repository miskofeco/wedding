# Google Sheet setup (about 10 minutes)

The Sheet stores every RSVP. The site writes to it through a small Apps Script, and `/admin` reads and edits it through the same script. You can also open the Sheet directly at any time.

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

The first answer creates a sheet tab „Odpovede“ with Slovak column headers. Don't rename the tab or reorder its columns. „Mená hostí“ lists everyone coming, one name per line, the person who answered first. If you pasted an older `Code.gs` before this column existed, paste the new one, deploy a new version, and add a „Mená hostí“ column after „Počet hostí“ (or delete the tab so the next answer recreates it). „Dospelý / dieťa“ (the last column) has one line per name in „Mená hostí“, saying whether that guest is an adult or a child; it feeds the seating plan and portion sizes. If you paste this `Code.gs` over an older one, deploy a new version: the header is added to the existing tab by itself, and older answers count as all adults. Sorting or filtering the rows in the Sheet is fine.

## 4. Connect the site

Set these in Vercel → Settings → Environment Variables, or in `.env.local` for local testing:

| Variable | Value |
| --- | --- |
| `RSVP_SHEET_URL` | the Web app URL ending in `/exec` |
| `RSVP_SHEET_SECRET` | the same string as `RSVP_SECRET` |
| `RSVP_SHEET_VIEW_URL` | the normal link to the Sheet (optional, adds „Otvoriť tabuľku“ in /admin) |
| `ADMIN_PASSWORD` | the password you will use at `/admin` |
| `ADMIN_SESSION_SECRET` | another random string, at least 32 characters (`openssl rand -base64 48`) |

Redeploy after changing variables. Then send one test RSVP from `/rsvp`, check it in `/admin` and in the Sheet, and delete it.

## Updating the script later

After editing `Code.gs`, use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. This keeps the same URL. A brand-new deployment would get a new URL.

## Privacy

The Sheet holds names, dietary needs and messages. Keep it shared only with the two of you, and delete the data a few months after the wedding.
