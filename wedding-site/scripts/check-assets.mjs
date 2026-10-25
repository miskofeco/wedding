// Runs before every build. The photos and palette masks stay out of git, so a
// build from a fresh clone would fail half way with "Module not found" or ship
// 404s. This stops it at once and says what is missing and how to make it.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (file) => readFileSync(path.join(root, file), "utf8");

const photos = [...read("src/content/photos.ts").matchAll(/from "@\/(assets\/[^"]+)"/g)].map((m) => `src/${m[1]}`);
const fills = [...read("src/content/palette.ts").matchAll(/figure: "([^"]+)"/g)].map((m) => `public/fills/${m[1]}.png`);

const missing = [...photos, ...fills].filter((file) => !existsSync(path.join(root, file)));
if (missing.length > 0) {
  console.error(`Missing generated assets (they are not in git):\n${missing.map((f) => `  ${f}`).join("\n")}`);
  console.error("Make them with `npm run photos` and `npm run fills`, then build and deploy from this machine (`npm run deploy`).");
  process.exit(1);
}
