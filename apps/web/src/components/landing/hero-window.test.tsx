// This project's Vitest pipeline has no automatic-JSX-runtime plugin
// configured (apps/web/tsconfig.json sets "jsx": "preserve", meant for
// Next's own SWC build, not Vite/esbuild), so any file using JSX syntax
// needs React in scope for the classic transform — the same reason
// hero-window.tsx itself imports React, and the same reason
// site/theme-toggle.test.tsx and site/accent-switcher.test.tsx do too.
import * as React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HeroWindow } from "./hero-window";

/**
 * Tooltip's exit is a Motion `AnimatePresence` fade (opacity 1 -> 0), not an
 * abrupt unmount — the node stays in the DOM, mid-transition, until the
 * animation completes. jsdom has no real animation-frame clock, so instead
 * of asserting the node is gone immediately after the closing event, assert
 * the state genuinely flipped: either the node is already gone, or it is
 * still present but now rendering the closed (opacity: 0) frame rather than
 * the open one.
 */
function expectTooltipClosing() {
  const el = screen.queryByText("Springs in ✦");
  if (el === null) return;
  expect(el.getAttribute("style") ?? "").toContain("opacity: 0");
}

describe("HeroWindow", () => {
  it("renders without crashing and shows the demo metric, not fabricated install numbers", () => {
    render(<HeroWindow />);
    expect(screen.getByText("Weekly active")).toBeDefined();
    expect(screen.getByText("1,284")).toBeDefined();
    expect(screen.queryByText(/14\.2k/)).toBeNull();
    expect(screen.queryByText(/installs/i)).toBeNull();
  });

  it("the Email label is genuinely associated with the Input via htmlFor/id", () => {
    render(<HeroWindow />);
    // getByLabelText only resolves via a real htmlFor/id (or wrapping)
    // relationship — if the association were merely visual adjacency, this
    // query would fail even though the page looks identical.
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    expect(input.value).toBe("luffy@nika.dev");
    expect(input.readOnly).toBe(true);
  });

  it("the switch starts checked (defaultChecked) and toggles on click", () => {
    render(<HeroWindow />);
    const toggle = screen.getByRole("switch", { name: "Keep me signed in" });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });

  it("clicking the 'Keep me signed in' label toggles the switch (genuine label association, not just adjacency)", () => {
    render(<HeroWindow />);
    const toggle = screen.getByRole("switch", { name: "Keep me signed in" });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    // Click the label's text node, not the switch control itself — this is
    // the one assertion a merely-adjacent (unassociated) Label would fail.
    fireEvent.click(screen.getByText("Keep me signed in"));
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("the tooltip content is absent until hover, then appears, then closes on mouse leave", async () => {
    render(<HeroWindow />);
    expect(screen.queryByText("Springs in ✦")).toBeNull();
    const trigger = screen.getByRole("button", { name: "Hover" });
    fireEvent.mouseEnter(trigger);
    expect(screen.getByText("Springs in ✦")).toBeDefined();
    fireEvent.mouseLeave(trigger);
    await waitFor(expectTooltipClosing);
  });

  it("the tooltip appears on keyboard focus and closes on blur", async () => {
    render(<HeroWindow />);
    const trigger = screen.getByRole("button", { name: "Hover" });
    expect(screen.queryByText("Springs in ✦")).toBeNull();
    // A keyboard user never hovers — focus is the only path they have to
    // this content, so it has to be exercised independently of the hover
    // test above, not assumed to work because hover does.
    fireEvent.focus(trigger);
    expect(screen.getByText("Springs in ✦")).toBeDefined();
    fireEvent.blur(trigger);
    await waitFor(expectTooltipClosing);
  });

  it("every interactive control has an accessible name", () => {
    render(<HeroWindow />);
    expect(screen.getByRole("textbox", { name: "Email" })).toBeDefined();
    expect(screen.getByRole("switch", { name: "Keep me signed in" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Primary" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Soft" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Outline" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Hover" })).toBeDefined();
  });

  it("every button and the switch are keyboard-reachable (no positive/negative tabindex, not disabled)", () => {
    render(<HeroWindow />);
    const buttons = screen.getAllByRole("button");
    const switches = screen.getAllByRole("switch");
    for (const el of [...buttons, ...switches]) {
      expect(el.hasAttribute("disabled")).toBe(false);
      const tabIndex = el.getAttribute("tabindex");
      expect(tabIndex === null || tabIndex === "0").toBe(true);
    }
  });
});
