# Repository Migration and Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the public repository into the Parrow Horrizon Studio organisation, protect it, give it a working CI and a legally valid licence, and correct the distribution identity so the CLI can actually be published.

**Architecture:** Seven tasks in dependency order. Tasks 1–4 are local file and code changes committed to the existing repository. Task 5 transfers it to the organisation. Tasks 6–7 apply GitHub settings and create the private Pro scaffold. Local work happens first so the transfer carries finished commits rather than landing mid-change.

**Tech Stack:** Turborepo, pnpm 9, Node 22, TypeScript 5.9, GitHub Actions, `gh` CLI 2.92.

**Not in this plan:** hosting, DNS, TLS, and the deploy pipeline. Spec E §E7 defers those until sub-projects C and D exist, because there is currently nothing to deploy — the docs app is a stale page that B rewrites. Domain purchase is handled directly by the maintainer.

**Spec:** [`docs/superpowers/specs/2026-08-09-nikaui-repository-migration-ops.md`](../specs/2026-08-09-nikaui-repository-migration-ops.md)

## Global Constraints

- **Node `>=20`**, pnpm `9`. `.nvmrc` pins `22`.
- **CLI package name is `nikaui`.** Binaries are `nikaui` and `nika`. The name `nika-ui` is tombstoned on npm and must not appear as a package name anywhere.
- **The advertised command is `npx nikaui`, never `npx nika`.** `nika` on npm belongs to an unrelated publisher.
- **Organisation login is `Parrow-Horrizon-Studio`** — exact case matters in URLs.
- **Public repo licence is MIT, © 2026 Parrow Horrizon Studio.** The private Pro repo is **proprietary — never MIT.**
- **npm names are already reserved.** `nikaui@0.0.0` and `@nikaui/cli@0.0.0` are published. **Do not publish, re-publish, or unpublish anything in this plan.**
- **Never unpublish an npm package.** Bump the version or use `npm deprecate`.
- **No reference-library attribution.** shadcn and HeroUI informed the component catalogue; nothing in code, file names, component names, registry entries, or documentation may attribute anything to them.

## A note on testing

This sub-project has no behavioural code to test — it creates configuration files, edits two identity strings, and applies GitHub settings. Spec E §E4 explicitly defers the test harness to sub-project B, where the motion preset resolver is the first thing worth unit-testing.

So where a step produces behaviour, it is verified by running it. Where a step produces a file or a remote setting, it is verified by an exact command with stated expected output. **Every task still ends with a concrete verification you can fail.** Do not skip them, and do not invent a test framework — adding one here contradicts the spec.

## File Structure

**Created — repository root**

| File | Responsibility |
|---|---|
| `LICENSE` | MIT grant. Currently missing, which makes the repository legally all-rights-reserved despite its claims |
| `SECURITY.md` | Private vulnerability reporting path |
| `CONTRIBUTING.md` | pnpm + Turborepo workflow, which is not guessable |
| `CODE_OF_CONDUCT.md` | Contributor Covenant 2.1 |
| `.nvmrc` | Pins Node 22 |
| `.editorconfig` | Enforces the formatting `engines` only declares |

**Created — `.github/`**

| File | Responsibility |
|---|---|
| `workflows/ci.yml` | `install → lint → check-types → build`, on PR and push to `main` |
| `dependabot.yml` | Weekly updates for npm and GitHub Actions |
| `ISSUE_TEMPLATE/bug_report.yml` | Structured bug reports |
| `ISSUE_TEMPLATE/feature_request.yml` | Structured feature requests |
| `ISSUE_TEMPLATE/config.yml` | Routes security reports away from public issues |
| `pull_request_template.md` | PR checklist |

**Modified**

| File | Change |
|---|---|
| `packages/cli/package.json` | `name` → `nikaui`; `bin` → two entries; publish metadata |
| `packages/cli/src/commands/add.ts:23` | `REGISTRY_BASE_URL` → the organisation path |
| `README.md` | Remove the phantom `apps/showcase`; correct install commands |

**Created — new repository `Rowee13/nikaui-pro`**

Turborepo scaffold with `apps/pro` and `packages/blocks`, proprietary licence.

---

### Task 1: Licence and community health files

The licence is the blocking item. Everything else in this task is cheap and lands in the same commit because none of it is independently rejectable — a reviewer either accepts the repository's community baseline or does not.

