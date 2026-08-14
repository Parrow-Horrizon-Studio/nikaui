# Documentation Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the documentation into `apps/web` so one application serves both the landing page and the docs, give the five undocumented components real pages, and delete `apps/docs`.

**Architecture:** Fumadocs is wired into `apps/web` alongside the existing landing page. `apps/docs` keeps serving on port 3000 throughout, so every migrated route can be compared against a live reference; it is deleted last, in its own commit. C's `<Nav />` and `<Footer />` substitute for the old docs header — which `apps/docs` had already disabled Fumadocs' own nav in favour of — while `DocsLayout` keeps the sidebar and table of contents.

**Tech Stack:** Next 16.3.0, React 19, Tailwind CSS v4, Fumadocs 16.14.3 (`fumadocs-core`, `fumadocs-mdx`, `fumadocs-ui`), Motion, `next-themes`, Vitest, pnpm 9, Node 22.

**Spec:** [`docs/superpowers/specs/2026-08-12-nikaui-docs-migration.md`](../specs/2026-08-12-nikaui-docs-migration.md)

## Global Constraints

- **Every CSS variable Nika defines is prefixed `--nika-`.** `apps/web` may override existing ones for theming but must not invent parallel tokens.
- **Tailwind utilities are NOT prefixed.** `bg-primary`, not `bg-nika-primary`.
- **Light/dark switches on the `.dark` class. Accent switches on `[data-accent]`.** Accents: `sun` (default, needs no attribute), `violet`, `emerald`, `azure`, `rose`.
- **The theme default is `system`.** Spec C7 ruled explicitly that D must not carry `apps/docs`'s `dark` across.
- **The advertised command is `npx nikaui`, never `npx nika`.**
- **No reference-library attribution.** Nothing in code, comments, copy, file names or metadata may attribute anything to another component library.
- **No fabricated counts.** 27 components, 5 motion presets, 5 accents. Zero blocks, zero templates, no Figma kit.
- **The five motion presets are `none`, `snap`, `glide`, `spring`, `bounce`.** There is no preset named `pop`. `spring` is the default.
- **Only links that resolve.** GitHub is `https://github.com/Parrow-Horrizon-Studio/nikaui`. **After Task 9 there is no `/docs/*` carve-out** — every link resolves or it is a defect.
- **`pnpm lint`, `pnpm check-types`, `pnpm build`, `pnpm test` and `pnpm check-copy` must all pass before any commit.** Lint runs with `--max-warnings 0`.
- **`next dev` auto-generates `apps/web/AGENTS.md` and `apps/web/CLAUDE.md`.** Delete before staging; never commit them.

## Two facts already verified — do not re-derive them

**1. `RootProvider` can have its theming disabled.** This was D3's open question and it is settled. `fumadocs-ui@16.14.3` declares in `dist/provider/base.d.ts`:

```ts
interface ThemeOptions extends ThemeProviderProps {
  /** Enable `next-themes`  @defaultValue true */
  enabled?: boolean;
  /** Hotkey for toggling between light/dark mode … @defaultValue `d` */
  hotKey?: string | ((e: KeyboardEvent) => boolean) | false;
}
```

So `<RootProvider theme={{ enabled: false }}>` is first-class API. Note the side effect: disabling theming also removes Fumadocs' `d` hotkey, leaving C's toggle as the only theme control. That is intended.

**2. `apps/web/.gitignore` already ignores `/.source/`.** It was copied byte-for-byte from `apps/docs/.gitignore` during sub-project C. No edit needed.

## The parallel run

`apps/docs` must keep working until Task 9. That means **content is copied, not moved**, and `apps/docs` keeps its own copy until it is deleted wholesale. Two copies exist between Tasks 1 and 9; that is deliberate.

The reason is specific. `apps/docs/src/app/globals.css:7-16` records a bug this repository already shipped: assigning the bare `--fd-*` name instead of `--color-fd-*` "compiles and passes every automated check here, but every Fumadocs colour utility keeps rendering with Fumadocs' own default palette." A live reference on port 3000 is the cheapest detector for that class of silent failure — same page, two ports, compare.

---

### Task 1: Wire Fumadocs into `apps/web`

