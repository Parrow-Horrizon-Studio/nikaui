# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `apps/web` — a new Next 16 marketing application whose landing page is a live demonstration of the library, ported from the design prototype with every claim corrected against reality.

**Architecture:** A new application beside `apps/docs`, which sub-project D later grows into the documentation site so `apps/docs` can be deleted. It consumes `@nikaui/registry` as a workspace dependency and imports components directly. The prototype's decorative CSS — rays, sun, window glow, CTA band — is ported as authored CSS with its variables rebound to Nika's shipped tokens; everything else is Tailwind utilities.

**Tech Stack:** Next 16.3.0, React 19, Tailwind CSS v4, Motion, `next-themes`, Vitest, Loops, pnpm 9, Node 22.

**Spec:** [`docs/superpowers/specs/2026-08-12-nikaui-landing-page.md`](../specs/2026-08-12-nikaui-landing-page.md)

## Global Constraints

- **Every CSS variable Nika defines is prefixed `--nika-`.** `apps/web` consumes them; it must not *invent* token variables of its own outside the prototype bridge in Task 2, and that bridge assigns *from* `--nika-*`, never the reverse.

  **Amended 2026-08-12, during Task 2.** As first written, this line also forbade *overriding* an existing `--nika-*` token from the app — which contradicted Task 2's own Step 6, and would have made `apps/web` diverge from `apps/docs`, which has rebound `--nika-font-sans` / `--nika-font-mono` to its `next/font` variables since sub-project B. Overriding a published token in `:root` is the documented way to theme a CSS-variable design system, and the registry ships system font stacks precisely so consumers can. The prohibition is on *inventing* parallel tokens, not on retuning shipped ones. Ruled by the human partner; the Task 2 reviewer was right that the two clauses collided.
- **Tailwind utilities are NOT prefixed.** `bg-primary`, not `bg-nika-primary`.
- **Light/dark switches on the `.dark` class. Accent switches on `[data-accent]`.** Accents: `sun` (default, needs no attribute), `violet`, `emerald`, `azure`, `rose`.
- **The theme default is `system`.** Not `dark`. `apps/docs` defaults to `dark` today; do not copy that.
- **The advertised command is `npx nikaui`, never `npx nika`.**
- **No reference-library attribution.** Nothing in code, comments, copy, file names or metadata may attribute anything to another component library.
- **No fabricated counts.** 27 components, 5 motion presets, 5 accents. There are zero blocks and zero templates, and no Figma kit exists.
- **The five motion presets are `none`, `snap`, `glide`, `spring`, `bounce`.** There is no preset named `pop`. `spring` is the default.
- **Pricing is three tiers:** Free $0, Personal **$149** one-time, Team **$349** one-time. Both paid calls to action open the waitlist. Pro is not purchasable.
- **There is no Templates section.** Cut per spec §C5.
- **Node `>=20`**, pnpm `9`.
- **`pnpm lint`, `pnpm check-types`, `pnpm build`, `pnpm test` must all pass before any commit.** Lint runs with `--max-warnings 0`. CI runs all four and `ci` is a required status check on `main`.
- **`main` is protected.** All work lands on a branch through a pull request.

## The prototype token bridge

The prototype's stylesheets use their own variable names. Porting its CSS means rebinding those names to the tokens B actually shipped. This table is the complete mapping; it was derived from every `var(--…)` reference in `styles/nika-landing.css`.

| Prototype | Nika |
|---|---|
| `--primary` | `--nika-primary` |
| `--accent-2` | `--nika-accent` |
| `--bg` | `--nika-canvas` |
| `--bg-2` | `--nika-canvas-2` |
| `--card` | `--nika-surface` |
| `--card-2` | `--nika-surface-2` |
| `--border` | `--nika-line` |
| `--border-2` | `--nika-line-strong` |
| `--fg` | `--nika-content` |
| `--fg-muted` | `--nika-content-muted` |
| `--fg-subtle` | `--nika-content-subtle` |
| `--code-bg` | `--nika-code` |
| `--font-mono` | `--nika-font-mono` |
| `--r-lg` / `--r-xl` / `--r-2xl` / `--r-full` | `--nika-radius-lg` / `-xl` / `-2xl` / `-full` |
| `--shadow` / `--shadow-lg` | `--nika-shadow` / `--nika-shadow-lg` |
| `--t` | `--nika-duration` |
| `--ease-out` | `--nika-ease-out` |

**Anything not in this table is not a prototype token.** If you meet one, stop and report it — this table has the same "exhaustive until proven otherwise" status the equivalent table had in sub-project B, where it turned out to be incomplete four separate times.

## What must never reach production

Every string below is in the prototype. Task 11 greps for all of them.

`npx nika ` without `ui` · any reference-library name · `Rowee13/` · `40+` · `12+` · `80+` · `Figma` · a preset named `pop` · `data-theme=` · `$99`

## A note on scope of code in this plan

Tasks 4 through 8 build page sections. For those, this plan gives **the exact copy, the exact components and props, and complete code for anything non-obvious** — the decorative CSS, the motion wiring, the interactive controls. It does not hand-write every wrapper `div`, because the copy and the component choices *are* the specification there and the markup is conventional. Tasks 1, 2, 3, 9, 10 and 11 give complete code, because their content is logic rather than composition.

---

### Task 1: Scaffold `apps/web`

Nothing exists yet. This task produces an application that boots, builds, lints, type-checks and runs a test — and nothing else. Every later task assumes it.

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/eslint.config.js`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/lib/smoke.test.ts`

**Interfaces:**
- Consumes: `@nikaui/registry` (workspace), `@nikaui/eslint-config`, `@nikaui/typescript-config`
- Produces: an app at `apps/web` on port **3001**, `pnpm --filter @nikaui/web dev|build|lint|check-types|test`

- [ ] **Step 1: Create `apps/web/package.json`**

Port **3001**, because `apps/docs` occupies 3000 and both must run at once until D.

```json
{
  "name": "@nikaui/web",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "lint": "eslint --max-warnings 0",
    "check-types": "next typegen && tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@nikaui/registry": "workspace:*",
    "motion": "^12.43.0",
    "next": "16.3.0",
    "next-themes": "^0.4.6",
    "react": "^19.2.8",
    "react-dom": "^19.2.8"
  },
  "devDependencies": {
    "@nikaui/eslint-config": "workspace:*",
    "@nikaui/typescript-config": "workspace:*",
    "@tailwindcss/postcss": "^4.3.3",
    "@testing-library/dom": "^10.4.0",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^22.20.1",
    "@types/react": "19.2.2",
    "@types/react-dom": "19.2.2",
    "eslint": "^9.39.5",
    "jsdom": "^26.1.0",
    "postcss": "^8.5.26",
    "tailwindcss": "^4.3.3",
    "typescript": "5.9.2",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Create the config files**

`apps/web/next.config.mjs` — no MDX here; that arrives with D.

```js
/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
};

export default config;
```

`apps/web/postcss.config.mjs`:

```js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

`apps/web/eslint.config.js`:

```js
import { nextJsConfig } from "@nikaui/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default nextJsConfig;
```

`apps/web/tsconfig.json`:

