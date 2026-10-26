import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "svadba-store-"));
process.env.TURSO_DATABASE_URL = `file:${join(dir, "test.db")}`;
delete process.env.RSVP_SHEET_URL;
delete process.env.RSVP_SHEET_SECRET;
const { createAnswer, deleteAnswer, listAnswers, setAnswerInvite, updateAnswer } = await import("../src/lib/answers.ts");
const { createInvites, deleteInvite, listInvites, markReminded, updateInvite } = await import("../src/lib/invites.ts");
const { syncPending } = await import("../src/lib/mirror.ts");
const { db, migrate } = await import("../src/lib/db.ts");

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

const invite = { household: "Skúškovci", members: ["Prvý Skúška", "Druhá Skúška"], expected: 2, side: "both" as const, group: "", contact: "", note: "" };
const findAnswer = async (id: string) => {
  const listed = await listAnswers();
  assert.ok(listed.ok);
  return listed.data.find((a) => a.id === id);
};
const findInvite = async (id: string) => {
  const listed = await listInvites();
  assert.ok(listed.ok);
  return listed.data.find((i) => i.id === id);
};

test("an answer is created, updated, assigned and deleted", async () => {
  const created = await createAnswer({ ...answer, name: "Tretí Test", dietary: "bez lepku" }, "web");
  assert.ok(created.ok);
  const id = created.data;
  assert.deepEqual(
    { ...(await findAnswer(id)), id: "", submittedAt: "", updatedAt: "" },
    { ...answer, name: "Tretí Test", dietary: "bez lepku", id: "", submittedAt: "", updatedAt: "", source: "web", inviteId: null, sheetPending: true },
  );

  // Declining drops the party and the diet but keeps the message.
  assert.ok((await updateAnswer(id, { ...answer, name: "Tretí Test", attending: false, message: "Prepáčte" }, null)).ok);
  const declined = await findAnswer(id);
  assert.deepEqual([declined?.attending, declined?.guests, declined?.party, declined?.dietary, declined?.message], [false, 0, [], "", "Prepáčte"]);

  assert.ok((await setAnswerInvite(id, "some-invite")).ok);
  assert.equal((await findAnswer(id))?.inviteId, "some-invite");

  assert.ok((await deleteAnswer(id)).ok);
  assert.equal(await findAnswer(id), undefined);
  assert.deepEqual(await deleteAnswer(id), { ok: false, error: "not_found" });
  assert.deepEqual(await updateAnswer(id, answer, null), { ok: false, error: "not_found" });
  assert.deepEqual(await setAnswerInvite(id, null), { ok: false, error: "not_found" });
});

test("an answer sent twice with the same submission key is stored once", async () => {
  const first = await createAnswer({ ...answer, name: "Štvrtý Test" }, "web", "submission-1");
  const again = await createAnswer({ ...answer, name: "Štvrtý Test" }, "web", "submission-1");
  assert.ok(first.ok && again.ok);
  assert.equal(again.data, first.data);
  const { rows } = await (await db()).execute({ sql: "SELECT COUNT(*) AS n FROM answers WHERE submission = ?", args: ["submission-1"] });
  assert.equal(Number(rows[0].n), 1);

  const other = await createAnswer({ ...answer, name: "Štvrtý Test" }, "web", "submission-2");
  assert.ok(other.ok && other.data !== first.data);
});

test("two identical retries at once store one answer and both succeed", async () => {
  const results = await Promise.all([1, 2, 3].map(() => createAnswer({ ...answer, name: "Súbežný Test" }, "web", "submission-race")));
  assert.ok(results.every((r) => r.ok));
  assert.equal(new Set(results.map((r) => r.ok && r.data)).size, 1);
  const { rows } = await (await db()).execute({ sql: "SELECT COUNT(*) AS n FROM answers WHERE submission = ?", args: ["submission-race"] });
  assert.equal(Number(rows[0].n), 1);
});

