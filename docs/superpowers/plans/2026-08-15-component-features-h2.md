# H2 — Component Features and Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the capabilities the documentation needs, then write the documentation — closing all eighteen stub pages.

**Architecture:** Capabilities first (Tasks 1–9), documentation second (Tasks 10–16). The order is deliberate: the example matrix is the specification for the capabilities, so building a page against a capability that does not exist yet produces a page that has to be rewritten. Tabs' sliding indicator and Dropdown's submenus are the two structural pieces; everything else is additive props on existing components.

**Tech Stack:** React 19, Tailwind CSS v4, Motion, Headless UI, `cva`, Fumadocs 16 + `fumadocs-mdx`, Vitest + Testing Library, Turborepo + pnpm 9, Node 22.

**Spec:** [`docs/superpowers/specs/2026-08-15-nikaui-component-features.md`](../specs/2026-08-15-nikaui-component-features.md)

## Global Constraints

- **H1 must be merged first.** This plan assumes the five new tokens, the unified focus ring, and every H1 default. Do not re-litigate an H1 decision here.
- **Tests assert behaviour, not class names.** H2 changes what components do. A test proving a submenu has `rounded-lg` proves nothing about whether it opens. Assert keyboard paths, focus movement, ARIA attributes and their relationships, and selection state.
- **No hard-coded colours.** Unchanged from H1.
- **Naming:** `pnpm check-copy` fails on `shadcn` and `heroui` across four roots including `apps/web/content`. Every new documentation page is scanned.
- **Frontmatter fields must be declared in `apps/web/source.config.ts`.** Fumadocs' default `pageSchema` is a plain `z.object` with **no `.passthrough()`**, and `fumadocs-mdx` *replaces* frontmatter with the parse result — an undeclared field silently becomes `undefined` with a green build. D was bitten by this with `category`.
- **A page may only drop `status: stub`** when it has a live preview, a prop table covering every public prop, its examples from the matrix, and the Source view. Dropping the marker early is a false claim the derived index will repeat.
- **Prop tables are hand-written.** Automated binding from types is explicitly deferred (D8).
- **Run the focused test while iterating; run the full suite once before committing.**

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `packages/registry/src/ui/tabs.tsx` | Sliding indicator + four variants | 1 |
| `packages/registry/src/ui/dropdown-menu.tsx` | Submenus, sections, descriptions, multi-select, item slots | 2, 3 |
| `packages/registry/src/ui/{select,combobox}.tsx` | Multiple selection | 4 |
| `packages/registry/src/ui/field.tsx` | New — label/description/error wrapper, floating label | 5 |
| `packages/registry/src/ui/{input,textarea}.tsx` | `size`, `invalid`, `startContent`, `endContent` | 5 |
| `packages/registry/src/ui/{dialog,tooltip,popover}.tsx` | `size`, `placement` | 6 |
| `packages/registry/src/ui/{alert,avatar}.tsx` | Dismiss, action, avatar scale + group | 7 |
| `packages/registry/src/ui/{progress,spinner,separator}.tsx` | Slots, types, label | 8 |
| `apps/web/src/components/docs/source-view.tsx` | New — renders the real registry file | 10 |
| `apps/web/src/components/docs/preview-switchers.tsx` | New — variant + motion switchers | 11 |
| `apps/web/content/docs/components/*.mdx` | 27 pages | 12–15 |
| `docs/MASTER-PLAN.md` | Roadmap + resolved entries | 16 |

---

## Task 1: Tabs — one indicator that slides

**Files:**
- Modify: `packages/registry/src/ui/tabs.tsx`
- Test: `packages/registry/src/ui/tabs.test.tsx`

**Interfaces:**
- Produces: `<Tabs variant="segmented" | "underline" | "vertical" | "overflow">`. All four are driven by the same indicator; a later task must not add a second mechanism.

- [ ] **Step 1: Write the failing test**

