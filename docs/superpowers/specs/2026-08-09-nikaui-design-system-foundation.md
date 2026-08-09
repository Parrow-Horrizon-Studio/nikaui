# Nika UI — Design-System Foundation

**Date:** 2026-08-09
**Status:** Approved
**Scope:** Sub-project B. Defines the token layer, motion preset API, token delivery, package layout, and first-ship component scope.
**Parent:** [`docs/MASTER-PLAN.md`](../../MASTER-PLAN.md) — the single reference for Nika UI. This spec is the deep-dive behind decisions B1–B7 in its ledger.

---

## 1. Context

Everything visual in Nika UI sits on this layer. The landing page (C), documentation (D), and every block and template (F) consume it, so it must be settled before any of them begin.

Three token systems currently coexist in `apps/docs/src/app/globals.css`: Fumadocs' `--fd-*` set imported from its preset, a shadcn-style HSL set defined in `@layer base`, and the `@theme inline` mapping between the latter and Tailwind utilities. The current landing page uses `--fd-*`; the 22 components use the shadcn-style set. The design prototype uses a third vocabulary entirely — OKLCH, with `data-theme` and `data-accent` attributes.

B replaces all of this with one owned token layer.

**B is not a refactor — it is finishing work that was never wired up.** See §3.

---

## 2. Decisions

### B1 — Token vocabulary and model

Nika defines its own token vocabulary. It does not adopt another library's names.

**Rationale.** Two reasons, one technical and one strategic. Technically, Nika ships by copy-paste into projects that may already have another library installed; if both define `--primary` and `--background` in `:root` they collide, last stylesheet wins, and one library silently renders wrong colours. Namespacing makes Nika drop-in safe. Strategically, every serious component library defines its own token vocabulary — adopting another's makes Nika read as a derivative rather than a peer.

**Model: scales, not pairs.** The shadcn convention pairs every surface with a foreground (`--card` / `--card-foreground`). In the current `globals.css` those pairs are already redundant — `--foreground`, `--card-foreground`, and `--popover-foreground` hold identical values in both themes. Three names, one value, synchronised by hand.

Nika uses one surface scale, one content scale, one line scale, and pairs only where a filled colour genuinely needs its own text colour.

```
/* Surfaces */
--nika-canvas          page background
--nika-canvas-2        inset surfaces — inputs, tab strips
--nika-surface         raised — cards
--nika-surface-2       raised, second level — secondary buttons, active tab
--nika-overlay         floating — menus, popovers, toasts
--nika-muted           subtle fill — hover states, tracks, badge backgrounds
--nika-code            code block background (dark in BOTH themes, deliberately)

/* Content */
--nika-content         primary text
--nika-content-muted   secondary text
--nika-content-subtle  tertiary text, placeholders

/* Lines */
--nika-line            default border
--nika-line-strong     emphasis — inputs, outline buttons, hover

/* Accent */
--nika-primary
--nika-primary-hover
--nika-primary-press
--nika-primary-fg
--nika-accent          gradient partner to primary (the gold in sun marks, progress bars, avatars)
--nika-ring            focus ring

/* Semantic */
--nika-success
--nika-warning
--nika-danger
--nika-danger-fg
--nika-info

/* Elevation */
--nika-shadow-sm  --nika-shadow  --nika-shadow-lg  --nika-glow

/* Radius */
--nika-radius (base)  --nika-radius-sm/md/lg/xl/2xl/full

/* Type */
--nika-font-sans  --nika-font-mono

/* Motion */
--nika-ease-spring  --nika-ease-out  --nika-ease-snap  --nika-ease-inout
--nika-duration-fast  --nika-duration  --nika-duration-slow  --nika-duration-spring
```

Values are the prototype's OKLCH set, ported directly.

**Tokens deliberately dropped**, each with its replacement verified against the prototype's own component stylesheet:

