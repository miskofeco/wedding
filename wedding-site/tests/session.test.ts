import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createToken, verifyToken } from "../src/lib/session.ts";

const secret = "s".repeat(32);
const password = "correct horse battery";
const now = 1_800_000_000;
const issued = now - 600;

test("a fresh token verifies", () => {
  assert.ok(verifyToken(createToken(secret, password, issued, now + 60), secret, password, now));
});

test("an expired token fails", () => {
  assert.ok(!verifyToken(createToken(secret, password, issued, now - 1), secret, password, now));
});

test("changing the password or the secret signs everyone out", () => {
  const token = createToken(secret, password, issued, now + 60);
  assert.ok(!verifyToken(token, secret, "a different password", now));
  assert.ok(!verifyToken(token, "t".repeat(32), password, now));
});

test("a token issued before the sign-out cut-off fails; one issued at or after it verifies", () => {
  const token = createToken(secret, password, issued, now + 60);
  assert.ok(verifyToken(token, secret, password, now, 0));
  assert.ok(verifyToken(token, secret, password, now, issued));
  assert.ok(!verifyToken(token, secret, password, now, issued + 1));
  assert.ok(verifyToken(createToken(secret, password, issued + 1, now + 60), secret, password, now, issued + 1));
});

test("a tampered token fails", () => {
  const token = createToken(secret, password, issued, now + 60);
  const [who, , expires, print, sig] = token.split(".");
  assert.ok(!verifyToken(`${who}.${now}.${expires}.${print}.${sig}`, secret, password, now, issued + 1), "a later issue time");
  assert.ok(!verifyToken(`${who}.${issued}.${now + 999_999}.${print}.${sig}`, secret, password, now));
  assert.ok(!verifyToken(`${token}x`, secret, password, now));
  assert.ok(!verifyToken("garbage", secret, password, now));
  assert.ok(!verifyToken("", secret, password, now));
});

test("a correctly signed token in the older format, without an issue time, fails", () => {
  const sign = (s: string) => createHmac("sha256", secret).update(s).digest("base64url");
  const payload = `admin.${now + 60}.${sign(`password:${password}`).slice(0, 16)}`;
  assert.ok(!verifyToken(`${payload}.${sign(payload)}`, secret, password, now));
});
