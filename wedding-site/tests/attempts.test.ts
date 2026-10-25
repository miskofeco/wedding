import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "svadba-attempts-"));
process.env.TURSO_DATABASE_URL = `file:${join(dir, "test.db")}`;
const { createAttemptLimiter } = await import("../src/lib/attempts.ts");
const { db } = await import("../src/lib/db.ts");

test.after(async () => {
  (await db()).close();
  rmSync(dir, { recursive: true, force: true });
});

const WINDOW_MS = 15 * 60 * 1000;

test("blocks after 8 tries per address and clears after the window", async () => {
  let now = 1_800_000_000_000;
  const limit = createAttemptLimiter(8, WINDOW_MS, () => now);
  for (let i = 0; i < 8; i++) assert.ok(await limit.attempt("203.0.113.7"), `try ${i + 1}`);
  assert.ok(!(await limit.attempt("203.0.113.7")));
  assert.ok(await limit.attempt("203.0.113.8"), "another address has its own count");

  now += WINDOW_MS + 1;
  assert.ok(await limit.attempt("203.0.113.7"));
});

test("a second instance sees the same count", async () => {
  const now = 1_900_000_000_000;
  const one = createAttemptLimiter(2, WINDOW_MS, () => now);
  const two = createAttemptLimiter(2, WINDOW_MS, () => now);
  assert.ok(await one.attempt("198.51.100.1"));
  assert.ok(await two.attempt("198.51.100.1"));
  assert.ok(!(await one.attempt("198.51.100.1")));
  await two.clear("198.51.100.1");
  assert.ok(await one.attempt("198.51.100.1"));
});

test("no address is stored, only its hash", async () => {
  const { rows } = await (await db()).execute("SELECT key FROM login_attempts");
  assert.ok(rows.length > 0);
  for (const r of rows) assert.match(String(r.key), /^[0-9a-f]{64}$/);
});
