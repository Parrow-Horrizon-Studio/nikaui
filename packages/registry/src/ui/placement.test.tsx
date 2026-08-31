import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";
import { Dialog, DialogContent } from "./dialog";

const SIDES = ["top", "right", "bottom", "left"] as const;

/**
 * Placement on all four sides, and dialog sizes.
 *
 * Popover previously took an `align` prop that could only vary the horizontal
 * alignment of a panel pinned to the bottom — so "put this above the trigger"
 * was not expressible at all, and a trigger near the foot of the page opened
 * a panel off-screen.
 */
describe("Popover placement", () => {
  for (const side of SIDES) {
    it(`anchors ${side}`, () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent placement={side}>Panel</PopoverContent>
        </Popover>
      );
      fireEvent.click(screen.getByRole("button", { name: "Open" }));
      const panel = screen.getByText("Panel").closest("[data-placement]");
      expect(panel?.getAttribute("data-placement")).toBe(side);
    });
  }

  it("still defaults to the bottom", () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Panel</PopoverContent>
      </Popover>
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(
      screen.getByText("Panel").closest("[data-placement]")?.getAttribute("data-placement")
    ).toBe("bottom");
  });
});

describe("Tooltip placement", () => {
  for (const side of SIDES) {
    it(`points its arrow ${side}`, () => {
      render(
        <Tooltip>
          <TooltipTrigger>t</TooltipTrigger>
          <TooltipContent placement={side}>hint</TooltipContent>
        </Tooltip>
      );
      fireEvent.mouseEnter(screen.getByText("t"));
      const tip = screen.getByRole("tooltip");
      expect(tip.getAttribute("data-placement")).toBe(side);
      // The arrow is a border triangle: which edge is coloured has to follow
      // the side, or the tooltip points the wrong way.
      const arrow = tip.querySelector("[data-tooltip-arrow]");
      expect(arrow?.className).toContain(
        { top: "border-t-", right: "border-r-", bottom: "border-b-", left: "border-l-" }[side]
      );
    });
  }
});

describe("Dialog size", () => {
  it.each([
    ["sm", "max-w-sm"],
    ["md", "max-w-lg"],
    ["lg", "max-w-2xl"],
    ["full", "max-w-[calc(100vw-2rem)]"],
  ])("size %s renders %s", (size, cls) => {
    render(
      <Dialog open onClose={() => {}}>
        <DialogContent size={size as "sm" | "md" | "lg" | "full"}>body</DialogContent>
      </Dialog>
    );
    expect(screen.getByText("body").closest("[data-dialog-panel]")?.className).toContain(cls);
  });

  it("defaults to md, which is what it always was", () => {
    render(
      <Dialog open onClose={() => {}}>
        <DialogContent>body</DialogContent>
      </Dialog>
    );
    expect(screen.getByText("body").closest("[data-dialog-panel]")?.className).toContain("max-w-lg");
  });
});
