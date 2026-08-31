import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import manifest from "./registry.json" with { type: "json" };

/**
 * Every package a component imports must be declared in its manifest entry.
 *
 * WHY THIS FILE EXISTS: eight components imported `class-variance-authority`
 * without declaring it. Inside this monorepo that is invisible — the package
 * is hoisted and everything resolves. In a consumer's project, where `nika
 * add card` copies one file and installs exactly what the manifest names, the
 * component simply fails to compile.
 *
 * It is the worst shape of defect this repository can ship: green everywhere
 * it is developed, broken only where it is used. Both H1 and H2 introduced
 * instances, one `cva` import at a time, with every test passing.
 *
 * `react` is excluded because a React component in a React project can assume
 * React. Relative imports are covered by `registryDependencies` instead, which
 * is what makes `nika add field` also install label.
 */

const CLI_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_SRC = path.join(CLI_ROOT, "../../registry/src");

/** Import specifiers, with comments stripped so prose cannot look like code. */
function importedPackages(source: string): string[] {
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  return [...code.matchAll(/from\s+"([^"]+)"/g)]
    .map((match) => match[1]!)
    .filter((specifier) => !specifier.startsWith("."))
    .map((specifier) =>
      specifier.startsWith("@")
        ? specifier.split("/").slice(0, 2).join("/")
        : specifier.split("/")[0]!
    )
    .filter((pkg) => pkg !== "react");
}

const components = Object.entries(
  (manifest as { components: Record<string, {
    files?: { source: string }[];
    dependencies?: string[];
  }> }).components
);

describe("registry manifest", () => {
  it("lists a non-empty set of components", () => {
    // Guards against a parse that silently yields nothing, which would make
    // every assertion below vacuously pass.
    expect(components.length).toBeGreaterThan(20);
  });

  for (const [name, entry] of components) {
    it(`${name} declares everything it imports`, () => {
      const declared = new Set(entry.dependencies ?? []);
      const missing: string[] = [];

      for (const file of entry.files ?? []) {
        const filePath = path.join(REGISTRY_SRC, file.source);
        if (!fs.existsSync(filePath)) continue;
        for (const pkg of importedPackages(fs.readFileSync(filePath, "utf8"))) {
          if (!declared.has(pkg)) missing.push(pkg);
        }
      }

      expect(missing).toEqual([]);
    });
  }
});