```json
{
  "extends": "@nikaui/typescript-config/nextjs.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "strictNullChecks": true,
    "declaration": false,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.mjs",
    "next-env.d.ts",
    "next.config.mjs",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

`apps/web/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 3: Create the minimal `globals.css`**

The `@source` path is four levels up from `src/app/`, reaching the repository root. `apps/docs` shipped a three-level path for months; it resolved to a directory that does not exist, Tailwind silently scanned nothing, and every build still passed. Count the levels.

```css
@import "tailwindcss";
@import "@nikaui/registry/styles/tokens.css";
@source "../../../../packages/registry/src";

body {
  background: var(--nika-canvas);
  color: var(--nika-content);
  font-family: var(--nika-font-sans);
}
```

- [ ] **Step 4: Create a minimal layout and page**

`apps/web/src/app/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

`apps/web/src/app/page.tsx`:

```tsx
export default function HomePage() {
  return <main className="p-10">Nika UI</main>;
}
```

- [ ] **Step 5: Write a smoke test that proves the harness runs**

`apps/web/src/lib/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("apps/web test harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

This file is deleted in Task 2, once real tests exist. It is here so that Step 7 proves Vitest is wired before anything depends on it.

- [ ] **Step 6: Install**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm install
```

- [ ] **Step 7: Verify the app boots and the gate passes**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web test && pnpm turbo run lint check-types build --continue
```

Expected: the smoke test passes, and all three workspace tasks succeed for **three** applications/packages plus the new one. If `check-types` fails on a missing `next-env.d.ts`, run `pnpm --filter @nikaui/web exec next typegen` once and re-run.

- [ ] **Step 8: Confirm Tailwind is actually scanning the registry**

A wrong `@source` depth fails silently. Prove it is right before building anything on top of it.

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui/apps/web" && node -e "const p=require('path');const fs=require('fs');const t=p.resolve('src/app','../../../../packages/registry/src');console.log(t, fs.existsSync(t)?'EXISTS':'MISSING')"
```

Expected: the path ends `packages\registry\src` and prints `EXISTS`.

- [ ] **Step 9: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): scaffold the marketing application"
```

---

### Task 2: The token bridge, theme and accent providers

The page needs three things before any section can be built: the prototype's variable names bound to Nika's tokens, a theme that defaults to the visitor's system preference, and an accent that can be switched at runtime and remembered.

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Create: `apps/web/src/components/site/theme-provider.tsx`
- Create: `apps/web/src/components/site/accent.tsx`
- Create: `apps/web/src/components/site/accent.test.ts`
- Modify: `apps/web/src/app/layout.tsx`
- Delete: `apps/web/src/lib/smoke.test.ts`

**Interfaces:**
- Consumes: Task 1's application
- Produces: `<ThemeProvider>`, `<AccentProvider>`, `useAccent(): { accent: Accent; setAccent(a: Accent): void }`, `ACCENTS: readonly Accent[]`, `type Accent = "sun" | "violet" | "emerald" | "azure" | "rose"`, and `isAccent(value: unknown): value is Accent`. Tasks 3 and 7 consume these.

- [ ] **Step 1: Write the failing test for accent parsing**

`apps/web/src/components/site/accent.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ACCENTS, DEFAULT_ACCENT, isAccent } from "./accent";

describe("accent vocabulary", () => {
  it("lists exactly the five shipped accents in order", () => {
    expect(ACCENTS).toEqual(["sun", "violet", "emerald", "azure", "rose"]);
  });

  it("defaults to sun", () => {
    expect(DEFAULT_ACCENT).toBe("sun");
  });

  it("accepts every shipped accent", () => {
    for (const accent of ACCENTS) {
      expect(isAccent(accent)).toBe(true);
    }
  });

  it("rejects an accent that does not exist", () => {
    expect(isAccent("crimson")).toBe(false);
  });

  it("rejects non-strings from a corrupted localStorage value", () => {
    expect(isAccent(null)).toBe(false);
    expect(isAccent(undefined)).toBe(false);
    expect(isAccent(3)).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web test
```

Expected: FAIL — `Failed to resolve import "./accent"`.

- [ ] **Step 3: Write `accent.tsx`**

`isAccent` guards the value read back from `localStorage`, which is user-writable and may be anything.

```tsx
"use client";

import * as React from "react";

export const ACCENTS = ["sun", "violet", "emerald", "azure", "rose"] as const;

export type Accent = (typeof ACCENTS)[number];

export const DEFAULT_ACCENT: Accent = "sun";

const STORAGE_KEY = "nika-accent";

export function isAccent(value: unknown): value is Accent {
  return typeof value === "string" && (ACCENTS as readonly string[]).includes(value);
}

interface AccentContextValue {
  accent: Accent;
  setAccent: (accent: Accent) => void;
}

const AccentContext = React.createContext<AccentContextValue | null>(null);

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = React.useState<Accent>(DEFAULT_ACCENT);

  // Read the stored preference after mount. Doing this during render would
  // produce server/client markup that disagrees.
  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isAccent(stored)) setAccentState(stored);
  }, []);

  React.useEffect(() => {
    // `sun` is the default and its block is unconditional in tokens.css, so
    // it needs no attribute — leaving it off keeps the DOM honest about
    // which accents are overrides.
    if (accent === DEFAULT_ACCENT) {
      document.documentElement.removeAttribute("data-accent");
    } else {
      document.documentElement.setAttribute("data-accent", accent);
    }
  }, [accent]);

  const setAccent = React.useCallback((next: Accent) => {
    setAccentState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = React.useMemo(() => ({ accent, setAccent }), [accent, setAccent]);

  return <AccentContext.Provider value={value}>{children}</AccentContext.Provider>;
}

export function useAccent(): AccentContextValue {
  const context = React.useContext(AccentContext);
  if (!context) {
    throw new Error("useAccent must be used inside an AccentProvider.");
  }
  return context;
}
```

- [ ] **Step 4: Run the test and watch it pass**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web test
```

Expected: 5 passing.

- [ ] **Step 5: Write the theme provider**

`apps/web/src/components/site/theme-provider.tsx`. **`defaultTheme` is `system`.** `apps/docs` uses `dark`; that is deliberate there and wrong here.

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
```

- [ ] **Step 6: Extend `globals.css` with the prototype bridge**

Append to `apps/web/src/app/globals.css`. Every assignment reads from a `--nika-*` token; nothing goes the other way.

```css
/* The prototype's stylesheets use their own variable names. Rather than
   rewrite every ported rule, bind those names to the tokens the library
   actually ships. One direction only: prototype names read from --nika-*,
   never the reverse. These exist solely so ported CSS compiles; new code
   uses Tailwind utilities or --nika-* directly. */
:root {
  --primary: var(--nika-primary);
  --accent-2: var(--nika-accent);
  --bg: var(--nika-canvas);
  --bg-2: var(--nika-canvas-2);
  --card: var(--nika-surface);
  --card-2: var(--nika-surface-2);
  --border: var(--nika-line);
  --border-2: var(--nika-line-strong);
  --fg: var(--nika-content);
  --fg-muted: var(--nika-content-muted);
  --fg-subtle: var(--nika-content-subtle);
  --code-bg: var(--nika-code);
  --font-mono: var(--nika-font-mono);
  --r-lg: var(--nika-radius-lg);
  --r-xl: var(--nika-radius-xl);
  --r-2xl: var(--nika-radius-2xl);
  --r-full: var(--nika-radius-full);
  --shadow: var(--nika-shadow);
  --shadow-lg: var(--nika-shadow-lg);
  --t: var(--nika-duration);
  --ease-out: var(--nika-ease-out);
}

/* The site's own typography. The registry ships system stacks on purpose —
   forcing a font download on every consumer is not the library's call. */
:root {
  --nika-font-sans: var(--web-font-sans), ui-sans-serif, system-ui, sans-serif;
  --nika-font-mono: var(--web-font-mono), ui-monospace, monospace;
}
```

- [ ] **Step 7: Wire the providers and fonts into the layout**

Replace `apps/web/src/app/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { ThemeProvider } from "@/components/site/theme-provider";
import { AccentProvider } from "@/components/site/accent";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--web-font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--web-font-mono",
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AccentProvider>{children}</AccentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Delete the smoke test and verify**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && rm apps/web/src/lib/smoke.test.ts && pnpm --filter @nikaui/web test && pnpm turbo run lint check-types build --continue
```

Expected: 5 tests pass, gate green.

- [ ] **Step 9: Commit**

```bash
git add apps/web
git commit -m "feat(web): token bridge, system theme, and runtime accent switching"
```

---

### Task 3: Navigation and footer

The chrome. D wraps documentation in this, so the links are data rather than a hard-coded marketing set.

**Files:**
- Create: `apps/web/src/components/site/nav-links.ts`
- Create: `apps/web/src/components/site/brand.tsx`
- Create: `apps/web/src/components/site/theme-toggle.tsx`
- Create: `apps/web/src/components/site/accent-switcher.tsx`
- Create: `apps/web/src/components/site/nav.tsx`
- Create: `apps/web/src/components/site/footer.tsx`
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/app/globals.css`

**Interfaces:**
- Consumes: `useAccent`, `ACCENTS`, `Accent` from Task 2
- Produces: `<Nav />`, `<Footer />`, `NAV_LINKS`, `FOOTER_COLUMNS`

- [ ] **Step 1: Define the link data**

`apps/web/src/components/site/nav-links.ts`. **There is no Templates entry** — the section was cut. Every link either resolves or is a `/docs` path that D will fill.

```ts
export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: readonly NavLink[] = [
  { label: "Docs", href: "/docs/guide" },
  { label: "Components", href: "/docs/components" },
  { label: "Pricing", href: "#pricing" },
];

export const GITHUB_URL = "https://github.com/Parrow-Horrizon-Studio/nikaui";

export interface FooterColumn {
  heading: string;
  links: readonly NavLink[];
}

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Components", href: "/docs/components" },
      { label: "Motion", href: "#motion" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "Documentation", href: "/docs/guide" },
      { label: "Installation", href: "/docs/guide/installation" },
      { label: "Theming", href: "/docs/guide/theming" },
      { label: "GitHub", href: GITHUB_URL },
      { label: "License", href: `${GITHUB_URL}/blob/main/LICENSE` },
    ],
  },
];
```

- [ ] **Step 2: Build the brand mark**

`apps/web/src/components/site/brand.tsx` — the prototype's `.sun-mark` is a radial-gradient disc. Port it as a span styled by the class added in Step 6, with the wordmark beside it: `Nika` in `text-content`, `UI` in `text-primary`.

- [ ] **Step 3: Build the theme toggle**

`apps/web/src/components/site/theme-toggle.tsx`. It cycles **system → light → dark → system**, because a two-state toggle makes a `system` default unreachable once touched. It must not render its icon until mounted, or the server's guess and the client's actual theme disagree.

```tsx
"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@nikaui/registry/ui/button";

