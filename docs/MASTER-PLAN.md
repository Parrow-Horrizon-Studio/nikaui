# Nika UI — Master Plan

**Last updated:** 2026-08-09
**Status:** Living document

This is the single reference for Nika UI. It holds the product definition, current state, architecture, and the full sequence of work. Individual sub-projects get their own specs as they are brainstormed; this document links to them and records the decisions that came out of them.

**How to use it:** read §4 to see what is being built and in what order. Read §5 for what has already been decided and why. Read §7 for what is still open. Take one sub-project at a time — each gets brainstormed into a spec, planned, then implemented.

---

## 1. Product definition

Nika UI is a Tailwind CSS and Motion React component library distributed shadcn-style: a CLI writes component *source* into the consumer's repository rather than shipping a package they import from. The consumer owns the code.

Named after the Sun God Nika. The signature is motion — components stretch and spring by default rather than requiring animation work.

**Business model:** open-source core, one-time-purchase premium tier. No subscription.

| | |
|---|---|
| Primitives | Headless UI (Tailwind Labs), chosen over Radix to keep the library Tailwind-native |
| Animation | Motion (motion.dev) |
| Styling | Tailwind CSS v4 + CSS variables |
| Variants | class-variance-authority |
| Monorepo | Turborepo + pnpm |
| Docs | Next.js + Fumadocs |
| Selling entity | Parrow Horrizon Studio |

---

## 2. Current state

### 2.1 What exists

Repository `github.com/Rowee13/nikaui`, branch `main`, 14 commits.

```
apps/docs                  Next 16, React 19, Fumadocs 16, Tailwind 4
packages/registry          22 components + lib/utils, lib/motion
packages/cli               nika-ui — init, add, list
packages/tailwind-config
packages/eslint-config
packages/typescript-config
```

**Components (22):** accordion, alert-dialog, aspect-ratio, avatar, badge, button, card, checkbox, combobox, dialog, dropdown-menu, input, label, popover, select, separator, skeleton, spinner, switch, tabs, toast, tooltip.

The CLI already resolves two dependency kinds — `dependencies` (npm packages) and `registryDependencies` (other registry files) — walks the graph, detects the consumer's package manager, and installs what is missing. This machinery is sound and is what blocks and templates will reuse.

### 2.2 Design prototype

A Claude Design prototype exists at project `73b8093b-6910-45c9-a7ff-6419db881a30`, reachable through the DesignSync tool. Three pages — `Landing Page.html`, `Documentation.html`, `Components.html` — plus `nika-tokens.css`, `nika-components.css`, `nika-showcase.css`, `nika-landing.css`, and `scripts/nika.js`.

**The prototype is visual reference only.** Its copy, pricing, and feature counts are placeholders, not requirements. Port its layout, spacing, tokens, and interaction design faithfully; treat every factual claim in its text as needing confirmation.

### 2.3 Gap analysis — prototype vs. code

Four gaps, none cosmetic:

1. **Two token systems coexist.** `apps/docs/src/app/globals.css` defines shadcn-style HSL variables *and* imports Fumadocs' own `fd-*` set. The current landing page uses `fd-*`. The prototype uses neither: OKLCH, `data-theme` plus `data-accent` with five accent presets, Manrope and JetBrains Mono, `--radius: 0.7rem`.

2. **The motion API the prototype advertises does not exist.** The prototype sells `motion="bounce"` with five named presets — bounce, pop, glide, snap, none. The registry has `animated?: boolean` on Button and a generic `motionPresets` object in `lib/motion.ts` that no component consumes.

3. **Component count.** The prototype's hero says "40+ components" and its free tier says "All 40+ core components." There are 22.

4. **The landing page implies the whole business model.** Its Templates and Pricing sections cannot be ported until the free/premium boundary is settled — which is why that was sequenced first.

### 2.4 Known defects

| Location | Defect |
|---|---|
| `packages/cli/src/commands/add.ts:23` | `REGISTRY_BASE_URL` points at `raw.githubusercontent.com/nicaui/nikaui/…`. `nicaui` is a transposition; the account does not exist, so every remote fetch 404s. Masked in development because `getFileContent` tries local monorepo paths first — so it works for the author and fails for every real consumer. |
| `packages/cli/src/commands/add.ts:72, :174` | Both call `path.basename(file.target)`, discarding directory structure, and `targetDir` is only ever `uiDir` or `libDir`. Every file lands flat in `components/ui/`. Blocks and templates are impossible until this honours full relative targets. |
| `README.md` | Documents an `apps/showcase` that was merged away in commit `325b75b`. |

