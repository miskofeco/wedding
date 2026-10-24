# Svadba Barbory a Michala

Wedding website and the planning material behind it.

| Path | What it is |
| --- | --- |
| `wedding-site/` | The site: Next.js 16, TypeScript, one Slovak page, RSVP form and a private `/admin`. See [wedding-site/README.md](wedding-site/README.md) for running and deploying it. |
| `planning/` | Phase proposals, motion proposal, prototype and direction board. |
| `DESIGN.md`, `PRODUCT.md` | The locked design and the product brief. |
| `WEDDING-ASSET-ANALYSIS.md` | Notes on the photos and illustration packs. |

## What is not in git

Binary files stay out of the repository: photos (`Photos/`), the illustration packs (`doodles/`), and any image, font or PDF file. Local copies live on the author's machine. `npm run art` and `npm run photos` in `wedding-site/` rebuild the generated assets from them. Secrets never go in git; copy `wedding-site/.env.example` to `.env.local` and fill it in.

## Commit workflow (for Claude)

Claude commits its own work to `main` as it goes. Do not wait to be asked.

- Commit after each bigger task, or after a group of tasks that belong together logically or by feature (for example "RSVP form and validation", or "palette section copy and styles"). Do not commit after every small edit, and do not mix unrelated changes in one commit.
- Before committing, run `git status` and check what is staged. Never stage `.env*` files other than `.env.example`, `node_modules/`, `.next/`, or binary files.
- Write the message in the imperative, with a short subject that says what changed and a body that says why when the reason isn't obvious.
- Push to `origin main` after committing.
- Never force-push and never rewrite history that has been pushed.
- If a task ends with nothing to commit, say so and do nothing.
