import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Label } from "./label";
import { Checkbox } from "./checkbox";
import { Switch } from "./switch";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const uiDir = path.dirname(fileURLToPath(import.meta.url));

/** Reads a component's source, for the few assertions about motion config. */
function readSource(name: string): string {
  return fs.readFileSync(path.join(uiDir, `${name}.tsx`), "utf-8");
}

/**
 * The default styling decisions taken in H1.
 *
 * These assert class strings, which is normally a weak thing to test. It is
 * the right thing here because the deliverable *is* the class string: H1
 * changes how components look and nothing about what they do. Where H1
 * changes behaviour instead — the switch's travel distance, the checkbox's
 * draw order — the assertion is on the rendered attribute or the motion
 * config, not the class.
 *
 * Three of these are corrections rather than taste, and each is worth
 * keeping pinned:
 *
 *   - Button secondary sat on `bg-surface-2` while every filled control
 *     moved to `--nika-field`. Two tokens for one job.
 *   - Badge's default variant was a solid accent fill, which makes an
 *     annotation compete with the primary button on the same screen.
 *   - Label at 14px/500 is the same size and weight as body text, so a
 *     standalone label did not read as a label.
 */

describe("Button", () => {
  it("secondary sits on the field token, not surface-2", () => {
    render(<Button variant="secondary">go</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("bg-field");
    expect(cls).not.toContain("bg-surface-2");
  });

  it("is rounded-lg and semibold", () => {
    render(<Button>go</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("rounded-lg");
    expect(cls).toContain("font-semibold");
    expect(cls).not.toContain("font-medium");
  });

  it("carries a resting shadow that deepens on hover", () => {
    render(<Button>go</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("shadow-sm");
    expect(cls).toContain("hover:shadow-md");
  });
});

describe("Badge", () => {
  it("default is tinted, not a solid accent fill", () => {
    render(<Badge>new</Badge>);
    const cls = screen.getByText("new").className;
    expect(cls).toContain("bg-primary/15");
    // A bare `bg-primary` (no opacity suffix) would be the old solid fill.
    expect(cls).not.toMatch(/bg-primary(?![/\w-])/);
  });

  it("keeps the previous solid fill available as an explicit variant", () => {
    render(<Badge variant="solid">new</Badge>);
    const cls = screen.getByText("new").className;
    expect(cls).toContain("bg-primary");
    expect(cls).toContain("text-primary-fg");
  });

  it("is medium weight, not semibold", () => {
    render(<Badge>new</Badge>);
    expect(screen.getByText("new").className).toContain("font-medium");
  });
});

describe("Label", () => {
  it("is smaller and heavier than body text", () => {
    render(<Label>Full name</Label>);
    const cls = screen.getByText("Full name").className;
    expect(cls).toContain("text-[13px]");
    expect(cls).toContain("font-semibold");
  });
});

describe("Checkbox", () => {
  it("is 20px, not 16px", () => {
    render(<Checkbox aria-label="c" />);
    const cls = screen.getByRole("checkbox").className;
    expect(cls).toContain("size-5");
    expect(cls).not.toContain("h-4 w-4");
  });

  it("unchecked border is neutral, not the accent", () => {
    render(<Checkbox aria-label="c" />);
    const cls = screen.getByRole("checkbox").className;
    expect(cls).toContain("border-indicator");
    // The accent may only appear behind data-[checked]. An unchecked box
    // painted in the accent colour reads as already-on.
    expect(cls.split("data-[checked]:border-primary").join("")).not.toContain(
      "border-primary"
    );
  });

  it("draws the tick instead of fading it", () => {
    const src = readSource("checkbox");
    // Animating pathLength and opacity together over the same 200ms is what
    // made the tick read as a fade rather than a stroke being drawn.
    expect(src).toContain("pathLength");
    expect(src).not.toMatch(/opacity:\s*checked/);
  });
});

describe("Switch", () => {
  it("is 50x28 with the off-track on the indicator token", () => {
    render(<Switch aria-label="s" />);
    const cls = screen.getByRole("switch").className;
    expect(cls).toContain("h-7");
    expect(cls).toContain("w-[50px]");
    expect(cls).toContain("data-[unchecked]:bg-indicator");
    expect(cls).not.toContain("data-[unchecked]:bg-line");
  });

  it("thumb is 22px on the surface token with a moderate shadow", () => {
    const src = readSource("switch");
    expect(src).toContain("size-[22px]");
    expect(src).toContain("bg-surface");
    // shadow-lg is the library's largest; a 20px thumb wearing it was
    // over-elevated against everything else on the page.
    expect(src).not.toContain("shadow-lg");
  });

  it("thumb travels the full 22px", () => {
    expect(readSource("switch")).toMatch(/x:\s*checked\s*\?\s*22\s*:\s*0/);
  });
});