---

## 3. Architecture

### 3.1 Artifact taxonomy

Three kinds, distinguished by reuse pattern rather than size:

| Kind | Definition | Install target | Reuse pattern | Access |
|---|---|---|---|---|
| **Component** | One primitive, one concern | `components/ui/<name>.tsx` | Imported often, edited rarely | Free, MIT, all |
| **Block** | One composed section with layout and copy slots | `components/blocks/<name>/*` | Dropped in once or twice, edited heavily | ~10 free, rest Pro |
| **Template** | A bundle of blocks plus an assembled page | blocks to `components/blocks/`, page to a prompted path | Installed once into an existing project | Pro |

Blocks land in `components/blocks/`, deliberately *not* `components/ui/blocks/` — `components/ui` carries a shadcn convention meaning "primitives, generated, safe to regenerate," and blocks are edited the moment they land. The per-block subdirectory also stops two blocks that each ship a `header.tsx` from overwriting one another.

A template is **composition, not new code**. Build order is therefore necessarily components → blocks → templates.

### 3.2 Repository topology

Two repositories, each a Turborepo, both owned by the Parrow Horrizon Studio organisation.

```
nikaui       (public)
  apps/docs         → nikaui.dev       landing + OSS documentation
  packages/         registry, cli, tailwind-config, eslint-config, typescript-config

nikaui-pro   (private)
  apps/pro          → pro.nikaui.dev   Pro landing, Pro docs, block browser,
                                       checkout — and the registry API routes
  packages/blocks   → Pro block and template source
```

The Pro tier gets its own landing page and documentation site rather than being grafted onto the open-source one. This costs a second site; it buys a surface that can render locked previews, run checkout, and manage licenses without any of that logic entering the open-source tree — and it makes the registry API and the Pro site one deployment rather than two.

### 3.3 Distribution and licensing

```
npx nika add auth-form-01
        │
        ├─ registry index (PUBLIC — includes Pro entries, marked access:"pro")
        │
        ├─ free entry → raw.githubusercontent.com/<org>/nikaui/main/…
        │
        └─ pro entry  → POST pro.nikaui.dev/api/registry/<path>  { licenseKey }
                             │
                             ├─ validate: Polar /v1/customer-portal/license-keys/validate
                             └─ on success: read from local disk, stream back
```

Three properties worth stating explicitly, because each was a deliberate choice:

- **The registry index is public even for Pro entries.** Only source bytes are gated. `npx nika list` surfaces locked blocks, docs render them with previews and a lock badge, and a failed fetch returns a useful message rather than a bare 404.
- **No GitHub token exists anywhere in the system.** The API deploys from the same repository the Pro source lives in, so it reads files off local disk. The only secret is `POLAR_ORG_TOKEN`.
- **The API is not in the public repository.** A public repo with an open contribution workflow is an unsafe place for deployment secrets: an outside contributor's pull request triggers a preview deployment with environment variables attached, and any code in that PR can read `process.env`.

**Buyer credential flow.** `nika login` prompts for a license key, calls Polar's activation endpoint, and stores it at `~/.nika/auth.json` mode `600`. `NIKA_LICENSE_KEY` overrides for CI.

**Template installation** prompts only for the assembled page's destination, since that is the part that varies by framework:

```
npx nika add template dashboard

  Detected Next.js (App Router)

? Where should the page go?
  › app/dashboard/page.tsx        (recommended)
    src/pages/Dashboard.tsx
    Custom path…
    Skip — install the parts only
```

Detection checks `next.config.*` plus `app/` vs `src/app/`, then `vite.config.*`, `remix.config.*`, `react-router.config.*`. The answer is remembered in `nika.config.ts`. The CLI never touches routing configuration.

### 3.4 Agent surface

AI coding agents are a first-class consumer of this library, and the architecture above already suits them: an agent reads the public index, learns a block exists, and runs `npx nika add <name>`. The CLI reads the credential from disk.

**Design rule: the agent never handles the license key.** Agents leak their context into transcripts, logs, and sometimes commits. Every agent-facing flow routes through the CLI, which reads `~/.nika/auth.json` itself.

