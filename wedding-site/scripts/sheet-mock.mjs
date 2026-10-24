// Local stand-in for the Google Sheet: runs the real google-sheet/Code.gs
// against an in-memory sheet, so the RSVP form and /admin work offline.
//
//   RSVP_SHEET_SECRET=dev-secret npm run sheet:mock          → http://localhost:8790
//   then in .env.local: RSVP_SHEET_URL=http://localhost:8790  (dev server only)
//
// Optional: --port 8790, --tls cert.pem key.pem (HTTPS, for testing `next start`).
// Data lives in memory and disappears when the process stops.
import { readFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import vm from "node:vm";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i === -1 ? null : args.slice(i + 1, i + 3); };
const port = Number(opt("port")?.[0] ?? 8790);
const tls = opt("tls");
const secret = process.env.RSVP_SHEET_SECRET;
if (!secret) { console.error("Set RSVP_SHEET_SECRET (the same value the site uses)."); process.exit(1); }

// --- minimal fakes of the Apps Script services Code.gs uses ---
const sheets = new Map();
const textValue = (v) => { const s = String(v); return s.startsWith("'") ? s.slice(1) : s; }; // Sheets hides the apostrophe
function makeSheet() {
  const rows = [];
  const range = (r, c, nr, nc) => ({
    setValues(vals) { vals.forEach((row, i) => { rows[r - 1 + i] ??= []; row.forEach((v, j) => (rows[r - 1 + i][c - 1 + j] = textValue(v))); }); return this; },
    setNumberFormat() { return this; },
    getValues() { return rows.slice(r - 1, r - 1 + nr).map((row) => Array.from({ length: nc }, (_, j) => row[c - 1 + j] ?? "")); },
  });
  return {
    getRange(r, c, nr, nc) { return typeof r === "string" ? range(1, 1, 0, 0) : range(r, c, nr ?? 1, nc ?? 1); },
    appendRow(vals) { rows.push(vals.map(textValue)); },
    getDataRange() { const w = Math.max(0, ...rows.map((r) => r.length)); return range(1, 1, rows.length, w); },
    deleteRow(n) { rows.splice(n - 1, 1); },
    setFrozenRows() {},
  };
}
const context = vm.createContext({
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: (n) => sheets.get(n) ?? null, insertSheet: (n) => { const s = makeSheet(); sheets.set(n, s); return s; } }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k === "RSVP_SECRET" ? secret : null) }) },
  ContentService: { MimeType: { JSON: "json" }, createTextOutput: (s) => ({ setMimeType() { return this; }, getContent: () => s }) },
  Utilities: { getUuid: () => randomUUID() },
  JSON, Date, String, Number, Math, Object, Array,
});
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
vm.runInContext(readFileSync(path.join(root, "google-sheet/Code.gs"), "utf8"), context);

const handler = (req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const out = req.method === "POST" ? context.doPost({ postData: { contents: body } }) : context.doGet();
    const text = out.getContent();
    const action = (() => { try { return JSON.parse(body).action; } catch { return "-"; } })();
    console.log(`${req.method} ${action ?? "-"} → ${JSON.parse(text).ok ? "ok" : JSON.parse(text).error}`); // never logs answers
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(text);
  });
};
const server = tls ? https.createServer({ cert: readFileSync(tls[0]), key: readFileSync(tls[1]) }, handler) : http.createServer(handler);
server.listen(port, "127.0.0.1", () => console.log(`Sheet mock on ${tls ? "https" : "http"}://localhost:${port} (in memory)`));
