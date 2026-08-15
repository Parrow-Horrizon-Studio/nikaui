# Nika UI — Component Features and Documentation (H2)

**Sub-project:** H2 — the second half of H, *Component polish, variants and examples*.
**Depends on:** H1 (component defects and default styling).
**Blocks:** nothing. F may start after H1 and does not wait for H2.

Sibling spec: [`2026-08-15-nikaui-component-styling.md`](2026-08-15-nikaui-component-styling.md) (H1).

---

## 1. Context

H1 leaves every component visually final and every known defect closed. What
it deliberately does not do is make the components *capable*.

The gap was found by walking the library against the example coverage a mature
component library ships. Repeatedly the answer to "show this in the docs" was
"the component cannot do that yet." A dropdown with no submenus, no sections
and no multiple selection; an input with no error state and one size; a dialog
locked to `max-w-lg`; a tooltip that cannot be placed anywhere but its default
side; an alert that cannot be dismissed. These are not styling questions and
H1's split rule (*H1 changes how components look; H2 changes what they can do*)
put every one of them here.

The second half of H2 is the documentation those capabilities exist to serve.
**Eighteen of twenty-seven component pages are still marked `status: stub`** —
each carries an `## API Reference` documenting only the `motion` prop, which is
honest but is not a prop table. D marked them from frontmatter and recorded
writing them as its own sub-project. This is that sub-project.

The two halves are one sub-project because they are the same work seen from two
sides: the example matrix is the specification for the capabilities, and the
capabilities are what make the matrix writable. Splitting them would mean
building features against a guess at how they would be shown.

---

## 2. Decisions

### H2-1 — Capability additions, by component

Each is a prop or sub-component on an existing component. None changes a
default appearance; H1 already settled those.

**`dropdown-menu` — the largest item.**

- Submenus (`DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`)
  with a custom indicator slot
- Sections (`DropdownMenuGroup` with a heading)
- Item descriptions — a secondary line beneath the label
- Multiple selection (`DropdownMenuCheckboxItem`) with a custom selection
  indicator slot
- `icon`, `shortcut` and `destructive` slots on `DropdownMenuItem`

`DropdownMenuLabel` and `DropdownMenuSeparator` already exist in the file and
are undocumented; they are not new work, only new documentation.

Submenus carry keyboard navigation (right/left arrow to open and close, typeahead
passing to the open submenu), focus management across two floating layers, and
collision-aware positioning. This is scoped as component work, not as a
variant.

**`select` and `combobox`** — multiple selection, matching Dropdown's
construction so the three read as siblings rather than three separate designs.

**`tabs`** — the shared **sliding indicator**, and with it three variants
beyond the default: `underline`, `vertical`, `overflow`.

Today each trigger paints its own `data-[selected]:bg-canvas`, so nothing
moves — the highlight appears elsewhere. A single indicator element that
measures the active trigger and translates to it is a different mechanism, and
it is what drives all four variants from one implementation. This was the
change that drew the strongest positive response during brainstorming.

`overflow` handles more tabs than fit: horizontal scroll with edge fades and
keyboard-reachable scroll, not a dropdown fallback.

**`input` and `textarea`**

- `size` — `sm` / `md` / `lg` at 34 / 40 / 46px
- `invalid` — colours the border and **wires `aria-invalid` and
  `aria-describedby`** to the message element. The ARIA wiring is the point;
  a red border alone is not an error state
- `startContent` / `endContent` — icons and affixes as **props, not composed
  children** (decided). The prop form is what makes the input's padding shift
  automatically; composition leaves that to the consumer to get right
- A `Field` wrapper providing the label, description and error slots, and
  carrying the **floating label** for `variant="filled"` — H1 shipped that
  variant's surface treatment only, because the floating label needs a wrapper

**`dialog`** — a `size` prop (`sm` / `md` / `lg` / `full`); today it is a fixed
`max-w-lg`.

**`tooltip` and `popover`** — `placement` on all four sides, collision-aware.

**`alert`** — `onDismiss`, and an action slot for a right-aligned button.

**`avatar`** — `size` scale (24/32/40/52/68), status dot
(`online` / `away` / `offline`), `square` variant, active ring, and
`AvatarGroup` with an overflow count.

**`progress`** — label and value slots, `size` scale, status colours.

**`spinner`** — additional types beyond `ring` and `dots`, and a label slot
with `right` | `bottom` placement.

**`separator`** — a label slot. The "OR" divider between a form and a
social-login button is one of its most common uses and must be hand-built
today.

### H2-2 — Every new prop is tested for behaviour, not for class names

H1's tests could reasonably assert utility strings, because H1 changed
appearance. H2 changes behaviour, and a test asserting that a submenu has
`rounded-lg` proves nothing about whether it opens.

Tests assert: keyboard paths, focus movement, ARIA attributes and their
relationships, and selection state. Class-name assertions are acceptable only
where a class *is* the deliverable, which in H2 is nowhere.

### H2-3 — The example matrix

