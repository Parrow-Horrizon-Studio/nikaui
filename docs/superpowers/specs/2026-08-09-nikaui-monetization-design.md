# Nika UI — Monetization & Distribution Architecture

**Date:** 2026-08-09
**Status:** Approved
**Scope:** Sub-project A of five. Defines the open-source/premium boundary, how paid artifacts reach buyers, repository topology, commercial terms, and launch posture.

---

## 1. Context

Nika UI is a Tailwind + Motion React component library following the shadcn/ui copy-paste model: a CLI writes component *source* into the consumer's repository rather than shipping an npm package they import from.

Today the project has 22 components in `packages/registry`, a working CLI with dependency resolution, and a Fumadocs documentation site. There is no paid tier, no blocks, and no templates.

The goal is an open-source core with a **one-time-purchase** premium tier. This spec fixes the boundary between the two and the machinery that enforces it, because those decisions constrain the landing page copy (sub-project C), the documentation's gating (D), and the repository split (E).

A visual prototype exists in Claude Design (project `73b8093b-6910-45c9-a7ff-6419db881a30`). It is **design reference only**. Its copy and commercial terms — `$99`, `1 license`, `80+ premium blocks` — are superseded by this document.

---

## 2. Decisions

### D1 — Artifact taxonomy

Three artifact kinds, distinguished by reuse pattern rather than by size:

| Kind | Definition | Install target | Reuse pattern |
|---|---|---|---|
| **Component** | One primitive, one concern | `components/ui/<name>.tsx` | Imported often, edited rarely |
| **Block** | One composed section with layout and copy slots | `components/blocks/<name>/*` | Dropped in once or twice, edited heavily |
| **Template** | A bundle of blocks plus an assembled page | blocks to `components/blocks/`, page to a prompted path | Installed once into an existing project |

A template is **composition, not new code**. It installs the blocks it needs and emits one assembled page. This has a sequencing consequence: the build order is necessarily **components → blocks → templates**, since a template is a combination of blocks that must already exist.

Blocks land in `components/blocks/<name>/`, deliberately *not* `components/ui/blocks/`. The `components/ui` directory carries a strong convention from shadcn — primitives, generated, safe to regenerate. Blocks are edited the moment they land. A sibling directory preserves that signal. The per-block subdirectory also prevents two blocks that each ship a `header.tsx` from overwriting one another.

### D2 — Free / Pro boundary

- **All components are free**, MIT, without exception.
- **Approximately ten blocks are free** — final count set by the lineup spec; the remainder are Pro.
- **All templates are Pro.**

The free-block selection follows a principle rather than a fixed list: *free blocks are the sections every site has; Pro blocks are the ones that take a day each.* Navigation bars, footers, heroes, CTA bands, a simple auth form, empty states, 404 pages are free. Data tables with filtering, dashboard shells, command palettes, multi-step forms, settings panels, and checkout flows are Pro.

**Rationale.** Paywalling only templates (the original proposal) leaves a thin value proposition — a buyer needs one template, and once cloned the product is spent. Blocks are consumed continuously, which is what makes a one-time price feel cheap in retrospect. Paywalling *all* blocks makes the free tier feel like a demo the first time a user hits a lock, and the free tier is the entire distribution channel for a library with no audience yet. Seeding ~10 genuinely useful free blocks means a free user can ship something real.

The specific block and template lineup is out of scope here and belongs to its own spec.

### D3 — Delivery architecture

The CLI is a **public npm package**. Publishing public packages to npm is free at any volume; no paid npm plan is ever required. Components are not npm packages at all — they are source files fetched over HTTP — so the paywall cannot be and is not an npm concern. It is solely a question of *where the CLI fetches source from*.

```
npx nika add auth-form-01
        │
        ├─ registry index (PUBLIC — includes Pro entries, marked access:"pro")
        │
        ├─ free entry → raw.githubusercontent.com/<org>/nikaui/main/…
        │
        └─ pro entry  → POST registry.nikaui.dev/api/registry/<path>  { licenseKey }
                             │
                             ├─ validate: Polar POST /v1/customer-portal/license-keys/validate
                             └─ on success: read file from local disk, stream back
```