**Constraint: Pro documentation must not render full Pro source.** If `pro.nikaui.dev` shows a copyable implementation the way free component docs will, the CLI, the license, and the entire gate become decorative — a human copies it, and an agent copies it faster. Pro block pages show preview, props, and install command; the usual softening is the first ~15 lines behind a fade, which still lets a buyer judge quality before purchase.

Four tiers, built in order:

| Tier | What | Who gets it |
|---|---|---|
| **0** | `llms.txt` — machine-readable index: description, install command, doc URL per entry. Pro entries listed by name with "requires license," no source | Everyone |
| **1** | `AGENTS.md` snippet teaching Nika conventions — aliases, motion presets, cva patterns, "prefer `npx nika add` over hand-rolling." Written by `nika init` | Everyone |
| **2** | **MCP server** — `search_components(query)`, `list_blocks(category)`, `get_props(name)`, `install(name)`. Reads the same `~/.nika/auth.json` | Everyone, **scoped by license** |
| **3** | Pro agent skill — encodes composition patterns: "building a dashboard? use these blocks, in this order" | Pro |

**The MCP server is free and scoped by license, not gated behind Pro.** Same binary for everyone; it surfaces what you have paid for. The reason is conversion, not generosity — it produces this on a free user's machine:

> **Dev:** "add a pricing section with a monthly/annual toggle"
> **Agent** *(queries MCP)*: "Nika has `pricing-toggle-02` that does exactly this. It's a Pro block — `npx nika add pricing-toggle-02` after you have a license."

An upsell at the moment of need, delivered by a tool the user already trusts, at zero marketing cost. Gating the server behind Pro would trade the best conversion mechanism available for a feature bullet.

Tiers 2 and 3 are built when the catalogue justifies them — an MCP server searching 22 components and zero blocks is not worth shipping.

---

## 4. Roadmap

| # | Sub-project | Depends on | Status |
|---|---|---|---|
| **A** | Monetization and distribution | — | **Specced** |
| **B** | Design-system foundation | — | Next |
| **C** | Landing page | A, B | Not started |
| **D** | Documentation and showcase | A, B | Not started |
| **E** | Repository migration and ops | A | Not started |
| **F** | Block and template lineup | A, B | Not started |
| **G** | Agent surface — MCP and skill | B, D, F | Not started |

### A — Monetization and distribution ✅

Full spec: [`docs/superpowers/specs/2026-08-09-nikaui-monetization-design.md`](superpowers/specs/2026-08-09-nikaui-monetization-design.md)

Fixes the free/Pro boundary, delivery architecture, repository topology, commercial terms, and launch posture. Summarised in §3 above; see the spec for rationale.

### B — Design-system foundation

**Goal:** everything visual sits on this. It must be right before C and D consume it.

- Port the prototype's OKLCH token layer — `data-theme` (light/dark) and `data-accent` (sun/violet/emerald/azure/rose), Manrope + JetBrains Mono, the spring easing set.
- Resolve the two coexisting token systems in `globals.css` (§2.3 gap 1). Fumadocs' `fd-*` variables must either be mapped onto Nika tokens or deliberately scoped to Fumadocs chrome only.
- Build the named motion preset API — `bounce`, `pop`, `glide`, `snap`, `none` — and adopt it across all 22 components, replacing `animated?: boolean`.
- Registry schema: add `access: "free" | "pro"`, extend `type` to `"ui" | "lib" | "block" | "template"`, move to alias-relative targets (`@ui/`, `@blocks/`, `@lib/`, `@page`).
- Fix the CLI path flattening (§2.4) — prerequisite for every block and template.
- `nika.config.ts` gains `aliases.blocks` and a remembered page destination.

**Open:** the 22-vs-40 component question (§7).

### C — Landing page

**Goal:** port the prototype landing page onto real Next.js and React, using B's tokens.

Prototype sections, in order: nav with theme toggle → hero with rays, sun, live component window, stats → features grid → motion highlight → templates → pricing → CTA band → footer.

- Pricing section ships fully built with real numbers ($149 / $349); CTA is "Join the waitlist" → email capture.
- Templates section ships with placeholder cards, honestly labelled.
- All prototype copy is reviewed against reality before shipping — no "40+ components" unless 40+ exist.

### D — Documentation and showcase

**Goal:** the prototype's Documentation and Components pages, covering all 22 existing components.

