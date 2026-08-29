import { describe, expect, it } from "vitest";
import { source } from "./source";

describe("the documentation source", () => {
  it("resolves every MDX page in content/docs", () => {
    // 33 MDX files: 28 component pages — one per component the registry
    // ships, now that H2 has added Field — plus components/index and the four
    // guide pages (index, installation, theming, animation).
    //
    // Deliberately a literal. This test exists to catch `content/docs`
    // resolving to nothing; counting the same directory the loader reads
    // would make it circular and it would pass on an empty tree.
    expect(source.getPages().length).toBe(33);
  });

  it("resolves the guide and component sections", () => {
    const urls = source.getPages().map((p) => p.url);
    expect(urls).toContain("/docs/guide");
    expect(urls).toContain("/docs/components");
    expect(urls).toContain("/docs/guide/animation");
    expect(urls).toContain("/docs/components/button");
  });
});
