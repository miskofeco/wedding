import { test } from "node:test";
import assert from "node:assert/strict";
import { isPastDeadline, parseRsvp, submissionKey } from "../src/lib/rsvp.ts";

const form = (fields: [string, string][]) => {
  const f = new FormData();
  fields.forEach(([k, v]) => f.append(k, v));
  return f;
};

test("a household that is coming, with every guest named", () => {
  const r = parseRsvp(
    form([
      ["name", "  Jana   Nováková "],
      ["attending", "yes"],
      ["guests", "3"],
      ["party", "Peter Novák"],
      ["party", "Ema Nováková"],
      ["kid-3", "kid"],
      ["dietary", "bezlepková"],
      ["message", "Tešíme sa!\r\nAhoj"],
    ]),
  );
  assert.ok(r.ok);
  assert.deepEqual(r.answer, {
    name: "Jana Nováková",
    attending: true,
    guests: 3,
    party: ["Jana Nováková", "Peter Novák", "Ema Nováková"],
    kids: [false, false, true],
    dietary: "bezlepková",
    message: "Tešíme sa!\nAhoj",
  });
});

test("not coming drops guests and diet", () => {
  const r = parseRsvp(form([["name", "Jana"], ["attending", "no"], ["guests", "4"], ["dietary", "vegánska"]]));
  assert.ok(r.ok);
  assert.equal(r.answer.guests, 0);
  assert.deepEqual(r.answer.party, []);
  assert.equal(r.answer.dietary, "");
});

test("missing answers and unnamed guests are errors", () => {
  const r = parseRsvp(form([["name", "J"], ["attending", "maybe"]]));
  assert.ok(!r.ok);
  assert.ok(r.errors.name && r.errors.attending);

  const r2 = parseRsvp(form([["name", "Jana"], ["attending", "yes"], ["guests", "2"], ["party", " "]]));
  assert.ok(!r2.ok);
  assert.ok(r2.errors["party-2"]);
});

test("guest count is bounded", () => {
  for (const guests of ["0", "11", "abc"]) {
    const r = parseRsvp(form([["name", "Jana"], ["attending", "yes"], ["guests", guests]]));
    assert.ok(!r.ok && r.errors.guests, guests);
  }
});

test("over-long text is refused, control characters are stripped", () => {
  const r = parseRsvp(form([["name", "x".repeat(101)], ["attending", "no"]]));
  assert.ok(!r.ok && r.errors.name);
  const r2 = parseRsvp(form([["name", "Ja\u0000na\u0007"], ["attending", "no"]]));
  assert.ok(r2.ok);
  assert.equal(r2.answer.name, "Jana");
});

test("submission key accepts only a UUID", () => {
  assert.equal(submissionKey(form([["submission", "6F9619FF-8B86-D011-B42D-00C04FC964FF"]])), "6f9619ff-8b86-d011-b42d-00c04fc964ff");
  assert.equal(submissionKey(form([["submission", "=HYPERLINK(1)"]])), "");
  assert.equal(submissionKey(form([])), "");
});

test("deadline closes the day after, in Slovak time", () => {
  assert.equal(isPastDeadline(null), false);
  assert.equal(isPastDeadline("2027-04-30", new Date("2027-04-30T21:59:00Z")), false); // 23:59 in Bratislava
  assert.equal(isPastDeadline("2027-04-30", new Date("2027-04-30T22:00:00Z")), true); // midnight in Bratislava
});
