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

const TIMEOUT_MS = 10_000;

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

export function createAnswer(answer: RsvpAnswer, source: "web" | "admin" = "web") {
  return call("create", { answer, source }, (r) => String(r.id ?? ""));
}

export function listAnswers() {
  return call("list", {}, (r) => (Array.isArray(r.answers) ? (r.answers as StoredAnswer[]) : []));
}

export function updateAnswer(id: string, answer: RsvpAnswer) {
  return call("update", { id, answer }, () => true);
}

export function deleteAnswer(id: string) {
  return call("delete", { id }, () => true);
}
