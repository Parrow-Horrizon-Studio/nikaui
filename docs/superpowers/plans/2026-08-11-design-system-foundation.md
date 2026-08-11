# Design-System Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace three coexisting token systems with one owned token layer, give motion a preset API with a five-step resolution order, and make `nikaui init` actually deliver the tokens — so that for the first time a consumer outside this monorepo gets working, themed components.

**Architecture:** A single authored CSS file in the registry is the token source. Namespaced `--nika-*` variables carry the values; a `@theme inline` block maps them onto unprefixed Tailwind utilities, which is what lets runtime accent switching work. The CLI copies that file into the consumer's project and adds one `@import`. Motion becomes a *feel* (spring config + travel multiplier) resolved through an optional provider, not a boolean.

**Tech Stack:** Tailwind CSS v4 (`@theme inline`), OKLCH, Motion (motion.dev), Headless UI React, class-variance-authority, TypeScript 5.9, Vitest, pnpm 9, Node 22.

**Spec:** [`docs/superpowers/specs/2026-08-09-nikaui-design-system-foundation.md`](../specs/2026-08-09-nikaui-design-system-foundation.md)

## Global Constraints

- **Every CSS variable Nika defines is prefixed `--nika-`.** No exceptions. Nika ships by copy-paste into projects that may already have another library defining `--primary` in `:root`; an unprefixed variable silently corrupts one of the two libraries.
- **Tailwind utilities are NOT prefixed.** `bg-primary`, not `bg-nika-primary`. The mapping happens once in `@theme inline`.
- **`@theme inline`, never plain `@theme`.** `inline` makes utilities reference the variable instead of copying its value. Plain `@theme` breaks runtime accent switching.
- **Light/dark switches on the `.dark` class. Accent switches on `[data-accent]`.** Values: `sun` (default), `violet`, `emerald`, `azure`, `rose`.
- **`:root` carries LIGHT values; `.dark` overrides with DARK.** The design prototype is inverted (dark in `:root`); this plan deliberately flips it to match the `.dark`-class convention that next-themes and Tailwind's `dark:` variant assume.
- **`--nika-code` is dark in BOTH themes.** Deliberate.
- **Fonts are not shipped.** `--nika-font-sans` and `--nika-font-mono` are system stacks. Manrope and JetBrains Mono belong to the documentation site only, loaded there via `next/font`.
- **Node `>=20`**, pnpm `9`. `.nvmrc` pins `22`.
- **The advertised command is `npx nikaui`, never `npx nika`.**
- **No reference-library attribution.** Nothing in code, file names, component names, registry entries, or documentation may attribute anything to another component library.
- **`pnpm lint`, `pnpm check-types`, `pnpm build` must all pass before any commit.** `ci` is a required status check on `main` and it is currently green. Keep it green.

## The token mapping table

This table is the complete specification for the component migration in Tasks 7 and 8. It was derived by extracting every token-bearing utility class actually present across the 22 existing components — the left column is exhaustive for this codebase, not illustrative.

| Old utility | New utility | Note |
|---|---|---|
| `bg-background` | `bg-canvas` | |
| `text-foreground` | `text-content` | |
| `text-foreground/50` | `text-content-subtle` | opacity modifier becomes a real token |
| `bg-card` | `bg-surface` | |
| `text-card-foreground` | `text-content` | the pair collapses — same value |
| `bg-popover` | `bg-overlay` | |
| `text-popover-foreground` | `text-content` | the pair collapses |
| `bg-primary` | `bg-primary` | name survives, source changes |
| `bg-primary/90` | `bg-primary-hover` | real token; opacity-mixing OKLCH shifts perceived lightness |
| `text-primary` | `text-primary` | |
| `text-primary-foreground` | `text-primary-fg` | |
| `border-primary` | `border-primary` | |
| `bg-secondary` | `bg-surface-2` | |
| `bg-secondary/80` | `bg-muted` | |
| `text-secondary-foreground` | `text-content` | |
| `bg-muted` | `bg-muted` | |
| `text-muted-foreground` | `text-content-muted` | |
| `bg-accent` | `bg-muted` | `accent` is repurposed as the gradient partner — every hover surface becomes `muted` |
| `text-accent-foreground` | `text-content` | |
| `bg-destructive` | `bg-danger` | |
| `bg-destructive/90` | `bg-danger/90` | danger has no `-hover` token; keep the modifier |
| `text-destructive-foreground` | `text-danger-fg` | |
| `border-destructive` | `border-danger` | |
| `border-input` | `border-line-strong` | |
| `bg-input` | `bg-canvas-2` | |
| `bg-border` | `bg-line` | used for separators |
| `ring-ring` | `ring-ring` | name survives, source changes |
| `ring-offset-background` | `ring-offset-canvas` | the focus-ring offset must match the page, not Tailwind's white default |

**Anything not in this table is not a token utility and must not be touched.** `rounded-md`, `h-10`, `px-4`, `text-sm`, `font-medium`, `transition-colors`, `disabled:opacity-50` and similar are layout and typography — leave them exactly as they are.

### Four rules the table's rename rows cannot express

These were found by enumerating every colour-bearing utility actually present in `packages/registry/src/ui/` after Task 7. They are part of the migration, not exceptions to it.

**1. A border width with no border colour gets `border-line`.** `border`, `border-b`, `border-t` and friends resolve to `currentColor` in Tailwind v4 — so today these borders render in the *text* colour, which is never what was intended. Add `border-line` alongside the width utility wherever no border-colour utility is already present. Do not add it where one is (`border-line-strong`, `border-danger`, `border-primary`, `border-transparent`).

**2. `toast.tsx`'s `success` variant stops hard-coding green.** It currently reads `border-green-500/50 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100`. `--nika-success` exists and is deliberately theme-invariant, so one set of utilities covers both themes and the `dark:` variants go away:

```
border-success/30 bg-success/10 text-content
```

**The hue is the surface, never the body text.** This rule originally specified `border-success/50 bg-success/10 text-success`, and that form is unreadable: `text-success` on a 10% wash of `--nika-success` over the light canvas measures **1.94:1**, because the hue and a tenth of it over a near-white page land at almost the same luminance. `text-content` on the same tint measures 14.9:1. The status hues are safe as fills, borders and large icons; they are not body-text colours on the light canvas (`--nika-success` alone is 2.08:1 against it, `--nika-warning` 1.70:1). `alert.tsx` uses the corrected form, and the same treatment applies to every status variant of every component.

**3. `bg-black/50` on the dialog and alert-dialog scrims stays.** It is the one hard-coded colour that survives. There is no scrim token, a pure black at low alpha is correct on both canvases, and inventing `--nika-scrim` after the token layer has been reviewed and closed is a bigger change than this migration should carry. Leave both sites exactly as they are.

**4. A `ring-offset-<width>` with no offset colour gets `ring-offset-canvas`.** Exactly the `border-line` situation in rule 1, one property over. Tailwind v4 defaults `--tw-ring-offset-color` to `#fff`, so `ring-offset-2` on its own draws a white band between the element and its focus ring — invisible on the light canvas and a bright halo on the dark one. Add `ring-offset-canvas` wherever an offset width appears with no offset colour, carrying the same variant prefix the width uses (`focus-visible:ring-offset-2` takes `focus-visible:ring-offset-canvas`). The mapping table's `ring-offset-background` → `ring-offset-canvas` row only covers the sites that already named a colour; these are the sites that never did.

`bg-transparent`, `border-transparent`, `bg-current`, `outline-none` and every `shadow-*` are also not token utilities. Leave them. (`ring-offset-2` was listed here as well; rule 4 supersedes that — the width utility stays, but it no longer travels alone.)

### The completeness check

This pattern is the gate for Tasks 7 and 8. It was validated against two fixtures before being written here: a correctly-migrated file (zero hits, including the CVA variant key — `destructive:` at the time, `danger:` since the prop vocabulary was renamed to match the token — and the five rows whose names survive) and a fixture containing all twenty-three stale names (every one caught).

```bash
grep -rnE '\b(bg-background|text-foreground|bg-card|text-card-foreground|bg-popover|text-popover-foreground|bg-primary/90|text-primary-foreground|bg-secondary|text-secondary-foreground|text-muted-foreground|bg-accent|text-accent-foreground|bg-destructive|text-destructive-foreground|border-destructive|border-input|bg-input|bg-border|ring-offset-background)\b' packages/registry/src/ui/ || echo "PASS: no stale token utilities remain"
```

It deliberately omits `bg-primary`, `text-primary`, `border-primary`, `bg-muted` and `ring-ring` — those names survive the migration, so their presence signals nothing, and including them produces substring false positives against `bg-primary-hover`.

## Already fixed — do not go looking for these

The spec's §3 lists three defects for B. **One of them is already gone.**

`packages/cli/src/commands/add.ts:23` — `REGISTRY_BASE_URL` pointed at `raw.githubusercontent.com/nicaui/…`, a transposition of an account that does not exist. Sub-project E corrected it to `Parrow-Horrizon-Studio` and verified the URL returns HTTP 200. It is right today; leave it alone.

The other two are real and are Tasks 5 and 6: `init` never writes CSS, and `add` flattens every target to its basename.

## A note on testing

**This sub-project introduces the repository's first test framework.** Spec E §E4 deferred it here deliberately: the motion preset resolver — five-step precedence with a reduced-motion override — is the first thing in this codebase genuinely worth unit-testing. Task 1 establishes Vitest; Task 3 is written test-first against it.

CSS token values and className strings are **not** unit-tested. Asserting that a string contains `bg-canvas` tests the test, not the software. Those are verified by the end-to-end check in Task 11, which is the real bar.

## File Structure

**Created**

| File | Responsibility |
|---|---|
| `packages/registry/src/styles/tokens.css` | The authored token layer: `:root`, `.dark`, five `[data-accent]` blocks, `@theme inline` mapping |
| `packages/registry/src/ui/alert.tsx` | New component |
| `packages/registry/src/ui/textarea.tsx` | New component |
| `packages/registry/src/ui/radio-group.tsx` | New component |
| `packages/registry/src/ui/slider.tsx` | New component |
| `packages/registry/src/ui/progress.tsx` | New component |
| `packages/registry/vitest.config.ts` | Test runner configuration |
| `packages/registry/src/lib/motion.test.ts` | Resolver tests |
| `packages/cli/src/utils/registry-files.ts` | `REGISTRY_BASE_URL` and `getRegistryFile` — the one registry reader `add` and `init` share |

**Modified**

| File | Change |
|---|---|
| `packages/registry/src/lib/motion.ts` | Rewritten: five presets, `NikaMotionConfig`, `useMotionPreset` |
| `packages/registry/src/ui/*.tsx` (22 files) | className migration per the table; `animated` → `motion` on button and card |
| `packages/cli/src/commands/init.ts` | Writes `nika-tokens.css` and the `@import`; `motion` becomes a preset name |
| `packages/cli/src/commands/add.ts` | Honours full relative targets instead of flattening to basename |
| `packages/cli/src/utils/config.ts` | `motion: MotionPreset`; `aliases.blocks` |
| `packages/cli/src/registry.json` | Schema v2: `access`, alias-relative targets, `styles` group |
| `apps/docs/src/app/globals.css` | Imports the registry token layer; assigns `--color-fd-*` from `--nika-*` |
| `apps/docs/src/app/layout.tsx` | Loads Manrope and JetBrains Mono via `next/font`; `defaultTheme="dark"` |

**Deleted**

| Path | Reason |
|---|---|
| `packages/tailwind-config/` | Exports a `nikaTheme` object nothing imports; superseded by an authored CSS file |

---

### Task 1: Test harness

The repository has no test runner. `turbo.json` declares a `test` task that nothing implements. Task 3 is written test-first and cannot begin until this exists.

**Files:**
- Create: `packages/registry/vitest.config.ts`
- Create: `packages/registry/src/lib/motion.test.ts` (placeholder smoke test, replaced in Task 3)
- Modify: `packages/registry/package.json`
- Modify: `turbo.json`

