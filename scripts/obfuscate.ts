// Optional post-build step (`OBFUSCATE=true pnpm build`): obfuscates our own
// JavaScript chunks in dist/assets in place, never `vendor-*` (libraries:
// javascript-obfuscator miscompiles some of them, e.g. RTK Query's
// block-scoped functions become "x is not defined" at runtime, and they are
// public code anyway; see vite.config.ts). Off by default: Vite already
// minifies, and obfuscation only slows readers down (the bundle is public,
// so it protects no secret), while making the bundle bigger and slower.
// File names keep Vite's content hashes; a fixed seed makes the output the
// same for the same input, so a hash keeps meaning one file.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import JavaScriptObfuscator from "javascript-obfuscator";

if (process.env.OBFUSCATE !== "true") process.exit(0);

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(root, "dist/assets");

// Conservative: no control-flow flattening, dead code or self-defending
// (large slowdowns, and they break some libraries); globals, object keys and
// ES module imports/exports stay as they are.
const OPTIONS: Parameters<typeof JavaScriptObfuscator.obfuscate>[1] = {
  target: "browser",
  seed: 20261109,
  compact: true,
  identifierNamesGenerator: "hexadecimal",
  renameGlobals: false,
  transformObjectKeys: false,
  stringArray: true,
  stringArrayThreshold: 0.75,
  stringArrayEncoding: ["base64"],
  splitStrings: false,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  selfDefending: false,
  debugProtection: false,
  sourceMap: false,
};

let count = 0;
for (const name of readdirSync(assets)) {
  if (!name.endsWith(".js") || name.startsWith("vendor-")) continue;
  const file = join(assets, name);
  const code = readFileSync(file, "utf8");
  writeFileSync(
    file,
    JavaScriptObfuscator.obfuscate(code, OPTIONS).getObfuscatedCode(),
  );
  count++;
}
console.log(`obfuscate: ${count} chunk(s) in dist/assets`);
