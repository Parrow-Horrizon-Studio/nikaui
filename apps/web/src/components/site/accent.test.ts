import { describe, expect, it } from "vitest";
import { ACCENTS, DEFAULT_ACCENT, isAccent } from "./accent";

describe("accent vocabulary", () => {
  it("lists exactly the five shipped accents in order", () => {
    expect(ACCENTS).toEqual(["sun", "violet", "emerald", "azure", "rose"]);
  });

  it("defaults to sun", () => {
    expect(DEFAULT_ACCENT).toBe("sun");
  });

  it("accepts every shipped accent", () => {
    for (const accent of ACCENTS) {
      expect(isAccent(accent)).toBe(true);
    }
  });

  it("rejects an accent that does not exist", () => {
    expect(isAccent("crimson")).toBe(false);
  });

  it("rejects non-strings from a corrupted localStorage value", () => {
    expect(isAccent(null)).toBe(false);
    expect(isAccent(undefined)).toBe(false);
    expect(isAccent(3)).toBe(false);
  });
});
