/**
 * Google Sheet mirror for the wedding site. Paste into Extensions → Apps Script
 * of the Google Sheet, set the script property RSVP_SECRET, and deploy as a web
 * app (Execute as: Me, Who has access: Anyone). See SETUP.md.
 *
 * The site's database is the record; this script keeps a readable copy of the
 * RSVP answers (tab „Odpovede“) and the guest list (tab „Pozvaní“) in the Sheet.
 *
 * Every request is a JSON POST: { secret, action, table, ... }.
 *   upsert { table, row }  writes the row with this id, or appends it
 *   delete { table, id }   removes the row with this id
 *   list   { table }       returns every row
 * `table` is "answers" (the default) or "invites".
 * Answers: { ok: true, ... } or { ok: false, error }.
 * The site only ever talks to this script from its server; the secret never
 * reaches a browser.
 *
 * Optional script property NOTIFY_EMAIL: an address that gets a short e-mail
 * (name, yes/no, number of guests) for every new answer sent from the website.
 */

var LIMITS = { name: 100, dietary: 500, message: 1000, guestsMax: 10, members: 20, contact: 200, note: 500 };

// Column order per tab. Headers are Slovak for the couple; keys are for the site.
// New columns are appended last so existing sheets keep their layout.
var TABLES = {
  answers: {
    sheet: 'Odpovede',
    columns: [
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
      { key: 'kids', header: 'Dospelý / dieťa' },
      { key: 'submission', header: 'Kľúč odoslania' },
      { key: 'invite', header: 'Pozvánka' }
    ]
  },
  invites: {
    sheet: 'Pozvaní',
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'createdAt', header: 'Pridané' },
      { key: 'updatedAt', header: 'Upravené' },
      { key: 'household', header: 'Domácnosť' },
      { key: 'members', header: 'Mená' },
      { key: 'expected', header: 'Očakávaný počet' },
      { key: 'side', header: 'Strana' },
      { key: 'group', header: 'Skupina' },
      { key: 'contact', header: 'Kontakt' },
      { key: 'note', header: 'Poznámka' },
      { key: 'remindedAt', header: 'Pripomenuté' }
    ]
  }
};
var SIDES = { bride: 'nevesta', groom: 'ženích', both: 'spoloční' };

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var secret = PropertiesService.getScriptProperties().getProperty('RSVP_SECRET');
    if (!secret || !sameText(req.secret, secret)) return reply({ ok: false, error: 'unauthorized' });
    var table = TABLES[req.table || 'answers'];
    if (!table) return reply({ ok: false, error: 'unknown_table' });
    // Shorter than the site's 15 s timeout, so a busy moment ends in an answer, not a timeout.
    lock.waitLock(8000);
    switch (req.action) {
      case 'upsert': return reply(upsert(req.table || 'answers', req.row));
      case 'list': return reply({ ok: true, rows: list(table) });
      case 'delete': return reply(remove(table, req.id));
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

function upsert(name, input) {
  var table = TABLES[name];
  var row = name === 'answers' ? cleanAnswer(input) : cleanInvite(input);
  if (!row) return { ok: false, error: 'invalid' };
  var found = findRow(table, row.id);
  if (found) {
    sheet(table).getRange(found, 1, 1, table.columns.length).setValues([toRow(table, row)]);
  } else {
    sheet(table).appendRow(toRow(table, row));
    if (name === 'answers' && row.source === 'web') notify(row);
  }
  return { ok: true };
}

function list(table) {
  var values = sheet(table).getDataRange().getValues();
  var out = [];
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === '' || values[i][0] === null) continue;
    out.push(fromRow(table, values[i]));
  }
  return out;
}

function remove(table, id) {
  var found = findRow(table, id);
  if (!found) return { ok: false, error: 'not_found' };
  sheet(table).deleteRow(found);
  return { ok: true };
}

// ---- helpers ----

function sheet(table) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(table.sheet);
  var n = table.columns.length;
  if (!sh) {
    sh = ss.insertSheet(table.sheet);
    plainText(sh, n);
    sh.getRange(1, 1, 1, n).setValues([table.columns.map(function (c) { return c.header; })]);
    sh.setFrozenRows(1);
  } else {
    // A sheet from before the last columns existed (or one made by hand): add the missing headers.
    var headers = sh.getRange(1, 1, 1, n).getValues()[0];
    var added = false;
    table.columns.forEach(function (c, i) {
      if (String(headers[i]) === '') {
        sh.getRange(1, i + 1, 1, 1).setValues([[c.header]]);
        added = true;
      }
    });
    if (added) plainText(sh, n);
  }
  return sh;
}

