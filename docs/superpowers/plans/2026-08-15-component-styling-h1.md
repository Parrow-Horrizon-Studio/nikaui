# H1 — Component Defects and Default Styling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close ten carried-forward defects and land the approved default styling for all 27 registry components, leaving every component visually final.

**Architecture:** Five new tokens are added to `packages/registry/src/styles/tokens.css` and asserted by the existing `tokens.test.ts`, which already parses the stylesheet. Components then consume them. Slider is rebuilt off native `input[type=range]` onto a wrapper with hand-written keyboard and ARIA behaviour — the only structural rewrite in this plan; everything else is class strings and Motion choreography on existing structure.

**Tech Stack:** React 19, Tailwind CSS v4, Motion, Headless UI, `cva`, Vitest + Testing Library, Turborepo + pnpm 9, Node 22.

**Spec:** [`docs/superpowers/specs/2026-08-15-nikaui-component-styling.md`](../specs/2026-08-15-nikaui-component-styling.md)

## Global Constraints

- **No hard-coded colours anywhere.** Every colour comes from the token layer. This is in the repo's PR checklist and H1 closes an existing violation — do not add another.
- **Tokens are `--nika-*` prefixed** in `tokens.css` and bridged through the `@theme inline` block at the bottom of that file. Adding a variable without bridging it makes it unusable from a utility class.
- **`@theme inline` is required, not optional** — `inline` makes each utility reference the variable rather than copy its value, which is what allows `.dark` and `[data-accent]` to retune already-rendered markup.
- **Tailwind v4 has no duration theme namespace.** Duration tokens are read directly as `var(--nika-duration-*)`, never as a mapped utility.
- **Every animated component must honour `prefers-reduced-motion`** through the existing `useMotionPreset` / `useConfiguredMotion` API in `packages/registry/src/lib/motion.ts`. Do not add new motion infrastructure.
- **Server-rendered from-states must not depend on a client-only preference.** See the comment block in `card.tsx` — `useConfiguredMotion` exists for exactly this.
- **No component may branch its markup on the style axis.** Style is CSS custom properties only. Component variants are props.
- **Naming:** no file, class, prop, comment or doc may describe anything as HeroUI- or shadcn-derived. Task 15 makes this mechanical.
- **Do not touch `content/docs/**`.** All documentation work is H2. Changing a component's props without documenting them is expected here and is not a defect.
- **Run the focused test while iterating; run the full suite once before committing.**

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `packages/registry/src/styles/tokens.css` | All five new tokens + `@theme inline` bridges | 1 |
| `packages/registry/src/styles/tokens.test.ts` | Parses `tokens.css`, asserts contrast | 1, 13 |
| `packages/registry/src/ui/{button,label,badge}.tsx` | New defaults | 3 |
| `packages/registry/src/ui/{checkbox,switch}.tsx` | New defaults + choreography | 4 |
| `packages/registry/src/ui/{input,textarea}.tsx` | Focus ring, surface fix, `filled` variant | 2, 5 |
| `packages/registry/src/ui/{radio-group,card}.tsx` | Variants + motion | 6 |
| `packages/registry/src/ui/{alert,toast}.tsx` | Compositing fix | 7 |
| `packages/registry/src/ui/{dialog,alert-dialog}.tsx` | Scrim, surface, entrance | 8 |
| `packages/registry/src/ui/{popover,dropdown-menu,select,combobox}.tsx` | Overlay styling + focus ring + prop fix | 9 |
| `packages/registry/src/ui/tooltip.tsx` | Inversion + `surface` variant | 10 |
| `packages/registry/src/ui/accordion.tsx` | Underline removal + `card` variant | 11 |
| `packages/registry/src/ui/{skeleton,spinner,progress,avatar}.tsx` | Shimmer, ring, indeterminate, fallback | 12 |
| `packages/registry/src/ui/slider.tsx` | Full rebuild | 14 |
| `scripts/check-copy.mjs` | `heroui` added to the gate | 15 |
| `docs/MASTER-PLAN.md` | Roadmap + resolved entries | 16 |

---

## Task 1: Token layer — five new tokens, asserted

**Files:**
- Modify: `packages/registry/src/styles/tokens.css`
- Test: `packages/registry/src/styles/tokens.test.ts`

**Interfaces:**
- Produces: `--nika-field`, `--nika-field-hover`, `--nika-field-press`, `--nika-inverse`, `--nika-inverse-content`, `--nika-scrim`, `--nika-indicator`, `--nika-shimmer`, bridged as `--color-field`, `--color-field-hover`, `--color-field-press`, `--color-inverse`, `--color-inverse-content`, `--color-scrim`, `--color-indicator`, `--color-shimmer`. Every later task consumes at least one.

- [ ] **Step 1: Read the existing test to learn its parser**

