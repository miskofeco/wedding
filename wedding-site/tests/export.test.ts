import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { jar } from "./fakes/next-headers.ts";

const dir = mkdtempSync(join(tmpdir(), "svadba-export-"));
process.env.TURSO_DATABASE_URL = `file:${join(dir, "test.db")}`;
delete process.env.RSVP_SHEET_URL;
delete process.env.RSVP_SHEET_SECRET;
process.env.ADMIN_PASSWORD = "export-test-password";
process.env.ADMIN_SESSION_SECRET = "export-test-secret-export-test-secret";
const { GET } = await import("../src/app/admin/export/[kind]/route.ts");
const { createAnswer } = await import("../src/lib/answers.ts");
const { createInvites } = await import("../src/lib/invites.ts");
const { createToken } = await import("../src/lib/session.ts");
const { db } = await import("../src/lib/db.ts");

test.after(async () => {
  (await db()).close();
  rmSync(dir, { recursive: true, force: true });
});

const signIn = () =>
  jar.set("bm_admin", createToken(process.env.ADMIN_SESSION_SECRET!, process.env.ADMIN_PASSWORD!, Math.floor(Date.now() / 1000) + 60));
const get = (kind: string) => GET(new Request(`http://localhost/admin/export/${kind}`), { params: Promise.resolve({ kind }) });

// A guest name that a spreadsheet would run as a formula.
const formula = "=HYPERLINK(\"https://example.invalid\",\"Klik\")";
await createAnswer({ name: formula, attending: true, guests: 1, party: [formula], kids: [false], dietary: "bez lepku", message: "" }, "web");
await createInvites([{ household: "Exportovci", members: [formula], expected: 1, side: "both", group: "", contact: "", note: "" }]);

test("without a signed cookie, no export and no data", async () => {
  jar.clear();
  for (const kind of ["odpovede", "pozvani", "hostia", "kuchyna", "nieco"]) {
    const res = await get(kind);
    assert.equal(res.status, 401);
    assert.ok(!(await res.text()).includes("HYPERLINK"));
  }
  jar.set("bm_admin", "admin.9999999999.forged.signature");
  assert.equal((await get("odpovede")).status, 401);
});

test("signed in, each of the four kinds is a CSV that is never cached", async () => {
  signIn();
  for (const kind of ["odpovede", "pozvani", "hostia", "kuchyna"]) {
    const res = await get(kind);
    assert.equal(res.status, 200, kind);
    assert.equal(res.headers.get("Cache-Control"), "no-store");
    assert.equal(res.headers.get("Content-Type"), "text/csv; charset=utf-8");
    assert.match(res.headers.get("Content-Disposition") ?? "", new RegExp(`^attachment; filename="svadba-.*-${kind}-.*\\.csv"$`));
    const body = await res.text();
    assert.ok(body.includes("HYPERLINK"), `${kind} lists the test row`);
    // Every cell that starts with = is prefixed, so Excel shows it as text.
    assert.ok(!/(^|[;\n"])=/.test(body), `${kind} has no bare formula`);
    assert.ok(body.includes("'=HYPERLINK"), kind);
  }
});

test("any other kind is 404", async () => {
  signIn();
  for (const kind of ["nieco", "ODPOVEDE", "..%2F"]) assert.equal((await get(kind)).status, 404);
});