**Interfaces:**
- Consumes: nothing
- Produces: `pnpm --filter @nikaui/registry test` runs Vitest. Task 3 depends on this exact command.

- [ ] **Step 1: Install Vitest and the React testing stack**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/registry add -D vitest@^3.2.4 @vitest/coverage-v8@^3.2.4 jsdom@^26.1.0 @testing-library/react@^16.3.0 @testing-library/dom@^10.4.0
```

Expected: install succeeds. These are devDependencies of the registry package only — they are never copied into a consumer's project, because the CLI copies individual source files, not the package.

- [ ] **Step 2: Write `packages/registry/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 3: Add the `test` script**

In `packages/registry/package.json`, add to `scripts`:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 4: Wire the `test` task into Turbo**

In `turbo.json`, confirm a `test` task exists under `tasks`. If it does not, add:

```json
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    }
```

If it already exists, leave it alone.

- [ ] **Step 5: Write a smoke test that proves the harness runs**

Create `packages/registry/src/lib/motion.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { motionPresets } from "./motion";

describe("motion harness", () => {
  it("exposes the preset table", () => {
    expect(Object.keys(motionPresets).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 6: Run the test and watch it PASS**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/registry test
```

Expected: the suite runs (proving Vitest is wired) and this test **passes**, because `motion.ts` currently exports a `motionPresets` object with nine entries. That is the correct outcome for a smoke test — it proves the harness executes and can import from source. Task 3 replaces this file entirely.

If Vitest itself fails to start, fix that before continuing.

- [ ] **Step 7: Verify the workspace gate still passes**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git add -A && git commit -m "test: add Vitest harness to the registry package

The repository had no test runner and turbo.json declared a test task
nothing implemented. The motion preset resolver is the first thing here
worth unit-testing, so the harness lands ahead of it."
```

---

### Task 2: The token layer

The single authored file that every component, block, template, and the documentation site will read from.

**Files:**
- Create: `packages/registry/src/styles/tokens.css`

**Interfaces:**
- Consumes: nothing
- Produces: CSS variables `--nika-*` and the Tailwind utilities `bg-canvas`, `bg-canvas-2`, `bg-surface`, `bg-surface-2`, `bg-overlay`, `bg-muted`, `bg-code`, `text-content`, `text-content-muted`, `text-content-subtle`, `border-line`, `border-line-strong`, `bg-line`, `bg-primary`, `bg-primary-hover`, `bg-primary-press`, `text-primary-fg`, `bg-accent`, `ring-ring`, `bg-success`, `bg-warning`, `bg-danger`, `text-danger-fg`, `bg-info`. Tasks 7, 8, 9 and 10 all consume these exact names.

- [ ] **Step 1: Create the styles directory**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && mkdir -p packages/registry/src/styles && ls packages/registry/src
```

Expected: `lib`, `styles`, `ui`.

- [ ] **Step 2: Write `packages/registry/src/styles/tokens.css`**

Values are ported from the design prototype's OKLCH set. Note the inversion: the prototype puts dark in `:root`; this file puts light there, per the Global Constraints.

```css
/* =====================================================================
   Nika UI — token layer

   Every visual value in Nika lives here. Components never hard-code a
   colour; they use the utilities mapped at the bottom of this file.

   Switch theme with the `.dark` class on <html>.
   Switch accent with [data-accent="violet"] (or emerald, azure, rose).

   You own this file. Edit it freely — or delete it and write your own,
   as long as the @theme inline block still maps the same utility names.
   ===================================================================== */

/* ---------- LIGHT (default) ---------- */
:root {
  --nika-canvas:          oklch(0.985 0.004 85);
  --nika-canvas-2:        oklch(0.965 0.005 80);
  --nika-surface:         oklch(1 0 0);
  --nika-surface-2:       oklch(0.975 0.004 85);
  --nika-overlay:         oklch(1 0 0);
  --nika-muted:           oklch(0.955 0.006 80);

  --nika-content:         oklch(0.235 0.012 55);
  --nika-content-muted:   oklch(0.44 0.012 60);
  --nika-content-subtle:  oklch(0.56 0.012 62);

  --nika-line:            oklch(0.905 0.006 75);
  --nika-line-strong:     oklch(0.845 0.008 70);

  /* Code blocks stay dark in both themes — deliberate. */
  --nika-code:            oklch(0.215 0.008 60);

  --nika-shadow-color:    35deg 30% 55%;
  --nika-shadow-sm:       0 1px 2px hsl(var(--nika-shadow-color) / 0.14);
  --nika-shadow:          0 6px 22px -6px hsl(var(--nika-shadow-color) / 0.20);
  --nika-shadow-lg:       0 22px 55px -14px hsl(var(--nika-shadow-color) / 0.26);
  --nika-glow:
    0 0 0 1px color-mix(in oklch, var(--nika-primary) 28%, transparent),
    0 10px 32px -8px color-mix(in oklch, var(--nika-primary) 38%, transparent);

  color-scheme: light;
}

/* ---------- DARK ---------- */
.dark {
  --nika-canvas:          oklch(0.165 0.006 60);
  --nika-canvas-2:        oklch(0.195 0.007 60);
  --nika-surface:         oklch(0.205 0.008 60);
  --nika-surface-2:       oklch(0.235 0.009 60);
  --nika-overlay:         oklch(0.215 0.008 60);
  --nika-muted:           oklch(0.255 0.009 60);

  --nika-content:         oklch(0.965 0.005 85);
  --nika-content-muted:   oklch(0.745 0.012 75);
  --nika-content-subtle:  oklch(0.605 0.012 70);

  --nika-line:            oklch(0.305 0.010 60);
  --nika-line-strong:     oklch(0.375 0.013 60);

  --nika-code:            oklch(0.185 0.007 60);

  --nika-shadow-color:    0deg 0% 0%;
  --nika-shadow-sm:       0 1px 2px hsl(var(--nika-shadow-color) / 0.28);
  --nika-shadow:          0 4px 16px -4px hsl(var(--nika-shadow-color) / 0.42);
  --nika-shadow-lg:       0 18px 50px -12px hsl(var(--nika-shadow-color) / 0.62);
  --nika-glow:
    0 0 0 1px color-mix(in oklch, var(--nika-primary) 30%, transparent),
    0 8px 30px -6px color-mix(in oklch, var(--nika-primary) 45%, transparent);

  color-scheme: dark;
}

/* ---------- ACCENTS ---------- */
/* sun is the default: it applies with no attribute present. */
:root,
[data-accent="sun"] {
  --nika-primary:        oklch(0.705 0.188 47);
  --nika-primary-hover:  oklch(0.748 0.178 50);
  --nika-primary-press:  oklch(0.655 0.193 44);
  --nika-primary-fg:     oklch(0.18 0.03 50);
  --nika-accent:         oklch(0.845 0.152 84);
  --nika-ring:           color-mix(in oklch, var(--nika-primary) 55%, transparent);
}

[data-accent="violet"] {
  --nika-primary:        oklch(0.635 0.205 290);
  --nika-primary-hover:  oklch(0.678 0.198 290);
  --nika-primary-press:  oklch(0.59 0.205 288);
  --nika-primary-fg:     oklch(0.985 0.01 290);
  --nika-accent:         oklch(0.72 0.16 330);
  --nika-ring:           color-mix(in oklch, var(--nika-primary) 55%, transparent);
}

[data-accent="emerald"] {
  --nika-primary:        oklch(0.695 0.155 162);
  --nika-primary-hover:  oklch(0.735 0.148 162);
  --nika-primary-press:  oklch(0.645 0.155 160);
  --nika-primary-fg:     oklch(0.16 0.03 165);
  --nika-accent:         oklch(0.82 0.13 190);
  --nika-ring:           color-mix(in oklch, var(--nika-primary) 55%, transparent);
}

[data-accent="azure"] {
  --nika-primary:        oklch(0.64 0.165 248);
  --nika-primary-hover:  oklch(0.685 0.158 248);
  --nika-primary-press:  oklch(0.595 0.168 246);
  --nika-primary-fg:     oklch(0.985 0.01 250);
  --nika-accent:         oklch(0.78 0.13 210);
  --nika-ring:           color-mix(in oklch, var(--nika-primary) 55%, transparent);
}

[data-accent="rose"] {
  --nika-primary:        oklch(0.655 0.205 18);
  --nika-primary-hover:  oklch(0.70 0.196 18);
  --nika-primary-press:  oklch(0.61 0.205 16);
  --nika-primary-fg:     oklch(0.985 0.01 20);
  --nika-accent:         oklch(0.80 0.15 50);
  --nika-ring:           color-mix(in oklch, var(--nika-primary) 55%, transparent);
}

/* ---------- SEMANTIC, RADIUS, TYPE, MOTION ---------- */
:root {
  --nika-success:   oklch(0.74 0.15 150);
  --nika-warning:   oklch(0.82 0.15 80);
  --nika-danger:    oklch(0.635 0.2 25);
  --nika-danger-fg: oklch(0.99 0 0);
  --nika-info:      oklch(0.7 0.13 235);

  --nika-radius:       0.7rem;
  --nika-radius-sm:    calc(var(--nika-radius) - 4px);
  --nika-radius-md:    calc(var(--nika-radius) - 2px);
  --nika-radius-lg:    var(--nika-radius);
  --nika-radius-xl:    calc(var(--nika-radius) + 6px);
  --nika-radius-2xl:   calc(var(--nika-radius) + 14px);
  --nika-radius-full:  999px;

  /* System stacks by design. Nika does not download a font for you. */
  --nika-font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  --nika-font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
    "Liberation Mono", monospace;

  --nika-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --nika-ease-out:    cubic-bezier(0.22, 1, 0.36, 1);
  --nika-ease-snap:   cubic-bezier(0.16, 1, 0.3, 1);
  --nika-ease-inout:  cubic-bezier(0.65, 0, 0.35, 1);

  --nika-duration-fast:   140ms;
  --nika-duration:        200ms;
  --nika-duration-slow:   340ms;
  --nika-duration-spring: 520ms;
}

/* ---------- TAILWIND MAPPING ----------
   `inline` is required: it makes each utility reference the variable
   rather than copy its value, which is what allows switching .dark or
   [data-accent] at runtime to retune everything already rendered.      */
@theme inline {
  --color-canvas:          var(--nika-canvas);
  --color-canvas-2:        var(--nika-canvas-2);
  --color-surface:         var(--nika-surface);
  --color-surface-2:       var(--nika-surface-2);
  --color-overlay:         var(--nika-overlay);
  --color-muted:           var(--nika-muted);
  --color-code:            var(--nika-code);

  --color-content:         var(--nika-content);
  --color-content-muted:   var(--nika-content-muted);
  --color-content-subtle:  var(--nika-content-subtle);

  --color-line:            var(--nika-line);
  --color-line-strong:     var(--nika-line-strong);

  --color-primary:         var(--nika-primary);
  --color-primary-hover:   var(--nika-primary-hover);
  --color-primary-press:   var(--nika-primary-press);
  --color-primary-fg:      var(--nika-primary-fg);
  --color-accent:          var(--nika-accent);
  --color-ring:            var(--nika-ring);

  --color-success:         var(--nika-success);
  --color-warning:         var(--nika-warning);
  --color-danger:          var(--nika-danger);
  --color-danger-fg:       var(--nika-danger-fg);
  --color-info:            var(--nika-info);

  --radius-sm:             var(--nika-radius-sm);
  --radius-md:             var(--nika-radius-md);
  --radius-lg:             var(--nika-radius-lg);
  --radius-xl:             var(--nika-radius-xl);
  --radius-2xl:            var(--nika-radius-2xl);
  --radius-full:           var(--nika-radius-full);

  --font-sans:             var(--nika-font-sans);
  --font-mono:             var(--nika-font-mono);

  --shadow-sm:             var(--nika-shadow-sm);
  --shadow-md:             var(--nika-shadow);
  --shadow-lg:             var(--nika-shadow-lg);

  --ease-spring:           var(--nika-ease-spring);
  --ease-out:              var(--nika-ease-out);
  --ease-snap:             var(--nika-ease-snap);
  --ease-inout:            var(--nika-ease-inout);
}
```

