import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * No component may hard-code a colour.
 *
 * This is in the repository's own PR checklist — "No hard-coded colours, all
 * colour comes from the token layer" — and it was being broken in the
 * registry itself. Both Dialog and AlertDialog painted their backdrop
 * `bg-black/50`.
 *
 * The cost was not only inconsistency. A hard-coded scrim cannot retune: 50%
 * black over an already-dark canvas is far heavier than the same 50% over a
 * light one, so dark mode got a backdrop nobody chose. `--nika-scrim` is
 * tuned per theme.
 *
 * A checklist item that nothing enforces is a suggestion. This is the
 * enforcement.
 */

const uiDir = path.dirname(fileURLToPath(import.meta.url));

const files = fs
  .readdirSync(uiDir)
  .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"));

/**
 * Tailwind's literal colour utilities, hex, and the CSS colour functions.
 * Deliberately does not flag `/10`-style opacity suffixes on token names —
 * `bg-primary/15` is still going through the token layer.
 */
const HARD_CODED =
  /\b(?:bg|text|border|ring|fill|stroke|shadow|from|via|to)-(?:black|white|slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?\b|#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

describe("no hard-coded colours in the registry", () => {
  it("scans a non-empty set of components", () => {
    // Guard against a glob that silently matches nothing, which would make
    // every assertion below vacuously pass.
    expect(files.length).toBeGreaterThan(20);
  });

  for (const file of files) {
    it(file, () => {
      const src = fs.readFileSync(path.join(uiDir, file), "utf-8");
      // Strip comments: prose may legitimately name a colour when explaining
      // why one was removed.
      const code = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      const hit = code.match(HARD_CODED);
      expect(hit ? `${file}: ${hit[0]}` : null).toBeNull();
    });
  }
});
