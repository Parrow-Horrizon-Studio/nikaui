import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HomePage from "./page";
import { MAIN_CONTENT_ID } from "../components/site/nav";

afterEach(cleanup);

/**
 * The skip link in <Nav> is only worth having if it lands somewhere. These
 * two facts live in different files, so nothing but a test holds them
 * together — and sub-project D adds more routes that each need the same
 * anchor on their own main element.
 */
describe("HomePage", () => {
  it("gives <main> the id the skip link targets", () => {
    const { container } = render(<HomePage />);
    const main = container.querySelector("main");
    expect(main).not.toBeNull();
    expect(main?.getAttribute("id")).toBe(MAIN_CONTENT_ID);
  });

  it("makes <main> focusable by script, so the skip link moves focus and not just scroll", () => {
    // Browsers scroll to a non-focusable fragment target but leave focus
    // where it was — which puts the next Tab straight back into the
    // navigation the visitor just skipped.
    const { container } = render(<HomePage />);
    expect(container.querySelector("main")?.getAttribute("tabindex")).toBe("-1");
  });
});
