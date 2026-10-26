// Every admin page, export and server action, asked without a cookie, must send
// the visitor to the login; and the action body limit must let the largest real
// payloads through. Builds the site and starts it on a free port with
// throwaway settings (into .next, as `npm run build` does), so it is slow and
// runs on its own: `npm run test:authz`.
// Needs the photos and masks that `npm run build` needs.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const next = join(root, "node_modules", ".bin", "next");

// Empty values win over .env.local, so a checkout with real settings never
// reaches the real database or Sheet from here. No database: the admin
// actions must refuse before they would need one.
const env = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
  ADMIN_PASSWORD: "authz-test-password",
  ADMIN_SESSION_SECRET: "authz-test-secret-authz-test-secret-0",
  TURSO_DATABASE_URL: "",
  TURSO_AUTH_TOKEN: "",
  RSVP_SHEET_URL: "",
  RSVP_SHEET_SECRET: "",
  RSVP_SHEET_VIEW_URL: "",
  VERCEL_ENV: "",
  SITE_VARIANT: "public",
  TEST_SITE_PASSWORD: "",
};

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const server = createServer().listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => (typeof address === "object" && address ? resolve(address.port) : reject(new Error("no port"))));
    });
  });

function run(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(next, args, { cwd: root, env, stdio: ["ignore", "ignore", "inherit"] });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`next ${args.join(" ")} exited with ${code}`))));
  });
}

let server: ChildProcess | null = null;
let base = "";

before(async () => {
  await run(["build"]);
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  // Its own process group, so stopping it stops whatever it started.
  server = spawn(next, ["start", "-p", String(port), "-H", "127.0.0.1"], { cwd: root, env, stdio: "ignore", detached: true });
  const until = Date.now() + 30_000;
  for (;;) {
    try {
      if ((await fetch(`${base}/admin/login`)).ok) return;
    } catch {
      // not listening yet
    }
    if (Date.now() > until) throw new Error("next start did not answer within 30 s");
    await new Promise((r) => setTimeout(r, 250));
  }
});

after(() => {
  if (server?.pid) process.kill(-server.pid);
});

const manifest = (file: string) => JSON.parse(readFileSync(join(root, ".next", file), "utf8"));
const sample: Record<string, string> = { "[part]": "program" };
/** /admin/obsah/[part] → /admin/obsah/program */
const fill = (route: string) => route.replace(/\[[^\]]+\]/g, (s) => sample[s] ?? "x");

const routes = () => Object.values(manifest("app-path-routes-manifest.json") as Record<string, string>);
type Action = { workers: Record<string, unknown>; filename: string; exportedName: string };
/** [action id, where it lives] for every server action in the build. */
const serverActions = () => Object.entries(manifest("server/server-reference-manifest.json").node as Record<string, Action>);

/** GET without following redirects, except the one that adds the `_rsc` cache key to a client navigation. */
async function get(path: string, headers: Record<string, string> = {}) {
  let res = await fetch(base + path, { headers, redirect: "manual" });
  const location = res.headers.get("location");
  if (location && new URL(location, base).searchParams.has("_rsc")) res = await fetch(new URL(location, base), { headers, redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), body: await res.text() };
}

const loginPath = (location: string | null) => (location ? new URL(location, base).pathname : null);

test("every admin page sends a visitor without a cookie to the login, and renders nothing", async () => {
  const pages = routes().filter((r) => r.startsWith("/admin") && r !== "/admin/login" && !r.startsWith("/admin/export"));
  assert.ok(pages.length >= 6, `found ${pages.length} admin pages`);
  for (const page of pages.map(fill)) {
    const plain = await get(page);
    assert.equal(plain.status, 307, page);
    assert.equal(loginPath(plain.location), "/admin/login", page);

    // A client navigation is told to redirect inside the payload; a prefetch gets nothing to show.
    const navigation = await get(page, { RSC: "1" });
    assert.ok(
      loginPath(navigation.location) === "/admin/login" || navigation.body.includes("NEXT_REDIRECT;replace;/admin/login;"),
      `client navigation ${page}: status ${navigation.status}, no redirect to the login`,
    );
    const prefetch = await get(page, { RSC: "1", "Next-Router-Prefetch": "1" });

    // Pages render alongside the layout that refuses them, so each page must refuse on its own too:
    // nothing it renders (every admin page is an `adm-page`) may reach the response.
    for (const [name, res] of Object.entries({ page: plain, "client navigation": navigation, prefetch })) {
      assert.ok(!res.body.includes("adm-page"), `${name} ${page} carries the page's content`);
      assert.ok(!res.body.includes("adm-side"), `${name} ${page} carries the signed-in shell`);
    }
  }
});

