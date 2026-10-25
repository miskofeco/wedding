// google-sheet/Code.gs, run against the same in-memory fakes as `npm run sheet:mock`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCodeGs } from "../scripts/sheet-fake.mjs";

const secret = "test-secret";
const answer = { name: "Jana Nováková", attending: true, guests: 2, party: ["Jana Nováková", "Peter Novák"], kids: [false, true], dietary: "", message: "" };
const key = "6f9619ff-8b86-d011-b42d-00c04fc964ff";

test("refuses a wrong or missing secret", () => {
  const gs = loadCodeGs({ secret });
  assert.deepEqual(gs.post({ secret: "nope", action: "list" }), { ok: false, error: "unauthorized" });
  assert.deepEqual(gs.post({ action: "list" }), { ok: false, error: "unauthorized" });
  assert.deepEqual(gs.post("not json"), { ok: false, error: "bad_request" });
});

test("a retry with the same key stores the answer once", () => {
  const gs = loadCodeGs({ secret });
  const first = gs.post({ secret, action: "create", answer, source: "web", submission: key });
  const retry = gs.post({ secret, action: "create", answer, source: "web", submission: key });
  assert.ok(first.ok && retry.ok);
  assert.equal(retry.id, first.id);
  assert.equal(gs.post({ secret, action: "list" }).answers.length, 1);

  // A different key, or none, is a new answer.
  gs.post({ secret, action: "create", answer, source: "web", submission: "7f9619ff-8b86-d011-b42d-00c04fc964ff" });
  gs.post({ secret, action: "create", answer, source: "admin" });
  assert.equal(gs.post({ secret, action: "list" }).answers.length, 3);
});

test("round-trips an answer, and edits keep the key", () => {
  const gs = loadCodeGs({ secret });
  const { id } = gs.post({ secret, action: "create", answer, source: "web", submission: key });
  const [stored] = gs.post({ secret, action: "list" }).answers;
  assert.equal(stored.name, "Jana Nováková");
  assert.deepEqual(stored.party, answer.party);
  assert.deepEqual(stored.kids, [false, true]);
  assert.equal(stored.guests, 2);

  assert.ok(gs.post({ secret, action: "update", id, answer: { ...answer, message: "Ahoj" } }).ok);
  const [edited] = gs.post({ secret, action: "list" }).answers;
  assert.equal(edited.message, "Ahoj");
  assert.equal(edited.submission, key);
  assert.ok(gs.post({ secret, action: "delete", id }).ok);
  assert.deepEqual(gs.post({ secret, action: "delete", id }), { ok: false, error: "not_found" });
});

test("guest text that looks like a formula is stored as text", () => {
  const gs = loadCodeGs({ secret });
  gs.post({ secret, action: "create", answer: { ...answer, attending: false, guests: 0, party: [], kids: [], message: "=IMPORTXML(1)" } });
  const sheet = gs.sheets.get("Odpovede");
  // The fake strips the apostrophe as Sheets displays it; check it was written.
  assert.ok(sheet.rows[1].includes("=IMPORTXML(1)"));
});

test("rejects answers that don't add up", () => {
  const gs = loadCodeGs({ secret });
  assert.deepEqual(gs.post({ secret, action: "create", answer: { ...answer, guests: 3 } }), { ok: false, error: "invalid" });
  assert.deepEqual(gs.post({ secret, action: "create", answer: { ...answer, name: "J" } }), { ok: false, error: "invalid" });
});

test("e-mails a summary for web answers when NOTIFY_EMAIL is set", () => {
  const gs = loadCodeGs({ secret, notifyEmail: "couple@example.com" });
  gs.post({ secret, action: "create", answer, source: "web", submission: key });
  gs.post({ secret, action: "create", answer, source: "web", submission: key }); // the retry sends nothing
  gs.post({ secret, action: "create", answer, source: "admin" });
  assert.deepEqual(gs.mails, [{ to: "couple@example.com", subject: "Nová odpoveď: Jana Nováková" }]);
  assert.equal(loadCodeGs({ secret }).mails.length, 0);
});

test("adds headers missing from an older sheet", () => {
  const gs = loadCodeGs({ secret });
  gs.post({ secret, action: "create", answer });
  const sheet = gs.sheets.get("Odpovede");
  sheet.rows[0].splice(-2); // an old sheet: no „Dospelý / dieťa“ or „Kľúč odoslania“ yet
  gs.post({ secret, action: "list" });
  assert.deepEqual(sheet.rows[0].slice(-2), ["Dospelý / dieťa", "Kľúč odoslania"]);
});
