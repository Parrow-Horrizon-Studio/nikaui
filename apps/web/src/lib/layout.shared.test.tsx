import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { baseOptions } from "./layout.shared";

/**
 * Fumadocs always renders `nav.title` as the sidebar's own home link
 * (fumadocs-ui/dist/layouts/shared/client.js, `InlineNavTitle`) regardless
 * of `nav.enabled` — that flag only turns off Fumadocs' separate mobile
 * header. Left unset, this used to render an unnamed `<a href="/">`; a later
 * fix named it with `sr-only` (accessible but still invisible to a sighted
 * keyboard user); a fix after that made it visible but redundant with
 * <Nav>'s own Brand link. The current fix removes the link outright via
 * `slots.navTitle: EmptyNavTitle` — see `layout.shared.tsx` and
 * `empty-nav-title.tsx` for why that's a real, type-checked removal rather
 * than a workaround, and why the no-op has to live in its own `"use client"`
 * module. This renders that slot component the same way Fumadocs itself
 * does (as a component taking `ComponentProps<'a'>`) and checks that no link
 * comes out of it, which is the property that actually matters: no `<a>`
 * means no tab stop, so there's nothing left for a keyboard user to land on
 * with nothing to see. Note this test can't see the Server/Client Component
 * boundary at all — `render()` here has no RSC tree — so it couldn't have
 * caught the build failure an inline (non-`"use client"`) no-op produced;
 * that only surfaces via `next build`.
 */
describe("baseOptions", () => {
  it("renders no sidebar home-link tab stop", () => {
    const { slots } = baseOptions();
    const NavTitle = slots?.navTitle;
    // A render-prop-shaped value or a missing slot both mean the shape of
    // `baseOptions()` changed in a way this test needs updating for, not
    // that there's a real link to check.
    if (typeof NavTitle !== "function") {
      throw new Error("baseOptions().slots.navTitle is no longer a function — update this test.");
    }

    render(<NavTitle href="/" />);

    // The regression this guards against: a real, focusable `<a>` with
    // nothing for a sighted keyboard user to see, whether unnamed (the
    // original defect) or named via `sr-only` (an earlier fix's residue).
    // If this slot ever starts rendering a link again — invisible or not —
    // this assertion catches it.
    expect(screen.queryByRole("link")).toBeNull();
  });
});
