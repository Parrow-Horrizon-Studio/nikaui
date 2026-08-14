import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("the documentation search endpoint", () => {
  it("returns results for a term that appears in the guides", async () => {
    const response = await GET(
      new Request("http://localhost/api/search?query=theming")
    );
    expect(response.status).toBe(200);
    const results = (await response.json()) as unknown[];
    // A search that resolves no documents is indistinguishable from a
    // search index that was never built — assert it found something.
    expect(results.length).toBeGreaterThan(0);
  });
});
