import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert, AlertTitle } from "./alert";

/**
 * Status surfaces must be opaque.
 *
 * WHY THIS FILE EXISTS: Alert and Toast painted their status variants with
 * `bg-success/10`, `bg-warning/10`, `bg-danger/10` and `bg-info/10` — a
 * translucent tint over no opaque base. On a plain canvas that merely looks
 * washed out. Over a photograph, a gradient, or any page content behind a
 * fixed toast, the content shows straight through and the text becomes
 * unreadable.
 *
 * No structural check could see this. The class names were correct, the
 * tokens were correct, and every test passed. It is only visible by putting
 * the component over something.
 *
 * The fix keeps the status hue where it was always legible — a rail and an
 * icon chip — and puts an opaque surface underneath. This asserts the
 * opaque base is there and that no `/10`-style wash returns.
 */

const STATUSES = ["success", "warning", "danger", "info"] as const;

describe("Alert status surfaces are opaque", () => {
  for (const variant of STATUSES) {
    it(`${variant} has an opaque base, not a translucent wash`, () => {
      render(<Alert variant={variant}>msg</Alert>);
      const cls = screen.getByRole("alert").className;
      expect(cls).toContain("bg-surface");
      expect(cls).not.toMatch(/bg-(success|warning|danger|info)\/\d/);
    });

    it(`${variant} carries its status on a rail`, () => {
      render(<Alert variant={variant}>msg</Alert>);
      expect(screen.getByRole("alert").className).toContain(
        `before:bg-${variant}`
      );
    });
  }

  it("supports a top rail as well as the default left rail", () => {
    render(
      <Alert variant="danger" rail="top">
        msg
      </Alert>
    );
    const cls = screen.getByRole("alert").className;
    expect(cls).toContain("before:h-[3px]");
    expect(cls).toContain("before:inset-x-0");
  });

  it("keeps body text on text-content, not the status hue", () => {
    // text-success on bg-success/10 measured 1.94:1 against the light
    // canvas. That reasoning survives the surface change and is why the
    // hue lives on the rail and the chip instead.
    render(
      <Alert variant="success">
        <AlertTitle>t</AlertTitle>
      </Alert>
    );
    expect(screen.getByRole("alert").className).toContain("text-content");
  });
});