| Dropped | Replaced by | Evidence |
|---|---|---|
| `--secondary` | `surface-2` + `line-strong` | the prototype's secondary button derives it |
| `--accent` / `--accent-foreground` (as hover surface) | `muted` | every hover state in the prototype uses `--muted`. The name `accent` is reused for the gradient partner |
| `--input` | `canvas-2` + `line-strong` | the prototype's input uses those |
| `--destructive` | `danger` | already the case in the prototype |
| `--muted-fg` | — | declared in the prototype's token file and **never consumed**. Dead; not ported |

**Two additions.** `--nika-primary-hover` and `--nika-primary-press` exist as real tokens rather than `bg-primary/90`, because opacity-mixing OKLCH over varied backgrounds shifts perceived lightness. And `--nika-danger-fg` exists because danger is the one semantic colour used as a filled surface — the prototype hardcodes `oklch(0.99 0 0)` there. Success, warning, and info are only ever tint-plus-text and gain `-fg` partners only if a filled variant appears.

**`--nika-code` stays dark in light mode.** Deliberate in the prototype, preserved here.

### B2 — Namespacing and Tailwind integration

**CSS variables are namespaced; utilities are not.**

```css
:root { --nika-primary: oklch(0.705 0.188 47); }

@theme inline {
  --color-primary: var(--nika-primary);
  --color-canvas:  var(--nika-canvas);
  --color-content: var(--nika-content);
  --radius-md:     var(--nika-radius-md);
  --ease-spring:   var(--nika-ease-spring);
}
```

Producing `bg-primary`, `bg-canvas`, `text-content-muted`, `border-line`, `rounded-md`.

**Rationale.** The collision that silently corrupts colours is the CSS-variable one, and namespacing fixes it completely. Utility-name overlap with another library remains possible, but a project has exactly one Tailwind config, so that surfaces as a visible build-time conflict rather than wrong colours at runtime. Meanwhile "you own the code" is the product's core promise, and code people own should be pleasant to read — `bg-nika-primary text-nika-primary-fg` on every element becomes heavy fast.

`@theme inline` (not plain `@theme`) is required: it makes utilities *reference* the variable rather than copy its value, which is what allows runtime accent switching to work.

### B3 — Theme and accent switching

- **Light/dark switches on the `.dark` class.**
- **Accent switches on `[data-accent]`** — `sun` (default), `violet`, `emerald`, `azure`, `rose`.

The prototype uses `data-theme` for both. `.dark` is chosen instead because it is next-themes' default — which Fumadocs already wires — and Tailwind's `dark:` variant convention, so consumers with working dark mode reconfigure nothing. This costs nothing, because theming happens at the token layer rather than in component classNames.

Accent remains an attribute: it is not a Tailwind variant concern, and an attribute composes cleanly with the class-based theme.

**Fumadocs integration is one-way.** `--fd-*` variables are assigned from `--nika-*` in the docs application only — never the reverse, and never in the registry. Fumadocs chrome inherits the accent for free; the library stays independent of it.

### B4 — Motion preset API

**A preset is a *feel*, not an animation.** Each component decides *what* it animates; the preset decides *how it feels* — a spring configuration plus a travel-intensity multiplier.

This is what makes one preset name mean something coherent across components that animate entirely different properties. `spring` is a springy hover on a Button, a springy enter on a Dialog, and a springy height on an Accordion. The alternative — presets as specific named animations — does not generalise: every new component would require inventing what each preset means for it, and they would drift.

```ts
export const motionPresets = {
  none:   { transition: { duration: 0 },                                 scale: { hover: 1,    tap: 1    } },
  snap:   { transition: { type: "spring", stiffness: 700, damping: 40 }, scale: { hover: 1.01, tap: 0.99 } },
  glide:  { transition: { type: "spring", stiffness: 220, damping: 32 }, scale: { hover: 1.02, tap: 0.98 } },
  spring: { transition: { type: "spring", stiffness: 420, damping: 22 }, scale: { hover: 1.03, tap: 0.97 } },
  bounce: { transition: { type: "spring", stiffness: 520, damping: 13 }, scale: { hover: 1.05, tap: 0.94 } },
} as const;

export type MotionPreset = keyof typeof motionPresets;
```

