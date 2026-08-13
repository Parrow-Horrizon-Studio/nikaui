import Link from "next/link";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { baseOptions } from "./layout.shared";

/**
 * Fumadocs always renders `nav.title` as the sidebar's own home link
 * (fumadocs-ui/dist/layouts/shared/client.js, `InlineNavTitle`) regardless
 * of `nav.enabled` — that flag only turns off Fumadocs' separate mobile
 * header. Leaving `title` unset, as this used to, renders an `<a href="/">`
 * with no children at all: an unnamed link in the tab order of every
 * documentation page. An earlier fix named it with an `sr-only` span, which
 * gave it an accessible name but kept it visually invisible for a sighted
 * keyboard user; `title` is now plain visible text instead, so the same
 * string is both the rendered content and the accessible name. This renders
 * `nav.title` inside the same kind of link `InlineNavTitle` itself wraps it
 * in, and checks the accessible name the same way this codebase already
 * checks icon-only controls elsewhere (hero-window.test.tsx, nav.test.tsx:
 * `getByRole(..., { name })`) — still the right check even though this link
 * isn't icon-only anymore, since it confirms both that the link renders and
 * that it's reachable by name.
 */
describe("baseOptions", () => {
  it("gives the sidebar's home link visible, accessible text", () => {
    const { title } = baseOptions().nav ?? {};
    // `NavOptions["title"]` also allows a render-prop function; this app
    // never uses that form, so a function here means the shape of
    // `baseOptions()` changed in a way this test needs updating for, not a
    // real link to check.
    if (typeof title === "function") {
      throw new Error("baseOptions().nav.title is now a function — update this test.");
    }

    render(<Link href="/">{title}</Link>);

    const link = screen.getByRole("link", { name: "Nika UI" });
    expect(link).toBeDefined();
    // The regression this guards against: `sr-only` gives an accessible
    // name to a link with nothing sighted users can see. Asserting the name
    // alone can't catch that — an `sr-only`-wrapped label passes the same
    // `getByRole` query. Checking that no `sr-only` wrapper is involved is
    // what actually pins the link to being visible, not just named.
    expect(link.querySelector(".sr-only")).toBeNull();
  });
});
