# Nika UI — Documentation Migration

**Date:** 2026-08-12
**Status:** Approved
**Scope:** Sub-project D. The documentation moves into `apps/web`, inherits the chrome sub-project C built, and `apps/docs` is deleted. The five undocumented components get real pages.
**Parent:** [`docs/MASTER-PLAN.md`](../../MASTER-PLAN.md) — the single reference for Nika UI. This spec is the deep-dive behind decisions D1–D8 in its ledger.

---

## 1. Context

C built `apps/web` deliberately for this: the navigation takes its links as data rather than hard-coding a marketing-only set, the footer is generic, and spec C7 recorded that D must not silently carry `apps/docs`'s `dark` theme default across. D is the migration those decisions were made for, and together with C it unblocks E7 (hosting and deployment).

The migration itself is smaller than it looks. `apps/docs` already sets `nav: { enabled: false }` and supplies its own `<Header />`, so C's chrome **substitutes** for that header rather than competing with Fumadocs' own navigation. `DocsLayout` continues to own the sidebar and table of contents beneath it.

**The documentation, however, is mostly not written.** This was established while scoping the spec and it changes what D is:

| | |
|---|---|
| Components in the registry | **27** |
| Component pages that exist | 22 |
| …of those, pages ending in "Documentation coming soon" or equivalent | **18** |
| Pages carrying more than one `tsx` example (every page has a `bash` install line) | **3** — `button` (4), `card` (2), `badge` (2) |
| Components with no page at all | **5** — `alert`, `progress`, `radio-group`, `slider`, `textarea` |

The five missing pages are exactly the five components sub-project B added. The three guides — `installation` (96 lines), `theming` (166), `animation` (122) — are substantial and current.

So a literal migration would relocate a site where 18 of 22 component pages are stubs and 5 components 404, and attach it to a landing page whose headline claim is 27 components. That is the same defect C spent a task eliminating — an artifact claiming what the repository cannot back — except here the landing page's "Browse components" button is what leads to it.

D therefore covers the migration **and** closes the 404s. It does not write the remaining 18 pages; that is its own sub-project, and §4 says so.

---

## 2. Decisions

### D1 — `apps/web` absorbs the documentation; `apps/docs` is deleted last

The final shape:

```
apps/web/
  source.config.ts            from apps/docs
  next.config.mjs             gains createMDX()
  content/docs/               30 files (27 MDX + 3 meta.json), moved wholesale
  src/app/
    layout.tsx                C's, plus Fumadocs' RootProvider
    page.tsx                  C's landing page, unchanged
    docs/                     5 route files from apps/docs
    api/search/route.ts       from apps/docs
    globals.css               C's, plus the --color-fd-* bridge
  src/lib/                    source.ts, tree-utils.ts, docs-page.tsx, layout.shared.tsx
  src/components/
    site/                     C's chrome, now wrapping docs too
    landing/                  C's sections
    docs/                     component-cards, component-previews, mdx
```

Four things are **deleted rather than moved**, all superseded by C: `apps/docs/src/app/(home)/` (the old landing page), `src/components/header.tsx`, `src/app/layout.tsx`, and finally the `apps/docs` directory itself.

**The migration runs in parallel, and the deletion is last.** `apps/docs` keeps serving on port 3000 while the docs routes are stood up inside `apps/web`, so every step is verifiable against a live reference — same page, two ports, compare. `apps/docs` is removed in its own commit once the replacement is proven.

The reason is specific rather than general caution. The failure mode this migration risks is silent: a page tree that resolves to nothing, or a Fumadocs colour token that keeps rendering Fumadocs' default palette while compiling cleanly. **That second failure has already happened once in this repository** — the comment at `apps/docs/src/app/globals.css:7-16` documents at length how assigning the bare `--fd-*` name instead of `--color-fd-*` "compiles and passes every automated check here, but every Fumadocs colour utility keeps rendering with Fumadocs' own default palette". That comment moves with the bridge and must not be lost in the merge. A live reference on another port is the cheapest detector for that class of bug.

### D2 — C's chrome wraps the documentation; Fumadocs keeps the sidebar

`<Nav />` and `<Footer />` from `src/components/site/` wrap every route, documentation included. `baseOptions()` keeps `nav: { enabled: false }`, and `DocsLayout` keeps providing the sidebar, the table of contents and the search trigger.

Three consequences, all intended:

- **The theme toggle and accent switcher appear on documentation pages.** This is the point — the accent system applies to the components being documented, and a visitor reading about `Button` should be able to retint it.
- **The navigation's `#waitlist` link becomes `/#waitlist`.** It is a fragment that only resolves on the landing page; on a documentation route it currently goes nowhere. C's final review recorded this as a known item for D.
- **The footer gains a documentation column.** Its grid hard-codes a two-column assumption (`footer.tsx:41`, `lg:grid-cols-[minmax(0,1fr)_repeat(2,minmax(0,auto))]`), which C's final review deferred to D on the grounds that D is when a third column actually arrives.

### D3 — C's `ThemeProvider` owns theming; Fumadocs' `RootProvider` does not

Fumadocs' `RootProvider` wraps `next-themes` internally, and C mounts `next-themes` directly. Both in one tree means two providers contending for one `.dark` class.

**Resolution: C's `ThemeProvider` keeps owning theming, and `RootProvider` mounts with its theme handling disabled**, retaining only its search-dialog and sidebar context.

This preserves `defaultTheme="system"`, which spec C7 explicitly ruled must not become `dark` in D, and keeps C's committed theme-toggle tests pointed at the provider they were written against. The alternative — letting Fumadocs own the theme — would make the marketing page's theming a function of a documentation library.

