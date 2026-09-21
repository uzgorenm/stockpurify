import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourcePaths = ["src", "index.html"];
const forbidden = [
  { pattern: /Math\.random\s*\(/, reason: "randomness in production source" },
  { pattern: /Date\.now\s*\(/, reason: "wall-clock input in production source" },
  { pattern: /\bfetch\s*\(/, reason: "network access in production source" },
  { pattern: /XMLHttpRequest|WebSocket/, reason: "network transport in production source" },
  { pattern: /\beval\s*\(/, reason: "dynamic code execution" },
  { pattern: /stripe|checkout|paymentintent/i, reason: "payment integration before review" }
];

const files = [];
for (const sourcePath of sourcePaths) {
  const absolute = join(root, sourcePath);
  if (extname(absolute)) {
    files.push(absolute);
  } else {
    files.push(...(await walk(absolute)));
  }
}

for (const file of files) {
  const text = await readFile(file, "utf8");
  for (const rule of forbidden) {
    if (rule.pattern.test(text)) {
      throw new Error(`${file.slice(root.length)} contains ${rule.reason}.`);
    }
  }
}

const html = await readFile(join(root, "index.html"), "utf8");
for (const requiredText of [
  "No purification methodology is enabled.",
  "This preview does not calculate",
  "No payments or charitable funds are accepted.",
  "locked pending qualified review"
]) {
  if (!html.includes(requiredText)) {
    throw new Error(`index.html is missing required guardrail text: ${requiredText}`);
  }
}

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
if (packageJson.dependencies || packageJson.devDependencies) {
  throw new Error("The research preview must remain dependency-free unless dependencies receive explicit review.");
}

console.log(`Source guardrails passed for ${files.length} production files.`);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    })
  );
  return nested.flat().filter((path) => [".js", ".mjs"].includes(extname(path)));
}