```tsx
it("moves one indicator rather than repainting each trigger", async () => {
  render(
    <Tabs defaultValue="a">
      <TabsList><TabsTrigger value="a">A</TabsTrigger><TabsTrigger value="b">B</TabsTrigger></TabsList>
    </Tabs>
  );
  expect(screen.getAllByTestId("tabs-indicator")).toHaveLength(1);
  const before = screen.getByTestId("tabs-indicator").style.transform;
  await userEvent.click(screen.getByRole("tab", { name: "B" }));
  expect(screen.getByTestId("tabs-indicator").style.transform).not.toBe(before);
});

it("arrow keys move selection", async () => {
  render(/* same */);
  screen.getByRole("tab", { name: "A" }).focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute("aria-selected", "true");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test tabs`
Expected: FAIL — no indicator element exists; each trigger carries `data-[selected]:bg-canvas`.

- [ ] **Step 3: Build the indicator**

`TabsList` renders one absolutely positioned indicator plus the triggers. A layout effect measures the active trigger's `offsetLeft` / `offsetWidth` (or `offsetTop` / `offsetHeight` when `vertical`) and writes a transform. Re-measure on resize via `ResizeObserver`, and on value change.

Remove `data-[selected]:bg-canvas data-[selected]:shadow-sm` from `TabsTrigger` — the indicator owns that now. The trigger keeps only its colour and weight change.

Motion: `transition: transform var(--nika-duration-slow) var(--nika-ease-spring)`, disabled under reduced motion through the existing API.

**The from-state must not depend on a client-only measurement for its first paint.** Render the indicator hidden until measured, rather than at a wrong position — a visible jump on hydration is worse than a frame of absence.

- [ ] **Step 4: Add the four variants**

- `segmented` (default) — today's pill on `bg-muted`, indicator `bg-surface shadow-sm`
- `underline` — transparent list with a bottom border; indicator is a 2px `bg-primary` bar at the bottom
- `vertical` — list is a column; indicator translates on Y; `aria-orientation="vertical"`; Up/Down arrows instead of Left/Right
- `overflow` — horizontal scroll with edge fade masks; the active trigger scrolls into view on selection

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter @nikaui/registry test tabs reduced-motion`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/src/ui/tabs.tsx packages/registry/src/ui/tabs.test.tsx
git commit -m "feat(tabs): one sliding indicator driving four variants"
```

---

## Task 2: Dropdown — item slots, sections and descriptions

**Files:**
- Modify: `packages/registry/src/ui/dropdown-menu.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("renders icon, description and shortcut without the consumer laying them out", async () => {
  render(
    <DropdownMenu>
      <DropdownMenuTrigger>open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup label="Account">
          <DropdownMenuItem icon={<span data-testid="ic" />} shortcut="⌘P" description="Your public profile">
            Profile
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  await userEvent.click(screen.getByRole("button"));
  expect(screen.getByTestId("ic")).toBeInTheDocument();
  expect(screen.getByText("⌘P")).toBeInTheDocument();
  expect(screen.getByText("Your public profile")).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Account" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test dropdown`
Expected: FAIL — `DropdownMenuItem` takes children only; `DropdownMenuGroup` does not exist.

- [ ] **Step 3: Add the slots**

`DropdownMenuItem` gains `icon?: ReactNode`, `shortcut?: ReactNode`, `description?: ReactNode`, `destructive?: boolean`. The item becomes a two-row flex when `description` is set. `destructive` applies `text-danger` and `hover:bg-danger/12`.

`DropdownMenuGroup` wraps items with `role="group"` and `aria-labelledby` pointing at its heading — the existing `DropdownMenuLabel` renders that heading.

- [ ] **Step 4: Run the test**

