import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Label } from "./label";

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
