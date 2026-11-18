// Scans src/ for translation keys and syncs the locale JSONs.
// Run with `pnpm i18n:sync` (Node strips the types natively).
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const localesDir = join(root, "src/locales");
const srcDir = join(root, "src");

const SOURCE_LOCALE = "en";
const TARGET_LOCALES = ["id"];

// t("..."), i18n.t("..."), t('...'), t(`...`) (no interpolation in backticks)
const T_CALL_RE = /\bt\(\s*(["'`])((?:\\.|(?!\1).)*)\1/g;
// <Trans i18nKey="..." />
const TRANS_KEY_RE = /\bi18nKey\s*=\s*\{?\s*(["'`])((?:\\.|(?!\1).)*)\1/g;

// Comments may show example calls; drop them before matching.
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");

const unescapeKey = (value: string) => value.replace(/\\(.)/g, "$1");

const walk = (dir: string): string[] => {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
};

const collectKeys = (): Set<string> => {
  const keys = new Set<string>();
  for (const file of walk(srcDir)) {
    const src = stripComments(readFileSync(file, "utf-8"));
    for (const re of [T_CALL_RE, TRANS_KEY_RE]) {
      for (const match of src.matchAll(re)) {
        const key = match[2];
        if (key && !(match[1] === "`" && key.includes("${"))) {
          keys.add(unescapeKey(key));
        }
      }
    }
  }
  return keys;
};

const readDict = (locale: string): Record<string, string> => {
  try {
    return JSON.parse(
      readFileSync(join(localesDir, `${locale}.json`), "utf-8"),
    );
  } catch {
    return {};
  }
};

const writeDict = (locale: string, dict: Record<string, string>) => {
  const sorted = Object.fromEntries(
    Object.keys(dict)
      .sort()
      .map((key) => [key, dict[key] ?? ""]),
  );
  writeFileSync(
    join(localesDir, `${locale}.json`),
    `${JSON.stringify(sorted, null, 2)}\n`,
  );
};

const main = () => {
  const discovered = collectKeys();
  const source = readDict(SOURCE_LOCALE);

  let added = 0;
  let removed = 0;
  for (const key of discovered) {
    if (!(key in source)) {
      source[key] = key;
      added++;
    }
  }
  for (const key of Object.keys(source)) {
    if (!discovered.has(key)) {
      delete source[key];
      removed++;
    }
  }
  writeDict(SOURCE_LOCALE, source);

  console.log(
    `i18n sync: source(${SOURCE_LOCALE}) +${added} -${removed} key(s), discovered ${discovered.size}`,
  );

  for (const locale of TARGET_LOCALES) {
    const dict = readDict(locale);
    let localeAdded = 0;
    for (const key of Object.keys(source)) {
      if (!(key in dict)) {
        dict[key] = "";
        localeAdded++;
      }
    }
    for (const key of Object.keys(dict)) {
      if (!(key in source)) delete dict[key];
    }
    writeDict(locale, dict);
    const empty = Object.values(dict).filter((v) => v === "").length;
    console.log(`  ${locale}: +${localeAdded} added, ${empty} empty`);
  }
};

main();