// Keep every column plain text, so Sheets never reads guest text as a formula or a date.
function plainText(sh, n) {
  sh.getRange(1, 1, sh.getMaxRows(), n).setNumberFormat('@');
}

/** The sheet row number (1-based) holding this id, or 0. */
function findRow(table, id) {
  if (typeof id !== 'string' || id === '') return 0;
  var values = sheet(table).getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === id) return i + 1;
  }
  return 0;
}

// Compares the whole string every time, so the reply time says nothing about how much of a guess was right.
function sameText(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// A short e-mail per new web answer, if NOTIFY_EMAIL is set. Only the summary: the details stay in the Sheet.
// A failed e-mail never fails the answer.
function notify(row) {
  var to = PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL');
  if (!to) return;
  try {
    var summary = row.attending ? 'príde, ' + row.guests + (row.guests === 1 ? ' osoba' : row.guests <= 4 ? ' osoby' : ' osôb') : 'nepríde';
    MailApp.sendEmail(to, 'Nová odpoveď: ' + row.name, row.name + ' ' + summary + '.\n\nVšetko je v tabuľke ' + TABLES.answers.sheet + '.');
  } catch (err) {
    // Quota or permission problem: the row is already stored.
  }
}

function meta(r, row) {
  var id = text(r.id, 64);
  if (!id) return null;
  row.id = id;
  row.updatedAt = text(r.updatedAt, 40);
  return row;
}

// Validates again here, so the sheet stays clean even if called directly.
function cleanAnswer(a) {
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
  return meta(a, {
    submittedAt: text(a.submittedAt, 40),
    source: a.source === 'admin' ? 'admin' : 'web',
    submission: text(a.submission, 64),
    invite: text(a.invite, 64),
    name: name,
    attending: attending,
    guests: guests,
    party: party,
    kids: kids,
    dietary: attending ? text(a.dietary, LIMITS.dietary) : '',
    message: text(a.message, LIMITS.message)
  });
}

function cleanInvite(v) {
  if (!v || typeof v !== 'object') return null;
  var household = text(v.household, LIMITS.name);
  var expected = Number(v.expected);
  if (household.length < 2 || !(expected >= 1 && expected <= LIMITS.guestsMax * 2) || Math.floor(expected) !== expected) return null;
  var members = Array.isArray(v.members) ? v.members.slice(0, LIMITS.members).map(function (m) { return text(m, LIMITS.name); }).filter(String) : [];
  return meta(v, {
    createdAt: text(v.createdAt, 40),
    household: household,
    members: members,
    expected: expected,
    side: SIDES[v.side] ? v.side : 'both',
    group: text(v.group, 60),
    contact: text(v.contact, LIMITS.contact),
    note: text(v.note, LIMITS.note),
    remindedAt: text(v.remindedAt, 40)
  });
}

function text(v, max) {
  return typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max) : '';
}

// A leading apostrophe stops Sheets from treating guest text as a formula.
function safe(v) {
  var s = String(v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function toRow(table, a) {
  return table.columns.map(function (c) {
    var v = a[c.key];
    if (c.key === 'attending') return v ? 'áno' : 'nie';
    if (c.key === 'guests' || c.key === 'expected') return String(v);
    if (c.key === 'side') return SIDES[v];
    // One name per line in the cell.
    if (c.key === 'party' || c.key === 'members') return safe((v || []).join('\n'));
    // Same lines as the names: dospelý or dieťa.
    if (c.key === 'kids') return (v || []).map(function (k) { return k ? 'dieťa' : 'dospelý'; }).join('\n');
    return safe(v === undefined ? '' : v);
  });
}

function fromRow(table, r) {
  var a = {};
  table.columns.forEach(function (c, i) {
    var v = r[i];
    a[c.key] = v instanceof Date ? v.toISOString() : String(v === null || v === undefined ? '' : v);
  });
  if (table === TABLES.answers) {
    a.attending = a.attending === 'áno';
    a.guests = Number(a.guests) || 0;
    a.party = a.party === '' ? [] : a.party.split('\n');
    // Rows from before the column existed have no flags: everyone is an adult.
    var flags = a.kids === '' ? [] : a.kids.split('\n');
    a.kids = a.party.map(function (_, i) { return flags[i] === 'dieťa'; });
  } else {
    a.expected = Number(a.expected) || 0;
    a.members = a.members === '' ? [] : a.members.split('\n');
    a.side = Object.keys(SIDES).filter(function (k) { return SIDES[k] === a.side; })[0] || 'both';
  }
  return a;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
