import { test } from "node:test";
import assert from "node:assert/strict";
import { toStoredAnswer } from "../src/lib/sheet.ts";

test("a well-formed row passes through", () => {
  const row = {
    id: "abc",
    submittedAt: "2027-01-01T10:00:00.000Z",
    updatedAt: "2027-01-01T10:00:00.000Z",
    source: "web",
    name: "Jana",
    attending: true,
    guests: 2,
    party: ["Jana", "Peter"],
    kids: [false, true],
    dietary: "",
    message: "",
    submission: "ignored",
  };
  const { submission, ...expected } = row;
  void submission;
  assert.deepEqual(toStoredAnswer(row), expected);
});

test("rows without an id, or not objects, are dropped", () => {
  assert.equal(toStoredAnswer(null), null);
  assert.equal(toStoredAnswer("row"), null);
  assert.equal(toStoredAnswer({ name: "Jana" }), null);
});

test("a hand-edited row is coerced, not trusted", () => {
  const a = toStoredAnswer({ id: "x", name: 42, attending: "áno", guests: "3", party: ["Jana"], kids: "dieťa" });
  assert.deepEqual(a, {
    id: "x",
    submittedAt: "",
    updatedAt: "",
    source: "",
    name: "",
    attending: false,
    guests: 0,
    party: ["Jana"],
    kids: [false],
    dietary: "",
    message: "",
  });
});
