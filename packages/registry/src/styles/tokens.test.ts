/**
 * @vitest-environment node
 *
 * This file reads tokens.css off disk and touches no DOM. The suite-wide
 * jsdom environment gives `import.meta.url` an `http://localhost/` base,
 * which `fileURLToPath` rejects; the node environment makes it a real file
 * URL (same reasoning as motion-anchors.test.ts, next to this file's UI
 * counterpart in ../lib).
 *
 * WHY THIS FILE EXISTS: three of the five accent presets in tokens.css once
 * paired a mid-lightness `--nika-primary` with a near-white
 * `--nika-primary-fg`, landing under WCAG AA (4.5:1) for the 14px
 * font-medium label a Button renders — violet, azure and rose all failed,
 * silently, because the contrast ratios tokens.css documents were prose,
 * not something any test read. This file closes that gap:
 *
 *   - It PARSES the real tokens.css rather than restating its colour values
 *     here. A test with its own hardcoded copy of the palette would keep
 *     passing while the stylesheet drifted out from under it — exactly how
 *     the original defect shipped unnoticed.
 *   - It computes contrast with `culori`, a real colour library, instead of
 *     hand-rolled OKLCH math. `wcagContrast` is fed colours already run
 *     through `toGamut("rgb")`, culori's implementation of the CSS Color 4
 *     gamut-mapping algorithm (reduce chroma at fixed lightness/hue until
 *     in-gamut) — the same thing a browser does with an out-of-sRGB
 *     oklch() value. Naive channel-clamping instead of gamut-mapping was
 *     checked against real Chromium canvas rendering during development
 *     and drifts by up to ~0.15 on the values in this file; `toGamut`
 *     matched the browser to within ~0.01.
 *   - Every accent × state (`primary`, `primary-hover`, `primary-press`)
 *     is asserted against that accent's `primary-fg`. The accent list
 *     comes from parsing, not a hardcoded array, so a sixth accent — or a
 *     press value nudged back into failure — is covered automatically.
 *
 * IF THIS FAILS: a shipped accent (or a new one) now renders its primary
 * button label under WCAG AA. Fix the failing state's lightness in
 * tokens.css (lightness is the lever that moves contrast in this palette;
 * chroma barely does — see the ACCENTS and danger comments there) rather
 * than loosening this test.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { toGamut, wcagContrast } from "culori";

const AA_NORMAL_TEXT = 4.5;

/**
 * WCAG 2 contrast ratio between two CSS colour strings, computed the way a
 * browser actually renders them: gamut-mapped into sRGB first, not
 * channel-clamped. See the file header for why that distinction matters
 * here.
 */
function contrastRatio(a: string, b: string): number {
  // "rgb" / "oklch" spelled out explicitly: they're culori's own defaults
  // for toGamut, but @types/culori marks both parameters required even
  // though the implementation defaults them — passing them keeps the
  // behaviour identical to plain `toGamut("rgb")` while satisfying that.
  const toSrgbGamut = toGamut("rgb", "oklch");
  return wcagContrast(toSrgbGamut(a), toSrgbGamut(b));
}

interface CssBlock {
  selector: string;
  vars: Map<string, string>;
}

/**
 * A deliberately small, non-nested-brace CSS reader — not a general parser.
 * tokens.css has no @media queries or nested rules, so "everything between
 * one `{` and the next `}`" is a safe way to split it into blocks. Comments
 * are stripped first: the file's own header comment names
 * `[data-accent="violet"]` in prose, which — left in — gets matched as if
 * it were a real selector and corrupts the first block's extracted name.
 */
function parseBlocks(css: string): CssBlock[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks: CssBlock[] = [];
  const blockPattern = /([^{}]+)\{([^{}]*)\}/g;
  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = blockPattern.exec(withoutComments)) !== null) {
    // Neither capture group in blockPattern is optional, so a successful
    // match always populates both — the undefined checks below exist only
    // to satisfy noUncheckedIndexedAccess, not because either is reachable.
    const rawSelector = blockMatch[1];
    const body = blockMatch[2];
    if (rawSelector === undefined || body === undefined) continue;

    const selector = rawSelector.trim().replace(/\s+/g, " ");
    const vars = new Map<string, string>();
    const varPattern = /--nika-([\w-]+)\s*:\s*([^;]+);/g;
    let varMatch: RegExpExecArray | null;
    while ((varMatch = varPattern.exec(body)) !== null) {
      const key = varMatch[1];
      const value = varMatch[2];
      if (key === undefined || value === undefined) continue;
      vars.set(key, value.trim());
    }
    blocks.push({ selector, vars });
  }
  return blocks;
}

interface AccentTokens {
  name: string;
  primary: string;
  primaryHover: string;
  primaryPress: string;
  primaryFg: string;
}

interface ParsedTokens {
  accents: AccentTokens[];
  canvas: string;
  success: string;
  warning: string;
  danger: string;
  dangerFg: string;
}

const ACCENT_SELECTOR = /\[data-accent="([a-z]+)"\]/;