**Files:**
- Create: `LICENSE`
- Create: `SECURITY.md`
- Create: `CONTRIBUTING.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `.nvmrc`
- Create: `.editorconfig`

**Interfaces:**
- Consumes: nothing
- Produces: a repository that GitHub recognises as MIT-licensed. Task 4 references `CONTRIBUTING.md` from the README.

- [ ] **Step 1: Verify the licence is genuinely absent**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && ls LICENSE LICENSE.md COPYING 2>&1
```

Expected: `No such file or directory` for all three. If a licence already exists, stop and re-read the spec — this plan assumes it does not.

- [ ] **Step 2: Write `LICENSE`**

Create `LICENSE` with exactly this content:

```
MIT License

Copyright (c) 2026 Parrow Horrizon Studio

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 3: Write `SECURITY.md`**

Reporting goes through GitHub's private vulnerability reporting, enabled in Task 6. No email address is published — the project has no domain yet, and publishing a personal address in a public repository invites spam.

```markdown
# Security Policy

## Supported versions

Nika UI is pre-1.0. Only the latest release receives security fixes.

| Version | Supported |
| ------- | --------- |
| latest  | ✅        |
| < latest | ❌       |

## Reporting a vulnerability

**Do not open a public issue for security reports.**

Use GitHub's private vulnerability reporting: go to the **Security** tab of
this repository and choose **Report a vulnerability**. This opens a private
channel visible only to maintainers.

Please include:

- What the vulnerability allows an attacker to do
- Steps to reproduce it
- Affected version or commit
- Any suggested fix

You can expect an acknowledgement within 7 days and an assessment within 30.

## Scope

In scope:

- The `nikaui` CLI, including how it resolves credentials and fetches sources
- Component source in `packages/registry`
- This repository's build and release workflows

Out of scope:

