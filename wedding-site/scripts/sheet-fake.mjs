// Runs the real google-sheet/Code.gs against minimal in-memory fakes of the
// Apps Script services it uses. Shared by `npm run sheet:mock` and the tests.
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const textValue = (v) => { const s = String(v); return s.startsWith("'") ? s.slice(1) : s; }; // Sheets hides the apostrophe

function makeSheet() {
  const rows = [];
  const range = (r, c, nr, nc) => ({
    setValues(vals) { vals.forEach((row, i) => { rows[r - 1 + i] ??= []; row.forEach((v, j) => (rows[r - 1 + i][c - 1 + j] = textValue(v))); }); return this; },
    setNumberFormat() { return this; },
    getValues() { return rows.slice(r - 1, r - 1 + nr).map((row) => Array.from({ length: nc }, (_, j) => row[c - 1 + j] ?? "")); },
  });
  return {
    rows,
    getRange(r, c, nr, nc) { return typeof r === "string" ? range(1, 1, 0, 0) : range(r, c, nr ?? 1, nc ?? 1); },
    appendRow(vals) { rows.push(vals.map(textValue)); },
    getDataRange() { const w = Math.max(0, ...rows.map((r) => r.length)); return range(1, 1, rows.length, w); },
    getMaxRows() { return Math.max(1000, rows.length); },
    deleteRow(n) { rows.splice(n - 1, 1); },
    setFrozenRows() {},
  };
}

/**
 * @param {{ secret: string, notifyEmail?: string }} options
 * @returns {{ post: (body: object) => any, get: () => any, sheets: Map<string, ReturnType<typeof makeSheet>>, mails: { to: string, subject: string }[] }}
 */
export function loadCodeGs({ secret, notifyEmail }) {
  const sheets = new Map();
  const mails = [];
  const properties = { RSVP_SECRET: secret, NOTIFY_EMAIL: notifyEmail ?? null };
  const context = vm.createContext({
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: (n) => sheets.get(n) ?? null, insertSheet: (n) => { const s = makeSheet(); sheets.set(n, s); return s; } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => properties[k] ?? null }) },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (s) => ({ setMimeType() { return this; }, getContent: () => s }) },
    MailApp: { sendEmail: (to, subject) => mails.push({ to, subject }) },
    Utilities: { getUuid: () => randomUUID() },
    JSON, Date, String, Number, Math, Object, Array,
  });
  vm.runInContext(readFileSync(path.join(root, "google-sheet/Code.gs"), "utf8"), context);
  return {
    post: (body) => JSON.parse(context.doPost({ postData: { contents: typeof body === "string" ? body : JSON.stringify(body) } }).getContent()),
    get: () => JSON.parse(context.doGet().getContent()),
    sheets,
    mails,
  };
}
