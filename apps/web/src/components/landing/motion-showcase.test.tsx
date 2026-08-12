import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MotionShowcase } from "./motion-showcase";

afterEach(cleanup);

/**
 * Per-preset styling (the actual travel distance, the spring transition) is
 * `Card`'s own responsibility and is already covered by
 * packages/registry/src/ui/hydration.test.tsx and reduced-motion.test.tsx.
 * What belongs to this file is what MotionShowcase itself owns: the preset
 * set and its order, the copy, the replay mechanism, and that the replay
 * control is reachable.
 */
describe("MotionShowcase", () => {
  it("carries the id the footer's Motion link (#motion) points to", () => {
    const { container } = render(<MotionShowcase />);
    expect(container.querySelector("section#motion")).not.toBeNull();
  });

  it("renders one tile per preset, in the shipped order: none, snap, glide, spring, bounce", () => {
    const { container } = render(<MotionShowcase />);
    const tiles = Array.from(container.querySelectorAll("[data-preset]")).map((el) =>
      el.getAttribute("data-preset")
    );
    expect(tiles).toEqual(["none", "snap", "glide", "spring", "bounce"]);
  });

  it("lists the same five presets as badges, in the same order — spring included (the prototype omitted it), pop absent (it does not exist)", () => {
    render(<MotionShowcase />);
    const list = screen.getByRole("list", { name: "Motion presets" });
    const items = within(list)
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(items).toEqual(["none", "snap", "glide", "spring", "bounce"]);
    expect(screen.queryByText(/pop/i)).toBeNull();
  });

  it("shows the exact eyebrow, heading and body copy", () => {
    render(<MotionShowcase />);
    expect(screen.getByText("The signature")).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Motion presets, not motion homework" })
    ).toBeDefined();
    expect(
      screen.getByText(
        "Components should stretch and spring. Five named curves are baked into the system, so you get tasteful physics without touching a keyframe."
      )
    ).toBeDefined();
  });

  it("links to the animation guide", () => {
    render(<MotionShowcase />);
    const link = screen.getByRole("link", { name: "Explore presets" });
    expect(link.getAttribute("href")).toBe("/docs/guide/animation");
  });

  it("the replay control has an accessible name and is keyboard-operable", () => {
    render(<MotionShowcase />);
    const button = screen.getByRole("button", { name: "Replay" });
    expect(button.hasAttribute("disabled")).toBe(false);
    const tabIndex = button.getAttribute("tabindex");
    expect(tabIndex === null || tabIndex === "0").toBe(true);
  });

  it("clicking Replay remounts every tile — the mechanism that replays the entrance", () => {
    const { container } = render(<MotionShowcase />);
    const before = Array.from(container.querySelectorAll("[data-preset]"));
    expect(before).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: "Replay" }));

    const after = Array.from(container.querySelectorAll("[data-preset]"));
    expect(after).toHaveLength(5);
    // Same presets, same order, but genuinely new DOM nodes — a `key`
    // change unmounts the old subtree and mounts a fresh one, which is what
    // gives Card's entrance animation somewhere to replay from.
    after.forEach((node, i) => {
      expect(node.getAttribute("data-preset")).toBe(before[i]!.getAttribute("data-preset"));
      expect(node).not.toBe(before[i]);
    });
  });

  it("Replay is still there and still operable after being clicked more than once", () => {
    render(<MotionShowcase />);
    const button = screen.getByRole("button", { name: "Replay" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(screen.getByRole("button", { name: "Replay" })).toBeDefined();
  });
});