`apps/web` gains the Fumadocs toolchain and the content, but no routes yet. The deliverable is that the source loader resolves all 27 pages, proven by a test.

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/source.config.ts`
- Modify: `apps/web/next.config.mjs`
- Modify: `apps/web/tsconfig.json`
- Create: `apps/web/content/docs/**` (copied from `apps/docs/content/docs/`, 30 files)
- Create: `apps/web/src/lib/source.ts`
- Test: `apps/web/src/lib/source.test.ts`

**Interfaces:**
- Produces: `source` from `@/lib/source` — a Fumadocs loader with `baseUrl: "/docs"`. Later tasks call `source.getPage(slug)`, `source.getPageTree()`, `source.generateParams()`.

- [ ] **Step 1: Add the Fumadocs dependencies**

In `apps/web/package.json`, add to `dependencies` (keeping alphabetical order):

```json
"@types/mdx": "^2.0.14",
"fumadocs-core": "^16.14.3",
"fumadocs-mdx": "^14.3.2",
"fumadocs-ui": "^16.14.3",
```

These are the exact versions `apps/docs` uses. Do not upgrade them as part of a migration — a version bump and a move failing together is two problems wearing one diff.

- [ ] **Step 2: Create `apps/web/source.config.ts`**

Verbatim from `apps/docs/source.config.ts`:

```ts
import { defineDocs, defineConfig } from "fumadocs-mdx/config";

export const docs = defineDocs({
  dir: "content/docs",
});

export default defineConfig();
```

- [ ] **Step 3: Wrap `next.config.mjs` with `createMDX()`**

Replace `apps/web/next.config.mjs`:

```js
import { createMDX } from "fumadocs-mdx/next";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
};

const withMDX = createMDX();

export default withMDX(config);
```

- [ ] **Step 4: Add the `collections/*` path mapping to `tsconfig.json`**

`fumadocs-mdx` generates `.source/` at build time and `source.ts` imports it as `collections/server`. In `apps/web/tsconfig.json`, add to `compilerOptions.paths`:

```json
"collections/*": ["./.source/*"]
```

and add `".source/**/*.ts"` to the `include` array. Both are required — the alias alone does not put the generated files in the program.

- [ ] **Step 5: Copy the content**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && cp -r apps/docs/content apps/web/content && find apps/web/content -type f | wc -l
```

Expected: `30` (27 `.mdx` + 3 `meta.json`).

**Copy, do not move.** `apps/docs` must keep serving until Task 9.

- [ ] **Step 6: Create `apps/web/src/lib/source.ts`**

Verbatim from `apps/docs/src/lib/source.ts`:

```ts
import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});
```

- [ ] **Step 7: Install and generate**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm install && pnpm --filter @nikaui/web build
```

The build runs `fumadocs-mdx`'s generation step, creating `apps/web/.source/`. Confirm that directory now exists and is untracked (`.gitignore` already covers it).

- [ ] **Step 8: Write the failing test**

`apps/web/src/lib/source.test.ts`. This asserts the loader actually resolves content — the failure mode being guarded is a `dir` that points at nothing, which yields an empty tree and a green build.

```ts
import { describe, expect, it } from "vitest";
import { source } from "./source";

describe("the documentation source", () => {
  it("resolves every MDX page in content/docs", () => {
    // 27 MDX files: 22 existing component pages, components/index,
    // and the four guide pages (index, installation, theming, animation).
    expect(source.getPages().length).toBe(27);
  });

  it("resolves the guide and component sections", () => {
    const urls = source.getPages().map((p) => p.url);
    expect(urls).toContain("/docs/guide");
    expect(urls).toContain("/docs/components");
    expect(urls).toContain("/docs/guide/animation");
    expect(urls).toContain("/docs/components/button");
  });
});
```

- [ ] **Step 9: Run it and watch it fail for the right reason**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web test
```

Before Step 5's copy this would fail with a count of 0. Since the copy is already done, it should pass — so **prove the test constrains something**: temporarily rename `apps/web/content/docs/guide` to `guide-x`, re-run generation and the test, confirm both the count and the URL assertions fail, then rename back and regenerate. Report both runs.

- [ ] **Step 10: Run the full gate and commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build && pnpm test && pnpm check-copy
```

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): wire Fumadocs into the marketing app"
```

---

### Task 2: The documentation routes, inside C's chrome

The routes render, wrapped in C's navigation and footer, with the provider conflict resolved. This is the task where the migration is either right or silently wrong, so it ends with a comparison against the live reference.

**Files:**
- Create: `apps/web/src/lib/tree-utils.ts`, `apps/web/src/lib/docs-page.tsx`, `apps/web/src/lib/layout.shared.tsx`
- Create: `apps/web/src/components/docs/mdx.tsx`, `component-cards.tsx`, `component-previews.tsx`
- Create: `apps/web/src/app/docs/layout.tsx`, `page.tsx`, `guide/layout.tsx`, `guide/[[...slug]]/page.tsx`, `components/layout.tsx`, `components/[[...slug]]/page.tsx`
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/app/globals.css`

**Interfaces:**
- Consumes: `source` from `@/lib/source` (Task 1).
- Produces: routes at `/docs`, `/docs/guide/*`, `/docs/components/*`; `getSubTree(tree, folderName)`; `createDocsPage(sectionPrefix)` returning `{ Page, generateStaticParams, generateMetadata }`; `getMDXComponents(components?)`.

- [ ] **Step 1: Copy the four lib and component modules**

Copy verbatim from `apps/docs`, changing only import paths:

