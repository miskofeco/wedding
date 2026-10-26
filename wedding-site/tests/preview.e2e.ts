// Builds both variants with throwaway settings, then checks the real HTTP gate.
// Needs the ignored photos/masks, like npm run build. No live database or Sheet.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { readdirSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const next = join(root, "node_modules/next/dist/bin/next");
const password = "preview-e2e-passphrase";
const authorization = `Basic ${Buffer.from(`test:${password}`).toString("base64")}`;
const env = {
  ...process.env, NEXT_TELEMETRY_DISABLED: "1", VERCEL_ENV: "production",
  TURSO_DATABASE_URL: "", TURSO_AUTH_TOKEN: "", RSVP_SHEET_URL: "", RSVP_SHEET_SECRET: "", RSVP_SHEET_VIEW_URL: "",
  ADMIN_PASSWORD: "preview-admin-password", ADMIN_SESSION_SECRET: "preview-admin-secret-at-least-32-characters",
  TEST_SITE_PASSWORD: password, NEXT_PUBLIC_SITE_URL: "https://test.baskamisko.sk",
};

async function build(variant: string) {
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const child = spawn(process.execPath, [next, "build"], { cwd: root, env: { ...env, SITE_VARIANT: variant }, stdio: ["ignore", "pipe", "inherit"] });
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`build ${variant}: ${code}\n${output}`)));
  });
}

async function start(overrides: Record<string, string> = {}) {
  const port = await new Promise<number>((resolve, reject) => {
    const listener = createServer().listen(0, "127.0.0.1", () => {
      const address = listener.address();
      listener.close(() => typeof address === "object" && address ? resolve(address.port) : reject(new Error("no port")));
    });
    listener.on("error", reject);
  });
  // Deliberately contradict the built variant: protection must be baked in.
  const child: ChildProcess = spawn(process.execPath, [next, "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: root, env: { ...env, SITE_VARIANT: "public", ...overrides }, stdio: "ignore",
  });
  const base = `http://127.0.0.1:${port}`;
  const stop = async () => {
    if (child.exitCode !== null) return;
    await new Promise<void>((resolve) => { child.once("exit", () => resolve()); child.kill(); });
  };
  for (let attempt = 0; attempt < 120; attempt++) {
    try { await fetch(base); return { base, stop }; } catch { /* starting */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  await stop();
  throw new Error("next start did not answer within 30 seconds");
}

test("test deployment protects the invitation, actions, assets and admin on every host", { timeout: 180_000 }, async () => {
  await build("test");
  const server = await start();
  try {
    const staticFile = readdirSync(join(root, ".next/static"), { recursive: true }).find((file) => /\.(js|css)$/.test(String(file)));
    assert.ok(staticFile);
    const asset = `/_next/static/${staticFile}`;
    for (const path of ["/", "/rsvp", "/admin/login", "/admin/export/hostia", "/svadba.ics", "/icon.svg", "/pripravujeme", asset, "/_next/image?url=%2Ficon.svg&w=64&q=75"]) {
      const anonymousHeaders: Record<string, string>[] = [{}, { authorization: "Basic dGVzdDp3cm9uZw==" }, { "next-router-prefetch": "1", RSC: "1" }, { host: "www.baskamisko.sk" }];
      for (const headers of anonymousHeaders) {
        const response = await fetch(server.base + path, { headers, redirect: "manual" });
        assert.equal(response.status, 401, `${path} ${JSON.stringify(headers)}`);
        assert.match(response.headers.get("www-authenticate") || "", /^Basic /);
        assert.match(response.headers.get("cache-control") || "", /no-store/);
      }
    }
    for (const method of ["POST", "HEAD", "OPTIONS"]) {
      const response = await fetch(server.base + "/rsvp", { method, headers: { "Next-Action": "example" }, redirect: "manual" });
      assert.equal(response.status, 401, method);
    }
    const home = await fetch(server.base, { headers: { authorization } });
    assert.equal(home.status, 200);
    assert.match(await home.text(), /href="\/rsvp"/);
    assert.match(home.headers.get("cache-control") || "", /no-store/);
    assert.match(home.headers.get("x-robots-tag") || "", /noindex/);
    const allowedAsset = await fetch(server.base + asset, { headers: { authorization } });
    assert.equal(allowedAsset.status, 200);
    const lockedAgain = await fetch(server.base + asset);
    assert.equal(lockedAgain.status, 401, "authorized assets must not leak to later anonymous requests");
    const admin = await fetch(server.base + "/admin/login", { headers: { authorization } });
    assert.equal(admin.status, 200);
    assert.match(admin.headers.get("content-security-policy") || "", /nonce-/);
    const privateAdmin = await fetch(server.base + "/admin", { headers: { authorization }, redirect: "manual" });
    assert.equal(privateAdmin.status, 307, "the preview password must not grant an admin session");
    assert.equal(new URL(privateAdmin.headers.get("location")!, server.base).pathname, "/admin/login");
  } finally { await server.stop(); }

  const missing = await start({ TEST_SITE_PASSWORD: "" });
  try {
    assert.equal((await fetch(missing.base, { headers: { authorization } })).status, 503);
    assert.equal((await fetch(missing.base + "/icon.svg")).status, 503);
  } finally { await missing.stop(); }
});

test("public production keeps the coming-soon page and the separate admin login", { timeout: 180_000 }, async () => {
  await build("public");
  const server = await start({ NEXT_PUBLIC_SITE_URL: "https://www.baskamisko.sk" });
  try {
    for (const path of ["/", "/rsvp", "/unknown-guest-page"]) {
      const response = await fetch(server.base + path);
      assert.equal(response.status, 200, path);
      assert.match(await response.text(), /class="soon"/);
      assert.equal(response.headers.has("www-authenticate"), false);
    }
    assert.equal((await fetch(server.base + "/admin/login")).status, 200);
    assert.equal((await fetch(server.base + "/icon.svg")).status, 200);
  } finally { await server.stop(); }
});