Every component page gets the examples below. This is the specification the
capabilities were derived from, agreed component-by-component during
brainstorming.

| Component | Examples |
|---|---|
| `input` | left icon, right icon, password with reveal, number with steppers, URL prefix, date, file, search with clear, invalid + message, valid, helper text, disabled, read-only, three sizes, controlled form |
| `card` | divider footer, product, profile, stat, cover-with-avatar, compact horizontal row |
| `dropdown-menu` | base, icons, descriptions, sections, disabled item, multiple selection, custom selection indicator, submenus, custom submenu indicator, customization, custom trigger |
| `select`, `combobox` | the same matrix as `dropdown-menu` |
| `dialog` | size variations, custom triggers, destructive |
| `tooltip`, `popover` | all four placements, customization |
| `tabs` | all four variants |
| `toast`, `alert` | all five statuses; alert also with an action button, with dismiss, and customization |
| `avatar` | sizes, status dot, square, ring, group with overflow |
| `progress`, `slider` | label and value, sizes, statuses, indeterminate, steps and ticks |
| `spinner` | every type, both label placements |
| `separator` | labelled divider, vertical inline |
| `aspect-ratio` | video embed, image, map |

**Every component page also gets a customization example** — adjusting
background, border and radius through `className` and through the token layer,
showing both routes.

### H2-4 — Documentation shows the source a developer owns

The original request that started H, and still unaddressed: *"the documentation
should also display the component that will get installed on user's project."*

Today `button.mdx`'s Usage block shows `<Button>Click me</Button>` — how to
*call* it, not what lands in `components/ui/button.tsx`. Across all 27 pages the
code a developer owns and will edit appears nowhere.

Every component page gains a **Source** view showing the actual registry file.
It is read from `packages/registry/src/ui/*.tsx` at build time, not copied —
a copy would drift, and previews already prove the docs and the CLI serve one
source (`component-previews.tsx` imports `@nikaui/registry/ui/button`; the CLI
fetches the same path from GitHub raw).

### H2-5 — The eighteen stubs close

Every page loses `status: stub` and gains a real prop table. A page may only
drop the marker when it has: a live preview, a prop table covering every public
prop, the examples from H2-3, and the Source view from H2-4.

The frontmatter `status` field and the derived component index built in D stay
as they are — this fills them in rather than replacing the mechanism.

### H2-6 — Previews gain the switchers D chartered but did not deliver

D's charter included "live previews for every component, with variant and
motion-preset switchers"; what shipped was one fixed demo per component.

Each preview gains a variant switcher (where the component has variants) and a
motion-preset switcher. The motion switcher is the only place in the
documentation where `none` / `snap` / `glide` / `spring` / `bounce` can be
felt rather than read about.

---

## 3. Out of scope

- **`llms.txt` and agent Tiers 0/1** — chartered in D, still unstarted. They
  belong with the agent surface (G), not here.
- **Prop-table generation from types.** Prop tables are written by hand. D
  deferred automated binding (its D8) and nothing here reverses that.
- **`brutalism` and `glass` token files** — Pro, and outside the OSS repository.
- **Blocks and templates** — F.
- **The shadcn/ui attribution licensing decision** — recorded in
  `MASTER-PLAN.md`, unresolved by H1 or H2.

---

## 4. Verification

**Gates.** `pnpm lint` (`--max-warnings 0`), `pnpm check-types`, `pnpm build`,
`pnpm test`, `pnpm check-copy` all pass. `check-copy` covers
`apps/web/content`, so every new documentation page is scanned for the copy
rules including the `heroui` term H1 added.

**Behaviour, not markup.** Every capability in H2-1 has a test that exercises
it through the keyboard or through ARIA state. Submenus specifically: open and
close by keyboard, focus returning to the trigger on close, and typeahead
reaching the open submenu.

**No page claims what it does not have.** Zero pages carry `status: stub` at
completion, and the derived component index lists all 27 as complete. A page
retaining the marker is a legitimate outcome only if it is reported as
undelivered, not silently dropped.

**The Source view reads the real file.** Verified by changing a registry file
and confirming the rendered page changes — a copy would not.

**The visual pass covers every new page** in both themes and at 375px, from a
**freshly created browser tab**. D's visual pass found four defects that every
structural check had passed, including invisible keyboard focus and a
zero-width tab stop.

**Motion.** The same limitation stated in H1 applies: every available browser
pane forces `prefers-reduced-motion: reduce`. The motion-preset switcher in
H2-6 cannot be verified under normal motion in this environment. If it cannot
be closed, it is reported open rather than inferred.

---

## 5. Roadmap changes

`docs/MASTER-PLAN.md` is updated as part of this sub-project:

- **H2** marked complete in §4.
- The carried-forward entries closed here move to the resolved list with the
  date: the eighteen stubs, the missing preview switchers, and D's undelivered
  charter items other than `llms.txt` and the agent tiers.
- §5's component catalogue updated where a component gained capabilities.
