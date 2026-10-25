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

Production is **https://www.baskamisko.sk** (`baskamisko.sk` redirects there): Vercel project `wedding-site` on the free plan, a Turso database connected to Production only, DNS at Websupport (A `@` → Vercel, CNAME `www` → Vercel). Full steps and settings: [wedding-site/README.md](wedding-site/README.md) → Deploy.

- **Git pushes don't deploy** (`vercel.json`). The photos and palette masks aren't in git, so the site is built on this machine and the build is uploaded. From `wedding-site/` with Node 24:
  ```bash
  npm run deploy
  ```
  It runs `vercel pull`, `vercel build --prod` and `vercel deploy --prebuilt --prod`. Run `npm run photos` or `npm run fills` first only if those assets changed.
- **Deploy when the user asks**, and only a committed and pushed state, so production always matches a commit on `main`.
- **Afterwards** check that https://www.baskamisko.sk and `/admin/login` answer, and report the deployment URL. If the build fails, report the error; don't deploy around it.
- **„Pripravujeme“:** while `comingSoon` in `wedding-site/src/content/launch.ts` is `true`, production shows only the coming-soon page (`src/proxy.ts`); `/admin` stays open. Switch it off only when the user says so, then deploy.
- **Settings** live in Vercel → Settings → Environment Variables (Production). `NEXT_PUBLIC_*` values are Config and built into the pages, so deploy after changing one. Keep `RELEASE-CHECKLIST.md` (local only) in step when variables change.
- Content edited in `/admin` → „Obsah webu“ goes live without a deploy.