function parseTokens(css: string): ParsedTokens {
  const blocks = parseBlocks(css);

  const accents = blocks
    .filter(
      (block) =>
        ACCENT_SELECTOR.test(block.selector) &&
        block.vars.has("primary") &&
        block.vars.has("primary-fg")
    )
    .map((block): AccentTokens => {
      const nameMatch = ACCENT_SELECTOR.exec(block.selector);
      const name = nameMatch?.[1];
      const primary = block.vars.get("primary");
      const primaryHover = block.vars.get("primary-hover");
      const primaryPress = block.vars.get("primary-press");
      const primaryFg = block.vars.get("primary-fg");
      if (!name || !primary || !primaryHover || !primaryPress || !primaryFg) {
        throw new Error(
          `tokens.css: accent block "${block.selector}" is missing one of ` +
            "primary/primary-hover/primary-press/primary-fg — parsing bug " +
            "or a genuinely incomplete accent, either way fix it before " +
            "trusting this test."
        );
      }
      return { name, primary, primaryHover, primaryPress, primaryFg };
    });

  // The block that defines `--nika-canvas` under a bare `:root` is the
  // LIGHT theme's (the dark theme redefines `--nika-canvas` too, but under
  // `.dark`). The block that defines `--nika-success` under a bare `:root`
  // is the semantic/status block — status colours are documented against
  // the light canvas specifically.
  const canvasBlock = blocks.find(
    (block) => block.selector === ":root" && block.vars.has("canvas")
  );
  const semanticBlock = blocks.find(
    (block) => block.selector === ":root" && block.vars.has("success")
  );

  const canvas = canvasBlock?.vars.get("canvas");
  const success = semanticBlock?.vars.get("success");
  const warning = semanticBlock?.vars.get("warning");
  const danger = semanticBlock?.vars.get("danger");
  const dangerFg = semanticBlock?.vars.get("danger-fg");

  if (!canvas || !success || !warning || !danger || !dangerFg) {
    throw new Error(
      "tokens.css: could not parse canvas/success/warning/danger/danger-fg " +
        "— parsing bug or the file was restructured; fix before trusting " +
        "this test."
    );
  }

  return { accents, canvas, success, warning, danger, dangerFg };
}

const tokensPath = fileURLToPath(new URL("./tokens.css", import.meta.url));
const tokensSource = fs.readFileSync(tokensPath, "utf-8");
const tokens = parseTokens(tokensSource);

describe("tokens.css parsing", () => {
  // A parser that silently finds zero accents would make every assertion
  // below vacuously pass — a green suite that tests nothing. This is the
  // guard against that failure mode, not a restatement of the palette.
  it("finds every documented accent", () => {
    expect(tokens.accents.map((accent) => accent.name)).toEqual(
      expect.arrayContaining(["sun", "violet", "emerald", "azure", "rose"])
    );
    expect(tokens.accents.length).toBeGreaterThanOrEqual(5);
  });
});

describe("accent primary vs primary-fg clears WCAG AA (4.5:1) in every state", () => {
  const states: { key: string; value: (accent: AccentTokens) => string }[] = [
    { key: "primary", value: (accent) => accent.primary },
    { key: "primary-hover", value: (accent) => accent.primaryHover },
    { key: "primary-press", value: (accent) => accent.primaryPress },
  ];

  for (const accent of tokens.accents) {
    describe(`[data-accent="${accent.name}"]`, () => {
      for (const state of states) {
        it(`${state.key} vs primary-fg >= ${AA_NORMAL_TEXT}:1`, () => {
          const ratio = contrastRatio(accent.primaryFg, state.value(accent));
          expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
        });
      }
    });
  }
});

describe("other contrast figures tokens.css documents in prose", () => {
  // "L 0.575 takes it to 4.70:1" — packages/registry/src/styles/tokens.css
  it("danger vs danger-fg clears AA and matches the documented ~4.70:1", () => {
    const ratio = contrastRatio(tokens.dangerFg, tokens.danger);
    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    expect(ratio).toBeCloseTo(4.7, 1);
  });

  // "success measures 2.08:1 ... against it [the light canvas]"
  it("success vs the light canvas matches the documented ~2.08:1 (sub-AA, by design)", () => {
    const ratio = contrastRatio(tokens.success, tokens.canvas);
    expect(ratio).toBeCloseTo(2.08, 1);
  });

  // "warning 1.70:1 against it [the light canvas]"
  it("warning vs the light canvas matches the documented ~1.70:1 (sub-AA, by design)", () => {
    const ratio = contrastRatio(tokens.warning, tokens.canvas);
    expect(ratio).toBeCloseTo(1.7, 1);
  });

  // NOT bound here: "They are safe as fills, borders and large icons" and
  // "Tint the surface and keep `text-content` for the body — the treatment
  // Alert and Toast both use." Both are claims about how components apply
  // these tokens (fill vs. text, which surface gets tinted), not a ratio
  // derivable from tokens.css alone — checking them means reading Alert's
  // and Toast's rendered output, which belongs in a test for those
  // components, not in a token-layer parsing test.
});