- `src/lib/tree-utils.ts` → unchanged
- `src/lib/layout.shared.tsx` → unchanged
- `src/lib/docs-page.tsx` → **change `import { getMDXComponents } from "@/components/mdx"` to `"@/components/docs/mdx"`**
- `src/components/mdx.tsx` → `src/components/docs/mdx.tsx`, **change `import { ComponentCards } from "./component-cards"` — the relative path still resolves, no edit needed**
- `src/components/component-cards.tsx` → `src/components/docs/component-cards.tsx`
- `src/components/component-previews.tsx` → `src/components/docs/component-previews.tsx`

`apps/web` uses the same `@/*` → `./src/*` alias as `apps/docs`, so every other import resolves unchanged.

- [ ] **Step 2: Copy the five route files**

From `apps/docs/src/app/docs/` to `apps/web/src/app/docs/`: `layout.tsx`, `page.tsx`, `guide/layout.tsx`, `guide/[[...slug]]/page.tsx`, `components/layout.tsx`, `components/[[...slug]]/page.tsx`.

Do **not** copy `apps/docs/src/app/(home)/` or `apps/docs/src/app/layout.tsx` — both are superseded by C and are deleted in Task 9, not migrated.

- [ ] **Step 3: Add the Fumadocs colour bridge to `globals.css`**

Insert into `apps/web/src/app/globals.css`, after the `@import` lines and before the existing `body` rule. Also add the two Fumadocs stylesheet imports at the top of the import block, immediately after `@import "tailwindcss";`:

```css
@import "fumadocs-ui/css/neutral.css";
@import "fumadocs-ui/css/preset.css";
```

Then the bridge, **including its comment verbatim** — it documents a bug this repository already shipped and must survive the move:

```css
/* Fumadocs chrome inherits the Nika accent. One way only: --color-fd-* is
   assigned from --nika-*, never the reverse, and never in the registry.

   Fumadocs registers its Tailwind colour tokens as --color-fd-* (see
   fumadocs-ui/css/lib/default-colors.css) — utilities like `bg-fd-primary`
   and Fumadocs' own component CSS read that name, not the bare `--fd-*`
   custom properties (which Fumadocs reserves for layout dimensions such
   as --fd-sidebar-width and --fd-header-height). Assigning the bare name
   compiles and passes every automated check here, but every Fumadocs
   colour utility keeps rendering with Fumadocs' own default palette. */
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
```

- [ ] **Step 4: Mount `RootProvider` without its theming**

Modify `apps/web/src/app/layout.tsx`. Add the import:

```tsx
import { RootProvider } from "fumadocs-ui/provider/next";
```

and wrap the existing tree, keeping C's providers outermost so they own theming:

```tsx
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AccentProvider>
            {/* Fumadocs' RootProvider wraps next-themes internally. C already
                mounts next-themes via ThemeProvider, and two providers
                contending for one `.dark` class is a real conflict — so this
                one runs with theming off and supplies only the search-dialog
                and sidebar context the docs layout needs. `enabled` is
                first-class API: see ThemeOptions in
                fumadocs-ui/dist/provider/base.d.ts.

                Side effect: Fumadocs' `d` hotkey for toggling the theme goes
                away with it. C's toggle is the only theme control. */}
            <RootProvider theme={{ enabled: false }}>
              <Nav />
              {children}
              <Footer />
            </RootProvider>
          </AccentProvider>
        </ThemeProvider>
      </body>
```

- [ ] **Step 5: Run both applications and compare**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/docs dev
```

and in a second shell:

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web dev
```

Compare `http://localhost:3000/docs/components/button` against `http://localhost:3001/docs/components/button`, and the same for `/docs/guide/theming` and `/docs`.

**Check the computed colour, not just that the page renders.** Read `getComputedStyle` for a Fumadocs-styled element — the sidebar background, or an element with `bg-fd-primary` — on both ports and confirm they match. This is the exact check that catches the `--fd-*` versus `--color-fd-*` bug the bridge comment describes: the page looks fine either way, but the palette is Fumadocs' own rather than Nika's.

Report the computed values from both ports.

- [ ] **Step 6: Confirm exactly one theme provider is mounted**

In the browser console on port 3001, toggle the theme with C's control and confirm `document.documentElement.className` flips cleanly between `light` and `dark` with no flicker or double-write, and that `localStorage.theme` holds one value. Then reload and confirm the theme persists. Report what you saw.

