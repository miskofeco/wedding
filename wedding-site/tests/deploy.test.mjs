// Exercise the release command in a disposable checkout with a simulated CLI.
// No requests reach Vercel and no real deployment settings are read.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function release(args = [], overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), "wedding-deploy-test-"));
  try {
    mkdirSync(join(root, "scripts"));
    mkdirSync(join(root, ".bin"));
    mkdirSync(join(root, ".vercel"));
    copyFileSync(new URL("../scripts/deploy.mjs", import.meta.url), join(root, "scripts/deploy.mjs"));
    copyFileSync(new URL("../deploy-targets.json", import.meta.url), join(root, "deploy-targets.json"));
    writeFileSync(join(root, ".nvmrc"), process.versions.node.split(".")[0]);
    writeFileSync(join(root, ".gitignore"), ".vercel/\n.bin/\ncalls.jsonl\n");
    writeFileSync(join(root, ".vercel/project.json"), '{"original":true}');
    writeFileSync(join(root, ".vercel/.env.production.local"), 'ORIGINAL="keep-this"\n');
    writeFileSync(join(root, ".bin/npx"), `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
const command = args[2];
const project = args[args.indexOf("--project") + 1];
const variant = project.endsWith("-test") ? "test" : "public";
fs.appendFileSync("calls.jsonl", JSON.stringify({ command, project, args, variant: process.env.SITE_VARIANT, db: process.env.TURSO_DATABASE_URL }) + "\\n");
if (process.env.FAIL_COMMAND === command && process.env.FAIL_TARGET === variant) process.exit(1);
if (command === "pull") {
  fs.writeFileSync(".vercel/project.json", JSON.stringify({projectName: project}));
  const values = { SITE_VARIANT: process.env.BAD_VARIANT === variant ? "wrong" : variant,
    NEXT_PUBLIC_SITE_URL: variant === "test" ? "https://test.baskamisko.sk" : "https://www.baskamisko.sk",
    TEST_SITE_PASSWORD: process.env.MISSING_PASSWORD ? "" : "test-fixture-password" };
  if (variant === "public") values.TURSO_DATABASE_URL = "libsql://fixture-production";
  fs.writeFileSync(".vercel/.env.production.local", Object.entries(values).map(([k,v]) => k + "=" + JSON.stringify(v)).join("\\n"));
}
`, { mode: 0o755 });
    const git = (...args) => execFileSync("git", args, { cwd: root, stdio: "ignore" });
    git("init", "-b", "main");
    git("add", ".");
    git("-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-m", "Fixture");
    git("config", "branch.main.remote", ".");
    git("config", "branch.main.merge", "refs/heads/main");
    if (overrides.HOLD_LOCK) mkdirSync(join(root, ".vercel/deploy.lock"));
    const result = spawnSync(process.execPath, ["scripts/deploy.mjs", ...args], {
      cwd: root, encoding: "utf8",
      env: { ...process.env, PATH: `${join(root, ".bin")}:${process.env.PATH}`, TURSO_DATABASE_URL: "libsql://unwanted-local", ...overrides },
    });
    assert.equal(readFileSync(join(root, ".vercel/project.json"), "utf8"), '{"original":true}');
    assert.equal(readFileSync(join(root, ".vercel/.env.production.local"), "utf8"), 'ORIGINAL="keep-this"\n');
    assert.equal(existsSync(join(root, ".vercel/deploy.lock")), Boolean(overrides.HOLD_LOCK), "release cleans up its own lock and preserves another release's lock");
    const calls = existsSync(join(root, "calls.jsonl")) ? readFileSync(join(root, "calls.jsonl"), "utf8").trim().split("\n").map(JSON.parse) : [];
    return { ...result, calls };
  } finally { rmSync(root, { recursive: true, force: true }); }
}

test("one release validates both projects, builds with isolated settings and deploys the same commit", () => {
  const result = release();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.calls.map((c) => [c.command, c.project]), [
    ["pull", "wedding-site-test"], ["pull", "wedding-site"],
    ["build", "wedding-site-test"], ["deploy", "wedding-site-test"],
    ["build", "wedding-site"], ["deploy", "wedding-site"],
  ]);
  const builds = result.calls.filter((c) => c.command === "build");
  assert.deepEqual(builds.map((c) => [c.variant, c.db]), [["test", ""], ["public", "libsql://fixture-production"]]);
  const deploys = result.calls.filter((c) => c.command === "deploy");
  assert.equal(deploys[0].args.find((a) => a.startsWith("commit=")), deploys[1].args.find((a) => a.startsWith("commit=")));
  assert.ok(deploys.every((c) => c.args.includes("--prod") && c.args.includes("--prebuilt")));
});

test("missing password or wrong public variant stops before either project is built or deployed", () => {
  for (const overrides of [{ MISSING_PASSWORD: "1" }, { BAD_VARIANT: "public" }]) {
    const result = release([], overrides);
    assert.equal(result.status, 1);
    assert.ok(result.calls.every((c) => c.command === "pull"));
  }
});

test("setup check never builds or deploys; a single-target release selects only that project", () => {
  const check = release(["--check"]);
  assert.equal(check.status, 0, check.stderr);
  assert.deepEqual(check.calls.map((c) => c.command), ["pull", "pull"]);
  const single = release(["--only=public"]);
  assert.equal(single.status, 0, single.stderr);
  assert.ok(single.calls.every((c) => c.project === "wedding-site"));
});

test("a failed later release reports the already deployed test site and restores local settings", () => {
  const result = release([], { FAIL_COMMAND: "build", FAIL_TARGET: "public" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Already deployed: https:\/\/test.baskamisko.sk/);
  assert.equal(result.calls.filter((c) => c.command === "deploy").length, 1);
});

test("an overlapping release stops before touching project settings or build output", () => {
  const result = release([], { HOLD_LOCK: "1" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /another deploy\/check/);
  assert.deepEqual(result.calls, []);
});
