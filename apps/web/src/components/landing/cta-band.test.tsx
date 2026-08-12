import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GITHUB_URL } from "../site/nav-links";
import { CtaBand } from "./cta-band";

afterEach(cleanup);

describe("CtaBand", () => {
  it("renders the panel with the .cta-band hook the ported CSS targets", () => {
    const { container } = render(<CtaBand />);
    expect(container.querySelector(".cta-band")).not.toBeNull();
  });

  it("shows the exact heading and lead copy", () => {
    render(<CtaBand />);
    expect(
      screen.getByRole("heading", { name: "Build something with the freedom to move" })
    ).toBeDefined();
    expect(
      screen.getByText("Open the docs and add your first component in under a minute.")
    ).toBeDefined();
  });

  it('links "Read the docs" to /docs/guide', () => {
    render(<CtaBand />);
    const link = screen.getByRole("link", { name: "Read the docs" });
    expect(link.getAttribute("href")).toBe("/docs/guide");
  });

  it('links "Star on GitHub" to the real, resolving repository URL and opens it in a new tab', () => {
    render(<CtaBand />);
    const link = screen.getByRole("link", { name: "Star on GitHub" });
    expect(link.getAttribute("href")).toBe(GITHUB_URL);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("the sun mark is decorative, hidden from assistive tech", () => {
    const { container } = render(<CtaBand />);
    const mark = container.querySelector(".sun-mark");
    expect(mark).not.toBeNull();
    expect(mark!.getAttribute("aria-hidden")).toBe("true");
  });

  it("both calls to action are real links, reachable by keyboard with no tabindex override", () => {
    render(<CtaBand />);
    for (const name of ["Read the docs", "Star on GitHub"]) {
      const link = screen.getByRole("link", { name });
      expect(link.tagName).toBe("A");
      expect(link.getAttribute("tabindex")).toBeNull();
    }
  });
});