- [ ] **Step 7: Run the full gate and commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build && pnpm test && pnpm check-copy
```

```bash
git add apps/web
git commit -m "feat(web): serve the documentation routes inside the site chrome"
```

---

### Task 3: Chrome adjustments the documentation needs

C's navigation and footer were built for one page. Wrapping documentation routes exposes three things its final review had already recorded for D.

**Files:**
- Modify: `apps/web/src/components/site/nav-links.ts`
- Modify: `apps/web/src/components/site/nav.tsx`
- Modify: `apps/web/src/components/site/footer.tsx`
- Test: `apps/web/src/components/site/nav.test.tsx`, `footer.test.tsx`

**Interfaces:**
- Consumes: `NAV_LINKS`, `FOOTER_COLUMNS`, `GITHUB_URL` from `@/components/site/nav-links`.

- [ ] **Step 1: Write the failing test for the waitlist link**

Append to `apps/web/src/components/site/nav.test.tsx`:

```tsx
it("points the waitlist call to action at the landing page, not a bare fragment", () => {
  render(<Nav />);
  const cta = screen.getByRole("link", { name: "Join the waitlist" });
  // `#waitlist` alone resolves only on the landing page; on /docs/* it goes
  // nowhere. The form lives in <Pricing> which only the landing page mounts.
  expect(cta.getAttribute("href")).toBe("/#waitlist");
});
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web test nav
```

Expected: FAIL — the current value is `#pricing`.

- [ ] **Step 3: Fix the link**

In `apps/web/src/components/site/nav.tsx`, change the waitlist call to action's `href` to `/#waitlist`.

- [ ] **Step 4: Add the documentation footer column**

In `apps/web/src/components/site/nav-links.ts`, `FOOTER_COLUMNS` currently has two entries. The footer's grid hard-codes that count at `footer.tsx:41`:

```
lg:grid-cols-[minmax(0,1fr)_repeat(2,minmax(0,auto))]
```

Change `repeat(2,…)` to `repeat(var(--footer-columns),…)`? No — CSS `repeat()` in a Tailwind arbitrary value cannot read a custom property reliably here. Instead make the grid count-agnostic:

```
lg:grid-cols-[minmax(0,1fr)_auto]
```

on the wrapper, with the column group as a nested `flex flex-wrap gap-10`. That removes the hard-coded `2` entirely rather than replacing it with a hard-coded `3`, which is the point — D adds a third column and a later sub-project may add a fourth.

- [ ] **Step 5: Write the failing test for column-count independence**

Append to `apps/web/src/components/site/footer.test.tsx`:

```tsx
it("renders every column in FOOTER_COLUMNS, whatever the count", () => {
  render(<Footer />);
  for (const column of FOOTER_COLUMNS) {
    expect(screen.getByRole("heading", { name: column.heading })).toBeDefined();
    for (const link of column.links) {
      expect(screen.getByRole("link", { name: link.label })).toBeDefined();
    }
  }
  // Guards the layout against the data: a hard-coded grid template that
  // assumes N columns silently drops or misplaces the N+1th.
  expect(FOOTER_COLUMNS.length).toBeGreaterThanOrEqual(3);
});
```

- [ ] **Step 6: Run, implement, re-run**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web test footer
```

Expected: FAIL on the length assertion. Then add the third `FOOTER_COLUMNS` entry:

```ts
{
  heading: "Documentation",
  links: [
    { label: "Guide", href: "/docs/guide" },
    { label: "Components", href: "/docs/components" },
    { label: "Installation", href: "/docs/guide/installation" },
    { label: "Theming", href: "/docs/guide/theming" },
    { label: "Animation", href: "/docs/guide/animation" },
  ],
},
```

Re-run: PASS.

- [ ] **Step 7: Verify the footer at three widths**

With the dev server running, confirm the footer's three columns lay out correctly at 375px, 768px and 1440px, and that nothing overflows horizontally. Report what you saw at each width.

- [ ] **Step 8: Run the full gate and commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build && pnpm test && pnpm check-copy
```

```bash
git add apps/web
git commit -m "feat(web): chrome adjustments for the documentation routes"
```

---

### Task 4: Search, favicon and documentation metadata

**Files:**
- Create: `apps/web/src/app/api/search/route.ts`
- Create: `apps/web/src/app/favicon.ico` (copied from `apps/docs/src/app/favicon.ico`)
- Test: `apps/web/src/app/api/search/route.test.ts`

**Interfaces:**
- Consumes: `source` from `@/lib/source`.
- Produces: `GET /api/search`.

- [ ] **Step 1: Copy the search route**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && cp apps/docs/src/app/api/search/route.ts apps/web/src/app/api/search/route.ts && cat apps/web/src/app/api/search/route.ts
```

Read what you copied. If it imports `@/lib/source`, that already resolves in `apps/web`; no edit needed.

- [ ] **Step 2: Copy the favicon**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && cp apps/docs/src/app/favicon.ico apps/web/src/app/favicon.ico
```

`apps/web` currently has none, so the site has been serving Next's default.

- [ ] **Step 3: Write the failing test**

