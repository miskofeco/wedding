// google-sheet/Code.gs, run against the same in-memory fakes as `npm run sheet:mock`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCodeGs } from "../scripts/sheet-fake.mjs";

const secret = "test-secret";
const row = {
  id: "6f9619ff-8b86-d011-b42d-00c04fc964ff",
  submittedAt: "2027-01-01T10:00:00.000Z",
  updatedAt: "2027-01-01T10:00:00.000Z",
  source: "web",
  name: "Jana Nováková",
  attending: true,
  guests: 2,
  party: ["Jana Nováková", "Peter Novák"],
  kids: [false, true],
  dietary: "",
  message: "",
};
const invite = { id: "inv-1", createdAt: "2027-01-01T10:00:00.000Z", updatedAt: "2027-01-01T10:00:00.000Z", household: "Novákovci", members: ["Jana Nováková", "Peter Novák"], expected: 2, side: "bride", group: "Rodina", contact: "", note: "" };

test("refuses a wrong or missing secret, and unknown tabs", () => {
  const gs = loadCodeGs({ secret });
  assert.deepEqual(gs.post({ secret: "nope", action: "list" }), { ok: false, error: "unauthorized" });
  assert.deepEqual(gs.post({ action: "list" }), { ok: false, error: "unauthorized" });
  assert.deepEqual(gs.post("not json"), { ok: false, error: "bad_request" });
  assert.deepEqual(gs.post({ secret, action: "list", table: "secrets" }), { ok: false, error: "unknown_table" });
});

test("upsert writes a row once per id and updates it in place", () => {
  const gs = loadCodeGs({ secret });
  assert.ok(gs.post({ secret, action: "upsert", row }).ok);
  assert.ok(gs.post({ secret, action: "upsert", row }).ok);
  let rows = gs.post({ secret, action: "list" }).rows;
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].party, row.party);
  assert.deepEqual(rows[0].kids, [false, true]);
  assert.equal(rows[0].guests, 2);

  assert.ok(gs.post({ secret, action: "upsert", row: { ...row, message: "Ahoj" } }).ok);
  rows = gs.post({ secret, action: "list" }).rows;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].message, "Ahoj");

  assert.ok(gs.post({ secret, action: "delete", id: row.id }).ok);
  assert.deepEqual(gs.post({ secret, action: "delete", id: row.id }), { ok: false, error: "not_found" });
});

test("guest text that looks like a formula is stored as text", () => {
  const gs = loadCodeGs({ secret });
  gs.post({ secret, action: "upsert", row: { ...row, attending: false, guests: 0, party: [], kids: [], message: "=IMPORTXML(1)" } });
  // The fake strips the apostrophe as Sheets displays it; check it was written.
  assert.ok(gs.sheets.get("Odpovede").rows[1].includes("=IMPORTXML(1)"));
});

test("rejects answers that don't add up, and rows without an id", () => {
  const gs = loadCodeGs({ secret });
  assert.deepEqual(gs.post({ secret, action: "upsert", row: { ...row, guests: 3 } }), { ok: false, error: "invalid" });
  assert.deepEqual(gs.post({ secret, action: "upsert", row: { ...row, name: "J" } }), { ok: false, error: "invalid" });
  assert.deepEqual(gs.post({ secret, action: "upsert", row: { ...row, id: "" } }), { ok: false, error: "invalid" });
});

test("e-mails a summary for new web answers only, when NOTIFY_EMAIL is set", () => {
  const gs = loadCodeGs({ secret, notifyEmail: "couple@example.com" });
  gs.post({ secret, action: "upsert", row });
  gs.post({ secret, action: "upsert", row: { ...row, message: "edit" } }); // an update sends nothing
  gs.post({ secret, action: "upsert", row: { ...row, id: "other", source: "admin" } });
  assert.deepEqual(gs.mails, [{ to: "couple@example.com", subject: "Nová odpoveď: Jana Nováková" }]);
  assert.equal(loadCodeGs({ secret }).mails.length, 0);
});

test("keeps the guest list in its own tab", () => {
  const gs = loadCodeGs({ secret });
  assert.ok(gs.post({ secret, action: "upsert", table: "invites", row: invite }).ok);
  const [stored] = gs.post({ secret, action: "list", table: "invites" }).rows;
  assert.equal(stored.household, "Novákovci");
  assert.deepEqual(stored.members, invite.members);
  assert.equal(stored.side, "bride");
  assert.equal(gs.sheets.get("Pozvaní").rows[1][6], "nevesta");
  assert.equal(gs.post({ secret, action: "list" }).rows.length, 0);
  assert.deepEqual(gs.post({ secret, action: "upsert", table: "invites", row: { ...invite, expected: 0 } }), { ok: false, error: "invalid" });
});

test("adds headers missing from an older sheet", () => {
  const gs = loadCodeGs({ secret });
  gs.post({ secret, action: "upsert", row });
  const sheet = gs.sheets.get("Odpovede");
  sheet.rows[0].splice(-3); // an old sheet: no „Dospelý / dieťa“, „Kľúč odoslania“ or „Pozvánka“ yet
  gs.post({ secret, action: "list" });
  assert.deepEqual(sheet.rows[0].slice(-3), ["Dospelý / dieťa", "Kľúč odoslania", "Pozvánka"]);
});
