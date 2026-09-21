import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const registry = await readJson("../data/methodologies.json");
const manifest = await readJson("../data/historical-data-manifest.json");
const methodologyFixtures = await readJson("./fixtures/methodology-results.json");

test("production has no methodology before qualified review", () => {
  assert.equal(registry.registryVersion, "2026-09-21");
  assert.deepEqual(registry.methodologies, []);
});

test("fixed calculation-fixture coverage exactly matches supported methodologies", () => {
  assert.equal(methodologyFixtures.registryVersion, registry.registryVersion);
  assert.deepEqual(
    methodologyFixtures.methodologies.map(({ id }) => id).sort(),
    registry.methodologies.map(({ id }) => id).sort()
  );
  assert.equal(methodologyFixtures.methodologies.length, 0);
});

test("historical-data manifest is versioned and empty while support is locked", () => {
  assert.equal(manifest.manifestVersion, "2026-09-21");
  assert.deepEqual(manifest.datasets, []);
});

test("public preview contains calculation and payment guardrails", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /No purification methodology is enabled\./);
  assert.match(html, /does not calculate\s+a charitable amount/);
  assert.match(html, /No payments or charitable funds are accepted\./);
  assert.doesNotMatch(html, /type=["'](?:submit|button)["'][^>]*(?:pay|donat)|(?:pay|donat)[^<]*<\/button>/i);
});

async function readJson(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, import.meta.url), "utf8"));
}
