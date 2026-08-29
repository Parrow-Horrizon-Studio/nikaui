# Nika UI — Component Defects and Default Styling (H1)

**Sub-project:** H1 — the first half of H, *Component polish, variants and examples*.
**Depends on:** B (design-system foundation), D (documentation and showcase).
**Blocks:** F (block and template lineup). **H2** follows this spec directly.

Sibling spec, not yet written: **H2 — component features and documentation**
(see §3).

---

## 1. Context

The registry ships 27 components. They sit on a token layer that is genuinely
good — `--nika-*` variables bridged through `@theme inline`, five accents each
verified at ≥4.5:1 by a test that parses the stylesheet, hue-tinted shadows,
four ease curves and four durations. What the components do with that
vocabulary is conventional: 16 uses of `rounded-md`, 13 of `rounded-full` and
5 of `rounded-lg` with no deliberate scale; 12 elevation usages across 27
components; and 9 components with no motion at all, on a library whose landing
page headline claim is animation by default.

Three brainstorming rounds walked all 27 in batches of nine, comparing each
against a proposed alternative in an interactive mockup. Every decision below
was approved that way. The full decision record, including the options that
were rejected and the mockup tooling constraints that were learned the hard
way, is at
[`docs/superpowers/notes/2026-08-15-h-component-decisions.md`](../notes/2026-08-15-h-component-decisions.md).

Two things emerged that were not the point of the exercise.

**Ten defects surfaced, every one carried forward from B, C or D with no
previous home.** They are not stylistic disagreements: two components composite
translucent status colours over page content with no opaque base, one
hard-codes a colour in violation of the repository's own PR checklist, one
input rejects `placeholder`, and one control indicates state at 1.27:1 where
WCAG asks for 3:1. Each has been carried in `MASTER-PLAN.md` because it fell
outside whatever sub-project found it. H1 is where they close.

**The work divided into two clearly different sizes.** Restyling a component
and adding submenus to it are not the same task. H splits accordingly, and the
boundary is stated in D2 below.

Sub-project F assembles blocks and templates from these components. Polishing
after F would mean reworking every block, so H1 runs first. F needs only H1;
it does not need H2.

---

## 2. Decisions

### H1-1 — Two axes, both previously called "variant"

The word was being used for two unrelated things. They are now distinct, and
the distinction binds every later decision.

- **Style** — `default` / `brutalism` / `glass`. The token-file-swap axis
  settled during brainstorming: component source is identical across styles,
  and only the token file changes. **OSS ships `default` only**; Pro adds the
  rest.
- **Component variant** — a prop, e.g. `<Input variant="filled">`. Ships in
  OSS, inside the `default` style.

Every "variant" in this spec is the second kind. No component may branch its
markup on the style axis; a style that cannot be expressed as CSS custom
properties is out of scope for the mechanism.

This resolved a real constraint. An earlier proposal made the floating label a
default and therefore a *style* concern — which would have required a token
that changes markup, something a token file cannot do. Making the floating
label a component variant dissolves the problem: it is a prop, and the style
axis stays purely CSS. That is what keeps `brutalism` and `glass` viable later.

### H1-2 — H1 changes how components look; H2 changes what they can do

The split rule, stated once so it settles every scoping question:

- A **`variant` prop** is delivery for a styling decision → H1.
- A **capability** — `size`, `invalid`, `onDismiss`, submenus, multi-select,
  placement — → H2.
- A **defect** → H1, regardless of what it costs to fix (see H1-11).

H1 is shippable and reviewable on its own: every defect closed, every
component visually final. H2 then adds capability and documentation on a
stable base.

### H1-3 — Five components take new defaults

| Component | Change |
|---|---|
| `button` | `rounded-md` → `rounded-lg`; weight 500 → 600; resting `shadow-sm` lifting to `shadow-md` on hover. Hover becomes a 1px **rise** rather than `scale(1.02)` — scaling blurs text mid-transition. Press keeps the scale-down at 60ms and gains a ripple from the click point. Secondary moves off `bg-surface-2` onto `--nika-field` (H1-6) so it matches inputs |
| `label` | 14px/500 → 13px/600 with slight negative tracking, so a standalone label reads as a label rather than as body text at the same size |
| `checkbox` | 16 → 20px box; `rounded-sm` → 7px; unchecked border `border-primary` → `border-line-strong`. **Choreography:** box squashes to `scale(0.86)` and springs back on `--nika-ease-spring` while the tick path draws over `--nika-duration-slow` on a 60ms delay, so the fill lands first and the tick follows |
| `switch` | 44×24 → 50×28; thumb 20 → 22px on `--nika-surface` with `shadow-md`, not `shadow-lg`; thumb stretches to 28px while pressed. **Motion: spring** — `--nika-duration-spring` on `--nika-ease-spring`, with its slight overshoot on arrival (chosen over a 260ms non-overshooting glide) |
| `badge` | Default variant flips from a solid accent fill to a **tinted** one: accent at 18% over the surface, accent-tinted text, 26% border. A badge is an annotation; a solid accent fill makes it compete with the primary button on the same screen. The previous solid becomes an explicit `solid` variant. Weight 600 → 500, wider padding |

