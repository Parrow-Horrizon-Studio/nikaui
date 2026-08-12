import { beforeEach, describe, expect, it } from "vitest";
import { MAX_KEYS, rateLimitSize, resetRateLimit, takeToken } from "./rate-limit";

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

  describe("when no limit key is available", () => {
    // A null key means the request carried nothing to key on — not that
    // every such caller shares one bucket. Sharing one bucket gave the
    // whole site five signups per minute between them on any deployment
    // that does not set x-forwarded-for.
    it("allows every request rather than pooling them into one shared bucket", () => {
      for (let i = 0; i < 20; i++) {
        expect(takeToken(null, 1_000)).toBe(true);
      }
    });

    it("keeps no state at all for a null key", () => {
      for (let i = 0; i < 20; i++) takeToken(null, 1_000);
      expect(rateLimitSize()).toBe(0);
    });

    it("does not disturb a real key's allowance", () => {
      for (let i = 0; i < 5; i++) takeToken(null, 1_000);
      for (let i = 0; i < 5; i++) expect(takeToken("1.2.3.4", 1_000)).toBe(true);
      expect(takeToken("1.2.3.4", 1_000)).toBe(false);
    });
  });

  describe("bounded state", () => {
    // The regression: entries were replaced only when a request arrived for
    // the *same* key after the window, so a client varying its
    // forwarded-for header per request grew the map without bound — a free
    // memory-exhaustion path that simultaneously bypassed the limit.
    it("drops entries whose window has closed instead of accumulating them", () => {
      for (let i = 0; i < MAX_KEYS; i++) takeToken(`old-${i}`, 1_000);
      expect(rateLimitSize()).toBe(MAX_KEYS);

      // One write past the ceiling, a full window later: every entry above
      // is now expired and must go.
      takeToken("fresh", 1_000 + 60_001);
      expect(rateLimitSize()).toBe(1);
    });

    it("stays bounded even when every entry is still inside its window", () => {
      for (let i = 0; i < MAX_KEYS * 2; i++) {
        expect(takeToken(`live-${i}`, 1_000)).toBe(true);
      }
      expect(rateLimitSize()).toBeLessThanOrEqual(MAX_KEYS);
    });
  });
});