- [ ] **Step 3: Verify the file parses as CSS and defines what it claims**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && node -e "
const css = require('fs').readFileSync('packages/registry/src/styles/tokens.css','utf8');
const open = (css.match(/{/g)||[]).length, close = (css.match(/}/g)||[]).length;
console.log('braces balanced:', open === close, '(' + open + '/' + close + ')');
const need = ['--nika-canvas','--nika-content','--nika-line','--nika-primary','--nika-accent','--nika-ring','--nika-danger-fg','--nika-code','--nika-radius','--nika-font-sans','--nika-ease-spring'];
const missing = need.filter(v => !css.includes(v + ':'));
console.log('missing tokens:', missing.length ? missing.join(', ') : 'none');
for (const a of ['sun','violet','emerald','azure','rose']) {
  if (!css.includes('[data-accent=\"' + a + '\"]')) console.log('MISSING ACCENT', a);
}
console.log('accents present: 5');
console.log('theme inline present:', css.includes('@theme inline'));
console.log('plain @theme misuse:', /@theme(?!\s+inline)/.test(css));
"
```

Expected: `braces balanced: true`, `missing tokens: none`, `accents present: 5`, `theme inline present: true`, `plain @theme misuse: false`.

- [ ] **Step 4: Verify no unprefixed variable was defined**

`grep -E` is POSIX ERE and has no negative lookahead — `(?!…)` is not a
lookahead there, it is a literal, and the check silently stops discriminating.
Use a positive match for every declared variable, then filter out the allowed
prefixes; whatever survives is a leak.

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && grep -nE "^[[:space:]]+--[a-z]" packages/registry/src/styles/tokens.css | grep -vE "^[0-9]+:[[:space:]]+--(nika|color|radius|font|shadow|ease)-" || echo "PASS: every declared variable is namespaced or inside @theme inline"
```

Expected: the PASS line. Any output is the offending line, printed with its line number — an unprefixed variable leaked into `:root` and will collide in a consumer's project.

The allowed prefixes are `--nika-` for the authored layer and `--color-`, `--radius-`, `--font-`, `--shadow-`, `--ease-` for the `@theme inline` block, which is Tailwind's namespace rather than ours.

- [ ] **Step 5: Commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git add packages/registry/src/styles/tokens.css && git commit -m "feat: add the Nika token layer

One owned token vocabulary replacing three coexisting systems. All
variables are namespaced --nika-* so the library is drop-in safe beside
another component library; utilities stay unprefixed via @theme inline,
which also is what makes runtime accent switching work.

:root carries light and .dark carries dark, inverting the prototype, to
match the class-based convention next-themes and Tailwind assume."
```

---

### Task 3: Motion preset API

A preset is a *feel* — a spring configuration plus a travel-intensity multiplier — not a specific animation. Each component decides what it animates; the preset decides how that feels. This is what lets one preset name mean something coherent on a Button's hover, a Dialog's enter, and an Accordion's height.

Written test-first: the five-step resolution order is real logic with real precedence bugs available to it.

**Files:**
- Modify: `packages/registry/src/lib/motion.ts` (complete rewrite)
- Modify: `packages/registry/src/lib/motion.test.ts` (replaces the Task 1 smoke test)

**Interfaces:**
- Consumes: `useReducedMotion` from `motion/react`
- Produces:
  - `motionPresets` — the five-entry table
  - `type MotionPreset = "none" | "snap" | "glide" | "spring" | "bounce"`
  - `type NikaComponent = string`
  - `NikaMotionConfig` — optional React provider, props `{ preset?: MotionPreset; components?: Partial<Record<string, MotionPreset>>; children: React.ReactNode }`
  - `useMotionPreset(component: string, prop?: MotionPreset) => { transition: Transition; scale: { hover: number; tap: number } }`

  Tasks 7, 8 and 9 all call `useMotionPreset`. The signature is `(component, prop)` in that order.

- [ ] **Step 1: Write the failing tests**

Reduced motion is driven by a **module mock**, not by reassigning `window.matchMedia`. Motion caches its reduced-motion state at module scope — it reads the media query exactly once per module instance, i.e. once per test file — so the first render in the file latches the value for every test after it, and reassigning `matchMedia` between tests does nothing. Mocking the module is the only way to retarget it per case.

`motion.ts` takes exactly one **value** import from `motion/react`: `useReducedMotion`. (`Transition` is a type-only import and is erased before runtime.) The factory below therefore supplies everything the module under test needs — if you ever add another value import from `motion/react` to `motion.ts`, add it to the factory too or the import will throw.

Replace the entire contents of `packages/registry/src/lib/motion.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import * as React from "react";
import { motionPresets, NikaMotionConfig, useMotionPreset } from "./motion";

// Motion caches its reduced-motion state at MODULE scope, so mocking
// window.matchMedia only takes effect for the first render in the file.
// Mock the module and drive it from a hoisted, mutable flag instead.
const mocks = vi.hoisted(() => ({ reducedMotion: false }));
vi.mock("motion/react", () => ({
  useReducedMotion: () => mocks.reducedMotion,
}));

beforeEach(() => {
  mocks.reducedMotion = false;
});

describe("motionPresets", () => {
  it("defines exactly the five documented presets", () => {
    expect(Object.keys(motionPresets)).toEqual([
      "none",
      "snap",
      "glide",
      "spring",
      "bounce",
    ]);
  });

  it("orders presets by descending damping, which is the whole scale", () => {
    const damping = (["snap", "glide", "spring", "bounce"] as const).map(
      (k) => (motionPresets[k].transition as { damping: number }).damping
    );
    expect(damping).toEqual([...damping].sort((a, b) => b - a));
  });

  it("makes none a true no-op", () => {
    expect(motionPresets.none.scale.hover).toBe(1);
    expect(motionPresets.none.scale.tap).toBe(1);
  });
});

describe("useMotionPreset resolution order", () => {
  it("falls back to spring when nothing is configured", () => {
    const { result } = renderHook(() => useMotionPreset("button"));
    expect(result.current).toEqual(motionPresets.spring);
  });

  it("prefers the instance prop over the built-in default", () => {
    const { result } = renderHook(() => useMotionPreset("button", "bounce"));
    expect(result.current).toEqual(motionPresets.bounce);
  });

  it("prefers a provider global default over the built-in default", () => {
    const { result } = renderHook(() => useMotionPreset("button"), {
      wrapper: ({ children }) =>
        React.createElement(NikaMotionConfig, { preset: "glide" }, children),
    });
    expect(result.current).toEqual(motionPresets.glide);
  });

  it("prefers a provider per-component override over the provider default", () => {
    const { result } = renderHook(() => useMotionPreset("dialog"), {
      wrapper: ({ children }) =>
        React.createElement(
          NikaMotionConfig,
          { preset: "glide", components: { dialog: "none" } },
          children
        ),
    });
    expect(result.current).toEqual(motionPresets.none);
  });

  it("prefers the instance prop over a provider per-component override", () => {
    const { result } = renderHook(() => useMotionPreset("dialog", "bounce"), {
      wrapper: ({ children }) =>
        React.createElement(
          NikaMotionConfig,
          { preset: "glide", components: { dialog: "none" } },
          children
        ),
    });
    expect(result.current).toEqual(motionPresets.bounce);
  });

  it("lets a per-component override apply only to its own component", () => {
    const { result } = renderHook(() => useMotionPreset("button"), {
      wrapper: ({ children }) =>
        React.createElement(
          NikaMotionConfig,
          { preset: "glide", components: { dialog: "none" } },
          children
        ),
    });
    expect(result.current).toEqual(motionPresets.glide);
  });

  it("forces none under reduced motion, overriding an explicit prop", () => {
    mocks.reducedMotion = true;
    const { result } = renderHook(() => useMotionPreset("button", "bounce"));
    expect(result.current).toEqual(motionPresets.none);
  });

  it("forces none under reduced motion, overriding the provider", () => {
    mocks.reducedMotion = true;
    const { result } = renderHook(() => useMotionPreset("dialog"), {
      wrapper: ({ children }) =>
        React.createElement(
          NikaMotionConfig,
          { preset: "bounce", components: { dialog: "bounce" } },
          children
        ),
    });
    expect(result.current).toEqual(motionPresets.none);
  });
});
```

- [ ] **Step 2: Run the tests and verify they FAIL**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/registry test
```

Expected: FAIL. `NikaMotionConfig` and `useMotionPreset` are not exported from `motion.ts`, and the current `motionPresets` has nine entries with different names. Errors will mention undefined exports.

- [ ] **Step 3: Write the implementation**

Replace the entire contents of `packages/registry/src/lib/motion.ts`:

```ts
"use client";

import * as React from "react";
import { useReducedMotion, type Transition } from "motion/react";

/**
 * A preset is a *feel*, not an animation.
 *
 * Each component decides what it animates — a Button scales on hover, a
 * Dialog fades and lifts on enter, an Accordion animates height. The preset
 * decides how any of that feels: a spring configuration plus a travel
 * multiplier. That is what lets one name stay coherent across components
 * that animate entirely different properties.
 *
 * The scale is ordered by descending damping: snap and glide never
 * overshoot, spring overshoots slightly, bounce pronouncedly.
 */
export const motionPresets = {
  none: {
    transition: { duration: 0 } as Transition,
    scale: { hover: 1, tap: 1 },
  },
  snap: {
    transition: { type: "spring", stiffness: 700, damping: 40 } as Transition,
    scale: { hover: 1.01, tap: 0.99 },
  },
  glide: {
    transition: { type: "spring", stiffness: 220, damping: 32 } as Transition,
    scale: { hover: 1.02, tap: 0.98 },
  },
  spring: {
    transition: { type: "spring", stiffness: 420, damping: 22 } as Transition,
    scale: { hover: 1.03, tap: 0.97 },
  },
  bounce: {
    transition: { type: "spring", stiffness: 520, damping: 13 } as Transition,
    scale: { hover: 1.05, tap: 0.94 },
  },
} as const;

export type MotionPreset = keyof typeof motionPresets;
export type MotionFeel = (typeof motionPresets)[MotionPreset];

interface MotionContextValue {
  preset: MotionPreset;
  components: Partial<Record<string, MotionPreset>>;
}

const MotionContext = React.createContext<MotionContextValue | null>(null);

export interface NikaMotionConfigProps {
  /** Global default for every component beneath this provider. */
  preset?: MotionPreset;
  /** Per-component overrides, keyed by component name — e.g. { dialog: "none" }. */
  components?: Partial<Record<string, MotionPreset>>;
  children: React.ReactNode;
}

/**
 * Optional. Components land in repositories where nobody wrapped the app;
 * without this provider they fall through to the built-in `spring` default
 * and animate normally. That is a hard requirement of copy-paste
 * distribution, not a convenience.
 */
export function NikaMotionConfig({
  preset = "spring",
  components,
  children,
}: NikaMotionConfigProps) {
  const value = React.useMemo(
    () => ({ preset, components: components ?? {} }),
    [preset, components]
  );
  return React.createElement(MotionContext.Provider, { value }, children);
}

/**
 * Resolve the feel for one component instance.
 *
 * Most specific wins:
 *   1. prefers-reduced-motion: reduce  → forced `none`
 *   2. instance prop                   → <Button motion="bounce">
 *   3. provider per-component override → components={{ dialog: "none" }}
 *   4. provider global default         → preset="glide"
 *   5. built-in default                → "spring"
 *
 * Reduced motion sits above an explicit prop on purpose. A library selling
 * itself on animation is the one that has to get this right.
 */
export function useMotionPreset(
  component: string,
  prop?: MotionPreset
): MotionFeel {
  const ctx = React.useContext(MotionContext);
  const prefersReduced = useReducedMotion();

  if (prefersReduced) return motionPresets.none;
  if (prop) return motionPresets[prop];
  if (ctx?.components?.[component]) {
    return motionPresets[ctx.components[component]!];
  }
  if (ctx?.preset) return motionPresets[ctx.preset];
  return motionPresets.spring;
}
```

