// The parts of the site the couple edits in /admin: the programme, the
// requests, the FAQ and a few details. Types, limits and validation shared by
// the editors (client) and the save actions (server, authoritative).
import { drawings } from "./art.generated";
import type { DrawingName } from "./art";
import type { Colour, ProgrammeEvent, Question, Request } from "@/content/types";

export interface Details {
  /** ISO day after which the RSVP form closes. */
  deadline: string | null;
  /** Phone or e-mail shown on the RSVP page. */
  contact: string | null;
  /** Shown on the „Sobáš“ panel. */
  churchTime: string | null;
  /** Shown on the „Oslava“ panel. */
  venueTime: string | null;
}

export interface RequestsContent {
  intro: string;
  items: Request[];
}

export interface EditableContent {
  programme: ProgrammeEvent[];
  requests: RequestsContent;
  faq: Question[];
  details: Details;
}

export type ContentKey = keyof EditableContent;
export const CONTENT_KEYS: ContentKey[] = ["programme", "requests", "faq", "details"];

export const CONTENT_LIMITS = {
  programme: 12,
  requests: 6,
  faq: 24,
  title: 60,
  place: 80,
  when: 30,
  text: 320,
  intro: 320,
  question: 160,
  answer: 1500,
  contact: 120,
  playlistNote: 200,
  playlistLabel: 30,
} as const;

/** Drawings that can stand by a programme row or a request: every one with a black version, minus ornaments. */
export const PICTURES = (Object.keys(drawings) as DrawingName[]).filter(
  (n) => (drawings[n] as readonly string[]).includes("black") && n !== "rose-border" && n !== "rose-corner",
);
export const TINTS: Colour[] = ["sage", "peony", "apricot", "butter", "linen", "blue"];
export const TINT_NAMES: Record<Colour, string> = {
  white: "Biela",
  ivory: "Slonovina",
  sage: "Šalviová",
  peony: "Pivonková",
  apricot: "Marhuľová",
  butter: "Masložltá",
  linen: "Ľan",
  blue: "Holubia modrá",
};

export const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9-]{1,40}$/;

export type Checked<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const clean = (v: unknown, multiline = false) =>
  typeof v === "string"
    ? (multiline ? v.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "") : v.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " "))
        .normalize("NFC")
        .trim()
    : "";

class Collector {
  errors: Record<string, string> = {};
  text(path: string, v: unknown, max: number, opts: { required?: string; multiline?: boolean } = {}) {
    const s = clean(v, opts.multiline);
    if (opts.required && s.length === 0) this.errors[path] = opts.required;
    else if (s.length > max) this.errors[path] = `Najviac ${max} znakov (teraz ${s.length}).`;
    return s.slice(0, max);
  }
  time(path: string, v: unknown) {
    const s = clean(v);
    if (s === "") return null;
    if (!TIME.test(s)) this.errors[path] = "Čas v tvare 14:30.";
    return s;
  }
  pick<T extends string>(path: string, v: unknown, allowed: readonly T[], message: string): T {
    if (!allowed.includes(v as T)) this.errors[path] = message;
    return v as T;
  }
  done<T>(value: T): Checked<T> {
    return Object.keys(this.errors).length ? { ok: false, errors: this.errors } : { ok: true, value };
  }
}

function list(c: Collector, v: unknown, max: number): unknown[] {
  if (!Array.isArray(v)) {
    c.errors._ = "Neplatné údaje.";
    return [];
  }
  if (v.length > max) c.errors._ = `Najviac ${max} položiek.`;
  return v.slice(0, max);
}

const id = (c: Collector, path: string, v: unknown) => {
  if (typeof v !== "string" || !ID.test(v)) c.errors[path] = "Neplatné ID.";
  return String(v);
};

function tint(c: Collector, path: string, v: unknown): [Colour, Colour] {
  const pair = Array.isArray(v) ? v : [];
  return [
    c.pick(`${path}.0`, pair[0], TINTS, "Vyberte farbu."),
    c.pick(`${path}.1`, pair[1], TINTS, "Vyberte farbu."),
  ];
}

