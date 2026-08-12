import { act, cleanup, render, screen } from "@testing-library/react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccentProvider } from "./accent";
import { AccentSwitcher } from "./accent-switcher";

function resetDom() {
  document.documentElement.removeAttribute("data-accent");
  window.localStorage.clear();
}

function pressedOf(container: ParentNode, name: string) {
  return container
    .querySelector(`button[aria-label="${name}"]`)
    ?.getAttribute("aria-pressed");
}

describe("AccentSwitcher mount guard", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(resetDom);
  afterEach(() => {
    cleanup();
    if (root) {
      act(() => root!.unmount());
      root = null;
    }
    if (container) {
      container.remove();
      container = null;
    }
    resetDom();
  });

  it("shows the default accent's swatch as pressed before effects flush, even when the real accent differs", () => {
    // Simulate a returning visitor: the pre-hydration script (Task 2) has
    // already set data-accent="violet" on <html> before this component's
    // first render, so AccentProvider's `accent` context is already
    // "violet" on its very first render too (readInitialAccent reads the
    // DOM attribute directly — no effect required for that part). What
    // this test needs to observe is the window between that first render
    // and AccentSwitcher's *own* mount effect actually running — the same
    // gap a real browser has between hydration and the effect firing.
    //
    // RTL's `render()` wraps every render in `act()`, and `act()`
    // guarantees pending passive effects (including the mount effect that
    // flips `mounted` to `true`) have been flushed by the time it returns
    // — which would erase that gap entirely, no matter how render() itself
    // is invoked. `flushSync` is the one React API that forces a
    // synchronous DOM commit while still deferring passive effects to
    // their own async flush (React's documented distinction between
    // commit and passive-effect timing) — the same commit/effect gap a
    // real browser has between painting the server HTML and the mount
    // effect running afterward.
    //
    // Doing this outside `act()` is exactly what's needed, but React's dev
    // build logs an "update not wrapped in act()" warning for both the
    // unwrapped commit and the later deferred effect flush — expected,
    // understood, and not timing-deterministic enough to isolate to one
    // line, so it's silenced for this test's whole body rather than left
    // to pollute the run with a warning about the very thing being tested.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    document.documentElement.setAttribute("data-accent", "violet");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    flushSync(() => {
      root!.render(
        <AccentProvider>
          <AccentSwitcher />
        </AccentProvider>,
      );
    });

    expect(pressedOf(container, "Sun accent")).toBe("true");
    expect(pressedOf(container, "Violet accent")).toBe("false");

    // Flush the now-pending mount effect deliberately, inside act(), before
    // teardown — this is the deferred update the warning above belongs to.
    act(() => {});
    consoleError.mockRestore();
  });

  it("switches the pressed swatch to the real accent once mounted", () => {
    document.documentElement.setAttribute("data-accent", "violet");

    // No manual root this time: render() flushes the mount effect for real.
    render(
      <AccentProvider>
        <AccentSwitcher />
      </AccentProvider>,
    );

    expect(pressedOf(document.body, "Violet accent")).toBe("true");
    expect(pressedOf(document.body, "Sun accent")).toBe("false");
  });

  it("still lets a click change the selected accent after mount", () => {
    render(
      <AccentProvider>
        <AccentSwitcher />
      </AccentProvider>,
    );

    act(() => {
      screen.getByRole("button", { name: "Rose accent" }).click();
    });

    expect(pressedOf(document.body, "Rose accent")).toBe("true");
    expect(document.documentElement.getAttribute("data-accent")).toBe("rose");
  });
});