`apps/web/src/app/api/search/route.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("the documentation search endpoint", () => {
  it("returns results for a term that appears in the guides", async () => {
    const response = await GET(
      new Request("http://localhost/api/search?query=theming")
    );
    expect(response.status).toBe(200);
    const results = (await response.json()) as unknown[];
    // A search that resolves no documents is indistinguishable from a
    // search index that was never built — assert it found something.
    expect(results.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4: Run it**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web test search
```

If the export is not named `GET`, or the handler signature differs, adjust the test to match what `route.ts` actually exports — read it rather than assuming. If it passes first time, prove it constrains something: temporarily change the query to a nonsense string, confirm zero results and a failing assertion, then restore. Report both runs.

- [ ] **Step 5: Verify search in the browser**

On port 3001, open the search dialog from the docs sidebar, type `theming`, and confirm results appear and clicking one navigates. Report what you saw. Note the `d` theme hotkey is gone by design (Task 2 Step 4) — do not report that as a defect.

- [ ] **Step 6: Run the full gate and commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build && pnpm test && pnpm check-copy
```

```bash
git add apps/web
git commit -m "feat(web): documentation search and favicon"
```

---

### Task 5: Five component pages with live previews

`alert`, `progress`, `radio-group`, `slider` and `textarea` have no documentation. They are the five components sub-project B added. This task closes the gap the landing page's "27 components" claim depends on.

**Files:**
- Modify: `apps/web/src/components/docs/component-previews.tsx`
- Create: `apps/web/content/docs/components/alert.mdx`, `progress.mdx`, `radio-group.mdx`, `slider.mdx`, `textarea.mdx`
- Modify: `apps/web/content/docs/components/meta.json`
- Test: `apps/web/src/components/docs/component-previews.test.tsx`

**Interfaces:**
- Consumes: `previews` export from `component-previews.tsx`; the registry components under `@nikaui/registry/ui/*`.
- Produces: five preview entries keyed `alert`, `progress`, `radio-group`, `slider`, `textarea`.

- [ ] **Step 1: Read each component's real source before writing anything about it**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && for c in alert progress radio-group slider textarea; do echo "=== $c ==="; cat "packages/registry/src/ui/$c.tsx"; done
```

**Every prop in the API tables below must come from this source, not from the component's name.** A prop that does not exist is silently ignored by React, so a guessed table produces documentation that looks authoritative and is fiction. Sub-project C had an implementer verify `Switch`'s props against both `switch.tsx` and Headless UI's own type definitions — that is the standard here.

Also note which of the five read `useMotionPreset` or `useConfiguredMotion`, because only those get an Animation section.

- [ ] **Step 2: Read the existing preview file to match its shape**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && sed -n '1,60p' apps/web/src/components/docs/component-previews.tsx && grep -n "previews" apps/web/src/components/docs/component-previews.tsx
```

Follow the established export shape exactly — the `previews` record is consumed by `component-cards.tsx`.

- [ ] **Step 3: Add the five previews**

Each must exercise the component's actual behaviour, not just render it. Concretely: the slider must be draggable and reflect its value, the radio group must change selection, the textarea must accept input, the progress bar must show a real value, and the alert must show its variants. A preview that renders a static default demonstrates nothing a screenshot wouldn't.

Use `useState` where the component is interactive, following the pattern the existing previews use for `Switch` and `Dialog`.

- [ ] **Step 4: Write the failing test**

`apps/web/src/components/docs/component-previews.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { previews } from "./component-previews";

describe("the five component previews added in sub-project D", () => {
  for (const slug of ["alert", "progress", "radio-group", "slider", "textarea"]) {
    it(`has a preview for ${slug}`, () => {
      expect(previews[slug]).toBeDefined();
    });
  }

  it("renders an interactive radio group that changes selection", () => {
    const Preview = previews["radio-group"];
    render(<Preview />);
    const options = screen.getAllByRole("radio");
    expect(options.length).toBeGreaterThan(1);
    expect(options[0].getAttribute("aria-checked")).toBe("true");
    fireEvent.click(options[1]);
    expect(options[1].getAttribute("aria-checked")).toBe("true");
  });

  it("renders a textarea that accepts input", () => {
    const Preview = previews["textarea"];
    render(<Preview />);
    const field = screen.getByRole("textbox");
    fireEvent.change(field, { target: { value: "hello" } });
    expect((field as HTMLTextAreaElement).value).toBe("hello");
  });
});
```

If a component's rendered ARIA role differs from the above, correct the test to match what the component actually renders — read the source, do not force the component to match the test.

- [ ] **Step 5: Run it and confirm it fails, then passes**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web test component-previews
```

Expected before Step 3: FAIL, `previews["alert"]` undefined. After: PASS.

- [ ] **Step 6: Write the five MDX pages**

Follow `apps/web/content/docs/components/button.mdx` as the template — it is the best existing page. Each page has frontmatter, `## Installation` with `npx nikaui add <name>`, `## Usage` with a runnable example, variants and sizes **where the component has them**, `## Animation` **only where the component animates**, and `## API Reference` with a table whose every row you verified in Step 1.

Frontmatter for all five (the `status` field is introduced in Task 6 and these five must not carry it — they are complete):

```yaml
---
title: Slider
description: A draggable input for selecting a value from a range.
category: interactive
---
```

`category` is `foundation` or `interactive`, matching the classification `component-cards.tsx` already uses. Task 6 makes that array read this field instead of hard-coding it.

- [ ] **Step 7: Add the five entries to `meta.json`**

`apps/web/content/docs/components/meta.json` controls sidebar order. Read it, then add the five slugs in the position that matches the existing grouping.

- [ ] **Step 8: Verify each page renders**

Visit all five on port 3001. Confirm the preview is interactive — actually drag the slider, type in the textarea, change the radio selection. Report what you did and what happened for each.

- [ ] **Step 9: Run the full gate and commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build && pnpm test && pnpm check-copy
```

```bash
git add apps/web
git commit -m "docs: pages and live previews for the five undocumented components"
```

---

### Task 6: Mark the stubs; derive the index

Eighteen of the twenty-two pre-existing component pages end in "Documentation coming soon" or equivalent. They stay stubs, but they stop pretending otherwise — and the component index stops being a hand-maintained third copy of the component list.

**Files:**
- Modify: 18 files under `apps/web/content/docs/components/`
- Create: `apps/web/src/components/docs/stub-notice.tsx`
- Modify: `apps/web/src/components/docs/mdx.tsx`
- Modify: `apps/web/src/components/docs/component-cards.tsx`
- Modify: `apps/web/src/lib/docs-page.tsx`
- Test: `apps/web/src/components/docs/component-cards.test.tsx`

**Interfaces:**
- Consumes: `source` (Task 1), the `category` frontmatter field (Task 5).
- Produces: a `status: stub` frontmatter convention; `<StubNotice />`; a `component-cards.tsx` that derives its list from the page tree.

- [ ] **Step 1: Identify the 18 exactly**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && grep -rlE "coming soon|still to come" apps/web/content/docs/components/ | sort
```

Expected: 18 files. Record the list in your report — completion criterion 4 and Task 9's visual pass both reference this count.

- [ ] **Step 2: Add `status: stub` and `category` frontmatter to each**

For each of the 18, add to the frontmatter:

```yaml
status: stub
category: foundation
```

with `category` set to `foundation` or `interactive` to match that component's existing entry in `component-cards.tsx`'s array — read the array, do not guess. The four complete pages (`button`, `card`, `badge`, and whichever of the 22 the grep did not match) get `category` but **not** `status`.

Then **remove the trailing "Documentation coming soon." prose line** from each of the 18. The frontmatter flag replaces it — keeping both means two sources for one fact, and they will drift.

- [ ] **Step 3: Create the stub notice**

`apps/web/src/components/docs/stub-notice.tsx`:

```tsx
/**
 * Rendered at the top of any documentation page whose frontmatter carries
 * `status: stub`. One source of truth: the same field drives the marker in
 * the component index, so a page cannot look complete in one place and
 * incomplete in the other.
 */