export function checkProgramme(v: unknown): Checked<ProgrammeEvent[]> {
  const c = new Collector();
  const L = CONTENT_LIMITS;
  const items = list(c, v, L.programme).map((raw, i): ProgrammeEvent => {
    const e = isObj(raw) ? raw : {};
    const relative = c.text(`${i}.relativeTime`, e.relativeTime, L.when);
    const event: ProgrammeEvent = {
      id: id(c, `${i}.id`, e.id),
      title: c.text(`${i}.title`, e.title, L.title, { required: "Napíšte názov." }),
      time: c.time(`${i}.time`, e.time),
      ...(relative ? { relativeTime: relative } : {}),
      place: c.text(`${i}.place`, e.place, L.place),
      description: c.text(`${i}.description`, e.description, L.text, { multiline: true }),
      drawing: c.pick(`${i}.drawing`, e.drawing, PICTURES, "Vyberte obrázok."),
      tint: tint(c, `${i}.tint`, e.tint),
    };
    if (isObj(e.playlist)) {
      const p = e.playlist;
      const url = clean(p.url);
      if (!/^https:\/\/[^\s]+$/.test(url) || url.length > 500) c.errors[`${i}.playlist.url`] = "Odkaz musí začínať https://";
      event.playlist = {
        title: c.text(`${i}.playlist.title`, p.title, L.title, { required: "Napíšte nadpis." }),
        note: c.text(`${i}.playlist.note`, p.note, L.playlistNote),
        label: c.text(`${i}.playlist.label`, p.label, L.playlistLabel, { required: "Napíšte text tlačidla." }),
        url,
      };
    }
    return event;
  });
  if (items.length === 0) c.errors._ = "Program potrebuje aspoň jednu chvíľu.";
  return c.done(items);
}

export function checkRequests(v: unknown): Checked<RequestsContent> {
  const c = new Collector();
  const L = CONTENT_LIMITS;
  const r = isObj(v) ? v : {};
  const intro = c.text("intro", r.intro, L.intro, { multiline: true });
  const items = list(c, r.items, L.requests).map((raw, i): Request => {
    const e = isObj(raw) ? raw : {};
    return {
      id: id(c, `${i}.id`, e.id),
      when: c.text(`${i}.when`, e.when, L.when, { required: "Napíšte, kedy platí." }),
      title: c.text(`${i}.title`, e.title, L.title, { required: "Napíšte nadpis." }),
      text: c.text(`${i}.text`, e.text, L.text, { required: "Napíšte text.", multiline: true }),
      drawing: c.pick(`${i}.drawing`, e.drawing, PICTURES, "Vyberte obrázok."),
      tint: tint(c, `${i}.tint`, e.tint),
    };
  });
  return c.done({ intro, items });
}

export function checkFaq(v: unknown): Checked<Question[]> {
  const c = new Collector();
  const L = CONTENT_LIMITS;
  const items = list(c, v, L.faq).map((raw, i): Question => {
    const e = isObj(raw) ? raw : {};
    const answer = c.text(`${i}.answer`, e.answer, L.answer, { multiline: true });
    return { question: c.text(`${i}.question`, e.question, L.question, { required: "Napíšte otázku." }), answer: answer || null };
  });
  return c.done(items);
}

export function checkDetails(v: unknown, weddingDay: string): Checked<Details> {
  const c = new Collector();
  const d = isObj(v) ? v : {};
  const deadline = clean(d.deadline);
  if (deadline !== "" && (!DAY.test(deadline) || Number.isNaN(Date.parse(`${deadline}T12:00:00Z`))))
    c.errors.deadline = "Dátum v tvare RRRR-MM-DD.";
  else if (deadline > weddingDay) c.errors.deadline = "Termín musí byť pred svadbou.";
  const contact = c.text("contact", d.contact, CONTENT_LIMITS.contact);
  return c.done({
    deadline: deadline || null,
    contact: contact || null,
    churchTime: c.time("churchTime", d.churchTime),
    venueTime: c.time("venueTime", d.venueTime),
  });
}

