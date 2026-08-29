import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

/**
 * One indicator that travels, rather than each trigger painting itself.
 *
 * Before this, every trigger carried `data-[selected]:bg-canvas`, so nothing
 * moved — the highlight simply appeared somewhere else. A single element that
 * measures the active trigger and translates to it is a different mechanism,
 * and it is what drives all four variants from one implementation.
 *
 * WHAT THIS FILE CANNOT TEST: jsdom reports 0 for offsetLeft, offsetWidth and
 * every other layout value, so the measurement — and therefore the slide
 * itself — cannot be exercised here. Asserting a transform in jsdom would be
 * asserting the mock. The slide is verified in the browser during the visual
 * pass; what is asserted below is the structure, the keyboard, and the guard
 * that keeps an unmeasured indicator off screen.
 */

const tabs = (props: Record<string, unknown> = {}) =>
  render(
    <Tabs>
      <TabsList {...props}>
        <TabsTrigger>Preview</TabsTrigger>
        <TabsTrigger>Code</TabsTrigger>
        <TabsTrigger>Usage</TabsTrigger>
      </TabsList>
      <TabsContent>one</TabsContent>
      <TabsContent>two</TabsContent>
      <TabsContent>three</TabsContent>
    </Tabs>
  );

describe("TabsList indicator", () => {
  it("renders exactly one, whatever the tab count", () => {
    const { container } = tabs();
    expect(container.querySelectorAll("[data-tabs-indicator]")).toHaveLength(1);
  });

  it("stays hidden until it has been measured", () => {
    // A visible indicator at a wrong position is worse than a frame of
    // absence: it produces a jump on hydration. jsdom never reports a real
    // width, so this is also what the element looks like before layout.
    const { container } = tabs();
    const ind = container.querySelector("[data-tabs-indicator]") as HTMLElement;
    expect(ind.style.opacity).toBe("0");
  });
});

describe("TabsTrigger", () => {
  it("no longer paints its own selected background", () => {
    tabs();
    const cls = screen.getByRole("tab", { name: "Preview" }).className;
    expect(cls).not.toContain("data-[selected]:bg-canvas");
    expect(cls).not.toContain("data-[selected]:shadow-sm");
  });

  it("still marks the selected tab for the indicator to find", () => {
    tabs();
    expect(
      screen.getByRole("tab", { name: "Preview" }).hasAttribute("data-selected")
    ).toBe(true);
  });
});

describe("Tabs keyboard", () => {
  it("moves selection with the arrow keys", () => {
    tabs();
    const first = screen.getByRole("tab", { name: "Preview" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(
      screen.getByRole("tab", { name: "Code" }).getAttribute("aria-selected")
    ).toBe("true");
  });
});

describe("TabsList variants", () => {
  it("defaults to segmented", () => {
    const { container } = tabs();
    expect(container.querySelector('[role="tablist"]')!.className).toContain("bg-muted");
  });

  it("underline drops the filled track for a rule", () => {
    const { container } = tabs({ variant: "underline" });
    const cls = container.querySelector('[role="tablist"]')!.className;
    expect(cls).toContain("border-b");
    expect(cls).not.toContain("bg-muted");
  });

  it("vertical stacks the triggers", () => {
    const { container } = tabs({ variant: "vertical" });
    expect(container.querySelector('[role="tablist"]')!.className).toContain("flex-col");
  });

  it("overflow scrolls rather than wrapping", () => {
    const { container } = tabs({ variant: "overflow" });
    const cls = container.querySelector('[role="tablist"]')!.className;
    expect(cls).toContain("overflow-x-auto");
  });
});
