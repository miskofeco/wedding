// RSVP answers: the database is the record, the Google Sheet a copy kept in
// step by `mirrorAnswer`. A write that can't reach the Sheet stays marked
// `sheet_pending` and is retried by the next sync. Server-only.
import "server-only";
import { randomUUID } from "node:crypto";
import type { Row } from "@libsql/client";
import { db, dbConfigured, nowIso } from "./db";
import type { RsvpAnswer } from "./rsvp";
import type { StoredAnswer } from "./records";
import { sheetConfigured, sheetDelete, sheetUpsert } from "./sheet";

export type StoreResult<T = true> = { ok: true; data: T } | { ok: false; error: "not_configured" | "not_found" | "failed" };

const str = (v: unknown) => (typeof v === "string" ? v : "");
const list = <T>(v: unknown, pick: (x: unknown) => T): T[] => {
  try {
    const parsed = JSON.parse(str(v));
    return Array.isArray(parsed) ? parsed.map(pick) : [];
  } catch {
    return [];
  }
};

export function toAnswer(r: Row): StoredAnswer {
  const party = list(r.party, String);
  const kids = list(r.kids, (k) => k === true);
  return {
    id: str(r.id),
    submittedAt: str(r.submitted_at),
    updatedAt: str(r.updated_at),
    source: r.source === "admin" ? "admin" : "web",
    inviteId: str(r.invite_id) || null,
    sheetPending: Number(r.sheet_pending) === 1,
    name: str(r.name),
    attending: Number(r.attending) === 1,
    guests: Number(r.guests) || 0,
    party,
    kids: party.map((_, i) => kids[i] === true),
    dietary: str(r.dietary),
    message: str(r.message),
  };
}

async function guarded<T>(what: string, fn: () => Promise<StoreResult<T>>): Promise<StoreResult<T>> {
  if (!dbConfigured()) return { ok: false, error: "not_configured" };
  try {
    return await fn();
  } catch (err) {
    // The message can carry SQL, never answer data: statements use parameters.
    console.error(`Answers ${what} failed: ${err instanceof Error ? err.message : "unknown error"}`);
    return { ok: false, error: "failed" };
  }
}

export function listAnswers(): Promise<StoreResult<StoredAnswer[]>> {
  return guarded("list", async () => {
    const { rows } = await (await db()).execute("SELECT * FROM answers WHERE deleted_at IS NULL ORDER BY submitted_at DESC");
    return { ok: true, data: rows.map(toAnswer) };
  });
}

const fields = (a: RsvpAnswer) => [
  a.name,
  a.attending ? 1 : 0,
  a.attending ? a.guests : 0,
  JSON.stringify(a.attending ? a.party : []),
  JSON.stringify(a.attending ? a.kids : []),
  a.attending ? a.dietary : "",
  a.message,
];

/**
 * `submission` is the browser's key for this answer: an answer with a key the
 * database has already seen is stored only once, so a retry after a timeout
 * can't add a second row. A deleted answer gives its key up (`deleteAnswer`),
 * so a retry after the couple deleted it is stored again.
 */