export function StubNotice() {
  return (
    <div
      role="note"
      className="mb-6 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-content-muted"
    >
      <strong className="font-medium text-content">
        This page is a stub.
      </strong>{" "}
      The component works and is installable; its reference documentation is
      not written yet. The{" "}
      <a href="/docs/guide" className="text-primary underline">
        guide
      </a>{" "}
      covers installation, theming and animation for every component.
    </div>
  );
}
```

- [ ] **Step 4: Render it from the page**

In `apps/web/src/lib/docs-page.tsx`, inside `DocsBody`, before `<MDX …>`:

```tsx
        <DocsBody>
          {data.status === "stub" ? <StubNotice /> : null}
          <MDX
```

with `import { StubNotice } from "@/components/docs/stub-notice";` at the top. `data` is already typed `any` in that file, so no type change is needed — but add `status` to the frontmatter schema if `source.config.ts` declares one. Read it first; the current config uses `defineDocs` with no explicit schema, so arbitrary frontmatter passes through.

- [ ] **Step 5: Write the failing test for the derived index**

`apps/web/src/components/docs/component-cards.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { source } from "@/lib/source";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../../..");

function registryComponentSlugs(): string[] {
  const manifest = JSON.parse(
    readFileSync(path.join(REPO_ROOT, "packages/cli/src/registry.json"), "utf8")
  ) as { components: Record<string, { type: string }> };
  return Object.entries(manifest.components)
    .filter(([, c]) => c.type === "ui")
    .map(([slug]) => slug)
    .sort();
}

function documentedSlugs(): string[] {
  return source
    .getPages()
    .map((p) => p.url)
    .filter((u) => u.startsWith("/docs/components/"))
    .map((u) => u.replace("/docs/components/", ""))
    .filter((s) => s.length > 0)
    .sort();
}

