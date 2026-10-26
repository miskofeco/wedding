# CLAUDE.md

Wedding site (`wedding-site/`, Next.js) and planning material. See [README.md](README.md) for the layout.

## Commits

Commit your own work to `main` without being asked, and push to `origin main` afterwards.

- Commit after each bigger task, or after a group of tasks that belong together logically or by feature. Not after every small edit, and never mix unrelated changes in one commit.
- Run `git status` first and check what is staged. Never stage `.env*` (except `.env.example`), `node_modules/`, `.next/`, or binary files (photos, images, fonts, PDFs); they are ignored on purpose.
- Imperative subject saying what changed; body says why when it isn't obvious.
- No attribution lines and no mention of Claude or AI in commits, code or docs.
- Never force-push or rewrite pushed history.

## Deploy

For deployment setup, DNS changes, preview access or releases, read [wedding-site/DEPLOYMENT.md](wedding-site/DEPLOYMENT.md). Production is **https://www.baskamisko.sk** (`baskamisko.sk` redirects there), project `wedding-site`. The full invitation at **https://test.baskamisko.sk** uses a separate project, `wedding-site-test`, with an application password gate on the free plan. DNS stays at Websupport.

- **Git pushes don't deploy** (`vercel.json`). The photos and palette masks aren't in git, so builds run on this machine with Node 24. From `wedding-site/`, `npm run deploy` validates both projects, then builds and deploys test followed by public. `deploy:check` validates settings only; `deploy:public` and `deploy:test` update one target. Project names and team are in `deploy-targets.json`.
- **Deploy when the user asks**, and only a committed and pushed state. Verify the requested project/team and report the deployment URLs and any partial release.
- **Afterwards** verify the public coming-soon page and `/admin/login`, and that the test site refuses anonymous requests and opens the invitation with its test credentials. Its password does not grant an admin session.
- **„Pripravujeme“:** while `comingSoon` in `wedding-site/src/content/launch.ts` is `true`, the public Production build shows only the coming-soon page; `/admin` stays open. Switch it off only when the user says so. `SITE_VARIANT=test` bypasses that rewrite and requires `TEST_SITE_PASSWORD`; its variant is fixed into the build so a missing runtime setting cannot expose the test site.
- **Settings** live in each Vercel project's Production environment. Public uses `SITE_VARIANT=public`; test uses `SITE_VARIANT=test`. Keep passwords server-only and separate test data from the production database/Sheet. See the deployment guide for a visual preview without a test database.
- Content edited through each project's `/admin` refreshes that project's pages without a deploy. `NEXT_PUBLIC_*` settings need a new build.
