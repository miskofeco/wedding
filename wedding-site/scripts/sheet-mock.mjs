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
import { loadCodeGs } from "./sheet-fake.mjs";

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i === -1 ? null : args.slice(i + 1, i + 3); };
const port = Number(opt("port")?.[0] ?? 8790);
const tls = opt("tls");
const secret = process.env.RSVP_SHEET_SECRET;
if (!secret) { console.error("Set RSVP_SHEET_SECRET (the same value the site uses)."); process.exit(1); }

const script = loadCodeGs({ secret });

const handler = (req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const out = req.method === "POST" ? script.post(body) : script.get();
    const action = (() => { try { return JSON.parse(body).action; } catch { return "-"; } })();
    console.log(`${req.method} ${action ?? "-"} → ${out.ok ? "ok" : out.error}`); // never logs answers
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(out));
  });
};
const server = tls ? https.createServer({ cert: readFileSync(tls[0]), key: readFileSync(tls[1]) }, handler) : http.createServer(handler);
server.listen(port, "127.0.0.1", () => console.log(`Sheet mock on ${tls ? "https" : "http"}://localhost:${port} (in memory)`));
