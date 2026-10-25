import { test } from "node:test";
import assert from "node:assert/strict";
import { createToken, verifyToken } from "../src/lib/session.ts";

const secret = "s".repeat(32);
const password = "correct horse battery";
const now = 1_800_000_000;

test("a fresh token verifies", () => {
  assert.ok(verifyToken(createToken(secret, password, now + 60), secret, password, now));
});

test("an expired token fails", () => {
  assert.ok(!verifyToken(createToken(secret, password, now - 1), secret, password, now));
});

test("changing the password or the secret signs everyone out", () => {
  const token = createToken(secret, password, now + 60);
  assert.ok(!verifyToken(token, secret, "a different password", now));
  assert.ok(!verifyToken(token, "t".repeat(32), password, now));
});

test("a tampered token fails", () => {
  const token = createToken(secret, password, now + 60);
  const [who, , print, sig] = token.split(".");
  assert.ok(!verifyToken(`${who}.${now + 999_999}.${print}.${sig}`, secret, password, now));
  assert.ok(!verifyToken(`${token}x`, secret, password, now));
  assert.ok(!verifyToken("garbage", secret, password, now));
  assert.ok(!verifyToken("", secret, password, now));
});