`tokens.test.ts` already reads `tokens.css` from disk, extracts `oklch(...)` values and asserts contrast ratios per accent × state. Reuse its helpers; do not write a second parser.

- [ ] **Step 2: Write the failing test**

Append to `packages/registry/src/styles/tokens.test.ts`:

```ts
describe("--nika-indicator", () => {
  // WCAG 2.1 SC 1.4.11: a control's state indicator needs >= 3:1 against
  // adjacent colour. The switch off-track is the tightest case — it sits on
  // the canvas and contains a surface-coloured thumb.
  it.each([
    ["light", ":root"],
    ["dark", ".dark"],
  ])("reaches 3:1 against canvas and surface in %s", (_theme, selector) => {
    const indicator = readToken(selector, "--nika-indicator");
    expect(contrast(indicator, readToken(selector, "--nika-canvas"))).toBeGreaterThanOrEqual(3);
    expect(contrast(indicator, readToken(selector, "--nika-surface"))).toBeGreaterThanOrEqual(3);
  });
});

describe("new tokens are bridged", () => {
  it.each([
    "field", "field-hover", "field-press",
    "inverse", "inverse-content", "scrim", "indicator", "shimmer",
  ])("maps --nika-%s into @theme inline", (name) => {
    expect(themeBlock()).toContain(`--color-${name}:`);
    expect(themeBlock()).toContain(`var(--nika-${name})`);
  });
});
```

If `readToken`, `contrast` or `themeBlock` do not exist under those names, use whatever the file already calls them — do not rename existing helpers.

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @nikaui/registry test tokens`
Expected: FAIL — `--nika-indicator` is not found in `tokens.css`.

This is the decisive RED. A test that only checked the `@theme` block would pass as soon as the bridge is added, without the value ever being tuned.

- [ ] **Step 4: Add the tokens**

In `tokens.css`, inside the existing `:root` light block:

```css
  /* Filled-control surface. Button secondary, the `filled` input variants,
     and the `card` radio and accordion variants all sit on this. */
  --nika-field:           oklch(0.955 0.006 80);
  --nika-field-hover:     oklch(0.932 0.007 80);
  --nika-field-press:     oklch(0.915 0.008 80);

  /* Inverted surface pair. Tooltip inverts against the page so it can never
     be mistaken for a popover. Also available for inverted buttons and code
     chrome. */
  --nika-inverse:         oklch(0.235 0.012 55);
  --nika-inverse-content: oklch(0.985 0.004 85);

  /* Modal backdrop. Replaces a hard-coded bg-black/50 that could not retune
     for dark, where 50% black over an already-dark canvas is far too heavy. */
  --nika-scrim:           color-mix(in oklch, oklch(0.235 0.012 55) 45%, transparent);

  /* State-indicator neutral. Every other neutral in the scale is deliberately
     subtle — `line` and `line-strong` are hairlines, `muted` is the hover
     surface — and none reaches the 3:1 WCAG 1.4.11 asks of a state indicator.
     The switch off-track measured 1.27:1 on `line` and 1.54:1 on
     `line-strong`. This token exists solely to close that, and tokens.test.ts
     asserts it. Also used by the unchecked checkbox border, the unchecked
     radio ring, and the slider and progress tracks. */
  --nika-indicator:       oklch(0.685 0.010 70);

  /* Skeleton sweep highlight. */
  --nika-shimmer:         color-mix(in oklch, var(--nika-content) 7%, transparent);
```

In the `.dark` block:

```css
  --nika-field:           oklch(0.255 0.009 60);
  --nika-field-hover:     oklch(0.295 0.010 60);
  --nika-field-press:     oklch(0.320 0.011 60);
  --nika-inverse:         oklch(0.965 0.005 85);
  --nika-inverse-content: oklch(0.165 0.006 60);
  --nika-scrim:           color-mix(in oklch, oklch(0.09 0.004 60) 62%, transparent);
  --nika-indicator:       oklch(0.545 0.012 62);
  --nika-shimmer:         color-mix(in oklch, var(--nika-content) 9%, transparent);
```

In the `@theme inline` block:

```css
  --color-field:            var(--nika-field);
  --color-field-hover:      var(--nika-field-hover);
  --color-field-press:      var(--nika-field-press);
  --color-inverse:          var(--nika-inverse);
  --color-inverse-content:  var(--nika-inverse-content);
  --color-scrim:            var(--nika-scrim);
  --color-indicator:        var(--nika-indicator);
  --color-shimmer:          var(--nika-shimmer);
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @nikaui/registry test tokens`
Expected: PASS. **If `--nika-indicator` misses 3:1, lower its lightness and re-run** — lightness is the lever that moves contrast; chroma barely does. Record the measured ratios in your report.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/src/styles/tokens.css packages/registry/src/styles/tokens.test.ts
git commit -m "feat(tokens): add field, inverse, scrim, indicator and shimmer tokens"
```

---

## Task 2: One focus ring across every control