const ORDER = ["system", "light", "dark"] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const current = ORDER.includes(theme as (typeof ORDER)[number])
    ? (theme as (typeof ORDER)[number])
    : "system";

  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]!;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={mounted ? `Theme: ${current}. Switch to ${next}.` : "Theme"}
    >
      {/* Render nothing until mounted: the server cannot know the visitor's
          system preference, so any icon chosen during SSR is a guess that
          will flip on hydration. */}
      {mounted ? <ThemeIcon theme={current} /> : <span className="size-4" />}
    </Button>
  );
}
```

Write `ThemeIcon` as a local component returning one of three inline SVGs — a monitor for `system`, a sun for `light`, a moon for `dark` — each `className="size-4"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth={2}`.

- [ ] **Step 4: Build the accent switcher**

`apps/web/src/components/site/accent-switcher.tsx`. Five swatch buttons in a row. Each is a real `<button>` with an `aria-label` naming its accent and `aria-pressed` reflecting selection — not a `div` with a click handler.

The swatch's colour cannot come from `--nika-primary`, because that variable *is* the current accent and every swatch would render identically. Each swatch carries its own literal, taken from the corresponding `[data-accent]` block in `tokens.css`:

```tsx
const SWATCHES: Record<Accent, string> = {
  sun: "oklch(0.705 0.188 47)",
  violet: "oklch(0.606 0.204 300)",
  emerald: "oklch(0.646 0.147 158)",
  azure: "oklch(0.638 0.166 250)",
  rose: "oklch(0.645 0.201 12)",
};
```

**Read the five `--nika-primary` values out of `packages/registry/src/styles/tokens.css` and use those exact literals.** The values above are what that file contains at the time of writing; if they differ, the file wins and you should say so in your report.

- [ ] **Step 5: Build the nav and footer**

`nav.tsx` — sticky, `border-b border-line`, translucent `bg-canvas/70` with `backdrop-blur`. Contents left to right: brand, `NAV_LINKS`, spacer, accent switcher, theme toggle, GitHub icon link, and a primary `Button` reading **"Join the waitlist"** linking to `#pricing`. **No version chip** — nothing is published.

`footer.tsx` — `border-t border-line`, a brand column carrying the line *"Beautiful, animated components with the freedom to move. Open source and MIT licensed."*, then `FOOTER_COLUMNS`. Below a separator: `© 2026 Nika UI · Built with the freedom to move.` and, in mono, `named after the Sun God, Nika ☀`.

- [ ] **Step 6: Add the ported decorative CSS**

Append to `globals.css` — the brand mark and the nav surface:

```css
.sun-mark {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, var(--nika-accent), var(--nika-primary) 60%);
  box-shadow: 0 0 18px -2px color-mix(in oklch, var(--nika-primary) 60%, transparent);
  flex: none;
}
```

- [ ] **Step 7: Wrap the layout**

Put `<Nav />` above `{children}` and `<Footer />` below, inside `<AccentProvider>`.

- [ ] **Step 8: Verify by eye and by keyboard**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web dev
```

Open `http://localhost:3001`. Confirm: the theme toggle cycles through all three states and the page actually changes; each of the five swatches retints the brand mark and the waitlist button; the choice survives a reload; `Tab` reaches every control in order and focus is visible on each. Report what you saw.

