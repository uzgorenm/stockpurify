const textEncoder = new TextEncoder();

export function canonicalize(value) {
  return JSON.stringify(normalize(value));
}

export async function sha256Hex(value) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto SHA-256 support is required.");
  }
  const digest = await globalThis.crypto.subtle.digest("SHA-256", textEncoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalize(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new TypeError("Canonical numbers must be safe integers.");
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(normalize);
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalize(value[key])])
    );
  }
  throw new TypeError(`Unsupported canonical value type: ${typeof value}.`);
}
