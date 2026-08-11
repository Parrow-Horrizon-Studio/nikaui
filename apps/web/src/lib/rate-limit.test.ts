import { beforeEach, describe, expect, it } from "vitest";
import { resetRateLimit, takeToken } from "./rate-limit";

describe("takeToken", () => {
  beforeEach(() => resetRateLimit());

  it("allows the first requests from a key", () => {
    for (let i = 0; i < 5; i++) {
      expect(takeToken("1.2.3.4", 1_000)).toBe(true);
    }
  });

  it("refuses once the allowance is spent", () => {
    for (let i = 0; i < 5; i++) takeToken("1.2.3.4", 1_000);
    expect(takeToken("1.2.3.4", 1_000)).toBe(false);
  });

  it("keeps separate allowances per key", () => {
    for (let i = 0; i < 5; i++) takeToken("1.2.3.4", 1_000);
    expect(takeToken("5.6.7.8", 1_000)).toBe(true);
  });

  it("refills after the window has passed", () => {
    for (let i = 0; i < 5; i++) takeToken("1.2.3.4", 1_000);
    expect(takeToken("1.2.3.4", 1_000)).toBe(false);
    expect(takeToken("1.2.3.4", 1_000 + 60_001)).toBe(true);
  });
});