- [ ] **Step 4: Run the tests and verify they PASS**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/registry test
```

Expected: all 11 tests pass, output pristine — no warnings.

`mocks.reducedMotion` is module-scoped and shared by every test in the file; `beforeEach` resets it to `false`, so only the two tests that set it to `true` see reduced motion.

- [ ] **Step 5: Verify the gate**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build
```

Expected: all pass, cleanly. **Nothing currently imports `motion.ts`** — no file in `packages/registry/src/ui/` or `apps/docs/src/` references `../lib/motion` or `motionPresets` today, so this rewrite is strictly additive and has no downstream breakage to triage. (Fifteen components import `motion/react`, the npm package, which is unrelated; `button.tsx` hard-codes its spring inline rather than reading a preset.) Any failure here is inside `motion.ts` or its test — fix it now, not in Tasks 7 and 8.

- [ ] **Step 6: Commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git add packages/registry/src/lib/motion.ts packages/registry/src/lib/motion.test.ts && git commit -m "feat: motion presets as feels, with a five-step resolver

A preset is a spring configuration plus a travel multiplier, not a named
animation — that is what keeps one preset name coherent across a Button
hover, a Dialog enter and an Accordion height.

Resolution runs reduced-motion, instance prop, provider per-component,
provider default, built-in. Reduced motion deliberately outranks an
explicit prop. The provider is optional so components work in projects
that never wrapped their app."
```

---

### Task 4: Retire `tailwind-config` and move the registry to schema v2

`packages/tailwind-config` exports a `nikaTheme` TypeScript object that nothing imports, and its stated purpose — injecting tokens into a consumer's CSS — is now served by the authored file from Task 2. The registry schema gains the fields blocks and templates will need, so the CLI is written against the final shape once.

**Files:**
- Delete: `packages/tailwind-config/` (entire package)
- Modify: `packages/cli/src/registry.json`
- Modify: `packages/cli/src/utils/registry.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: `packages/registry/src/styles/tokens.css` from Task 2
- Produces: registry entries carrying `access: "free" | "pro"`, `type: "ui" | "lib" | "style" | "block" | "template"`, and alias-relative targets prefixed `@ui/`, `@lib/`, `@styles/`. Tasks 5 and 6 consume this shape.

- [ ] **Step 1: Confirm nothing imports the package**

Markdown is included, because prose that advertises a package the repository no longer ships is the same class of defect as code that imports it. `docs/` and `.superpowers/` are excluded: those trees hold the spec, this plan and the pre-flight notes, all of which legitimately describe this very deletion, and without the exclusions the step could never pass.

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && grep -rn "@nikaui/tailwind-config\|nikaTheme" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.mjs" --include="*.md" --include="*.mdx" . --exclude-dir=node_modules --exclude-dir=.turbo --exclude-dir=dist --exclude-dir=docs --exclude-dir=.superpowers | grep -v "^./packages/tailwind-config/"
```

Expected: **no output.** If anything appears, stop and report — something depends on it and the deletion is not safe.

Note that this grep does *not* catch `README.md`'s package listing, which names the directory `packages/tailwind-config` without either search term. Step 3 handles that.

- [ ] **Step 2: Delete the package**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git rm -r -q packages/tailwind-config && pnpm install && ls packages/
```

Expected: `cli`, `eslint-config`, `registry`, `typescript-config`. Install succeeds and the lockfile drops the workspace entry.

- [ ] **Step 3: Remove the package from the README's listing**

`README.md` lists the monorepo's packages under a `### Packages` heading, and one bullet advertises the package Step 2 just deleted:

```
- `packages/tailwind-config` — shared Tailwind CSS preset and theme tokens
```

Delete that one line. Leave the four remaining bullets (`registry`, `cli`, `eslint-config`, `typescript-config`) exactly as they are, and change nothing else in the file.

Verify:

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && grep -n "tailwind-config" README.md || echo "PASS: the README no longer advertises tailwind-config"
```

Expected: the PASS line.

- [ ] **Step 4: Add the `styles` group and the tokens entry to `registry.json`**

At the top level of `packages/cli/src/registry.json`, alongside the existing `libs` and `components` keys, add:

```json
  "styles": {
    "tokens": {
      "name": "tokens",
      "type": "style",
      "access": "free",
      "description": "The Nika token layer — colours, radius, type and motion variables",
      "files": [
        {
          "source": "styles/tokens.css",
          "target": "@styles/nika-tokens.css"
        }
      ],
      "dependencies": [],
      "registryDependencies": []
    }
  }
```

- [ ] **Step 5: Convert every existing entry to alias-relative targets and add `access`**

Every entry in `libs` and `components` gains `"access": "free"`, and every `files[].target` is rewritten with an alias prefix. Apply this transformation with a script so all 24 entries change consistently:

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && node -e "
const fs = require('fs');
const p = 'packages/cli/src/registry.json';
const r = JSON.parse(fs.readFileSync(p, 'utf8'));
for (const group of ['libs', 'components']) {
  for (const entry of Object.values(r[group])) {
    entry.access = 'free';
    for (const f of entry.files) {
      if (f.target.startsWith('@')) continue;
      if (f.target.startsWith('lib/'))  f.target = '@lib/'  + f.target.slice(4);
      else if (f.target.startsWith('ui/')) f.target = '@ui/' + f.target.slice(3);
    }
  }
}
fs.writeFileSync(p, JSON.stringify(r, null, 2) + '\n');
console.log('libs:', Object.keys(r.libs).length, 'components:', Object.keys(r.components).length, 'styles:', Object.keys(r.styles||{}).length);
"
```

Expected: `libs: 2 components: 22 styles: 1`.

- [ ] **Step 6: Verify every target now carries an alias prefix**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && node -e "
const r = require('./packages/cli/src/registry.json');
const bad = [];
for (const group of ['libs','components','styles'])
  for (const [name, e] of Object.entries(r[group] || {})) {
    if (!e.access) bad.push(name + ': missing access');
    for (const f of e.files)
      if (!/^@(ui|lib|styles|blocks)\//.test(f.target) && f.target !== '@page')
        bad.push(name + ': un-aliased target ' + f.target);
  }
console.log(bad.length ? bad.join('\n') : 'PASS: all targets aliased, all entries carry access');
"
```

Expected: the PASS line.

- [ ] **Step 7: Update the `RegistryEntry` type**

In `packages/cli/src/utils/registry.ts`, widen the entry type to match the new schema. Find the `RegistryEntry` interface and set its `type` and `access` fields to:

```ts
  type: "ui" | "lib" | "style" | "block" | "template";
  access: "free" | "pro";
```

Add the `styles` group wherever `libs` and `components` are read, so a style entry can be resolved by name. Give it its own accessor — `getStyle` alongside `getComponent` — and extend `resolveWithDependencies` to carry a `styles` result set. Do **not** widen `getComponent` itself: `add.ts` validates installable component names through it, and a style entry answering that call would make `nikaui add tokens` look valid when the token layer is delivered by `init`, not by `add`.

- [ ] **Step 8: Verify the gate**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build
```

Expected: all pass.

- [ ] **Step 9: Commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git add -A && git commit -m "refactor: retire tailwind-config, move the registry to schema v2

The package exported a nikaTheme object nothing imported; an authored CSS
file serves its stated purpose properly. The README's package listing is
updated in the same commit so the front page stops advertising it.

Registry entries now carry access and alias-relative targets (@ui/, @lib/,
@styles/) so the CLI is written once against the shape blocks and
templates will need, rather than being reworked for them later."
```

---

### Task 5: `init` delivers the token layer

The defect that makes every component render unstyled outside this monorepo: `init` writes config, utils and motion presets, but never writes CSS — while `tailwind-config/src/theme.ts` documented that it did.

**Files:**
- Create: `packages/cli/src/utils/registry-files.ts`
- Modify: `packages/cli/src/commands/init.ts`
- Modify: `packages/cli/src/commands/add.ts` (loses its private copy of the registry reader)
- Modify: `packages/cli/src/utils/config.ts`

**Interfaces:**
- Consumes: the `styles.tokens` registry entry from Task 4; `MotionPreset` from Task 3
- Produces: `nika.config.ts` carrying `motion: MotionPreset` and `aliases.blocks`; a `nika-tokens.css` beside the consumer's global stylesheet; an `@import` line at the top of that stylesheet. Task 11 verifies all of it end-to-end.

- [ ] **Step 1: Update the config type**

In `packages/cli/src/utils/config.ts`, change the `NikaConfig` interface and `DEFAULT_CONFIG`.

**The `MotionPreset` union is declared here as well as in the registry's `motion.ts`, and that duplication is intentional.** `packages/registry` is source the CLI *copies*, not a package it imports — the CLI has no dependency on it and must not gain one, or the published `nikaui` tarball would need to ship the whole registry. Two declarations of five string literals is the correct cost. If they ever drift, the end-to-end check in Task 11 catches it, because `init` would write a config value the resolver rejects.

```ts
export type MotionPreset = "none" | "snap" | "glide" | "spring" | "bounce";

export interface NikaConfig {
  style: string;
  tailwind: {
    css: string;
  };
  aliases: {
    components: string;
    ui: string;
    utils: string;
    hooks: string;
    blocks: string;
  };
  motion: MotionPreset;
}

const DEFAULT_CONFIG: NikaConfig = {
  style: "default",
  tailwind: {
    css: "./src/app/globals.css",
  },
  aliases: {
    components: "@/components",
    ui: "@/components/ui",
    utils: "@/lib/utils",
    hooks: "@/hooks",
    blocks: "@/components/blocks",
  },
  motion: "spring",
};
```

- [ ] **Step 2: Update the config parser**

Still in `config.ts`, the `motion` field is parsed with a boolean regex that will now never match. Replace:

```ts
  const motionMatch = content.match(/motion:\s*(true|false)/);
  if (motionMatch) config.motion = motionMatch[1] === "true";
```

with:

```ts
  const motionMatch = content.match(
    /motion:\s*"(none|snap|glide|spring|bounce)"/
  );
  if (motionMatch) config.motion = motionMatch[1] as MotionPreset;

  const blocksMatch = content.match(/blocks:\s*"([^"]+)"/);
  if (blocksMatch) config.aliases.blocks = blocksMatch[1]!;
```

- [ ] **Step 3: Replace the motion prompt with a preset choice**

In `packages/cli/src/commands/init.ts`, replace the third prompt (the `confirm` named `motion`) with:

```ts
      {
        type: "select",
        name: "motion",
        message: "Default animation feel?",
        choices: [
          { title: "spring — lively, slight overshoot (recommended)", value: "spring" },
          { title: "glide  — smooth, no overshoot", value: "glide" },
          { title: "snap   — fast and tight", value: "snap" },
          { title: "bounce — pronounced overshoot", value: "bounce" },
          { title: "none   — no animation", value: "none" },
        ],
        initial: 0,
      },
