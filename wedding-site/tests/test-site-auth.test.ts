import { test } from "node:test";
import assert from "node:assert/strict";
import { testSiteAuthorized } from "../src/lib/test-site-auth.ts";

const password = "preview-test-passphrase:ľšč";
const basic = (value: string) => `Basic ${Buffer.from(value).toString("base64")}`;

test("test gate accepts only the test username and the exact password, including colons and Unicode", () => {
  assert.equal(testSiteAuthorized(basic(`test:${password}`), password), true);
  assert.equal(testSiteAuthorized(basic(`admin:${password}`), password), false);
  assert.equal(testSiteAuthorized(basic("test:wrong-password"), password), false);
  assert.equal(testSiteAuthorized(basic(`test:${password} `), password), false);
});

test("test gate refuses absent, malformed and oversized credentials and missing or short passwords", () => {
  for (const header of [null, "", "Bearer token", "Basic !!!", basic("test"), "Basic " + "A".repeat(5000)]) {
    assert.equal(testSiteAuthorized(header, password), false, String(header).slice(0, 40));
  }
  for (const value of ["", "short"]) assert.equal(testSiteAuthorized(basic(`test:${value}`), value), false);
});
