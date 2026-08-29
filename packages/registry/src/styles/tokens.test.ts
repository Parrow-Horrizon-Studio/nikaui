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
 *     through `toGamut("rgb", "oklch")`, culori's implementation of the CSS
 *     Color 4 gamut-mapping algorithm (reduce chroma at fixed lightness/hue
 *     until in-gamut) — the same resolution path a browser takes for an
 *     out-of-sRGB oklch() value, rather than a naive per-channel clamp. On
 *     the fifteen pairs in this file the two methods mostly agree (eight are
 *     identical to 4 decimal places) and differ by at most 0.0017 — not
 *     load-bearing for any of these values, since none sit that close to
 *     4.5. `toGamut` is still the correct choice on principle: it is what
 *     actually happens on screen, and the gap can matter for other values.
 *   - Every accent × state (`primary`, `primary-hover`, `primary-press`)
 *     is asserted against that accent's `primary-fg`. The accent list
 *     comes from parsing, not a hardcoded array, so a press value nudged
 *     back into failure is covered automatically — and so is a sixth
 *     accent, backed by a parity check (below) that fails loudly if the
 *     accent-name pattern ever silently drops one instead of matching it.
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
 * one `{` and the next `}`" is a safe way to split it into blocks.
 *
 * Expects comments already stripped from `css` — the caller (parseTokens)
 * does that once and reuses the stripped text for both this and the accent
 * parity count below, so the two can't drift apart. The file's own header
 * comment names `[data-accent="violet"]` in prose, which — left in — gets
 * matched as if it were a real selector and corrupts the first block's
 * extracted name; that's what stripping guards against.
 */
/**
 * Strips what the block reader below cannot represent: comments, and
 * @keyframes blocks. The latter arrived with the Skeleton shimmer and are the
 * file's only nested-brace construct — parseBlocks splits on "everything
 * between one { and the next }", so a keyframe would otherwise be read as if
 * its percentage steps were selectors.
 *
 * Shared by parseTokens and the H1 additions at the bottom, so the two cannot
 * drift apart on what counts as parseable.
 */
function strip(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");
}

function parseBlocks(withoutComments: string): CssBlock[] {
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
  accentSelectorCount: number;
  canvas: string;
  success: string;
  warning: string;
  danger: string;
  dangerFg: string;
}

// `[\w-]+` (word chars plus hyphen) covers every plausible accent name —
// `cobalt`, `deep-sea`, `sun2`, `seaFoam` — not just lowercase-a-z. An
// earlier version of this pattern was lowercase-only and silently dropped
// every one of those; nothing here caught it because the vacuity guards
// below only checked for the five accents that already existed. The parity
// check right after them is what actually catches that class of bug now —
// and it deliberately does NOT reuse this pattern to establish its ground
// truth (see accentSelectorCount below): a character class that's wrong
// for extraction would be equally wrong for counting, and the two checks
// would agree with each other while both silently missing the same thing.
const ACCENT_SELECTOR = /\[data-accent="([\w-]+)"\]/;