Rationale for the three that are corrections rather than taste: 16px is below
the 24px minimum touch target and is the exact size whose focus ring is
recorded as unverified (H1-9); an unchecked box painted in the accent colour
reads as already-on; a 20px thumb carrying the library's largest shadow is
over-elevated.

### H1-4 — Four components keep their default and gain a variant

The proposed styling was rejected as a default for these four and accepted as
an opt-in. The left column of each mockup — today's styling — remains what
ships with no `variant` prop.

| Component | Variant | Description |
|---|---|---|
| `input` | `filled` | Borderless filled surface on `--nika-field`, darkening on hover then focus, with the label floating inside |
| `textarea` | `filled` | Same construction as Input |
| `radio-group` | `card` | Each option a selectable card with a 2px accent border and tinted surface when chosen; 20px ring, 10px dot. Default keeps 16px/8px |
| `card` | `elevated` | Transparent border, `shadow-md` at rest, `rounded-xl`, 17px title |
| `tooltip` | `surface` | Opts **out** of the inversion in H1-8. A prop rather than a documented `className` override, because the arrow is a CSS border triangle whose `border-top-color` must follow the surface — a class on the bubble cannot reach it |
| `accordion` | `card` | Separated cards on `--nika-field` replacing hairline `border-b` rows. **Assumption, not a confirmed decision** — see below |

