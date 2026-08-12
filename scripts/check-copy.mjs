import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "apps", "web", "src");

const FORBIDDEN = [
  { pattern: /npx nika(?!ui)/, why: "the advertised command is `npx nikaui`" },
  { pattern: /Rowee13\//, why: "the repository moved to Parrow-Horrizon-Studio" },
  { pattern: /\b40\+|\b12\+|\b80\+/, why: "fabricated counts" },
  { pattern: /Figma/i, why: "no design kit exists" },
  { pattern: /\$99\b/, why: "pricing is $149 and $349" },
  { pattern: /data-theme=/, why: "theming switches on the .dark class" },
  { pattern: /"pop"|'pop'|\bpop\b(?=.*preset)/, why: "there is no preset named pop" },
];

// Test files are excluded from this walk. A test that defensively asserts a
// forbidden string is *absent* (e.g. `expect(page).not.toContain("$99")`)
// necessarily contains that string in its own source, which would otherwise
// trip this gate on the assertion instead of the violation. Task 8 hit this
// exact case and the fix at the time was to delete the test — the wrong
// trade, since it silently gave up real coverage rather than fixing the gate.
//
// The cost of excluding `*.test.ts(x)` here: a forbidden string sitting
// inertly in a test file (a fixture, a stale comment, a copy-pasted mock)
// would never be caught by this script. That's accepted deliberately —
// test files are not shipped copy a visitor can read, so they're outside
// what this gate exists to police, and every production source file under
// apps/web/src is still fully scanned.
function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.test\.(ts|tsx)$/.test(entry)) continue;
    else if (/\.(ts|tsx|css|mjs)$/.test(entry)) yield full;
  }
}

let failed = false;
for (const file of walk(ROOT)) {
  const source = readFileSync(file, "utf8");
  for (const { pattern, why } of FORBIDDEN) {
    const match = source.match(pattern);
    if (match) {
      console.error(`${path.relative(ROOT, file)}: found "${match[0]}" — ${why}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("PASS: no forbidden copy");
