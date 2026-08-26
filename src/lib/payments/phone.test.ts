import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeMpesaPhone } from "./phone";

test("normalizes common Kenyan phone formats to 2547XXXXXXXX", () => {
  assert.equal(normalizeMpesaPhone("0712345678"), "254712345678");
  assert.equal(normalizeMpesaPhone("+254712345678"), "254712345678");
  assert.equal(normalizeMpesaPhone("254712345678"), "254712345678");
  assert.equal(normalizeMpesaPhone("712345678"), "254712345678");
  assert.equal(normalizeMpesaPhone("07 123 456 78"), "254712345678");
});

test("rejects invalid phone numbers", () => {
  assert.equal(normalizeMpesaPhone(""), null);
  assert.equal(normalizeMpesaPhone("12345"), null);
  assert.equal(normalizeMpesaPhone("254112345678"), null);
  assert.equal(normalizeMpesaPhone("0812345678"), null);
});
