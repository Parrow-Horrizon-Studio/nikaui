# Nika UI — Master Plan

**Last updated:** 2026-08-09
**Status:** Living document

This is the single reference for Nika UI. It holds the product definition, current state, architecture, and the full sequence of work. Individual sub-projects get their own specs as they are brainstormed; this document links to them and records the decisions that came out of them.

**How to use it:** read §4 to see what is being built and in what order, and §5 for the component catalogue. Read §6 for what has already been decided and why. Read §8 for what is still open. Take one sub-project at a time — each gets brainstormed into a spec, planned, then implemented.

---

## At a glance

| Phase | What | Size | Waiting on | Unblocks | Status |
|---|---|---|---|---|---|
| **A** | Monetization & distribution — boundary, delivery, pricing, launch posture | — | — | C, E, F | ✅ **Specced** |
| **B** | Design-system foundation — tokens, motion API, registry schema | **L** | — | C, D, F, G | ✅ **Specced** |
| **C** | Landing page — port the prototype onto real Next.js | M | A, B | — | Not started |
| **D** | Documentation & showcase — all 22 components, `llms.txt`, `AGENTS.md` | **L** | A, B | G | ✅ **Executed 2026-08-13 — migration only** |
| **E** | Repo migration & ops — org transfer, protection, CI, npm identity | S–M | A ✅ | — | ✅ **Specced — do first** |
| **F** | Block & template lineup — choose, then build | M decide / L build | A, B | G | Not started |
| **G** | Agent surface — MCP server, Pro agent skill | M | B, D, F | — | Not started |

*Sizes are relative to one another, not time estimates.*

**Two scheduling notes.** **E runs first** — it depends only on A, so B's commits land in their permanent home rather than transferring mid-flight, and it fixes distribution strings B would otherwise write twice. **F splits in two** — choosing the lineup needs only A, while building blocks needs B; deciding early lets C's Templates section show real names instead of placeholders.

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
| `packages/cli/package.json` | Declares the name `nika-ui`, which is **tombstoned on npm** — an entry with zero versions and zero maintainers, which npm does not permit reusing. `npm publish` would fail. |
| Everywhere `npx nika` appears | `nika` on npm belongs to another publisher. The prototype hero, prototype docs page, current landing page, and every component doc advertise a command that runs someone else's code. |
| repository root | **No `LICENSE` file.** The README and CLI `package.json` both claim MIT; absent a license file the legal default is all rights reserved. |

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
Parrow-Horrizon-Studio/nikaui      (public, org)
  apps/web          → nikaui.dev       landing + OSS documentation
  packages/         registry, cli, eslint-config, typescript-config

Rowee13/nikaui-pro                 (private, personal account)
  apps/pro          → pro.nikaui.dev   Pro landing, Pro docs, block browser,
                                       checkout — and the registry API routes
  packages/blocks   → Pro block and template source
