import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCENTS,
  AccentProvider,
  DEFAULT_ACCENT,
  STORAGE_KEY,
  applyStoredAccent,
  isAccent,
  useAccent,
} from "./accent";

function resetDom() {
  document.documentElement.removeAttribute("data-accent");
  window.localStorage.clear();
}

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

// `applyStoredAccent` is the function `.toString()`-serialised into the
// pre-hydration <script> AccentScript renders. It has to run before React
// exists on the page, so it is tested directly here as a plain function
// against the real DOM/localStorage jsdom provides — the integration tests
// below cover the React side (the attribute it would have already set).
describe("applyStoredAccent (pre-hydration script logic)", () => {
  beforeEach(resetDom);
  afterEach(() => {
    resetDom();
    vi.restoreAllMocks();
  });

  it("applies a valid non-default stored accent to the document", () => {
    window.localStorage.setItem(STORAGE_KEY, "violet");
    applyStoredAccent(ACCENTS, STORAGE_KEY, DEFAULT_ACCENT);
    expect(document.documentElement.getAttribute("data-accent")).toBe("violet");
  });

  it("does not set an attribute for a corrupted stored value", () => {
    window.localStorage.setItem(STORAGE_KEY, "crimson");
    applyStoredAccent(ACCENTS, STORAGE_KEY, DEFAULT_ACCENT);
    expect(document.documentElement.getAttribute("data-accent")).toBeNull();
  });

  it("does not set an attribute when the stored value is already the default", () => {
    window.localStorage.setItem(STORAGE_KEY, "sun");
    applyStoredAccent(ACCENTS, STORAGE_KEY, DEFAULT_ACCENT);
    expect(document.documentElement.getAttribute("data-accent")).toBeNull();
  });

  it("swallows a thrown localStorage error instead of taking down the page", () => {
    vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(() => applyStoredAccent(ACCENTS, STORAGE_KEY, DEFAULT_ACCENT)).not.toThrow();
    expect(document.documentElement.getAttribute("data-accent")).toBeNull();
  });
});

describe("AccentProvider", () => {
  beforeEach(resetDom);
  afterEach(() => {
    cleanup();
    resetDom();
    vi.restoreAllMocks();
  });

  it("initialises from a data-accent attribute already on the document (the pre-hydration script's job)", () => {
    // Simulates what AccentScript already did before React hydrated: by the
    // time AccentProvider's first render runs, the attribute is already
    // there. If the provider instead started at DEFAULT_ACCENT and only
    // corrected itself in an effect, this would fail on the first render.
    document.documentElement.setAttribute("data-accent", "violet");
    const { result } = renderHook(() => useAccent(), { wrapper: AccentProvider });
    expect(result.current.accent).toBe("violet");
  });

  it("reads a stored accent from localStorage on mount when no attribute was pre-set", () => {
    // Fallback path: the pre-hydration script did not run (e.g. blocked by
    // a strict CSP), so no attribute was pre-set. The provider's own mount
    // effect should still pick up the stored preference.
    window.localStorage.setItem(STORAGE_KEY, "emerald");
    const { result } = renderHook(() => useAccent(), { wrapper: AccentProvider });
    expect(result.current.accent).toBe("emerald");
    expect(document.documentElement.getAttribute("data-accent")).toBe("emerald");
  });

  it("falls back to sun for a corrupted localStorage value", () => {
    window.localStorage.setItem(STORAGE_KEY, "crimson");
    const { result } = renderHook(() => useAccent(), { wrapper: AccentProvider });
    expect(result.current.accent).toBe("sun");
    expect(document.documentElement.getAttribute("data-accent")).toBeNull();
  });

  it("sets data-accent on the document for a non-default accent", () => {
    const { result } = renderHook(() => useAccent(), { wrapper: AccentProvider });
    act(() => result.current.setAccent("azure"));
    expect(document.documentElement.getAttribute("data-accent")).toBe("azure");
  });

  it("removes data-accent from the document for sun", () => {
    document.documentElement.setAttribute("data-accent", "rose");
    const { result } = renderHook(() => useAccent(), { wrapper: AccentProvider });
    act(() => result.current.setAccent("sun"));
    expect(document.documentElement.getAttribute("data-accent")).toBeNull();
  });

  it("throws when useAccent is called outside an AccentProvider", () => {
    expect(() => renderHook(() => useAccent())).toThrow(
      "useAccent must be used inside an AccentProvider.",
    );
  });
});