```

- [ ] **Step 4: Write the token file and the import**

In `init.ts`, after the `nika.config.ts` write and before the `cn()` utility write, insert:

```ts
      // Write the token layer beside the consumer's global stylesheet.
      // An isolated file keeps ownership intact — they may edit or delete
      // it freely — while giving a future `update` a file it can replace
      // wholesale, rather than diffing against hand-edited CSS.
      const cssPath = path.join(cwd, response.tailwindCss);
      const cssDir = path.dirname(cssPath);
      await fs.ensureDir(cssDir);

      const tokensSource = await getRegistryFile("styles/tokens.css");
      await fs.writeFile(path.join(cssDir, "nika-tokens.css"), tokensSource);

      // Insert the import after `@import "tailwindcss";` if it is not
      // already present, falling back to the end of the leading import
      // block when that line is absent. This is convention, not necessity:
      // Tailwind marks its own defaults `@theme default`, and its engine
      // refuses to overwrite a key already set by a non-default block, so a
      // project `@theme` wins in either order. Consumer overrides still
      // belong after this line, where the ordinary later-wins rule between
      // two project-level blocks does apply.
      const importLine = '@import "./nika-tokens.css";';
      let wroteImport = false;
      if (await fs.pathExists(cssPath)) {
        const existing = await fs.readFile(cssPath, "utf-8");
        if (!existing.includes("nika-tokens.css")) {
          await fs.writeFile(cssPath, importLine + "\n" + existing);
          wroteImport = true;
        }
      } else {
        await fs.writeFile(cssPath, importLine + "\n");
        wroteImport = true;
      }
```

- [ ] **Step 5: Add the stylesheet-path prompt**

The write above needs `response.tailwindCss`. Add this prompt after `utilsDir`:

```ts
      {
        type: "text",
        name: "tailwindCss",
        message: "Where is your global stylesheet?",
        initial: "src/app/globals.css",
      },
```

And use it in the generated config, replacing the hard-coded `"./src/app/globals.css"`:

```ts
  tailwind: {
    css: "./${response.tailwindCss}",
  },
```

- [ ] **Step 6: Extract the registry file reader into a shared module**

`init.ts` has no way to read registry source, and `add.ts` already has exactly the reader it needs — `REGISTRY_BASE_URL` plus a `getFileContent` that tries the local monorepo checkout first and falls back to the network. **Do not copy it.** Two copies of the registry base URL in one small package is the defect that produced the `nicaui` transposition already fixed once; the next URL change would land in one copy and be missed in the other, and `init` and `add` would silently read from different registries.

Move it instead. `packages/cli/src/utils/` is already where this package keeps shared helpers (`config.ts`, `dependencies.ts`, `registry.ts`, `transformer.ts`), and the build is a single tsup bundle (`tsup src/index.ts --format esm`) emitting one `dist/index.js`, so `import.meta.url` resolves identically no matter which source file the code lives in — the local-path resolution is unaffected by the move.

**6a. Create `packages/cli/src/utils/registry-files.ts`** with the body lifted verbatim from `add.ts`, renamed on the way out:

```ts
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

// Base URL for fetching component source files from the registry
export const REGISTRY_BASE_URL =
  "https://raw.githubusercontent.com/Parrow-Horrizon-Studio/nikaui/main/packages/registry/src";

/**
 * Get registry source file content.
 * First tries the local registry (monorepo development),
 * then falls back to fetching from GitHub.
 */
export async function getRegistryFile(sourcePath: string): Promise<string> {
  // Try local paths (monorepo dev, or installed via node_modules)
  const cliDir = fileURLToPath(new URL(".", import.meta.url));
  const localPaths = [
    // Monorepo: cli/dist/../../../registry/src/
    path.resolve(cliDir, "..", "..", "registry", "src", sourcePath),
    // Installed: node_modules/nikaui/dist/../../../@nikaui/registry/src/
    path.resolve(cliDir, "..", "..", "@nikaui", "registry", "src", sourcePath),
  ];

  for (const localPath of localPaths) {
    if (await fs.pathExists(localPath)) {
      return fs.readFile(localPath, "utf-8");
    }
  }

  // Fall back to remote fetch
  const url = `${REGISTRY_BASE_URL}/${sourcePath}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${sourcePath} from registry (${response.status})`
    );
  }

  return response.text();
}
```

**6b. Strip the copies out of `packages/cli/src/commands/add.ts`.** Delete the `REGISTRY_BASE_URL` constant near the top and the whole `getFileContent` function near the bottom, then add the import:

```ts
import { getRegistryFile } from "../utils/registry-files.js";
```

`copyRegistryFiles` is the only caller; change its one call site from `getFileContent(file.source)` to `getRegistryFile(file.source)`. **Also delete `import { fileURLToPath } from "url";` from `add.ts`** — `getFileContent` was its only consumer, and `lint` runs with `--max-warnings 0`, so leaving it fails the gate.

**6c. Import it in `init.ts`** — the same one line, and nothing else:

```ts
import { getRegistryFile } from "../utils/registry-files.js";
```

`init.ts` does *not* need `fileURLToPath`; the shared module owns that.

Verify there is exactly one registry base URL in the package:

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && grep -rn "raw.githubusercontent.com" packages/cli/src/ && echo "--- expect exactly one hit, in utils/registry-files.ts ---"
```

- [ ] **Step 7: Update the generated config and the summary output**

The generated `nika.config.ts` string must emit `motion` as a quoted preset and include the blocks alias:

```ts
  aliases: {
    components: "${componentsAlias}",
    ui: "${uiAlias}",
    utils: "${utilsAlias}",
    hooks: "${hooksAlias}",
    blocks: "${componentsAlias}/blocks",
  },
  motion: "${response.motion}",
```

The old code writes `lib/motion.ts` only when `response.motion` was `true`. It is now always a string, so replace that conditional with an unconditional write, and update the dependency list — `motion` is always needed because every component imports the resolver:

```ts
      const baseDeps = ["clsx", "tailwind-merge", "motion"];
```

Then extend the summary block so a user sees what actually landed:

```ts
      console.log(chalk.dim(`    - ${path.relative(cwd, path.join(cssDir, "nika-tokens.css"))}`));
      if (wroteImport) {
        console.log(chalk.dim(`    - @import added to ${response.tailwindCss}`));
      }
```

**Do not copy the old inline `motionPresets` string.** The motion module is registry source now; write it with `getRegistryFile("lib/motion.ts")` exactly as the tokens are written.

- [ ] **Step 8: Build and run `init` against a throwaway directory**

**Use a Windows-absolute scratch path, never `/tmp`.** This machine is `win32`: Git Bash resolves `/tmp` to `C:\Users\<you>\AppData\Local\Temp`, but Node's `path.resolve("/tmp/x")` — which is what `init.ts` and `add.ts` both call on `--cwd` — resolves it to `C:\tmp\x`. The CLI would write to one directory while the shell inspected another, and the failure reads like a CLI bug. `C:/Users/rowee/AppData/Local/Temp/nika-scratch/` is understood identically by both.

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter nikaui build && rm -rf "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-init-check" && mkdir -p "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-init-check/src/app" && printf '@import "tailwindcss";\n\nbody { color: red; }\n' > "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-init-check/src/app/globals.css" && printf '{"name":"scratch","version":"1.0.0"}\n' > "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-init-check/package.json" && node packages/cli/dist/index.js init --cwd "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-init-check"
```

Answer the prompts with the defaults. Expected: it completes without error.

- [ ] **Step 9: Verify what `init` actually produced**

```bash
cd "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-init-check" && echo "--- files ---" && find . -type f -not -path "./node_modules/*" | sort && echo "--- globals.css head ---" && head -3 src/app/globals.css && echo "--- config ---" && cat nika.config.ts && echo "--- tokens present? ---" && grep -c "nika-primary" src/app/nika-tokens.css
```

Expected: `nika.config.ts`, `src/app/globals.css`, `src/app/nika-tokens.css`, `src/lib/utils.ts`, `src/lib/motion.ts`. The first line of `globals.css` is the `@import`, and the original `body { color: red; }` survives below it. The config shows `motion: "spring"` and a `blocks` alias. The token grep returns a non-zero count.

- [ ] **Step 10: Verify the import is not duplicated on re-run**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && node packages/cli/dist/index.js init --cwd "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-init-check" && grep -c "nika-tokens.css" "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-init-check/src/app/globals.css"
```

Answer `y` to the overwrite prompt. Expected: `1`. A `2` means the idempotency guard in Step 4 is broken.

- [ ] **Step 11: Verify the gate**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build
```

- [ ] **Step 12: Commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git add -A && git commit -m "feat: init writes the token layer

The defect that made every component render unstyled for anyone outside
this monorepo: init wrote config, utils and motion presets but never any
CSS, while a code comment claimed otherwise. It now writes
nika-tokens.css beside the consumer's stylesheet and prepends one import,
idempotently.

motion becomes a preset name rather than a boolean, and the config gains
a blocks alias ahead of sub-project F."
```

---

### Task 6: `add` honours full relative targets

Both copy paths call `path.basename(file.target)`, discarding directory structure, and `targetDir` is only ever `uiDir` or `libDir`. Every file lands flat in `components/ui/`. Blocks and templates are impossible until this honours the alias-relative targets Task 4 introduced.

**Files:**
- Modify: `packages/cli/src/commands/add.ts`

**Interfaces:**
- Consumes: alias-relative targets from Task 4; `NikaConfig.aliases.blocks` from Task 5
- Produces: files written to the path their target declares, at any nesting depth. Sub-project F depends on this.

- [ ] **Step 1: Add a target resolver**

Add this function near the bottom of `add.ts`, beside `toPascalCase`:

```ts
/**
 * Resolve an alias-relative registry target to an absolute path.
 *
 * Targets look like "@ui/button.tsx", "@lib/utils.ts", "@styles/tokens.css"
 * or "@blocks/dashboard/stats-row.tsx". The alias maps to a configured
 * directory; everything after it is preserved verbatim, including nesting.
 */
function resolveTarget(target: string, cwd: string, config: NikaConfig): string {
  const [, alias, rest] = target.match(/^@([a-z]+)\/(.+)$/) ?? [];
  if (!alias || !rest) {
    throw new Error(
      `Registry target "${target}" is not alias-relative. Expected a form like "@ui/button.tsx".`
    );
  }

  const dirs: Record<string, string> = {
    ui: resolveAliasPath(config.aliases.ui),
    lib: resolveAliasPath(config.aliases.utils).replace(/\/utils$/, ""),
    blocks: resolveAliasPath(config.aliases.blocks),
    styles: path.dirname(config.tailwind.css.replace(/^\.\//, "")),
  };

  const base = dirs[alias];
  if (!base) {
    throw new Error(`Unknown registry alias "@${alias}" in target "${target}".`);
  }

  return path.join(cwd, base, rest);
}
```

- [ ] **Step 2: Use it in the existing-file check**

Replace the block at Step 5 of the action (`for (const entry of allEntries) { ... }`):

```ts
    for (const entry of allEntries) {
      for (const file of entry.files) {
        const targetPath = resolveTarget(file.target, cwd, config);
        if (await fs.pathExists(targetPath)) {
          existingFiles.push(targetPath);
        }
      }
    }
```

The `uiDir` and `libDir` locals above it are now unused by this loop — leave them for now; Step 3 removes their remaining consumer.

- [ ] **Step 3: Rewrite `copyRegistryFiles` to take `cwd` instead of a target directory**

Replace the whole function:

```ts
async function copyRegistryFiles(
  entry: RegistryEntry,
  cwd: string,
  config: NikaConfig
): Promise<void> {
  for (const file of entry.files) {
    const targetPath = resolveTarget(file.target, cwd, config);
    await fs.ensureDir(path.dirname(targetPath));

    const content = await getRegistryFile(file.source);
    // CSS carries no imports to rewrite, and running the TS import
    // transformer over it would corrupt @import lines.
    const output = targetPath.endsWith(".css")
      ? content
      : transformImports(content, config);

    await fs.writeFile(targetPath, output, "utf-8");
  }
}
```

`getRegistryFile` is the shared reader created in Task 5 Step 6; `add.ts` imports it from `../utils/registry-files.js` and no longer declares a reader of its own.

- [ ] **Step 4: Update both call sites**

```ts
      // 7. Copy lib files
      for (const lib of resolved.libs) {
        await copyRegistryFiles(lib, cwd, config);
      }

      // 8. Copy component files
      for (const component of resolved.components) {
        await copyRegistryFiles(component, cwd, config);
      }
```

