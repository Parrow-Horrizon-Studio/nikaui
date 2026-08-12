// This project's Vitest pipeline has no automatic-JSX-runtime plugin
// configured (apps/web/tsconfig.json sets "jsx": "preserve", meant for
// Next's own SWC build, not Vite/esbuild), so any test file using JSX
// syntax needs React in scope for the classic transform — the same reason
// pricing.test.tsx does.
import * as React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WaitlistForm, type WaitlistFormHandle } from "./waitlist-form";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const SUCCESS_TEXT = "You're on the list. We'll email you when Pro is ready.";

/** Stubs global.fetch to resolve once with a minimal fetch-Response-like
 *  object — only `.ok` and `.json()` are ever read by waitlist-form.tsx. */
function mockFetchResolves(response: { ok: boolean; json: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function submit(email: string) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Join the waitlist" }));
}

describe("WaitlistForm", () => {
  it("has a real label, an email-typed required input and an aria-live status region", () => {
    render(<WaitlistForm />);
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    expect(input.type).toBe("email");
    expect(input.required).toBe(true);
    expect(input.getAttribute("autocomplete")).toBe("email");

    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toBe("");
  });

  it("shows the unsubscribe disclaimer beneath the field, verbatim", () => {
    render(<WaitlistForm />);
    expect(
      screen.getByText("One email when Pro is ready. Nothing else, and one click to unsubscribe.")
    ).toBeDefined();
  });

  // Regression guard for the review finding: `sr-only` clips the honeypot
  // to a 1x1 box but leaves it in the layout and focusable by coordinate,
  // and "company" is exactly the field name browser saved-address autofill
  // targets first — so a real visitor's browser could fill and submit it.
  // `hidden` (display:none) is never autofilled and never focusable by any
  // means, so only something that blindly dispatches input events at every
  // DOM node (a bot) will ever put a value in it.
  it("hides the honeypot with display:none, not sr-only, and keeps it out of the tab order", () => {
    const { container } = render(<WaitlistForm />);
    const honeypot = container.querySelector('input[name="company"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot?.getAttribute("tabindex")).toBe("-1");
    expect(honeypot?.getAttribute("aria-hidden")).toBe("true");
    expect(honeypot?.className.split(/\s+/)).toContain("hidden");
    expect(honeypot?.className).not.toContain("sr-only");
  });

  it("shows the server's error text, never the success text, when the key is missing (503)", async () => {
    mockFetchResolves({
      ok: false,
      json: () => Promise.resolve({ error: "The waitlist is not accepting signups yet." }),
    });
    render(<WaitlistForm />);
    submit("luffy@nika.dev");

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe(
        "The waitlist is not accepting signups yet."
      );
    });
    expect(screen.queryByText(SUCCESS_TEXT)).toBeNull();
  });

  it("shows the server's error text, never the success text, when Loops rejects the signup (502)", async () => {
    mockFetchResolves({
      ok: false,
      json: () => Promise.resolve({ error: "We could not add you just now. Please try again." }),
    });
    render(<WaitlistForm />);
    submit("luffy@nika.dev");

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe(
        "We could not add you just now. Please try again."
      );
    });
    expect(screen.queryByText(SUCCESS_TEXT)).toBeNull();
  });

  it("shows the server's error text, never the success text, when rate limited (429)", async () => {
    mockFetchResolves({
      ok: false,
      json: () => Promise.resolve({ error: "Too many attempts. Try again in a minute." }),
    });
    render(<WaitlistForm />);
    submit("luffy@nika.dev");

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe("Too many attempts. Try again in a minute.");
    });
    expect(screen.queryByText(SUCCESS_TEXT)).toBeNull();
  });

  it("shows the success text only when the server responds ok:true, and clears the field", async () => {
    mockFetchResolves({ ok: true, json: () => Promise.resolve({ ok: true }) });
    render(<WaitlistForm />);
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    submit("luffy@nika.dev");

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe(SUCCESS_TEXT);
    });
    expect(input.value).toBe("");
  });

  it("never reports success when a 2xx response's body doesn't confirm ok:true", async () => {
    // A response that resolves without throwing is not by itself success —
    // only an explicit `ok: true` in the body is. This is the client-side
    // half of the same defect the route-level fix addresses.
    mockFetchResolves({ ok: true, json: () => Promise.resolve({}) });
    render(<WaitlistForm />);
    submit("luffy@nika.dev");

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe(
        "We could not add you just now. Please try again."
      );
    });
    expect(screen.queryByText(SUCCESS_TEXT)).toBeNull();
  });

  it("never reports success when fetch itself throws — a network failure is a failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;
    render(<WaitlistForm />);
    submit("luffy@nika.dev");

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe(
        "Something went wrong. Check your connection and try again."
      );
    });
    expect(screen.queryByText(SUCCESS_TEXT)).toBeNull();
  });

  it("exposes openFor via ref: records the tier in the hidden input and focuses the email field", () => {
    const ref = React.createRef<WaitlistFormHandle>();
    const { container } = render(<WaitlistForm ref={ref} />);

    act(() => {
      ref.current?.openFor("team");
    });

    const tierHidden = container.querySelector('input[type="hidden"][name="tier"]') as HTMLInputElement;
    expect(tierHidden.value).toBe("team");
    expect(document.activeElement).toBe(screen.getByLabelText("Email"));
  });
});
