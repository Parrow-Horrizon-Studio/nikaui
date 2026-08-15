# Sub-project H — decisions

**Status:** all three batches settled 2026-08-15. All 27 components decided.
Spec not yet written.

**H — Component polish, variants and examples.** Depends on B and D.
**F (Block and template lineup) now depends on H** — blocks are assembled from
these components, so polishing after F would mean reworking every block.

`docs/MASTER-PLAN.md:204-212` needs its roadmap table updated to add H and to
record F's new dependency. Not yet done.

## Batch 1 scope

The nine components that set the vocabulary: `button`, `input`, `textarea`,
`label`, `checkbox`, `radio-group`, `switch`, `card`, `badge`.

## Terminology (locked)

Two distinct axes, both previously called "variant":

- **Style** — `default` / `brutalism` / `glass`. The token-file-swap axis.
  OSS ships `default` only. Pro adds the rest.
- **Component variant** — a prop, e.g. `<Input variant="filled">`. Ships in
  OSS, inside the `default` style.

Everything below marked "variant" is the second kind.

## Decisions

### Take the new styling as the default (5)

| Component | Change |
|---|---|
| `button` | `rounded-md` → `rounded-lg`; weight 500 → 600; resting `shadow-sm` lifting to `shadow-md` on hover; hover is a 1px **rise**, not a scale (scaling blurs text mid-transition); press keeps scale-down at 60ms and fires a ripple from the click point; secondary moves from `bg-surface-2` to the new field token |
| `label` | 14px/500 → 13px/600, slight negative tracking; adds required marker; pairs with a description style |
| `checkbox` | 16 → 20px box (16px is under the 24px minimum touch target); `rounded-sm` → 7px; unchecked border `border-primary` → `border-line-strong` (an unchecked box in the accent colour reads as already-on); choreography = box squashes to 0.86 and springs back while the tick **draws** over 340ms on a 60ms delay, so fill lands first and tick follows |
| `switch` | 44×24 → 50×28, thumb 20 → 22px on `--nika-surface` with `shadow-md` (not `shadow-lg` — a 20px thumb carrying the library's largest shadow is over-elevated); thumb stretches to 28px while pressed. **Motion: option A — spring, 520ms on `--nika-ease-spring`, slight overshoot on arrival.** |
| `badge` | default variant flips from solid accent fill to **tinted** (accent 18% over surface, accent-tinted text, 26% border) — a badge is an annotation and a solid accent fill competes with the primary button; old solid retained as an explicit `solid` variant; weight 600 → 500; wider padding; optional status dot |

### Keep today's styling as default, add the new one as a named variant (4)

| Component | Variant | Notes |
|---|---|---|
| `input` | `variant="filled"` | Filled borderless surface, floating label inside, darkens on hover then focus |
| `textarea` | `variant="filled"` | Same construction as Input |
| `radio-group` | `variant="card"` | Each option a selectable card, 2px accent border + tinted surface when chosen, 20px ring / 10px dot. Default keeps 16px/8px |
| `card` | `variant="elevated"` | Transparent border, `shadow-md` resting, `rounded-xl`, 17px title |

**Applies to the defaults regardless of variant:**

- `card` — hover lift of 4px over 340ms lands on the **default** too, without
  the heavier resting shadow. Default `CardTitle` **stays 24px** (decided).
- `radio-group` — dot springs in on `--nika-ease-spring`; not tied to the card variant.
- `input` — focus ring changes to **border + 3px hugging ring, no offset**
  (approved). The old 2px offset ring floated away from the control.
- `textarea` — **bug fix**: sits on `bg-canvas-2` today while Input sits on
  `bg-canvas`. Two surfaces for one job. Moves to `bg-canvas` to match Input.

### New API surfaces implied (do not exist today)

- `Input` / `Textarea`: `invalid` (or `error`) prop — colours the border and
  wires `aria-invalid` + `aria-describedby` to the message element.
- `Input`: `size` prop — `sm` / `md` / `lg` at 34 / 40 / 46px.
- `Input`: **icons arrive as props** — `startContent` / `endContent`
  (decided; makes the padding shift automatic) rather than composed children.
- `Input` / `Textarea`: `variant`. `RadioGroup`: `variant`. `Card`: `variant`.

### Documented example sets (this is what turns stub pages into real ones)

**Input** — left icon, right icon, password with reveal toggle, number with
steppers, URL prefix, date, file, search with clear, invalid + message, valid,
helper text, disabled, read-only, three sizes, and a short controlled-form
section using plain React (no form library). Anything larger — multi-step,
schema validation, server actions — links out to blocks. Free-vs-paid split
for those blocks is **not** decided here.

**Card** — divider footer, product, profile, stat, cover-with-avatar, compact
horizontal row. All composable from Card, Separator, Avatar, Badge and Button;
**every one already exists in the registry**, so no new components are needed.
`Separator` is the divider — it already exists at
`packages/registry/src/ui/separator.tsx`.

## Accessibility items consolidated into H

These were carried forward from earlier sub-projects with nowhere to land.

1. **Switch off-track contrast.** WCAG 2.1 SC 1.4.11 requires ≥3:1 for a state
   indicator. Today's off track measures **1.27:1**; `bg-line-strong` only
   reaches 1.54:1. No neutral in the vocabulary is dark enough to hit 3:1 while
   still reading as "off, neutral, not the accent" — it is a **missing token**,
   not a wrong value.
   **Fix:** add one state-indicator neutral tuned to ≥3:1 against both
   `--nika-canvas` and `--nika-surface` in light and dark, then extend
   `packages/registry/src/styles/tokens.test.ts` (which already parses
   `tokens.css` and asserts every accent × state at 4.5:1) to assert it.
   Same failure class covers unchecked checkbox border, unchecked radio ring,
   slider track and progress track — one token fixes the family.
2. **Checkbox and radio-group focus ring at 16px** — same construction proven
   invisible at 20px. Recorded as "measure in both themes, do not assume."
   Batch 1 moves checkbox to 20px, which may close it; radio-group's default
   stays 16px, so it still needs measuring.
3. **`ComboboxTrigger` rejects `placeholder`, `id`, `name`** and every native
   input attribute — props resolve against an uninstantiated generic
   (`packages/registry/src/ui/combobox.tsx:17-19`). Fix: instantiate the
   generic or intersect with `React.InputHTMLAttributes<HTMLInputElement>`.

## A design constraint that resolved itself

v1 flagged `--nika-label-mode` as the first crack in "token file swap covers
everything" — a token that would have to change **markup**, not a CSS value,
which a token file cannot do. Because the floating label became a component
variant rather than the default, the problem dissolves: it is a prop, not a
token. The style axis stays purely CSS, which is what keeps brutalism and
glass viable later.

## Mockup tooling note

Inline `onclick` handlers do not run in the file-render sandbox, and
`file://` URLs render as static snapshots in the browser pane (no screenshot,
no JS). Mockups that need interaction must be driven by **CSS `:checked` on
real inputs**, with no `prefers-reduced-motion` rule (the pane forces
`reduce`, which silently kills every transition). Batches 2 and 3 should be
authored that way from the start.

---

# Batch 2 — overlays and navigation

`dialog`, `popover`, `tooltip`, `dropdown-menu`, `select`, `combobox`,
`tabs`, `accordion`, `toast`. All approved as proposed unless noted.

## Fixes (would ship regardless of styling decisions)

1. **Dialog surface.** Uses `bg-canvas` today; every other floating surface
   (Popover, Dropdown, Select, Tooltip) uses `bg-overlay`. In dark mode the
   dialog is a different colour from every other overlay. → `bg-overlay`.
2. **Toast compositing.** `danger` and `success` use `bg-danger/10` /
   `bg-success/10` — a translucent tint with no opaque base, so page content
   shows straight through. → opaque `bg-overlay` base, status carried by a 3px
   rail plus an icon chip. Recorded in `MASTER-PLAN.md` as a known bug.
3. **`ComboboxTrigger` prop defect** (see accessibility item 3 above).
4. **Accordion `hover:underline`.** Underline on hover reads as a link; the
   trigger is a button. → hover tints the row.

## Styling decisions

| Component | Decision |
|---|---|
| `dialog` | `bg-overlay`; `rounded-lg` → `rounded-xl`; entrance rises 10px on the spring rather than scaling in place; backdrop gains a 3px blur; structured header / body / footer replaces one flat `p-6` |
| `popover` | `rounded-md` → `rounded-lg`; `shadow-md` → `shadow-lg` (a floating surface needs more than the resting card elevation); entrance scales from 0.97 with transform-origin at the anchor corner |
| `tooltip` | **Inverted by default** — dark bubble in light theme, light in dark, with an arrow. Requires a new token pair `--nika-inverse` / `--nika-inverse-content`, which also unlocks inverted buttons and code-block chrome later. Today a tooltip is visually identical to a popover. **Plus `variant="surface"`** to opt out of the inversion — a prop rather than a documented `className` override, because the arrow is a CSS border trick whose `border-top-color` must follow the surface and a class on the bubble cannot reach it |
| `dropdown-menu` | `shadow-md` → `shadow-lg`; `rounded-md` → `rounded-lg`; items `rounded-sm` → `rounded-md` with roomier padding |
| `select` | Trigger adopts Input's new focus ring (border + 3px, no offset) — otherwise a form with a Select beside an Input shows two different focus treatments; chevron rotates on open; selected option gets an accent tint, not only a checkmark |
| `tabs` | **Shared sliding indicator** — today each trigger paints its own `data-[selected]:bg-canvas`, so nothing moves. Needs a real implementation (measure the active trigger, translate one element), not a CSS tweak. **Four variants:** segmented (default), `underline`, `vertical`, `overflow` |
| `accordion` | Separated cards on the field token replace hairline `border-b` rows; hover tints; chevron rotates; height animates (already works today) |
| `toast` | Opaque base per fix 2; **adds `warning` and `info`** — Alert already has all five and the tokens exist |

## Feature work discovered in batch 2 (NOT documentation)

`dropdown-menu.tsx` today has **no submenus, no sections, no description slot,
and no multiple-selection** — only `disabled`. Select and Combobox have no
multiple-selection either. **Decision: build all of it.**

- Submenus + custom submenu indicator
- Sections
- Item descriptions
- Multiple selection + custom selection indicator
- `icon`, `shortcut`, `destructive` slots on `DropdownMenuItem`
- `Label` and `Separator` sub-components already exist in the file but are
  undocumented

Submenus carry keyboard navigation, focus management and positioning
complexity — scope and estimate as component work, not as a docs page.

## Documented example sets

- **Dialog** — modal size variations (implies a `size` prop; today it is a
  fixed `max-w-lg`), custom triggers, code samples.
- **Tooltip / Popover** — placement on all four sides (implies a `placement`
  prop or equivalent), customization.
- **Dropdown** — base, icons, descriptions, sections, disabled item, multiple
  selection, custom selection indicator, submenus, custom submenu indicator,
  customization, custom trigger.
- **Select / Combobox** — the same configuration matrix as Dropdown.
- **Tabs** — usage examples across all four variants.
- **Toast** — usage across all five statuses.

## Reference practice

HeroUI's documentation is used as a **reference for example coverage** — what a
mature library ships as examples. Per standing constraint, no Nika component,
file, class, prop or doc page may be labelled as HeroUI-derived or
"HeroUI-inspired." HeroUI v2 may be named in docs prose only as a reference.

**Suggested enforcement (not yet done):** `scripts/check-copy.mjs` already
fails the build on `/shadcn/i` across four roots. Adding `heroui` to the same
gate makes the constraint mechanical rather than remembered — which matters
most for agent-written code and docs prose.

---

# Batch 3 — display primitives

`alert`, `alert-dialog`, `aspect-ratio`, `avatar`, `progress`, `separator`,
`skeleton`, `spinner`, `slider`. **All approved as proposed.**

## Defects (would ship regardless of styling decisions)

1. **Alert compositing.** All four status variants use `bg-success/10`,
   `bg-warning/10`, `bg-danger/10`, `bg-info/10` — translucent tint, no opaque
   base, so page content shows through. Identical to the Toast bug in batch 2.
   → opaque `bg-surface`, status carried by a 3px left rail and an icon chip.
2. **`alert-dialog.tsx:34` hard-codes `bg-black/50`.** This breaks the repo's
   own PR checklist rule ("No hard-coded colours — all colour comes from the
   token layer"). It also cannot retune: 50% black over an already-dark canvas
   is far heavier than intended in dark mode.
   → new **`--nika-scrim`** token, tuned per theme.
   **Dialog needs the same token** — batch 2 fixed its surface but not its
   backdrop. This is an amendment to batch 2, not a separate item.
3. **Slider has no filled track.** `slider.tsx:15-19` paints the whole rail
   `bg-muted` with a primary thumb on it, so nothing shows where the value
   sits. Missing information, not a styling preference.
   **Cost, accepted:** native `input[type=range]` cannot paint a filled track
   cross-browser, so this is a **rebuild on a wrapper element** — keyboard and
   ARIA behaviour must be reimplemented rather than inherited.

## Styling decisions

| Component | Decision |
|---|---|
| `alert` | Opaque base per defect 1; 3px left rail + icon chip. **Adds:** dismissible (`onDismiss` — today Alert cannot be closed), an action slot (right-aligned button), and a top-rail variant as an alternative to the left rail |
| `alert-dialog` | `--nika-scrim` backdrop with blur; `bg-canvas` → `bg-overlay`; `rounded-xl`; spring entrance. Destructive dialogs get a danger icon chip and a **danger** confirm button — today the confirm is standard primary, so "Delete" renders in the brand accent |
| `avatar` | `size` scale 24/32/40/52/68; status dot (`online`/`away`/`offline`); square variant; ring for the active user; `AvatarGroup` with overflow count. Fallback moves **off `bg-muted`** — that token is the hover surface everywhere else, so a fallback avatar currently reads as hovered. **Accent tint approved** over neutral |
| `progress` | Label and value slots; `size` scale; status colours; real indeterminate treatment. Keeps the primary→accent gradient fill |
| `slider` | Filled track (defect 3); value bubble; step ticks; label row **matching Progress** — the two look nearly identical but are built completely differently today |
| `skeleton` | **Shimmer sweep approved** over `animate-pulse`. Pulse fades the whole block, which at low opacity reads as disabled rather than loading; a sweep is directional and reads as progress. Needs one new token for the sweep highlight |
| `spinner` | Faint full ring at 18% accent with a solid accent head — today the arc is drawn from `currentColor` on two borders with the rest transparent, so the path is ambiguous on a busy background. **Adds:** a label slot with **placement `right` \| `bottom`**, and **multiple spinner types** beyond ring and dots (bars and pulse to be specified) |
| `separator` | Adds a **label slot** — the "OR" divider between a form and a social-login button is one of the most common uses and must be hand-built today. Vertical rule already works; needs a documented inline example |
| `aspect-ratio` | **No styling change.** A layout primitive with no visual surface. Needs a documentation page only (video embed, image, map). Recorded explicitly so it is not mistaken for an oversight |

## Documented example sets

- **Alert** — simple base; with a right-side action button; with a dismiss X;
  customization (background, border overrides); all five statuses.
- **Avatar** — sizes, status dot, square, ring, group with overflow.
- **Progress / Slider** — label and value, sizes, statuses, indeterminate,
  steps and ticks.
- **Spinner** — every type, both label placements.
- **Separator** — labelled divider, vertical inline.
- **Aspect Ratio** — video embed, image, map.

## Open
- `docs/MASTER-PLAN.md` roadmap table not yet updated with H, or with F's new
  dependency on H.
- Free-vs-paid split for form/layout blocks still undecided (deferred to F).