function parseTokens(css: string): ParsedTokens {
  const withoutComments = strip(css);
  const blocks = parseBlocks(withoutComments);

  // Ground truth for the parity check: how many accent selectors the file
  // *opens*, counted from the literal `[data-accent="` prefix alone — no
  // name-character assumptions, no closing `"]`, nothing shared with
  // ACCENT_SELECTOR above. If that pattern's character class is ever wrong
  // for a real accent name (this bug, or a future one it doesn't yet
  // cover), this count still reflects the file's actual accent count, and
  // the assertion below catches the mismatch instead of both numbers
  // quietly agreeing on the same wrong answer.
  const accentSelectorCount = (withoutComments.match(/\[data-accent="/g) ?? []).length;

  const accents = blocks
    // Filter on the selector alone. Filtering on `vars.has(...)` here as
    // well used to let a block that matches `[data-accent="..."]` but is
    // missing a required variable (a typo, a copy-paste that dropped a
    // line, a `@media` override that only sets some of them) disappear
    // silently instead of hitting the throw below — the one branch where
    // silence hides an actual defect. Every block whose selector names an
    // accent now always reaches the completeness check.
    .filter((block) => ACCENT_SELECTOR.test(block.selector))
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

  return { accents, accentSelectorCount, canvas, success, warning, danger, dangerFg };
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

  // The guard above only checks that the five known accents are present —
  // it stays green even if a sixth, differently-spelled accent's selector
  // silently failed to parse into an AccentTokens entry, because
  // arrayContaining and a >= length check don't notice an extra element
  // going missing. This checks the actual count of `[data-accent="..."]`
  // selectors in the file against how many were successfully parsed, so a
  // silent drop — from an accent-name character the pattern doesn't
  // recognise, or from some other future parsing gap — fails here by name
  // instead of vanishing.
  it("parses exactly as many accents as the file declares", () => {
    expect(tokens.accents.length).toBe(tokens.accentSelectorCount);
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
    expect(ratio).toBeCloseTo(4.7, 2);
  });

  // "success measures 2.08:1 ... against it [the light canvas]"
  it("success vs the light canvas matches the documented ~2.08:1 (sub-AA, by design)", () => {
    const ratio = contrastRatio(tokens.success, tokens.canvas);
    expect(ratio).toBeCloseTo(2.08, 2);
  });

  // "warning 1.70:1 against it [the light canvas]"
  it("warning vs the light canvas matches the documented ~1.70:1 (sub-AA, by design)", () => {
    const ratio = contrastRatio(tokens.warning, tokens.canvas);
    expect(ratio).toBeCloseTo(1.7, 2);
  });

  // NOT bound here: "They are safe as fills, borders and large icons" and
  // "Tint the surface and keep `text-content` for the body — the treatment
  // Alert and Toast both use." Both are claims about how components apply
  // these tokens (fill vs. text, which surface gets tinted), not a ratio
  // derivable from tokens.css alone — checking them means reading Alert's
  // and Toast's rendered output, which belongs in a test for those
  // components, not in a token-layer parsing test.
});

/* ===================================================================
   H1 additions — the tokens introduced for component polish.

   WHY THESE ARE HERE: the block above binds *text* contrast (WCAG AA,
   4.5:1). `--nika-indicator` exists for a different rule — WCAG 2.1
   SC 1.4.11 Non-text Contrast, 3:1, which governs a control's state
   indicator. The Switch off-track measured 1.27:1 on `--nika-line` and
   1.54:1 on `--nika-line-strong`; neither is a bug in those tokens,
   which are hairline and divider colours doing their own job correctly.
   No neutral in the scale reached 3:1 while still reading as "off,
   neutral, not the accent", so the fix was a new token rather than a
   nudged value — and this is what stops it drifting back.

   The same token carries the unchecked checkbox border, the unchecked
   radio ring, and the slider and progress tracks, so one assertion
   here covers a family of components.

   IF THIS FAILS: lower `--nika-indicator`'s lightness in tokens.css.
   Lightness is the lever that moves contrast in this palette; chroma
   barely does.
   =================================================================== */

const AA_NON_TEXT = 3;

const strippedSource = strip(tokensSource);
const allBlocks = parseBlocks(strippedSource);

/**
 * Reads one token from the block with the given selector.
 *
 * Deliberately finds the block that actually DEFINES the token rather
 * than the first block matching the selector: tokens.css has several
 * `:root` blocks (light palette, semantic/radius/motion, and the `sun`
 * accent share it), so selector alone is ambiguous and a Map keyed by
 * selector would silently return whichever came last.
 */
function readToken(selector: string, name: string): string {
  const block = allBlocks.find(
    (candidate) => candidate.selector === selector && candidate.vars.has(name)
  );
  if (!block) {
    throw new Error(
      `tokens.css: no block with selector "${selector}" defines --nika-${name}`
    );
  }
  return block.vars.get(name) as string;
}

const themeBlockSource = strippedSource.slice(
  strippedSource.indexOf("@theme inline")
);

describe("--nika-indicator clears WCAG 1.4.11 (3:1) for state indicators", () => {
  const themes: { label: string; selector: string }[] = [
    { label: "light", selector: ":root" },
    { label: "dark", selector: ".dark" },
  ];

  for (const theme of themes) {
    describe(theme.label, () => {
      // The switch off-track sits directly on the page.
      it(`indicator vs canvas >= ${AA_NON_TEXT}:1`, () => {
        const ratio = contrastRatio(
          readToken(theme.selector, "indicator"),
          readToken(theme.selector, "canvas")
        );
        expect(ratio).toBeGreaterThanOrEqual(AA_NON_TEXT);
      });

      // An unchecked checkbox or radio usually sits on a card, and the
      // switch thumb inside the off-track is itself `--nika-surface`.
      it(`indicator vs surface >= ${AA_NON_TEXT}:1`, () => {
        const ratio = contrastRatio(
          readToken(theme.selector, "indicator"),
          readToken(theme.selector, "surface")
        );
        expect(ratio).toBeGreaterThanOrEqual(AA_NON_TEXT);
      });
    });
  }
});

describe("H1 tokens are bridged into @theme inline", () => {
  // A --nika-* variable that is never mapped compiles fine and is
  // unusable from a utility class — the failure is silent at build time
  // and only visible on screen. This is the guard.
  const bridged = [
    "field",
    "field-hover",
    "field-press",
    "inverse",
    "inverse-content",
    "scrim",
    "indicator",
    "shimmer",
  ];

  for (const name of bridged) {
    it(`maps --nika-${name}`, () => {
      expect(themeBlockSource).toContain(`--color-${name}:`);
      expect(themeBlockSource).toContain(`var(--nika-${name})`);
    });
  }
});

/* ===================================================================
   Focus ring, WCAG 2.1 SC 1.4.11 (3:1 for a focus indicator).

   FOUND BY MEASURING, NOT BY REVIEW. --nika-ring was
   color-mix(in oklch, var(--nika-primary) 55%, transparent) — a decorative
   definition, a transparency of the brand colour. Composited over the light
   canvas that measured 1.75:1 against a 3:1 requirement, and it failed in
   dark too (2.81:1). Every focusable component in the library was affected,
   in both themes, across all five accents.

   Dropping the transparency was not sufficient: the accent at full opacity
   still reached only 2.69:1 in light. The light ring is therefore a darkened
   value per accent. In dark the accent clears 3:1 unaided, so the ring is the
   accent itself.

   IF THIS FAILS: a new accent needs a tuned light ring, or an existing one
   was nudged. Lower the ring's lightness — chroma barely moves contrast here.
   =================================================================== */

const AA_FOCUS_INDICATOR = 3;

/** The block defining `ring` for one accent, whatever selector shape it uses. */
function accentRing(name: string): string {
  const block = allBlocks.find(
    (candidate) =>
      candidate.selector.includes(`[data-accent="${name}"]`) &&
      candidate.vars.has("ring")
  );
  if (!block) throw new Error(`tokens.css: accent "${name}" defines no --nika-ring`);
  return block.vars.get("ring") as string;
}

describe("focus ring clears 3:1 in every accent and both themes", () => {
  for (const accent of tokens.accents) {
    describe(`[data-accent="${accent.name}"]`, () => {
      it("light ring vs canvas and surface", () => {
        const ring = accentRing(accent.name);
        expect(contrastRatio(ring, readToken(":root", "canvas"))).toBeGreaterThanOrEqual(
          AA_FOCUS_INDICATOR
        );
        expect(contrastRatio(ring, readToken(":root", "surface"))).toBeGreaterThanOrEqual(
          AA_FOCUS_INDICATOR
        );
      });

      it("dark ring vs canvas and surface", () => {
        // In dark the ring resolves to the accent itself.
        expect(
          contrastRatio(accent.primary, readToken(".dark", "canvas"))
        ).toBeGreaterThanOrEqual(AA_FOCUS_INDICATOR);
        expect(
          contrastRatio(accent.primary, readToken(".dark", "surface"))
        ).toBeGreaterThanOrEqual(AA_FOCUS_INDICATOR);
      });
    });
  }

  it("no accent defines the ring as a transparency of the accent", () => {
    // The original defect in one assertion: a `transparent` mix cannot be
    // contrast-checked by the block above, because it has no fixed value
    // until it composites.
    for (const accent of tokens.accents) {
      expect(accentRing(accent.name)).not.toContain("transparent");
    }
  });

  it("dark restores the ring to the accent, after the accent blocks", () => {
    // Equal specificity: source order is what makes this win. If it ever
    // moves above the accents, dark silently keeps the darkened light ring.
    const darkRingIndex = strippedSource.lastIndexOf("--nika-ring: var(--nika-primary)");
    const lastAccentIndex = strippedSource.lastIndexOf('[data-accent="');
    expect(darkRingIndex).toBeGreaterThan(lastAccentIndex);
  });
});
