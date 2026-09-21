import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize, sha256Hex } from "../src/core/canonical.js";

test("canonical JSON sorts object keys recursively without changing array order", () => {
  assert.equal(
    canonicalize({ z: 1, a: { y: true, b: null }, list: [{ d: 4, c: 3 }, "x"] }),
    '{"a":{"b":null,"y":true},"list":[{"c":3,"d":4},"x"],"z":1}'
  );
});

test("canonical JSON rejects values that do not reproduce safely", () => {
  assert.throws(() => canonicalize({ amount: 1.2 }), /safe integers/);
  assert.throws(() => canonicalize({ value: undefined }), /Unsupported/);
  assert.throws(() => canonicalize({ value: 1n }), /Unsupported/);
});

test("SHA-256 output matches a fixed public test vector", async () => {
  assert.equal(await sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});