Run: `pnpm --filter @nikaui/registry test dropdown`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/src/ui/dropdown-menu.tsx
git commit -m "feat(dropdown): icon, shortcut, description and destructive slots; groups"
```

---

## Task 3: Dropdown — submenus and multiple selection

**Files:**
- Modify: `packages/registry/src/ui/dropdown-menu.tsx`

**The largest task in this plan. Two floating layers, focus crossing between them.**

- [ ] **Step 1: Write the failing test — keyboard first**

```tsx
describe("submenu keyboard", () => {
  const tree = (
    <DropdownMenu>
      <DropdownMenuTrigger>open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
          <DropdownMenuSubContent><DropdownMenuItem>Deep</DropdownMenuItem></DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  it("ArrowRight opens and focuses the first item", async () => {
    render(tree);
    await userEvent.click(screen.getByRole("button"));
    screen.getByText("More").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByText("Deep")).toHaveFocus();
  });

  it("ArrowLeft closes and returns focus to the trigger", async () => {
    render(tree);
    await userEvent.click(screen.getByRole("button"));
    screen.getByText("More").focus();
    await userEvent.keyboard("{ArrowRight}{ArrowLeft}");
    expect(screen.queryByText("Deep")).not.toBeInTheDocument();
    expect(screen.getByText("More")).toHaveFocus();
  });
});

