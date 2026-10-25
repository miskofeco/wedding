// The guest list: one row per invitation (household). Same pattern as
// answers.ts: the database is the record, the Sheet tab „Pozvaní“ a copy.
// Server-only.
import { randomUUID } from "node:crypto";
import type { Row } from "@libsql/client";
import { db, dbConfigured, nowIso } from "./db";
import { isSide, type Invite, type InviteInput } from "./records";
import { sheetConfigured, sheetDelete, sheetUpsert } from "./sheet";
import type { StoreResult } from "./answers";

const str = (v: unknown) => (typeof v === "string" ? v : "");

function toInvite(r: Row): Invite {
  let members: string[] = [];
  try {
    const parsed = JSON.parse(str(r.members));
    if (Array.isArray(parsed)) members = parsed.map(String);
  } catch {
    // a broken cell reads as no names
  }
  return {
    id: str(r.id),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
    household: str(r.household),
    members,
    expected: Number(r.expected) || 1,
    side: isSide(r.side) ? r.side : "both",
    group: str(r.grp),
    contact: str(r.contact),
    note: str(r.note),
    remindedAt: str(r.reminded_at) || null,
    sheetPending: Number(r.sheet_pending) === 1,
  };
}

async function guarded<T>(what: string, fn: () => Promise<StoreResult<T>>): Promise<StoreResult<T>> {
  if (!dbConfigured()) return { ok: false, error: "not_configured" };
  try {
    return await fn();
  } catch (err) {
    console.error(`Invites ${what} failed: ${err instanceof Error ? err.message : "unknown error"}`);
    return { ok: false, error: "failed" };
  }
}

export function listInvites() {
  return guarded<Invite[]>("list", async () => {
    const { rows } = await (await db()).execute("SELECT * FROM invites WHERE deleted_at IS NULL ORDER BY household COLLATE NOCASE");
    return { ok: true, data: rows.map(toInvite) };
  });
}

const args = (i: InviteInput) => [i.household, JSON.stringify(i.members), i.expected, i.side, i.group, i.contact, i.note];

export function createInvites(items: InviteInput[]) {
  return guarded<string[]>("create", async () => {
    const now = nowIso();
    const ids = items.map(() => randomUUID());
    await (await db()).batch(
      items.map((i, n) => ({
        sql: `INSERT INTO invites (id, created_at, updated_at, household, members, expected, side, grp, contact, note)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [ids[n], now, now, ...args(i)],
      })),
      "write",
    );
    return { ok: true, data: ids };
  });
}

export function updateInvite(id: string, i: InviteInput) {
  return guarded("update", async () => {
    const res = await (await db()).execute({
      sql: `UPDATE invites SET household = ?, members = ?, expected = ?, side = ?, grp = ?, contact = ?, note = ?,
            updated_at = ?, sheet_pending = 1 WHERE id = ? AND deleted_at IS NULL`,
      args: [...args(i), nowIso(), id],
    });
    return res.rowsAffected ? { ok: true, data: true } : { ok: false, error: "not_found" };
  });
}

/** Records that a reminder went out today (or clears it with `false`). */
export function markReminded(id: string, reminded: boolean) {
  return guarded("remind", async () => {
    const now = nowIso();
    const res = await (await db()).execute({
      sql: "UPDATE invites SET reminded_at = ?, updated_at = ?, sheet_pending = 1 WHERE id = ? AND deleted_at IS NULL",
      args: [reminded ? now : null, now, id],
    });
    return res.rowsAffected ? { ok: true, data: true } : { ok: false, error: "not_found" };
  });
}

/** Marks the invitation deleted; removed from the database like an answer (see `deleteAnswer`). */
export function deleteInvite(id: string) {
  return guarded("delete", async () => {
    const client = await db();
    const res = await client.batch(
      [
        { sql: "UPDATE invites SET deleted_at = ?, sheet_pending = 1 WHERE id = ? AND deleted_at IS NULL", args: [nowIso(), id] },
        // Answers assigned to it by hand go back to matching by name.
        { sql: "UPDATE answers SET invite_id = NULL, sheet_pending = 1 WHERE invite_id = ?", args: [id] },
      ],
      "write",
    );
    return res[0].rowsAffected ? { ok: true, data: true } : { ok: false, error: "not_found" };
  });
}

export async function mirrorInvite(id: string): Promise<boolean> {
  if (!dbConfigured() || !sheetConfigured()) return false;
  try {
    const client = await db();
    const { rows } = await client.execute({ sql: "SELECT * FROM invites WHERE id = ?", args: [id] });
    const r = rows[0];
    if (!r) return true;
    if (r.deleted_at) {
      const res = await sheetDelete("invites", id);
      if (!res.ok && res.error !== "not_found") return false;
      await client.execute({ sql: "DELETE FROM invites WHERE id = ? AND deleted_at IS NOT NULL", args: [id] });
      return true;
    }
    const i = toInvite(r);
    const res = await sheetUpsert("invites", {
      id: i.id,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
      household: i.household,
      members: i.members,
      expected: i.expected,
      side: i.side,
      group: i.group,
      contact: i.contact,
      note: i.note,
      remindedAt: i.remindedAt ?? "",
    });
    if (!res.ok) return false;
    await client.execute({
      sql: "UPDATE invites SET sheet_pending = 0 WHERE id = ? AND updated_at = ? AND deleted_at IS NULL",
      args: [id, i.updatedAt],
    });
    return true;
  } catch (err) {
    console.error(`Invite mirror failed: ${err instanceof Error ? err.message : "unknown error"}`);
    return false;
  }
}

/** Removes every invitation marked deleted. Only for when no Sheet is connected. */
export async function purgeDeletedInvites(): Promise<number> {
  if (!dbConfigured()) return 0;
  const res = await (await db()).execute("DELETE FROM invites WHERE deleted_at IS NOT NULL");
  return res.rowsAffected;
}

export async function pendingInviteIds(): Promise<string[]> {
  if (!dbConfigured()) return [];
  const { rows } = await (await db()).execute("SELECT id FROM invites WHERE sheet_pending = 1");
  return rows.map((r) => str(r.id));
}