**Files:**
- Modify: `packages/registry/src/ui/{input,textarea,checkbox,switch,select,combobox,radio-group}.tsx`
- Test: `packages/registry/src/ui/focus-ring.test.tsx` (create)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: the exact utility string every later task reuses for focusable controls.

**The string, used verbatim everywhere:**

```
focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring
```

Note what is **removed**: `ring-offset-2`, `ring-offset-canvas`, `ring-2`, and any `ring-offset-*`. Select and Combobox currently use `focus:` rather than `focus-visible:` — they move to `focus-visible:` too.

- [ ] **Step 1: Write the failing test**

Create `packages/registry/src/ui/focus-ring.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./input";
import { Textarea } from "./textarea";

describe("focus ring", () => {
  it.each([
    ["input", <Input key="i" aria-label="i" />],
    ["textarea", <Textarea key="t" aria-label="t" />],
  ])("%s hugs the control with no offset", (_name, el) => {
    render(el);
    const cls = screen.getByRole("textbox").className;
    expect(cls).toContain("focus-visible:ring-[3px]");
    expect(cls).toContain("focus-visible:border-primary");
    expect(cls).not.toContain("ring-offset");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test focus-ring`
Expected: FAIL — `ring-offset-canvas` and `ring-offset-2` are present today.

- [ ] **Step 3: Apply the string to all seven components**

Replace every occurrence of the old ring utilities. In `input.tsx` the full className becomes:

```
flex h-10 w-full rounded-md border border-line-strong bg-canvas px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-content placeholder:text-content-muted transition-[border-color,box-shadow] duration-[var(--nika-duration)] ease-out focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50
```

`ring-offset-canvas` is dropped from every file it appears in, including where it is not paired with a visible ring.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @nikaui/registry test focus-ring`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/src/ui packages/registry/src/ui/focus-ring.test.tsx
git commit -m "fix(a11y): one focus ring across every control, no offset"
```

---

## Task 3: Button, Label and Badge take their new defaults

**Files:**
- Modify: `packages/registry/src/ui/{button,label,badge}.tsx`
- Test: `packages/registry/src/ui/button.test.tsx` (extend or create)

- [ ] **Step 1: Write the failing test**

```tsx
it("secondary sits on the field token, not surface-2", () => {
  render(<Button variant="secondary">go</Button>);
  expect(screen.getByRole("button").className).toContain("bg-field");
});

it("badge default is tinted, not a solid accent fill", () => {
  render(<Badge>new</Badge>);
  const cls = screen.getByText("new").className;
  expect(cls).toContain("bg-primary/15");
  expect(cls).not.toMatch(/bg-primary(?![/-])/);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test button badge`
Expected: FAIL — secondary is `bg-surface-2`, badge default is a solid `bg-primary`.

- [ ] **Step 3: Update Button**

Base: `rounded-md` → `rounded-lg`, `font-medium` → `font-semibold`, add `shadow-sm`.

```
inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold tracking-[-0.005em] shadow-sm transition-[background-color,transform,box-shadow] duration-[var(--nika-duration)] ease-out disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring
```

Variants: `secondary` → `bg-field text-content shadow-none hover:bg-field-hover hover:shadow-sm`. `outline` → `border-[1.5px] border-line-strong shadow-none hover:bg-field hover:border-content-subtle`.

Motion — replace the `scale` hover with a rise, keeping the tap scale:

```tsx
whileHover={feel.enabled ? { y: -1 } : undefined}
whileTap={feel.enabled ? { scale: feel.scale.tap } : undefined}
transition={feel.transition}
```

The hover must not scale. Scaling text blurs it mid-transition; that is why this changed.

- [ ] **Step 4: Update Label and Badge**

Label: `text-sm font-medium` → `text-[13px] font-semibold tracking-[-0.005em]`.

Badge base: `px-2.5 py-0.5 text-xs font-semibold` → `gap-1.5 px-2.5 py-[3px] text-xs font-medium`.
Badge variants:

```
default: "border-primary/25 bg-primary/15 text-primary"
solid:   "border-transparent bg-primary text-primary-fg font-semibold"
secondary: "border-transparent bg-field text-content-muted"
danger:  "border-danger/25 bg-danger/15 text-danger"
success: "border-success/30 bg-success/20 text-success"
outline: "border-line-strong text-content-muted"
```

`solid` is new and preserves the previous default's appearance.

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter @nikaui/registry test button badge label`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/src/ui
git commit -m "feat(ui): button, label and badge take their new defaults"
```

---

## Task 4: Checkbox and Switch — new sizes and choreography

