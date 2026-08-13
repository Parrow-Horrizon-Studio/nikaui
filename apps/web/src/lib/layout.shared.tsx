import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      enabled: false,
      // Fumadocs always renders this link in the sidebar's own header
      // (fumadocs-ui/dist/layouts/shared/client.js, InlineNavTitle) even
      // with `nav.enabled: false` above — that flag only turns off
      // Fumadocs' separate mobile header bar. Leaving `title` unset renders
      // an `<a href="/">` with no children at all: an unnamed link sitting
      // in the tab order of every documentation page. `sr-only`, same
      // pattern the skip link and Brand's own accessible name use
      // elsewhere in this app, names it without adding anything visible —
      // <Nav>'s own Brand already shows "Nika UI" as a visible home link on
      // every route, so this one stays exactly as invisible as it was.
      title: <span className="sr-only">Nika UI</span>,
    },
  };
}