- [ ] **Step 5: Remove the now-dead locals and preserve `--path`**

Delete the `uiDir` and `libDir` declarations — `resolveTarget` replaces both.

`uiDir` was the only consumer of the `--path` override, so it needs a new home. Rather than threading `options` through `resolveTarget`, apply the override once to the config immediately after it loads, so every downstream resolution sees it. Add directly after the `getConfig` try/catch:

```ts
    // --path overrides where ui/ components land, for this invocation only.
    if (options.path) {
      config = {
        ...config,
        aliases: { ...config.aliases, ui: options.path },
      };
    }
```

This works because `resolveAliasPath` passes through any string without a leading `@/` unchanged, so a plain relative path like `src/ui` resolves to itself.

- [ ] **Step 6: Verify nothing flattens any more**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && grep -n "path.basename" packages/cli/src/commands/add.ts || echo "PASS: no basename flattening remains"
```

Expected: the PASS line.

- [ ] **Step 7: Build and add components into the scratch project from Task 5**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter nikaui build && node packages/cli/dist/index.js add button card dialog --cwd "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-init-check" && find "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-init-check/src" -type f | sort
```

Expected: `src/components/ui/button.tsx`, `card.tsx`, `dialog.tsx`, plus `src/lib/utils.ts` and `src/lib/motion.ts`. Nothing landed flat in the wrong directory.

- [ ] **Step 8: Verify the gate**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build
```

- [ ] **Step 9: Commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git add -A && git commit -m "fix: add writes files to their declared targets

Both copy paths called path.basename on the target, discarding directory
structure, and the destination was only ever the ui or lib directory. Every
file landed flat, which made blocks and templates impossible.

Targets are now alias-relative and resolved against the configured
directories at any nesting depth. CSS skips the TypeScript import
transformer, which would corrupt @import lines."
```

---

### Task 7: Migrate `button` and `card` — the two components with a motion prop

These two are the only components carrying `animated?: boolean`. They establish the pattern every other animated component follows, so they are worked in full here and referenced by name in Task 8.

**Files:**
- Modify: `packages/registry/src/ui/button.tsx`
- Modify: `packages/registry/src/ui/card.tsx`

**Interfaces:**
- Consumes: `useMotionPreset` and `MotionPreset` from Task 3; utilities from Task 2
- Produces: the `motion?: MotionPreset` prop convention that Task 8 and Task 9 follow

- [ ] **Step 1: Rewrite `packages/registry/src/ui/button.tsx`**

```tsx
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion as m, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-press",
        danger: "bg-danger text-danger-fg hover:bg-danger/90",
        outline:
          "border border-line-strong bg-canvas hover:bg-muted hover:text-content",
        secondary: "bg-surface-2 text-content hover:bg-muted",
        ghost: "hover:bg-muted hover:text-content",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "color">,
    VariantProps<typeof buttonVariants> {
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("button", motionProp);

    return (
      <m.button
        whileHover={{ scale: feel.scale.hover }}
        whileTap={{ scale: feel.scale.tap }}
        transition={feel.transition}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

Note the import alias `motion as m`: the `motion` prop name would otherwise shadow the imported namespace. Every animated component in Task 8 uses this same alias.

- [ ] **Step 2: Rewrite `packages/registry/src/ui/card.tsx`**

⚠️ **This is a deliberate behaviour change, and it is the one thing in this task a reviewer should scrutinise.** `Card` currently defaults to `animated = false` — the opposite of `Button`'s `animated = true`. Under the preset model there is no boolean to default: a component animates what it animates, and the preset says how it feels. So `Card` now animates its entrance by default, and `motion="none"` disables it.

That means a page rendering twelve cards will see twelve entrance animations where it previously saw none. That is the correct reading of the spec — `animated={false}` becomes `motion="none"`, and pre-1.0 copy-paste distribution carries no deprecation path — but it is a visible change and belongs in your report.

Only `Card` itself changes; the six sub-components are className migrations.

```tsx
"use client";

