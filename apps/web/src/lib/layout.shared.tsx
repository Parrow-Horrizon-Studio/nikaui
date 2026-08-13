import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { EmptyNavTitle } from "./empty-nav-title";

export function baseOptions(): BaseLayoutProps {
  return {
    // Turns off Fumadocs' separate mobile header bar only — unrelated to
    // the sidebar's own home link handled by `slots.navTitle` below.
    nav: {
      enabled: false,
    },
    // Fumadocs always renders a `nav.title` link in the sidebar's own header
    // (fumadocs-ui/dist/layouts/shared/client.js, InlineNavTitle; consumed
    // by fumadocs-ui/dist/layouts/docs/slots/sidebar.js) regardless of
    // `nav.enabled` above. Leaving `title` unset used to render an
    // `<a href="/">` with no children at all: a real, focusable, invisible
    // link in the tab order of every documentation page. Two earlier fixes
    // narrowed but didn't close the gap: an `sr-only` label named it for
    // screen readers while leaving it exactly as invisible for a sighted
    // keyboard user, and plain visible text after that made it visible but
    // redundant — <Nav>'s own Brand already renders a visible "Nika UI" home
    // link on every route, docs included, directly above this one.
    //
    // `slots.navTitle` removes the link outright rather than filling it in.
    // Both places that consume this slot guard with
    // `slots.navTitle && jsx(slots.navTitle, …)` — a component is truthy
    // regardless of what it renders, so passing one that always returns
    // `null` skips Fumadocs' own default (`InlineNavTitle`) and renders
    // nothing: no `<a>`, no tab stop, at all. This type-checks with no cast:
    // `BaseSlots.navTitle` is `FC<ComponentProps<'a'>>`, whose call
    // signature returns `ReactNode`, and `ReactNode` includes `null`
    // (@types/react's `index.d.ts`) — `Partial<BaseSlots>` only requires
    // *some* function matching that signature, not Fumadocs' own.
    //
    // It has to be imported from a dedicated `"use client"` module
    // (`./empty-nav-title`) rather than written inline here as `() => null`:
    // this function runs in a Server Component, and `DocsLayout` renders
    // this slot from inside its own Client Component tree, so the value
    // has to be a real client component reference to cross that boundary —
    // an inline closure isn't one, and fails at build time even though it
    // type-checks and even though a component test (no RSC boundary) can't
    // see the problem.
    slots: {
      navTitle: EmptyNavTitle,
    },
  };
}
