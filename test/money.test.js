import assert from "node:assert/strict";
import test from "node:test";
import { formatUsd, minorToDecimal, parseUsdToMinor, toMinorBigInt } from "../src/core/money.js";

test("parses decimal text into exact integer minor units", () => {
  const cases = new Map([
    ["0.01", 1n],
    ["1", 100n],
    ["1.2", 120n],
    ["1.20", 120n],
    [" 12,345.67 ", 1_234_567n],
    ["99999999999.99", 9_999_999_999_999n]
  ]);
  for (const [input, expected] of cases) {
    assert.equal(parseUsdToMinor(input), expected, input);
  }
});

test("rejects ambiguous, non-positive, and over-precise money", () => {
  for (const input of ["", "0", "0.00", "-1", "+1", "$1", "01.00", "1,2,3", "12,34.00", "1.001", "1e3", "100000000000.00"] ) {
    assert.throws(() => parseUsdToMinor(input), undefined, input);
  }
  assert.throws(() => parseUsdToMinor(100), TypeError);
});

test("formats integer minor units without floating-point arithmetic", () => {
  assert.equal(minorToDecimal("100020"), "1000.20");
  assert.equal(formatUsd("100020"), "$1,000.20");
  assert.equal(formatUsd(-5n), "-$0.05");
  assert.equal(toMinorBigInt("42"), 42n);
  assert.throws(() => toMinorBigInt(42), TypeError);
});
