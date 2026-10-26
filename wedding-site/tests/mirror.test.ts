import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { createServer, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// A Sheet that misbehaves in the ways Apps Script can: an error status, an HTML
// error page with 200, a refusal, or no answer at all.
type Mode = "ok" | "500" | "html" | "refused" | "hang";
let mode: Mode = "ok";
const hung: ServerResponse[] = [];
const server = createServer((req, res) => {
  req.resume();
  req.on("end", () => {
    if (mode === "hang") return void hung.push(res);
    if (mode === "500") return void res.writeHead(500).end("Internal error");
    if (mode === "html") return void res.writeHead(200, { "Content-Type": "text/html" }).end("<html><body>TypeError: x is undefined</body></html>");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(mode === "refused" ? { ok: false, error: "unauthorized" } : { ok: true }));
  });
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

const dir = mkdtempSync(join(tmpdir(), "svadba-mirror-"));
process.env.TURSO_DATABASE_URL = `file:${join(dir, "test.db")}`;
process.env.RSVP_SHEET_URL = `http://localhost:${(server.address() as AddressInfo).port}`;
process.env.RSVP_SHEET_SECRET = "mirror-test-secret";
const { createAnswer, deleteAnswer } = await import("../src/lib/answers.ts");
const { sheetDelete, sheetUpsert } = await import("../src/lib/sheet.ts");
const { syncPending } = await import("../src/lib/mirror.ts");
const { db } = await import("../src/lib/db.ts");

// The 15 s timeout, shortened so the hanging Sheet fails fast.
const timeout = AbortSignal.timeout.bind(AbortSignal);
mock.method(AbortSignal, "timeout", () => timeout(100));
// The mirror logs each failure; keep the output clean and check no guest data is in it.
const logged = mock.method(console, "error", () => {});

test.after(async () => {
  for (const res of hung) res.destroy();
  server.closeAllConnections();
  server.close();
  (await db()).close();
  rmSync(dir, { recursive: true, force: true });
});

const name = "Zrkadlový Test";
const answer = { name, attending: true, guests: 1, party: [name], kids: [false], dietary: "", message: "" };
const row = async (id: string) =>
  (await (await db()).execute({ sql: "SELECT sheet_pending, deleted_at FROM answers WHERE id = ?", args: [id] })).rows[0];

for (const [failure, error] of [
  ["500", "rejected"],
  ["html", "rejected"],
  ["refused", "rejected"],
  ["hang", "unreachable"],
] as const) {
  test(`a Sheet that answers ${failure} leaves the rows waiting`, async () => {
    mode = "ok";
    const kept = await createAnswer(answer, "web");
    const gone = await createAnswer(answer, "web");
    assert.ok(kept.ok && gone.ok);
    assert.ok((await deleteAnswer(gone.data)).ok);
    logged.mock.resetCalls();

    mode = failure;
    assert.deepEqual(await sheetUpsert("answers", { id: kept.data, name }), { ok: false, error });
    assert.deepEqual(await sheetDelete("answers", gone.data), { ok: false, error });

    const result = await syncPending();
    assert.equal(result.done, 0);
    assert.ok(result.left >= 2);
    assert.equal(Number((await row(kept.data)).sheet_pending), 1);
    const deleted = await row(gone.data);
    assert.ok(deleted, "a deletion the Sheet didn't confirm stays in the database");
    assert.equal(Number(deleted.sheet_pending), 1);

    assert.ok(logged.mock.callCount() > 0);
    for (const call of logged.mock.calls) assert.ok(!String(call.arguments[0]).includes(name), "no guest name in the log");
  });
}

test("once the Sheet answers again, the next sync copies everything", async () => {
  mode = "ok";
  const result = await syncPending();
  assert.equal(result.left, 0);
  const { rows } = await (await db()).execute("SELECT COUNT(*) AS n FROM answers WHERE sheet_pending = 1 OR deleted_at IS NOT NULL");
  assert.equal(Number(rows[0].n), 0);
});
