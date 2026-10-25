// Server-only client for the Google Sheet mirror (google-sheet/Code.gs). Never
// import this from a client component: it reads the shared secret.
import "server-only";

export type SheetResult<T> = { ok: true; data: T } | { ok: false; error: SheetError };
export type SheetError = "not_configured" | "unreachable" | "rejected" | "not_found" | "invalid";
/** The two tabs the script keeps: „Odpovede“ and „Pozvaní“. */
export type SheetTable = "answers" | "invites";

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

/** Writes the row with this id, or appends it. */
export function sheetUpsert(table: SheetTable, row: { id: string } & Record<string, unknown>) {
  return call("upsert", { table, row }, () => true);
}

export function sheetDelete(table: SheetTable, id: string) {
  return call("delete", { table, id }, () => true);
}

/** Every row of a tab, as the script read it. Rows are unchecked: validate before use. */
export function sheetList(table: SheetTable) {
  return call("list", { table }, (r) => (Array.isArray(r.rows) ? (r.rows as unknown[]) : []));
}
