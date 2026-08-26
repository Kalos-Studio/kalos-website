// Fails the build on an em dash in shipped copy.
//
// No em dashes anywhere is a hard brand rule, and it is exactly the kind of rule
// that survives a careful day and dies on a busy one. An em dash is also almost
// invisible in review next to an en dash or a hyphen, so this checks codepoints
// rather than trusting anyone's eyes.
//
// It imports the copy module and walks the exported values, rather than reading
// the file as text. That distinction is the whole design:
//
// - Scanning lines flagged source comments, which are not shipped to a reader
//   and which this codebase writes with em dashes by convention. It went off the
//   first time somebody documented a decision in that file, which is exactly the
//   moment a lint rule loses its credibility.
// - Walking values checks precisely what reaches a visitor, including strings
//   nested in arrays and objects, and nothing else.
//
// En dashes are allowed. They were briefly banned here too, on the theory that
// they are what people reach for the moment em dashes are taken away, but the
// owner allows them and they do real work in a number range.

import { pathToFileURL } from "node:url";
import path from "node:path";

const COPY_MODULES = ["app/(landing)/content.js"];
const BANNED = [{ char: "—", name: "em dash" }];

const findings = [];

function walk(value, trail) {
  if (typeof value === "string") {
    for (const { char, name } of BANNED) {
      const at = value.indexOf(char);
      if (at === -1) continue;
      findings.push({ trail, name, char, value, at });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, `${trail}[${i}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) walk(item, `${trail}.${key}`);
  }
}

for (const file of COPY_MODULES) {
  const url = pathToFileURL(path.resolve(process.cwd(), file)).href;
  let mod;
  try {
    mod = await import(url);
  } catch (error) {
    console.error(`check-copy: cannot import ${file}\n  ${error.message}`);
    process.exit(1);
  }
  for (const [name, value] of Object.entries(mod)) walk(value, `${file} → ${name}`);
}

if (findings.length) {
  for (const f of findings) {
    const codepoint = `U+${f.char.codePointAt(0).toString(16).toUpperCase()}`;
    console.error(`${f.trail}  ${f.name} (${codepoint})`);
    console.error(`  ${f.value.slice(Math.max(0, f.at - 40), f.at + 40).trim()}`);
  }
  console.error("\nNo em dashes in shipped copy. Use a period, comma, colon or parentheses.");
  process.exit(1);
}

console.log(`check-copy: clean (${COPY_MODULES.length} module(s))`);
