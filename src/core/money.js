const MONEY_PATTERN = /^(?:(?<plain>0|[1-9]\d{0,10})|(?<grouped>[1-9]\d?(?:,\d{3}){1,3}))(?:\.(?<fraction>\d{1,2}))?$/;

export function parseUsdToMinor(value) {
  if (typeof value !== "string") {
    throw new TypeError("Amount must be entered as text.");
  }

  const normalized = value.trim();
  const match = MONEY_PATTERN.exec(normalized);
  if (!match) {
    throw new RangeError("Enter a positive USD amount with no more than two decimal places.");
  }

  const whole = BigInt((match.groups.plain ?? match.groups.grouped).replaceAll(",", ""));
  const fraction = (match.groups.fraction ?? "").padEnd(2, "0");
  const minor = whole * 100n + BigInt(fraction || "0");
  if (minor <= 0n) {
    throw new RangeError("Amount must be greater than zero.");
  }

  return minor;
}

export function minorToDecimal(minor) {
  const value = toMinorBigInt(minor);
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const whole = absolute / 100n;
  const fraction = String(absolute % 100n).padStart(2, "0");
  return `${sign}${whole}.${fraction}`;
}

export function formatUsd(minor) {
  const decimal = minorToDecimal(minor);
  const negative = decimal.startsWith("-");
  const unsigned = negative ? decimal.slice(1) : decimal;
  const [whole, fraction] = unsigned.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}$${grouped}.${fraction}`;
}

export function toMinorBigInt(value) {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return BigInt(value);
  }
  throw new TypeError("Minor-unit amount must be an integer string or bigint.");
}