**Files:**
- Modify: `packages/registry/src/ui/{checkbox,switch}.tsx`
- Test: `packages/registry/src/ui/{checkbox,switch}.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("checkbox is 20px with a neutral unchecked border", () => {
  render(<Checkbox aria-label="c" />);
  const cls = screen.getByRole("checkbox").className;
  expect(cls).toContain("size-5");
  expect(cls).toContain("border-indicator");
  expect(cls).not.toContain("border-primary");
});

it("switch off-track uses the indicator token", () => {
  render(<Switch aria-label="s" />);
  expect(screen.getByRole("switch").className).toContain("data-[unchecked]:bg-indicator");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test checkbox switch`
Expected: FAIL — checkbox is `h-4 w-4` with `border-primary`; switch off-track is `bg-line`.

- [ ] **Step 3: Update Checkbox**

`h-4 w-4` → `size-5`, `rounded-sm` → `rounded-[7px]`, `border-primary` → `border-2 border-indicator`, keep `data-[checked]:bg-primary data-[checked]:border-primary`.

Choreography — the box squashes and springs back while the tick draws on a delay:

```tsx
<m.span
  animate={checked ? { scale: [1, 0.86, 1] } : { scale: 1 }}
  transition={feel.enabled ? { duration: 0.52, ease: [0.34, 1.56, 0.64, 1] } : { duration: 0 }}
>
  <m.svg /* ... */>
    <m.path
      d="M20 6 9 17l-5-5"
      initial={false}
      animate={{ pathLength: checked ? 1 : 0 }}
      transition={
        feel.enabled
          ? { duration: 0.34, ease: [0.22, 1, 0.36, 1], delay: checked ? 0.06 : 0 }
          : { duration: 0 }
      }
    />
  </m.svg>
</m.span>
```

The tick no longer animates `opacity` — drawing and fading together in 200ms is what made it read as a fade.

- [ ] **Step 4: Update Switch**

`h-6 w-11` → `h-7 w-[50px]`, remove `border-2 border-transparent`, add `p-[3px]`. Thumb `h-5 w-5` → `size-[22px]`, `bg-canvas` → `bg-surface`, `shadow-lg` → `shadow-md`. Off-track `data-[unchecked]:bg-line` → `data-[unchecked]:bg-indicator`.

Thumb travel becomes 22px on the spring:

```tsx
animate={{ x: checked ? 22 : 0 }}
transition={feel.enabled ? { duration: 0.52, ease: [0.34, 1.56, 0.64, 1] } : { duration: 0 }}
```

**Update the long comment block above `Switch`.** It currently states the off-track measures 1.27:1 and that no token closes the gap. That is no longer true — rewrite it to reference `--nika-indicator` and the assertion in `tokens.test.ts`. Leaving a stale comment that contradicts the code is a defect in its own right.

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter @nikaui/registry test checkbox switch reduced-motion`
Expected: PASS, including the existing reduced-motion suite.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/src/ui
git commit -m "feat(ui): checkbox and switch sizes, indicator token and choreography"
```

---

## Task 5: Input and Textarea — surface fix and the `filled` variant

**Files:**
- Modify: `packages/registry/src/ui/{input,textarea}.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("textarea sits on the same surface as input", () => {
  render(<Textarea aria-label="t" />);
  const cls = screen.getByRole("textbox").className;
  expect(cls).toContain("bg-canvas");
  expect(cls).not.toContain("bg-canvas-2");
});

it("filled variant drops the border for the field surface", () => {
  render(<Input aria-label="i" variant="filled" />);
  const cls = screen.getByRole("textbox").className;
  expect(cls).toContain("bg-field");
  expect(cls).not.toContain("border-line-strong");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test input textarea`
Expected: FAIL — textarea is `bg-canvas-2`; `variant` is not a prop.

- [ ] **Step 3: Convert both to `cva` and add the variant**

Both components currently take a flat className. Introduce `cva` with `variant: { default, filled }`, matching the pattern in `button.tsx`.

```ts
const inputVariants = cva(
  "flex h-10 w-full px-3 py-2 text-sm placeholder:text-content-muted transition-[border-color,background-color,box-shadow] duration-[var(--nika-duration)] ease-out focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "rounded-md border border-line-strong bg-canvas focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring",
        filled:
          "rounded-lg border-0 bg-field hover:bg-field-hover focus-visible:bg-field-press focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
      },
    },
    defaultVariants: { variant: "default" },
  }
);
```

Textarea takes the same variants with `min-h-20 h-auto` and no fixed height.

**The floating label is NOT part of this task.** It requires a wrapper element, and wrapper composition belongs to H2 along with the `invalid` and `size` props. `filled` here delivers the surface treatment only. Say so in your report so the reviewer does not read it as missing.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @nikaui/registry test input textarea`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/src/ui
git commit -m "feat(ui): unify input surfaces and add the filled variant"
```

---

## Task 6: RadioGroup and Card — variants and motion

