/**
 * RSVP store for the wedding site. Paste into Extensions → Apps Script of the
 * Google Sheet, set the script property RSVP_SECRET, and deploy as a web app
 * (Execute as: Me, Who has access: Anyone). See SETUP.md.
 *
 * Every request is a JSON POST: { secret, action, ... }.
 * Answers: { ok: true, ... } or { ok: false, error }.
 * The site only ever talks to this script from its server; the secret never
 * reaches a browser.
 *
 * Optional script property NOTIFY_EMAIL: an address that gets a short e-mail
 * (name, yes/no, number of guests) for every answer sent from the website.
 */

var SHEET_NAME = 'Odpovede';
// Column order in the sheet. Headers are Slovak for the couple; keys are for the site.
var COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'submittedAt', header: 'Prijaté' },
  { key: 'updatedAt', header: 'Upravené' },
  { key: 'name', header: 'Meno' },
  { key: 'attending', header: 'Príde' },
  { key: 'guests', header: 'Počet hostí' },
  { key: 'party', header: 'Mená hostí' },
  { key: 'dietary', header: 'Strava a alergie' },
  { key: 'message', header: 'Odkaz' },
  { key: 'source', header: 'Zdroj' },
  // Appended last so sheets created before these columns keep their layout.
  { key: 'kids', header: 'Dospelý / dieťa' },
  // The browser's key for one answer: a retry with the same key returns the stored row instead of adding one.
  { key: 'submission', header: 'Kľúč odoslania' }
];
var LIMITS = { name: 100, dietary: 500, message: 1000, guestsMax: 10 };

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var secret = PropertiesService.getScriptProperties().getProperty('RSVP_SECRET');
    if (!secret || !sameText(req.secret, secret)) return reply({ ok: false, error: 'unauthorized' });
    // Shorter than the site's 15 s timeout, so a busy moment ends in an answer, not a timeout.
    lock.waitLock(8000);
    switch (req.action) {
      case 'create': return reply(create(req.answer, req.source === 'admin' ? 'admin' : 'web', req.submission));
      case 'list': return reply({ ok: true, answers: list() });
      case 'update': return reply(update(req.id, req.answer));
      case 'delete': return reply(remove(req.id));
      default: return reply({ ok: false, error: 'unknown_action' });
    }
  } catch (err) {
    return reply({ ok: false, error: 'bad_request' });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return reply({ ok: false, error: 'use_post' });
}

function create(answer, source, submission) {
  var a = clean(answer);
  if (!a) return { ok: false, error: 'invalid' };
  var key = typeof submission === 'string' && /^[0-9a-f-]{36}$/.test(submission) ? submission : '';
  if (key) {
    var stored = findRowBy('submission', key);
    if (stored) return { ok: true, id: stored.answer.id };
  }
  var now = new Date().toISOString();
  var row = { id: Utilities.getUuid(), submittedAt: now, updatedAt: now, source: source, submission: key };
  for (var k in a) row[k] = a[k];
  sheet().appendRow(toRow(row));
  if (source === 'web') notify(row);
  return { ok: true, id: row.id };
}

function list() {
  var values = sheet().getDataRange().getValues();
  var out = [];
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === '' || values[i][0] === null) continue;
    out.push(fromRow(values[i]));
  }
  return out;
}

function update(id, answer) {
  var a = clean(answer);
  if (!a) return { ok: false, error: 'invalid' };
  var found = findRowBy('id', id);
  if (!found) return { ok: false, error: 'not_found' };
  var row = found.answer;
  for (var k in a) row[k] = a[k];
  row.updatedAt = new Date().toISOString();
  sheet().getRange(found.index, 1, 1, COLUMNS.length).setValues([toRow(row)]);
  return { ok: true };
}

function remove(id) {
  var found = findRowBy('id', id);
  if (!found) return { ok: false, error: 'not_found' };
  sheet().deleteRow(found.index);
  return { ok: true };
}

// ---- helpers ----

