import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";

/**
 * A tooltip must not look like a popover.
 *
 * They were pixel-identical: both `bg-overlay` + `border-line` +
 * `text-content`. Two components with different jobs, different lifetimes and
 * different interaction models, rendering the same box. Nothing but position
 * told a reader which one they were looking at.
 */
describe("Tooltip", () => {
  // Tooltip has no `defaultOpen`; its open state is internal and driven by
  // pointer/focus. fireEvent is how the test opens it for real rather than
  // asserting on source text.
  const open = (extra: Record<string, unknown> = {}) => {
    render(
      <Tooltip>
        <TooltipTrigger>t</TooltipTrigger>
        <TooltipContent {...extra}>hi</TooltipContent>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText("t"));
  };

  it("inverts against the page by default", () => {
    open();
    const cls = screen.getByRole("tooltip").className;
    expect(cls).toContain("bg-inverse");
    expect(cls).toContain("text-inverse-content");
    expect(cls).not.toContain("bg-overlay");
  });

  it("surface variant opts back out", () => {
    open({ variant: "surface" });
    const cls = screen.getByRole("tooltip").className;
    expect(cls).toContain("bg-overlay");
    expect(cls).not.toContain("bg-inverse");
  });

  it("does not clip its arrow", () => {
    open();
    // overflow-hidden would cut the border triangle off entirely.
    expect(screen.getByRole("tooltip").className).not.toContain("overflow-hidden");
  });
});
