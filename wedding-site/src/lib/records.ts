// Guest records as /admin sees them, and the arithmetic over them: who is
// coming, which invitation an answer belongs to, who still owes a reply.
// Pure and safe for the client (no secrets, no database).
import type { RsvpAnswer } from "./rsvp";

export interface StoredAnswer extends RsvpAnswer {
  id: string;
  submittedAt: string;
  updatedAt: string;
  /** "web" from the RSVP form, "admin" when added by hand. */
  source: "web" | "admin";
  /** The invitation this answer was assigned to by hand; `null` lets the name decide. */
  inviteId: string | null;
  /** Waiting to be copied to the Google Sheet. */
  sheetPending: boolean;
}

export type Side = "bride" | "groom" | "both";
export const SIDES: Record<Side, string> = { bride: "Nevesta", groom: "Ženích", both: "Spoloční" };
export const isSide = (v: unknown): v is Side => v === "bride" || v === "groom" || v === "both";

/** One invitation: a household and how many people it is for. */
export interface Invite {
  id: string;
  createdAt: string;
  updatedAt: string;
  household: string;
  /** The names on the invitation, one per person; may be empty. */
  members: string[];
  expected: number;
  side: Side;
  /** Free label, e.g. „Rodina“, „Práca“, „Susedia“. */
  group: string;
  /** Phone or e-mail for the reminder. */
  contact: string;
  note: string;
  remindedAt: string | null;
  sheetPending: boolean;
}

/** What the invite form edits. */
export type InviteInput = Pick<Invite, "household" | "members" | "expected" | "side" | "group" | "contact" | "note">;

export const INVITE_LIMITS = { household: 100, members: 20, expectedMax: 20, group: 60, contact: 200, note: 500 } as const;

const line = (v: FormDataEntryValue | null, max: number) =>
  typeof v === "string" ? v.normalize("NFC").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";

/** Validates the invite form. Members come one per line in `members`. */
export function parseInvite(form: FormData):
  | { ok: true; invite: InviteInput }
  | { ok: false; errors: Partial<Record<keyof InviteInput, string>> } {
  const household = line(form.get("household"), INVITE_LIMITS.household + 1);
  const membersRaw = form.get("members");
  const members = (typeof membersRaw === "string" ? membersRaw.split(/\r?\n|,/) : [])
    .map((m) => line(m, INVITE_LIMITS.household))
    .filter((m) => m.length > 0);
  const expectedRaw = line(form.get("expected"), 3);
  const expected = expectedRaw === "" ? Math.max(1, members.length) : Number.parseInt(expectedRaw, 10);
  const side = form.get("side");
  const errors: Partial<Record<keyof InviteInput, string>> = {};
  if (household.length < 2) errors.household = "Napíšte meno domácnosti, napríklad „Novákovci“.";
  else if (household.length > INVITE_LIMITS.household) errors.household = `Najviac ${INVITE_LIMITS.household} znakov.`;
  if (members.length > INVITE_LIMITS.members) errors.members = `Najviac ${INVITE_LIMITS.members} mien.`;
  if (!Number.isInteger(expected) || expected < 1 || expected > INVITE_LIMITS.expectedMax)
    errors.expected = `Zadajte počet od 1 do ${INVITE_LIMITS.expectedMax}.`;
  if (!isSide(side)) errors.side = "Vyberte stranu.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    invite: {
      household,
      members,
      expected,
      side: side as Side,
      group: line(form.get("group"), INVITE_LIMITS.group),
      contact: line(form.get("contact"), INVITE_LIMITS.contact),
      note: line(form.get("note"), INVITE_LIMITS.note),
    },
  };
}

/**
 * Bulk entry: one household per line, „Novákovci; 4“ or „Ján Novák, Eva Nováková“.
 * With a number, the text before it is the household; without, the names are the
 * members and the household is the first name.
 */
