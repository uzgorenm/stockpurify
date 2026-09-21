const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MAX_OCCURRENCES = 1_200;

export const FREQUENCIES = Object.freeze({
  week: Object.freeze({ unit: "week", interval: 1, label: "weekly" }),
  month: Object.freeze({ unit: "month", interval: 1, label: "monthly" }),
  quarter: Object.freeze({ unit: "month", interval: 3, label: "quarterly" }),
  year: Object.freeze({ unit: "year", interval: 1, label: "yearly" })
});

export function parseIsoDate(value) {
  if (typeof value !== "string") {
    throw new TypeError("Date must be text in YYYY-MM-DD format.");
  }

  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    throw new RangeError("Date must use YYYY-MM-DD format.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError(`Invalid calendar date: ${value}.`);
  }

  return Object.freeze({ year, month, day });
}

export function generateRecurringDates({ start, end, frequency }) {
  const startDate = parseIsoDate(start);
  parseIsoDate(end);
  const rule = FREQUENCIES[frequency];
  if (!rule) {
    throw new RangeError(`Unsupported recurring frequency: ${frequency}.`);
  }
  if (start > end) {
    throw new RangeError("Recurring end date must be on or after the start date.");
  }

  const dates = [];
  for (let occurrence = 0; occurrence < MAX_OCCURRENCES; occurrence += 1) {
    const next = dateAtOccurrence(startDate, rule, occurrence);
    if (next.length !== 10 || next > end) {
      return dates;
    }
    dates.push(next);
  }

  const possibleNext = dateAtOccurrence(startDate, rule, MAX_OCCURRENCES);
  if (possibleNext.length === 10 && possibleNext <= end) {
    throw new RangeError(`Recurring plans may contain at most ${MAX_OCCURRENCES} events.`);
  }
  return dates;
}

export function describeSchedule(frequency) {
  const rule = FREQUENCIES[frequency];
  if (!rule) {
    throw new RangeError(`Unsupported recurring frequency: ${frequency}.`);
  }
  if (rule.unit === "week") {
    return "Weekly dates advance by seven calendar days in UTC.";
  }
  return `${capitalize(rule.label)} dates keep the original calendar anchor and use the last valid day in shorter months.`;
}

function dateAtOccurrence(start, rule, occurrence) {
  if (rule.unit === "week") {
    const milliseconds = Date.UTC(start.year, start.month - 1, start.day) + occurrence * 7 * 86_400_000;
    return formatUtcDate(new Date(milliseconds));
  }

  if (rule.unit === "month") {
    const monthIndex = start.month - 1 + occurrence * rule.interval;
    const year = start.year + Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    const day = Math.min(start.day, daysInMonth(year, month));
    return formatDateParts(year, month, day);
  }

  const year = start.year + occurrence * rule.interval;
  const day = Math.min(start.day, daysInMonth(year, start.month));
  return formatDateParts(year, start.month, day);
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatUtcDate(date) {
  return formatDateParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function formatDateParts(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1);
}