export function createAnswer(answer: RsvpAnswer, source: "web" | "admin", submission = "", inviteId: string | null = null) {
  return guarded<string>("create", async () => {
    const client = await db();
    const seen = async () => {
      if (!submission) return null;
      const { rows } = await client.execute({ sql: "SELECT id FROM answers WHERE submission = ? AND deleted_at IS NULL", args: [submission] });
      return rows[0] ? str(rows[0].id) : null;
    };
    const known = await seen();
    if (known) return { ok: true, data: known };
    const id = randomUUID();
    const now = nowIso();
    try {
      await client.execute({
        sql: `INSERT INTO answers (id, submitted_at, updated_at, source, submission, name, attending, guests, party, kids, dietary, message, invite_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, now, now, source, submission || null, ...fields(answer), inviteId],
      });
    } catch (err) {
      // An identical retry inserted it first (the key is unique): that one is this answer.
      const first = await seen();
      if (first) return { ok: true, data: first };
      throw err;
    }
    return { ok: true, data: id };
  });
}

export function updateAnswer(id: string, answer: RsvpAnswer, inviteId: string | null) {
  return guarded("update", async () => {
    const res = await (await db()).execute({
      sql: `UPDATE answers SET name = ?, attending = ?, guests = ?, party = ?, kids = ?, dietary = ?, message = ?,
            invite_id = ?, updated_at = ?, sheet_pending = 1 WHERE id = ? AND deleted_at IS NULL`,
      args: [...fields(answer), inviteId, nowIso(), id],
    });
    return res.rowsAffected ? { ok: true, data: true } : { ok: false, error: "not_found" };
  });
}

/** Assigns an answer to an invitation by hand, or (`null`) lets the names decide again. */
export function setAnswerInvite(id: string, inviteId: string | null) {
  return guarded("assign", async () => {
    const res = await (await db()).execute({
      sql: "UPDATE answers SET invite_id = ?, updated_at = ?, sheet_pending = 1 WHERE id = ? AND deleted_at IS NULL",
      args: [inviteId, nowIso(), id],
    });
    return res.rowsAffected ? { ok: true, data: true } : { ok: false, error: "not_found" };
  });
}

/**
 * Marks the answer deleted; the mirror removes it from the Sheet and then from
 * the database, or from the database at once when no Sheet is connected. Its
 * submission key is cleared, so the guest can send the answer again meanwhile.
 */
export function deleteAnswer(id: string) {
  return guarded("delete", async () => {
    const res = await (await db()).execute({
      sql: "UPDATE answers SET deleted_at = ?, submission = NULL, sheet_pending = 1 WHERE id = ? AND deleted_at IS NULL",
      args: [nowIso(), id],
    });
    return res.rowsAffected ? { ok: true, data: true } : { ok: false, error: "not_found" };
  });
}

/** Copies one answer to the Sheet (or removes it there). True once the Sheet matches the database. */
export async function mirrorAnswer(id: string): Promise<boolean> {
  if (!dbConfigured() || !sheetConfigured()) return false;
  try {
    const client = await db();
    const { rows } = await client.execute({ sql: "SELECT * FROM answers WHERE id = ?", args: [id] });
    const r = rows[0];
    if (!r) return true;
    if (r.deleted_at) {
      const res = await sheetDelete("answers", id);
      if (!res.ok && res.error !== "not_found") return false;
      await client.execute({ sql: "DELETE FROM answers WHERE id = ? AND deleted_at IS NOT NULL", args: [id] });
      return true;
    }
    const a = toAnswer(r);
    const res = await sheetUpsert("answers", {
      id: a.id,
      submittedAt: a.submittedAt,
      updatedAt: a.updatedAt,
      source: a.source,
      submission: str(r.submission),
      invite: a.inviteId ?? "",
      name: a.name,
      attending: a.attending,
      guests: a.guests,
      party: a.party,
      kids: a.kids,
      dietary: a.dietary,
      message: a.message,
    });
    if (!res.ok) return false;
    // Only if nobody edited it meanwhile; otherwise that edit's own mirror (or the next sync) copies it.
    await client.execute({
      sql: "UPDATE answers SET sheet_pending = 0 WHERE id = ? AND updated_at = ? AND deleted_at IS NULL",
      args: [id, a.updatedAt],
    });
    return true;
  } catch (err) {
    console.error(`Answer mirror failed: ${err instanceof Error ? err.message : "unknown error"}`);
    return false;
  }
}

/** Removes every answer marked deleted. Only for when no Sheet is connected, so none waits for one. */
export async function purgeDeletedAnswers(): Promise<number> {
  if (!dbConfigured()) return 0;
  const res = await (await db()).execute("DELETE FROM answers WHERE deleted_at IS NOT NULL");
  return res.rowsAffected;
}

export async function pendingAnswerIds(): Promise<string[]> {
  if (!dbConfigured()) return [];
  const { rows } = await (await db()).execute("SELECT id FROM answers WHERE sheet_pending = 1");
  return rows.map((r) => str(r.id));
}
