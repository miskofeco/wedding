import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONTENT_LIMITS,
  checkDetails,
  checkFaq,
  checkProgramme,
  checkRequests,
  type Checked,
} from "../src/lib/site-content.ts";
import { events } from "../src/content/events.ts";
import { faq } from "../src/content/faq.ts";
import { places } from "../src/content/places.ts";
import { requests, requestsIntro } from "../src/content/requests.ts";
import { rsvp } from "../src/content/rsvp.ts";
import { site } from "../src/content/site.ts";

// What /admin starts from (`defaults` in src/lib/content.ts), built from the same files.
const details = { deadline: rsvp.deadline, contact: rsvp.contact, churchTime: places.church.time, venueTime: places.venue.time };
const clone = <T>(v: T): T => structuredClone(v);

const errors = <T>(checked: Checked<T>) => {
  assert.ok(!checked.ok, "expected the check to fail");
  return checked.errors;
};

test("the defaults from src/content pass and come back unchanged", () => {
  assert.deepEqual(checkProgramme(clone(events)), { ok: true, value: events });
  assert.deepEqual(checkRequests({ intro: requestsIntro, items: clone(requests) }), {
    ok: true,
    value: { intro: requestsIntro, items: requests },
  });
  assert.deepEqual(checkFaq(clone(faq)), { ok: true, value: faq });
  assert.deepEqual(checkDetails(clone(details), site.date), { ok: true, value: details });
});

test("over-long fields are rejected under their path", () => {
  const programme = clone(events);
  programme[1].title = "x".repeat(CONTENT_LIMITS.title + 1);
  assert.match(errors(checkProgramme(programme))["1.title"], /Najviac 60 znakov \(teraz 61\)/);

  const items = clone(requests);
  items[2].text = "x".repeat(CONTENT_LIMITS.text + 1);
  assert.ok(errors(checkRequests({ intro: requestsIntro, items }))["2.text"]);
  assert.ok(errors(checkRequests({ intro: "x".repeat(CONTENT_LIMITS.intro + 1), items: requests })).intro);

  const questions = [{ question: "Otázka?", answer: "x".repeat(CONTENT_LIMITS.answer + 1) }];
  assert.deepEqual(Object.keys(errors(checkFaq(questions))), ["0.answer"]);

  assert.ok(errors(checkDetails({ ...details, contact: "x".repeat(CONTENT_LIMITS.contact + 1) }, site.date)).contact);
});

test("lists longer than their limit are rejected as a whole", () => {
  const many = Array.from({ length: CONTENT_LIMITS.faq + 1 }, (_, i) => ({ question: `Otázka ${i}?`, answer: null }));
  assert.equal(errors(checkFaq(many))._, `Najviac ${CONTENT_LIMITS.faq} položiek.`);
  assert.ok(errors(checkProgramme([]))._, "the programme needs one event");
  assert.ok(errors(checkFaq("not a list"))._);
});

test("unknown drawings and tints are rejected", () => {
  const programme = clone(events);
  (programme[0] as { drawing: string }).drawing = "no-such-drawing";
  (programme[0].tint as string[])[1] = "neon";
  const programmeErrors = errors(checkProgramme(programme));
  assert.deepEqual(Object.keys(programmeErrors).sort(), ["0.drawing", "0.tint.1"]);

  const items = clone(requests);
  (items[0].tint as string[])[0] = "white"; // a colour, but not one a request may use
  (items[1] as { drawing: string }).drawing = "rose-border"; // an ornament, not a picture
  assert.deepEqual(Object.keys(errors(checkRequests({ intro: "", items }))).sort(), ["0.tint.0", "1.drawing"]);
});

test("playlist links must be https", () => {
  for (const url of ["http://open.spotify.com/playlist/x", "javascript:alert(1)", "https://", `https://x.sk/${"a".repeat(500)}`]) {
    const programme = clone(events);
    programme[6].playlist!.url = url;
    assert.deepEqual(Object.keys(errors(checkProgramme(programme))), ["6.playlist.url"], url);
  }
});

test("bad ids and times are rejected under their path", () => {
  const programme = clone(events);
  programme[3].id = "Večera";
  programme[4].time = "25:00";
  assert.deepEqual(Object.keys(errors(checkProgramme(programme))).sort(), ["3.id", "4.time"]);
  assert.ok(errors(checkDetails({ ...details, churchTime: "2 PM" }, site.date)).churchTime);
});

test("the deadline must be a real day before the wedding", () => {
  assert.equal(errors(checkDetails({ ...details, deadline: "2027-05-30" }, "2027-05-29")).deadline, "Termín musí byť pred svadbou.");
  assert.equal(errors(checkDetails({ ...details, deadline: "29. 4. 2027" }, "2027-05-29")).deadline, "Dátum v tvare RRRR-MM-DD.");
  const ok = checkDetails({ ...details, deadline: "2027-04-30" }, "2027-05-29");
  assert.ok(ok.ok && ok.value.deadline === "2027-04-30");
});

test("text is trimmed and control characters are dropped", () => {
  const checked = checkFaq([{ question: "  Kedy\u0000 začíname?\n", answer: "Riadok\r\nďalší\u0007" }]);
  assert.deepEqual(checked, { ok: true, value: [{ question: "Kedy začíname?", answer: "Riadok\nďalší" }] });
});