**Files:**
- Modify: `packages/registry/src/ui/{radio-group,card}.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("radio dot springs in", () => {
  render(<RadioGroup><RadioGroupItem value="a">A</RadioGroupItem></RadioGroup>);
  expect(screen.getByRole("radio").innerHTML).toContain("scale");
});

it("card lifts on hover by default", () => {
  render(<Card>x</Card>);
  expect(screen.getByText("x").className).toContain("hover:-translate-y-1");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test radio-group card`
Expected: FAIL on both.

- [ ] **Step 3: RadioGroup**

Default keeps `size-4` ring and `size-2` dot. Ring border `border-line-strong` → `border-indicator`. Dot gains a spring:

```tsx
<m.span
  className="size-2 rounded-full bg-primary"
  initial={false}
  animate={{ scale: checked ? 1 : 0 }}
  transition={feel.enabled ? { duration: 0.52, ease: [0.34, 1.56, 0.64, 1] } : { duration: 0 }}
/>
```

Add `variant="card"` on `RadioGroupItem`: `w-full rounded-lg border-2 border-transparent bg-field px-3.5 py-2.5 hover:bg-field-hover data-[checked]:border-primary data-[checked]:bg-primary/10`, with `size-5` ring and `size-2.5` dot.

- [ ] **Step 4: Card**

Default gains the lift; keep `border-line` and `shadow-sm`:

```
rounded-lg border border-line bg-surface text-content shadow-sm transition-[transform,box-shadow] duration-[var(--nika-duration-slow)] ease-out hover:-translate-y-1 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0
```

Add `variant="elevated"`: `rounded-xl border-transparent shadow-md hover:shadow-lg`.

**`CardTitle` stays `text-2xl`.** Explicitly decided. Do not change it.

**Preserve the `motion-reduce:opacity-100! motion-reduce:transform-none!` pin and its comment block verbatim** — it documents a known, deliberate cost.

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter @nikaui/registry test radio-group card hydration reduced-motion`
Expected: PASS. The hydration suite matters here — Card server-renders a from-state.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/src/ui
git commit -m "feat(ui): radio-group card variant, card lift and elevated variant"
```

---

## Task 7: The compositing defect — Alert and Toast

**Files:**
- Modify: `packages/registry/src/ui/{alert,toast}.tsx`

**This is a defect fix. A structural check cannot see it — today's class names look correct.**

- [ ] **Step 1: Write the failing test**

```tsx
describe("status surfaces are opaque", () => {
  it.each(["success", "warning", "danger", "info"] as const)(
    "%s alert has an opaque base",
    (variant) => {
      render(<Alert variant={variant}>msg</Alert>);
      const cls = screen.getByRole("alert").className;
      expect(cls).toContain("bg-surface");
      expect(cls).not.toMatch(/bg-(success|warning|danger|info)\/\d/);
    }
  );

  it("toast has warning and info variants", () => {
    expect(() => render(<Toast variant="warning" />)).not.toThrow();
    expect(() => render(<Toast variant="info" />)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test alert toast`
Expected: FAIL — every status variant is `bg-<status>/10`; `warning` and `info` are not in Toast's `cva`.

- [ ] **Step 3: Rework Alert**

Base gains an opaque surface and a rail:

```
relative w-full overflow-hidden rounded-lg border border-line bg-surface pl-4 pr-4 py-3 text-sm before:absolute before:inset-y-0 before:left-0 before:w-[3px]
```

Variants set only the rail and the icon chip:

```
default: "before:bg-content-subtle"
success: "before:bg-success [&>[data-chip]]:bg-success/20 [&>[data-chip]]:text-success"
warning: "before:bg-warning [&>[data-chip]]:bg-warning/25 [&>[data-chip]]:text-warning"
danger:  "before:bg-danger [&>[data-chip]]:bg-danger/20 [&>[data-chip]]:text-danger"
info:    "before:bg-info [&>[data-chip]]:bg-info/20 [&>[data-chip]]:text-info"
```

Add `variant="top-rail"` as a modifier that moves the rail to `before:inset-x-0 before:top-0 before:h-[3px] before:w-auto`.

**Replace the existing comment block** about status hues and contrast: it explains why the body text stays `text-content` on a tinted surface. The surface is no longer tinted, so rewrite it to describe the rail-and-chip treatment. Do not delete it — the reasoning about status hues not being body-text colours still holds and must survive.

- [ ] **Step 4: Rework Toast**

Same treatment with `bg-overlay`. Add `warning` and `info` to the `cva`, matching Alert's five.

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter @nikaui/registry test alert toast`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/src/ui
git commit -m "fix(ui): opaque bases for alert and toast status surfaces"
```

---

## Task 8: Scrim token, and dialog surfaces

**Files:**
- Modify: `packages/registry/src/ui/{dialog,alert-dialog}.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("no dialog hard-codes a colour", () => {
  const src = readFileSync("src/ui/alert-dialog.tsx", "utf8");
  expect(src).not.toContain("bg-black");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test dialog`