it("checkbox items track selection independently", async () => {
  const onChange = vi.fn();
  render(/* two DropdownMenuCheckboxItem, one checked */);
  await userEvent.click(screen.getByRole("menuitemcheckbox", { name: "B" }));
  expect(onChange).toHaveBeenCalledWith(true);
  expect(screen.getByRole("menuitemcheckbox", { name: "A" })).toHaveAttribute("aria-checked", "true");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test dropdown`
Expected: FAIL — none of these exports exist.

- [ ] **Step 3: Build submenus**

`DropdownMenuSub` owns open state. `DropdownMenuSubTrigger` opens on hover after a short intent delay, on click, and on `ArrowRight`; it renders `aria-haspopup="menu"` and `aria-expanded`, plus an indicator slot (`indicator?: ReactNode`, defaulting to a chevron). `DropdownMenuSubContent` is a second floating layer positioned to the trigger's right, flipping left on collision.

`ArrowLeft` and `Escape` close the submenu and return focus to its trigger — not to the root menu. Closing the root closes every open submenu.

- [ ] **Step 4: Build multiple selection**

`DropdownMenuCheckboxItem` with `checked` / `onCheckedChange`, `role="menuitemcheckbox"` and `aria-checked`. An `indicator` prop replaces the default check mark. Selecting does **not** close the menu — that is the difference from `DropdownMenuItem` and is the behaviour to test.

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter @nikaui/registry test dropdown`
Expected: PASS, both keyboard paths and selection.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/src/ui/dropdown-menu.tsx
git commit -m "feat(dropdown): submenus and multiple selection"
```

---

## Task 4: Select and Combobox — multiple selection

**Files:**
- Modify: `packages/registry/src/ui/{select,combobox}.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("multiple select keeps the menu open and reports an array", async () => {
  const onChange = vi.fn();
  render(<Select multiple onValueChange={onChange}>{/* three options */}</Select>);
  await userEvent.click(screen.getByRole("combobox"));
  await userEvent.click(screen.getByRole("option", { name: "A" }));
  await userEvent.click(screen.getByRole("option", { name: "B" }));
  expect(onChange).toHaveBeenLastCalledWith(["A", "B"]);
  expect(screen.getByRole("listbox")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test select combobox`
Expected: FAIL — `multiple` is not a prop.

- [ ] **Step 3: Implement**

Pass `multiple` through to the underlying Headless UI listbox/combobox, which supports it. The work is the trigger's display: with `multiple`, render selected values as removable chips with an overflow count rather than a single string. `aria-multiselectable` on the listbox.

Selection must not close the list.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @nikaui/registry test select combobox`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/src/ui
git commit -m "feat(select,combobox): multiple selection with chip display"
```

---

## Task 5: Field wrapper, and Input/Textarea props

**Files:**
- Create: `packages/registry/src/ui/field.tsx`
- Modify: `packages/registry/src/ui/{input,textarea}.tsx`

**Interfaces:**
- Produces: `<Field label description error>`, and `size` / `invalid` / `startContent` / `endContent` on both inputs.

- [ ] **Step 1: Write the failing test — ARIA is the deliverable**

```tsx
it("wires aria-invalid and aria-describedby to the message", () => {
  render(<Field label="Email" error="Enter a valid email"><Input /></Field>);
  const input = screen.getByRole("textbox");
  expect(input).toHaveAttribute("aria-invalid", "true");
  const describedBy = input.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  expect(document.getElementById(describedBy!)).toHaveTextContent("Enter a valid email");
});

it("startContent shifts the input padding automatically", () => {
  render(<Input startContent={<span>@</span>} aria-label="i" />);
  expect(screen.getByRole("textbox").className).toMatch(/pl-\d/);
});
```

The second test is why icons are props rather than composed children: the padding shift is automatic and cannot be forgotten.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test field input`
Expected: FAIL — `field.tsx` does not exist; `startContent` is not a prop.

- [ ] **Step 3: Build `Field`**

Owns a generated id, renders `Label`, the control, an optional description and an optional error, and wires `aria-invalid` plus `aria-describedby` onto the control via context. When the wrapped input is `variant="filled"`, `Field` renders the **floating label** — H1 shipped that variant's surface only, and this is where the label behaviour lands.

- [ ] **Step 4: Add the input props**

`size`: `sm` 34px / `md` 40px (default) / `lg` 46px.
`invalid`: `border-danger focus-visible:ring-danger/45`.
`startContent` / `endContent`: absolutely positioned, with `pl-9` / `pr-10` applied to the input by the same variant.

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter @nikaui/registry test field input textarea`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/src/ui
git commit -m "feat(forms): Field wrapper, input size/invalid/content props"
```

---

## Task 6: Dialog `size`, Tooltip and Popover `placement`

**Files:**
- Modify: `packages/registry/src/ui/{dialog,tooltip,popover}.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it.each(["top", "right", "bottom", "left"] as const)("tooltip places %s", async (placement) => {
  render(<Tooltip content="hi" placement={placement}><button>t</button></Tooltip>);
  await userEvent.hover(screen.getByRole("button"));
  expect(await screen.findByRole("tooltip")).toHaveAttribute("data-placement", placement);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test tooltip popover dialog`
Expected: FAIL — `placement` is not a prop.

- [ ] **Step 3: Implement**

`placement` on Tooltip and Popover, collision-aware (flip to the opposite side when there is no room). The tooltip **arrow must follow the placement** — its border-colour edge changes per side. This is the same coupling that made `variant="surface"` a prop in H1.

`size` on Dialog: `sm` `max-w-sm` / `md` `max-w-lg` (default, today's behaviour) / `lg` `max-w-2xl` / `full` `max-w-[calc(100vw-2rem)]`.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @nikaui/registry test tooltip popover dialog`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/src/ui
git commit -m "feat(overlays): tooltip and popover placement, dialog size"
```

---

## Task 7: Alert dismiss and action; Avatar scale and group

**Files:**
- Modify: `packages/registry/src/ui/{alert,avatar}.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("dismiss button is labelled and fires", async () => {
  const onDismiss = vi.fn();
  render(<Alert onDismiss={onDismiss}>msg</Alert>);
  await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
  expect(onDismiss).toHaveBeenCalled();
});

it("AvatarGroup reports the overflow count", () => {
  render(<AvatarGroup max={2}>{/* four avatars */}</AvatarGroup>);
  expect(screen.getByText("+2")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test alert avatar`
Expected: FAIL — neither exists.

- [ ] **Step 3: Implement**

Alert: `onDismiss` renders a close button with an accessible name; `action` renders a right-aligned slot.

Avatar: `size` at 24/32/40/52/68; `status` rendering a dot with an accessible label; `shape="square"`; `ring` for the active user; `AvatarGroup` with `max`, negative margins, and a `+N` overflow chip.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @nikaui/registry test alert avatar`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/src/ui
git commit -m "feat(ui): alert dismiss and action, avatar sizes, status and group"
```

---

## Task 8: Progress, Spinner and Separator slots

**Files:**
- Modify: `packages/registry/src/ui/{progress,spinner,separator}.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("separator with a label keeps its semantics", () => {
  render(<Separator label="OR" />);
  expect(screen.getByRole("separator")).toBeInTheDocument();
  expect(screen.getByText("OR")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @nikaui/registry test separator progress spinner`
Expected: FAIL.

- [ ] **Step 3: Implement**

Progress: `label` and `showValue` slots rendering a row above the track; `size` at 4/8/12px; `status` colouring the fill.
Spinner: additional types beyond `ring` and `dots` — `bars` and `pulse` — and `label` with `labelPlacement="right" | "bottom"`.
Separator: `label` centring text between two rules, keeping `role="separator"`.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @nikaui/registry test separator progress spinner`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/registry/src/ui
git commit -m "feat(ui): progress and spinner slots, separator label"
```

---

## Task 9: Full registry gate before documentation starts

- [ ] **Step 1: Run everything**

```bash
pnpm lint && pnpm check-types && pnpm build && pnpm test && pnpm check-copy
```

Expected: all pass.

- [ ] **Step 2: Confirm every new prop is exported from the package entry**

A prop that works in the monorepo but is not reachable from `@nikaui/registry` fails only in a consumer's project. Check the barrel exports.

- [ ] **Step 3: Commit if anything changed**

```bash
git add -A && git commit -m "chore: green the registry before documentation"
```

---

## Task 10: The Source view

**Files:**
- Create: `apps/web/src/components/docs/source-view.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("reads the real registry file, not a copy", async () => {
  const rendered = await renderSourceView("button");
  const actual = readFileSync("../../packages/registry/src/ui/button.tsx", "utf8");
  expect(rendered).toContain(actual.split("\n")[0]);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter web test source-view`
Expected: FAIL — the component does not exist.

- [ ] **Step 3: Build it**

A Server Component reading `packages/registry/src/ui/<name>.tsx` at build time and rendering it in a syntax-highlighted, copyable block. **Read the file; do not copy its contents into MDX** — a copy drifts, and the docs and CLI serving one source is a property worth keeping true.

Throw on a missing file rather than rendering an empty block. A silent empty Source view is the same failure mode as D's empty component index.

- [ ] **Step 4: Run the test**

Run: `pnpm --filter web test source-view`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/docs/source-view.tsx
git commit -m "feat(docs): Source view reading the real registry file"
```

---

## Task 11: Preview switchers

**Files:**
- Create: `apps/web/src/components/docs/preview-switchers.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it("changing the motion preset re-renders the preview", async () => {
  render(<PreviewWithSwitchers component="button" />);
  await userEvent.click(screen.getByRole("button", { name: "bounce" }));
  expect(screen.getByTestId("preview")).toHaveAttribute("data-motion", "bounce");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter web test preview-switchers`
Expected: FAIL.

- [ ] **Step 3: Build it**

A Client Component wrapping a preview with two segmented controls: variant (where the component has variants) and motion preset (`none` / `snap` / `glide` / `spring` / `bounce`). The motion switcher passes the preset to the component's `motion` prop.

D chartered these and shipped fixed demos instead; this is the delivery.

- [ ] **Step 4: Run the test**

Run: `pnpm --filter web test preview-switchers`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/docs/preview-switchers.tsx
git commit -m "feat(docs): variant and motion-preset switchers on previews"
```

---

## Task 12: Form component pages

**Files:**
- Modify: `apps/web/content/docs/components/{input,textarea,label,checkbox,radio-group,switch,select,combobox,slider}.mdx`

- [ ] **Step 1: Confirm the frontmatter schema accepts every field you use**

Check `apps/web/source.config.ts` before writing. An undeclared field silently becomes `undefined` with a green build.

- [ ] **Step 2: Write each page**

Each page: live preview with switchers, Source view, hand-written prop table covering every public prop, then the examples from the spec's matrix. Input takes all fifteen listed examples including the controlled form.

Larger form patterns — multi-step, schema validation, server actions — **link out to blocks** rather than living here.

- [ ] **Step 3: Remove `status: stub` from each page you completed**

Only after the page has all four elements.

- [ ] **Step 4: Verify the index updates**

Run: `pnpm --filter web build && curl -s localhost:3000/docs/components | grep -c stub`
Expected: the count drops by the number of pages completed.

- [ ] **Step 5: Commit**

```bash
git add apps/web/content/docs/components
git commit -m "docs: complete the nine form component pages"
```

---

## Task 13: Overlay and navigation pages

**Files:**
- Modify: `apps/web/content/docs/components/{dialog,alert-dialog,popover,tooltip,dropdown-menu,tabs,accordion,toast,card}.mdx`

- [ ] **Step 1: Write each page**

Same four elements. Dropdown carries all eleven configurations from the matrix; Tabs shows all four variants; Card shows all six layouts; Dialog shows sizes and custom triggers.

- [ ] **Step 2: Remove `status: stub`**

- [ ] **Step 3: Commit**

```bash
git add apps/web/content/docs/components
git commit -m "docs: complete the nine overlay and navigation pages"
```

---

## Task 14: Display primitive pages

**Files:**
- Modify: `apps/web/content/docs/components/{alert,avatar,progress,separator,skeleton,spinner,aspect-ratio,badge,button}.mdx`

- [ ] **Step 1: Write each page**

Aspect Ratio gets video embed, image and map examples — it has no props to vary, and that is stated on the page rather than left looking thin.

- [ ] **Step 2: Remove `status: stub`**

- [ ] **Step 3: Verify no stubs remain**

```bash
grep -rl "status: stub" apps/web/content/docs/components
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/web/content/docs/components
git commit -m "docs: complete the nine display primitive pages"
```

---

## Task 15: Customization sections

**Files:**
- Modify: all 27 pages

- [ ] **Step 1: Add a Customization section to each page**

Two routes shown on every page: overriding through `className`, and retuning through the token layer. The token route is the one that survives a component update, and the pages should say so.

- [ ] **Step 2: Run the copy gate**

Run: `pnpm check-copy`
Expected: PASS across four roots. It scans `apps/web/content`, so prose is covered, including the `heroui` term.

- [ ] **Step 3: Commit**

```bash
git add apps/web/content/docs/components
git commit -m "docs: customization sections on every component page"
```

---

## Task 16: Roadmap, then whole-branch verification

**Files:**
- Modify: `docs/MASTER-PLAN.md`

- [ ] **Step 1: Update the roadmap**

Mark **H2** complete in §4. Move to the resolved list with the date: the eighteen stubs, the missing preview switchers, and D's undelivered charter items other than `llms.txt` and the agent tiers — those stay open and belong to G.

Update §5's catalogue where a component gained capabilities.

- [ ] **Step 2: Run every gate**

```bash
pnpm lint && pnpm check-types && pnpm build && pnpm test && pnpm check-copy
```

- [ ] **Step 3: Prove the Source view is live, not copied**

Change a string in `packages/registry/src/ui/button.tsx`, rebuild, and confirm the rendered page shows the change. Then revert. A copy would not update.

- [ ] **Step 4: The visual pass**

`preview_start`, then a **freshly created browser tab**. Every new page in both themes and at 375px. D's visual pass found four defects every structural check had passed — invisible keyboard focus, a zero-width tab stop, a footer that did not stack, and an invisible focus ring.

Check the keyboard path through submenus and multi-select with the browser, not only in tests.

- [ ] **Step 5: Report motion honestly**

The motion-preset switcher cannot be verified under normal motion in this environment — every available pane forces `prefers-reduced-motion: reduce`. **Report it open rather than inferring it.** It is the one feature whose entire purpose is to be felt.

- [ ] **Step 6: Commit**

```bash
git add docs/MASTER-PLAN.md
git commit -m "docs: record H2 complete and close the eighteen stub pages"
```
