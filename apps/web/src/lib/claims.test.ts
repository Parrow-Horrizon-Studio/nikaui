import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import * as React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { motionPresets } from "@nikaui/registry/lib/motion";
import { ACCENTS } from "../components/site/accent";
import { Hero } from "../components/landing/hero";

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

/**
 * Renders the real Hero and reads its actual output, rather than grepping
 * hero.tsx's source for a bare digit. A source-text search for e.g. "27"
 * matches every unrelated "27" in the file too — hero.tsx's own Tailwind
 * classes include `sm:pt-28`, `pb-24`, `pt-20` and `mt-16`, and a bare
 * `toContain(String(count))` against the whole file would be satisfied by
 * any of those if the true claim ever went stale (e.g. the registry grows to
 * 28 components and nobody touches the hero copy — `sm:pt-28` alone would
 * pass the test while the visible page quietly lied). Rendering the
 * component and reading the stat's own text removes that ambiguity: the
 * only place `"${count} / Components"` can appear is the stat itself.
 */
function renderedStats(): string {
  const { container } = render(React.createElement(Hero));
  return container.textContent ?? "";
}

describe("the page's factual claims", () => {
  it("claims exactly as many components as the registry ships", () => {
    const count = registryComponentCount();
    expect(renderedStats()).toContain(`${count} / Components`);
  });

  it("agrees with the number of component files on disk", () => {
    const files = readdirSync(path.join(REPO_ROOT, "packages/registry/src/ui")).filter(
      (f) => f.endsWith(".tsx") && !f.includes(".test.")
    );
    expect(files.length).toBe(registryComponentCount());
  });

  it("claims exactly as many motion presets as the registry defines", () => {
    const count = Object.keys(motionPresets).length;
    expect(renderedStats()).toContain(`${count} / Motion presets`);
  });

  it("claims exactly as many accents as the accent switcher offers", () => {
    expect(renderedStats()).toContain(`${ACCENTS.length} / Accents`);
  });
});
