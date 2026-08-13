import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Node } from "fumadocs-core/page-tree";
import { source } from "@/lib/source";
import { componentIndex } from "./component-cards";
import { previews } from "./component-previews";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../../..");

function registryComponentSlugs(): string[] {
  const manifest = JSON.parse(
    readFileSync(path.join(REPO_ROOT, "packages/cli/src/registry.json"), "utf8")
  ) as { components: Record<string, { type: string }> };
  return Object.entries(manifest.components)
    .filter(([, c]) => c.type === "ui")
    .map(([slug]) => slug)
    .sort();
}

function documentedSlugs(): string[] {
  return source
    .getPages()
    .map((p) => p.url)
    .filter((u) => u.startsWith("/docs/components/"))
    .map((u) => u.replace("/docs/components/", ""))
    .filter((s) => s.length > 0)
    .sort();
}

/**
 * Which sidebar section each component page falls under, according to the
 * `---Foundation---` / `---Interactive---` separators in
 * `content/docs/components/meta.json`.
 *
 * A separator applies to the siblings that follow it, so `section` is scoped
 * to one list of children and resets on entering a nested folder.
 */
function sidebarSectionBySlug(): Map<string, string> {
  const sections = new Map<string, string>();

  const walk = (nodes: Node[]) => {
    let section: string | undefined;
    for (const node of nodes) {
      if (node.type === "separator") {
        section =
          typeof node.name === "string" ? node.name.toLowerCase() : undefined;
      } else if (node.type === "folder") {
        walk(node.children);
      } else if (node.type === "page" && section) {
        const prefix = "/docs/components/";
        if (node.url.startsWith(prefix)) {
          sections.set(node.url.slice(prefix.length), section);
        }
      }
    }
  };

  walk(source.getPageTree().children);
  return sections;
}

describe("the component index", () => {
  it("documents every component the registry ships", () => {
    // The index used to be a hand-maintained array. It drifted: five
    // components shipped undocumented and unlisted, and nothing noticed.
    expect(documentedSlugs()).toEqual(registryComponentSlugs());
  });

  it("derives its cards from the page tree", () => {
    // The array is gone; this is what keeps it gone. It also catches the
    // derivation silently coming back short — the failure mode that hid the
    // five new components in the first place.
    expect(componentIndex().map((c) => c.slug).sort()).toEqual(
      registryComponentSlugs()
    );
  });

  it("reads category and status from frontmatter, not from a second list", () => {
    const bySlug = new Map(componentIndex().map((c) => [c.slug, c]));

    // `category` was inert until the frontmatter schema was extended:
    // unschema'd keys are stripped before they reach page data, so this read
    // `undefined` for every page while the build stayed green.
    expect(bySlug.get("button")?.category).toBe("foundation");
    expect(bySlug.get("dialog")?.category).toBe("interactive");
    expect(bySlug.get("slider")?.category).toBe("interactive");

    // The four complete pages carry no `status`; the eighteen stubs do.
    expect(bySlug.get("button")?.isStub).toBe(false);
    expect(bySlug.get("card")?.isStub).toBe(false);
    expect(bySlug.get("badge")?.isStub).toBe(false);
    expect(bySlug.get("dialog")?.isStub).toBe(false);
    expect(bySlug.get("tooltip")?.isStub).toBe(true);
    expect(componentIndex().filter((c) => c.isStub)).toHaveLength(18);
  });

  it("groups every component the way the sidebar separators do", () => {
    // The grouping is written down twice: `meta.json`'s `---Foundation---` and
    // `---Interactive---` separators drive the sidebar, `category` drives this
    // index. Deleting the hand-maintained component *list* left a second copy
    // of the component *grouping*, and two unbound representations of one fact
    // drift — a page could sit under one heading here and the other there,
    // silently, on a green build. This is what binds them.
    const sidebar = sidebarSectionBySlug();

    // Compared as `slug: value` strings so a mismatch names the offending
    // page rather than reporting an anonymous "foundation" ≠ "interactive".
    expect(componentIndex().map((c) => `${c.slug}: ${c.category}`)).toEqual(
      componentIndex().map((c) => `${c.slug}: ${sidebar.get(c.slug)}`)
    );
  });

  it("has a preview for every component in the index, and no preview for a component that isn't", () => {
    // `previews` in component-previews.tsx is the one hand-maintained list D
    // left behind: a Record keyed by slug, bound to nothing. `ComponentPreview`
    // returns `null` on a miss, so a documented component with no preview
    // entry ships an empty card silently — precisely the drift the derived
    // index exists to end, one layer further down. This binds the two lists
    // together in both directions: a page without a preview fails here, and
    // so does a preview without a page.
    const indexSlugs = componentIndex()
      .map((c) => c.slug)
      .sort();
    const previewSlugs = Object.keys(previews).sort();
    expect(previewSlugs).toEqual(indexSlugs);
  });
});