**The registry index is public even for Pro entries.** Only source bytes are gated. This lets `npx nika list` surface locked blocks, lets the documentation render them with previews and a lock badge, and lets a failed fetch return a useful message rather than a bare 404.

**The API is deployed from the private Pro repository**, which is also where the Pro block source lives. Because the API serves files from the same repository it deploys from, it reads them off local disk — there is no cross-repository GitHub API call and no GitHub personal access token anywhere in the system. The only secret is `POLAR_ORG_TOKEN`.

The API is **not** placed in the public repository. A public repo with an open contribution workflow is an unsafe place for deployment secrets: an outside contributor's pull request triggers a preview deployment with the project's environment variables attached, and any code in that PR can read `process.env`. Separate deployment means separate environment scope.

**Buyer credential flow.** `npx nika login` prompts for a license key, calls Polar's activation endpoint, and stores the key at `~/.nika/auth.json` with mode `600`. `NIKA_LICENSE_KEY` overrides the stored value for CI. Activation makes Polar's seat limits mechanically enforced rather than honour-based. A missing or invalid key produces:

> This is a Nika Pro block — get access at nikaui.dev/pro

**Template installation.** Components and blocks go to fixed conventional paths. Only the assembled page's destination is prompted, because that is the part that varies by framework:

```
npx nika add template dashboard

  Detected Next.js (App Router)

? Where should the page go?
  › app/dashboard/page.tsx        (recommended)
    src/pages/Dashboard.tsx
    Custom path…
    Skip — install the parts only
```

Detection checks for `next.config.*` plus `app/` vs `src/app/`, then `vite.config.*`, `remix.config.*`, `react-router.config.*`. The answer is remembered in `nika.config.ts` so subsequent template installs do not re-prompt. **Skip must remain available** — some buyers want the parts and will compose the page themselves.

The CLI never touches routing configuration. In Next.js, file placement *is* routing; elsewhere it is one import. Either way that is the buyer's decision.

### D4 — Repository topology

| Repository | Visibility | Owner | Contents |
|---|---|---|---|
| `nikaui` | public | Parrow Horrizon Studio | components, CLI, docs site, landing page |
| `nikaui-pro` | private | Parrow Horrizon Studio | Pro blocks, templates, registry API |

Both repositories belong in the organisation. GitHub Free for organisations includes **unlimited private repositories with unlimited collaborators**; the previously assumed need to park private code on a personal account to avoid a paid org plan does not exist. Free organisations forgo repository rules and branch protection on private repos, CODEOWNERS, required reviewers, draft pull requests, Pages and Wikis on private repos, and are capped at 2,000 Actions minutes per month (public repositories are unmetered).

Migration mechanics are sub-project E.

### D5 — Commercial terms

| | Personal | Team |
|---|---|---|
| Price | **$149** one-time | **$349** one-time |
| Seats | 1 developer | up to 5 developers at one organisation |
| Projects | unlimited, personal and commercial | unlimited, personal and commercial |
| Client work | permitted | permitted |
| Updates | lifetime | lifetime |
| Refunds | 14 days, no questions asked | 14 days, no questions asked |

**License grant.** Unlimited personal and commercial projects; may be shipped in client work. **May not** redistribute the blocks themselves, nor use them to build a competing component library or template store.

**Payment provider: Polar.** Polar is merchant of record, so it handles global VAT and sales tax on the seller's behalf — material when selling from the Philippines into the EU and US. Polar supports Philippines payouts via Stripe Connect Express. Lemon Squeezy is a viable drop-in alternative should Polar's terms change.

**Refunds do not claw back code.** Copy-paste distribution means a refunded buyer retains whatever they have already installed; revocation prevents only *future* installs. This is inherent to the model and is shared by every library in this category. It is recorded here so it is not discovered as a surprise.

Early-bird pricing is deferred until Pro is near-complete. It is a store configuration, not an architectural concern.

### D6 — Launch posture

Pro is **not purchasable at launch**. There will be zero blocks on the day the documentation site goes live, so the Pricing section cannot honestly sell a product.

- The Pricing section ships **fully built with real numbers**; its call to action is *"Join the waitlist"* → email capture.
- The Templates section ships with placeholder cards, honestly labelled.
- Pro flips live once blocks exist.

