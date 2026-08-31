import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PreviewWithSwitchers } from "./preview-switchers";

/**
 * The motion switcher is the only place in the documentation where the five
 * presets can be felt rather than read about, so what it must actually do is
 * change the preset the demo renders under — not merely look selected.
 */
describe("PreviewWithSwitchers", () => {
  it("renders the component's live demo", () => {
    render(<PreviewWithSwitchers name="button" />);
    expect(screen.getByTestId("preview")).toBeDefined();
  });

  it("starts on spring, the library default", () => {
    render(<PreviewWithSwitchers name="button" />);
    expect(screen.getByTestId("preview").getAttribute("data-motion")).toBe("spring");
  });

  it("changes the preset the demo renders under", () => {
    render(<PreviewWithSwitchers name="button" />);
    fireEvent.click(screen.getByRole("button", { name: "bounce" }));
    expect(screen.getByTestId("preview").getAttribute("data-motion")).toBe("bounce");
  });

  it("marks the active preset for assistive technology, not just visually", () => {
    render(<PreviewWithSwitchers name="button" />);
    fireEvent.click(screen.getByRole("button", { name: "none" }));
    expect(screen.getByRole("button", { name: "none" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "spring" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("fails loudly for a component with no preview", () => {
    // A silent miss would ship an empty box on a green build - the same
    // failure the derived index exists to end.
    expect(() => render(<PreviewWithSwitchers name="nope" />)).toThrow(/no preview registered/);
  });
});
