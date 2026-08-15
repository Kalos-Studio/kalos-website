// Fails the build on an em dash in shipped copy.
//
// No em dashes anywhere is a hard brand rule, and it is exactly the kind of
// rule that survives a careful day and dies on a busy one. An em dash is also
// almost invisible in review next to an en dash or a hyphen, so this checks the
// codepoints rather than trusting anyone's eyes.
//
// Scope is copy files only. Source comments and prose documentation are not
// shipped to a reader and the existing codebase uses em dashes heavily in both,
// so widening this would fail the whole repo for no reader-facing gain.

import { readFileSync } from "node:fs";

const COPY_FILES = ["app/(landing)/content.js"];

// U+2014 em dash, and U+2013 en dash, which is the substitution people reach
// for the moment they are told to stop using em dashes.
const BANNED = [
  { char: "—", name: "em dash" },
  { char: "–", name: "en dash" },
];

let failed = false;

for (const file of COPY_FILES) {
  let source;
  try {
    source = readFileSync(file, "utf8");
  } catch {
    console.error(`check-copy: cannot read ${file}`);
    failed = true;
    continue;
  }

  source.split("\n").forEach((line, i) => {
    for (const { char, name } of BANNED) {
      const col = line.indexOf(char);
      if (col === -1) continue;
      failed = true;
      console.error(`${file}:${i + 1}:${col + 1}  ${name} (${escape(char)})`);
      console.error(`  ${line.trim()}`);
    }
  });
}

function escape(char) {
  return `U+${char.codePointAt(0).toString(16).toUpperCase()}`;
}

if (failed) {
  console.error("\nNo em dashes in shipped copy. Use a period, comma, colon or parentheses.");
  process.exit(1);
}

console.log(`check-copy: clean (${COPY_FILES.length} file(s))`);
