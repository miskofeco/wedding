// `npm run deploy`: builds the site on this machine and uploads the build to
// production (README → Deploy). Vercel builds whatever is on disk, so this
// first makes sure that is a commit already pushed, built with the Node major
// in .nvmrc (the one Vercel runs), and records the commit on the deployment.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const VERCEL = "vercel@63.1.2";

function stop(message) {
  console.error(`Not deploying: ${message}`);
  process.exit(1);
}

const wanted = readFileSync(path.join(root, ".nvmrc"), "utf8").trim();
if (process.versions.node.split(".")[0] !== wanted) {
  stop(`this is Node ${process.versions.node}; the site is built with Node ${wanted}, as on Vercel (.nvmrc). Run \`nvm use\` first.`);
}

const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const quiet = (...args) => spawnSync("git", args, { cwd: root, stdio: "ignore" }).status === 0;

// Only this folder counts: notes and plans elsewhere in the repository aren't part of the site.
// The photos and masks are git-ignored, so they never count either.
if (!quiet("diff", "--quiet", "HEAD", "--", ".") || git("ls-files", "--others", "--exclude-standard", "--", ".") !== "") {
  stop("wedding-site/ has changes that aren't committed (`git status .`). Commit and push them first.");
}
if (!quiet("rev-parse", "--verify", "--quiet", "@{upstream}")) stop("this branch has no upstream. Push it first.");
if (!quiet("merge-base", "--is-ancestor", "HEAD", "@{upstream}")) stop(`${git("rev-parse", "--abbrev-ref", "HEAD")} has commits that aren't pushed. Push them first.`);

const commit = git("rev-parse", "--short", "HEAD");
console.log(`Deploying ${commit}: ${git("log", "-1", "--format=%s")}`);

function vercel(...args) {
  const { status } = spawnSync("npx", ["--yes", VERCEL, ...args], { cwd: root, stdio: "inherit" });
  if (status !== 0) process.exit(status ?? 1);
}

vercel("pull", "--yes", "--environment=production");
vercel("build", "--prod");
vercel("deploy", "--prebuilt", "--prod", "--meta", `commit=${commit}`);
