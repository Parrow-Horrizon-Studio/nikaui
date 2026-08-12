/**
 * @vitest-environment node
 *
 * This file reads source off disk and touches no DOM. The suite-wide jsdom
 * environment gives `import.meta.url` an `http://localhost/` base, which
 * `fileURLToPath` rejects; the node environment makes it a real file URL.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Guards `packages/cli/src/utils/motion-source.ts` against drift in *this*
 * package.
 *
 * `nikaui init` and `nikaui add` bake the preset chosen at setup into the
 * copy of `lib/motion.ts` they write, by substituting three exact strings.
 * `applyMotionPreset` throws if any of them is missing or duplicated —
 * deliberately, because silently writing an unmodified file is the bug that
 * whole mechanism exists to prevent.
 *
 * Nothing else catches that. Renaming the built-in default in the file next
 * to this one keeps `pnpm lint`, `pnpm check-types` and `pnpm build` green
 * while `nikaui init` starts throwing — the failure lands on end users
 * running the published CLI, not on CI.
 *
 * WHY IT LIVES HERE, in the registry rather than the CLI: the dependency
 * runs the other way (the CLI reads this package's source; this package does
 * not know the CLI exists), and `packages/cli` has no test harness. But the
 * file that breaks the contract is `../lib/motion.ts`, so the test that
 * fails has to run whenever this package changes. The three strings below
 * are duplicated from `motion-source.ts` — that duplication is the cost, and
 * this comment is the pointer that makes it maintainable.
 *
 * IF THIS FAILS: you changed how `lib/motion.ts` spells its built-in
 * default. Update `ANCHORS` in `packages/cli/src/utils/motion-source.ts` to
 * match, and this list with it. Do not just delete the assertion — the CLI
 * will throw for real users.
 */
const ANCHORS = [
  // useConfiguredMotion's final fallback — no provider mounted at all.
  // It lives there rather than in useMotionPreset, which delegates the
  // configured-preset lookup to it and only layers reduced motion on top.
  "return motionPresets.spring;",
  // NikaMotionConfig's own default — a provider mounted with no preset prop.
  `  preset = "spring",`,
  // The precedence list in useMotionPreset's doc comment.
  `→ "spring"`,
];

const source = fs.readFileSync(
  fileURLToPath(new URL("./motion.ts", import.meta.url)),
  "utf-8"
);

const occurrences = (haystack: string, needle: string) =>
  haystack.split(needle).length - 1;

describe("lib/motion.ts keeps the anchors the CLI substitutes", () => {
  it.each(ANCHORS)("contains %j exactly once", (anchor) => {
    expect(occurrences(source, anchor)).toBe(1);
  });

  it("still names `spring` as the shipped default", () => {
    // If the shipped default is ever changed to another preset, every anchor
    // above changes with it and so does motion-source.ts. This assertion
    // makes that a single, obvious failure rather than three cryptic ones.
    expect(source).toContain("return motionPresets.spring;");
  });
});