describe("the component index", () => {
  it("documents every component the registry ships", () => {
    // The index used to be a hand-maintained array. It drifted: five
    // components shipped undocumented and unlisted, and nothing noticed.
    expect(documentedSlugs()).toEqual(registryComponentSlugs());
  });
});
```

- [ ] **Step 6: Run it**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web test component-cards
```

Expected: PASS, because Task 5 added the five missing pages. **Prove it constrains something**: temporarily rename `apps/web/content/docs/components/slider.mdx` to `slider.mdx.bak`, regenerate, re-run, confirm it fails naming `slider`, then restore. Report both runs.

- [ ] **Step 7: Derive `component-cards.tsx` from the page tree**

Replace the hard-coded 22-entry array with a list built from `source.getPageTree()` (or `source.getPages()` filtered to `/docs/components/`), reading `category` and `status` from each page's frontmatter. Stub pages get a visible marker in the card. Keep the existing `previews` lookup keyed by slug.

If deriving forces `component-cards.tsx` from a Client Component to a Server Component or vice versa, follow whichever boundary the data access requires and say so in your report — `source` is server-side.

- [ ] **Step 8: Verify the index by eye**

On port 3001, open `/docs/components`. Confirm all 27 components appear, the five new ones among them, and that stub cards are visibly marked while `button`, `card` and `badge` are not. Report the count you saw.

- [ ] **Step 9: Run the full gate and commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build && pnpm test && pnpm check-copy
```

```bash
git add apps/web
git commit -m "docs: mark the stub pages and derive the component index"
```

---

### Task 7: Extend the honesty gate to documentation content

**Files:**
- Modify: `scripts/check-copy.mjs`
- Modify: `apps/web/src/lib/claims.test.ts`

**Interfaces:**
- Consumes: the `ROOTS` array in `check-copy.mjs`; `registryComponentCount()` in `claims.test.ts`.

- [ ] **Step 1: Read the current gate**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && cat scripts/check-copy.mjs
```

Two lines matter, and both are already located:

- `check-copy.mjs:25` — `const ROOTS = ["apps/web/src", "packages/registry/src", "packages/cli/src"]`
- `check-copy.mjs:73` — `else if (/\.(ts|tsx|css|mjs)$/.test(entry)) yield full;`

Line 72 above it already skips `*.test.ts(x)`, which exists because a test asserting the *absence* of a forbidden string necessarily contains it. MDX has no equivalent hazard, so it needs no exclusion.

- [ ] **Step 2: Add the content root and the `.mdx` extension**

Add `"apps/web/content"` to the `ROOTS` array at line 25, and `mdx` to the alternation at line 73 so it reads `/\.(ts|tsx|css|mjs|mdx)$/`.

**Do not exclude any file to make the gate pass.** If a pattern trips on legitimate documentation prose, narrow the pattern instead. C's `check-copy` shipped scanning a tree that did not contain the file its `pop` pattern was written for, and nobody noticed until the final whole-branch review — excluding a file is how a gate quietly stops covering the thing it was added for.

- [ ] **Step 3: Run it and deal with what it finds**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && node scripts/check-copy.mjs; echo "exit $?"
```

Report every hit and how you resolved it. A hit in documentation prose is a decision, not a nuisance: either the prose is wrong and you fix it, or the pattern is too broad and you narrow it with a comment saying why.

- [ ] **Step 4: Prove it covers the new root**

Add `const x = "npx nika add button";` to `apps/web/content/docs/guide/index.mdx`, run the script, confirm it exits non-zero and names that file, then remove the line and confirm it passes. **Report both runs.**

- [ ] **Step 5: Bind the guide's component count**

`apps/web/content/docs/guide/index.mdx:19` reads `- **27 Components** — From buttons to dialogs, tabs to toasts.` That is a second hand-written copy of a number `claims.test.ts` already binds for the hero.

Append to `apps/web/src/lib/claims.test.ts`:

```ts
function guideIndexSource(): string {
  return readFileSync(
    path.join(REPO_ROOT, "apps/web/content/docs/guide/index.mdx"),
    "utf8"
  );
}

it("states the same component count in the guide as the registry ships", () => {
  const count = registryComponentCount();
  expect(guideIndexSource()).toContain(`**${count} Components**`);
});
```

Note this asserts the **claim string**, not a bare digit — the hero's binding was originally a bare `toContain(String(count))` and it matched a Tailwind padding class, which the C review caught.

- [ ] **Step 6: Run it and prove it fails**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web test claims
```

Change the guide's line to `**28 Components**`, confirm the test fails, restore it, confirm it passes. **Report both runs.**

