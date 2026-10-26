# Public site and private test site

| Address | Vercel project | What visitors see |
| --- | --- | --- |
| `baskamisko.sk` → `www.baskamisko.sk` | `wedding-site` | The existing coming-soon page |
| `test.baskamisko.sk` | `wedding-site-test` | A password prompt, then the full invitation |

Websupport manages DNS. Vercel hosts both sites and provides HTTPS. The two projects build the same source separately with their own Production settings. `npm run deploy` publishes both. Git pushes do not deploy; the photos and masks exist only on this computer.

## 1. Create the test project in Vercel, once

In Terminal:

```bash
cd /Users/miskofeco/Desktop/Svadba/wedding-site
nvm use
npx vercel@63.1.2 login
npx vercel@63.1.2 project create wedding-site-test --scope team_ElwZ8rmeMatNgafWBZ8q3lLJ
```

This creates a separate project in the existing team. In the Vercel dashboard, open **wedding-site-test**:

1. Under **Settings → Build and Deployment**, choose **Next.js** as Framework Preset and **24.x** as Node.js Version. Leave Root Directory empty: the deploy command runs from `wedding-site/`. Leave the install/build/output overrides at their defaults. Some dashboard versions put Node.js Version under General.
2. Under **Settings → Environment Variables**, add the values below. Select **Production** for each. The test project uses Vercel's Production environment because its custom domain should always follow its latest release.
3. Under **Settings → Domains**, add **test.baskamisko.sk**, assigned to **Production**, with no redirect. Copy the exact CNAME value Vercel shows for it; you need it in step 3.

Do not attach `test.baskamisko.sk` to the existing `wedding-site` project: that would serve its coming-soon build.

## 2. Set the two projects' environment variables

| Variable | `wedding-site` → Production | `wedding-site-test` → Production |
| --- | --- | --- |
| `SITE_VARIANT` | `public` | `test` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.baskamisko.sk` (already configured) | `https://test.baskamisko.sk` |
| `TEST_SITE_PASSWORD` | Leave unset | A unique password of at least 16 characters |
| `ADMIN_PASSWORD` | Keep the existing value | A separate admin password, at least 12 characters |
| `ADMIN_SESSION_SECRET` | Keep the existing value | A separate random secret, at least 32 characters |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | Keep the existing database | Optional for a visual preview; see below |
| `RSVP_SHEET_URL`, `RSVP_SHEET_SECRET`, `RSVP_SHEET_VIEW_URL` | Keep the existing values | Leave unset for a visual preview |

Enter secrets directly in Vercel. Never commit them or use a `NEXT_PUBLIC_` prefix for a password. You can generate a password or session secret with `openssl rand -base64 48`; store it in your password manager.

For **visual preview**, the full invitation and RSVP page render without a test database. Submissions report that answers cannot be received, and the admin cannot sign in without a database. For **working RSVP and admin testing**, connect a separate Turso test database through Vercel Storage and configure the test project's Production variables. Optionally connect a separate test Sheet using `google-sheet/SETUP.md`. A separate database starts with the content defaults in the source files; production admin edits do not automatically copy across. Reusing production database/Sheet credentials would make test submissions and admin edits change real wedding data.

The browser login is **username `test`**, password **the value of `TEST_SITE_PASSWORD`**. It protects the whole test deployment, including assets, form actions, admin and generated `vercel.app` URLs. Admin still requires its own login after this prompt. A test build refuses to build with a missing/short password; at runtime a missing/short password returns 503 rather than opening the site. To sign out of HTTP Basic authentication, close the private browsing session. Changing the password requires a new deploy.

The application supplies this password gate on Hobby. Vercel's separate [built-in Password Protection](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/password-protection) is a paid Pro/Enterprise feature. Keep the test project's default **Standard Protection** for Vercel Authentication if you want generated deployment URLs to require Vercel login too. If you choose **All Deployments**, visitors to the custom test domain will also need a Vercel account, before the application's password prompt.

## 3. Add the subdomain at Websupport

1. Sign in at [Websupport WebAdmin](https://admin.websupport.sk/).
2. In **Služby**, open **baskamisko.sk**.
3. Open **DNS** in the left menu, then **CNAME**.
4. Choose **Vytvoriť nový záznam**.
5. Fill in:

   | Field | Value |
   | --- | --- |
   | Pre adresu | `test` (the completed name should be `test.baskamisko.sk`) |
   | Hodnota | The exact CNAME target Vercel showed for the test domain |
   | TTL | `600` seconds |
   | Poznámka | Optional, e.g. `Vercel test site` |

6. Save. If a record already exists for exactly `test.baskamisko.sk`, replace conflicting A/AAAA/CNAME records for **test only**.
7. Return to **Vercel → wedding-site-test → Settings → Domains** and refresh until it shows **Valid Configuration** and HTTPS is ready. Websupport says DNS changes can take up to two hours.

Use the target from Vercel, without `https://` or a path. It is a hostname, not an IP address. Keep the existing root (`@`) and `www` records, nameservers and mail records. This setup needs a DNS record; it does not need a Websupport hosting folder, FTP upload, web forwarding or a separate Websupport SSL certificate.

Source: [Websupport's CNAME instructions](https://www.websupport.sk/podpora/kb/cname-zaznamy/). [Vercel domain setup](https://vercel.com/docs/domains/working-with-domains/add-a-domain) explains the project assignment and required DNS values.

## 4. Check setup, then deploy

From `wedding-site/`, with Node 24:

```bash
npm run deploy:check
npm run deploy
```

`deploy:check` pulls and checks both projects' Production settings without building or deploying. It reports a missing project, variant, site URL or test password. The project names and team are in `deploy-targets.json`.

`deploy` requires committed, pushed site changes. It checks both projects first, then builds and deploys the test site, followed by the public site, recording the same commit on both. Each build uses its own project's variables. It restores this computer's original Vercel settings afterwards. A local lock prevents overlapping deploy/check commands from mixing their build output. If an interrupted command leaves `.vercel/deploy.lock` behind, remove that empty folder after confirming no deploy is still running.

The releases are sequential. If the test release succeeds but the public release fails, the test site has the new version and the public site keeps its previous version. Fix the reported issue and rerun, or update one target:

```bash
npm run deploy:public
npm run deploy:test
```

Afterwards, open a private browser window and verify:

- `https://baskamisko.sk` redirects to `https://www.baskamisko.sk` and shows coming soon. `/rsvp` also shows coming soon.
- `https://test.baskamisko.sk` asks for the test credentials. Canceling or entering the wrong password must not reveal the invitation.
- After signing in, the full invitation and `/rsvp` open. `/admin` still asks for its separate admin login.
- With a test database connected, a test RSVP appears only in the test admin/database (and test Sheet, if configured).

Local checks: `npm test`, `npm run lint`, `npm run typecheck`, and `npm run test:preview`. The last command builds both variants with throwaway settings and checks the password gate, pages, assets, form requests, admin login and public coming-soon rewrite. It needs the local photos/masks and never connects to the real database or Sheet.

## When the invitation is ready to open

Set `comingSoon` to `false` in `src/content/launch.ts`, commit and push, then run `npm run deploy`. The public domain will show the full invitation. The test project stays password-protected. Roll back each project independently from its Vercel Deployments screen.