Descending damping is the axis: `snap` and `glide` do not overshoot, `spring` overshoots slightly, `bounce` pronouncedly.

**Naming.** Presets are named in standard animation vocabulary, not brand vocabulary. Brand-flavoured names (`gear2`, `gear5`) were considered and rejected: someone unfamiliar with the reference cannot guess the ordering, and the ordering is the entire value of a preset scale. Brand flavour belongs in documentation copy and marketing, where it delights people who recognise it and costs nothing to people who do not.

**Resolution order**, most specific wins:

1. `prefers-reduced-motion: reduce` → forced `none`
2. Instance prop — `<Button motion="bounce">`
3. Provider per-component override — `components.dialog`
4. Provider global default — `preset`
5. Built-in default — `spring`

```tsx
<NikaMotionConfig
  preset="spring"
  components={{ dialog: "none", accordion: "glide" }}
>
```

**The provider is optional.** Components land in repositories where nobody wrapped the application; without a provider they fall through to step 5 and animate normally. `nika init` offers to write it in. This is a hard requirement of copy-paste distribution, not a convenience.

**Reduced motion sits above an explicit prop.** A library selling itself on animation is the one that has to get this right. Implemented with Motion's `useReducedMotion()`.

**Consequences.** `animated?: boolean` on Button disappears — `animated={false}` becomes `motion="none"`. Pre-1.0 with copy-paste distribution means no deprecation path to maintain. The existing `motionPresets` in `lib/motion.ts` is rewritten; its current entries (`fadeIn`, `slideUp`, `tap`, `hover`) are *animations* rather than feels, and nothing consumes them today. `nika.config.ts` gains `motion: MotionPreset` in place of `motion: boolean`, feeding step 4.

### B5 — Token delivery

`nika init` writes **`nika-tokens.css`** into the consumer's project and adds a single `@import` to their global stylesheet.

**Rationale.** Writing tokens directly into `globals.css` — the approach the current code comments promise — interleaves Nika's tokens with the consumer's own CSS, so shipping a token update later means diffing against hand-edited CSS. Shipping tokens as an npm package would make updates trivial but introduces a runtime dependency, contradicting the ownership promise the entire product rests on.

An isolated file in the consumer's repository keeps ownership intact — they may edit or delete it freely — while giving `nika update` a file it can replace wholesale. Consumer overrides live naturally in `globals.css` *after* the import, where nothing will clobber them. The five accent presets ship inside `nika-tokens.css`; a consumer defining a sixth writes it in `globals.css` without touching the file Nika maintains.

**Fonts are not shipped.** `--nika-font-sans` defaults to a system stack and `--nika-font-mono` to a monospace stack. Manrope and JetBrains Mono are the *documentation site's* identity, loaded there via `next/font`. Forcing a font download on every consumer is inappropriate, and most projects have their own brand typography.

### B6 — Package layout

`packages/tailwind-config` is removed. It currently exports a TypeScript object (`nikaTheme`) that nothing imports, and its stated purpose — injecting tokens into the consumer's CSS — is served better by an authored CSS file.

The token source moves into `packages/registry/src/styles/tokens.css`, alongside `lib/` and `ui/`, making the registry the single source for everything the CLI copies.

### B7 — Component scope

**Ship 27**: the 22 existing components plus **alert, textarea, radio-group, slider, progress** — all five already designed in the prototype's stylesheet and all simple, requiring no new Headless UI integration.

The full 69-component target catalogue lives in [`MASTER-PLAN.md`](../../MASTER-PLAN.md) §5, waved.

