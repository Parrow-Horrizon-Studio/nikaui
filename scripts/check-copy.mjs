import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");

/**
 * Every tree whose contents a user of this project can end up reading: the
 * marketing site, the component sources the CLI copies into consumers'
 * repositories, and the CLI itself.
 *
 * This was `apps/web/src` alone, which made one of the patterns below
 * unreachable. The `pop` pattern was strengthened specifically to catch the
 * object-key shape `pop: {` — a shape that can only occur in
 * `packages/registry/src/lib/motion.ts`, a file the old walk never visited.
 * A correct pattern aimed at a tree that cannot contain the violation is
 * not a gate.
 *
 * Deliberately NOT scanned:
 *   - `docs/` — the design documents legitimately discuss the distribution
 *     model by name; they are the reasoning behind these rules, not copy
 *     shipped to anyone.
 *
 * `apps/docs/` carried this same carve-out for Fumadocs' vendored CSS until
 * it was deleted (docs migration, Task 8). `apps/web` inherited Fumadocs,
 * but both its `src` and `content` are scanned below in full — nothing
 * under `apps/` is excluded today.
 */
const ROOTS = [
  "apps/web/src",
  "apps/web/content",
  "packages/registry/src",
  "packages/cli/src",
].map((relative) => path.resolve(REPO_ROOT, relative));

const FORBIDDEN = [
  { pattern: /npx nika(?!ui)/, why: "the advertised command is `npx nikaui`" },
  { pattern: /Rowee13\//, why: "the repository moved to Parrow-Horrizon-Studio" },
  { pattern: /\b40\+|\b12\+|\b80\+/, why: "fabricated counts" },
  { pattern: /Figma/i, why: "no design kit exists" },
  { pattern: /\$99\b/, why: "pricing is $149 and $349" },
  { pattern: /data-theme=/, why: "theming switches on the .dark class" },
  // Spec §5 item 3 and the plan's "What must never reach production" both
  // list this among the honesty greps, and it was the one string of the
  // seven that `FORBIDDEN` never implemented. The shipped surfaces are
  // clean today — this closes an ungated constraint rather than a live
  // violation, which is exactly when it is cheapest to add.
  {
    pattern: /shadcn/i,
    why: "no reference-library attribution anywhere in shipped code or copy",
  },
  // Three shapes, because the real risk is someone adding the preset as
  // code, not prose: `motionPresets` in packages/registry/src/lib/motion.ts
  // is unquoted object keys, one per line (`bounce: {`), so a `pop: {`
  // entry there is caught by neither the quoted-string alternatives nor a
  // same-line "pop ... preset" pairing (`.` doesn't cross the newline, and
  // the enclosing object is named `motionPresets`, several lines above any
  // individual key). `\bpop\s*:` matches that object-key shape directly.
  { pattern: /"pop"|'pop'|\bpop\s*:|\bpop\b(?=.*preset)/, why: "there is no preset named pop" },
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
// the roots above is still fully scanned.
function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.test\.(ts|tsx)$/.test(entry)) continue;
    else if (/\.(ts|tsx|css|mjs|mdx)$/.test(entry)) yield full;
  }
}

let failed = false;
let scanned = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    scanned += 1;
    const source = readFileSync(file, "utf8");
    for (const { pattern, why } of FORBIDDEN) {
      const match = source.match(pattern);
      if (match) {
        console.error(
          `${path.relative(REPO_ROOT, file)}: found "${match[0]}" — ${why}`
        );
        failed = true;
      }
    }
  }
}

if (failed) process.exit(1);
console.log(`PASS: no forbidden copy (${scanned} files across ${ROOTS.length} roots)`);
