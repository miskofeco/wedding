import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeText, fold } from "../src/lib/ics.ts";

test("text values escape backslash, semicolon, comma and newline", () => {
  assert.equal(escapeText("a;b,c\\d\ne"), String.raw`a\;b\,c\\d\ne`);
});

test("long lines fold at 75 octets, without splitting a character", () => {
  const line = `DESCRIPTION:${"ľ".repeat(80)}`;
  const parts = fold(line).split("\r\n ");
  const bytes = (s: string) => new TextEncoder().encode(s).length;
  assert.ok(parts.length > 1);
  assert.ok(bytes(parts[0]) <= 75);
  parts.slice(1).forEach((p) => assert.ok(bytes(p) <= 74));
  assert.equal(parts.join(""), line);
});