test("the exports answer 401 without a cookie", async () => {
  const exports = routes().filter((r) => r.startsWith("/admin/export"));
  assert.equal(exports.length, 1);
  for (const kind of ["odpovede", "pozvani", "hostia", "kuchyna", "x"]) {
    const res = await fetch(`${base}${exports[0].replace("[kind]", kind)}`, { redirect: "manual" });
    assert.equal(res.status, 401, kind);
  }
});

test("every admin server action sends a caller without a cookie to the login", async () => {
  const actions = serverActions();
  const pageRoute: Record<string, string> = manifest("app-path-routes-manifest.json");
  const admin = actions.filter(([, a]) => a.filename === "src/app/admin/actions.ts" && a.exportedName !== "login");
  // A new action shows up here by itself; one missing from the build would go untested.
  const exported = [...readFileSync(join(root, "src/app/admin/actions.ts"), "utf8").matchAll(/^export async function (\w+)/gm)].map((m) => m[1]);
  assert.deepEqual(admin.map(([, a]) => a.exportedName).sort(), exported.filter((n) => n !== "login").sort());

  for (const [id, action] of admin) {
    // Post it to a page that can run it, as the browser would.
    const page = Object.keys(action.workers)
      .map((w) => pageRoute[w.replace(/^app/, "")])
      .find((r) => r && !r.includes("["));
    assert.ok(page, `${action.exportedName} has a page`);
    const res = await fetch(base + page, {
      method: "POST",
      headers: { "Next-Action": id, "Content-Type": "text/plain;charset=UTF-8", Accept: "text/x-component" },
      body: "[]",
      redirect: "manual",
    });
    const redirect = res.headers.get("x-action-redirect");
    assert.ok(redirect, `${action.exportedName}: no redirect (status ${res.status})`);
    assert.equal(redirect.split(";")[0], "/admin/login", action.exportedName);
  }
});

test("action bodies up to the largest real ones reach the action, bigger ones are refused", async () => {
  const actions = serverActions();
  const idOf = (name: string) => actions.find(([, a]) => a.exportedName === name)?.[0] ?? "";
  // Without a cookie, an action that gets to run answers with the login redirect;
  // a body over next.config's bodySizeLimit is refused before that.
  const send = (name: string, page: string, args: unknown[]) =>
    fetch(base + page, {
      method: "POST",
      headers: { "Next-Action": idOf(name), "Content-Type": "text/plain;charset=UTF-8", Accept: "text/x-component" },
      body: JSON.stringify(args),
      redirect: "manual",
    });
  const bytes = (args: unknown[]) => Buffer.byteLength(JSON.stringify(args));

  // 300 households of 20 names each, with diacritics.
  const line = Array.from({ length: 20 }, (_, i) => `Žofia Ďuríčková ${i}`).join(", ");
  const paste = [null, { lines: Array.from({ length: 300 }, () => line).join("\n"), side: "both", group: "Rodina" }];
  // saveSiteContent takes up to 100,000 characters; this is that much of accented text.
  const content = [null, { key: "faq", value: "č".repeat(100_000) }];
  for (const [name, page, args] of [
    ["addInvitesInBulk", "/admin/pozvani", paste],
    ["saveSiteContent", "/admin/obsah/program", content],
  ] as const) {
    const res = await send(name, page, [...args]);
    assert.equal(res.headers.get("x-action-redirect")?.split(";")[0], "/admin/login", `${name} with ${bytes([...args])} bytes: status ${res.status}`);
  }

  // Next refuses an oversized body with an error (500) instead of running the action.
  const sized = (n: number) => [null, { value: "x".repeat(n - 19) }]; // n bytes of JSON
  assert.ok((await send("saveSiteContent", "/admin/obsah/program", sized(256 * 1024 - 100))).headers.has("x-action-redirect"), "just under the limit");
  const over = await send("saveSiteContent", "/admin/obsah/program", sized(256 * 1024 + 100));
  assert.ok(!over.headers.has("x-action-redirect") && over.status >= 400, `just over the limit: status ${over.status}`);
});
