"use client";

import * as React from "react";
import { cn } from "@nikaui/registry/lib/utils";
import { ACCENTS, DEFAULT_ACCENT, type Accent, useAccent } from "./accent";

/**
 * Each swatch's colour is its own literal, not `var(--nika-primary)` —
 * that variable *is* whichever accent is currently active, so every swatch
 * would render identically if it read from it. These are the exact
 * `--nika-primary` values from each accent's `[data-accent]` block in
 * packages/registry/src/styles/tokens.css.
 */
const SWATCHES: Record<Accent, string> = {
  sun: "oklch(0.705 0.188 47)",
  violet: "oklch(0.635 0.205 290)",
  emerald: "oklch(0.695 0.155 162)",
  azure: "oklch(0.64 0.165 248)",
  rose: "oklch(0.655 0.205 18)",
};

const LABELS: Record<Accent, string> = {
  sun: "Sun",
  violet: "Violet",
  emerald: "Emerald",
  azure: "Azure",
  rose: "Rose",
};

export function AccentSwitcher() {
  const { accent, setAccent } = useAccent();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // The server has no access to localStorage, so it always renders as
  // though `accent` were the default — same reasoning as ThemeToggle. The
  // pre-hydration script (Task 2) means the *first client render* can
  // already disagree with that (a returning visitor's real accent), which
  // is a hydration mismatch on `aria-pressed`/className, not just a visual
  // flash. Rendering against the default until mounted keeps that first
  // client render identical to the server's; the mount effect then
  // corrects it via an ordinary post-hydration re-render.
  const selectedAccent = mounted ? accent : DEFAULT_ACCENT;

  return (
    <div role="group" aria-label="Accent colour" className="flex items-center gap-1.5">
      {ACCENTS.map((option) => {
        const selected = option === selectedAccent;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setAccent(option)}
            aria-label={`${LABELS[option]} accent`}
            aria-pressed={selected}
            className={cn(
              "size-5 rounded-full ring-offset-2 ring-offset-canvas transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "ring-2 ring-content" : "ring-1 ring-line-strong hover:ring-content-subtle",
            )}
            style={{ backgroundColor: SWATCHES[option] }}
          />
        );
      })}
    </div>
  );
}