import * as React from "react";
import { motion as m, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

export interface CardProps extends HTMLMotionProps<"div"> {
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("card", motionProp);

    return (
      <m.div
        ref={ref}
        initial={{ opacity: 0, y: 20 * (feel.scale.hover - 1) * 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={feel.transition}
        className={cn(
          "rounded-lg border border-line bg-surface text-content shadow-sm",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-content-muted", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
```

The `y` offset is derived from the preset's travel multiplier so a `bounce` card enters from further than a `snap` one, and `none` — whose multiplier is exactly 1 — enters from `y: 0` with a zero-duration transition, which is no animation at all. If that expression reads as too clever when you implement it, a plain `initial={{ opacity: 0, y: feel.scale.hover === 1 ? 0 : 20 }}` is an acceptable substitute; say which you used.

- [ ] **Step 3: Verify neither file references the old vocabulary**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && grep -nE "animated|bg-background|text-foreground|bg-card|text-card-foreground|bg-popover|text-popover-foreground|primary-foreground|bg-secondary|secondary-foreground|text-muted-foreground|bg-accent|accent-foreground|destructive|border-input|bg-input|bg-border" packages/registry/src/ui/button.tsx packages/registry/src/ui/card.tsx || echo "PASS: both files migrated"
```

Expected: the PASS line.

- [ ] **Step 4: Verify the gate**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build && pnpm --filter @nikaui/registry test
```

Expected: all pass, 11 tests green.

- [ ] **Step 5: Commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git add packages/registry/src/ui/button.tsx packages/registry/src/ui/card.tsx && git commit -m "feat: adopt the token vocabulary and motion prop on button and card

animated={false} becomes motion=\"none\", and every other value selects a
feel rather than toggling one. bg-primary/90 becomes the real
primary-hover token, because opacity-mixing OKLCH over varied backgrounds
shifts perceived lightness."
```

---

### Task 8: Migrate the remaining 20 components

Mechanical application of the mapping table, plus the motion-prop pattern from Task 7 for the 13 remaining components that import `motion/react`.

**Files — modify all 20:**

`accordion.tsx`, `alert-dialog.tsx`, `aspect-ratio.tsx`, `avatar.tsx`, `badge.tsx`, `checkbox.tsx`, `combobox.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `input.tsx`, `label.tsx`, `popover.tsx`, `select.tsx`, `separator.tsx`, `skeleton.tsx`, `spinner.tsx`, `switch.tsx`, `tabs.tsx`, `toast.tsx`, `tooltip.tsx`

**Files — also modify:**

`packages/cli/src/registry.json`

**Interfaces:**
- Consumes: the mapping table; `useMotionPreset` from Task 3; the prop convention from Task 7
- Produces: 22 components speaking one vocabulary. Task 10 and Task 11 depend on all of them.

- [ ] **Step 1: Apply the mapping table to all 20 files**

Work file by file. For each, replace every utility appearing in the mapping table at the top of this plan. **Change nothing else** — layout, sizing, typography and state utilities stay exactly as they are.

Order matters for two substrings: replace `text-muted-foreground` **before** `bg-muted`, and `text-accent-foreground` **before** `bg-accent`, or you will corrupt the longer name.

- [ ] **Step 2: Adopt the motion prop wherever a component animates**

Thirteen of these import `motion/react`. For each one:

1. Alias the import: `import { motion as m, ... } from "motion/react";`
2. Add to its props interface:

```ts
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
```

3. Import the resolver: `import { useMotionPreset, type MotionPreset } from "../lib/motion";`
4. Resolve with the component's own name — `useMotionPreset("dialog", motionProp)`, `useMotionPreset("accordion", motionProp)`, and so on. The name is the component's registry name, lowercase and hyphenated.
5. Drive the existing animation from `feel`: `transition={feel.transition}`, and any scale from `feel.scale.hover` / `feel.scale.tap`.

**Keep animating what each component already animates.** A Dialog that fades and lifts keeps fading and lifting; only its spring and travel come from the preset now. Do not unify them onto scale.

For components animating enter/exit rather than interaction — dialog, alert-dialog, popover, dropdown-menu, select, combobox, tooltip, toast, accordion — the scale multipliers still apply where a scale is part of the existing animation. Where the existing animation is opacity or height only, use `feel.transition` alone and leave `feel.scale` unused; that is correct, not an omission.

- [ ] **Step 3: Declare the `motion` registry dependency on every animated entry**

After Steps 1 and 2, fifteen components import `../lib/motion`, but their registry entries still declare `"registryDependencies": ["utils"]`. `resolveWithDependencies` therefore never resolves the `motion` lib for them and `add` never copies `lib/motion.ts` — the copied component ships with a dangling import. It only appears to work because `init` writes that file unconditionally; the moment a consumer deletes it, or `add` is used against a project initialised elsewhere, it breaks. Task 9's new entries already declare it, so leaving these alone would put the two halves of the registry in disagreement.

In `packages/cli/src/registry.json`, set `"registryDependencies": ["utils", "motion"]` on **exactly these fifteen `components` entries** — the complete set that imports `motion/react` today, verified against the working tree:

`accordion`, `alert-dialog`, `button`, `card`, `checkbox`, `combobox`, `dialog`, `dropdown-menu`, `popover`, `select`, `spinner`, `switch`, `tabs`, `toast`, `tooltip`

Leave every other entry at `["utils"]`. `aspect-ratio`, `avatar`, `badge`, `input`, `label`, `separator` and `skeleton` do not animate and must not gain the dependency.

Then, in the same file, give the `motion` **lib** entry its npm package — it declares `"dependencies": []` today, while the module it ships imports `motion/react`:

```json
    "motion": {
      "name": "motion",
      "type": "lib",
      "access": "free",
      "description": "Animation presets and spring configurations",
      "files": [{ "source": "lib/motion.ts", "target": "@lib/motion.ts" }],
      "dependencies": ["motion"],
      "registryDependencies": []
    }
```

- [ ] **Step 4: Verify the whole registry is free of the old vocabulary**

`ring-offset` is in the prefix alternation deliberately: `ring-offset-background` is a token utility that six components carry, and a regex anchored on `\b(bg|text|border|ring|…)-` does not match it — `ring-offset` is a longer prefix, not a `ring-` utility. Without it this check reports PASS while every focused input keeps Tailwind's white default ring offset.

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && grep -rnE '\b(bg-background|text-foreground|bg-card|text-card-foreground|bg-popover|text-popover-foreground|bg-primary/90|text-primary-foreground|bg-secondary|text-secondary-foreground|text-muted-foreground|bg-accent|text-accent-foreground|bg-destructive|text-destructive-foreground|border-destructive|border-input|bg-input|bg-border|ring-offset-background)\b' packages/registry/src/ui/ || echo "PASS: no old token utilities remain"
```

Expected: the PASS line. `ring-offset-canvas` — the migrated form — does not match, and neither does the layout utility `ring-offset-2`.

- [ ] **Step 5: Verify no `animated` prop survives anywhere**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && grep -rn "animated" packages/registry/src/ || echo "PASS: animated prop fully retired"
```

Expected: the PASS line.

- [ ] **Step 6: Verify every animated component resolves a preset**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && echo "import motion/react:" && grep -l "motion/react" packages/registry/src/ui/*.tsx | wc -l && echo "call useMotionPreset:" && grep -l "useMotionPreset" packages/registry/src/ui/*.tsx | wc -l
```

Expected: the two counts are equal. A component that imports the animation library but never resolves a preset is one the provider and reduced-motion cannot reach.

- [ ] **Step 7: Verify the registry declares `motion` everywhere it is needed**

Task 4 rewrote `registry.json` with `JSON.stringify(r, null, 2)`, which explodes every array across several lines — so a text grep for `["utils", "motion"]` would find nothing regardless of correctness. Read the JSON instead:

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && node -e "
const r = require('./packages/cli/src/registry.json');
const animated = ['accordion','alert-dialog','button','card','checkbox','combobox','dialog','dropdown-menu','popover','select','spinner','switch','tabs','toast','tooltip'];
const missing = animated.filter(n => !(r.components[n]?.registryDependencies ?? []).includes('motion'));
console.log('animated entries declaring the motion registry dependency:', animated.length - missing.length, 'of', animated.length);
const libOk = (r.libs.motion.dependencies ?? []).includes('motion');
console.log('libs.motion.dependencies includes motion:', libOk);
console.log(missing.length === 0 && libOk ? 'PASS: every animated component resolves lib/motion, and the motion lib pulls its npm package' : 'FAIL: ' + (missing.length ? 'missing motion on ' + missing.join(', ') : '') + (libOk ? '' : ' libs.motion declares no npm dependency'));
"
```

Expected: `15 of 15`, `true`, and the PASS line.

- [ ] **Step 8: Verify the gate**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build && pnpm --filter @nikaui/registry test
```

Expected: all pass. Lint runs `--max-warnings 0`, so an unused import left behind by the migration fails the build — that is intended.

- [ ] **Step 9: Commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git add packages/registry/src/ui/ packages/cli/src/registry.json && git commit -m "feat: migrate the remaining 20 components to the token vocabulary

Every component now reads from the owned token layer and resolves its
animation feel through the shared resolver, so a provider default, a
per-component override, an instance prop and the reduced-motion setting
all reach every one of them.

The fifteen animated entries now declare motion as a registry dependency,
so add copies lib/motion.ts for them instead of relying on init having
written it, and the motion lib declares its npm package."
```

---

### Task 9: Five new components

All five are already designed in the prototype's stylesheet and none requires a new Headless UI integration. They complete the 27-component first ship.

**Files:**
- Create: `packages/registry/src/ui/alert.tsx`
- Create: `packages/registry/src/ui/textarea.tsx`
- Create: `packages/registry/src/ui/radio-group.tsx`
- Create: `packages/registry/src/ui/slider.tsx`
- Create: `packages/registry/src/ui/progress.tsx`
- Modify: `packages/cli/src/registry.json`

**Interfaces:**
- Consumes: `cn` from `../lib/utils`; `useMotionPreset` from Task 3; utilities from Task 2
- Produces: five registry entries. Task 11 installs them.

- [ ] **Step 1: Write `alert.tsx`**

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-4 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "border-line bg-surface text-content",
        success:
          "border-success/30 bg-success/10 text-content [&>svg]:text-success",
        warning:
          "border-warning/30 bg-warning/10 text-content [&>svg]:text-warning",
        danger: "border-danger/30 bg-danger/10 text-content [&>svg]:text-danger",
        info: "border-info/30 bg-info/10 text-content [&>svg]:text-info",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-content-muted [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, alertVariants };
```

- [ ] **Step 2: Write `textarea.tsx`**

```tsx
import * as React from "react";
import { cn } from "../lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-20 w-full rounded-md border border-line-strong bg-canvas-2 px-3 py-2 text-sm text-content ring-offset-canvas transition-colors placeholder:text-content-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
```

- [ ] **Step 3: Write `radio-group.tsx`**

Built on Headless UI's `RadioGroup`, matching how the existing `select` and `combobox` components consume that library. Read `packages/registry/src/ui/select.tsx` first and follow its import style exactly.

```tsx
"use client";

import * as React from "react";
import { Radio, RadioGroup as HeadlessRadioGroup } from "@headlessui/react";
import { motion as m } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

export interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, children, ...props }, ref) => (
    <HeadlessRadioGroup
      ref={ref}
      className={cn("grid gap-2", className)}
      {...props}
    >
      {children}
    </HeadlessRadioGroup>
  )
);
RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const RadioGroupItem = React.forwardRef<HTMLElement, RadioGroupItemProps>(
  ({ className, children, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("radio-group", motionProp);

    return (
      <Radio
        ref={ref}
        className={cn(
          "group flex cursor-pointer items-center gap-3 text-sm text-content focus-visible:outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
          className
        )}
        {...props}
      >
        {({ checked }) => (
          <>
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-line-strong ring-offset-canvas transition-colors group-data-[checked]:border-primary group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2">
              <m.span
                className="size-2 rounded-full bg-primary"
                initial={false}
                animate={{ scale: checked ? 1 : 0 }}
                transition={feel.transition}
              />
            </span>
            {children}
          </>
        )}
      </Radio>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
```

The indicator is driven by Headless UI's render prop rather than a `data-checked` CSS selector, because Motion animates from React state and cannot read a CSS attribute. `initial={false}` stops the dot animating on first paint for an already-selected option — it should animate on change, not on mount.

Note that `children` becomes a render function here, so a caller passing a plain node still works: the `<>{children}</>` wrapper handles it.

- [ ] **Step 4: Write `slider.tsx`**

A native `input[type=range]` styled through the token layer. No Headless UI equivalent exists and a custom implementation would be materially more code for no accessibility gain.

```tsx
import * as React from "react";
import { cn } from "../lib/utils";

export type SliderProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="range"
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-full bg-muted outline-none ring-offset-canvas transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm",
        "[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary",
        className
      )}
      {...props}
    />
  )
);
Slider.displayName = "Slider";

export { Slider };
```

- [ ] **Step 5: Write `progress.tsx`**

```tsx
"use client";

import * as React from "react";
import { motion as m } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100. Omit for an indeterminate bar. */
  value?: number;
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("progress", motionProp);
    const clamped =
      typeof value === "number" ? Math.min(100, Math.max(0, value)) : undefined;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-muted",
          className
        )}
        {...props}
      >
        <m.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          initial={false}
          animate={{ width: `${clamped ?? 0}%` }}
          transition={feel.transition}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
```

The gradient to `--nika-accent` is the one place the accent token earns its name — it is the gradient partner to primary.

- [ ] **Step 6: Register all five**

Add to the `components` object in `packages/cli/src/registry.json`:

```json
    "alert": {
      "name": "alert",
      "type": "ui",
      "access": "free",
      "description": "A callout for status, warnings and errors",
      "files": [{ "source": "ui/alert.tsx", "target": "@ui/alert.tsx" }],
      "dependencies": ["class-variance-authority"],
      "registryDependencies": ["utils"]
    },
    "textarea": {
      "name": "textarea",
      "type": "ui",
      "access": "free",
      "description": "A multi-line text input",
      "files": [{ "source": "ui/textarea.tsx", "target": "@ui/textarea.tsx" }],
      "dependencies": [],
      "registryDependencies": ["utils"]
    },
    "radio-group": {
      "name": "radio-group",
      "type": "ui",
      "access": "free",
      "description": "A set of mutually exclusive options",
      "files": [{ "source": "ui/radio-group.tsx", "target": "@ui/radio-group.tsx" }],
      "dependencies": ["@headlessui/react", "motion"],
      "registryDependencies": ["utils", "motion"]
    },
    "slider": {
      "name": "slider",
      "type": "ui",
      "access": "free",
      "description": "A range input for selecting a value along a track",
      "files": [{ "source": "ui/slider.tsx", "target": "@ui/slider.tsx" }],
      "dependencies": [],
      "registryDependencies": ["utils"]
    },
    "progress": {
      "name": "progress",
      "type": "ui",
      "access": "free",
      "description": "A determinate or indeterminate progress bar",
      "files": [{ "source": "ui/progress.tsx", "target": "@ui/progress.tsx" }],
      "dependencies": ["motion"],
      "registryDependencies": ["utils", "motion"]
    },
```

- [ ] **Step 7: Verify the count is 27 and every file exists**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && node -e "
const fs = require('fs');
const r = require('./packages/cli/src/registry.json');
const names = Object.keys(r.components);
console.log('registered components:', names.length);
const missing = [];
for (const [n, e] of Object.entries(r.components))
  for (const f of e.files)
    if (!fs.existsSync('packages/registry/src/' + f.source)) missing.push(n + ' -> ' + f.source);
console.log('files on disk for every entry:', missing.length === 0 ? 'yes' : missing.join(', '));
const onDisk = fs.readdirSync('packages/registry/src/ui').filter(f => f.endsWith('.tsx')).length;
console.log('tsx files in ui/:', onDisk);
"
```

Expected: `registered components: 27`, `files on disk for every entry: yes`, `tsx files in ui/: 27`.

- [ ] **Step 8: Verify the gate**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build && pnpm --filter @nikaui/registry test
```

- [ ] **Step 9: Commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git add -A && git commit -m "feat: add alert, textarea, radio-group, slider and progress

Completes the 27-component first ship. All five were already designed in
the prototype and none needed a new primitive integration."
```

---

### Task 10: Documentation site consumes the token layer

The docs app currently defines its own shadcn-style HSL tokens in `@layer base` and maps them in its own `@theme inline`. It now imports the registry's token layer instead and assigns Fumadocs' variables from it — one way only.

**Files:**
- Modify: `apps/docs/src/app/globals.css`
- Modify: `apps/docs/src/app/layout.tsx`

**Interfaces:**
- Consumes: `packages/registry/src/styles/tokens.css` from Task 2
- Produces: a documentation site rendering on the same tokens the CLI ships

- [ ] **Step 1: Rewrite `apps/docs/src/app/globals.css`**

Read the existing file first to preserve any rule that is genuinely the docs site's own. Replace the `@layer base` token block and the existing `@theme inline` block with the following — and note that the `@source` line is **not** new: it already sits in the file, immediately below the imports, and it is load-bearing. `component-previews.tsx` imports 22 components straight from `@nikaui/registry/ui/*`, which lives outside the docs app's automatic source-detection root, so dropping that directive makes Tailwind stop scanning the registry and every component preview renders with no classes generated — while the build stays green and the grep in Step 5 still prints PASS. Keep it.

```css
@import "tailwindcss";
@import "fumadocs-ui/css/neutral.css";
@import "fumadocs-ui/css/preset.css";
@import "@nikaui/registry/styles/tokens.css";
@source "../../../../packages/registry/src";

/* Fumadocs chrome inherits the Nika accent. One way only: --color-fd-* is
   assigned from --nika-*, never the reverse, and never in the registry. */
:root {
  --color-fd-background: var(--nika-canvas);
  --color-fd-foreground: var(--nika-content);
  --color-fd-muted: var(--nika-muted);
  --color-fd-muted-foreground: var(--nika-content-muted);
  --color-fd-popover: var(--nika-overlay);
  --color-fd-popover-foreground: var(--nika-content);
  --color-fd-card: var(--nika-surface);
  --color-fd-card-foreground: var(--nika-content);
  --color-fd-border: var(--nika-line);
  --color-fd-primary: var(--nika-primary);
  --color-fd-primary-foreground: var(--nika-primary-fg);
  --color-fd-secondary: var(--nika-surface-2);
  --color-fd-secondary-foreground: var(--nika-content);
  --color-fd-accent: var(--nika-muted);
  --color-fd-accent-foreground: var(--nika-content);
  --color-fd-ring: var(--nika-ring);
}

body {
  background: var(--nika-canvas);
  color: var(--nika-content);
  font-family: var(--nika-font-sans);
}
```

**Two details in that block are load-bearing, and both fail silently if you get them wrong.**

*The `@source` path is four levels up, not three.* It is resolved relative to the file it sits in, `apps/docs/src/app/globals.css`. Three levels from `apps/docs/src/app/` is `apps/`, so `../../../packages/registry/src` points at `apps/packages/registry/src`, which does not exist. Tailwind does not error on a missing `@source`; it just scans nothing, the component previews render unstyled, and the build stays green.

*The variables are `--color-fd-*`, not `--fd-*`.* Fumadocs 16 registers its Tailwind colour tokens under the `--color-fd-*` namespace (see `fumadocs-ui/css/lib/default-colors.css`); utilities like `bg-fd-primary` and Fumadocs' own component CSS read that name. The bare `--fd-*` properties are reserved for layout dimensions such as `--fd-sidebar-width` and `--fd-header-height`, and Fumadocs 16 has zero consumers of a bare `--fd-background`. Assigning the bare name compiles, passes every check in this task, and themes nothing — every Fumadocs colour utility keeps rendering with Fumadocs' own default palette.

If Fumadocs' preset requires the values in a specific colour format rather than raw OKLCH, the build or the rendered page will show it. Report what you find rather than guessing at a conversion.

- [ ] **Step 2: Make the registry's CSS importable**

`@nikaui/registry` must expose the stylesheet. Add an `exports` entry to `packages/registry/package.json`:

```json
  "exports": {
    "./styles/tokens.css": "./src/styles/tokens.css"
  },
```

If the package already has an `exports` map, add the key to it rather than replacing it.

- [ ] **Step 3: Load the documentation site's own fonts**

In `apps/docs/src/app/layout.tsx`, add:

```tsx
import { JetBrains_Mono, Manrope } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--docs-font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--docs-font-mono",
  display: "swap",
});
```

Apply both variables to the `<html>` className, and override the Nika defaults for the documentation site only, in `globals.css`:

```css
/* The documentation site's own typography. Nika itself ships system
   stacks — forcing a font download on every consumer is inappropriate. */
:root {
  --nika-font-sans: var(--docs-font-sans), ui-sans-serif, system-ui, sans-serif;
  --nika-font-mono: var(--docs-font-mono), ui-monospace, monospace;
}
```

- [ ] **Step 4: Set the default theme to dark**

The token layer puts light in `:root` per the Global Constraints, but the design presents dark-first. In `layout.tsx`, find the Fumadocs `RootProvider` and set its theme defaults:

```tsx
<RootProvider theme={{ defaultTheme: "dark" }}>
```

If `RootProvider` already receives a `theme` prop, merge the key rather than replacing the object.

- [ ] **Step 5: Verify no old token definitions survive in the docs app**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && grep -nE "^\s*--(background|foreground|card|popover|primary|secondary|muted|accent|destructive|border|input|ring):" apps/docs/src/app/globals.css || echo "PASS: docs app defines no unprefixed tokens"
```

Expected: the PASS line.

- [ ] **Step 6: Build and inspect the rendered site**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/docs build
```

Expected: build succeeds. Then run `pnpm --filter @nikaui/docs dev`, open the site, and confirm: text is legible in both themes, the accent colour appears on links and primary buttons, and toggling the theme switches the whole page rather than part of it. Report what you observe.

- [ ] **Step 7: Verify the gate**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build && pnpm --filter @nikaui/registry test
```

- [ ] **Step 8: Commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git add -A && git commit -m "feat: documentation site renders on the shipped token layer

The docs app defined its own shadcn-style HSL set and mapped it
separately. It now imports the registry's tokens and assigns Fumadocs'
--color-fd-* variables from --nika-*, one way only, so the chrome inherits
the accent while the library stays independent of Fumadocs.

Manrope and JetBrains Mono are loaded here via next/font and override the
Nika defaults for this site only. The library itself ships system stacks."
```

---

### Task 11: End-to-end verification outside the monorepo

The spec's §6 bar. Steps 1 and 2 are the ones that have never passed in this project's history, and local monorepo resolution must be disabled or they will pass falsely.

**Files:** none in this repository — the work happens in a scratch project.

**Interfaces:**
- Consumes: everything from Tasks 1–10
- Produces: evidence that B is complete

- [ ] **Step 1: Create a clean scratch project with Tailwind v4**

**Every path in this task is Windows-absolute, never `/tmp` and never MSYS-style `/f/…`.** This machine is `win32`: Git Bash resolves `/tmp` to `C:\Users\<you>\AppData\Local\Temp`, while Node's `path.resolve("/tmp/x")` — which `init.ts` and `add.ts` both call on `--cwd` — gives `C:\tmp\x`. The CLI would write to one directory while the shell inspected another. `C:/Users/rowee/AppData/Local/Temp/nika-scratch/` and `F:/dev/…` are read identically by both.

```bash
rm -rf "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-e2e" && mkdir -p "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-e2e" && cd "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-e2e" && pnpm init && pnpm add react@^19 react-dom@^19 && pnpm add -D tailwindcss@^4 @tailwindcss/cli@^4 typescript && mkdir -p src/app && printf '@import "tailwindcss";\n' > src/app/globals.css && ls -R src
```

Expected: `src/app/globals.css` exists containing only the Tailwind import.

- [ ] **Step 2: Run `init` with local resolution disabled**

The CLI prefers a local monorepo checkout over the network. Prove the network path works by running from a directory where no such checkout is reachable:

```bash
cd "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-e2e" && npx --yes --package=file:F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui/packages/cli nikaui init
```

If the local-path fallback still resolves (because npx links the workspace), instead pack and install the tarball, which severs the monorepo relationship:

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui/packages/cli" && pnpm pack --pack-destination "C:/Users/rowee/AppData/Local/Temp/nika-scratch" && cd "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-e2e" && pnpm add -D "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nikaui-0.1.0.tgz" && ./node_modules/.bin/nikaui init
```

Expected: `nika.config.ts`, `src/app/nika-tokens.css`, an `@import` at the top of `src/app/globals.css`, `src/lib/utils.ts`, `src/lib/motion.ts`.

**Record which invocation you used.** If the first one silently read from the monorepo, the network path is still unproven and the second is required.

- [ ] **Step 3: Confirm the token file came over the network, not from disk**

```bash
cd "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-e2e" && grep -c "nika-primary" src/app/nika-tokens.css && grep -c "data-accent" src/app/nika-tokens.css && head -1 src/app/globals.css
```

Expected: a non-zero token count, 5 or more `data-accent` matches, and the first line of `globals.css` is the `@import`.

- [ ] **Step 4: Add components over the network**

```bash
cd "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-e2e" && ./node_modules/.bin/nikaui add button card dialog alert progress && find src -type f | sort
```

Expected: five component files under `src/components/ui/`, plus `src/lib/utils.ts` and `src/lib/motion.ts`. Nothing flattened into the wrong directory.

- [ ] **Step 5: Compile the CSS and confirm the utilities actually resolve**

This is the check that would have caught the original defect, and it has to assert that **utilities were generated**, not that variables passed through. `globals.css` pulls in `nika-tokens.css`, whose `:root` rules are plain CSS that Tailwind copies to the output verbatim — so `--nika-canvas` appears in `out.css` whether or not a single utility class resolved. Grepping for the variable can never fail. Grep for the generated rule selector instead.

Two other things the naive form gets wrong: Tailwind v4 has no `--content` flag (v4 replaced the `content` concept with automatic detection plus `@source`, and the CLI rejects unknown options), and piping the build through `tail` hands the chain `tail`'s exit status, so a failed build still advances to the assertion and greps a stale file. Build through a small probe stylesheet with an explicit `@source`, chained with plain `&&`, leaving the project's own `globals.css` exactly as `init` wrote it:

```bash
cd "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-e2e" && printf '<div class="bg-canvas text-content border-line bg-primary text-primary-fg rounded-md"></div>\n' > src/probe.html && printf '@import "./src/app/globals.css";\n@source "./src";\n' > tw-probe.css && ./node_modules/.bin/tailwindcss -i tw-probe.css -o out.css && canvas=$(grep -cE '\.bg-canvas[[:space:]]*\{' out.css || true) && primary=$(grep -cE '\.bg-primary[[:space:]]*\{' out.css || true) && vars=$(grep -cE -- '--nika-(canvas|primary):' out.css || true) && echo "generated .bg-canvas rules: $canvas / .bg-primary rules: $primary / secondary signal, --nika-* declarations: $vars" && { [ "$canvas" -ge 1 ] && [ "$primary" -ge 1 ] && echo "PASS: token-derived utilities emitted real CSS" || echo "FAIL: a token utility compiled to nothing"; }
```

Expected: the `PASS` line, with both rule counts at 1 or more. Tailwind v4 emits `  .bg-canvas {` — selector, space, brace — so those greps match the generated rule and not the declaration; `--nika-*` is reported only as a secondary signal and proves nothing on its own.

A `FAIL` alongside a non-zero `--nika-*` count is precisely the failure this sub-project exists to fix: the token file arrived, and nothing consumed it. If the build itself errors, the `&&` chain stops there rather than asserting against a stale `out.css`.

The explicit `@source "./src"` is not optional. Building `src/app/globals.css` directly leaves the detection root at `src/app/`, `src/probe.html` falls outside it, and no utility is generated — a false FAIL that looks exactly like a real one.

- [ ] **Step 6: Verify theme and accent switching**

```bash
cd "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-e2e" && node -e "
const css = require('fs').readFileSync('src/app/nika-tokens.css','utf8');
console.log('.dark block present:', /\.dark\s*{/.test(css));
console.log('accent blocks:', (css.match(/\[data-accent=/g)||[]).length);
console.log('theme inline present:', css.includes('@theme inline'));
console.log('code token dark in light theme:', /--nika-code:\s*oklch\(0\.2/.test(css));
"
```

Expected: `.dark` present, 5 accent blocks (4 named plus `sun` sharing the `:root` selector — count 4 or 5 depending on how you read the grouped selector; either is correct as long as all five names appear), `@theme inline` present, and the code token dark.

- [ ] **Step 7: Verify the motion resolution order in the copied source**

```bash
cd "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-e2e" && grep -n "useMotionPreset\|NikaMotionConfig\|useReducedMotion" src/lib/motion.ts | head && grep -n "motion?" src/components/ui/button.tsx
```

Expected: the copied `motion.ts` contains all three symbols, and the copied `button.tsx` declares the `motion?: MotionPreset` prop. The consumer got the real resolver, not a stub.

- [ ] **Step 8: Record the results**

Write down, for each of the spec's five verification criteria, whether it passed and what you observed. Criteria 3, 4 and 5 involve rendered output — if you cannot render in this environment, say so explicitly and describe exactly what a human should check, rather than claiming a pass.

- [ ] **Step 9: Clean up**

```bash
rm -rf "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-e2e" "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nika-init-check" "C:/Users/rowee/AppData/Local/Temp/nika-scratch/nikaui-0.1.0.tgz" && echo "scratch projects removed"
```

- [ ] **Step 10: Final gate and commit any fixes**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build && pnpm --filter @nikaui/registry test && git status --short
```

Expected: all pass, working tree clean. If the end-to-end run exposed a defect, fix it, re-run this step, and commit with a message naming what the scratch project revealed.

---

## Completion criteria

Sub-project B is done when every one of these holds:

```bash
# 1. The token layer exists and is namespaced
grep -c "^\s*--nika-" packages/registry/src/styles/tokens.css

# 2. No component references the old vocabulary
#    ring-offset is in the prefix list on purpose: ring-offset-background is a
#    token utility, and (bg|text|border|ring)- does not match it.
grep -rnE '\b(bg-background|text-foreground|bg-card|text-card-foreground|bg-popover|text-popover-foreground|bg-primary/90|text-primary-foreground|bg-secondary|text-secondary-foreground|text-muted-foreground|bg-accent|text-accent-foreground|bg-destructive|text-destructive-foreground|border-destructive|border-input|bg-input|bg-border|ring-offset-background)\b' packages/registry/src/ui/

# 3. The animated boolean is gone
grep -rn "animated" packages/registry/src/

# 4. 27 components, registered and on disk
node -e "const r=require('./packages/cli/src/registry.json');console.log(Object.keys(r.components).length)"

# 5. tailwind-config is gone
ls packages/

# 6. The motion resolver is tested
pnpm --filter @nikaui/registry test

# 7. The gate is green
pnpm lint && pnpm check-types && pnpm build
```

Expected: a non-zero token count; **no output** from checks 2 and 3; `27`; a `packages/` listing without `tailwind-config`; all tests passing; the gate green.

And the bar that actually matters, from spec §6 — in a scratch project outside this monorepo, with local resolution disabled: `init` writes the tokens and the import, `add` fetches over the network, and a compiled stylesheet contains real values for `bg-canvas` and `bg-primary`. **Those two have never passed in this project's history.** Task 11 is where they either do or do not.