- Restructure Fumadocs to match the prototype's layout and navigation.
- Live previews for every component, with variant and motion-preset switchers.
- Absorbs agent Tiers 0 and 1 — `llms.txt` and the `AGENTS.md` snippet.
- **Pro doc pages must not render full source** (§3.4).

### E — Repository migration and ops

**Goal:** move to the organisation and stand up hosting.

- Transfer `nikaui` to Parrow Horrizon Studio. GitHub Free for organisations includes unlimited private repositories with unlimited collaborators, so both repos belong there — the earlier plan to park private code on the personal account solves a problem that does not exist.
- Create `nikaui-pro` as a private Turborepo.
- Fix `REGISTRY_BASE_URL` (§2.4) — it changes during migration anyway.
- Purchase `nikaui.dev`; `pro.nikaui.dev` as subdomain. `nikaui.pro` remains under consideration as an additional domain.
- Hosting: self-hosted VPS under Coolify, shared with other PHS projects. Vercel Pro at $20/month as fallback — Vercel's free tier is not an option (§6).
- Update `README.md` (§2.4).

### F — Block and template lineup

**Goal:** decide what actually gets built, and in what order.

- Select the ~10 free blocks. Principle: *free blocks are the sections every site has; Pro blocks are the ones that take a day each.* Navbars, footers, heroes, CTA bands, a simple auth form, empty states, 404s are free. Data tables with filtering, dashboard shells, command palettes, multi-step forms, settings panels, checkout flows are Pro.
- Catalogue the Pro blocks.
- Decide the template list. The prototype gestures at Admin Dashboard, SaaS Landing, and App Shell.

### G — Agent surface

**Goal:** Tiers 2 and 3 from §3.4 — the MCP server and the Pro agent skill.

Sequenced last deliberately: the MCP tool surface should be designed against B's finished registry schema and F's real catalogue, not guessed at.

---

## 5. Decisions ledger

| ID | Decision | Rationale | Where |
|---|---|---|---|
| A1 | Three artifact kinds: component, block, template | Distinguished by reuse pattern, which is what determines install path and pricing | Spec A §D1 |
| A2 | All components free; ~10 blocks free; remaining blocks and all templates Pro | Templates-only is a thin value prop — a buyer needs one and the product is spent. All-blocks-Pro makes the free tier feel like a demo, and the free tier is the entire distribution channel | Spec A §D2 |
| A3 | Blocks to `components/blocks/<name>/` | Preserves `components/ui` = "primitives, regenerable"; per-block directory prevents filename collisions | Spec A §D1 |
| A4 | Pro served by an API deployed from the private repo, gated on Polar license keys | No GitHub PAT in the system; secrets never enter the public repo's contributor surface | Spec A §D3 |
| A5 | Registry index public including Pro entries | Discovery, lock badges in docs, useful error messages. Only source bytes are gated | Spec A §D3 |
| A6 | Templates install into existing projects; no scaffolder | `npx nika create` revisited on Pro-user feedback | Spec A §D3 |
| A7 | Both repos in the PHS organisation | GitHub Free orgs include unlimited private repos with unlimited collaborators | Spec A §D4 |
| A8 | $149 personal / $349 team-of-5, one-time | Team tier is $70/seat, a 53% discount against five individual licenses — normal band, and makes the team tier obvious for any real company | Spec A §D5 |
| A9 | 14-day refunds, void after 5 Pro installs | Closes install-everything-then-refund abuse while keeping a visible refund policy, which aids conversion. Enforced by `increment_usage` on a call the CLI already makes | Spec A §D5 |
| A10 | Polar as merchant of record; Stripe direct rejected | Stripe PH is invite-only with PHP-only settlement; more importantly, direct Stripe would make PHS liable for consumption tax in every jurisdiction sold into | Spec A §D5 |
| A11 | Pro is waitlist-only at launch | Zero blocks exist on day one; the waitlist list is worth more than early revenue when deciding which blocks to build | Spec A §D6 |
| G1 | Pro docs must not render full Pro source | Otherwise the paywall is decorative — humans and agents both copy it | §3.4 |
| G2 | Agents never handle the license key | Agent context leaks into transcripts, logs, and commits. All agent flows route through the CLI | §3.4 |
| G3 | MCP server free, scoped by license | Produces an in-context upsell at the moment of need; gating it would trade the best conversion mechanism for a feature bullet | §3.4 |

