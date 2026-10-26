// Build and deploy the public and password-protected test projects from one
// pushed commit. Setup and per-project environment variables: DEPLOYMENT.md.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { parseEnv } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const VERCEL = "vercel@63.1.2";

function stop(message) {
  console.error(`Not deploying: ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const only = args.find((arg) => arg.startsWith("--only="))?.slice(7);
if (args.some((arg) => arg !== "--check" && !["--only=public", "--only=test"].includes(arg))) {
  stop("use --check, --only=public or --only=test.");
}
const targets = JSON.parse(readFileSync(path.join(root, "deploy-targets.json"), "utf8"));
const names = (only ? [only] : ["test", "public"]);
if (targets.public.project === targets.test.project) stop("public and test must be different Vercel projects.");

const wanted = readFileSync(path.join(root, ".nvmrc"), "utf8").trim();
if (process.versions.node.split(".")[0] !== wanted) {
  stop(`this is Node ${process.versions.node}; the site is built with Node ${wanted}, as on Vercel (.nvmrc). Run \`nvm use\` first.`);
}

const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const quiet = (...args) => spawnSync("git", args, { cwd: root, stdio: "ignore" }).status === 0;

// Only this folder counts; ignored photos and notes outside it aren't source changes.
if (!checkOnly) {
  if (!quiet("diff", "--quiet", "HEAD", "--", ".") || git("ls-files", "--others", "--exclude-standard", "--", ".") !== "") {
    stop("wedding-site/ has changes that aren't committed (`git status .`). Commit and push them first.");
  }
  if (!quiet("rev-parse", "--verify", "--quiet", "@{upstream}")) stop("this branch has no upstream. Push it first.");
  if (!quiet("merge-base", "--is-ancestor", "HEAD", "@{upstream}")) stop(`${git("rev-parse", "--abbrev-ref", "HEAD")} has commits that aren't pushed. Push them first.`);
}

const commit = git("rev-parse", "--short", "HEAD");
console.log(`${checkOnly ? "Checking setup for" : "Deploying"} ${commit}: ${git("log", "-1", "--format=%s")}`);

// Both variants share local build output. Overlapping releases could otherwise
// upload a test build to the public project while the other command builds it.
mkdirSync(path.join(root, ".vercel"), { recursive: true });
const lock = path.join(root, ".vercel/deploy.lock");
try { mkdirSync(lock); } catch {
  stop("another deploy/check holds .vercel/deploy.lock. If an interrupted command left it behind, remove that empty folder only after confirming no deploy is running.");
}

function vercel(project, args, { env = process.env } = {}) {
  const result = spawnSync("npx", ["--yes", VERCEL, ...args, "--project", project, "--scope", targets.scope, "--non-interactive"], {
    cwd: root, env, stdio: "inherit",
  });
  if (result.error || result.status !== 0) throw new Error(`Vercel ${args[0]} failed for ${project}. See wedding-site/DEPLOYMENT.md for setup.`);
}

// Vercel shares these local files between projects. Restore the original link
// and settings even after a failed build. Each target gets its own pulled copy.
const files = [".vercel/project.json", ".vercel/.env.production.local"];
const snapshot = () => files.map((file) => {
  const full = path.join(root, file);
  return existsSync(full) ? readFileSync(full) : null;
});
const restore = (contents) => files.forEach((file, i) => {
  const full = path.join(root, file);
  if (contents[i] === null) rmSync(full, { force: true });
  else writeFileSync(full, contents[i], { mode: 0o600 });
});
const original = snapshot();
const prepared = [];
const completed = [];
try {
  // Validate BOTH before uploading either. Explicit project and team flags avoid
  // accidentally deploying the full invitation onto the public domain.
  for (const name of names) {
    const target = targets[name];
    console.log(`Checking ${name}: ${target.project} → ${target.url}`);
    vercel(target.project, ["pull", "--yes", "--environment=production"]);
    const state = snapshot();
    if (!state[0] || !state[1]) throw new Error(`Missing pulled settings for ${target.project}.`);
    const settings = JSON.parse(state[0].toString());
    if (settings.projectName && settings.projectName !== target.project) throw new Error(`Project mismatch for ${target.project}.`);
    const env = parseEnv(state[1].toString());
    if (env.SITE_VARIANT !== name) throw new Error(`Set SITE_VARIANT=${name} in ${target.project} → Settings → Environment Variables → Production.`);
    if (env.NEXT_PUBLIC_SITE_URL !== target.url) throw new Error(`Set NEXT_PUBLIC_SITE_URL=${target.url} in ${target.project} (Production).`);
    if (name === "test" && (env.TEST_SITE_PASSWORD || "").length < 16) throw new Error("Set TEST_SITE_PASSWORD (at least 16 characters) in wedding-site-test (Production).");
    prepared.push({ name, target, state, env });
  }
  if (checkOnly) console.log("Both selected project settings are ready. Nothing was deployed.");
  else {
    for (const { name, target, state, env } of prepared) {
      console.log(`Building and deploying ${name}: ${target.url}`);
      restore(state);
      // Empty optional values stop .env.local from leaking development database
      // or Sheet settings into a target that deliberately leaves them unset.
      const buildEnv = {
        ...process.env,
        TURSO_DATABASE_URL: "", TURSO_AUTH_TOKEN: "",
        RSVP_SHEET_URL: "", RSVP_SHEET_SECRET: "", RSVP_SHEET_VIEW_URL: "",
        ADMIN_PASSWORD: "", ADMIN_SESSION_SECRET: "", TEST_SITE_PASSWORD: "",
        ...env,
        VERCEL_ENV: "production",
      };
      vercel(target.project, ["build", "--prod"], { env: buildEnv });
      vercel(target.project, ["deploy", "--prebuilt", "--prod", "--yes", "--meta", `commit=${commit}`, "--meta", `siteVariant=${name}`]);
      completed.push(target.url);
    }
    console.log(`Deployed ${commit}: ${completed.join(" and ")}`);
  }
} catch (error) {
  console.error(error.message);
  if (completed.length) console.error(`Already deployed: ${completed.join(", ")}. The two projects are separate releases; rerun the failed target with deploy:public or deploy:test.`);
  process.exitCode = 1;
} finally {
  try { restore(original); } finally { rmSync(lock, { recursive: true, force: true }); }
}
