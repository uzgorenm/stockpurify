import assert from "node:assert/strict";
import test from "node:test";
import { describeSchedule, generateRecurringDates, parseIsoDate } from "../src/core/calendar.js";

test("monthly schedules preserve the original anchor across shorter months", () => {
  assert.deepEqual(
    generateRecurringDates({ start: "2024-01-31", end: "2024-05-31", frequency: "month" }),
    ["2024-01-31", "2024-02-29", "2024-03-31", "2024-04-30", "2024-05-31"]
  );
  assert.deepEqual(
    generateRecurringDates({ start: "2023-01-31", end: "2023-04-30", frequency: "month" }),
    ["2023-01-31", "2023-02-28", "2023-03-31", "2023-04-30"]
  );
});
test("yearly leap-day schedules return to February 29 in leap years", () => {
  assert.deepEqual(
    generateRecurringDates({ start: "2024-02-29", end: "2028-03-01", frequency: "year" }),
    ["2024-02-29", "2025-02-28", "2026-02-28", "2027-02-28", "2028-02-29"]
  );
});

test("quarterly and weekly schedules cross year boundaries deterministically", () => {
  assert.deepEqual(
    generateRecurringDates({ start: "2024-11-30", end: "2025-11-30", frequency: "quarter" }),
    ["2024-11-30", "2025-02-28", "2025-05-30", "2025-08-30", "2025-11-30"]
  );
  assert.deepEqual(
    generateRecurringDates({ start: "2025-12-24", end: "2026-01-08", frequency: "week" }),
    ["2025-12-24", "2025-12-31", "2026-01-07"]
  );
});

test("a schedule includes both its start and an equal end date", () => {
  assert.deepEqual(
    generateRecurringDates({ start: "2026-09-21", end: "2026-09-21", frequency: "week" }),
    ["2026-09-21"]
  );
});

test("calendar input rejects invalid dates, ranges, frequencies, and excessive schedules", () => {
  for (const value of ["2024-02-30", "2023-02-29", "0000-01-01", "24-01-01", "2024/01/01"]) {
    assert.throws(() => parseIsoDate(value), RangeError, value);
  }
  assert.throws(
    () => generateRecurringDates({ start: "2025-02-01", end: "2025-01-01", frequency: "month" }),
    /on or after/
  );
  assert.throws(
    () => generateRecurringDates({ start: "2025-01-01", end: "2025-02-01", frequency: "biweekly" }),
    /Unsupported/
  );
  assert.throws(
    () => generateRecurringDates({ start: "2000-01-01", end: "2100-01-01", frequency: "week" }),
    /at most 1200/
  );
});

test("schedule explanations are fixed for each supported frequency", () => {
  assert.equal(describeSchedule("week"), "Weekly dates advance by seven calendar days in UTC.");
  assert.equal(
    describeSchedule("month"),
    "Monthly dates keep the original calendar anchor and use the last valid day in shorter months."
  );
  assert.equal(
    describeSchedule("quarter"),
    "Quarterly dates keep the original calendar anchor and use the last valid day in shorter months."
  );
  assert.equal(
    describeSchedule("year"),
    "Yearly dates keep the original calendar anchor and use the last valid day in shorter months."
  );
});