```

The Pro repository stays on the personal account, which already carries Pro. A free organisation cannot apply branch protection to *private* repositories; personal Pro can, and carries 3,000 Actions minutes rather than 2,000. Nobody outside ever sees that repository — buyers receive files through the API, contributors only touch the public repo — so the split costs nothing in perception. Transfer to the org is intended once PHS carries a paid plan; GitHub transfers configure redirects automatically, so this is deferred cost rather than sunk cost.

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
| **B** | Design-system foundation | — | **Specced** |
| **C** | Landing page | A, B | Not started |
| **D** | Documentation and showcase | A, B | Not started |
| **E** | Repository migration and ops | A | **Specced** |
| **F** | Block and template lineup | A, B | Not started |
| **G** | Agent surface — MCP and skill | B, D, F | Not started |

### A — Monetization and distribution ✅

Full spec: [`docs/superpowers/specs/2026-08-09-nikaui-monetization-design.md`](superpowers/specs/2026-08-09-nikaui-monetization-design.md)

Fixes the free/Pro boundary, delivery architecture, repository topology, commercial terms, and launch posture. Summarised in §3 above; see the spec for rationale.

### B — Design-system foundation ✅

Full spec: [`docs/superpowers/specs/2026-08-09-nikaui-design-system-foundation.md`](superpowers/specs/2026-08-09-nikaui-design-system-foundation.md)

**Goal:** everything visual sits on this. It must be right before C and D consume it.

- Own token vocabulary — `canvas` / `surface` / `overlay` / `muted`, `content` / `content-muted` / `content-subtle`, `line` / `line-strong`. Scales, not paired foregrounds. Prototype OKLCH values.
- `--nika-*` CSS variables with clean utilities via `@theme inline`; `.dark` for theme, `[data-accent]` for the five accents.
- Motion preset API — `none` / `snap` / `glide` / `spring` / `bounce`, default `spring`, with an optional provider and reduced-motion override.
- `nika init` writes `nika-tokens.css` plus one `@import`; `packages/tailwind-config` folds into `packages/registry`.
- Registry schema changes and the CLI path-flattening fix, both carried from spec A §3.
- Ship 27 components — the 22 built plus alert, textarea, radio-group, slider, progress.

**B is completion work, not refactoring.** `init` never writes the token layer and `REGISTRY_BASE_URL` points at a nonexistent account, so the CLI has never worked outside this monorepo (§2.4).

#### B — executed 2026-08-11

Plan: [`docs/superpowers/plans/2026-08-11-design-system-foundation.md`](superpowers/plans/2026-08-11-design-system-foundation.md). Branch `feat/design-system-foundation`, 29 commits, 11 planned tasks plus one unplanned documentation task.

**The bar was met and independently reproduced.** A reviewer ran `init --yes` then `add` into its own scratch project outside the repository, compiled with Tailwind 4.3.3, and confirmed generated rule selectors — `.bg-canvas {`, `.bg-primary {` — backed by real OKLCH values, with two negative controls that both correctly failed. This is the first time in the project's history that a consumer outside the monorepo gets working, themed components.

The plan itself was amended eight times during execution. A pre-flight scan found 13 defects in it before Task 1 ran, five of which were verifications that could not fail; the token mapping table, described as exhaustive, was found incomplete four separate times, each by someone enumerating the tree rather than trusting the table.

**Carried forward — not done, and why:**

| Item | Owner | Note |
|---|---|---|
| **Merge to `main` before publishing the CLI** | release | The published CLI's remote fallback points at `main`, where `lib/motion.ts` and `ui/button.tsx` still hold pre-migration content. Over a severed network `add button` succeeds and silently delivers stale files; after the anchor guard landed, `init` fails outright instead. Publishing before merging ships a broken CLI |
| Violet, azure and rose fail AA for `primary-fg` on `primary` | **B follow-up** | 3.54 / 3.21 / 3.34 at rest, azure hover 2.69. Same defect class as `--nika-danger`, which was fixed to 4.74. Retuning three accents is a palette decision, not a mechanical fix |
| Danger button hover still misses AA | **B follow-up** | `hover:bg-danger/90` measures 4.18:1. Rest is now 4.74 |
| ~~Five components ship undocumented~~ — **closed by D, 2026-08-13** | — | `alert`, `textarea`, `radio-group`, `slider`, `progress` all got real pages. `nikaui list` and the docs index now both report 27 |
| Doc pages are one-prop stubs | **unscheduled sub-project (see D's own carried-forward)** | D's audit found the true count is **18**, not the 13 estimated here — each carries an `## API Reference` documenting only `motion`, replacing "Documentation coming soon." Honest, but not a prop table. Now marked by frontmatter rather than merely estimated |
| Toast lacks `warning` and `info` variants | **Sub-project D/F** | Alert has all five and the tokens exist. A missing feature, not a defect |
| Danger toast composites over page content | **Sub-project D/F** | `bg-danger/10` on a fixed overlay with no opaque base. `success` behaved this way before B; fixing it needs a layering change, not a class swap |
| `apps/web` fetches fonts at build time | **user decision** | `next/font/google` (`Manrope`, `JetBrains_Mono` — `apps/web/src/app/layout.tsx`) means `ci`, a required status check, depends on `fonts.googleapis.com` being reachable on a cold cache. Formerly `apps/docs`; the dependency moved with the app, unchanged, when D deleted it |
| `packages/cli` has no test suite | **B follow-up** | `isValidStylesheetPath`, `onCancel`, `--yes` and the token guard are verified only by manual end-to-end runs. The registry suite now guards `init`'s three substitution anchors; nothing else in the CLI is tested |
| `resolveTarget` does not sanitise `..` in a target | **Sub-project F/G** | Unreachable today — targets come only from the bundled first-party manifest. Must close before custom registries |
| `access` and the `styles` resolution bucket are unused | **Sub-project F** | Schema v2 pre-wired both; `add` never reads either |
| §5's "22 built" arithmetic | **MASTER-PLAN refresh** | Three references predate the five new components. Re-baselining belongs with a broader refresh, not a token migration |
| Visual confirmation of theming, accents and motion feel | **user** | No browser was available in this environment. Structure and unit tests cover the mechanics; nobody has looked at it |

### C — Landing page

Full spec: [`docs/superpowers/specs/2026-08-12-nikaui-landing-page.md`](superpowers/specs/2026-08-12-nikaui-landing-page.md)

**Goal:** port the prototype landing page onto real Next.js and React, using B's tokens.

Prototype sections, in order: nav with theme toggle → hero with rays, sun, live component window, stats → features grid → motion highlight → ~~templates~~ → pricing → CTA band → footer.

- The landing page moves to a **new `apps/web`**, which sub-project D grows into the documentation site so `apps/docs` can be deleted. One site, one set of chrome, built once.
- The page is a **live demonstration** — nine real components in the hero window, five real presets in the motion section, and an accent switcher that retints the whole page.
- Pricing section ships fully built with real numbers, **three tiers** (Free / $149 Personal / $349 Team); both paid CTAs are "Join the waitlist" → email capture through Loops.
- ~~Templates section ships with placeholder cards, honestly labelled.~~ **Superseded 2026-08-12: the Templates section is cut entirely.** `pro.nikaui.dev` is a separate site whose job is showing templates and blocks with real counts once they exist; a placeholder grid here duplicates that while having nothing to put in it. No Figma design kit is mentioned either — not built, not planned, revisit at v2 or on demand.
- Theme defaults to **system**, not dark. `apps/docs` currently defaults to dark; D should align it rather than carry that across.
- All prototype copy is reviewed against reality before shipping — no "40+ components" unless 40+ exist. The full audit is spec §C4; it found eleven corrections, two of which changed what gets built.

### D — Documentation and showcase ✅

**Goal:** the prototype's Documentation and Components pages, covering all 22 existing components.

- Restructure Fumadocs to match the prototype's layout and navigation.
- Live previews for every component, with variant and motion-preset switchers.
- Absorbs agent Tiers 0 and 1 — `llms.txt` and the `AGENTS.md` snippet.
- **Pro doc pages must not render full source** (§3.4).

#### D — executed 2026-08-13

Spec: [`docs/superpowers/specs/2026-08-12-nikaui-docs-migration.md`](superpowers/specs/2026-08-12-nikaui-docs-migration.md). Plan: [`docs/superpowers/plans/2026-08-12-docs-migration.md`](superpowers/plans/2026-08-12-docs-migration.md). Branch `spec/docs-migration`, 8 code-bearing tasks (T1–T8); a ninth, verification-only, carries no code.

The documentation now lives in `apps/web`, on port 3000. **`apps/docs` no longer exists** — deleted in T8 once every migrated route matched its `apps/docs` original under the parallel two-port run the plan used as its safety mechanism. (Ruling R13, T8: the gate measures "does the route resolve," following redirects, rather than requiring a literal `200` — `/docs` is `redirect("/docs/guide")`, byte-identical in both apps, and a bare 307 was never going to read `200` against either one.)

Delivered: the documentation routes render inside C's site chrome; search and the favicon are wired; every bare same-page fragment in the nav/footer resolves; the honesty gate (`check-copy`) now scans documentation prose, not just application code; and the five components B shipped without pages — `alert`, `progress`, `radio-group`, `slider`, `textarea` — got real ones, closing the five 404s that existed against a landing page claiming 27 components.

**Not delivered, and not claimed:** of 27 component pages, **18 are still stubs** — nine are complete (the four that predate this sub-project, plus the five written here). Stubs are now marked by a single `status: stub` frontmatter field, read by both the page notice and the derived component index, rather than by prose duplicated in three places that could silently drift. Writing the eighteen is explicitly out of scope here — its own, not-yet-scheduled sub-project. "D executed" means the migration is done, the five 404s are closed, and the stub/complete boundary is now honest and mechanically derived — not that the documentation is complete.

**Carried forward:**

| Item | Owner | Note |
|---|---|---|
| Eighteen component pages remain `status: stub` | **unscheduled sub-project** | Each carries an `## API Reference` documenting only `motion`; writing real prop tables for all eighteen is its own sub-project, deliberately not this one |
| `ComboboxTrigger` rejects native input props (`placeholder`, `id`, `name`, `autoFocus`) | **B follow-up — Ruling R11** | `packages/registry/src/ui/combobox.tsx:17-19` leaves a generic uninstantiated. D's combobox preview ships without a placeholder as a workaround; the registry itself is out of D's scope and untouched |
| Toast lacks `warning`/`info` variants; danger toast composites over page content | **Sub-project F** | Unchanged from B's carried-forward list below — D documented the components as they are, it did not change them |
| Live previews have no variant or motion-preset switcher | **unscheduled sub-project** | Chartered above ("Live previews for every component, with variant and motion-preset switchers"); what shipped is one fixed demo per component, no switching. Not started |
| `llms.txt` does not exist | **unscheduled sub-project** | Chartered above as part of "Absorbs agent Tiers 0 and 1." Not started |
| Agent Tiers 0 and 1 (`llms.txt` and the `AGENTS.md` snippet) | **unscheduled sub-project, likely G** | Chartered above, not started. `apps/web/AGENTS.md` is a `next dev` build artefact, not this deliverable — it is gitignored and never committed |
| `checkbox` and `radio-group` use a `ring-2 ring-ring` focus pattern at 16px | **measure, do not assume** | The same construction rendered an *invisible* focus ring at 20px on the accent switcher. Judged materially different here — the switch is a filled accent-coloured circle wearing an accent-derived translucent ring (near-zero self-contrast against its own fill), while checkbox/radio sit on canvas with `ring-offset-2` giving a neutral gap — but this has not been measured, only reasoned about. Check contrast at 16px in both themes before assuming it is fine; do not let it be rediscovered by accident a third time |

### E — Repository migration and ops ✅

Full spec: [`docs/superpowers/specs/2026-08-09-nikaui-repository-migration-ops.md`](superpowers/specs/2026-08-09-nikaui-repository-migration-ops.md)

**Goal:** move to the organisation, protect the repo, and fix the distribution identity. Runs **before B**, so B's 27-file migration lands in the permanent home.

**E1 — now:**
- Transfer to `Parrow-Horrizon-Studio/nikaui`; create `Rowee13/nikaui-pro` private scaffold
- Branch protection on `main` with administrators excluded — implemented as a **repository ruleset**, not classic rules (see E3)
- Security: Dependabot **alerts** (automated PRs off — see E3), secret scanning with push protection, private vulnerability reporting, CodeQL, read-only default `GITHUB_TOKEN`
- CI: `install → lint → check-types → build` on PR and push
- Community files: `LICENSE` (**blocking**), `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, issue and PR templates, `.nvmrc`, `.editorconfig`
- npm identity: package `nikaui`, bins `nikaui` + `nika`, `@nikaui` org scope — ✅ **both reserved 2026-08-09** with `0.0.0` stubs; first real release is `0.1.0` after B
- Fix `REGISTRY_BASE_URL` and the stale `README.md` (§2.4)

**E2 — deferred until C and D exist:** Coolify VPS, DNS, TLS, deploy pipeline. Nothing to deploy yet. Domains (`nikaui.dev`, `pro.nikaui.dev`) are purchased directly by the maintainer; `nikaui.pro` remains under consideration.

**E3 — executed 2026-08-10.** Delivered as planned, with one substitution. `main` is protected by a pre-existing repository **ruleset** (`main-branch-protection`, id `14501407`, created 2026-03-30) rather than classic branch protection. The spec's premise that rulesets require a paid GitHub plan is **false** — the ruleset was already active and enforcing on this Free organisation and travelled through the transfer, and classic protection layered on top would not have relaxed it, because GitHub applies the most restrictive of both. It now carries `deletion`, `non_fast_forward`, `required_linear_history`, `pull_request`, and `required_status_checks (["ci"])`, with repo-admin in `bypass_actors` — the same intent E4 describes, by the mechanism GitHub actually enforces here.

**Carried forward from E — these have no other home, so they live here:**

| Item | Trigger | Detail |
|---|---|---|
| Raise `required_approving_review_count` back to `1` | **A second contributor joins** | It is `0` today because a solo maintainer cannot approve their own pull request. Blast radius is currently zero — one collaborator. This is the E4 tightening commitment, recorded here because nothing else tracks it |
| ~~`init` does not write the CSS token layer~~ — **closed by B, 2026-08-11** | — | `init` now copies `nika-tokens.css` beside the consumer's stylesheet and inserts the `@import` after `@import "tailwindcss"`, idempotently, refusing to overwrite a token file the user has edited. Verified end-to-end outside the monorepo. `packages/tailwind-config` was deleted in the same sub-project |
| Reconcile the `pnpm` pin | **Next commit touching a lockfile** | `nikaui` declares `pnpm@9.0.0`, `nikaui-pro` declares `pnpm@9.15.3`. Both are pnpm 9 and both write lockfile 9.0, so this is cosmetic today |
| `packages/cli/src/index.ts` hard-codes `.version("0.1.0")` | **First publish** | Duplicates `package.json`; correct today, will drift |
| ~~Decide `nikaui-pro`'s owner~~ — **settled, no action** | — | It stays on the personal account: a Free organisation cannot branch-protect private repositories, and personal Pro can. Transfer to the organisation if and when PHS carries a paid plan; GitHub transfers configure redirects automatically, so this is deferred cost, not sunk cost. A `LICENSE` naming Parrow Horrizon Studio as copyright holder on a personally-hosted repository is ordinary and not a conflict — the host and the rights holder are different things |
| Org security configuration — **optional, likely unnecessary** | **Only if security PRs actually start appearing** | `.github/dependabot.yml` is gone, so weekly version-update PRs are off for good. Dependabot *security* updates remain forced on by `Parrow-Horrizon-Studio-org-config-1` (id 248228, `enforcement: enforced`) and the repo-level API refuses to override it. In practice this now generates nothing: security updates only open a PR when a fixing version exists, and the single remaining alert has none. If it ever does become noisy, set `dependabot_security_updates` to disabled in [that configuration](https://github.com/organizations/Parrow-Horrizon-Studio/settings/security_products/configurations/edit/248228) (org-wide) or detach this repo from it (narrower). Alerts stay on either way |
| Consider `release-please` | **At the first real release (`0.1.0`, after B)** | It automates version bump, CHANGELOG and GitHub release from Conventional Commits, which `CONTRIBUTING.md` already mandates. It is not a Dependabot substitute — different problem entirely |
| One residual Dependabot alert | **When `tsup` widens its `esbuild` range** | Alerts went **83 → 1** on 2026-08-10. `next` 16.2.0 → 16.2.11 cleared its own 46; 16.2.11 → 16.3.0 then cleared 5 more, because 16.3.0 pins `postcss 8.5.23` (exactly what those advisories require) and `sharp ^0.35.3`. Fixed upstream rather than with `pnpm.overrides` — forcing versions past what Next tested against, on two packages load-bearing for its build and image optimization, was not a risk worth taking. The last alert is `esbuild 0.27.7` under `tsup`, which is already at its latest and still requires `esbuild ^0.27.0`, so there is no fix to take. LOW severity, devDependency, never shipped |

### F — Block and template lineup

**Goal:** decide what actually gets built, and in what order.

- Select the ~10 free blocks. Principle: *free blocks are the sections every site has; Pro blocks are the ones that take a day each.* Navbars, footers, heroes, CTA bands, a simple auth form, empty states, 404s are free. Data tables with filtering, dashboard shells, command palettes, multi-step forms, settings panels, checkout flows are Pro.
- Catalogue the Pro blocks.
- Decide the template list. The prototype gestures at Admin Dashboard, SaaS Landing, and App Shell.

### G — Agent surface

**Goal:** Tiers 2 and 3 from §3.4 — the MCP server and the Pro agent skill.

Sequenced last deliberately: the MCP tool surface should be designed against B's finished registry schema and F's real catalogue, not guessed at.

---

## 5. Component catalogue

The target component set, merged from the two most complete React libraries in this space and normalised to one vocabulary. Duplicate concepts under different names were collapsed: modal → `dialog`, divider → `separator`, breadcrumbs → `breadcrumb`, radio → `radio-group`, autocomplete → `combobox`.

**Those libraries are reference only.** Names, grouping, variants, and API surface are Nika's own. A single sentence in the documentation acknowledges the inspiration; **nothing in the codebase, component names, registry entries, or docs attributes any component to another library.**

### Wave 1 — first ship (27)

**Built (22):** accordion · alert-dialog · aspect-ratio · avatar · badge · button · card · checkbox · combobox · dialog · dropdown-menu · input · label · popover · select · separator · skeleton · spinner · switch · tabs · toast · tooltip

**To add (5)** — already designed in the prototype stylesheet, all simple: alert · textarea · radio-group · slider · progress

### Wave 2 — core completion (23)

avatar-group · breadcrumb · button-group · code · collapsible · context-menu · drawer · empty · field · form · hover-card · input-group · input-otp · kbd · link · menubar · navigation-menu · number-input · pagination · scroll-area · table · toggle · toggle-group

### Wave 3 — complex, high effort (13)

calendar · carousel · chart · command · data-table · date-input · date-picker · date-range-picker · image · listbox · resizable · scroll-shadow · sidebar

### Wave 4 — AI and chat surfaces (6)

attachment · bubble · marker · message · message-scroller · questionnaire

A coherent cluster rather than scattered additions — build as one wave or not at all.

### Deliberately excluded

| Excluded | Reason |
|---|---|
| ripple | A Material-style effect that conflicts with the spring-preset motion identity |
| spacer | A div with margin; Tailwind spacing covers it |
| direction | An RTL utility, not a component |
| typography | Tailwind's typography plugin covers it |
| native-select | A variant of `select`, not a separate component |
| chip | A dismissible variant of `badge` |
| user | Composition of `avatar` and text; a usage example, not a component |
| navbar | Belongs to the block catalogue (sub-project F), not the component registry |

**Target total: 69.** Waves 3 and 4 are aspirational and should be re-prioritised against waitlist feedback rather than built in listed order — the whole point of shipping at 27 is learning which of these people actually ask for.

---

## 6. Decisions ledger

| ID | Decision | Rationale | Where |
|---|---|---|---|
| A1 | Three artifact kinds: component, block, template | Distinguished by reuse pattern, which is what determines install path and pricing | Spec A §D1 |
| A2 | All components free; ~10 blocks free; remaining blocks and all templates Pro | Templates-only is a thin value prop — a buyer needs one and the product is spent. All-blocks-Pro makes the free tier feel like a demo, and the free tier is the entire distribution channel | Spec A §D2 |
| A3 | Blocks to `components/blocks/<name>/` | Preserves `components/ui` = "primitives, regenerable"; per-block directory prevents filename collisions | Spec A §D1 |
| A4 | Pro served by an API deployed from the private repo, gated on Polar license keys | No GitHub PAT in the system; secrets never enter the public repo's contributor surface | Spec A §D3 |
| A5 | Registry index public including Pro entries | Discovery, lock badges in docs, useful error messages. Only source bytes are gated | Spec A §D3 |
| A6 | Templates install into existing projects; no scaffolder | `npx nika create` revisited on Pro-user feedback | Spec A §D3 |
| A7 | Public repo in the PHS organisation; **private Pro repo on the personal account** | A free org can host private repos, but cannot branch-protect them. Personal Pro can, and nobody outside ever sees that repo. Transfer once PHS is paid | Spec A §D4, amended by Spec E §E1 |
| A8 | $149 personal / $349 team-of-5, one-time | Team tier is $70/seat, a 53% discount against five individual licenses — normal band, and makes the team tier obvious for any real company | Spec A §D5 |
| A9 | 14-day refunds, void after 5 Pro installs | Closes install-everything-then-refund abuse while keeping a visible refund policy, which aids conversion. Enforced by `increment_usage` on a call the CLI already makes | Spec A §D5 |
| A10 | Polar as merchant of record; Stripe direct rejected | Stripe PH is invite-only with PHP-only settlement; more importantly, direct Stripe would make PHS liable for consumption tax in every jurisdiction sold into | Spec A §D5 |
| A11 | Pro is waitlist-only at launch | Zero blocks exist on day one; the waitlist list is worth more than early revenue when deciding which blocks to build | Spec A §D6 |
| B1 | Own token vocabulary; scales not paired foregrounds | Copy-paste into a project with another library collides on `--primary`/`--background`; and the existing `-foreground` pairs already hold identical values | Spec B §B1 |
| B2 | `--nika-*` variables, unprefixed utilities via `@theme inline` | The collision that silently corrupts colour is the CSS-variable one; utility overlap surfaces as a build-time conflict instead. Keeps owned code readable | Spec B §B2 |
| B3 | `.dark` for theme, `[data-accent]` for accent | next-themes' default, which Fumadocs already wires, and Tailwind's `dark:` convention — consumers reconfigure nothing | Spec B §B3 |
| B4 | Motion presets are a *feel*, not an animation: `none`/`snap`/`glide`/`spring`/`bounce` | One name must mean something coherent across components animating different properties. Presets-as-animations do not generalise | Spec B §B4 |
| B5 | Reduced motion overrides even an explicit prop | A library selling animation is the one that has to get this right | Spec B §B4 |
| B6 | `init` writes a separate `nika-tokens.css` + one `@import` | Keeps the ownership promise while giving updates a file to replace wholesale; consumer overrides live after the import | Spec B §B5 |
| B7 | Ship 27 components, catalogue the rest | Components are the free tier, blocks are the paid one — months on components 28–69 delays the revenue path while guessing which matter | Spec B §B7 |
| E1 | Advertised command becomes `npx nikaui`; bins `nikaui` + `nika` | `nika` on npm belongs to another publisher and `nika-ui` is tombstoned. The short bin still serves anyone who installs the package | Spec E §E5 |
| E2 | npm **organisation** named `nikaui` for the `@nikaui` scope | A scope maps to a user or org of the same name — `@nikaui/*` cannot be published from a personal account. Orgs are free for public packages | Spec E §E5 |
| E3 | Reserve both names with stub publishes now | npm has no reservation mechanism. `nika` and `nika-ui` were both lost exactly this way | Spec E §E5 |
| E4 | Branch protection with administrators **excluded**, tighten at v1.0 | Contributors hit the full gate from day one; self-merging B's 27-file rewrite through PRs is friction with no review benefit at one contributor | Spec E §E2 |
| E5 | Hosting deferred until C and D exist | Nothing to deploy — the docs app is a stale page B is about to rewrite. Standing up DNS and TLS for it is work that would be redone | Spec E §E7 |
| G1 | Pro docs must not render full Pro source | Otherwise the paywall is decorative — humans and agents both copy it | §3.4 |
| G2 | Agents never handle the license key | Agent context leaks into transcripts, logs, and commits. All agent flows route through the CLI | §3.4 |
| G3 | MCP server free, scoped by license | Produces an in-context upsell at the moment of need; gating it would trade the best conversion mechanism for a feature bullet | §3.4 |

---

## 7. Verified external constraints

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

## 8. Open questions

| # | Question | Blocks | Notes |
|---|---|---|---|
| 1 | Which ~10 blocks are free? | F | Principle is set (§4 F); the list is not |
| 2 | Template lineup | F | Prototype gestures at Admin Dashboard, SaaS Landing, App Shell |
| 3 | Does Polar's refund policy permit the 5-install condition? | Pro launch only | Confirm before building a pricing page that promises it |
| 4 | `nikaui.pro` as an additional domain? | — | Cosmetic. Safe to add later without touching the CLI if the subdomain is kept as an alias |

*Resolved: the component-count question (ship 27, catalogue in §5) and the Fumadocs token relationship (one-way `--fd-*` ← `--nika-*` mapping, docs app only) — both settled in sub-project B.*

**Dependencies outside the codebase:**

- **PHS re-registration.** Registered 2025, closed 2026, re-registration planned. Polar onboarding needs a seller entity, and changing that entity later is disruptive — tax records and invoices issue under whoever is registered. Re-register PHS *before* Polar onboarding; do not onboard as an individual to save time. Not on the critical path: the waitlist launch needs no payment provider at all.
- **Business structure.** PH sole proprietorship under PHS is assumed. A US LLC exists mainly to solve "I cannot get Stripe," which an MoR already solves without adding a second tax jurisdiction and annual IRS filings. Confirm with a Philippine accountant handling foreign income before registering.
- **Domain purchase.** `nikaui.dev` is available and unpurchased.

---

## 9. Explicitly out of scope

- **Vue and Nuxt.** The registry is React at the bone — `@headlessui/react`, `motion/react`, `.tsx` with `React.forwardRef`. A Vue version is a second component set written from scratch against Headless UI Vue and Motion for Vue: a separate product line, not a CLI option. The page-destination prompt covers arbitrary paths *within React*, spanning Next.js, Vite, Remix, TanStack Start, and React-in-Astro.
- **`npx nika create` project scaffolding.** Revisit on Pro-user feedback.
- **Figma design kit.** The prototype's pricing card lists one. Not committed to.