- [ ] **Step 7: Run the full gate and commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build && pnpm test && pnpm check-copy
```

```bash
git add apps/web scripts
git commit -m "test: extend the honesty gate to documentation content"
```

---

### Task 8: Delete `apps/docs`, take port 3000

The parallel run ends. This is deliberately the last substantive commit and deliberately revertable in one step.

**Files:**
- Delete: `apps/docs/` entirely
- Modify: `apps/web/package.json`
- Modify: `.claude/launch.json`
- Modify: `docs/MASTER-PLAN.md`

- [ ] **Step 1: Confirm the replacement is complete before deleting anything**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && for p in /docs /docs/guide /docs/guide/installation /docs/guide/theming /docs/guide/animation /docs/components /docs/components/button /docs/components/slider; do printf "%-38s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3001$p"; done
```

Every one must be `200`. Do not proceed on any other status.

- [ ] **Step 2: Delete the application**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git rm -r --quiet apps/docs && rm -rf apps/docs && ls apps/
```

Expected: `web/` only.

- [ ] **Step 3: Move `apps/web` to port 3000**

In `apps/web/package.json`, change `dev` to `next dev --port 3000` and `start` to `next start --port 3000`.

In `.claude/launch.json` at the repository root, remove the `docs` configuration and change `web`'s port to `3000`. There is a second `.claude/launch.json` one directory up, outside this repository — leave it alone.

- [ ] **Step 4: Update the master plan**

In `docs/MASTER-PLAN.md`, mark sub-project D executed and record that `apps/docs` no longer exists. Follow the format the B and C entries use.

- [ ] **Step 5: Full gate, from a clean install**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm install && pnpm lint && pnpm check-types && pnpm build && pnpm test && pnpm check-copy
```

`pnpm install` matters here: deleting a workspace package changes the lockfile, and a stale `node_modules` can hide a missing dependency that CI will find.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: delete apps/docs — the documentation now lives in apps/web"
```

---

### Task 9: Final verification

Everything scriptable, then the visual pass C never got.

- [ ] **Step 1: The link audit, with no carve-out**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && grep -rhoE 'href[:=]\s*["`][^"`]+["`]' apps/web/src apps/web/content | grep -oE '[^"`]+$' | sort -u
```

C's audit carried an explicit exception: `/docs/*` paths were the only permitted dangling links, because D had not filled them yet. **That exception is now closed.** Every result must be an in-page anchor whose `id` exists, an absolute `https://github.com/Parrow-Horrizon-Studio/…` URL, or a path that returns 200. Curl each path. List what you found and how each was classified.

- [ ] **Step 2: The complete gate, uncached**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm check-copy && pnpm turbo run lint check-types build test --continue --force
```

Expected: PASS, then every task successful and uncached.

- [ ] **Step 3: Confirm the component count three ways**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && echo "registry files: $(ls packages/registry/src/ui/*.tsx | grep -v test | wc -l)" && echo "manifest ui entries: $(node -e "const m=require('./packages/cli/src/registry.json');console.log(Object.values(m.components).filter(c=>c.type==='ui').length)")" && echo "doc pages: $(ls apps/web/content/docs/components/*.mdx | grep -v index | wc -l)"
```

All three must read 27.

- [ ] **Step 4: Verify by eye — the pass sub-project C never got**

C shipped without visual confirmation because no frame ever composited; its spec §5.2 and the normal-motion half of §5.7 are still unmet. **This step closes them, or reports them unmet. It does not describe structural checks as a visual pass.**

Run the dev server and walk the site:

1. Both themes on the landing page **and** on `/docs/components/button` — the docs are new surface for the theme.
2. All five accents, confirming the Fumadocs chrome retunes with them: the sidebar, the active-page highlight, links.
3. Keyboard only, from the top of a docs page: skip link, nav links, both switchers, GitHub, the sidebar, the search trigger, the table of contents.
4. `prefers-reduced-motion: reduce`: nothing animates, on either route family.
5. At 375px: the docs sidebar collapses to its mobile treatment, the footer's three columns stack, nothing overflows horizontally.

Report what you saw for each. **If the Browser pane is not displaying and screenshots time out, say so plainly and mark this step NOT DONE** — do not substitute DOM inspection and call it a visual pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: record sub-project D verification"
```

---

## Completion criteria

D is complete when:

1. `apps/web` serves the landing page and the documentation; **`apps/docs` does not exist**.
2. Every link resolves. There is **no `/docs/*` carve-out** in the audit.
3. All 27 components have a page; the five new ones have live, interactive previews and prop tables read from source.
4. The 18 stubs are marked in the page and in the index, from a single frontmatter field.
5. The component index is derived from the page tree — a component shipping undocumented is visible, not silent.
6. `lint`, `check-types`, `build`, `test` and `check-copy` all pass uncached, with `check-copy` covering `apps/web/content` **and observed failing** against a deliberate violation there.
7. Search works on the migrated routes.
8. The theme default is `system` and all five accents work, including on documentation pages.
9. The site has been looked at — or the visual pass is reported unmet, explicitly.
