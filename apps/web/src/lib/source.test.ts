import { describe, expect, it } from "vitest";
import { source } from "./source";

describe("the documentation source", () => {
  it("resolves every MDX page in content/docs", () => {
    // 27 MDX files: 22 existing component pages, components/index,
    // and the four guide pages (index, installation, theming, animation).
    expect(source.getPages().length).toBe(27);
  });

  it("resolves the guide and component sections", () => {
    const urls = source.getPages().map((p) => p.url);
    expect(urls).toContain("/docs/guide");
    expect(urls).toContain("/docs/components");
    expect(urls).toContain("/docs/guide/animation");
    expect(urls).toContain("/docs/components/button");
  });
});
