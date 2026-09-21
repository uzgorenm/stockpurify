import { canonicalize, sha256Hex } from "./canonical.js";
import { describeSchedule, generateRecurringDates, parseIsoDate } from "./calendar.js";
import { formatUsd, parseUsdToMinor } from "./money.js";

export const RECORD_SCHEMA_VERSION = "1.0.0";

export async function buildContributionRecord(input) {
  const record = createContributionRecord(input);
  const canonicalJson = canonicalize(record);
  const fingerprint = await sha256Hex(canonicalJson);
  return Object.freeze({ record, canonicalJson, fingerprint });
}

export function createContributionRecord(input) {
  if (!input || typeof input !== "object") {
    throw new TypeError("Contribution input is required.");
  }

  parseIsoDate(input.initialDate);
  const initialMinor = parseUsdToMinor(input.initialAmount);
  const events = [
    {
      amountMinor: initialMinor.toString(),
      date: input.initialDate,
      sequence: 0,
      type: "initial"
    }
  ];

  let schedule = null;
  if (input.recurring) {
    const { amount, end, frequency, start } = input.recurring;
    if (start < input.initialDate) {
      throw new RangeError("Recurring start date must be on or after the initial investment date.");
    }
    const recurringMinor = parseUsdToMinor(amount);
    const dates = generateRecurringDates({ start, end, frequency });
    dates.forEach((date, index) => {
      events.push({
        amountMinor: recurringMinor.toString(),
        date,
        sequence: index + 1,
        type: "recurring"
      });
    });
    schedule = {
      amountMinor: recurringMinor.toString(),
      end,
      frequency,
      rule: describeSchedule(frequency),
      start
    };
  }

  events.sort(compareEvents);
  const totalMinor = events.reduce((sum, event) => sum + BigInt(event.amountMinor), 0n);
  const record = {
    calculation: {
      methodologyId: null,
      reasonCode: "qualified-review-required",
      status: "locked"
    },
    currency: "USD",
    events,
    recurringSchedule: schedule,
    schemaVersion: RECORD_SCHEMA_VERSION,
    summary: {
      eventCount: events.length,
      totalMinor: totalMinor.toString()
    }
  };

  return deepFreeze(record);
}

export function explainContributionRecord(record) {
  const eventWord = record.summary.eventCount === 1 ? "event" : "events";
  const scheduleSentence = record.recurringSchedule
    ? ` ${record.recurringSchedule.rule}`
    : " No recurring schedule was included.";
  return `This record contains ${record.summary.eventCount} ${eventWord} totaling ${formatUsd(record.summary.totalMinor)}.${scheduleSentence} No methodology was applied, so no charitable amount was calculated.`;
}

function compareEvents(left, right) {
  if (left.date !== right.date) {
    return left.date < right.date ? -1 : 1;
  }
  const typeOrder = Number(left.type === "recurring") - Number(right.type === "recurring");
  if (typeOrder !== 0) {
    return typeOrder;
  }
  return left.sequence - right.sequence;
}

function deepFreeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