**Rationale.** Components are the free tier; blocks are what people pay for. Spending months on components 28 through 69 delays the entire revenue path while guessing which of them matter. Launching at 27 starts the waitlist, and waitlist signups are precisely the people who can say whether they need a data-table or a date-picker next. It also resolves an honesty problem: "40+ components" was placeholder copy, and "27" is true.

---

## 3. Defects fixed in B

**The CLI has never worked outside this monorepo.** Two independent defects, either of which alone breaks a real consumer:

| Location | Defect |
|---|---|
| `packages/cli/src/commands/init.ts` | Never imports `nikaTheme` and never touches the consumer's `globals.css`, despite `tailwind-config/src/theme.ts:1` documenting that it does. A consumer runs `init`, then `add button`, and every `bg-primary` in that Button resolves to nothing. |
| `packages/cli/src/commands/add.ts:23` | `REGISTRY_BASE_URL` points at `raw.githubusercontent.com/nicaui/nikaui/…`. `nicaui` is a transposition; the account does not exist, so every remote fetch returns 404. Masked because `getFileContent` tries local monorepo paths first — it works for the author and fails for everyone else. |
| `packages/cli/src/commands/add.ts:72, :174` | Both call `path.basename(file.target)`, discarding directory structure; `targetDir` is only ever `uiDir` or `libDir`. Every file lands flat in `components/ui/`. Blocks and templates are impossible until this honours full relative targets. |

The first two are why B is completion work rather than refactoring. The third is carried from spec A §3 and is a prerequisite for sub-project F.

---

## 4. Implementation surface

1. **`packages/registry/src/styles/tokens.css`** — new. The authored token layer: `:root`, `.dark`, five `[data-accent]` blocks, and the `@theme inline` mapping.
2. **`packages/registry/src/lib/motion.ts`** — rewritten to the five presets, plus `NikaMotionConfig`, a `useMotionPreset(component, prop)` resolver honouring the five-step order, and `useReducedMotion()` integration.
3. **All 27 components** — className strings migrated to the new vocabulary; `motion` prop adopted in place of `animated`.
4. **Five new components** — alert, textarea, radio-group, slider, progress.
5. **`packages/cli`** — `init` writes `nika-tokens.css` and the `@import`; `REGISTRY_BASE_URL` corrected; path flattening removed; `nika.config.ts` gains `aliases.blocks` and `motion: MotionPreset`.
6. **Registry schema** — `access: "free" | "pro"`, `type: "ui" | "lib" | "block" | "template"`, alias-relative targets (`@ui/`, `@blocks/`, `@lib/`, `@page`). Carried from spec A §3.
7. **`packages/tailwind-config`** — deleted.
8. **`apps/docs/src/app/globals.css`** — imports the registry token layer; assigns `--fd-*` from `--nika-*`; loads Manrope and JetBrains Mono via `next/font`.

---

## 5. Out of scope

- **Documentation restructure and component previews** — sub-project D.
- **Landing page** — sub-project C.
- **Components 28–69** — catalogued in the master plan, built after launch against waitlist feedback.
- **Blocks and templates** — sub-project F.

---

## 6. Verification

B is complete when, in a **scratch project outside this monorepo**:

1. `npx nika init` produces `nika.config.ts`, `nika-tokens.css`, an `@import` in the global stylesheet, and `lib/utils.ts`.
2. `npx nika add button card dialog` fetches from the public registry over the network — with local monorepo resolution disabled — and writes files to their configured paths.
3. The rendered components are correctly themed, respond to `.dark`, and retune across all five `[data-accent]` values.
4. `<Button motion="bounce">` and `<Button motion="none">` visibly differ; `NikaMotionConfig` overrides both a global default and a single component type.
5. With `prefers-reduced-motion: reduce` set at OS level, no component animates — including one with an explicit `motion="bounce"`.

Steps 1 and 2 are the ones that have never passed. They are the bar for B.
