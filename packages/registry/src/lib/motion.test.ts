import { describe, expect, it } from "vitest";
import { motionPresets } from "./motion";

describe("motion harness", () => {
  it("exposes the preset table", () => {
    expect(Object.keys(motionPresets).length).toBeGreaterThan(0);
  });
});
