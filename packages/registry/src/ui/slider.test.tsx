import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Slider } from "./slider";

/**
 * Slider owns its keyboard and ARIA behaviour.
 *
 * WHY THIS FILE EXISTS: the previous Slider was a native
 * `input[type=range]`, which meant it inherited all of this for free — and
 * also meant it could not paint a filled track, because no cross-browser way
 * exists to style the portion of a range input left of the thumb. So the
 * whole rail was `bg-muted` with a primary thumb sitting on it, and nothing
 * indicated where the value was. That is missing information, not a styling
 * preference.
 *
 * Leaving the native element was the only way to fix it, and the cost is
 * exactly this file: every key and every ARIA attribute now has to be
 * implemented, so every key and every ARIA attribute now has to be tested.
 * Inheriting behaviour is free; owning it is not.
 *
 * Pointer dragging is implemented but not asserted here — jsdom reports a
 * zero-size bounding box, so a drag test would measure the mock rather than
 * the component. It is covered by the visual pass instead, and that gap is
 * stated rather than hidden.
 */

const value = () => Number(screen.getByRole("slider").getAttribute("aria-valuenow"));

describe("Slider keyboard", () => {
  const cases: [string, number][] = [
    ["{ArrowRight}", 51],
    ["{ArrowUp}", 51],
    ["{ArrowLeft}", 49],
    ["{ArrowDown}", 49],
    ["{Home}", 0],
    ["{End}", 100],
    ["{PageUp}", 60],
    ["{PageDown}", 40],
  ];

  for (const [key, expected] of cases) {
    it(`${key} moves 50 -> ${expected}`, () => {
      const onValueChange = vi.fn();
      render(<Slider defaultValue={50} onValueChange={onValueChange} aria-label="v" />);
      fireEvent.keyDown(screen.getByRole("slider"), { key: key.slice(1, -1) });
      expect(onValueChange).toHaveBeenCalledWith(expected);
      expect(value()).toBe(expected);
    });
  }

  it("clamps at the bounds rather than running past them", () => {
    render(<Slider defaultValue={100} aria-label="v" />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });
    expect(value()).toBe(100);
  });

  it("respects step", () => {
    render(<Slider defaultValue={50} step={10} aria-label="v" />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });
    expect(value()).toBe(60);
  });

  it("ignores keys when disabled", () => {
    const onValueChange = vi.fn();
    render(<Slider defaultValue={50} disabled onValueChange={onValueChange} aria-label="v" />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(value()).toBe(50);
  });
});

describe("Slider ARIA", () => {
  it("exposes the full contract", () => {
    render(<Slider defaultValue={30} min={0} max={100} aria-label="Volume" />);
    const s = screen.getByRole("slider");
    expect(s.getAttribute("aria-valuenow")).toBe("30");
    expect(s.getAttribute("aria-valuemin")).toBe("0");
    expect(s.getAttribute("aria-valuemax")).toBe("100");
    expect(s.getAttribute("aria-orientation")).toBe("horizontal");
    expect(s.getAttribute("aria-label")).toBe("Volume");
    expect(s.getAttribute("tabindex")).toBe("0");
  });

  it("is not focusable when disabled", () => {
    render(<Slider defaultValue={30} disabled aria-label="v" />);
    const s = screen.getByRole("slider");
    expect(s.getAttribute("tabindex")).toBe("-1");
    expect(s.getAttribute("aria-disabled")).toBe("true");
  });

  it("honours a non-zero min", () => {
    render(<Slider defaultValue={5} min={5} max={10} aria-label="v" />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "Home" });
    expect(value()).toBe(5);
  });
});

describe("Slider value display", () => {
  it("paints a filled track proportional to the value", () => {
    const { container } = render(<Slider defaultValue={25} aria-label="v" />);
    const fill = container.querySelector("[data-slider-fill]") as HTMLElement;
    expect(fill).toBeTruthy();
    expect(fill.style.width).toBe("25%");
  });

  it("works as a controlled component", () => {
    const { rerender } = render(<Slider value={10} aria-label="v" />);
    expect(value()).toBe(10);
    rerender(<Slider value={80} aria-label="v" />);
    expect(value()).toBe(80);
  });

  it("does not move itself when controlled", () => {
    // A controlled slider must report intent and wait for the parent.
    const onValueChange = vi.fn();
    render(<Slider value={50} onValueChange={onValueChange} aria-label="v" />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });
    expect(onValueChange).toHaveBeenCalledWith(51);
    expect(value()).toBe(50);
  });
});
