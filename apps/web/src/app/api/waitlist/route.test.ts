import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
// Relative, not the "@/" alias — the convention route.ts explains. This
// file only needs resetRateLimit, to keep each test's rate-limit bucket
// independent; the same reason rate-limit.test.ts imports it this way
// rather than through route.ts.
import { resetRateLimit } from "../../../lib/rate-limit";

const ENDPOINT = "http://localhost/api/waitlist";

function postRequest(body: unknown, extraHeaders: Record<string, string> = {}) {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  });
}

/** A minimal stand-in for the Response fetch() resolves with — this test
 *  only needs `.ok`, `.status` and `.json()`, which is everything route.ts
 *  reads off the Loops response. */
function loopsResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

const originalApiKey = process.env.LOOPS_API_KEY;
const originalFetch = global.fetch;

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    resetRateLimit();
    // route.ts deliberately logs the Loops status/body (and network
    // failures) on the failure branch — see the comments at its two
    // console.error call sites. That logging is exercised for real by the
    // tests below; it's silenced here only so a passing run's output stays
    // readable, not to avoid calling it.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalApiKey === undefined) delete process.env.LOOPS_API_KEY;
    else process.env.LOOPS_API_KEY = originalApiKey;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns 503 and never calls Loops when LOOPS_API_KEY is unset", async () => {
    delete process.env.LOOPS_API_KEY;
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const response = await POST(postRequest({ email: "luffy@nika.dev", tier: "personal" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ error: "The waitlist is not accepting signups yet." });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns 502 when Loops responds with a non-2xx status", async () => {
    process.env.LOOPS_API_KEY = "test-key";
    global.fetch = vi
      .fn()
      .mockResolvedValue(loopsResponse(401, { message: "Unauthorized" })) as unknown as typeof fetch;

    const response = await POST(
      postRequest({ email: "luffy@nika.dev", tier: "personal" }, { "x-forwarded-for": "1.1.1.1" })
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({ error: "We could not add you just now. Please try again." });
  });

  it("returns 502 when Loops responds 2xx but the body does not say success:true", async () => {
    // The exact regression this task's review caught: route.ts used to
    // check `!response.ok` alone. A 2xx with a body that doesn't confirm
    // success must still be reported as a failure.
    process.env.LOOPS_API_KEY = "test-key";
    global.fetch = vi
      .fn()
      .mockResolvedValue(loopsResponse(200, { success: false })) as unknown as typeof fetch;

    const response = await POST(
      postRequest({ email: "luffy@nika.dev", tier: "personal" }, { "x-forwarded-for": "2.2.2.2" })
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({ error: "We could not add you just now. Please try again." });
  });

  it("returns { ok: true } only when Loops responds 2xx with success:true", async () => {
    process.env.LOOPS_API_KEY = "test-key";
    global.fetch = vi
      .fn()
      .mockResolvedValue(loopsResponse(200, { success: true, id: "abc123" })) as unknown as typeof fetch;

    const response = await POST(
      postRequest({ email: "luffy@nika.dev", tier: "personal" }, { "x-forwarded-for": "3.3.3.3" })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

  it("treats a 409 (contact already exists) as ok:true — they really are on the list", async () => {
    process.env.LOOPS_API_KEY = "test-key";
    global.fetch = vi
      .fn()
      .mockResolvedValue(loopsResponse(409, { message: "Contact already exists" })) as unknown as typeof fetch;

    const response = await POST(
      postRequest({ email: "luffy@nika.dev", tier: "personal" }, { "x-forwarded-for": "4.4.4.4" })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

  it("returns 502, not a hang or an unhandled throw, when the Loops request itself fails", async () => {
    process.env.LOOPS_API_KEY = "test-key";
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const response = await POST(
      postRequest({ email: "luffy@nika.dev", tier: "personal" }, { "x-forwarded-for": "5.5.5.5" })
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({ error: "We could not add you just now. Please try again." });
  });

  it("answers the honeypot with 200 and never calls Loops", async () => {
    process.env.LOOPS_API_KEY = "test-key";
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const response = await POST(
      postRequest(
        { email: "luffy@nika.dev", tier: "personal", company: "a bot filled this" },
        { "x-forwarded-for": "6.6.6.6" }
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid email and never calls Loops", async () => {
    process.env.LOOPS_API_KEY = "test-key";
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const response = await POST(
      postRequest({ email: "not-an-email" }, { "x-forwarded-for": "7.7.7.7" })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "That email address looks wrong." });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed JSON body", async () => {
    process.env.LOOPS_API_KEY = "test-key";
    const request = new Request(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "8.8.8.8" },
      body: "not json",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Malformed request." });
  });

  describe("the tier it forwards to Loops", () => {
    /** Runs one request and returns the body route.ts sent onward to Loops. */
    async function outboundBody(requestBody: unknown, ip: string) {
      process.env.LOOPS_API_KEY = "test-key";
      const fetchSpy = vi
        .fn()
        .mockResolvedValue(loopsResponse(200, { success: true }));
      global.fetch = fetchSpy as unknown as typeof fetch;

      await POST(postRequest(requestBody, { "x-forwarded-for": ip }));

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      return JSON.parse(init.body as string) as Record<string, unknown>;
    }

    it("passes a real tier straight through", async () => {
      const sent = await outboundBody({ email: "luffy@nika.dev", tier: "team" }, "10.0.0.1");
      expect(sent.userGroup).toBe("team");
    });

    // The regression: `typeof tier === "string" ? tier : "unspecified"` took
    // any string of any length out of an untrusted body and handed it to a
    // third party. The domain is closed — "personal" | "team" — so anything
    // else is not a tier and must not be forwarded as one.
    it("refuses an unknown tier rather than forwarding it", async () => {
      const sent = await outboundBody(
        { email: "luffy@nika.dev", tier: "enterprise" },
        "10.0.0.2"
      );
      expect(sent.userGroup).toBe("unspecified");
    });

    it("refuses an oversized string rather than forwarding it", async () => {
      const sent = await outboundBody(
        { email: "luffy@nika.dev", tier: "x".repeat(5_000) },
        "10.0.0.3"
      );
      expect(sent.userGroup).toBe("unspecified");
    });

    it("refuses a non-string tier rather than forwarding it", async () => {
      const sent = await outboundBody(
        { email: "luffy@nika.dev", tier: { toString: "personal" } },
        "10.0.0.4"
      );
      expect(sent.userGroup).toBe("unspecified");
    });

    it("says unspecified when no tier was recorded at all", async () => {
      const sent = await outboundBody({ email: "luffy@nika.dev" }, "10.0.0.5");
      expect(sent.userGroup).toBe("unspecified");
    });
  });

  it("rate limits the 6th request from the same key, before any Loops call", async () => {
    process.env.LOOPS_API_KEY = "test-key";
    global.fetch = vi
      .fn()
      .mockResolvedValue(loopsResponse(200, { success: true })) as unknown as typeof fetch;

    for (let i = 0; i < 5; i++) {
      const allowed = await POST(
        postRequest({ email: "luffy@nika.dev", tier: "personal" }, { "x-forwarded-for": "9.9.9.9" })
      );
      expect(allowed.status).toBe(200);
    }

    const limited = await POST(
      postRequest({ email: "luffy@nika.dev", tier: "personal" }, { "x-forwarded-for": "9.9.9.9" })
    );
    const body = await limited.json();

    expect(limited.status).toBe(429);
    expect(body).toEqual({ error: "Too many attempts. Try again in a minute." });
  });

  // On a deployment that sets no x-forwarded-for, the old "unknown" fallback
  // put every visitor in one bucket: the site as a whole got five signups a
  // minute, and the sixth real person to try was turned away. Absent header
  // now means "no limit key available", which is allowed through.
  it("does not pool visitors into one bucket when x-forwarded-for is absent", async () => {
    process.env.LOOPS_API_KEY = "test-key";
    global.fetch = vi
      .fn()
      .mockResolvedValue(loopsResponse(200, { success: true })) as unknown as typeof fetch;

    for (let i = 0; i < 8; i++) {
      const response = await POST(postRequest({ email: `visitor${i}@nika.dev` }));
      expect(response.status).toBe(200);
    }
  });
});