The waitlist costs one email field, is honest about the product's state, and produces the list of people to consult when deciding *which* blocks to build first — worth more than early revenue at this stage.

---

## 3. Implementation deltas

These are consequences of the decisions above. They are scheduled into sub-project B (design-system foundation) rather than executed here.

1. **Registry schema** gains `access: "free" | "pro"` and extends `type` to `"ui" | "lib" | "block" | "template"`, with multi-file entries carrying real relative targets:

   ```json
   "dashboard": {
     "type": "template",
     "access": "pro",
     "files": [
       { "source": "blocks/dashboard/stats-row.tsx", "target": "@blocks/dashboard/stats-row.tsx" },
       { "source": "blocks/dashboard/page.tsx",      "target": "@page" }
     ],
     "registryDependencies": ["button", "card", "table", "chart-area"]
   }
   ```

   Targets are **alias-relative, not literal paths** — `@ui/`, `@blocks/`, `@lib/` resolve through `nika.config.ts`, so a consumer with a non-standard layout is respected. The `@page` sentinel marks the single file whose destination is prompted. Everything after the alias prefix is preserved verbatim, which is what makes nested block directories possible.

2. **The CLI must stop flattening paths.** `packages/cli/src/commands/add.ts:72` and `:174` both call `path.basename(file.target)`, discarding directory structure, and `targetDir` is only ever `uiDir` or `libDir`. Every file currently lands flat in `components/ui/`. Blocks and templates are impossible until this honours full relative targets.

3. **`nika.config.ts`** gains `aliases.blocks` (default `@/components/blocks`) and a remembered page destination.

4. **`packages/cli/src/commands/add.ts:23`** — `REGISTRY_BASE_URL` points at `https://raw.githubusercontent.com/nicaui/nikaui/…`. The account `nicaui` is a transposition and does not exist, so every remote fetch returns 404 today. This is masked because `getFileContent` tries local monorepo paths first, so it works in development and fails for every real consumer. Fixed during the sub-project E migration, when the URL changes to the organisation anyway.

5. **New CLI surface:** `nika login`, `nika logout`, and a `--pro`-aware `nika list`.

6. **`transformer.ts`** gains a directive rule, since `"use client"` is Next.js-specific and the assembled page is emitted for multiple React frameworks.

---

## 4. Out of scope

- **Vue and Nuxt support.** The registry is React at the bone — `@headlessui/react`, `motion/react`, `.tsx` with `React.forwardRef`. A Vue version is a second component set written from scratch against Headless UI Vue and Motion for Vue: a separate product line, not a CLI option. The page-destination prompt covers arbitrary paths *within React*, which spans Next.js, Vite, Remix, TanStack Start, and React-in-Astro.
- **`npx nika create` project scaffolding.** Revisit on Pro-user feedback; the install-into-existing-project flow covers the need for now.
- **The block and template lineup.** Its own spec.
- **Hosting selection.** Belongs to sub-project E. Noted here because it carries a cost that has not been budgeted: Vercel's fair use guidelines restrict Hobby teams to non-commercial personal use, and define commercial usage to include *"advertising the sale of a product or service."* A landing page advertising Nika Pro qualifies. That implies Vercel Pro at $20/month, or Cloudflare Workers/Pages, which permits commercial use on its free tier.

---

## 5. Open dependencies

- **Domain.** This spec assumes `registry.nikaui.dev` for the API and `nikaui.dev/pro` for the sales page. If `nikaui.dev` is not owned, acquisition is a sub-project E task.
- **Polar account.** Organisation setup, product creation, and license-key benefit configuration precede any Pro launch, but not the waitlist.

---

## 6. Sub-project sequence

| # | Sub-project | Depends on | Status |
|---|---|---|---|
| **A** | Monetization strategy | — | **This document** |
| **B** | Design-system foundation — prototype tokens, motion preset API, registry schema | — | Next |
| **C** | Landing page | A, B | |
| **D** | Documentation and component showcase | B, A | |
| **E** | Repository migration, hosting, domain | A | |
| **F** | Block and template lineup | A, B | |
