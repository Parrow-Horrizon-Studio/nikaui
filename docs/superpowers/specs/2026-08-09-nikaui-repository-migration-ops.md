# Nika UI — Repository Migration and Operations

**Date:** 2026-08-09
**Status:** Approved
**Scope:** Sub-project E. Repository topology, branch protection, CI, community health files, npm identity, and hosting.
**Parent:** [`docs/MASTER-PLAN.md`](../../MASTER-PLAN.md) — the single reference for Nika UI. This spec is the deep-dive behind decisions E1–E7 in its ledger.

---

## 1. Context

E is mechanical and depends only on sub-project A, which is complete. It runs **before** B so that B's 27-file token migration lands in the repository's permanent home rather than being transferred mid-flight — and because several URL strings B touches change during the transfer anyway.

Two facts established while scoping this spec change what E must cover:

- **The advertised CLI command does not exist.** `nika` on npm belongs to another publisher, and `nika-ui` — the name the CLI currently declares — is a tombstoned entry with zero versions and zero maintainers, which npm does not permit reusing. `npx nika add button` appears in the prototype's hero, its documentation page, the current landing page, and every component doc. All of it advertises someone else's package.
- **There is no `LICENSE` file.** The README and the CLI's `package.json` both claim MIT, but absent a license file the legal default is all rights reserved. For a project whose entire pitch is "MIT licensed, you own the code," this is the most important missing file in the repository.

---

## 2. Decisions

### E1 — Repository topology

| Repository | Visibility | Owner | Contents |
|---|---|---|---|
| `Parrow-Horrizon-Studio/nikaui` | public | PHS organisation | components, CLI, docs site, landing page |
| `Rowee13/nikaui-pro` | private | personal account | Pro blocks, templates, `apps/pro` with the registry API |

**The public repository moves to the organisation.** The org already exists (`Parrow-Horrizon-Studio`, created 2025-01-11). The source repository has zero forks, so the transfer is clean and there is no community to notify.

**The private repository stays on the personal account**, which already carries a Pro subscription. This is a deliberate reversal of the position taken in spec A §D4, which placed both in the organisation.

The reasoning in spec A was that GitHub Free for organisations includes unlimited private repositories with unlimited collaborators — which remains true, and remains the reason the org *could* host it. What the free org cannot do is **branch protection on private repositories**, which personal Pro provides, along with 3,000 Actions minutes rather than 2,000. Since nobody outside ever sees the Pro repository — buyers receive files through the API, contributors only interact with the public repo — there is no brand or perception cost to the split.

**Transfer to the organisation is intended once PHS carries a paid plan.** GitHub repository transfers are straightforward and configure redirects automatically, so this is deferred cost, not sunk cost.

### E2 — Branch protection

`main` on the public repository is protected with **administrators excluded**:

- Require a pull request before merging
- Require status checks to pass (the CI workflow from E4)
- Require conversation resolution before merging
- Block force pushes
- Block deletions
- **Administrators excluded** — contributors are bound by every rule; the maintainer can push to `main` directly

**Classic branch protection rules, not rulesets.** GitHub's documentation states rulesets are *"for customers on GitHub Team and GitHub Enterprise plans,"* while branch restrictions can be enabled *"in public repositories owned by a GitHub Free organization."* Confirm in the UI when applying, as GitHub moves this line periodically.

