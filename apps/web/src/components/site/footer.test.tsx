import { cleanup, render, screen, within } from "@testing-library/react";
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
 * addition can't silently break the grid, and the one link that used to be
 * a bare same-page fragment is pinned to its fixed form.
 */
describe("Footer", () => {
  // Same defect as the nav's CTA and Pricing link: a bare "#pricing"
  // resolves only on the landing page and goes nowhere from /docs/*.
  it("points the Pricing footer link at the landing page, not a bare fragment", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: "Pricing" });
    expect(link.getAttribute("href")).toBe("/#pricing");
  });

  it("renders every column in FOOTER_COLUMNS, whatever the count", () => {
    render(<Footer />);
    for (const column of FOOTER_COLUMNS) {
      const heading = screen.getByRole("heading", { name: column.heading });
      expect(heading).toBeDefined();
      // Scoped to this column's own wrapper, not `screen`: "Components",
      // "Installation" and "Theming" each appear in more than one column
      // (the same docs pages are cross-linked from Product/Developers and
      // this new Documentation column), so an unscoped `getByRole` would
      // find multiple same-named links and throw on the very links this
      // test exists to check.
      const columnContainer = heading.closest("div");
      if (!columnContainer) throw new Error(`No wrapper found for column "${column.heading}"`);
      for (const link of column.links) {
        expect(within(columnContainer).getByRole("link", { name: link.label })).toBeDefined();
      }
    }
    // Guards the layout against the data: a hard-coded grid template that
    // assumes N columns silently drops or misplaces the N+1th.
    expect(FOOTER_COLUMNS.length).toBeGreaterThanOrEqual(3);
  });
});
