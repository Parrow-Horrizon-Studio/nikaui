import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Same boundary and same reason as theme-toggle.test.tsx: the real
// `useTheme` needs a provider that queries `window.matchMedia`, which jsdom
// does not implement. A minimal stand-in backed by real `useState` keeps
// ThemeToggle a genuine component here without dragging the whole
// next-themes runtime into a test about the header's links.
vi.mock("next-themes", () => ({
  useTheme: () => {
    const [theme, setTheme] = React.useState<string>("system");
    return { theme, setTheme };
  },
}));

import { AccentProvider } from "./accent";
import { MAIN_CONTENT_ID, Nav } from "./nav";
import { NAV_LINKS } from "./nav-links";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-accent");
  window.localStorage.clear();
});

/** AccentSwitcher reads context that layout.tsx supplies; rendering the
 *  header bare throws before any assertion runs. */
function renderNav() {
  return render(
    <AccentProvider>
      <Nav />
    </AccentProvider>
  );
}

/**
 * This header is not marketing chrome that gets thrown away — sub-project D
 * wraps every documentation route in it. Anything wrong here is wrong on
 * every page of the site, so the two things a keyboard-only visitor depends
 * on are pinned: a skip link that comes first, and a waitlist call to action
 * that lands on the waitlist.
 */
describe("Nav", () => {
  it("offers a skip link as the very first tabbable control", () => {
    const { container } = renderNav();

    const tabbable = Array.from(
      container.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea")
    ).filter((el) => el.getAttribute("tabindex") !== "-1");

    expect(tabbable[0]?.textContent).toBe("Skip to content");
  });

  it("points the skip link at the id the page's <main> carries", () => {
    renderNav();
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip.getAttribute("href")).toBe(`#${MAIN_CONTENT_ID}`);
  });

  it("hides the skip link until it is focused, rather than removing it from the tab order", () => {
    renderNav();
    const skip = screen.getByRole("link", { name: "Skip to content" });
    // sr-only keeps it reachable by Tab; focus:not-sr-only is what makes it
    // a visible control once it is. `hidden` or `tabindex="-1"` would make
    // this link useless to exactly the people it exists for.
    const classes = skip.className.split(/\s+/);
    expect(classes).toContain("sr-only");
    expect(classes).toContain("focus:not-sr-only");
    expect(skip.hasAttribute("tabindex")).toBe(false);
  });

  // It used to target #pricing, leaving the visitor to find the form
  // themselves beneath three cards. #waitlist is the id WaitlistForm's root
  // actually carries. It is also prefixed with "/" (below) so the control
  // still resolves from documentation routes, not only the landing page.
  it("sends its waitlist call to action to the waitlist form, not the pricing grid", () => {
    renderNav();
    const cta = screen.getByRole("link", { name: "Join the waitlist" });
    expect(cta.getAttribute("href")).toBe("/#waitlist");
  });

  it("points the waitlist call to action at the landing page, not a bare fragment", () => {
    // Not `render(<Nav />)` directly, per the file's own convention above:
    // AccentSwitcher reads AccentProvider's context and throws without it.
    renderNav();
    const cta = screen.getByRole("link", { name: "Join the waitlist" });
    // `#waitlist` alone resolves only on the landing page; on /docs/* it goes
    // nowhere. The form lives in <Pricing> which only the landing page mounts.
    expect(cta.getAttribute("href")).toBe("/#waitlist");
  });

  // Same defect as the CTA: a bare "#pricing" resolves only on the landing
  // page and goes nowhere from /docs/*.
  it("points the Pricing nav link at the landing page, not a bare fragment", () => {
    renderNav();
    const link = screen.getByRole("link", { name: "Pricing" });
    expect(link.getAttribute("href")).toBe("/#pricing");
  });

  it("renders every configured navigation link with its href", () => {
    renderNav();
    for (const link of NAV_LINKS) {
      expect(screen.getByRole("link", { name: link.label }).getAttribute("href")).toBe(
        link.href
      );
    }
  });
});