- Vulnerabilities in dependencies — report those upstream
- Anything requiring an attacker to already control the developer's machine
```

- [ ] **Step 4: Write `CONTRIBUTING.md`**

````markdown
# Contributing to Nika UI

Thanks for helping. This document covers the parts of the setup that are not
obvious from the file tree.

## Requirements

- **Node >= 20** — `.nvmrc` pins 22
- **pnpm 9** — the repository uses pnpm workspaces and the `workspace:*`
  protocol. npm and yarn will not resolve internal packages

```bash
corepack enable
pnpm install
```

## Repository layout

```
apps/docs           Documentation site (Next.js + Fumadocs)
packages/registry   Component source — what the CLI copies into user projects
packages/cli        The `nikaui` CLI
packages/*-config   Shared ESLint and TypeScript configuration
```

`packages/registry` is **not** a published library. Its files are copied
verbatim into a consumer's repository, so they must be self-contained and
readable — someone is going to own and edit this code.

## Commands

```bash
pnpm dev           # all apps in watch mode
pnpm build         # build everything
pnpm lint          # ESLint, zero warnings allowed
pnpm check-types   # tsc --noEmit across the workspace
```

All three of `lint`, `check-types`, and `build` must pass before a pull
request can merge — they are the required status checks.

## Adding a component

1. Create `packages/registry/src/ui/<name>.tsx`
2. Add an entry to `packages/cli/src/registry.json` declaring its npm
   `dependencies` and its `registryDependencies` (other registry files it
   imports)
3. Add documentation at `apps/docs/content/docs/components/<name>.mdx`

Components use Motion for animation, `class-variance-authority` for variants,
and the token layer for all colour. Never hard-code a colour.

## Commits

Conventional Commits — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`,
`test:`.

## Pull requests

Fork, branch, and open a pull request against `main`. CI must pass and review
conversations must be resolved before merge.
````

- [ ] **Step 5: Fetch and adapt the Code of Conduct**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && curl -sL https://www.contributor-covenant.org/version/2/1/code_of_conduct.md -o CODE_OF_CONDUCT.md && grep -n "\[INSERT CONTACT METHOD\]" CODE_OF_CONDUCT.md
```

Expected: one match showing the placeholder line.

Replace the literal string `[INSERT CONTACT METHOD]` with:

```
the maintainers, via a private vulnerability report on this repository's Security tab
```

Then confirm no placeholder remains:

```bash
grep -c "INSERT CONTACT METHOD" CODE_OF_CONDUCT.md
```

Expected: `0`

- [ ] **Step 6: Write `.nvmrc` and `.editorconfig`**

`.nvmrc` — a single line:

```
22
```

`.editorconfig`:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
```

- [ ] **Step 7: Verify all six files exist and are non-empty**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && for f in LICENSE SECURITY.md CONTRIBUTING.md CODE_OF_CONDUCT.md .nvmrc .editorconfig; do if [ -s "$f" ]; then echo "ok   $f"; else echo "FAIL $f"; fi; done
```

Expected: six `ok` lines, no `FAIL`.

- [ ] **Step 8: Commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git add LICENSE SECURITY.md CONTRIBUTING.md CODE_OF_CONDUCT.md .nvmrc .editorconfig && git commit -m "docs: add licence and community health files

The repository claimed MIT in README and package.json without a LICENSE
file, which made it legally all-rights-reserved."
```

---

### Task 2: Continuous integration

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/dependabot.yml`
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `.github/pull_request_template.md`

**Interfaces:**
- Consumes: `pnpm lint`, `pnpm check-types`, `pnpm build` from the root `package.json`
- Produces: a check named **`ci`**. Task 6 requires this exact string as a required status check

- [ ] **Step 1: Confirm the three scripts exist and pass locally**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build
```

Expected: all three succeed. **If any fails, fix it before writing CI** — a workflow that is red on its first run cannot become a required status check, and Task 6 depends on it.

- [ ] **Step 2: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: ci
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm lint

      - run: pnpm check-types

      - run: pnpm build
```

`permissions: contents: read` is deliberate — it scopes this workflow's token to read-only regardless of the repository default set in Task 6, which is defence in depth rather than duplication.

- [ ] **Step 3: Write `.github/dependabot.yml`**

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
    groups:
      dev-dependencies:
        dependency-type: development

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

The `github-actions` entry is why the workflow pins tags rather than commit SHAs — Dependabot keeps the tags current, and SHA pinning without automation rots.

- [ ] **Step 4: Write the issue templates**

`.github/ISSUE_TEMPLATE/bug_report.yml`:

```yaml
name: Bug report
description: Something does not work as documented
labels: [bug]
body:
  - type: textarea
    id: what-happened
    attributes:
      label: What happened
      description: What did you expect, and what happened instead?
    validations:
      required: true

  - type: textarea
    id: reproduce
    attributes:
      label: Reproduction
      description: Exact steps, or a link to a minimal reproduction.
    validations:
      required: true

  - type: input
    id: component
    attributes:
      label: Component
      placeholder: button

  - type: input
    id: version
    attributes:
      label: Nika UI version
      placeholder: 0.1.0
    validations:
      required: true

  - type: dropdown
    id: framework
    attributes:
      label: Framework
      options:
        - Next.js
        - Vite
        - Remix
        - TanStack Start
        - Other
    validations:
      required: true
```

`.github/ISSUE_TEMPLATE/feature_request.yml`:

```yaml
name: Feature request
description: Suggest a component, variant, or capability
labels: [enhancement]
body:
  - type: textarea
    id: problem
    attributes:
      label: What problem does this solve
      description: Describe the situation you are stuck in, not the solution you want.
    validations:
      required: true

  - type: textarea
    id: proposal
    attributes:
      label: Proposed solution
    validations:
      required: true

  - type: checkboxes
    id: checked
    attributes:
      label: Before submitting
      options:
        - label: I checked the roadmap for this component
          required: true
```

`.github/ISSUE_TEMPLATE/config.yml`:

```yaml
blank_issues_enabled: false
contact_links:
  - name: Security vulnerability
    url: https://github.com/Rowee13/nikaui/security/advisories/new
    about: Report privately. Never open a public issue for a security problem.
```

The security URL points at `Rowee13/nikaui` because the transfer has not happened yet. GitHub redirects it automatically afterwards, and Task 5 updates it to the final path.

- [ ] **Step 5: Write `.github/pull_request_template.md`**

```markdown
## What this changes

<!-- One or two sentences. -->

## Why

<!-- Link the issue, or explain the problem this solves. -->

## Checklist

- [ ] `pnpm lint` passes
- [ ] `pnpm check-types` passes
- [ ] `pnpm build` passes
- [ ] Documentation updated, if this changes behaviour
- [ ] No hard-coded colours — all colour comes from the token layer
```

- [ ] **Step 6: Validate the YAML parses**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && for f in .github/workflows/ci.yml .github/dependabot.yml .github/ISSUE_TEMPLATE/bug_report.yml .github/ISSUE_TEMPLATE/feature_request.yml .github/ISSUE_TEMPLATE/config.yml; do printf "%-45s " "$f"; node -e "const fs=require('fs');const s=fs.readFileSync('$f','utf8');if(!s.trim()){console.log('EMPTY');process.exit(1)};console.log('present, '+s.split('\n').length+' lines')"; done
```

Expected: five lines, each reporting a line count. Nothing `EMPTY`.

- [ ] **Step 7: Commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git add .github && git commit -m "ci: add build workflow, Dependabot, and issue templates

CI runs install, lint, check-types and build on pull requests and
pushes to main. The job is named 'ci' so it can be required."
```

---

### Task 3: Correct the CLI distribution identity

Two independent defects, both of which make the CLI unusable for anyone who is not working inside this monorepo.

**Files:**
- Modify: `packages/cli/package.json`
- Modify: `packages/cli/src/commands/add.ts:23`

**Interfaces:**
- Consumes: nothing
- Produces: package name `nikaui` with binaries `nikaui` and `nika`; `REGISTRY_BASE_URL` pointing at `Parrow-Horrizon-Studio`. Task 4's README and Task 5's verification both depend on these exact values

- [ ] **Step 1: Confirm both defects are present**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && node -e "console.log('name:', require('./packages/cli/package.json').name); console.log('bin :', JSON.stringify(require('./packages/cli/package.json').bin))" && grep -n "raw.githubusercontent" packages/cli/src/commands/add.ts
```

Expected:
```
name: nika-ui
bin : {"nika":"./dist/index.js"}
23:  "https://raw.githubusercontent.com/nicaui/nikaui/main/packages/registry/src";
```

Note `nicaui` — a transposition of an account that does not exist.

- [ ] **Step 2: Prove the current registry URL is broken**

```bash
curl -s -o /dev/null -w "old URL: HTTP %{http_code}\n" "https://raw.githubusercontent.com/nicaui/nikaui/main/packages/registry/src/ui/button.tsx"
```

Expected: `HTTP 404`. This is the bug — every remote fetch fails, masked in development because `getFileContent` tries local monorepo paths first.

- [ ] **Step 3: Check nothing in the workspace depends on the old package name**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && grep -rn '"nika-ui"' --include=package.json . --exclude-dir=node_modules
```

Expected: exactly one match, `packages/cli/package.json` itself. If any other package depends on `nika-ui`, update that dependency in this task too.

- [ ] **Step 4: Rewrite `packages/cli/package.json`**

```json
{
  "name": "nikaui",
  "version": "0.1.0",
  "description": "CLI for adding Nika UI components to your project",
  "license": "MIT",
  "author": "Parrow Horrizon Studio",
  "type": "module",
  "bin": {
    "nikaui": "./dist/index.js",
    "nika": "./dist/index.js"
  },
  "files": ["dist"],
  "keywords": [
    "react",
    "tailwindcss",
    "components",
    "ui",
    "motion",
    "animation",
    "design-system"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Parrow-Horrizon-Studio/nikaui.git",
    "directory": "packages/cli"
  },
  "bugs": {
    "url": "https://github.com/Parrow-Horrizon-Studio/nikaui/issues"
  },
  "engines": {
    "node": ">=20"
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --watch",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "commander": "^13.0.0",
    "prompts": "^2.4.2",
    "chalk": "^5.4.0",
    "fs-extra": "^11.2.0",
    "ora": "^8.2.0"
  },
  "devDependencies": {
    "@nikaui/typescript-config": "workspace:*",
    "@types/fs-extra": "^11.0.4",
    "@types/prompts": "^2.4.9",
    "tsup": "^8.0.0",
    "typescript": "5.9.2"
  }
}
```

Version is `0.1.0` because `0.0.0` is already published as the stub and **npm never permits reusing a version number**. Do not publish in this task — publishing happens after sub-project B, when the CLI works.

- [ ] **Step 5: Fix `REGISTRY_BASE_URL`**

In `packages/cli/src/commands/add.ts`, replace line 23:

```ts
const REGISTRY_BASE_URL =
  "https://raw.githubusercontent.com/Parrow-Horrizon-Studio/nikaui/main/packages/registry/src";
```

- [ ] **Step 6: Reinstall so pnpm picks up the rename, then build**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm install && pnpm --filter nikaui build
```

Expected: install succeeds, `dist/index.js` is produced. A `--filter nikaui` that reports "No projects matched" means the rename did not take — re-check Step 4.

- [ ] **Step 7: Verify both binaries run**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui/packages/cli" && node dist/index.js --help
```

Expected: the command list including `init`, `add`, and `list`. Not an error.

- [ ] **Step 8: Verify the whole workspace still builds and type-checks**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm lint && pnpm check-types && pnpm build
```

Expected: all pass. The rename touches workspace resolution, so this is not optional.

- [ ] **Step 9: Commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git add packages/cli/package.json packages/cli/src/commands/add.ts pnpm-lock.yaml && git commit -m "fix: correct CLI package name and registry URL

The package declared 'nika-ui', which is tombstoned on npm and cannot
be published. It is now 'nikaui', with both 'nikaui' and 'nika' bins.

REGISTRY_BASE_URL pointed at 'nicaui', a transposition of an account
that does not exist, so every remote fetch returned 404. This was
masked in development because getFileContent tries local paths first."
```

---

### Task 4: Refresh the README

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the package name and commands from Task 3, `CONTRIBUTING.md` from Task 1
- Produces: nothing downstream

- [ ] **Step 1: Confirm the stale reference**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && grep -n "showcase" README.md && ls apps/
```

Expected: README mentions `apps/showcase`; `ls apps/` shows only `docs`. The app was merged away in commit `325b75b`.

- [ ] **Step 2: Rewrite `README.md`**

````markdown
# Nika UI

Beautiful, animated React components built with Tailwind CSS and Motion.
Install components individually via CLI — you own the code.

> **Pre-release.** The CLI is not yet published. See the
> [master plan](docs/MASTER-PLAN.md) for what is being built and in what order.

## Quick start

```bash
npx nikaui init
npx nikaui add button card dialog
```

## Monorepo structure

### Apps

- `apps/docs` — documentation site and landing page (Next.js + Fumadocs)

### Packages

- `packages/registry` — component source; what the CLI copies into your project
- `packages/cli` — the `nikaui` CLI
- `packages/eslint-config` — shared ESLint configuration
- `packages/typescript-config` — shared TypeScript configuration

## Development

Requires **Node >= 20** and **pnpm 9**.

```bash
corepack enable
pnpm install

pnpm dev           # all apps in watch mode
pnpm build         # build everything
pnpm lint          # ESLint, zero warnings allowed
pnpm check-types   # tsc --noEmit across the workspace
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

## Tech stack

- **Turborepo** + **pnpm** — monorepo and package management
- **TypeScript** — strict mode
- **React 19** and **Next.js 16**
- **Tailwind CSS v4** — styling, themed through a CSS variable layer
- **Motion** — animation
- **Headless UI** — accessible primitives
- **class-variance-authority** — component variants
- **tailwind-merge** + **clsx** — class composition

## Documentation

- [Master plan](docs/MASTER-PLAN.md) — architecture, roadmap, decisions
- [Specs](docs/superpowers/specs) — the reasoning behind each decision

## License

MIT © Parrow Horrizon Studio — see [LICENSE](LICENSE).
````

- [ ] **Step 3: Verify no stale references remain**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && echo "showcase refs:" && grep -c "showcase" README.md; echo "bad command refs:" && grep -c "npx nika " README.md
```

Expected: `0` for both. The second guards against `npx nika` — which runs an unrelated publisher's package.

- [ ] **Step 4: Commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git add README.md && git commit -m "docs: refresh README

Removes apps/showcase, merged away in 325b75b, and corrects the
install command to npx nikaui."
```

---

### Task 5: Transfer the repository to the organisation

**Files:**
- Modify: `.github/ISSUE_TEMPLATE/config.yml` (Step 7 — the security URL, once the final path exists)
- Modify: local git remote (not tracked in git)

**Interfaces:**
- Consumes: `REGISTRY_BASE_URL` from Task 3, which only resolves once this task completes
- Produces: the repository at `Parrow-Horrizon-Studio/nikaui`. Task 6 operates on that path

- [ ] **Step 1: Push all prior work before transferring**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git push origin main && git status --short
```

Expected: push succeeds, working tree clean. **Do not transfer with unpushed commits.**

- [ ] **Step 2: Confirm org membership and current repo state**

```bash
gh api user/memberships/orgs/Parrow-Horrizon-Studio --jq '.role, .state' && gh api repos/Rowee13/nikaui --jq '.full_name, .visibility, .forks_count'
```

Expected: role `admin`, state `active`, then `Rowee13/nikaui`, `public`, `0`. Zero forks means the transfer is clean with nobody to notify. If the role is not `admin`, the transfer will fail — resolve org permissions first.

- [ ] **Step 3: Transfer**

```bash
gh api -X POST repos/Rowee13/nikaui/transfer -f new_owner=Parrow-Horrizon-Studio
```

Expected: a JSON response containing `"full_name": "Parrow-Horrizon-Studio/nikaui"`.

If this returns 403, the token lacks the necessary permission — perform the transfer in the web UI instead: **Settings → General → Danger Zone → Transfer ownership**, entering `Parrow-Horrizon-Studio` as the new owner.

- [ ] **Step 4: Verify the transfer landed**

```bash
gh api repos/Parrow-Horrizon-Studio/nikaui --jq '.full_name, .visibility, .default_branch'
```

Expected:
```
Parrow-Horrizon-Studio/nikaui
public
main
```

- [ ] **Step 5: Repoint the local remote**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git remote set-url origin https://github.com/Parrow-Horrizon-Studio/nikaui.git && git remote -v && git fetch origin
```

Expected: both fetch and push URLs show the organisation; fetch succeeds.

- [ ] **Step 6: Verify `REGISTRY_BASE_URL` now resolves — the first time this URL has ever worked**

```bash
curl -s -o /dev/null -w "new URL: HTTP %{http_code}\n" "https://raw.githubusercontent.com/Parrow-Horrizon-Studio/nikaui/main/packages/registry/src/ui/button.tsx"
```

Expected: `HTTP 200`. If it returns 404, GitHub's raw CDN may lag a minute behind the transfer — wait and retry. A persistent 404 means the path in `add.ts:23` is wrong.

- [ ] **Step 7: Update the security link in the issue-template config**

In `.github/ISSUE_TEMPLATE/config.yml`, change the URL to the final path:

```yaml
    url: https://github.com/Parrow-Horrizon-Studio/nikaui/security/advisories/new
```

- [ ] **Step 8: Commit and push**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git add .github/ISSUE_TEMPLATE/config.yml && git commit -m "chore: point security link at the organisation path" && git push origin main
```

---

### Task 6: Branch protection and security settings

Apply only after Task 5, and after CI has run green at least once — a required status check that has never reported blocks every merge.

**Files:** none — remote settings only.

**Interfaces:**
- Consumes: the `ci` job name from Task 2, the repository path from Task 5
- Produces: a protected `main`

- [ ] **Step 1: Confirm CI has run and succeeded**

```bash
gh run list --repo Parrow-Horrizon-Studio/nikaui --limit 5
```

Expected: at least one `CI` run with conclusion `success`. **If CI has never run or is failing, stop and fix it** — Step 3 requires a check named `ci` that GitHub has actually seen.

- [ ] **Step 2: Enable security features**

```bash
gh api -X PATCH repos/Parrow-Horrizon-Studio/nikaui \
  -f 'security_and_analysis[secret_scanning][status]=enabled' \
  -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled' \
  --jq '.security_and_analysis'
```

Expected: JSON showing both as `enabled`.

```bash
gh api -X PUT repos/Parrow-Horrizon-Studio/nikaui/vulnerability-alerts && echo "dependabot alerts: enabled"
gh api -X PUT repos/Parrow-Horrizon-Studio/nikaui/automated-security-fixes && echo "dependabot fixes: enabled"
gh api -X PUT repos/Parrow-Horrizon-Studio/nikaui/private-vulnerability-reporting && echo "private reporting: enabled"
```

Expected: three confirmation lines. Private vulnerability reporting is what `SECURITY.md` and the issue-template config both point at, so this one is load-bearing rather than optional.

- [ ] **Step 3: Restrict the default workflow token to read-only**

```bash
gh api -X PUT repos/Parrow-Horrizon-Studio/nikaui/actions/permissions/workflow \
  -f default_workflow_permissions=read \
  -F can_approve_pull_request_reviews=false && echo "workflow token: read-only"
```

Then confirm:

```bash
gh api repos/Parrow-Horrizon-Studio/nikaui/actions/permissions/workflow --jq '.default_workflow_permissions'
```

Expected: `read`.

This enforces the property spec A §D3 relies on — the public repository holds no secrets, and a read-only default token means a contributor's pull request cannot exfiltrate one even if that assumption later slips.

- [ ] **Step 4: Protect `main`, with administrators excluded**

```bash
gh api -X PUT repos/Parrow-Horrizon-Studio/nikaui/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["ci"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "require_last_push_approval": false,
    "dismiss_stale_reviews": true
  },
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "restrictions": null
}
JSON
```

`enforce_admins: false` is the deliberate choice from spec E §E2 — contributors are bound by every rule while the maintainer can still push directly. `required_approving_review_count: 0` exists because a solo maintainer cannot approve their own pull request; raise it to `1` when a second contributor joins.

- [ ] **Step 5: Verify protection reads back as intended**

```bash
gh api repos/Parrow-Horrizon-Studio/nikaui/branches/main/protection --jq '{checks: .required_status_checks.contexts, admins_enforced: .enforce_admins.enabled, force_push: .allow_force_pushes.enabled, deletions: .allow_deletions.enabled, conversations: .required_conversation_resolution.enabled}'
```

Expected exactly:
```json
{"checks":["ci"],"admins_enforced":false,"force_push":false,"deletions":false,"conversations":true}
```

- [ ] **Step 6: Verify a maintainer push still works**

This confirms `enforce_admins: false` took effect rather than silently locking you out of your own default branch.

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && git commit --allow-empty -m "chore: verify maintainer push under branch protection" && git push origin main
```

Expected: push succeeds. If it is rejected, `enforce_admins` is on — re-run Step 4.

- [ ] **Step 7: Enable CodeQL default setup**

```bash
gh api -X PATCH repos/Parrow-Horrizon-Studio/nikaui/code-scanning/default-setup -f state=configured && echo "codeql: configured"
```

If this returns 404 or 422, enable it in the web UI instead: **Settings → Code security → Code scanning → Set up → Default**. CodeQL default setup is occasionally unavailable via API depending on language detection, and it is not worth blocking the task over.

---

### Task 7: Create the private Pro repository scaffold

**Files:** all created in a **new repository**, outside the current working directory.

**Interfaces:**
- Consumes: nothing
- Produces: `Rowee13/nikaui-pro`, consumed by sub-project F

⚠️ **This repository is proprietary. It must never carry an MIT licence.** Copying the public repository's `LICENSE` here would place every paid block under a permissive licence, which cannot be undone for anyone who obtained a copy.

- [ ] **Step 1: Create the private repository on the personal account**

```bash
gh repo create Rowee13/nikaui-pro --private --description "Nika UI Pro — premium blocks, templates, and registry API. Proprietary."
```

Expected: confirmation of the created repository. Note the owner is `Rowee13`, **not** the organisation — spec E §E1 keeps it personal because a free organisation cannot branch-protect private repositories.

- [ ] **Step 2: Clone it beside the public repository**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui" && gh repo clone Rowee13/nikaui-pro && cd nikaui-pro && pwd
```

Expected: the working directory is `F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui-pro`. **All remaining steps in this task run there**, not in the public repository.

- [ ] **Step 3: Write the workspace files**

`package.json`:

```json
{
  "name": "nikaui-pro",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "check-types": "turbo run check-types"
  },
  "devDependencies": {
    "turbo": "^2.8.21",
    "typescript": "5.9.2"
  },
  "packageManager": "pnpm@9.15.3",
  "engines": {
    "node": ">=20"
  }
}
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`turbo.json`:

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "lint": { "dependsOn": ["^lint"] },
    "check-types": { "dependsOn": ["^check-types"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

`.nvmrc`:

```
22
```

- [ ] **Step 4: Write the proprietary `LICENSE`**

```
Copyright (c) 2026 Parrow Horrizon Studio. All rights reserved.

This software and its source code are proprietary and confidential.

Access is granted solely to holders of a valid Nika UI Pro licence, under the
terms of that licence. A licence permits use of this code in unlimited
personal and commercial projects, including client work.

A licence does NOT permit redistributing this source, publishing it, or using
it to build a competing component library or template store.

No other rights are granted. Unauthorised copying, distribution, or use of
this software, in whole or in part, is prohibited.
```

The permissions and the restriction mirror spec A §D5 exactly. If the licence grant on the pricing page ever changes, this file changes with it.

- [ ] **Step 5: Write `.gitignore`**

```gitignore
node_modules
.turbo
.next/
out/
dist
build

.env
.env.local
.env.*.local

coverage
npm-debug.log*
.DS_Store
*.pem
```

`.env` matters more here than in the public repository — this is where `POLAR_ORG_TOKEN` will live.

- [ ] **Step 6: Write `README.md`**

````markdown
# Nika UI Pro

Premium blocks, templates, and the licensed registry API for
[Nika UI](https://github.com/Parrow-Horrizon-Studio/nikaui).

**Proprietary — not open source.** See [LICENSE](LICENSE).

## Structure

- `apps/pro` — Pro landing page, documentation, block browser, checkout, and
  the registry API routes
- `packages/blocks` — Pro block and template source

The registry API deploys from this repository and serves block source from
`packages/blocks` off local disk, so no cross-repository token exists anywhere
in the system. The only secret is `POLAR_ORG_TOKEN`.

## Why this repository is private and separate

A public repository with an open contribution workflow is an unsafe place for
deployment secrets: an outside pull request triggers a preview build with
environment variables attached, and any code in that pull request can read
`process.env`. Separate deployment means separate environment scope.

## Development

Requires Node >= 20 and pnpm 9.

```bash
corepack enable
pnpm install
pnpm dev
```
````

- [ ] **Step 7: Create the placeholder workspace directories**

Empty directories are not tracked by git, so each gets a `.gitkeep`:

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui-pro" && mkdir -p apps/pro packages/blocks && touch apps/pro/.gitkeep packages/blocks/.gitkeep && ls -R apps packages
```

Expected: both directories listed, each containing `.gitkeep`.

- [ ] **Step 8: Verify the licence is proprietary, not MIT**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui-pro" && grep -c "MIT" LICENSE; grep -c "All rights reserved" LICENSE
```

Expected: `0` then `1`. **If `MIT` appears in this file, stop and rewrite it.**

- [ ] **Step 9: Commit and push**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui-pro" && git add -A && git commit -m "chore: scaffold Nika UI Pro monorepo

Turborepo workspace with apps/pro and packages/blocks. Proprietary
licence mirroring the grant and restriction in spec A D5." && git push -u origin main
```

- [ ] **Step 10: Confirm the repository is private**

```bash
gh api repos/Rowee13/nikaui-pro --jq '.full_name, .private, .visibility'
```

Expected:
```
Rowee13/nikaui-pro
true
private
```

**If `private` is `false`, fix it immediately** — this repository will hold paid source.

---

## Completion criteria

Sub-project E is done when every one of these passes:

```bash
# 1. Public repository lives in the organisation
gh api repos/Parrow-Horrizon-Studio/nikaui --jq '.full_name, .visibility'

# 2. main is protected, administrators excluded
gh api repos/Parrow-Horrizon-Studio/nikaui/branches/main/protection --jq '.required_status_checks.contexts, .enforce_admins.enabled'

# 3. The registry URL resolves — for the first time ever
curl -s -o /dev/null -w "%{http_code}\n" "https://raw.githubusercontent.com/Parrow-Horrizon-Studio/nikaui/main/packages/registry/src/ui/button.tsx"

# 4. Both npm names are held and public (already done — verification only)
npm view nikaui version && npm view @nikaui/cli version

# 5. The private Pro repository exists and is private
gh api repos/Rowee13/nikaui-pro --jq '.private'

# 6. No stale command anywhere in the tree
grep -rn "npx nika " --include="*.md" --include="*.tsx" --include="*.ts" . --exclude-dir=node_modules --exclude-dir=.git | grep -v "npx nikaui"
```

Expected: `Parrow-Horrizon-Studio/nikaui` + `public`; `["ci"]` + `false`; `200`; `0.0.0` twice; `true`; and **no output at all** from the last command.

Check 6 is the one most likely to fail. Documentation copy in `apps/docs/content/` still advertises `npx nika`, and that copy is rewritten in sub-projects C and D — so a non-empty result here is expected until then. Record what it finds and carry it into D rather than fixing it ad hoc.
