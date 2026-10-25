import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "svadba-store-"));
process.env.TURSO_DATABASE_URL = `file:${join(dir, "test.db")}`;
delete process.env.RSVP_SHEET_URL;
delete process.env.RSVP_SHEET_SECRET;
const { createAnswer, deleteAnswer } = await import("../src/lib/answers.ts");
const { createInvites, deleteInvite } = await import("../src/lib/invites.ts");
const { syncPending } = await import("../src/lib/mirror.ts");
const { db } = await import("../src/lib/db.ts");

test.after(async () => {
  (await db()).close();
  rmSync(dir, { recursive: true, force: true });
});

const count = async (table: "answers" | "invites") =>
  Number((await (await db()).execute(`SELECT COUNT(*) AS n FROM ${table}`)).rows[0].n);

const answer = {
  name: "Test Hosť",
  attending: true,
  guests: 1,
  party: ["Test Hosť"],
  kids: [false],
  dietary: "",
  message: "",
};

test("with no Sheet, a deleted answer leaves the database on the next sync", async () => {
  const created = await createAnswer(answer, "admin");
  assert.ok(created.ok);
  assert.ok((await deleteAnswer(created.data)).ok);
  assert.equal(await count("answers"), 1, "only marked until the sync");

  await syncPending();
  assert.equal(await count("answers"), 0);
});

test("with no Sheet, a deleted invitation leaves the database on the next sync", async () => {
  const created = await createInvites([
    { household: "Testovci", members: ["Test Hosť"], expected: 1, side: "both", group: "", contact: "", note: "" },
  ]);
  assert.ok(created.ok);
  assert.ok((await deleteInvite(created.data[0])).ok);

  await syncPending();
  assert.equal(await count("invites"), 0);
});

test("with no Sheet, rows that weren't deleted stay and keep waiting for one", async () => {
  const created = await createAnswer({ ...answer, name: "Druhý Test" }, "admin");
  assert.ok(created.ok);

  const result = await syncPending();
  assert.equal(result.left, 0);
  const { rows } = await (await db()).execute({ sql: "SELECT sheet_pending FROM answers WHERE id = ?", args: [created.data] });
  assert.equal(Number(rows[0].sheet_pending), 1);
});