Expected: FAIL — `alert-dialog.tsx:34` is `bg-black/50`.

- [ ] **Step 3: Apply the fixes**

Backdrop in both files: `bg-black/50` → `bg-scrim backdrop-blur-[3px]`.
Panel in both files: `bg-canvas` → `bg-overlay`, `rounded-lg` → `rounded-xl`.

Entrance rises rather than scaling in place:

```tsx
initial={configured.enabled ? { opacity: 0, y: 10 * configured.travel, scale: 0.96 } : false}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={feel.transition}
```

Split the flat `p-6` into `DialogHeader` (`px-6 pt-6`), `DialogBody` (`px-6 py-4`) and `DialogFooter` (`px-6 pb-6 flex justify-end gap-2`). `DialogFooter` may already exist — check before creating.

`AlertDialog` destructive: add an `intent="danger"` prop rendering a `bg-danger/15 text-danger` icon chip and switching the confirm button to `variant="danger"`.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @nikaui/registry test dialog alert-dialog`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/src/ui
git commit -m "fix(ui): scrim token replaces hard-coded backdrop, unify dialog surfaces"
```

---

## Task 9: Overlay styling and the Combobox prop defect

**Files:**
- Modify: `packages/registry/src/ui/{popover,dropdown-menu,select,combobox}.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("ComboboxTrigger accepts native input attributes", () => {
  render(<Combobox><ComboboxTrigger placeholder="Search" id="q" name="q" /></Combobox>);
  expect(screen.getByPlaceholderText("Search")).toHaveAttribute("name", "q");
});
```

This must fail to **type-check**, not only at runtime. Run `pnpm check-types` as part of the RED step.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test combobox && pnpm check-types`
Expected: FAIL — props resolve against an uninstantiated generic (`combobox.tsx:17-19`).

- [ ] **Step 3: Fix the generic**

```ts
export interface ComboboxTriggerProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}
```

Instantiating the Headless UI generic is the alternative; either is acceptable, but the resulting type must accept every native input attribute.

- [ ] **Step 4: Apply overlay styling**

- Popover content: `rounded-md` → `rounded-lg`, `shadow-md` → `shadow-lg`, add `origin-top-left`, entrance `scale: 0.97`.
- Dropdown content: `rounded-md` → `rounded-lg`, `shadow-md` → `shadow-lg`, `p-1` → `p-1.5`. Items: `rounded-sm px-2 py-1.5` → `rounded-md px-2.5 py-[7px]`, hover `data-[focus]:bg-field-hover`.
- Select content: same as Dropdown. Trigger chevron gains `data-[open]:rotate-180 transition-transform duration-[var(--nika-duration)]`. Selected option gains `data-[selected]:bg-primary/12 data-[selected]:text-primary data-[selected]:font-semibold`.

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter @nikaui/registry test popover dropdown select combobox && pnpm check-types`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/src/ui
git commit -m "fix(ui): combobox trigger props; overlay elevation and radius"
```

---

## Task 10: Tooltip inverts

**Files:**
- Modify: `packages/registry/src/ui/tooltip.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("tooltip inverts against the page", async () => {
  render(<Tooltip content="hi"><button>t</button></Tooltip>);
  await userEvent.hover(screen.getByRole("button"));
  expect((await screen.findByRole("tooltip")).className).toContain("bg-inverse");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test tooltip`
Expected: FAIL — content is `bg-overlay border-line text-content`.

- [ ] **Step 3: Invert, and add the arrow**

```ts
const tooltipVariants = cva(
  "absolute z-50 overflow-visible rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-inverse text-inverse-content",
        surface: "bg-overlay border border-line text-content shadow-md",
      },
    },
    defaultVariants: { variant: "default" },
  }
);
```

The arrow is a bordered triangle whose colour must follow the surface — this is why `surface` is a variant rather than a documented `className` override. Render it as a child element with `border-t-inverse` / `border-t-overlay` selected by the same variant, not by a consumer class.

Note `overflow-hidden` becomes `overflow-visible`, or the arrow is clipped.

- [ ] **Step 4: Run the test**

Run: `pnpm --filter @nikaui/registry test tooltip`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/src/ui/tooltip.tsx
git commit -m "feat(ui): tooltip inverts against the page, with a surface variant"
```

---

## Task 11: Accordion

**Files:**
- Modify: `packages/registry/src/ui/accordion.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("trigger does not underline on hover", () => {
  render(<Accordion><AccordionItem><AccordionTrigger>q</AccordionTrigger></AccordionItem></Accordion>);
  expect(screen.getByRole("button").className).not.toContain("hover:underline");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test accordion`
Expected: FAIL — `accordion.tsx:34` has `hover:underline`.

- [ ] **Step 3: Replace the hover treatment**

`hover:underline` → `hover:bg-field-hover rounded-md px-2 -mx-2 transition-colors duration-[var(--nika-duration)]`.