- [ ] **Step 9: Gate and commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm turbo run lint check-types build test --continue
git add apps/web && git commit -m "feat(web): navigation, footer, theme toggle and accent switcher"
```

---

### Task 4: Hero — structure, rays, sun and install bar

**Files:**
- Create: `apps/web/src/components/landing/hero.tsx`
- Create: `apps/web/src/components/landing/install-bar.tsx`
- Create: `apps/web/src/components/landing/install-bar.test.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/app/page.tsx`

**Interfaces:**
- Produces: `<Hero />`, `<InstallBar command="…" />`

- [ ] **Step 1: Port the decorative CSS**

Append to `globals.css`. This is the prototype's `.hero-sun` and `.hero-rays` with variables rebound per the bridge table, plus the reduced-motion guard the prototype lacks.

```css
.hero-sun {
  position: absolute;
  top: -340px;
  left: 50%;
  transform: translateX(-50%);
  width: 760px;
  height: 760px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(
    circle,
    color-mix(in oklch, var(--nika-primary) 40%, transparent) 0%,
    color-mix(in oklch, var(--nika-accent) 14%, transparent) 32%,
    transparent 64%
  );
  filter: blur(8px);
}

.hero-rays {
  position: absolute;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 140%;
  height: 700px;
  pointer-events: none;
  z-index: 0;
  opacity: 0.5;
  background: conic-gradient(
    from 180deg at 50% 0%,
    transparent 0deg,
    color-mix(in oklch, var(--nika-primary) 22%, transparent) 8deg,
    transparent 16deg,
    transparent 30deg,
    color-mix(in oklch, var(--nika-accent) 16%, transparent) 38deg,
    transparent 46deg,
    transparent 60deg,
    color-mix(in oklch, var(--nika-primary) 18%, transparent) 68deg,
    transparent 76deg,
    transparent 104deg,
    color-mix(in oklch, var(--nika-accent) 16%, transparent) 112deg,
    transparent 120deg,
    transparent 134deg,
    color-mix(in oklch, var(--nika-primary) 22%, transparent) 142deg,
    transparent 150deg,
    transparent 164deg,
    color-mix(in oklch, var(--nika-accent) 14%, transparent) 172deg,
    transparent 180deg
  );
  mask-image: linear-gradient(to bottom, black, transparent 70%);
  -webkit-mask-image: linear-gradient(to bottom, black, transparent 70%);
  animation: nika-rays-drift 24s var(--nika-ease-inout) infinite alternate;
}

@keyframes nika-rays-drift {
  from {
    transform: translateX(-50%) rotate(-1.5deg);
  }
  to {
    transform: translateX(-50%) rotate(1.5deg);
  }
}

/* The library's own motion honours this through the resolver; these two
   decorations are CSS and would otherwise keep moving for a visitor who
   asked everything to stop. */
@media (prefers-reduced-motion: reduce) {
  .hero-rays {
    animation: none;
  }
}
```

- [ ] **Step 2: Write the failing test for the install bar**

`apps/web/src/components/landing/install-bar.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { InstallBar } from "./install-bar";

