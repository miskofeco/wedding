import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { jar } from "./fakes/next-headers.ts";

const dir = mkdtempSync(join(tmpdir(), "svadba-auth-"));
process.env.TURSO_DATABASE_URL = `file:${join(dir, "test.db")}`;
process.env.ADMIN_PASSWORD = "auth-test-password";
process.env.ADMIN_SESSION_SECRET = "auth-test-secret-auth-test-secret-00";
const { isAdmin, revokeSessions, startSession } = await import("../src/lib/auth.ts");
const { readContent } = await import("../src/lib/content.ts");
const { db } = await import("../src/lib/db.ts");

test.after(async () => {
  (await db()).close();
  rmSync(dir, { recursive: true, force: true });
});

const cookie = () => jar.get("bm_admin") ?? "";
const as = (value: string) => {
  jar.clear();
  if (value) jar.set("bm_admin", value);
};

test("„Odhlásiť všetky zariadenia“ signs out the other devices and keeps this one", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse("2027-05-01T10:00:00Z") });
  await startSession();
  const lostPhone = cookie();
  t.mock.timers.tick(60_000);
  await startSession();
  const laptop = cookie();
  as(lostPhone);
  assert.ok(await isAdmin());

  // On the laptop, a minute later: what the action does.
  t.mock.timers.tick(60_000);
  as(laptop);
  assert.ok(await revokeSessions());
  await startSession();
  const signedInAgain = cookie();

  as(signedInAgain);
  assert.ok(await isAdmin(), "this device stays signed in");
  as(laptop);
  assert.ok(!(await isAdmin()), "its old cookie no longer works");
  as(lostPhone);
  assert.ok(!(await isAdmin()), "the lost phone is signed out");

  // Later sign-ins work as usual.
  t.mock.timers.tick(5_000);
  await startSession();
  assert.ok(await isAdmin());
});

test("without a cookie, or with a forged one, nobody is admin", async () => {
  as("");
  assert.ok(!(await isAdmin()));
  as("admin.9999999999.9999999999.forged.signature");
  assert.ok(!(await isAdmin()));
});

test("the cut-off lives beside the site content but never becomes part of it", async () => {
  const { content, updatedAt } = await readContent();
  assert.deepEqual(Object.keys(content).sort(), ["details", "faq", "programme", "requests"]);
  assert.ok(Object.values(updatedAt).every((v) => v === null));
});
