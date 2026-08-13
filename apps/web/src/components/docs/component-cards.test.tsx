import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { source } from "@/lib/source";
import { componentIndex } from "./component-cards";

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
});
