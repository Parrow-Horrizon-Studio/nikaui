import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Pricing } from "./pricing";

afterEach(cleanup);

/** Scopes queries to one tier's card via its `data-tier` hook — the same
 *  pattern motion-showcase.tsx's `data-preset` uses — rather than relying on
 *  DOM nesting depth, which the header row's own wrapping div would break. */
function tierCard(container: HTMLElement, slug: "free" | "personal" | "team") {
  const card = container.querySelector<HTMLElement>(`[data-tier="${slug}"]`);
  if (card === null) throw new Error(`No card for data-tier="${slug}"`);
  return within(card);
}

/**
 * The commercial terms this section must match exactly: Free $0, Personal
 * $149 one-time, Team $349 one-time. Both paid tiers open the waitlist —
 * neither is a checkout — and no feature line invents a count. See spec §C5
 * in docs/superpowers/specs/2026-08-12-nikaui-landing-page.md.
 */
describe("Pricing", () => {
  it("carries the id the nav and footer's Pricing link (#pricing) points to", () => {
    const { container } = render(<Pricing />);
    expect(container.querySelector("section#pricing")).not.toBeNull();
  });

  it("renders exactly three tiers, in order: Free, Personal, Team", () => {
    const { container } = render(<Pricing />);
    const tiers = Array.from(container.querySelectorAll("[data-tier]")).map((el) =>
      el.getAttribute("data-tier")
    );
    expect(tiers).toEqual(["free", "personal", "team"]);

    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(["Free", "Personal", "Team"]);
  });

  describe("Free", () => {
    it("shows the exact badge, price, period and blurb", () => {
      const { container } = render(<Pricing />);
      const card = tierCard(container, "free");
      expect(card.getByText("Open source")).toBeDefined();
      expect(card.getByText("$0")).toBeDefined();
      expect(card.getByText("/ forever")).toBeDefined();
      expect(card.getByText("Everything you need to build.")).toBeDefined();
    });

    it("lists exactly its four features, no counts", () => {
      const { container } = render(<Pricing />);
      const items = tierCard(container, "free")
        .getAllByRole("listitem")
        .map((li) => li.textContent);
      expect(items).toEqual([
        "All 27 core components",
        "Motion presets and theming",
        "CLI and full source",
        "MIT license",
      ]);
    });

    it('links "Start building" to /docs/guide, not a checkout', () => {
      render(<Pricing />);
      const link = screen.getByRole("link", { name: "Start building" });
      expect(link.getAttribute("href")).toBe("/docs/guide");
    });
  });

  describe("Personal", () => {
    it("shows the exact badge, price, period and blurb", () => {
      const { container } = render(<Pricing />);
      const card = tierCard(container, "personal");
      expect(card.getByText("Lifetime")).toBeDefined();
      expect(card.getByText("$149")).toBeDefined();
      expect(card.getByText("one-time")).toBeDefined();
      expect(card.getByText("For one developer, on unlimited projects.")).toBeDefined();
    });

    it("lists exactly its five features, no counts", () => {
      const { container } = render(<Pricing />);
      const items = tierCard(container, "personal")
        .getAllByRole("listitem")
        .map((li) => li.textContent);
      expect(items).toEqual([
        "Everything in Free",
        "Premium blocks",
        "Full-page templates",
        "Lifetime updates",
        "1 developer",
      ]);
    });

    it('is the sole card carrying the "Most popular" flag', () => {
      const { container } = render(<Pricing />);
      expect(screen.getAllByText("Most popular")).toHaveLength(1);
      expect(tierCard(container, "personal").getByText("Most popular")).toBeDefined();
    });

    it("is visually emphasised with the highlight classes the brief specifies", () => {
      const { container } = render(<Pricing />);
      const card = container.querySelector('[data-tier="personal"]')!;
      expect(card.className).toContain("pricing-highlight");
      expect(card.className).toContain("border-primary/50");
      expect(card.className).toContain("ring-primary/30");
      expect(card.className).toContain("shadow-lg");
    });

    it('its call to action reads "Join the waitlist" and calls onWaitlist("personal") — never a checkout', () => {
      const onWaitlist = vi.fn();
      const { container } = render(<Pricing onWaitlist={onWaitlist} />);
      const button = tierCard(container, "personal").getByRole("button", {
        name: "Join the waitlist for Personal",
      });
      expect(button.tagName).toBe("BUTTON");
      // The tier only qualifies the accessible name; the visible text stays
      // exactly what the spec's copy says, and remains a prefix of it.
      expect(button.textContent).toBe("Join the waitlist");

      fireEvent.click(button);

      expect(onWaitlist).toHaveBeenCalledTimes(1);
      expect(onWaitlist).toHaveBeenCalledWith("personal");
    });
  });

  describe("Team", () => {
    it("shows the exact badge, price, period and blurb", () => {
      const { container } = render(<Pricing />);
      const card = tierCard(container, "team");
      expect(card.getByText("Lifetime")).toBeDefined();
      expect(card.getByText("$349")).toBeDefined();
      expect(card.getByText("one-time")).toBeDefined();
      expect(card.getByText("For a team, on unlimited projects.")).toBeDefined();
    });

    it("lists exactly its three features, no counts", () => {
      const { container } = render(<Pricing />);
      const items = tierCard(container, "team")
        .getAllByRole("listitem")
        .map((li) => li.textContent);
      expect(items).toEqual([
        "Everything in Personal",
        "Up to 5 developers at one organisation",
        "Priority on new blocks",
      ]);
    });

    it("does not carry the Most popular flag", () => {
      const { container } = render(<Pricing />);
      expect(tierCard(container, "team").queryByText("Most popular")).toBeNull();
    });

    it('its call to action reads "Join the waitlist" and calls onWaitlist("team") — never a checkout', () => {
      const onWaitlist = vi.fn();
      const { container } = render(<Pricing onWaitlist={onWaitlist} />);
      const button = tierCard(container, "team").getByRole("button", {
        name: "Join the waitlist for Team",
      });
      expect(button.textContent).toBe("Join the waitlist");

      fireEvent.click(button);

      expect(onWaitlist).toHaveBeenCalledTimes(1);
      expect(onWaitlist).toHaveBeenCalledWith("team");
    });
  });

  it("shows the not-on-sale-yet sentence verbatim, beneath the grid", () => {
    render(<Pricing />);
    expect(
      screen.getByText(
        "Nika Pro is not on sale yet. Join the waitlist and you will hear first — and help decide which blocks get built."
      )
    ).toBeDefined();
  });

  it("drives the waitlist form via ref and never throws when onWaitlist is omitted — the documented default", () => {
    // Scoped to the two tier cards' own CTA buttons via tierCard(), not a
    // page-wide getAllByRole: since Task 9, <Pricing> also renders
    // <WaitlistForm>, whose submit button is separately labelled "Join the
    // waitlist" (see waitlist-form.tsx) and is not this test's concern —
    // its own behaviour under a missing onWaitlist is that both CTAs drive
    // that form's ref rather than throwing, which is exactly what this
    // test still exercises.
    const { container } = render(<Pricing />);
    const buttons = [
      tierCard(container, "personal").getByRole("button", {
        name: "Join the waitlist for Personal",
      }),
      tierCard(container, "team").getByRole("button", { name: "Join the waitlist for Team" }),
    ];
    buttons.forEach((button) => {
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  // A defensive "no forbidden claim" assertion deliberately does not live
  // here: writing the forbidden substrings into this file (even inside a
  // `.not.toMatch` regex) would itself trip the honesty gate those strings
  // exist to feed — scripts/check-copy.mjs, which implements spec §5 item 3
  // in docs/superpowers/specs/2026-08-12-nikaui-landing-page.md. That gate
  // is the authoritative check;
  // this file only needs to assert what the tiers *do* say, which the exact
  // price/badge/feature-line tests above already pin down completely.
});