describe("InstallBar", () => {
  it("shows the command it was given", () => {
    render(<InstallBar command="npx nikaui add button" />);
    expect(screen.getByText(/npx nikaui add button/)).toBeDefined();
  });

  it("labels its copy control for screen readers", () => {
    render(<InstallBar command="npx nikaui add button" />);
    expect(screen.getByRole("button", { name: /copy/i })).toBeDefined();
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web test
```

Expected: FAIL — cannot resolve `./install-bar`.

- [ ] **Step 4: Build the install bar**

A rounded pill: `bg-code`, `border border-line`, `rounded-full`, mono type. A `❯` prompt in `text-primary`, the command, and a copy button using `navigator.clipboard.writeText`. On success swap the icon to a tick for two seconds and announce it in an `aria-live="polite"` region. `navigator.clipboard` is undefined in insecure contexts — guard for it and leave the button inert rather than throwing.

- [ ] **Step 5: Build the hero**

Structure, in order:

1. `.hero-rays` and `.hero-sun`, both `aria-hidden`, inside a `relative overflow-hidden` section.
2. A pill: a solid `Badge` reading **"New"** beside the text **"27 components, five motion presets"**. Not "Motion engine v0.1 is here" — nothing is released.
3. `<h1>`: **"Components with the freedom to move"**, with *"freedom to move"* in a gradient from `--nika-primary` to `--nika-accent`. `max-w-[16ch]`, centred.
4. Lead, `max-w-[56ch]`: **"Beautiful, animated React components built with Tailwind and Motion. Install individually, own the code, theme everything from one line."** The prototype's clause naming another library is removed.
5. Two buttons: primary `size="lg"` **"Get started"** → `/docs/guide`; secondary `size="lg"` **"Browse components"** → `/docs/components`.
6. `<InstallBar command="npx nikaui add button" />`.
7. A slot for Task 5's window.
8. The stat strip: **27 / Components · 5 / Motion presets · 5 / Accents · MIT / Open source core**. The `27` is hard-coded here and Task 11 adds the check that keeps it true.

- [ ] **Step 6: Render it**

Replace `page.tsx`'s body with `<Hero />`.

- [ ] **Step 7: Verify**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web test && pnpm turbo run lint check-types build --continue
```

Then look at it in both themes and confirm the rays and sun retint when you change accent. In your browser's rendering settings, enable `prefers-reduced-motion` and confirm the rays stop.

- [ ] **Step 8: Commit**

```bash
git add apps/web && git commit -m "feat(web): hero with ported rays, sun and install bar"
```

---

### Task 5: Hero — the live component window

The centrepiece. Nine real components, no images.

**Files:**
- Create: `apps/web/src/components/landing/hero-window.tsx`
- Modify: `apps/web/src/components/landing/hero.tsx`
- Modify: `apps/web/src/app/globals.css`

**Interfaces:**
- Consumes: `@nikaui/registry/ui/{card,avatar,input,label,switch,button,badge,progress,tooltip}`
- Produces: `<HeroWindow />`

- [ ] **Step 1: Port the window chrome CSS**

```css
.hero-window {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 940px;
  margin-inline: auto;
  background: var(--nika-surface);
  border: 1px solid var(--nika-line);
  border-radius: var(--nika-radius-2xl);
  box-shadow:
    var(--nika-shadow-lg),
    0 0 80px -20px color-mix(in oklch, var(--nika-primary) 30%, transparent);
  overflow: hidden;
}
```

- [ ] **Step 2: Build the window**

A title bar — `bg-canvas-2`, `border-b border-line` — with three 10px dots and, in mono `text-content-subtle`, `preview — components/ui`.

The body is a two-column grid, `1.1fr 1fr`, collapsing to one column below 720px.

**Left column** — a `Card` containing:
- an `Avatar` with `AvatarFallback` `N`, beside **"Welcome aboard"** and **"Sign in to continue"**
- a `Label` **"Email"** bound by `htmlFor` to a readonly `Input` valued `luffy@nika.dev`
- a `Switch` with `defaultChecked`, labelled **"Keep me signed in"**
- a full-width primary `Button` **"Continue"**

**Right column** — a stack:
- three buttons: `variant="default"`, `variant="secondary"`, `variant="outline"`, all `size="sm"`, reading **"Primary"**, **"Soft"**, **"Outline"**
- three badges: `variant="default"` **"Pro"**, `variant="secondary"` **"Beta"**, `variant="outline"` **"Stable"**
- a `Card` showing a metric. **The prototype's "Monthly installs 14.2k · +12%" is fabricated and must not ship.** Use a label that reads as demo data — **"Weekly active"** over **"1,284"** — with a `Progress value={72}` beneath it.
- a `Tooltip` wrapping a secondary `Button` **"Hover"**, whose `TooltipContent` reads **"Springs in ✦"**, beside an avatar group of three

Every one of these is a real import from `@nikaui/registry/ui/*`. Do not reimplement any of them locally.

- [ ] **Step 3: Slot it into the hero and verify**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm turbo run lint check-types build test --continue
```

Then confirm in the browser that the switch toggles, the tooltip appears on hover **and on keyboard focus**, and the whole window retints with the accent.

- [ ] **Step 4: Confirm every component is real**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && grep -c "@nikaui/registry/ui/" apps/web/src/components/landing/hero-window.tsx
```

Expected: **9**. If it is fewer, something was hand-rolled that should have been imported.

- [ ] **Step 5: Commit**

```bash
git add apps/web && git commit -m "feat(web): live component window in the hero"
```

---

### Task 5b: Fix the registry's reduced-motion hydration mismatch

**Added 2026-08-12, mid-execution, with the human partner's approval.** Not part of the plan as written. Task 5 discovered a real defect in `packages/registry` — sub-project B's shipped code — and two agents independently traced it to the same cause. It is fixed here rather than deferred because it blocks this sub-project: Task 7 renders `Card` five times, and Task 11's completion criteria require a clean console and that nothing animates under `prefers-reduced-motion: reduce`.

**The diagnosis:**

- `useMotionPreset` (`packages/registry/src/lib/motion.ts:120-134`) calls Motion's `useReducedMotion()` at render time, with no client-only gating.
- `Card` (`packages/registry/src/ui/card.tsx:18-22`) sets an unconditional `initial={{ opacity: 0, y: 15 * feel.travel }}`.
- On the server there is no `matchMedia`, so the hook cannot detect the preference. On the client's first render it reads `matchMedia` synchronously and can return `true`. The two renders therefore disagree, and React reports a hydration mismatch. The visitor also sees a brief pre-hydration animation flash — the exact thing their preference asked not to happen.
- `Progress` is **not** affected: its `m.div` sets `initial={false}`, which sidesteps mount-time divergence entirely. That contrast is the clue to the shape of the fix.

**Files:**
- Modify: `packages/registry/src/lib/motion.ts` and/or `packages/registry/src/ui/card.tsx` — the implementer chooses, against the constraints below
- Modify: whichever other `packages/registry/src/ui/*.tsx` share the pattern
- Test: a regression test in `packages/registry`

**This is a library change, not an application change.** It ships to every consumer who runs `nikaui add`, and `apps/docs` renders these components too.

- [ ] **Step 1: Establish the true blast radius before fixing anything**

Two reviewers checked exactly two components. There are 27. Enumerate every component that calls `useMotionPreset` **and** passes a non-`false` `initial` prop — those are precisely the ones with this bug. Report the list. Fixing `Card` alone while three siblings carry the same defect would be a worse outcome than not fixing it, because the next person will reasonably assume it was handled everywhere.

- [ ] **Step 2: Write the failing test first**

The test must fail against current `main` for the stated reason — a hydration mismatch under reduced motion — and pass after. Assert on observable behaviour, not on an implementation detail that a valid alternative fix would break.

- [ ] **Step 3: Fix it, against these constraints**

1. **No hydration mismatch under either preference.** Server and first client render must agree.
2. **Under reduced motion, nothing animates** — not a shortened animation, not a faster one. Sub-project B already established this: `MotionFeel` carries `enabled: boolean`, and `none` sets it `false`.
3. **Under normal motion, the entrance animation still plays.** A fix that disables the animation for everyone passes both prior constraints and defeats the component.
4. **No new flash.** Deferring the reduced-motion check to a mount effect satisfies constraint 1 but lets the animation play for one frame before being switched off — which is the visible symptom this task exists to remove.

Constraint 4 rules out the obvious fix. Say in your report which approach you took and how it satisfies all four.

- [ ] **Step 4: Verify against the consumers**

`apps/web` and `apps/docs` both render these components. Confirm the console is clean in both under reduced motion, and that normal-motion entrance animations still play. The browser in this session has `prefers-reduced-motion: reduce` **active**, which makes the reduced-motion half directly observable and the normal-motion half not — say plainly which half you could observe and what you substituted for the other.

- [ ] **Step 5: Full gate, then commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm turbo run lint check-types build test --continue --force
```

```bash
git add packages/registry && git commit -m "fix(registry): agree with the server on reduced motion"
```

---

### Task 6: Features section

**Files:**
- Create: `apps/web/src/components/landing/features.tsx`
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Build the section**

Eyebrow **"Why Nika"**, heading **"The workflow you know, with motion in its DNA"** — the prototype names another library here and must not. Lead: **"Open, ownable, and animated by default. Built for teams who want polish without fighting a black box."**

A three-column grid collapsing to one below 860px. Each card: `rounded-xl border border-line bg-surface p-[26px]`, hovering to `border-line-strong`, `-translate-y-[3px]` and `shadow`. Each has a 44px icon tile — `rounded-lg`, `bg-primary/14`, `text-primary` — holding a 22px inline SVG.

The six cards, verbatim:

| Heading | Body |
|---|---|
| You own the code | The CLI copies real source into your repo — no opaque package. Read it, fork it, ship it. Forever yours. |
| Animated by default | Every component ships with named spring presets. Pass `motion="bounce"` — done. Powered by Motion. |
| Centralized theming | One token layer drives the whole system. Swap an accent and buttons, rings and gradients all retune. |
| CLI-first install | `npx nikaui add` pulls a component, its dependencies and its motion config in one step. |
| Accessible primitives | Built on Headless UI — focus traps, keyboard navigation and ARIA handled, so your polish never costs accessibility. |
| Light and dark | Two modes, one source of truth. Tuned in OKLCH for consistent contrast across every accent. |

The `motion="bounce"` and `npx nikaui add` fragments render in mono, `text-primary`.

- [ ] **Step 2: Verify and commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm turbo run lint check-types build test --continue
git add apps/web && git commit -m "feat(web): features section"
```

---

### Task 7: Motion section

Where "the page is the demo" earns its place. The prototype animates four CSS balls; this renders the real presets.

**Files:**
- Create: `apps/web/src/components/landing/motion-showcase.tsx`
- Modify: `apps/web/src/app/page.tsx`

**Interfaces:**
- Consumes: `NikaMotionConfig` and `MotionPreset` from `@nikaui/registry/lib/motion`, `Card` from `@nikaui/registry/ui/card`

- [ ] **Step 1: Build the preset demonstrations**

Five tiles, one per preset, in the shipped order. Each wraps a `Card` in `NikaMotionConfig` at that preset. Remounting the `Card` replays its entrance, so a `key` that changes on demand is the replay mechanism:

```tsx
"use client";

import * as React from "react";
import { NikaMotionConfig, type MotionPreset } from "@nikaui/registry/lib/motion";
import { Card } from "@nikaui/registry/ui/card";
import { Button } from "@nikaui/registry/ui/button";

const PRESETS: readonly MotionPreset[] = ["none", "snap", "glide", "spring", "bounce"];

export function MotionShowcase() {
  const [generation, setGeneration] = React.useState(0);

  return (
    <section id="motion" className="…">
      {/* copy column omitted here — see Step 2 */}
      <div className="grid grid-cols-2 gap-4">
        {PRESETS.map((preset) => (
          <NikaMotionConfig key={`${preset}-${generation}`} preset={preset}>
            <Card className="…">
              <span className="text-sm font-medium capitalize">{preset}</span>
            </Card>
          </NikaMotionConfig>
        ))}
      </div>
      <Button variant="outline" onClick={() => setGeneration((g) => g + 1)}>
        Replay
      </Button>
    </section>
  );
}
```

`Card` is the right subject: its hover scale shows the spring configuration and its entrance shows the travel multiplier. A `Button` would show only the first.

**`NikaMotionConfig` requires `children`** — it is a provider and the type enforces it. Do not render it childless.

- [ ] **Step 2: Write the copy column**

Eyebrow **"The signature"**. Heading **"Motion presets, not motion homework"**. Body: **"Components should stretch and spring. Five named curves are baked into the system, so you get tasteful physics without touching a keyframe."** The prototype's reference to a fictional character's rubber powers is charming but reads as noise on a first visit — drop it.

Beneath, five badges naming the presets. **The list is `none`, `snap`, `glide`, `spring`, `bounce`.** The prototype lists `pop`, which does not exist, and omits `spring`, which is the default.

Then a link to `/docs/guide/animation` reading **"Explore presets"**.

- [ ] **Step 3: Verify the preset names against the source**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && node -e "const s=require('fs').readFileSync('packages/registry/src/lib/motion.ts','utf8');const m=[...s.matchAll(/^  ([a-z]+): \{/gm)].map(x=>x[1]);console.log(m.join(' '))"
```

Expected: `none snap glide spring bounce`. If the output differs, the source wins — update the section and report it.

- [ ] **Step 4: Verify by eye**

Run the dev server. Confirm the five tiles visibly differ, that `none` does not animate at all, and that with `prefers-reduced-motion` enabled **every** tile stops — including `bounce`, because the resolver's reduced-motion override outranks an explicit preset.

- [ ] **Step 5: Gate and commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm turbo run lint check-types build test --continue
git add apps/web && git commit -m "feat(web): motion section demonstrating the five shipped presets"
```

---

### Task 8: Pricing and CTA band

**Files:**
- Create: `apps/web/src/components/landing/pricing.tsx`
- Create: `apps/web/src/components/landing/cta-band.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/app/page.tsx`

**Interfaces:**
- Produces: `<Pricing onWaitlist={(tier) => void} />` — Task 9 supplies the handler. Until then pass a no-op.

- [ ] **Step 1: Build the three tiers**

A three-column grid, `max-w-[1080px]`, collapsing to one below 860px. The middle card is emphasised exactly as the prototype emphasises its Pro card: `border-primary/50`, a `ring-1 ring-primary/30`, `shadow-lg`, and a `linear-gradient(180deg, color-mix(in oklch, var(--nika-primary) 8%, var(--nika-surface)), var(--nika-surface))` background. It carries a flag badge reading **"Most popular"**.

| | Free | Personal | Team |
|---|---|---|---|
| Badge | Open source | Lifetime | Lifetime |
| Price | **$0** | **$149** | **$349** |
| Period | / forever | one-time | one-time |
| Blurb | Everything you need to build. | For one developer, on unlimited projects. | For a team, on unlimited projects. |
| CTA | Start building → `/docs/guide` | Join the waitlist | Join the waitlist |

Feature lists — **no counts, because there is nothing to count**:

- **Free:** All 27 core components · Motion presets and theming · CLI and full source · MIT license
- **Personal:** Everything in Free · Premium blocks · Full-page templates · Lifetime updates · 1 developer
- **Team:** Everything in Personal · Up to 5 developers at one organisation · Priority on new blocks

Directly beneath the grid, in `text-content-muted text-sm`, this sentence verbatim:

> Nika Pro is not on sale yet. Join the waitlist and you will hear first — and help decide which blocks get built.

- [ ] **Step 2: Wire the tier buttons**

Both paid buttons call `onWaitlist("personal")` and `onWaitlist("team")`. Task 9 uses that to scroll to the form, focus the field and record the tier.

- [ ] **Step 3: Build the CTA band**

Port the prototype's radial-gradient panel:

```css
.cta-band {
  position: relative;
  overflow: hidden;
  text-align: center;
  padding: clamp(56px, 8vw, 96px) 32px;
  border-radius: var(--nika-radius-2xl);
  border: 1px solid var(--nika-line-strong);
  background:
    radial-gradient(
      circle at 50% -40%,
      color-mix(in oklch, var(--nika-primary) 30%, transparent),
      transparent 60%
    ),
    var(--nika-surface);
}
```

Contents: a 48px sun mark, heading **"Build something with the freedom to move"**, lead **"Open the docs and add your first component in under a minute."**, then a primary `size="lg"` **"Read the docs"** → `/docs/guide` and an outline `size="lg"` **"Star on GitHub"** → `GITHUB_URL`.

- [ ] **Step 4: Verify no forbidden claim survives**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && grep -nE '\$99|12\+|80\+|Figma|40\+' apps/web/src/ -r || echo "PASS: no fabricated claim"
```

Expected: the PASS line.

- [ ] **Step 5: Gate and commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm turbo run lint check-types build test --continue
git add apps/web && git commit -m "feat(web): three-tier pricing and CTA band"
```

---

### Task 9: The waitlist

**Files:**
- Create: `apps/web/src/lib/email.ts`
- Create: `apps/web/src/lib/email.test.ts`
- Create: `apps/web/src/lib/rate-limit.ts`
- Create: `apps/web/src/lib/rate-limit.test.ts`
- Create: `apps/web/src/app/api/waitlist/route.ts`
- Create: `apps/web/src/components/landing/waitlist-form.tsx`
- Modify: `apps/web/src/components/landing/pricing.tsx`
- Create: `apps/web/.env.example`

**Interfaces:**
- Produces: `isValidEmail(value: unknown): boolean`, `takeToken(key: string, now: number): boolean`, `POST /api/waitlist`

- [ ] **Step 1: Write the failing tests for the validator**

`apps/web/src/lib/email.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isValidEmail } from "./email";

describe("isValidEmail", () => {
  it("accepts ordinary addresses", () => {
    expect(isValidEmail("luffy@nika.dev")).toBe(true);
    expect(isValidEmail("a.b+tag@sub.example.co.uk")).toBe(true);
  });

  it("rejects addresses with no domain part", () => {
    expect(isValidEmail("luffy@")).toBe(false);
    expect(isValidEmail("luffy")).toBe(false);
  });

  it("rejects addresses with no local part", () => {
    expect(isValidEmail("@nika.dev")).toBe(false);
  });

  it("rejects whitespace and empty input", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("   ")).toBe(false);
    expect(isValidEmail("lu ffy@nika.dev")).toBe(false);
  });

  it("rejects anything that is not a string", () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(42)).toBe(false);
    expect(isValidEmail({ email: "luffy@nika.dev" })).toBe(false);
  });

  it("rejects an address long enough to be an attack", () => {
    expect(isValidEmail(`${"a".repeat(320)}@nika.dev`)).toBe(false);
  });
});
```

- [ ] **Step 2: Run and watch it fail**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web test
```

Expected: FAIL — cannot resolve `./email`.

- [ ] **Step 3: Implement the validator**

```ts
// Deliberately not RFC 5322. A waitlist needs to reject obvious rubbish
// and let the provider's double opt-in decide the rest — an exhaustive
// pattern rejects valid addresses and is the classic own-goal here.
const SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  return SHAPE.test(trimmed);
}
```

- [ ] **Step 4: Write the failing tests for the rate limiter**

`apps/web/src/lib/rate-limit.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { resetRateLimit, takeToken } from "./rate-limit";

describe("takeToken", () => {
  beforeEach(() => resetRateLimit());

  it("allows the first requests from a key", () => {
    for (let i = 0; i < 5; i++) {
      expect(takeToken("1.2.3.4", 1_000)).toBe(true);
    }
  });

  it("refuses once the allowance is spent", () => {
    for (let i = 0; i < 5; i++) takeToken("1.2.3.4", 1_000);
    expect(takeToken("1.2.3.4", 1_000)).toBe(false);
  });

  it("keeps separate allowances per key", () => {
    for (let i = 0; i < 5; i++) takeToken("1.2.3.4", 1_000);
    expect(takeToken("5.6.7.8", 1_000)).toBe(true);
  });

  it("refills after the window has passed", () => {
    for (let i = 0; i < 5; i++) takeToken("1.2.3.4", 1_000);
    expect(takeToken("1.2.3.4", 1_000)).toBe(false);
    expect(takeToken("1.2.3.4", 1_000 + 60_001)).toBe(true);
  });
});
```

- [ ] **Step 5: Implement it**

```ts
const LIMIT = 5;
const WINDOW_MS = 60_000;

const buckets = new Map<string, { count: number; startedAt: number }>();

/**
 * Best-effort, in-process rate limiting. It does not survive a restart and
 * is not shared between instances, so it stops a naive script and nothing
 * more. Durable limiting needs somewhere to keep state, which arrives with
 * the hosting work in sub-project E7.
 *
 * `now` is a parameter rather than a call to Date.now() so the window is
 * testable without faking timers.
 */
export function takeToken(key: string, now: number): boolean {
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    buckets.set(key, { count: 1, startedAt: now });
    return true;
  }

  if (bucket.count >= LIMIT) return false;

  bucket.count += 1;
  return true;
}

export function resetRateLimit(): void {
  buckets.clear();
}
```

- [ ] **Step 6: Run both suites and watch them pass**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web test
```

Expected: **17 passing** — 5 accent, 2 install bar, 6 email, 4 rate limit. Report the actual number; if it differs, say which suite disagrees rather than adjusting the expectation.

- [ ] **Step 7: Write the route handler**

`apps/web/src/app/api/waitlist/route.ts`. **The unconfigured branch is the point of this task.**

```ts
import { NextResponse } from "next/server";
import { isValidEmail } from "@/lib/email";
import { takeToken } from "@/lib/rate-limit";

const LOOPS_ENDPOINT = "https://app.loops.so/api/v1/contacts/create";

export async function POST(request: Request) {
  const apiKey = process.env.LOOPS_API_KEY;

  // No key means no signup happened. Saying so is the whole point: sub-project
  // B shipped an `init` that reported success while writing nothing, and the
  // documentation believed it for weeks. A form that fakes success is that
  // same defect wearing different clothes.
  if (!apiKey) {
    return NextResponse.json(
      { error: "The waitlist is not accepting signups yet." },
      { status: 503 }
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!takeToken(ip, Date.now())) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { email, tier, company } = (body ?? {}) as Record<string, unknown>;

  // Honeypot: a field no human sees and no human fills. Answer 200 so a bot
  // learns nothing from the response, but send nothing onward.
  if (typeof company === "string" && company.length > 0) {
    return NextResponse.json({ ok: true });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "That email address looks wrong." }, { status: 400 });
  }

  const response = await fetch(LOOPS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      email: (email as string).trim(),
      source: "nikaui.dev waitlist",
      userGroup: typeof tier === "string" ? tier : "unspecified",
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "We could not add you just now. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 8: Create `.env.example`**

```
# Loops API key for the waitlist. Without it the waitlist endpoint returns
# 503 and the form says signups are not open — by design. Get one from
# https://app.loops.so → Settings → API.
LOOPS_API_KEY=
```

- [ ] **Step 9: Build the form**

`waitlist-form.tsx`, sitting directly beneath the pricing grid. It carries:

- a `Label` and an `Input` with `type="email"`, `required`, `autoComplete="email"`
- a hidden `company` text input, `tabIndex={-1}`, `aria-hidden`, positioned off-screen — the honeypot
- a hidden input holding the tier, set when a pricing button is clicked
- a primary `Button` reading **"Join the waitlist"**, disabled while in flight
- a status region: `role="status"`, `aria-live="polite"`, showing the server's message on success or failure
- beneath, in `text-content-subtle text-xs`: **"One email when Pro is ready. Nothing else, and one click to unsubscribe."**

It exposes an imperative handle or accepts a ref so `Pricing`'s `onWaitlist(tier)` can set the tier, scroll it into view and focus the field.

- [ ] **Step 10: Verify the negative control**

This is the check that matters. Run the dev server **without** `LOOPS_API_KEY` set, submit the form, and confirm the interface says signups are not open. Then set a dummy key, submit, and confirm the failure path reports a failure rather than a success — a fake key makes Loops return 401, which must surface as an error.

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui/apps/web" && curl -s -o - -w "\nHTTP %{http_code}\n" -X POST http://localhost:3001/api/waitlist -H "Content-Type: application/json" -d '{"email":"luffy@nika.dev","tier":"personal"}'
```

Expected with no key: `503` and the "not accepting signups yet" message. Record the actual output.

- [ ] **Step 11: Gate and commit**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm turbo run lint check-types build test --continue
git add apps/web && git commit -m "feat(web): waitlist capture through Loops"
```

---

### Task 10: Metadata, social card, robots and sitemap

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/opengraph-image.tsx`
- Create: `apps/web/src/app/robots.ts`
- Create: `apps/web/src/app/sitemap.ts`
- Create: `apps/web/src/lib/site.ts`

- [ ] **Step 1: Centralise the site constants**

`apps/web/src/lib/site.ts`:

```ts
export const SITE = {
  name: "Nika UI",
  title: "Nika UI — Components with the freedom to move",
  description:
    "Beautiful, animated React components built with Tailwind CSS and Motion. Install individually via CLI, own the code, and theme everything from one token layer.",
  // Overridable so a preview deployment does not advertise the production
  // host in its own metadata.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nikaui.dev",
} as const;
```

- [ ] **Step 2: Add metadata to the layout**

```tsx
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { template: "%s | Nika UI", default: SITE.title },
  description: SITE.description,
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description },
};
```

- [ ] **Step 3: Build the Open Graph image**

`opengraph-image.tsx` using `next/og` at 1200×630. It cannot use Tailwind or CSS variables — `ImageResponse` renders in a satori runtime with no stylesheet. Use literal colours matching the `sun` accent on the dark canvas, and render the wordmark, the tagline **"Components with the freedom to move"**, and `npx nikaui add button` in mono.

- [ ] **Step 4: Add robots and sitemap**

```ts
// robots.ts
import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
```

```ts
// sitemap.ts
import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only the landing page exists in this application today. Documentation
  // routes arrive with sub-project D and belong here then.
  return [{ url: SITE.url, changeFrequency: "weekly", priority: 1 }];
}
```

- [ ] **Step 5: Verify the routes render**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm --filter @nikaui/web build && curl -s -o /dev/null -w "og:%{http_code} " http://localhost:3001/opengraph-image && curl -s -o /dev/null -w "robots:%{http_code} " http://localhost:3001/robots.txt && curl -s -o /dev/null -w "sitemap:%{http_code}\n" http://localhost:3001/sitemap.xml
```

Expected: `og:200 robots:200 sitemap:200` against a running dev server. Open the OG image in a browser and look at it — a broken one still returns 200.

- [ ] **Step 6: Commit**

```bash
git add apps/web && git commit -m "feat(web): metadata, social card, robots and sitemap"
```

---

### Task 11: The honesty gate and final verification

Every claim on this page was checked once, by hand, while writing it. This task makes the checks repeatable so they cannot rot.

**Files:**
- Create: `apps/web/src/lib/claims.test.ts`
- Create: `scripts/check-copy.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the test that binds the component count to the registry**

`apps/web/src/lib/claims.test.ts`. The hero says 27; the manifest is the truth.

```ts
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// `import.meta.dirname`, not `__dirname`: this package is `"type": "module"`
// and `__dirname` is undefined under Vitest's ESM transform. Node 22 is the
// pinned runtime, so `import.meta.dirname` is available.
const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");

function registryComponentCount(): number {
  const manifest = JSON.parse(
    readFileSync(path.join(REPO_ROOT, "packages/cli/src/registry.json"), "utf8")
  ) as { components: Record<string, unknown> };
  return Object.keys(manifest.components).length;
}

function heroSource(): string {
  return readFileSync(
    path.join(REPO_ROOT, "apps/web/src/components/landing/hero.tsx"),
    "utf8"
  );
}

describe("the page's factual claims", () => {
  it("claims exactly as many components as the registry ships", () => {
    const count = registryComponentCount();
    expect(heroSource()).toContain(String(count));
  });

  it("agrees with the number of component files on disk", () => {
    const files = readdirSync(path.join(REPO_ROOT, "packages/registry/src/ui")).filter(
      (f) => f.endsWith(".tsx") && !f.includes(".test.")
    );
    expect(files.length).toBe(registryComponentCount());
  });
});
```

- [ ] **Step 2: Write the forbidden-copy script**

`scripts/check-copy.mjs` — every pattern is a string the prototype contains and production must not.

```js
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "apps", "web", "src");

const FORBIDDEN = [
  { pattern: /npx nika(?!ui)/, why: "the advertised command is `npx nikaui`" },
  { pattern: /Rowee13\//, why: "the repository moved to Parrow-Horrizon-Studio" },
  { pattern: /\b40\+|\b12\+|\b80\+/, why: "fabricated counts" },
  { pattern: /Figma/i, why: "no design kit exists" },
  { pattern: /\$99\b/, why: "pricing is $149 and $349" },
  { pattern: /data-theme=/, why: "theming switches on the .dark class" },
  { pattern: /"pop"|'pop'|\bpop\b(?=.*preset)/, why: "there is no preset named pop" },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx|css|mjs)$/.test(entry)) yield full;
  }
}

let failed = false;
for (const file of walk(ROOT)) {
  const source = readFileSync(file, "utf8");
  for (const { pattern, why } of FORBIDDEN) {
    const match = source.match(pattern);
    if (match) {
      console.error(`${path.relative(ROOT, file)}: found "${match[0]}" — ${why}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("PASS: no forbidden copy");
```

- [ ] **Step 3: Prove the script can fail**

Add `const x = "npx nika add button";` to any file under `apps/web/src`, run the script, confirm it exits non-zero and names the file, then remove the line. **Report both runs.** A check nobody has seen fail is not a check — this plan's predecessor shipped three of those.

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && node scripts/check-copy.mjs; echo "exit $?"
```

- [ ] **Step 4: Wire it into the root scripts**

Add to the root `package.json`:

```json
"check-copy": "node scripts/check-copy.mjs"
```

- [ ] **Step 4a: Check that every link resolves**

Spec §5.8 requires it, and a dead link is exactly the kind of thing that survives a visual pass. Enumerate every `href` the site renders and classify it:

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && grep -rhoE 'href[:=]\s*["`][^"`]+["`]' apps/web/src | grep -oE '[^"`]+$' | sort -u
```

Every result must be one of: an in-page anchor whose `id` exists in `apps/web/src` (grep for it), an absolute `https://github.com/Parrow-Horrizon-Studio/…` URL, or a `/docs/…` path. **`/docs/…` paths are the only permitted dangling links** — sub-project D fills them. Anything else, including a bare `#`, is a defect. List what you found and how each was classified.

- [ ] **Step 5: Run the complete gate**

```bash
cd "F:/dev/00_Parrow-Horrizon-Studio/01_nika-ui/nikaui" && pnpm check-copy && pnpm turbo run lint check-types build test --continue --force
```

Expected: PASS, then every task successful and uncached.

- [ ] **Step 6: Verify by eye — this is the part no script covers**

Run the dev server and walk the page:

1. Both themes, and confirm `system` is what an untouched visitor gets.
2. All five accents, confirming the rays, sun, brand mark, buttons, badges and window glow all retune.
3. Keyboard only, from the top: every nav link, both switchers, the copy button, every hero control, the replay button, both pricing buttons, the waitlist field and its submit. Focus visible throughout.
4. `prefers-reduced-motion: reduce`: the rays stop, and every motion tile including `bounce` is still.
5. At 375px wide: the hero window stacks to one column, the feature grid and the pricing grid to one column, and nothing overflows horizontally.

Report what you saw for each.

- [ ] **Step 7: Commit**

```bash
git add apps/web scripts package.json
git commit -m "test(web): bind the component count to the registry and gate the copy"
```

---

## Completion criteria

C is complete when:

1. `pnpm lint`, `pnpm check-types`, `pnpm build` and `pnpm test` all pass, uncached.
2. `pnpm check-copy` passes, **and has been observed failing** against a deliberately introduced violation.
3. The hero's component count is bound to `packages/cli/src/registry.json` by a test, not hard-coded twice.
4. The waitlist returns 503 with no API key and the form says so; a bad key surfaces as a failure, not a success.
5. The page renders correctly in both themes and all five accents, confirmed by eye.
6. Keyboard navigation reaches every interactive control, with visible focus.
7. Under `prefers-reduced-motion: reduce`, nothing animates — including the hero rays and the `bounce` tile.
8. Every link resolves, except `/docs/*`, which sub-project D fills.
9. There is no Templates section, no Figma mention, and no `$99`.