Add `variant="card"` on `AccordionItem`: `border-b-0 mb-1.5 rounded-lg bg-field overflow-hidden hover:bg-field-hover` with the trigger padded `px-4`.

**Confirm before implementing:** the spec records the card variant as an assumption — the question was asked during batch-2 review and never answered. If unconfirmed at implementation time, report `NEEDS_CONTEXT` rather than guessing. Removing `hover:underline` is unaffected and proceeds either way.

- [ ] **Step 4: Run the test**

Run: `pnpm --filter @nikaui/registry test accordion`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/src/ui/accordion.tsx
git commit -m "fix(ui): accordion trigger tints on hover instead of underlining"
```

---

## Task 12: Skeleton, Spinner, Progress and Avatar

**Files:**
- Modify: `packages/registry/src/ui/{skeleton,spinner,progress,avatar}.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("avatar fallback is not on the hover surface", () => {
  render(<Avatar><AvatarFallback>RA</AvatarFallback></Avatar>);
  const cls = screen.getByText("RA").className;
  expect(cls).not.toContain("bg-muted");
  expect(cls).toContain("bg-primary/20");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test avatar`
Expected: FAIL — fallback is `bg-muted`, the hover surface every other component uses.

- [ ] **Step 3: Apply the four changes**

**Skeleton** — shimmer replaces pulse:

```tsx
className={cn(
  "relative overflow-hidden rounded-md bg-muted",
  configured.enabled &&
    "motion-safe:after:absolute motion-safe:after:inset-0 motion-safe:after:-translate-x-full motion-safe:after:animate-[shimmer_1.6s_ease-out_infinite] motion-safe:after:bg-gradient-to-r motion-safe:after:from-transparent motion-safe:after:via-shimmer motion-safe:after:to-transparent",
  className
)}
```

Define the `shimmer` keyframe in `tokens.css` beside the token. `motion-safe:` is required, not a `configured.enabled` check alone — see the comment in `spinner.tsx` explaining why a JS-gated `animate-spin` still spins for a reduced-motion visitor on first paint.

**Spinner** — the ring gains a visible track:

```
size-6 rounded-full border-[2.5px] border-primary/20 border-t-primary
```

Replaces the two-border `currentColor` arc.

**Progress** — track `bg-muted` → `bg-indicator/40`; add a real indeterminate treatment (a 40%-width fill translating across) rather than reusing the determinate branch.

**Avatar** — fallback `bg-muted text-sm font-medium` → `bg-primary/20 text-primary text-sm font-semibold`.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @nikaui/registry test skeleton spinner progress avatar reduced-motion`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/src/ui packages/registry/src/styles/tokens.css
git commit -m "feat(ui): skeleton shimmer, spinner track, progress indeterminate, avatar fallback"
```

---

## Task 13: Measure the contrast claims

**Files:**
- Modify: `packages/registry/src/styles/tokens.test.ts`

**This task produces numbers, not styling. `MASTER-PLAN.md` records these as "measure, do not assume."**

- [ ] **Step 1: Add assertions for the three unverified cases**

```ts
describe("state indicators after H1", () => {
  it.each([[":root"], [".dark"]])("switch off-track in %s", (sel) => {
    expect(contrast(readToken(sel, "--nika-indicator"), readToken(sel, "--nika-canvas")))
      .toBeGreaterThanOrEqual(3);
  });

  it.each([[":root"], [".dark"]])("unchecked checkbox border in %s", (sel) => {
    expect(contrast(readToken(sel, "--nika-indicator"), readToken(sel, "--nika-surface")))
      .toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run and record**

Run: `pnpm --filter @nikaui/registry test tokens`

**Record the actual ratios in your report**, not just pass/fail. The focus ring at 16px on `radio-group` must be measured in a browser after Task 2's change — an offset ring was part of why it was hard to see, so the earlier finding does not transfer. If it cannot be measured, report it open. Do not infer it from the checkbox result.

- [ ] **Step 3: Commit**

```bash
git add packages/registry/src/styles/tokens.test.ts
git commit -m "test(tokens): assert state-indicator contrast in both themes"
```

---

## Task 14: Rebuild Slider

**Files:**
- Rewrite: `packages/registry/src/ui/slider.tsx`
- Test: `packages/registry/src/ui/slider.test.tsx`

**The largest task here. Native `input[type=range]` cannot paint a filled track cross-browser, so keyboard and ARIA behaviour must be reimplemented rather than inherited.**

- [ ] **Step 1: Write the failing test — keyboard first**

```tsx
describe("slider keyboard", () => {
  it.each([
    ["{ArrowRight}", 51], ["{ArrowLeft}", 49],
    ["{Home}", 0], ["{End}", 100],
    ["{PageUp}", 60], ["{PageDown}", 40],
  ])("%s moves to %i", async (key, expected) => {
    const onChange = vi.fn();
    render(<Slider value={50} onValueChange={onChange} />);
    screen.getByRole("slider").focus();
    await userEvent.keyboard(key);
    expect(onChange).toHaveBeenCalledWith(expected);
  });

  it("exposes the full ARIA contract", () => {
    render(<Slider value={30} min={0} max={100} />);
    const s = screen.getByRole("slider");
    expect(s).toHaveAttribute("aria-valuenow", "30");
    expect(s).toHaveAttribute("aria-valuemin", "0");
    expect(s).toHaveAttribute("aria-valuemax", "100");
    expect(s).toHaveAttribute("aria-orientation", "horizontal");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test slider`
Expected: FAIL — the native input has no `onValueChange`, and `role="slider"` is implicit rather than an explicit contract this code owns.

- [ ] **Step 3: Build the wrapper**

Structure: a positioned rail (`bg-indicator/40`), an absolutely positioned fill (`bg-primary`) whose width is the percentage, and a thumb (`bg-surface border-2 border-primary shadow-sm`) at that percentage. The interactive element carries `role="slider"`, `tabIndex={0}` and the ARIA attributes, and handles `onKeyDown` for the six keys above plus pointer events for drag.

`PageUp` / `PageDown` move by `step * 10` by default.

Clamp to `[min, max]` and quantise to `step` in one place — not per handler.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @nikaui/registry test slider`
Expected: PASS, all six keys and the ARIA contract.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/src/ui/slider.tsx packages/registry/src/ui/slider.test.tsx
git commit -m "fix(ui): rebuild slider with a filled track and owned keyboard/ARIA"
```

---

## Task 15: Make the naming constraint mechanical

**Files:**
- Modify: `scripts/check-copy.mjs`

- [ ] **Step 1: Add `heroui` to the forbidden terms**

Alongside the existing `/shadcn/i` rule.

- [ ] **Step 2: Observe it failing before trusting it**

Add the string `heroui` to a scanned file temporarily:

```bash
echo "heroui" >> apps/web/content/docs/index.mdx
pnpm check-copy
```

Expected: FAIL, naming the file and line. **Then revert the edit** and re-run:

```bash
git checkout apps/web/content/docs/index.mdx
pnpm check-copy
```

Expected: PASS across all four roots.

A gate never observed failing is not known to work. D added a gate root and proved it the same way.

- [ ] **Step 3: Commit**

```bash
git add scripts/check-copy.mjs
git commit -m "chore(gate): fail the build on heroui references"
```

---

## Task 16: Roadmap, then whole-branch verification

**Files:**
- Modify: `docs/MASTER-PLAN.md`

- [ ] **Step 1: Update the roadmap**

In §4's table, add **H1** (depends on B, D) and **H2** (depends on H1), and add **H1** to **F**'s "Depends on" cell.

Move the ten defects closed here into the resolved list with the date `2026-08-15`, following the existing `~~strikethrough~~ — **closed by H1**` convention. The ten: Alert compositing, Toast compositing, Toast missing `warning`/`info`, `alert-dialog` hard-coded colour, Dialog surface inconsistency, Textarea surface inconsistency, Avatar fallback surface, Combobox trigger props, Accordion `hover:underline`, Switch off-track contrast.

**Do not mark the 16px focus-ring item resolved** unless Task 13 actually measured it. If it was not measured, it stays open with the measurement recorded as still owed.

- [ ] **Step 2: Run every gate**

```bash
pnpm lint && pnpm check-types && pnpm build && pnpm test && pnpm check-copy
```

Expected: all pass, `lint` with `--max-warnings 0`.

- [ ] **Step 3: Confirm no hard-coded colours remain**

```bash
grep -rniE "bg-(black|white)/|#[0-9a-f]{3,8}\b|rgba?\(" packages/registry/src --include=*.tsx
```

Expected: no matches.

- [ ] **Step 4: The visual pass**

Start the dev server via `preview_start`, then **create a fresh browser tab** — a carried-over tab stops compositing, which is the cause of this project's long history of screenshot failures.

Check every changed component in **both themes** and at **375px**. Specifically:

- Alert and Toast in all five statuses **over a gradient or image**. This is the only way to see the compositing fix; the class names looked correct before it too.
- The tooltip beside a popover, in both themes.
- The switch off-track, the unchecked checkbox and the unchecked radio.
- Slider drag and keyboard.

- [ ] **Step 5: Report motion honestly**

Every browser pane available forces `prefers-reduced-motion: reduce`. Confirm that nothing animates under reduced motion. **If normal-motion playback cannot be verified, report it open** — as C's §5.7 was. H1 adds substantially more motion than existed before, so do not infer it from the code.

- [ ] **Step 6: Commit**

```bash
git add docs/MASTER-PLAN.md
git commit -m "docs: record H1 in the roadmap and close ten carried-forward defects"
```
