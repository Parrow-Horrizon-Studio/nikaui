import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FOOTER_COLUMNS } from "./nav-links";
import { Footer } from "./footer";

afterEach(() => {
  cleanup();
});

/**
 * Like Nav, this footer is not marketing chrome that gets thrown away —
 * sub-project D wraps every documentation route in it. The layout is pinned
 * against the data that drives it (`FOOTER_COLUMNS`) so a future column
 * addition can't silently break the grid, and the links that used to be
 * bare same-page fragments are pinned to their fixed form.
 */
describe("Footer", () => {
  // Same defect as the nav's CTA and Pricing link: a bare "#pricing"
  // resolves only on the landing page and goes nowhere from /docs/*.
  it("points the Pricing footer link at the landing page, not a bare fragment", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: "Pricing" });
    expect(link.getAttribute("href")).toBe("/#pricing");
  });

  // Identical defect class, same fix: a bare "#motion" resolves only on the
  // landing page and goes nowhere from /docs/*.
  it("points the Motion footer link at the landing page, not a bare fragment", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: "Motion" });
    expect(link.getAttribute("href")).toBe("/#motion");
  });

  it("renders every column in FOOTER_COLUMNS, whatever the count", () => {
    render(<Footer />);
    for (const column of FOOTER_COLUMNS) {
      const heading = screen.getByRole("heading", { name: column.heading });
      expect(heading).toBeDefined();
      // Every link's accessible name is unique across the whole footer (no
      // two columns link the same label to different places), so a plain
      // `screen.getByRole` is enough here — no per-column scoping needed.
      for (const link of column.links) {
        expect(screen.getByRole("link", { name: link.label })).toBeDefined();
      }
    }
    // Guards the layout against the data: a hard-coded grid template that
    // assumes N columns silently drops or misplaces the N+1th.
    expect(FOOTER_COLUMNS.length).toBeGreaterThanOrEqual(3);
  });
});
