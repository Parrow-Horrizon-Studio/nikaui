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
              // Every other focus ring in this codebase uses
              // `ring-ring` — `--nika-ring`, a 55%-opacity mix of the
              // active accent (packages/registry/src/styles/tokens.css) —
              // and it reads clearly on a text link or a full-size button.
              // On a 20px circle it doesn't: confirmed live (real keyboard
              // focus, both themes, zoomed screenshots) that the ring
              // *paints* — computed `box-shadow` carries the right color
              // and spread, nothing clips or occludes it — it's just too
              // thin and too translucent at this element's size to read as
              // a ring rather than background noise. `--nika-ring` is a
              // shared token used everywhere else this pattern appears
              // (every nav link, every registry form control); changing it
              // would restyle focus rings site-wide to fix one component,
              // so this swaps only this button's focus-visible color for
              // `ring-content` — already used two lines down for the
              // opaque "selected" ring, proven visible in the same
              // screenshots — and widens it to `ring-4` so a
              // selected-and-focused swatch still visibly grows relative
              // to selected-but-unfocused (`ring-2`), rather than the two
              // states becoming indistinguishable.
              "size-5 rounded-full ring-offset-2 ring-offset-canvas transition-shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-content",
              selected ? "ring-2 ring-content" : "ring-1 ring-line-strong hover:ring-content-subtle",
            )}
            style={{ backgroundColor: SWATCHES[option] }}
          />
        );
      })}
    </div>
  );
}