function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    plainText(sh);
    sh.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS.map(function (c) { return c.header; })]);
    sh.setFrozenRows(1);
  } else {
    // A sheet from before the last columns existed (or one made by hand): add the missing headers.
    var headers = sh.getRange(1, 1, 1, COLUMNS.length).getValues()[0];
    var added = false;
    COLUMNS.forEach(function (c, i) {
      if (String(headers[i]) === '') {
        sh.getRange(1, i + 1, 1, 1).setValues([[c.header]]);
        added = true;
      }
    });
    if (added) plainText(sh);
  }
  return sh;
}

// Keep every column plain text, so Sheets never reads guest text as a formula or a date.
function plainText(sh) {
  sh.getRange(1, 1, sh.getMaxRows(), COLUMNS.length).setNumberFormat('@');
}

function findRowBy(key, value) {
  if (typeof value !== 'string' || value === '') return null;
  var col = COLUMNS.map(function (c) { return c.key; }).indexOf(key);
  var values = sheet().getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][col]) === value) return { index: i + 1, answer: fromRow(values[i]) };
  }
  return null;
}

// Compares the whole string every time, so the reply time says nothing about how much of a guess was right.
function sameText(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// A short e-mail per web answer, if NOTIFY_EMAIL is set. Only the summary: the details stay in the Sheet.
// A failed e-mail never fails the answer.
function notify(row) {
  var to = PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL');
  if (!to) return;
  try {
    var summary = row.attending ? 'príde, ' + row.guests + (row.guests === 1 ? ' osoba' : row.guests <= 4 ? ' osoby' : ' osôb') : 'nepríde';
    MailApp.sendEmail(to, 'Nová odpoveď: ' + row.name, row.name + ' ' + summary + '.\n\nVšetko je v tabuľke ' + SHEET_NAME + '.');
  } catch (err) {
    // Quota or permission problem: the row is already stored.
  }
}

// Validates again here, so the sheet stays clean even if called directly.
function clean(a) {
  if (!a || typeof a !== 'object') return null;
  var name = text(a.name, LIMITS.name);
  if (name.length < 2) return null;
  var attending = a.attending === true;
  var guests = attending ? Number(a.guests) : 0;
  if (attending && (!(guests >= 1 && guests <= LIMITS.guestsMax) || Math.floor(guests) !== guests)) return null;
  // Everyone coming, the respondent first: exactly one name per guest.
  var party = [];
  var kids = [];
  if (attending) {
    if (!Array.isArray(a.party) || a.party.length !== guests) return null;
    for (var i = 0; i < guests; i++) {
      var p = text(a.party[i], LIMITS.name);
      if (p.length < 2) return null;
      party.push(p);
      // The respondent is never a child; a missing flag means adult.
      kids.push(i > 0 && Array.isArray(a.kids) && a.kids[i] === true);
    }
  }
  return {
    name: name,
    attending: attending,
    guests: guests,
    party: party,
    kids: kids,
    dietary: attending ? text(a.dietary, LIMITS.dietary) : '',
    message: text(a.message, LIMITS.message)
  };
}

function text(v, max) {
  return typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max) : '';
}

// A leading apostrophe stops Sheets from treating guest text as a formula.
function safe(v) {
  var s = String(v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function toRow(a) {
  return COLUMNS.map(function (c) {
    if (c.key === 'attending') return a.attending ? 'áno' : 'nie';
    if (c.key === 'guests') return String(a.guests);
    // One name per line in the cell.
    if (c.key === 'party') return safe((a.party || []).join('\n'));
    // Same lines as the names: dospelý or dieťa.
    if (c.key === 'kids') return (a.kids || []).map(function (k) { return k ? 'dieťa' : 'dospelý'; }).join('\n');
    return safe(a[c.key] === undefined ? '' : a[c.key]);
  });
}

function fromRow(r) {
  var a = {};
  COLUMNS.forEach(function (c, i) {
    var v = r[i];
    a[c.key] = v instanceof Date ? v.toISOString() : String(v === null || v === undefined ? '' : v);
  });
  a.attending = a.attending === 'áno';
  a.guests = Number(a.guests) || 0;
  a.party = a.party === '' ? [] : a.party.split('\n');
  // Rows from before the column existed have no flags: everyone is an adult.
  var flags = a.kids === '' ? [] : a.kids.split('\n');
  a.kids = a.party.map(function (_, i) { return flags[i] === 'dieťa'; });
  return a;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
