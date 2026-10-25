// Server-only client for the Google Sheet (google-sheet/Code.gs). Never import
// this from a client component: it reads the shared secret.
import type { RsvpAnswer } from "./rsvp";

export interface StoredAnswer extends RsvpAnswer {
  id: string;
  submittedAt: string;
  updatedAt: string;
  /** "web" from the RSVP form, "admin" when added by hand. */
  source: string;
}

export type SheetResult<T> = { ok: true; data: T } | { ok: false; error: SheetError };
export type SheetError = "not_configured" | "unreachable" | "rejected" | "not_found" | "invalid";

// Longer than Code.gs waits for its lock (8 s), so a slow write still reports back.
const TIMEOUT_MS = 15_000;

function endpoint(): string | null {
  const url = process.env.RSVP_SHEET_URL ?? "";
  if (url.startsWith("https://")) return url;
  // `npm run sheet:mock` serves plain HTTP on localhost; allowed only outside production.
  if (process.env.NODE_ENV !== "production" && url.startsWith("http://localhost:")) return url;
  return null;
}

export function sheetConfigured(): boolean {
  return endpoint() !== null && Boolean(process.env.RSVP_SHEET_SECRET);
}

async function call<T>(action: string, body: Record<string, unknown>, pick: (r: Record<string, unknown>) => T): Promise<SheetResult<T>> {
  const url = endpoint();
  const secret = process.env.RSVP_SHEET_SECRET;
  if (!url || !secret) return { ok: false, error: "not_configured" };
  try {
    // Apps Script answers a POST with a redirect to the result; fetch follows it.
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...body, action, secret }),
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    // Apps Script reports script errors as HTML with status 200, so only a
    // JSON body with ok: true counts as success.
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok || !json) {
      console.error(`Sheet ${action}: HTTP ${res.status}, ${json ? "unexpected body" : "no JSON"}`);
      return { ok: false, error: "rejected" };
    }
    if (json.ok !== true) {
      const error = json.error === "not_found" || json.error === "invalid" ? json.error : "rejected";
      console.error(`Sheet ${action}: ${String(json.error ?? "error")}`);
      return { ok: false, error };
    }
    return { ok: true, data: pick(json) };
  } catch (err) {
    console.error(`Sheet ${action} unreachable: ${err instanceof Error ? err.name : "unknown error"}`);
    return { ok: false, error: "unreachable" };
  }
}

const text = (v: unknown) => (typeof v === "string" ? v : "");

/** One row as the script sent it, checked. A row broken by a hand edit is dropped instead of breaking /admin. */
export function toStoredAnswer(row: unknown): StoredAnswer | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const id = text(r.id);
  if (!id) return null;
  const party = Array.isArray(r.party) ? r.party.map((p) => String(p)) : [];
  const kids = Array.isArray(r.kids) ? r.kids : [];
  return {
    id,
    submittedAt: text(r.submittedAt),
    updatedAt: text(r.updatedAt),
    source: text(r.source),
    name: text(r.name),
    attending: r.attending === true,
    guests: typeof r.guests === "number" && Number.isFinite(r.guests) ? r.guests : 0,
    party,
    kids: party.map((_, i) => kids[i] === true),
    dietary: text(r.dietary),
    message: text(r.message),
  };
}

/**
 * `submission` is the browser's key for this answer: the script stores an answer
 * with a key it has already seen only once, so a retry after a timeout can't
 * add a second row.
 */
export function createAnswer(answer: RsvpAnswer, source: "web" | "admin" = "web", submission = "") {
  return call("create", { answer, source, submission }, (r) => String(r.id ?? ""));
}

export function listAnswers() {
  return call("list", {}, (r) =>
    Array.isArray(r.answers) ? r.answers.map(toStoredAnswer).filter((a): a is StoredAnswer => a !== null) : [],
  );
}

export function updateAnswer(id: string, answer: RsvpAnswer) {
  return call("update", { id, answer }, () => true);
}

export function deleteAnswer(id: string) {
  return call("delete", { id }, () => true);
}
