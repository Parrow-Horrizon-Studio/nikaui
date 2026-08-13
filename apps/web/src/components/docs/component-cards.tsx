/**
 * The component index, as Server Components.
 *
 * This file used to be a Client Component wrapped around a hard-coded
 * 22-entry array, which made the set of components a third written copy
 * alongside the CLI manifest and the registry directory — and the only copy
 * nothing tested. It drifted: five components shipped with pages nobody could
 * reach from here. The list is read from `source` now, which is server-side,
 * so the client boundary moved with it and the interactive previews are
 * reached through `<ComponentPreview>`. Consumers must therefore render
 * `<ComponentCards />` on the server; `mdx.tsx`, its only consumer, is used
 * only from `docs-page.tsx`, which is a Server Component.
 */
import Link from "next/link";
import type { Node } from "fumadocs-core/page-tree";
import { source } from "@/lib/source";
import { ComponentPreview } from "./component-previews";

export interface ComponentIndexEntry {
  name: string;
  slug: string;
  category: "foundation" | "interactive";
  isStub: boolean;
}

/**
 * Every documented component, in sidebar order.
 *
 * The *set* comes from the pages themselves, so it cannot be short. The
 * *order* comes from the page tree, i.e. from `meta.json`, so the index and
 * the sidebar agree without a second ordering to maintain; anything the tree
 * does not mention sorts to the end rather than disappearing.
 */
export function componentIndex(): ComponentIndexEntry[] {
  const order = pageTreeOrder();

  return source
    .getPages()
    .filter((page) => page.slugs.length === 2 && page.slugs[0] === "components")
    .map((page) => {
      const { title, category, status } = page.data;
      // A page with no `category` would otherwise vanish from both sections
      // in silence — the same shape of failure this derivation exists to end.
      if (!category) {
        throw new Error(
          `${page.url} has no \`category\` in its frontmatter. Component pages ` +
            `need \`category: foundation\` or \`category: interactive\` to appear ` +
            `in the index.`
        );
      }
      return {
        name: title,
        slug: page.slugs[1] as string,
        category,
        isStub: status === "stub",
      };
    })
    .sort((a, b) => rank(order, a.slug) - rank(order, b.slug));
}

function pageTreeOrder(): string[] {
  const urls: string[] = [];
  const walk = (nodes: Node[]) => {
    for (const node of nodes) {
      if (node.type === "page") urls.push(node.url);
      else if (node.type === "folder") walk(node.children);
    }
  };
  walk(source.getPageTree().children);
  return urls;
}

function rank(order: string[], slug: string): number {
  const index = order.indexOf(`/docs/components/${slug}`);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function ComponentCards() {
  const components = componentIndex();

  return (
    <div className="space-y-10">
      <Section
        title="Foundation"
        components={components.filter((c) => c.category === "foundation")}
      />
      <Section
        title="Interactive"
        components={components.filter((c) => c.category === "interactive")}
      />
    </div>
  );
}

function Section({
  title,
  components,
}: {
  title: string;
  components: ComponentIndexEntry[];
}) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {components.map((c) => (
          <ComponentCard key={c.slug} {...c} />
        ))}
      </div>
    </section>
  );
}

function ComponentCard({ name, slug, isStub }: ComponentIndexEntry) {
  return (
    <Link
      href={`/docs/components/${slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border transition-colors hover:border-fd-primary/50"
    >
      {/* Preview area */}
      <div className="flex min-h-[120px] items-center justify-center bg-fd-muted/30 p-6">
        <ComponentPreview slug={slug} />
      </div>

      {/* Name, and — from the same `status: stub` frontmatter that puts the
          notice on the page — whether its reference docs are written yet. */}
      <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
        <span className="text-sm font-medium group-hover:text-fd-primary">
          {name}
        </span>
        {isStub ? (
          <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-content-muted">
            Stub
          </span>
        ) : null}
      </div>
    </Link>
  );
}
