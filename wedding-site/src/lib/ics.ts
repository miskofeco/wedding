// RFC 5545 text helpers for the .ics file. No imports, so the tests can run them.

/** Escapes backslash, semicolon, comma and newline in a TEXT value. */
export const escapeText = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

// Lines longer than 75 octets are folded with CRLF + space.
export function fold(line: string): string {
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  const encoder = new TextEncoder();
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > (out.length === 0 ? 75 : 74)) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}
