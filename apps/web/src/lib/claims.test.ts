import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// `import.meta.dirname`, not `__dirname`: this package is `"type": "module"`
// and `__dirname` is undefined under Vitest's ESM transform. Node 22 is the
// pinned runtime, so `import.meta.dirname` is available.
const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");

function registryComponentCount(): number {
  const manifest = JSON.parse(
    readFileSync(path.join(REPO_ROOT, "packages/cli/src/registry.json"), "utf8")
  ) as { components: Record<string, unknown> };
  return Object.keys(manifest.components).length;
}

function heroSource(): string {
  return readFileSync(
    path.join(REPO_ROOT, "apps/web/src/components/landing/hero.tsx"),
    "utf8"
  );
}

describe("the page's factual claims", () => {
  it("claims exactly as many components as the registry ships", () => {
    const count = registryComponentCount();
    expect(heroSource()).toContain(String(count));
  });

  it("agrees with the number of component files on disk", () => {
    const files = readdirSync(path.join(REPO_ROOT, "packages/registry/src/ui")).filter(
      (f) => f.endsWith(".tsx") && !f.includes(".test.")
    );
    expect(files.length).toBe(registryComponentCount());
  });
});