---

## 6. Verified external constraints

Facts checked against source rather than assumed. Each changed a decision.

| Finding | Consequence | Source |
|---|---|---|
| GitHub Free **for organisations** includes unlimited private repositories with unlimited collaborators. Free orgs forgo repository rules and branch protection on private repos, CODEOWNERS, required reviewers, draft PRs, Pages and Wikis on private repos; capped at 2,000 Actions minutes/month (public repos unmetered) | Both repos go to the org. No paid plan needed | [github.com/pricing](https://github.com/pricing) |
| Publishing **public** npm packages is free at any volume. The $7/month buys private packages only | No npm cost ever. Components are not packages — they are source files fetched over HTTP. The CLI is the only npm artifact | [npm docs](https://docs.npmjs.com/upgrading-to-a-paid-organization-plan/) |
| Vercel Hobby is restricted to non-commercial personal use; commercial usage expressly includes *"advertising the sale of a product or service"* | A landing page advertising Nika Pro does not qualify for the free tier, even in waitlist state. Fallback hosting costs $20/month | [Vercel fair use](https://vercel.com/docs/limits/fair-use-guidelines) |
| Polar supports Philippines payouts via Stripe Connect Express, across 190+ countries | Polar is viable as merchant of record from PH | [Polar supported countries](https://polar.sh/docs/merchant-of-record/supported-countries) |
| Stripe Philippines is invite-only with PHP-only settlement; no USD payout, limited Connect, no Atlas for PH-registered businesses | Stripe direct rejected | [Stripe global](https://stripe.com/global) |
| Polar license keys support activation limits and per-key usage quotas, with `increment_usage` on the validate endpoint | Seat limits and the 5-install refund cap are enforceable without additional infrastructure | [Polar license keys](https://polar.sh/docs/features/benefits/license-keys) |
| EU consumer law grants a 14-day right of withdrawal on digital goods, waivable only with express consent to immediate delivery and acknowledgment of losing the right | Polar is MoR for EU sales, so Polar's refund policy governs. The 5-install condition must be confirmed with Polar, not assumed | — |

---

## 7. Open questions

| # | Question | Blocks | Notes |
|---|---|---|---|
| 1 | **22 components vs. the prototype's "40+"** — build ~18 more, or change the number? | B, C | Content decision. Building more delays launch; changing the number is free and honest |
| 2 | How should Fumadocs' `fd-*` variables relate to Nika tokens — mapped, or scoped to Fumadocs chrome only? | B | Determines whether the docs site can be fully themed by `data-accent` |
| 3 | Which ~10 blocks are free? | F | Principle is set (§4 F); the list is not |
| 4 | Template lineup | F | Prototype gestures at Admin Dashboard, SaaS Landing, App Shell |
| 5 | Does Polar's refund policy permit the 5-install condition? | Pro launch only | Confirm before building a pricing page that promises it |
| 6 | `nikaui.pro` as an additional domain? | — | Cosmetic. Safe to add later without touching the CLI if the subdomain is kept as an alias |

**Dependencies outside the codebase:**

- **PHS re-registration.** Registered 2025, closed 2026, re-registration planned. Polar onboarding needs a seller entity, and changing that entity later is disruptive — tax records and invoices issue under whoever is registered. Re-register PHS *before* Polar onboarding; do not onboard as an individual to save time. Not on the critical path: the waitlist launch needs no payment provider at all.
- **Business structure.** PH sole proprietorship under PHS is assumed. A US LLC exists mainly to solve "I cannot get Stripe," which an MoR already solves without adding a second tax jurisdiction and annual IRS filings. Confirm with a Philippine accountant handling foreign income before registering.
- **Domain purchase.** `nikaui.dev` is available and unpurchased.

---

## 8. Explicitly out of scope

- **Vue and Nuxt.** The registry is React at the bone — `@headlessui/react`, `motion/react`, `.tsx` with `React.forwardRef`. A Vue version is a second component set written from scratch against Headless UI Vue and Motion for Vue: a separate product line, not a CLI option. The page-destination prompt covers arbitrary paths *within React*, spanning Next.js, Vite, Remix, TanStack Start, and React-in-Astro.
- **`npx nika create` project scaffolding.** Revisit on Pro-user feedback.
- **Figma design kit.** The prototype's pricing card lists one. Not committed to.
