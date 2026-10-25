// The site's database (libSQL). Production: a Turso database from the Vercel
// Marketplace, reached over HTTPS (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN).
// Development: the same SQL in a local file, `.data/svadba.db` (git-ignored),
// unless TURSO_DATABASE_URL says otherwise. Server-only.
import "server-only";
import type { Client, InStatement } from "@libsql/client";

const LOCAL_URL = "file:.data/svadba.db";

function config(): { url: string; authToken?: string } | null {
  const url = process.env.TURSO_DATABASE_URL ?? "";
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
  if (url.startsWith("libsql://") || url.startsWith("https://")) return { url, authToken };
  // A local file is for development only; production must use the remote database.
  if (process.env.NODE_ENV !== "production") {
    if (url.startsWith("file:")) return { url };
    if (url === "") return { url: LOCAL_URL };
  }
  return null;
}

export function dbConfigured(): boolean {
  return config() !== null;
}

// Tables are created on first use. New columns go in MIGRATIONS (append only), never by editing SCHEMA.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS answers (
    id TEXT PRIMARY KEY,
    submitted_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    source TEXT NOT NULL,
    submission TEXT,
    name TEXT NOT NULL,
    attending INTEGER NOT NULL,
    guests INTEGER NOT NULL,
    party TEXT NOT NULL,
    kids TEXT NOT NULL,
    dietary TEXT NOT NULL,
    message TEXT NOT NULL,
    invite_id TEXT,
    deleted_at TEXT,
    sheet_pending INTEGER NOT NULL DEFAULT 1
  )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS answers_submission ON answers(submission) WHERE submission IS NOT NULL",
  `CREATE TABLE IF NOT EXISTS invites (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    household TEXT NOT NULL,
    members TEXT NOT NULL,
    expected INTEGER NOT NULL,
    side TEXT NOT NULL,
    grp TEXT NOT NULL,
    contact TEXT NOT NULL,
    note TEXT NOT NULL,
    reminded_at TEXT,
    deleted_at TEXT,
    sheet_pending INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS content (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  // Login tries per address (attempts.ts): key is a SHA-256 of the IP, since the window start in ms.
  `CREATE TABLE IF NOT EXISTS login_attempts (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    since INTEGER NOT NULL
  )`,
];
const MIGRATIONS: string[] = [];

let client: Promise<Client> | null = null;

async function open(): Promise<Client> {
  const c = config();
  if (!c) throw new Error("Database is not configured (TURSO_DATABASE_URL)");
  // The HTTP client is plain fetch, so the prebuilt deploy carries no native module.
  // The file client (native) is loaded only for a local file.
  let db: Client;
  if (c.url.startsWith("file:")) {
    const { mkdirSync } = await import("node:fs");
    mkdirSync(".data", { recursive: true });
    db = (await import("@libsql/client/sqlite3")).createClient({ url: c.url });
  } else {
    db = (await import("@libsql/client/http")).createClient(c);
  }
  await db.batch(SCHEMA, "write");
  await migrate(db, MIGRATIONS);
  return db;
}

/** Runs the migrations the database hasn't seen yet; `user_version` counts the ones done. */
export async function migrate(db: Client, migrations: readonly string[]): Promise<void> {
  if (migrations.length === 0) return;
  const { rows } = await db.execute("PRAGMA user_version");
  const version = Number(rows[0]?.user_version ?? 0);
  for (let i = version; i < migrations.length; i++) {
    await db.batch([migrations[i], `PRAGMA user_version = ${i + 1}`], "write");
  }
}

/** The shared client; the first call creates the tables. */
export function db(): Promise<Client> {
  client ??= open().catch((err) => {
    client = null; // try again on the next request
    throw err;
  });
  return client;
}

export async function run(statements: InStatement[]): Promise<void> {
  await (await db()).batch(statements, "write");
}

export const nowIso = () => new Date().toISOString();