test("an answer the couple deleted doesn't swallow the guest's retry", async () => {
  const first = await createAnswer({ ...answer, name: "Zmazaný Test" }, "web", "submission-deleted");
  assert.ok(first.ok);
  assert.ok((await deleteAnswer(first.data)).ok);

  // Still in the database until the sync removes it, but no longer holding the key.
  const again = await createAnswer({ ...answer, name: "Zmazaný Test" }, "web", "submission-deleted");
  assert.ok(again.ok);
  assert.notEqual(again.data, first.data);
  assert.ok(await findAnswer(again.data), "the retry is stored");
  assert.equal(await findAnswer(first.data), undefined);
});

test("invitations are created, updated, reminded and deleted", async () => {
  const created = await createInvites([invite, { ...invite, household: "Pokusovci", expected: 1, side: "bride" }]);
  assert.ok(created.ok);
  assert.equal(created.data.length, 2);
  const [id, other] = created.data;
  assert.deepEqual(
    { ...(await findInvite(id)), id: "", createdAt: "", updatedAt: "" },
    { ...invite, id: "", createdAt: "", updatedAt: "", remindedAt: null, sheetPending: true },
  );
  assert.equal((await findInvite(other))?.side, "bride");

  assert.ok((await updateInvite(id, { ...invite, expected: 3, note: "s dieťaťom" })).ok);
  const updated = await findInvite(id);
  assert.deepEqual([updated?.expected, updated?.note], [3, "s dieťaťom"]);

  assert.ok((await markReminded(id, true)).ok);
  assert.ok((await findInvite(id))?.remindedAt);
  assert.ok((await markReminded(id, false)).ok);
  assert.equal((await findInvite(id))?.remindedAt, null);

  assert.ok((await deleteInvite(id)).ok);
  assert.equal(await findInvite(id), undefined);
  assert.ok(await findInvite(other), "the other invitation stays");
  assert.deepEqual(await deleteInvite(id), { ok: false, error: "not_found" });
  assert.deepEqual(await updateInvite(id, invite), { ok: false, error: "not_found" });
});

test("deleting an invitation unlinks the answers assigned to it", async () => {
  const created = await createInvites([{ ...invite, household: "Odpájaní" }]);
  assert.ok(created.ok);
  const [inviteId] = created.data;
  const linked = await createAnswer({ ...answer, name: "Piaty Test" }, "admin", "", inviteId);
  assert.ok(linked.ok);
  await (await db()).execute({ sql: "UPDATE answers SET sheet_pending = 0 WHERE id = ?", args: [linked.data] });

  assert.ok((await deleteInvite(inviteId)).ok);
  const after = await findAnswer(linked.data);
  assert.equal(after?.inviteId, null);
  assert.equal(after?.sheetPending, true, "the Sheet gets the change too");
});

test("migrations run once each, in order, and bump user_version", async () => {
  const { createClient } = await import("@libsql/client/sqlite3");
  const client = createClient({ url: `file:${join(dir, "migrate.db")}` });
  const version = async () => Number((await client.execute("PRAGMA user_version")).rows[0].user_version);
  try {
    await client.execute("CREATE TABLE t (a TEXT)");
    const migrations = ["ALTER TABLE t ADD COLUMN b TEXT", "ALTER TABLE t ADD COLUMN c TEXT"];
    await migrate(client, migrations);
    assert.equal(await version(), 2);

    // Already applied ones are skipped: running ALTER ... ADD COLUMN b again would throw.
    await migrate(client, [...migrations, "ALTER TABLE t ADD COLUMN d TEXT"]);
    assert.equal(await version(), 3);
    const { columns } = await client.execute("SELECT * FROM t");
    assert.deepEqual(columns, ["a", "b", "c", "d"]);

    await migrate(client, []);
    assert.equal(await version(), 3);
  } finally {
    client.close();
  }
});
