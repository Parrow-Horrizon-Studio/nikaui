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
apps/web            Landing page and documentation site (Next.js + Fumadocs)
packages/registry   Component source — what the CLI copies into user projects
packages/cli        The `nikaui` CLI
packages/*-config   Shared ESLint, TypeScript, and Tailwind configuration
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
3. Add documentation at `apps/web/content/docs/components/<name>.mdx`, with
   `category: foundation` or `category: interactive` in its frontmatter —
   `next build` throws without it, since the component index derives from
   this field
4. Add a preview entry for the component's slug in
   `apps/web/src/components/docs/component-previews.tsx`; a test binds the
   preview list to the component index in both directions, so a documented
   component with no preview (or a preview with no page) fails the suite

Components use Motion for animation, `class-variance-authority` for variants,
and the token layer for all colour. Never hard-code a colour.

## Commits

Conventional Commits — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`,
`test:`.

## Pull requests

Fork, branch, and open a pull request against `main`. CI must pass and review
conversations must be resolved before merge.