export function parseBulk(text: string, side: Side, group: string): InviteInput[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/[\u0000-\u001F\u007F]/g, " ").trim())
    .filter((l) => l.length >= 2)
    .slice(0, 300)
    .map((l) => {
      const m = l.match(/^(.*?)[;\t]\s*(\d{1,2})\s*$/);
      const head = (m ? m[1] : l).trim();
      const members = m ? [] : head.split(",").map((s) => s.trim()).filter(Boolean);
      const expected = m ? Number(m[2]) : Math.max(1, members.length);
      return {
        household: (m ? head : members[0] ?? head).slice(0, INVITE_LIMITS.household),
        members: members.slice(0, INVITE_LIMITS.members).map((s) => s.slice(0, INVITE_LIMITS.household)),
        expected: Math.min(INVITE_LIMITS.expectedMax, Math.max(1, expected)),
        side,
        group: group.slice(0, INVITE_LIMITS.group),
        contact: "",
        note: "",
      };
    })
    .filter((i) => i.household.length >= 2);
}

/** Lower case without diacritics, single spaces: „Ján  Novák“ and „jan novak“ match. */
export const fold = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

export type InviteStatus = "coming" | "declined" | "waiting";

export interface Linked {
  /** Answer id → invite id (manual first, then a unique name match). */
  inviteOf: Map<string, string>;
  /** Invite id → its answers. */
  answersOf: Map<string, StoredAnswer[]>;
  /** How each answer got its invite. */
  how: Map<string, "manual" | "name">;
}

/**
 * Matches answers to invitations. An answer assigned by hand keeps its invite;
 * otherwise any of its names (respondent or party) that equals a name on exactly
 * one invitation, or that invitation's household, links it.
 */
export function linkAnswers(answers: StoredAnswer[], invites: Invite[]): Linked {
  const byId = new Map(invites.map((i) => [i.id, i]));
  const byName = new Map<string, Set<string>>();
  for (const inv of invites) {
    for (const n of [inv.household, ...inv.members]) {
      const k = fold(n);
      if (k.length < 2) continue;
      if (!byName.has(k)) byName.set(k, new Set());
      byName.get(k)!.add(inv.id);
    }
  }
  const inviteOf = new Map<string, string>();
  const how = new Map<string, "manual" | "name">();
  for (const a of answers) {
    if (a.inviteId && byId.has(a.inviteId)) {
      inviteOf.set(a.id, a.inviteId);
      how.set(a.id, "manual");
      continue;
    }
    const hits = new Set<string>();
    for (const n of [a.name, ...a.party]) byName.get(fold(n))?.forEach((id) => hits.add(id));
    if (hits.size === 1) {
      inviteOf.set(a.id, [...hits][0]);
      how.set(a.id, "name");
    }
  }
  const answersOf = new Map<string, StoredAnswer[]>();
  for (const a of answers) {
    const id = inviteOf.get(a.id);
    if (!id) continue;
    if (!answersOf.has(id)) answersOf.set(id, []);
    answersOf.get(id)!.push(a);
  }
  return { inviteOf, answersOf, how };
}

export function inviteStatus(answers: StoredAnswer[] | undefined): { status: InviteStatus; coming: number } {
  if (!answers?.length) return { status: "waiting", coming: 0 };
  const coming = answers.filter((a) => a.attending).reduce((n, a) => n + a.guests, 0);
  return { status: coming > 0 ? "coming" : "declined", coming };
}

const kidsIn = (a: StoredAnswer) => (a.attending ? a.kids.filter(Boolean).length : 0);

export interface SideSummary {
  invited: number;
  coming: number;
  declined: number;
  waiting: number;
}

export interface Summary {
  answers: number;
  households: number;
  declinedHouseholds: number;
  guests: number;
  adults: number;
  kids: number;
  diets: number;
  invitedHouseholds: number;
  invitedPeople: number;
  waitingHouseholds: number;
  waitingPeople: number;
  /** Answers not linked to any invitation. */
  unlinked: number;
  /** People per side; answers without an invitation are counted under `none`. */
  sides: Record<Side | "none", SideSummary>;
}

