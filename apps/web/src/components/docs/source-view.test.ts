import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { readComponentSource } from "./source-view";

/**
 * The Source view reads the real registry file.
 *
 * The property under test is that there is ONE copy of each component's
 * source. A page that pasted the code into MDX would satisfy every visual
 * check and drift the first time the component changed — and drift silently,
 * because nothing would compare the two.
 */
const UI_DIR = path.resolve(
  import.meta.dirname,
  "../../../../../packages/registry/src/ui"
);

describe("readComponentSource", () => {
  it("returns the file on disk byte for byte", () => {
    const onDisk = fs.readFileSync(path.join(UI_DIR, "button.tsx"), "utf-8");
    expect(readComponentSource("button")).toBe(onDisk);
  });

  it("tracks a change to the component rather than a snapshot of it", () => {
    // Same assertion from the other direction: whatever the file says now is
    // what the page shows. A copy would need updating; this cannot go stale.
    const source = readComponentSource("switch");
    expect(source).toContain("bg-indicator");
  });

  it("throws on an unknown component instead of rendering nothing", () => {
    // A blank Source view on a green build is the same failure mode as an
    // empty component index deriving from unparsed frontmatter.
    expect(() => readComponentSource("not-a-component")).toThrow(/no registry component/);
  });

  it("can read every component the registry ships", () => {
    const files = fs
      .readdirSync(UI_DIR)
      .filter((f) => f.endsWith(".tsx") && !f.includes(".test."))
      .map((f) => f.replace(/\.tsx$/, ""));
    expect(files.length).toBeGreaterThan(20);
    for (const name of files) {
      expect(() => readComponentSource(name)).not.toThrow();
    }
  });
});
