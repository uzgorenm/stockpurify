import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const registry = await readJson("data/methodologies.json");
const manifest = await readJson("data/historical-data-manifest.json");
const calculationFixtures = await readJson("test/fixtures/methodology-results.json");

assertVersionedCollection(registry, "registryVersion", "methodologies");
assertVersionedCollection(manifest, "manifestVersion", "datasets");
assertUniqueIds(registry.methodologies, "methodology");
assertUniqueIds(manifest.datasets, "dataset");
assertUniqueIds(calculationFixtures.methodologies, "methodology fixture");
if (calculationFixtures.registryVersion !== registry.registryVersion) {
  throw new Error("Methodology fixtures must target the current production registry version.");
}

const dataRoot = resolve(root, "data/history");
const datasetsById = new Map();
for (const dataset of manifest.datasets) {
  requireString(dataset.id, "dataset.id");
  requireString(dataset.version, `${dataset.id}.version`);
  requireString(dataset.path, `${dataset.id}.path`);
  requireString(dataset.sha256, `${dataset.id}.sha256`);
  requireString(dataset.source, `${dataset.id}.source`);
  if (!/^[a-f0-9]{64}$/.test(dataset.sha256)) {
    throw new Error(`${dataset.id}.sha256 must be a lowercase SHA-256 digest.`);
  }

  const file = resolve(root, dataset.path);
  const fromDataRoot = relative(dataRoot, file);
  if (isAbsolute(fromDataRoot) || fromDataRoot === ".." || fromDataRoot.startsWith(`..${sep}`)) {
    throw new Error(`${dataset.id}.path must remain inside data/history/.`);
  }
  const digest = createHash("sha256").update(await readFile(file)).digest("hex");
  if (digest !== dataset.sha256) {
    throw new Error(`${dataset.id} checksum mismatch: expected ${dataset.sha256}, received ${digest}.`);
  }
  datasetsById.set(dataset.id, dataset);
}

const fixturesById = new Map(calculationFixtures.methodologies.map((fixture) => [fixture.id, fixture]));
for (const methodology of registry.methodologies) {
  await validateMethodology(methodology, datasetsById, fixturesById);
}
for (const fixtureId of fixturesById.keys()) {
  if (!registry.methodologies.some(({ id }) => id === fixtureId)) {
    throw new Error(`Calculation fixture ${fixtureId} has no matching production methodology.`);
  }
}

console.log(
  `Verified registry ${registry.registryVersion}: ${registry.methodologies.length} supported methodologies; ` +
    `manifest ${manifest.manifestVersion}: ${manifest.datasets.length} historical datasets; ` +
    `${calculationFixtures.methodologies.length} fixed methodology fixture sets.`
);

async function validateMethodology(methodology, datasetsById, fixturesById) {
  for (const field of ["id", "displayName", "version", "calculationModule"]) {
    requireString(methodology[field], `${methodology.id ?? "methodology"}.${field}`);
  }
  if (methodology.status !== "enabled") {
    throw new Error(`${methodology.id}.status must be enabled for a production registry entry.`);
  }
  for (const section of ["authoritativeSource", "rights", "qualifiedReview"]) {
    if (!methodology[section] || methodology[section].status !== "approved") {
      throw new Error(`${methodology.id}.${section}.status must be approved.`);
    }
    requireString(methodology[section].reference, `${methodology.id}.${section}.reference`);
  }
  if (!Array.isArray(methodology.historicalDataIds) || methodology.historicalDataIds.length === 0) {
    throw new Error(`${methodology.id}.historicalDataIds must list at least one versioned dataset.`);
  }
  for (const datasetId of methodology.historicalDataIds) {
    if (!datasetsById.has(datasetId)) {
      throw new Error(`${methodology.id} references unknown dataset ${datasetId}.`);
    }
  }

  const modulePath = resolve(root, methodology.calculationModule);
  const moduleRoot = resolve(root, "src/core/methodologies");
  const fromModuleRoot = relative(moduleRoot, modulePath);
  if (
    isAbsolute(fromModuleRoot) ||
    fromModuleRoot === ".." ||
    fromModuleRoot.startsWith(`..${sep}`) ||
    !modulePath.endsWith(".js")
  ) {
    throw new Error(`${methodology.id}.calculationModule must be a JavaScript file inside src/core/methodologies/.`);
  }
  await readFile(modulePath);

  const fixture = fixturesById.get(methodology.id);
  if (!fixture || fixture.version !== methodology.version || !Array.isArray(fixture.cases) || fixture.cases.length === 0) {
    throw new Error(`${methodology.id} must have version-matched fixed calculation cases.`);
  }
}

function assertVersionedCollection(value, versionField, collectionField) {
  if (value.schemaVersion !== 1) {
    throw new Error(`${collectionField} schemaVersion must be 1.`);
  }
  requireString(value[versionField], versionField);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value[versionField])) {
    throw new Error(`${versionField} must use YYYY-MM-DD format.`);
  }
  if (!Array.isArray(value[collectionField])) {
    throw new Error(`${collectionField} must be an array.`);
  }
}

function assertUniqueIds(entries, label) {
  const ids = new Set();
  for (const entry of entries) {
    requireString(entry.id, `${label}.id`);
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate ${label} id: ${entry.id}.`);
    }
    ids.add(entry.id);
  }
}

function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string.`);
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}
