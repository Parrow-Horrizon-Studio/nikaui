import type { ComponentProps, ReactElement, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { MAIN_CONTENT_ID } from "@/components/site/nav";
import { createDocsPage } from "./docs-page";

/**
 * Walks the React element tree `createDocsPage`'s `Page` returns to find the
 * `<DocsTitle>` element. This inspects the JSX `Page` builds rather than
 * rendering it to the DOM: `Page` composes `<MDX>` (the compiled `.mdx`
 * body) as a child, and that component resolves relative links through
 * fumadocs-ui's `createRelativeLink`, an async Client Component — a shape
 * Next's App Router handles but that a plain `render()` outside it cannot,
 * throwing "Only Server Components can be async" the moment React tries to
 * commit it. Reading the element tree directly finds the real props the real
 * production code passes, without ever needing to render the MDX body those
 * props have nothing to do with.
 */
function findElement<P>(
  node: ReactNode,
  predicate: (el: ReactElement<P>) => boolean,
): ReactElement<P> | null {
  if (node == null || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement<P>(child as ReactNode, predicate);
      if (found) return found;
    }
    return null;
  }
  if (!("type" in node) || !("props" in node)) return null;
  const el = node as ReactElement<P & { children?: ReactNode }>;
  if (predicate(el)) return el;
  return findElement<P>(el.props?.children, predicate);
}

/**
 * The skip link in <Nav> is rendered by the root layout on every route,
 * documentation pages included. `createDocsPage` is the shared factory
 * behind both /docs/guide/* and /docs/components/* page components, so
 * binding the id here — rather than per generated route file — covers every
 * documentation page in one place, the same way page.test.tsx binds the
 * landing page's <main>.
 */
describe("createDocsPage", () => {
  it("gives its title the id the skip link targets", async () => {
    const { Page } = createDocsPage("guide");
    const jsx = await Page({ params: Promise.resolve({ slug: [] }) });

    const title = findElement<ComponentProps<"h1">>(jsx, (el) => el.type === DocsTitle);

    expect(title).not.toBeNull();
    expect(title?.props.id).toBe(MAIN_CONTENT_ID);
  });

  it("makes that title focusable by script, so the skip link moves focus and not just scroll", async () => {
    // Browsers scroll to a non-focusable fragment target but leave focus
    // where it was — which puts the next Tab straight back into the
    // navigation the visitor just skipped. Same reasoning as page.test.tsx.
    const { Page } = createDocsPage("components");
    const jsx = await Page({ params: Promise.resolve({ slug: ["button"] }) });

    const title = findElement<ComponentProps<"h1">>(jsx, (el) => el.type === DocsTitle);

    expect(title?.props.tabIndex).toBe(-1);
  });
});
