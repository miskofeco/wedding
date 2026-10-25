import { test } from "node:test";
import assert from "node:assert/strict";
import { fold, linkAnswers, parseBulk, peopleComing, repliesByDay, summarize, toCsv, type Invite, type StoredAnswer } from "../src/lib/records.ts";

const answer = (over: Partial<StoredAnswer>): StoredAnswer => ({
  id: "a1",
  submittedAt: "2026-10-03T10:00:00.000Z",
  updatedAt: "2026-10-03T10:00:00.000Z",
  source: "web",
  inviteId: null,
  sheetPending: false,
  name: "Jana Nováková",
  attending: true,
  guests: 2,
  party: ["Jana Nováková", "Peter Novák"],
  kids: [false, true],
  dietary: "",
  message: "",
  ...over,
});
const invite = (over: Partial<Invite>): Invite => ({
  id: "i1",
  createdAt: "",
  updatedAt: "",
  household: "Novákovci",
  members: ["Jana Novakova"],
  expected: 3,
  side: "bride",
  group: "",
  contact: "",
  note: "",
  remindedAt: null,
  sheetPending: false,
  ...over,
});

test("fold ignores case, diacritics and extra spaces", () => {
  assert.equal(fold("  Ján   NOVÁK "), "jan novak");
});

test("answers link to invitations by name, unless assigned by hand", () => {
  const invites = [invite({}), invite({ id: "i2", household: "Kováčovci", members: ["Eva Kováčová"] })];
  const byName = linkAnswers([answer({})], invites);
  assert.equal(byName.inviteOf.get("a1"), "i1");
  assert.equal(byName.how.get("a1"), "name");
  const manual = linkAnswers([answer({ inviteId: "i2" })], invites);
  assert.equal(manual.inviteOf.get("a1"), "i2");
  // A name on two invitations is ambiguous: no automatic link.
  const twice = linkAnswers([answer({})], [invite({}), invite({ id: "i3", members: ["Jana Nováková"] })]);
  assert.equal(twice.inviteOf.has("a1"), false);
});

test("summary counts people, kids, waiting households and sides", () => {
  const invites = [invite({}), invite({ id: "i2", household: "Kováčovci", members: [], expected: 2, side: "groom" })];
  const s = summarize([answer({}), answer({ id: "a2", name: "Cudzí Hosť", attending: false, guests: 0, party: [], kids: [] })], invites);
  assert.equal(s.guests, 2);
  assert.equal(s.kids, 1);
  assert.equal(s.adults, 1);
  assert.equal(s.waitingHouseholds, 1);
  assert.equal(s.waitingPeople, 2);
  assert.deepEqual(s.sides.bride, { invited: 3, coming: 2, declined: 1, waiting: 0 });
  assert.deepEqual(s.sides.groom, { invited: 2, coming: 0, declined: 0, waiting: 2 });
  assert.equal(s.sides.none.declined, 1);
  assert.equal(s.unlinked, 1);
});

test("replies by day fill the gaps and keep a running total", () => {
  const days = repliesByDay(
    [answer({}), answer({ id: "a2", submittedAt: "2026-10-05T22:30:00.000Z", guests: 1, party: ["X Y"], kids: [false] })],
    new Date("2026-10-06T08:00:00Z"),
  );
  // 22:30 UTC on 5 Oct is already 6 Oct in Slovakia (summer time).
  assert.deepEqual(
    days.map((d) => [d.day, d.people]),
    [
      ["2026-10-03", 2],
      ["2026-10-04", 2],
      ["2026-10-05", 2],
      ["2026-10-06", 3],
    ],
  );
});

test("people coming: one row per person", () => {
  const people = peopleComing([answer({})], []);
  assert.deepEqual(
    people.map((p) => [p.name, p.kid]),
    [
      ["Jana Nováková", false],
      ["Peter Novák", true],
    ],
  );
});

test("CSV neutralises formulas and quotes separators", () => {
  const csv = toCsv([["=1+1", "a;b", 'say "hi"']]);
  assert.equal(csv, '﻿\'=1+1;"a;b";"say ""hi"""\r\n');
});

test("bulk entry reads counts and name lists", () => {
  const items = parseBulk("Novákovci; 4\nJán Kováč, Eva Kováčová\n\nx", "groom", "Rodina");
  assert.deepEqual(
    items.map((i) => [i.household, i.expected, i.members.length, i.side, i.group]),
    [
      ["Novákovci", 4, 0, "groom", "Rodina"],
      ["Ján Kováč", 2, 2, "groom", "Rodina"],
    ],
  );
});
