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

- `apps/web` — landing page and documentation site (Next.js + Fumadocs)

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