> ⚠️ **Correction (2026-08-10).** The confirmation this hedge called for did
> happen when Task 6 was executed, and it found the premise above false: a
> repository ruleset (`main-branch-protection`, id `14501407`, created
> 2026-03-30) was already active and enforcing on this Free-plan
> organisation before Task 6 ever ran — rulesets are not gated behind a paid
> plan, at least not as of that date. Classic branch protection was never
> applied; GitHub enforces the union of classic protection and rulesets, so
> adding it on top of an already-enforcing ruleset would have been a
> redundant second gate, not a replacement. The human partner configured the
> existing ruleset directly instead: repo-admin added to `bypass_actors`
> (the ruleset's equivalent of "administrators excluded"),
> `required_approving_review_count` dropped to `0`, and `ci` added as a
> required status check. See the corrected Task 6 Step 4 in the
> implementation plan for the actual mechanism.

**Rationale for excluding administrators.** Sub-project B rewrites the className strings of all 27 components; self-merging that through pull requests adds real friction and produces no review benefit while the project has one contributor. Outside contributors hit the full gate from day one regardless. **Tighten to include administrators at v1.0 or the first outside pull request, whichever comes first.**

### E3 — Security settings

Applied to the public repository, all free at this tier:

- Dependabot alerts — **kept**. Automated pull requests are **off**: `.github/dependabot.yml` (weekly version updates) was removed on 2026-08-10, because nine PRs landed at once on a pre-release repository with one maintainer. Alerts are the half that carries the value; they surfaced 83 findings, 46 of them a single stale Next.js. Dependabot *security* updates remain forced on by the org security configuration `Parrow-Horrizon-Studio-org-config-1` (id 248228, `enforcement: enforced`), so vulnerability PRs can still appear until that configuration is edited
- Secret scanning with push protection
- Private vulnerability reporting
- CodeQL analysis
- **Default `GITHUB_TOKEN` permissions set to read-only**, with workflows requesting elevation explicitly

The last item matters beyond hygiene. Spec A §D3 keeps the registry API and its secrets out of the public repository specifically because a contributor's pull request triggers a preview build with environment variables attached. The public repository holds no secrets by design — a read-only default token enforces that property rather than assuming it.

### E4 — Continuous integration

`.github/workflows/ci.yml` — `install → lint → check-types → build`, on pull request and on push to `main`. These become the required status checks in E2.

Actions minutes are unmetered on public repositories, so this costs nothing. The private Pro repository draws on the personal Pro allowance.

`turbo.json` defines a `test` task, but no test runner is installed and no test files exist — the task is decorative. **It stays that way through E.** Real tests arrive in B, where the motion preset resolver — five-step precedence with a reduced-motion override — is the first thing in this codebase genuinely worth unit-testing.

### E5 — npm identity

| Artifact | Name |
|---|---|
| CLI package | `nikaui` |
| CLI binaries | `nikaui` and `nika` |
| Scope | `@nikaui`, held by an npm **organisation** named `nikaui` |

**The advertised command becomes `npx nikaui add button`.** The short `nika` binary still works for anyone who installs the package as a dev dependency, which costs one line in `package.json` and gives brevity to people who have earned it. The risk of a `.bin/nika` collision with the unrelated `nika` package is negligible and fails loudly.

**An npm organisation is required, not optional.** A scope maps to a user account or an organisation of the same name; publishing `@nikaui/*` from a personal account is impossible unless that account is named `nikaui`. npm organisations are free for unlimited public packages — only private packages are billed. The personal account owns and administers the org, which is how npm organisations always work.

The org is named `nikaui` rather than after the studio because the org name *is* the scope: `@nikaui/mcp` reads correctly, `@parrow-horrizon-studio/mcp` does not. PHS may hold a separate npm organisation for other products; they are independent and both free.

**Both names are reserved immediately with stub publishes** — `nikaui@0.0.0` and `@nikaui/cli@0.0.0`, whose binary prints an "in development" notice. npm has no reservation mechanism; a name is held only once a version exists. Given that `nika` and `nika-ui` were both lost this way, a one-minute stub removes the risk that B completes and the name is gone. Scoped publishes require `--access public` or they attempt a private package and fail against a free organisation.

> ✅ **Done 2026-08-09.** `nikaui@0.0.0` and `@nikaui/cli@0.0.0` are published, public, MIT, maintainer `roweeapor13`. Both names are permanently held. **The implementation plan does not need to repeat this step.**

**The unscoped package is owned by the personal account, and cannot be moved to the organisation.** On npm the scope *is* the ownership: `@nikaui/*` belongs to the org because the scope does, while `nikaui` has no scope and belongs to whoever published it. npm's documentation is explicit that unscoped packages *"are always public"* and are not subject to team-based access control, so `npm access grant <scope:team>` does not apply to them. Only individual maintainers can be added, via `npm owner add`. This is normal — many major packages are unscoped and user-owned alongside an org — and it has no effect on consumers, who only ever type `npx nikaui`.

**Never unpublish either package.** Unpublishing every version of a name locks it for 24 hours and makes it permanently unavailable to anyone who is not the original owner — the exact state `nika-ui` is in. If a release is wrong, bump the version or use `npm deprecate`.

The real release happens after B, when the CLI works. It is `0.1.0`; `0.0.0` is burned and can never be reused.

### E6 — Community health files

| File | Note |
|---|---|
| `LICENSE` | **MIT.** Blocking — without it the repository is all-rights-reserved despite claiming otherwise |
| `SECURITY.md` | A private reporting path. The project ships a commercial tier and a CLI that handles license keys |
| `CONTRIBUTING.md` | pnpm + Turborepo + workspace protocol is not guessable |
| `CODE_OF_CONDUCT.md` | Standard for an organisation-owned OSS project |
| `.github/ISSUE_TEMPLATE/` | Bug report and feature request |
| `.github/pull_request_template.md` | — |
| `.nvmrc`, `.editorconfig` | `engines.node >= 20` is declared but nothing enforces it |

### E7 — Hosting and domains

**Deferred until sub-projects C and D exist.**

There is currently nothing to deploy: the docs application is a stale landing page over Fumadocs defaults that B is about to rewrite. Standing up a VPS, DNS, and TLS for that is work that would be redone, and it consumes Coolify trial time on an empty site.

When it runs: self-hosted VPS under Coolify, shared with other PHS projects, with Vercel Pro at $20/month as fallback. Vercel's free tier is not available — its fair use guidelines restrict Hobby to non-commercial personal use and define commercial usage to include *"advertising the sale of a product or service."*

Domains — `nikaui.dev` and `pro.nikaui.dev` — are purchased by the maintainer directly and are not a task in this spec.

---

## 3. String and reference updates

Every reference that changes as a consequence of E1 and E5:

| Location | Change |
|---|---|
| `packages/cli/src/commands/add.ts:23` | `REGISTRY_BASE_URL` → `https://raw.githubusercontent.com/Parrow-Horrizon-Studio/nikaui/main/packages/registry/src`. The current value points at `nicaui`, a transposition of an account that does not exist, so every remote fetch returns 404 today |
| `packages/cli/package.json` | `name` → `nikaui`; `bin` → `{ nikaui, nika }` |
| `README.md` | Documents an `apps/showcase` merged away in commit `325b75b`; update structure, install commands, and the now-substantiated MIT claim |
| Local git remote | Repoint to the organisation |

Documentation and marketing copy carrying `npx nika` is updated in sub-projects C and D, which have not been written yet — this spec fixes the source of truth so those are written correctly the first time.

---

## 4. Out of scope

- **Hosting, DNS, TLS, deploy pipeline** — E7, gated on C and D.
- **Domain purchase** — handled directly by the maintainer.
- **Contents of `nikaui-pro`** — E creates the scaffold; blocks and templates are sub-project F, the registry API is built alongside them.
- **Documentation and marketing copy updates** — sub-projects C and D.
- **Transferring `nikaui-pro` to the organisation** — deferred until PHS carries a paid plan.

---

## 5. Verification

E is complete when:

1. `github.com/Parrow-Horrizon-Studio/nikaui` is public, `main` is protected, and a test pull request cannot merge with failing CI.
2. A direct push to `main` by the maintainer succeeds — confirming administrators are excluded as intended, not accidentally included.
3. `github.com/Rowee13/nikaui-pro` exists, is private, and contains a Turborepo scaffold.
4. `npm view nikaui` and `npm view @nikaui/cli` both resolve, and `@nikaui/cli` is **public**, not private.
5. The repository shows a green "MIT" license badge and a complete community profile.
6. `curl` against the new `REGISTRY_BASE_URL` returns real file content — the first time this URL has ever resolved.