**One open item.** Accordion's card-versus-hairline-rows question was asked
during the batch-2 review and never answered — the reply covered Dialog,
Popover, Tooltip, Dropdown, Select, Tabs and Toast, and Accordion was not among
them. The table above assumes the same answer given for Radio Group in
batch 1 (keep today's styling as the default, ship the new one as a variant),
because the question has the identical shape. **That assumption needs
confirming before implementation.** Removing `hover:underline` (H1-12) is
independent of it and holds either way.

Two changes land on the **defaults** regardless of variant:

- `card` — a 4px hover lift over `--nika-duration-slow`, without the heavier
  resting shadow. Default `CardTitle` **stays 24px** (explicitly decided).
- `radio-group` — the dot springs in on `--nika-ease-spring`; this is not tied
  to the card variant.

### H1-5 — Overlay and navigation styling

| Component | Change |
|---|---|
| `dialog` | `rounded-lg` → `rounded-xl`; entrance rises 10px on the spring rather than scaling in place; backdrop gains a 3px blur; structured header / body / footer regions replace one flat `p-6` |
| `alert-dialog` | Same treatment. Destructive dialogs gain a danger icon chip and a **danger** confirm button — today the confirm is the standard primary, so "Delete" renders in the brand accent |
| `popover` | `rounded-md` → `rounded-lg`; `shadow-md` → `shadow-lg`; entrance scales from 0.97 with `transform-origin` at the anchor corner |
| `dropdown-menu` | `shadow-md` → `shadow-lg`; `rounded-md` → `rounded-lg`; items `rounded-sm` → `rounded-md` with roomier padding |
| `select` | Chevron rotates on open; the selected option gains an accent tint rather than only a checkmark, which is easy to miss in a long list |
| `alert` | 3px left rail plus an icon chip (see H1-7). A **top-rail variant** is also provided |
| `avatar` | Fallback moves off `bg-muted` — that token is the hover surface everywhere else, so a fallback avatar currently reads as a hovered element. Replaced with an **accent tint** (chosen over neutral) |
| `progress` | Keeps the primary→accent gradient fill; gains a real indeterminate treatment |
| `skeleton` | **Shimmer sweep** replaces `animate-pulse`. Pulse fades the whole block, which at low opacity reads as disabled rather than loading; a directional sweep reads as progress. Requires one new token (H1-6) |
| `spinner` | Faint full ring at 18% accent with a solid accent head. Today the arc is drawn from `currentColor` on two borders with the rest transparent, so on a busy background the path is ambiguous — the faint ring shows the path, the head shows position |
| `separator` | No visual change; the label slot is H2 |

`aspect-ratio` receives **no styling change**. It is a layout primitive with no
visual surface. Stated explicitly so it is not read as an oversight.

### H1-6 — One focus ring across every control

Today's controls disagree. `input`, `textarea`, `checkbox` and `switch` use
`ring-2 ring-ring ring-offset-2` — a ring that floats away from the control
with a gap. `select` and `combobox` use `focus:ring-2 focus:ring-offset-2`.
A form containing an Input beside a Select therefore shows two focus
treatments that look subtly different.

**Every focusable control adopts the same ring: a `--nika-primary` border plus
a 3px `--nika-ring`, with no offset.** It hugs the control rather than floating
off it.

This is a change to components whose default styling H1-4 otherwise leaves
alone — Input and Textarea keep everything else about their default appearance.
It was approved explicitly on that basis.

The offset ring's removal also interacts with H1-9: an offset ring at 16px was
part of why the checkbox and radio focus rings were hard to see. Measuring
after this change, not before, is what H1-9 requires.

### H1-7 — New tokens

Every property a style varies must be a token (H1-1). H1 introduces these; all
are `--nika-*` prefixed and bridged through `@theme inline` following the
existing pattern.

| Token | Purpose |
|---|---|
| `--nika-field`, `--nika-field-hover`, `--nika-field-press` | The filled-control surface. Consumed by Button secondary, the `filled` input variants, the `card` radio and accordion variants |
| `--nika-inverse`, `--nika-inverse-content` | The inverted surface pair for Tooltip (H1-8). Also unlocks inverted buttons and code-block chrome later |
| `--nika-scrim` | Modal backdrop, tuned per theme (H1-10) |
| `--nika-indicator` | State-indicator neutral meeting ≥3:1 (H1-9) |
| `--nika-shimmer` | Skeleton sweep highlight |

`--nika-field-border-w` and `--nika-elevation-rest` were considered and are
**deferred**: they exist to let `brutalism` swap border presence and hard-offset
shadows, and no shipped style needs them. Adding unused tokens now would repeat
the `access` / `styles` mistake recorded in `MASTER-PLAN.md`, where schema v2
pre-wired two fields the CLI never reads.

### H1-7 — The compositing defect: opaque bases for status surfaces

**Defect.** `alert.tsx:12-16` and `toast.tsx:22-24` paint status variants with
`bg-success/10`, `bg-warning/10`, `bg-danger/10`, `bg-info/10` — a translucent
tint over no opaque base. Page content shows straight through. On a plain
canvas it merely looks washed out; over an image or gradient it is unreadable.
`MASTER-PLAN.md` records the Toast half; the Alert half was found in this
brainstorm.

**Fix.** An opaque base — `bg-surface` for Alert, `bg-overlay` for Toast — with
status carried by a 3px rail and an icon chip whose tint is composited against
that opaque base rather than against nothing.

**Also:** Toast gains `warning` and `info`. Alert already has all five and the
tokens exist, so this fills a hole rather than designing anything.

### H1-8 — Tooltip inverts

**Defect, of a kind.** A tooltip today is `bg-overlay` + `border-line` +
`text-content` — visually identical to a popover. Two components with different
jobs and the same appearance.

**Fix.** The tooltip surface inverts against the page: dark bubble in light
theme, light bubble in dark, with a matching arrow, via `--nika-inverse` /
`--nika-inverse-content`. `variant="surface"` opts out (H1-4).

### H1-9 — State-indicator contrast

**Defect.** WCAG 2.1 SC 1.4.11 requires ≥3:1 for a control's state indicator.
The Switch off-track measures **1.27:1** against the canvas; `bg-line-strong`
reaches only 1.54:1. The component's own source comment already admits this.

The cause is that no neutral in the vocabulary is dark enough to reach 3:1
while still reading as "off, neutral, not the accent" — `line` and
`line-strong` are hairline and divider colours, `muted` is the hover surface.
It is a **missing token**, not a wrong value.

**Fix.** `--nika-indicator`, tuned to ≥3:1 against both `--nika-canvas` and
`--nika-surface` in light and dark. `packages/registry/src/styles/tokens.test.ts`
already parses `tokens.css` and asserts every accent × state at 4.5:1;
it is extended to assert this token, so the value cannot silently regress.

One token closes the same failure class everywhere an *unselected* state is
carried by a neutral: switch off-track, unchecked checkbox border, unchecked
radio ring, slider track, progress track.

**Related, and not to be assumed closed:** `checkbox` and `radio-group` use
`ring-2 ring-ring` at 16px, the same construction proven invisible at 20px
during D. H1-3 moves checkbox to 20px, which may close it; radio-group's
default stays 16px. Both must be **measured in both themes**, not reasoned
about. This is recorded in `MASTER-PLAN.md` as "measure, do not assume."

### H1-10 — Hard-coded colour, and surface consistency

**Defect.** `alert-dialog.tsx:34` uses `bg-black/50`. The repository's own PR
checklist requires *"No hard-coded colours — all colour comes from the token
layer,"* and this ships in the registry. It also cannot retune: a 50% black
scrim over an already-dark canvas is far heavier than intended.

**Fix.** `--nika-scrim`, tuned per theme. **Dialog takes the same token** — its
surface and its backdrop are separate problems and only the surface was caught
initially.

**Surface consistency, three instances of one problem** — components using a
different token than their siblings for the same job:

1. `dialog` and `alert-dialog` use `bg-canvas`; Popover, Dropdown, Select and
   Tooltip use `bg-overlay`. In dark mode the dialog is a different colour from
   every other floating surface. → `bg-overlay`.
2. `textarea` sits on `bg-canvas-2` while `input` sits on `bg-canvas`. Two
   surfaces for the same job. → `bg-canvas`.
3. `avatar` fallback on `bg-muted`, the hover surface (H1-5).

### H1-11 — Slider is rebuilt

**Defect.** `slider.tsx:15-19` paints the entire rail `bg-muted` and places a
primary thumb on it. There is **no filled track**, so nothing indicates where
the value sits. That is missing information, not a styling preference.

**Cost, accepted.** Native `input[type=range]` cannot paint a filled track
cross-browser. The fix is a rebuild on a wrapper element, which means keyboard
interaction and ARIA (`role="slider"`, `aria-valuenow`, `aria-valuemin`,
`aria-valuemax`, `aria-orientation`, arrow/Home/End/PageUp/PageDown handling)
must be reimplemented rather than inherited from the native element.

This is the largest single item in H1 and the one most tempting to defer. It
stays because H1's charter is to close every known defect, and deferring
defects with expensive fixes is precisely the pattern that produced this
backlog. Its keyboard behaviour is tested, not assumed.

Slider's label and value row is designed to match Progress. The two look nearly
identical today and are built entirely differently.

### H1-12 — Two remaining defects

**`ComboboxTrigger` rejects every native input attribute.** `placeholder`,
`id`, `name` and the rest fail to type-check, because its props resolve against
an uninstantiated generic (`combobox.tsx:17-19`). It is a text input that
cannot take a placeholder. Fix: instantiate the generic, or intersect with
`React.InputHTMLAttributes<HTMLInputElement>`. Confirmed during D and parked
on scope.

**`accordion.tsx:34` uses `hover:underline`.** Underline on hover reads as a
link; the trigger is a button. This is the one styling choice in the library
that is a mistake rather than a preference. → hover tints the row.

### H1-13 — Motion is per-component choreography

Settled during brainstorming: a uniform scale preset cannot express what the
reference feel actually is. Each component gets its own choreography, driven by
the existing `useMotionPreset` API and the existing duration and ease tokens —
no new motion infrastructure.

The specific choreographies are named inline in H1-3 and H1-5. All must honour
`prefers-reduced-motion` through the existing mechanism, and the existing
reduced-motion tests are extended to cover every newly animated component.

**Nine components have no motion today** — `alert`, `aspect-ratio`, `avatar`,
`badge`, `input`, `label`, `separator`, `slider`, `textarea`. H1 does not add
motion to all nine for its own sake; `aspect-ratio`, `label` and `separator`
have nothing to animate and are left alone deliberately.

### H1-14 — The naming constraint becomes mechanical

HeroUI's documentation was used as a reference for *example coverage* — what a
mature library ships. The standing constraint is that no Nika component, file,
class, prop or documentation page may be labelled HeroUI-derived or
"HeroUI-inspired"; HeroUI v2 may be named in documentation prose only, as a
reference.

`scripts/check-copy.mjs` already fails the build on `/shadcn/i` across four
roots. **`heroui` is added to the same gate**, making the constraint mechanical
rather than remembered — which matters most for agent-written code and prose,
where it is likeliest to slip.

Unrelated but adjacent, and now unavoidable: that gate scans
`packages/registry/src`, where an MIT attribution notice would legally need to
live if any component derives from shadcn/ui. `MASTER-PLAN.md` records this as
needing a licensing decision. **H1 does not resolve it** and must not be read
as having done so.

---

## 3. Out of scope

Everything below is **H2**, which follows this spec directly. It is listed so
the boundary is explicit and nothing is assumed delivered here.

**Capabilities** (H1-2's rule: what components can *do*):

- `dropdown-menu` — submenus and custom submenu indicators, sections, item
  descriptions, multiple selection and custom selection indicators, `icon` /
  `shortcut` / `destructive` item slots. None exist today; only `disabled`
  does. Submenus carry keyboard navigation, focus management and positioning,
  and must be scoped as component work
- `select` and `combobox` — multiple selection, matching Dropdown's matrix
- `tabs` — the shared **sliding indicator**, plus `underline`, `vertical` and
  `overflow` variants. Today each trigger paints its own
  `data-[selected]:bg-canvas`, so nothing moves. This needs a measure-and-
  translate implementation, not a CSS change
- `input` / `textarea` — `size` (34/40/46px) and `invalid` props, the latter
  wiring `aria-invalid` and `aria-describedby` to the message element
- `dialog` — a `size` prop; today it is a fixed `max-w-lg`
- `tooltip` / `popover` — `placement` on all four sides
- `alert` — `onDismiss` and an action slot
- `avatar` — `size` scale, status dot, square variant, active ring,
  `AvatarGroup` with overflow count
- `progress` — label and value slots, `size` scale, status colours
- `spinner` — additional types beyond ring and dots, and a label slot with
  `right` | `bottom` placement
- `separator` — the label slot for "OR" dividers

**Documentation**: the full example matrix for all 27 components, and the
**18 pages still marked `status: stub`**. The example sets agreed during
brainstorming — Input's sixteen states and types, Card's six layouts,
Dropdown's eleven configurations, Aspect Ratio's three — are specified in the
decision record and belong to H2.

**Deferred beyond H2**: the `brutalism` and `glass` token files (Pro, and out
of the OSS repository entirely); the free-vs-paid split for blocks (F); the
shadcn/ui attribution licensing decision (H1-14).

---

## 4. Verification

H1 is complete when all of the following hold. Claims are evidenced by command
output, not asserted.

**Gates.** `pnpm lint` (`--max-warnings 0`), `pnpm check-types`, `pnpm build`,
`pnpm test` and `pnpm check-copy` all pass. `check-copy` now fails on `heroui`,
and that new rule is **observed failing before it is trusted** — the same
discipline D applied to its new gate root.

**Tokens.** `tokens.test.ts` asserts `--nika-indicator` at ≥3:1 against both
`--nika-canvas` and `--nika-surface` in light and dark, alongside the existing
accent assertions. Every new token in H1-6 is consumed by at least one
component; none is dead.

**No hard-coded colours.** A search across `packages/registry/src` returns no
literal colour values. `bg-black/50` is gone.

**The compositing fix is verified visually, over a non-flat background.** A
structural check cannot see this defect — the class names look correct today.
Alert and Toast in every status must be screenshotted over an image or
gradient, in both themes.

**Contrast is measured, not reasoned about.** The switch off-track, the
unchecked checkbox border at 20px and the unchecked radio ring at 16px are each
measured in both themes and the numbers recorded. "The construction looks like
the one that failed" is not a finding either way.

**Slider keyboard behaviour is tested**, not assumed: arrow keys, Home, End,
PageUp, PageDown, and the full ARIA attribute set.

**Reduced motion.** Existing tests are extended to every newly animated
component.

**The visual pass happens.** Every changed component is looked at in both
themes and at 375px, using a **freshly created browser tab** — a carried-over
tab stops compositing, which is the cause of this project's long history of
screenshot failures. D's visual pass found four defects that every structural
check had passed.

**Known limitation, stated rather than hidden.** Every browser pane available
to this project forces `prefers-reduced-motion: reduce`. "Nothing animates
under reduced motion" is therefore confirmable; "the choreography looks right
under normal motion" is not. H1 adds substantially more motion than exists
today, so this gap matters more here than it did in C or D. If it cannot be
closed, it is reported as open — as C's §5.7 was — and not inferred from the
code.

---

## 5. Roadmap changes

`docs/MASTER-PLAN.md` §4 is updated as part of this sub-project:

- **H1** and **H2** are added to the roadmap table.
- **F** gains a dependency on **H1**.
- The carried-forward entries for the ten defects closed here are moved to the
  resolved list with the date, following the existing convention.
