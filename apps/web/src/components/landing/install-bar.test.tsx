import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { InstallBar } from "./install-bar";

const COMMAND = "npx nikaui add button";

/**
 * jsdom does not define `navigator.clipboard` at all — the same
 * "unavailable" baseline the component itself treats as the safe default.
 * Tests that need the API present define it explicitly with this helper;
 * `afterEach` deletes it again so no test's stub leaks into the next.
 */
function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
  delete (navigator as { clipboard?: unknown }).clipboard;
});

describe("InstallBar", () => {
  it("shows the command it was given", () => {
    render(<InstallBar command="npx nikaui add button" />);
    expect(screen.getByText(/npx nikaui add button/)).toBeDefined();
  });

  it("labels its copy control for screen readers", () => {
    render(<InstallBar command="npx nikaui add button" />);
    expect(screen.getByRole("button", { name: /copy/i })).toBeDefined();
  });

  it("copies the exact advertised command and shows the confirmation a user would see", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    render(<InstallBar command={COMMAND} />);
    const button = (await screen.findByRole("button", {
      name: /^copy install command$/i,
    })) as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    fireEvent.click(button);

    // The live region is what a screen-reader user actually hears; the
    // accessible-name swap is what a sighted/AT keyboard user sees on the
    // control itself. Both are user-perceivable outcomes, not internal
    // React state — this is what survives a refactor of how the state is
    // held.
    await screen.findByText("Copied to clipboard.");
    expect(await screen.findByRole("button", { name: /^copied$/i })).toBeDefined();

    // A button that copies the wrong text is its own bug: assert the exact
    // argument, not merely that writeText was called.
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(COMMAND);
  });

  it("never claims success when the Clipboard API rejects, not even momentarily", async () => {
    const writeText = vi
      .fn()
      .mockRejectedValue(new DOMException("Document is not focused.", "NotAllowedError"));
    stubClipboard(writeText);

    render(<InstallBar command={COMMAND} />);
    const button = (await screen.findByRole("button", {
      name: /^copy install command$/i,
    })) as HTMLButtonElement;

    fireEvent.click(button);

    // Checked synchronously, immediately after the click and before the
    // rejected promise has had a chance to settle: a correct
    // implementation only changes state after the awaited call resolves or
    // rejects, so nothing should have flipped to the success state yet —
    // not even for one render.
    expect(button.getAttribute("aria-label")).toBe("Copy install command");

    await screen.findByText("Couldn't copy the command. Copy it manually instead.");
    expect(screen.queryByRole("button", { name: /^copied$/i })).toBeNull();
    expect(await screen.findByRole("button", { name: /^copy install command$/i })).toBeDefined();
  });

  it("stays inert and never throws when the Clipboard API is unavailable", async () => {
    render(<InstallBar command={COMMAND} />);
    const button = (await screen.findByRole("button", {
      name: /^copy install command$/i,
    })) as HTMLButtonElement;

    // "Inert" is the brief's own word for this state — the control looks
    // and behaves as unavailable rather than appearing live and quietly
    // failing when pressed.
    expect(button.disabled).toBe(true);

    expect(() => fireEvent.click(button)).not.toThrow();
    // Let any stray microtask work settle before asserting nothing changed.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.queryByRole("button", { name: /^copied$/i })).toBeNull();
    expect(screen.queryByText("Copied to clipboard.")).toBeNull();
  });
});
