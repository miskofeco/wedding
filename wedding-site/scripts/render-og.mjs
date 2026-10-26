// `npm run og`: renders scripts/og-image.html to src/app/opengraph-image.png, the
// picture chat apps show when someone shares a link to the site. Next.js serves it
// and adds the og:image tags (with the alt text from opengraph-image.alt.txt).
// Like the photos and masks it is not in git, so run this before deploying if the
// design changed. Needs Chrome (or set CHROME to another Chromium) and network
// access for the Google Fonts the template loads.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const template = pathToFileURL(path.join(root, "scripts/og-image.html")).href;
const out = path.join(root, "src/app/opengraph-image.png");

const chrome = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((p) => p && existsSync(p));
if (!chrome) {
  console.error("Chrome not found. Install it or set CHROME to a Chromium binary.");
  process.exit(1);
}

const profile = mkdtempSync(path.join(tmpdir(), "og-chrome-"));
// Virtual time only runs while nothing is loading, so the fonts and drawings are in before the budget ends.
const run = (...args) =>
  execFileSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--allow-file-access-from-files",
      `--user-data-dir=${profile}`,
      "--force-device-scale-factor=1",
      "--window-size=1200,630",
      "--virtual-time-budget=10000",
      ...args,
      template,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );

try {
  const ready = run("--dump-dom").match(/data-ready="([^"]*)"/)?.[1];
  if (ready !== "ok") {
    console.error(`Not rendered: ${ready ?? "the page never finished loading"}.`);
    process.exit(1);
  }
  run(`--screenshot=${out}`);
} finally {
  rmSync(profile, { recursive: true, force: true });
}

console.log(`${path.relative(root, out)}: ${Math.round(statSync(out).size / 1024)} kB`);
