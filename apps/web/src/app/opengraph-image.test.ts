import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The real ImageResponse (Satori + resvg, both WASM) is exercised for real
 * against a running server in the task's manual verification — see
 * task-10-report.md. This test targets one specific regression instead:
 * what `fonts` value the route hands ImageResponse when the Google Fonts
 * fetch fails. Mocking ImageResponse itself keeps the test fast and
 * hermetic, and lets it assert on the exact value passed rather than on
 * pixels.
 */
const imageResponseCalls: unknown[][] = [];
vi.mock("next/og", () => ({
  ImageResponse: class {
    constructor(...args: unknown[]) {
      imageResponseCalls.push(args);
    }
  },
}));

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  imageResponseCalls.length = 0;
  vi.restoreAllMocks();
});

describe("opengraph-image", () => {
  it("passes fonts: undefined, never [], when the font fetch fails", async () => {
    // The regression this guards: `fonts: []` is truthy, so it short-circuits
    // @vercel/og's internal `options.fonts || defaultFonts` fallback and
    // Satori throws "No fonts are loaded" instead of using its bundled
    // default — which, because this route is statically prerendered, means
    // a Google Fonts outage fails `pnpm build` rather than degrading.
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const { default: Image } = await import("./opengraph-image");
    await expect(Image()).resolves.toBeDefined();

    expect(imageResponseCalls).toHaveLength(1);
    const [, options] = imageResponseCalls[0] as [unknown, { fonts?: unknown[] }];
    expect(options.fonts).toBeUndefined();
  });

  it("passes a fonts array containing the fetched font when the fetch succeeds", async () => {
    const cssResponse = {
      ok: true,
      text: () =>
        Promise.resolve(
          "@font-face { font-family: 'JetBrains Mono'; src: url(https://fonts.gstatic.com/fake.ttf) format('truetype'); }",
        ),
    };
    const fontBytes = new ArrayBuffer(8);
    const fontResponse = { ok: true, arrayBuffer: () => Promise.resolve(fontBytes) };
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(cssResponse)
      .mockResolvedValueOnce(fontResponse) as unknown as typeof fetch;

    const { default: Image } = await import("./opengraph-image");
    await Image();

    expect(imageResponseCalls).toHaveLength(1);
    const [, options] = imageResponseCalls[0] as [
      unknown,
      { fonts?: { name: string; data: ArrayBuffer }[] },
    ];
    expect(options.fonts).toHaveLength(1);
    expect(options.fonts?.[0]?.name).toBe("JetBrains Mono");
    expect(options.fonts?.[0]?.data).toBe(fontBytes);
  });
});
