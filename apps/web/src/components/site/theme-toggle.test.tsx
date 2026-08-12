import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// `next-themes`' real `useTheme` needs a `ThemeProvider` that queries
// `window.matchMedia` for the system preference — not available in jsdom
// and not what this suite is testing anyway. What we own is the `ORDER`
// cycling math in theme-toggle.tsx, so replace the hook with a minimal
// stand-in that is still a *real* React hook (backed by real `useState`,
// not a jest-style spy returning canned values) — clicking the toggle
// drives a genuine re-render, exactly like the real hook would. Mirrors
// how packages/registry/src/lib/motion.test.ts mocks `motion/react`'s
// `useReducedMotion` at the same kind of third-party boundary.
vi.mock("next-themes", () => ({
  useTheme: () => {
    const [theme, setTheme] = React.useState<string>("system");
    return { theme, setTheme };
  },
}));

import { ThemeToggle } from "./theme-toggle";

function label() {
  return screen.getByRole("button").getAttribute("aria-label");
}

describe("ThemeToggle cycling", () => {
  afterEach(cleanup);

  it("starts on system", () => {
    render(<ThemeToggle />);
    expect(label()).toBe("Theme: system. Switch to light.");
  });

  it("advances system -> light -> dark -> system, and the loop actually closes", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(label()).toBe("Theme: light. Switch to dark.");

    fireEvent.click(button);
    expect(label()).toBe("Theme: dark. Switch to system.");

    // The wrap-around is where an off-by-one in `(index + 1) % length`
    // hides: asserting only the first two steps would pass even if the
    // cycle dead-ended at "dark" instead of looping back. A visitor who
    // has clicked into dark needs a way back to "follow my OS" — that
    // guarantee lives entirely in this third click.
    fireEvent.click(button);
    expect(label()).toBe("Theme: system. Switch to light.");
  });

  it("keeps cycling correctly on a second full loop", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    for (let i = 0; i < 6; i += 1) {
      fireEvent.click(button);
    }

    // Six clicks is two full three-state loops from "system" — should
    // land back on "system" again, not drift.
    expect(label()).toBe("Theme: system. Switch to light.");
  });
});
