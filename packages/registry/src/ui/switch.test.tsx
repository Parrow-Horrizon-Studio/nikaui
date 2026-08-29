import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Switch } from "./switch";

/**
 * The off state must not depend on an attribute that is never set.
 *
 * `data-[unchecked]:bg-line` shipped, looked correct in review, and matched
 * nothing: Headless UI emits `data-checked` when a Switch is on and emits no
 * attribute at all when it is off. The off track was therefore transparent —
 * 1.00:1 against the page, an off switch visible only by its thumb.
 *
 * Every unit test passed the whole time, because the class string was present
 * and well-formed. Only reading the computed style in a real browser exposed
 * it. This is that check, made cheap enough to keep.
 */
describe("Switch off state", () => {
  it("does not rely on a data-unchecked attribute", () => {
    render(<Switch aria-label="s" />);
    const el = screen.getByRole("switch");
    // Proves the premise rather than assuming it: if a future Headless UI
    // starts emitting this, the guard below can be relaxed deliberately.
    expect(el.hasAttribute("data-unchecked")).toBe(false);
    expect(el.className).not.toContain("data-[unchecked]:");
  });

  it("paints the off track unconditionally", () => {
    render(<Switch aria-label="s" />);
    const cls = screen.getByRole("switch").className;
    expect(cls).toContain("bg-indicator");
    expect(cls).toContain("data-[checked]:bg-primary");
  });

  it("still switches to the accent when on", () => {
    render(<Switch defaultChecked aria-label="s" />);
    const el = screen.getByRole("switch");
    expect(el.getAttribute("aria-checked")).toBe("true");
    expect(el.hasAttribute("data-checked")).toBe(true);
  });
});