export function summarize(answers: StoredAnswer[], invites: Invite[], linked = linkAnswers(answers, invites)): Summary {
  const coming = answers.filter((a) => a.attending);
  const guests = coming.reduce((n, a) => n + a.guests, 0);
  const kids = coming.reduce((n, a) => n + kidsIn(a), 0);
  const empty = (): SideSummary => ({ invited: 0, coming: 0, declined: 0, waiting: 0 });
  const sides: Summary["sides"] = { bride: empty(), groom: empty(), both: empty(), none: empty() };
  let waitingHouseholds = 0;
  let waitingPeople = 0;
  for (const inv of invites) {
    const s = sides[inv.side];
    s.invited += inv.expected;
    const own = linked.answersOf.get(inv.id);
    const st = inviteStatus(own);
    if (st.status === "waiting") {
      waitingHouseholds++;
      waitingPeople += inv.expected;
      s.waiting += inv.expected;
    } else {
      s.coming += st.coming;
      // People invited but not coming: the declined household, or the part of one that won't come.
      s.declined += Math.max(0, inv.expected - st.coming);
    }
  }
  for (const a of answers) {
    if (linked.inviteOf.has(a.id)) continue;
    if (a.attending) sides.none.coming += a.guests;
    else sides.none.declined += 1;
  }
  return {
    answers: answers.length,
    households: coming.length,
    declinedHouseholds: answers.length - coming.length,
    guests,
    adults: guests - kids,
    kids,
    diets: coming.filter((a) => a.dietary.trim() !== "").length,
    invitedHouseholds: invites.length,
    invitedPeople: invites.reduce((n, i) => n + i.expected, 0),
    waitingHouseholds,
    waitingPeople,
    unlinked: answers.filter((a) => !linked.inviteOf.has(a.id)).length,
    sides,
  };
}

const dayOf = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bratislava" });

/** "YYYY-MM-DD" in Slovak time. */
export const slovakDay = (iso: string | Date) => {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return Number.isNaN(d.getTime()) ? "" : dayOf.format(d);
};

export interface DayCount {
  day: string;
  yes: number;
  no: number;
  /** Running total of people coming, up to and including this day. */
  people: number;
}

/** Replies per day (Slovak time), from the first reply to `until`, with no gaps. */
export function repliesByDay(answers: StoredAnswer[], until = new Date()): DayCount[] {
  if (answers.length === 0) return [];
  const per = new Map<string, { yes: number; no: number; people: number }>();
  for (const a of answers) {
    const d = slovakDay(a.submittedAt);
    if (!d) continue;
    const e = per.get(d) ?? { yes: 0, no: 0, people: 0 };
    if (a.attending) {
      e.yes++;
      e.people += a.guests;
    } else e.no++;
    per.set(d, e);
  }
  const days = [...per.keys()].sort();
  if (days.length === 0) return [];
  const last = [slovakDay(until), days[days.length - 1]].sort()[1];
  const out: DayCount[] = [];
  let total = 0;
  for (let d = new Date(`${days[0]}T12:00:00Z`); ; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const e = per.get(key) ?? { yes: 0, no: 0, people: 0 };
    total += e.people;
    out.push({ day: key, yes: e.yes, no: e.no, people: total });
    if (key >= last || out.length > 1000) break;
  }
  return out;
}

export interface Person {
  name: string;
  kid: boolean;
  /** The respondent who answered for this person. */
  household: string;
  answerId: string;
  dietary: string;
  side: Side | null;
  group: string;
}

/** Everyone coming, one row per person, respondent first in each household. */
export function peopleComing(answers: StoredAnswer[], invites: Invite[], linked = linkAnswers(answers, invites)): Person[] {
  const byId = new Map(invites.map((i) => [i.id, i]));
  return answers
    .filter((a) => a.attending)
    .flatMap((a) => {
      const inv = byId.get(linked.inviteOf.get(a.id) ?? "");
      const names = a.party.length ? a.party : [a.name];
      return names.map((name, i) => ({
        name,
        kid: a.kids[i] === true,
        household: a.name,
        answerId: a.id,
        dietary: a.dietary,
        side: inv?.side ?? null,
        group: inv?.group ?? "",
      }));
    });
}

/** Days from `now` (Slovak date) to an ISO day; negative once it has passed. */
export function daysUntil(isoDay: string, now = new Date()): number {
  const today = Date.parse(`${slovakDay(now)}T00:00:00Z`);
  return Math.round((Date.parse(`${isoDay}T00:00:00Z`) - today) / 86_400_000);
}

/** CSV for Excel and Sheets: BOM, semicolons (Slovak Excel), quoted cells, formulas neutralised. */
export function toCsv(rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n") + "\r\n";
}
