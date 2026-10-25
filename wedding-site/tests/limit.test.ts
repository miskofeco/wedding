import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp, createLimiter } from "../src/lib/limit.ts";

test("blocks after the limit, per key", () => {
  const limit = createLimiter(2, 60_000);
  assert.ok(!limit.blocked("a"));
  limit.hit("a");
  limit.hit("a");
  assert.ok(limit.blocked("a"));
  assert.ok(!limit.blocked("b"));
  limit.clear("a");
  assert.ok(!limit.blocked("a"));
});

test("the window ends", () => {
  const limit = createLimiter(1, -1); // every window is already over
  limit.hit("a");
  assert.ok(!limit.blocked("a"));
});

test("client IP is the first forwarded address", () => {
  assert.equal(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })), "203.0.113.7");
  assert.equal(clientIp(new Headers({ "x-real-ip": "203.0.113.8" })), "203.0.113.8");
  assert.equal(clientIp(new Headers()), "local");
});
