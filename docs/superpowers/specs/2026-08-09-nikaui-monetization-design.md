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
        └─ pro entry  → POST pro.nikaui.dev/api/registry/<path>  { licenseKey }
                             │
                             ├─ validate: Polar POST /v1/customer-portal/license-keys/validate
                             └─ on success: read file from local disk, stream back
```

**The registry index is public even for Pro entries.** Only source bytes are gated. This lets `npx nika list` surface locked blocks, lets the documentation render them with previews and a lock badge, and lets a failed fetch return a useful message rather than a bare 404.

**The API is deployed from the private Pro repository** as route handlers inside `apps/pro` — the same Next.js application that serves the Pro marketing site and documentation. Because it serves files from `packages/blocks` in the repository it deploys from, it reads them off local disk. There is no cross-repository GitHub API call and no GitHub personal access token anywhere in the system. The only secret is `POLAR_ORG_TOKEN`.

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

Two repositories, each a Turborepo. The Pro tier gets its own landing page and documentation site rather than being grafted onto the open-source one.

```
nikaui       (public,  org)
  apps/docs         → nikaui.dev       landing + OSS documentation
  packages/         registry, cli, tailwind-config, eslint-config, typescript-config

nikaui-pro   (private, org)
  apps/pro          → pro.nikaui.dev   Pro landing, Pro docs, block browser,
                                       checkout — and the registry API routes
  packages/blocks   → Pro block and template source
```

This costs a second landing page and a second documentation site. It buys a Pro surface that can render locked previews, run checkout, and manage licenses without any of that logic entering the open-source tree — and it means the registry API and the Pro site are one deployment rather than two.

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
| Refunds | 14 days, void after 5 Pro installs | 14 days, void after 5 Pro installs |

**License grant.** Unlimited personal and commercial projects; may be shipped in client work. **May not** redistribute the blocks themselves, nor use them to build a competing component library or template store.

**Selling entity: Parrow Horrizon Studio.** Nika UI ships under PHS alongside the studio's other products.

**Payment provider: Polar**, acting as merchant of record. Polar is legally the seller; customers buy from Polar, and Polar pays out to PHS via Stripe Connect Express, which supports Philippines payouts. Lemon Squeezy is a viable drop-in alternative should Polar's terms change.

Stripe direct was considered and rejected on two grounds. Stripe Philippines is invite-only with PHP-only settlement, so every USD sale would auto-convert with FX loss and Stripe Connect functionality is limited for PH accounts. More significantly, selling through Stripe directly would make PHS the merchant of record, making it responsible for collecting and remitting consumption tax in every jurisdiction sold into — EU VAT on digital goods to consumers carries a €0 registration threshold, so the first European sale triggers it, alongside UK VAT and US state sales tax at economic nexus. An MoR absorbs all of this for roughly two percentage points over raw Stripe processing, which is a good trade for a solo-operated product.

**Refunds do not claw back code**, and the policy is built around that fact. Copy-paste distribution means a refunded buyer retains whatever they already installed; revocation prevents only *future* installs. This is inherent to the model and shared by every library in the category. The five-install cap exists to close the resulting abuse case — install the entire Pro catalogue, then request a refund — while keeping a visible refund policy, which measurably aids conversion for an unproven product.

Enforcement is cheap: Polar's validate endpoint accepts `increment_usage` and supports per-key usage quotas, and the CLI calls validate on every Pro install regardless. The install count is a parameter on a request already being made, not a subsystem.

One constraint is not PHS's to set. EU consumer law grants buyers of digital goods a 14-day right of withdrawal, waivable only where the buyer expressly consents to immediate delivery and acknowledges losing that right. Because Polar is merchant of record for EU sales, Polar's terms govern this. The five-install condition must be confirmed against Polar's refund policy before launch rather than assumed to be enforceable.

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

   `nika login` calls Polar's activation endpoint, so seat limits are enforced mechanically. Every Pro fetch passes `increment_usage` to Polar's validate endpoint, which is what makes the five-install refund condition enforceable without additional infrastructure.

6. **`transformer.ts`** gains a directive rule, since `"use client"` is Next.js-specific and the assembled page is emitted for multiple React frameworks.

---

## 4. Out of scope

- **Vue and Nuxt support.** The registry is React at the bone — `@headlessui/react`, `motion/react`, `.tsx` with `React.forwardRef`. A Vue version is a second component set written from scratch against Headless UI Vue and Motion for Vue: a separate product line, not a CLI option. The page-destination prompt covers arbitrary paths *within React*, which spans Next.js, Vite, Remix, TanStack Start, and React-in-Astro.
- **`npx nika create` project scaffolding.** Revisit on Pro-user feedback; the install-into-existing-project flow covers the need for now.
- **The block and template lineup.** Its own spec.
- **Hosting selection.** Belongs to sub-project E. The intended target is a **self-hosted VPS under Coolify**, shared with the studio's other projects, with Vercel Pro as fallback. Vercel's free tier is not an option: its fair use guidelines restrict Hobby teams to non-commercial personal use and define commercial usage to include *"advertising the sale of a product or service"* — which a landing page advertising Nika Pro is, even in waitlist state. Fallback therefore costs $20/month, not $0.

---

## 5. Open dependencies

- **Domains.** `nikaui.dev` is available and will be purchased; acquisition is a sub-project E task. The Pro site and registry API both live at `pro.nikaui.dev`, a subdomain, to avoid a second registration before the product has earned anything. `nikaui.pro` remains under consideration as an additional domain — a cosmetic upgrade, not an architectural change, and safe to add later without touching the CLI if the subdomain is kept as an alias.
- **PHS re-registration.** Parrow Horrizon Studio was registered in 2025 and closed in 2026; re-registration is planned. Polar onboarding requires a seller entity, and changing that entity later is disruptive because tax records and invoices are issued under whoever is registered. **PHS should therefore be re-registered before Polar onboarding, and onboarding as an individual to save time should be avoided.** This is not on the critical path: the waitlist launch posture means the landing page, documentation, and email capture ship with no payment provider involved at all.
- **Polar account.** Organisation setup, product creation, license-key benefit configuration, and confirmation of the five-install refund condition against Polar's own refund policy. All precede a Pro launch; none precede the waitlist.

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
