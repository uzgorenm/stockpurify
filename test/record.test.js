import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildContributionRecord, createContributionRecord, explainContributionRecord } from "../src/core/record.js";

const fixtures = JSON.parse(
  await readFile(new URL("./fixtures/contribution-records.json", import.meta.url), "utf8")
);

for (const fixture of fixtures) {
  test(`fixed record fixture: ${fixture.name}`, async () => {
    const first = await buildContributionRecord(fixture.input);
    const second = await buildContributionRecord(structuredClone(fixture.input));

    assert.deepEqual(first, second);
    assert.deepEqual(first.record.events.map((event) => event.date), fixture.expectedDates);
    assert.deepEqual(first.record.events.map((event) => event.type), fixture.expectedTypes);
    assert.equal(first.record.summary.eventCount, fixture.expectedEventCount);
    assert.equal(first.record.summary.totalMinor, fixture.expectedTotalMinor);
    assert.equal(first.record.calculation.status, "locked");
    assert.equal(first.record.calculation.methodologyId, null);
    assert.equal(explainContributionRecord(first.record), fixture.expectedExplanation);
    assert.equal(first.fingerprint, fixture.expectedFingerprint);
  });
}

test("events on the same date keep initial contribution before recurring contribution", () => {
  const record = createContributionRecord({
    initialDate: "2026-01-31",
    initialAmount: "100",
    recurring: { amount: "10", start: "2026-01-31", end: "2026-01-31", frequency: "month" }
  });
  assert.deepEqual(record.events.map(({ type, sequence }) => ({ type, sequence })), [
    { type: "initial", sequence: 0 },
    { type: "recurring", sequence: 1 }
  ]);
});

test("recurring contributions cannot predate the initial investment", () => {
  assert.throws(
    () =>
      createContributionRecord({
        initialDate: "2026-02-01",
        initialAmount: "100",
        recurring: { amount: "10", start: "2026-01-01", end: "2026-03-01", frequency: "month" }
      }),
    /on or after the initial investment/
  );
});

test("records and nested values are immutable", () => {
  const record = createContributionRecord({ initialDate: "2026-01-01", initialAmount: "100" });
  assert.ok(Object.isFrozen(record));
  assert.ok(Object.isFrozen(record.events));
  assert.ok(Object.isFrozen(record.events[0]));
  assert.throws(() => {
    record.events[0].date = "2026-01-02";
  }, TypeError);
});