**This decision carries a must-verify, not an assumption.** The plan must confirm that Fumadocs 16 exposes a supported way to disable `RootProvider`'s theming before building on it. If it does not, the fallback is to mount `RootProvider` only beneath `/docs`, accepting a nested theme context there — and that fallback must itself be checked, because the theme toggle lives in the shared navigation above `/docs` and must keep working on every route.

The accent pre-paint script in `<head>` is independent of both providers and is unaffected.

### D4 — Five real pages; eighteen honestly marked

**The five new pages** — `alert`, `progress`, `radio-group`, `slider`, `textarea` — are written to the standard `button.mdx` sets: frontmatter, Installation, a Usage block with a runnable example, variants and sizes where the component has them, an Animation note where it animates, and an API Reference table. **Each also gets a live preview** in `component-previews.tsx`, because a `Slider` a visitor can drag demonstrates more than a code fence.

**Every prop in those tables is read from the component's source, not inferred from its name.** A prop that does not exist is silently ignored by React, so a guessed table produces documentation that looks authoritative and is fiction. C established this standard when an implementer verified `Switch`'s props against both `switch.tsx` and Headless UI's own type definitions rather than assuming.

**The 18 stubs are marked with a frontmatter field**, not a prose sentence. A frontmatter flag is data: it can drive a callout on the page *and* a marker in the component index, so a visitor sees which pages are worth opening before opening them. It also gives the sub-project that writes the remaining 18 a work list it can compute rather than assemble by hand. A prose sentence at the foot of a page can only be read by someone already on it.

### D5 — The component index is derived, not hand-maintained

`component-cards.tsx` hard-codes a 22-entry array of `{ name, slug, category }`. The set of components is therefore written down in **three** places — `packages/cli/src/registry.json`, the `packages/registry/src/ui/` directory, and this array — and only the first two are bound to each other, by the test C added.

That array is why the five new components are missing from the index as well as from the content. **D derives the index from the documentation page tree** so that adding a component cannot leave the index stale again.

`category` (`foundation` | `interactive`) has no source outside this array. It moves into the pages' own frontmatter, where it sits beside the content it classifies.

### D6 — The honesty gate covers documentation content

`check-copy` gains `apps/web/content` as a fourth root, and the guide's hard-coded "27 Components" (`guide/index.mdx:19`) is bound to the registry manifest exactly as `claims.test.ts` binds the hero's.

**Prose needs care that code does not.** Documentation legitimately discusses things marketing copy must never say, and `theming.mdx` and `animation.mdx` are long explanatory pages. Where a pattern trips on legitimate prose, **narrow the pattern — do not exclude the file.** Excluding a file is how a gate quietly stops covering the thing it was added for; C's `check-copy` shipped scanning a tree that did not contain the file its `pop` pattern was written for, and nobody noticed until the final review.

### D7 — `apps/web` moves to port 3000

`apps/docs` holds 3000 and `apps/web` was given 3001 so both could run during C. Once `apps/docs` is deleted, the surviving application takes the conventional port, before E7 configures a deployment against it.

### D8 — Prop-table binding is deferred

A test asserting that every prop named in an MDX API table exists in that component's TypeScript props would be the natural extension of `claims.test.ts` and `tokens.test.ts` — and it is the check that would catch a table going stale when a component gains a prop.

It is deferred to the sub-project that writes the remaining 18 pages. Parsing MDX tables and TypeScript prop types is a real piece of work whose value scales with the number of tables it guards; D writes five. Building it then means building it against 27 real tables rather than five, which is both cheaper per page and better evidence that it works.

Recorded here so it is a deferral with a reason, not an omission.

---

## 3. Out of scope

- **Writing the remaining 18 component pages.** Its own sub-project. D marks them; it does not fill them.
- **Binding MDX prop tables to component source** — D8.
- **Hosting, DNS, TLS, deployment, analytics** — E7, which C and D together unblock.
- **The Pro landing page and documentation** at `pro.nikaui.dev` — a different repository, per spec A §D4.
- **Redesigning the documentation.** D moves it and wraps it in C's chrome. Restyling Fumadocs' sidebar or reworking the information architecture is not part of this.
- **New components.** The registry is unchanged by D.

---

## 4. Verification

D is complete when:

1. `apps/web` serves the landing page and the documentation; **`apps/docs` no longer exists**.
2. **Every `/docs/*` link from the landing page resolves.** C shipped those as the sole permitted dangling links and its link audit carried an explicit carve-out for them. D closes it: the carve-out is removed, and any dangling link is a defect.
3. All 27 components have a page. The five new ones have live previews, and prop tables read from source.
4. The 18 stubs are marked in the page and in the index, from one frontmatter field.
5. The component index is derived from the page tree — adding a component to the registry without documenting it must be visible, not silent.
6. `pnpm lint`, `check-types`, `build`, `test` and `check-copy` all pass, with `check-copy` covering `apps/web/content`.
7. Search works, on the migrated routes.
8. The theme default is still `system` and all five accents still work — including on documentation pages, which is new surface for them.
9. **The page has been looked at.** C shipped without a visual pass because no frame ever composited; its spec §5.2 and the normal-motion half of §5.7 remain unmet. D is when the site becomes one thing, so it is the right moment to close them — both themes, five accents, 375px, keyboard walk. This requires the Browser pane to be displayed; if it is not, D reports the criterion unmet rather than describing structural checks as a visual pass.
