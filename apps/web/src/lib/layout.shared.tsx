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
      // in the tab order of every documentation page.
      //
      // A prior fix named it with an `sr-only` span, which helped screen
      // readers but left a sighted keyboard user tabbing onto a stop with
      // nothing to see — invisible either way, just invisible-and-named
      // instead of invisible-and-unnamed. There's no supported way to drop
      // the link from the tab order entirely: `BaseSlots.navTitle` is typed
      // as a plain `FC`, not `FC | false` the way its sibling slots
      // (themeSwitch, searchTrigger, languageSelect) are, so suppressing it
      // via `slots.navTitle` would mean fighting the library's own types
      // rather than using `title`, the option it's actually designed to
      // take. Plain text is the smaller, type-safe fix: it costs nothing
      // structural and the accessible name stays "Nika UI". Yes, <Nav>'s own
      // Brand already gives every route (docs included) a visible home
      // link, so this is a second one — a little redundant, but redundant
      // beats invisible, and this is the smallest change that removes the
      // defect without touching the sidebar's layout.
      title: "Nika UI",
    },
  };
}
