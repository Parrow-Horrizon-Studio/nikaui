"use client";
// This project's Vitest pipeline has no automatic-JSX-runtime plugin
// configured (apps/web/tsconfig.json sets "jsx": "preserve", meant for
// Next's own SWC build, not Vite/esbuild), so any file using JSX syntax
// needs React in scope for the classic transform — the same reason
// pricing.tsx and hero-window.tsx import it.
import * as React from "react";
import { Label } from "@nikaui/registry/ui/label";
import { Input } from "@nikaui/registry/ui/input";
import { Button } from "@nikaui/registry/ui/button";
import { cn } from "@nikaui/registry/lib/utils";
// Type-only: erased at compile time, so this doesn't create a runtime
// import cycle with pricing.tsx (which imports this component).
import type { PricingTier } from "./pricing";

/**
 * Imperative surface pricing.tsx drives through a ref: clicking a paid
 * tier's call to action records which tier was reached for, scrolls this
 * form into view and focuses its email field. A plain prop can't do this —
 * Pricing needs to reach into a sibling that renders after it, and "which
 * card was clicked" is transient interaction state, not something this
 * form's own render should own.
 */
export interface WaitlistFormHandle {
  openFor: (tier: PricingTier) => void;
}

type Status = "idle" | "submitting" | "success" | "error";

export const WaitlistForm = React.forwardRef<WaitlistFormHandle>(function WaitlistForm(
  _props,
  ref
) {
  const [email, setEmail] = React.useState("");
  // Honeypot value. No real visitor can reach this field (aria-hidden,
  // tabIndex={-1}, visually offscreen), so any non-empty value here is
  // itself the signal — see route.ts.
  const [company, setCompany] = React.useState("");
  const [tier, setTier] = React.useState<PricingTier | null>(null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [message, setMessage] = React.useState("");

  const rootRef = React.useRef<HTMLDivElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);

  React.useImperativeHandle(ref, () => ({
    openFor(nextTier) {
      setTier(nextTier);
      // `?.()` guards two things at once: rootRef.current can be null before
      // mount, and jsdom (this project's test environment) does not
      // implement scrollIntoView — calling it directly there throws.
      rootRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      emailRef.current?.focus();
    },
  }));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          // Omitted (not an empty string) when no tier was recorded — e.g.
          // the visitor typed straight into this field without clicking a
          // pricing card — so route.ts's own "unspecified" fallback is the
          // single place that decides what an absent tier is called.
          tier: tier ?? undefined,
          company,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;

      // Success is reported only when the server said `ok: true` on a 2xx
      // response — never inferred from "the request didn't throw". A 503
      // (no key), 429 (rate limited), 400 (bad input) and 502 (Loops
      // rejected it, e.g. an invalid key returning 401) all land here as
      // failures, each carrying the server's own message.
      if (!response.ok || data?.ok !== true) {
        setStatus("error");
        setMessage(data?.error ?? "We could not add you just now. Please try again.");
        return;
      }

      setStatus("success");
      setMessage("You're on the list. We'll email you when Pro is ready.");
      setEmail("");
    } catch {
      // A network failure (offline, DNS, CORS, …) never gets to report
      // success — the same rule InstallBar's copy-to-clipboard failure
      // path follows.
      setStatus("error");
      setMessage("Something went wrong. Check your connection and try again.");
    }
  }

  const submitting = status === "submitting";

  return (
    <div id="waitlist" ref={rootRef} className="mx-auto mt-16 max-w-md scroll-mt-24">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="waitlist-email">Email</Label>
            <Input
              id="waitlist-email"
              ref={emailRef}
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
              className="mt-1.5"
            />
          </div>
          <Button type="submit" disabled={submitting} className="sm:w-auto">
            Join the waitlist
          </Button>
        </div>

        {/* Honeypot: `hidden` (display:none), not `sr-only`. `sr-only` clips
            to a 1x1 box but keeps it in the layout and focusable by
            coordinate — and "company" is exactly the field name a
            browser's saved-address autofill targets first, so a real
            visitor's browser can and does fill an `sr-only` field like
            this one silently. `display:none` is never autofilled by any
            browser and never focusable by any means, so it costs the trap
            nothing: a bot that blindly fills every input still finds it,
            since filling is done by dispatching events against the DOM
            node, not by checking whether it renders. The body is read from
            React state (not the DOM) either way, so hiding it this way
            changes nothing about what gets submitted. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          className="hidden"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />

        <input type="hidden" name="tier" value={tier ?? ""} />

        <p
          role="status"
          aria-live="polite"
          className={cn(
            "min-h-[1.25rem] rounded-md px-2 py-1 text-sm",
            // `text-danger` is fine as body text (4.70:1 on the light
            // canvas). `text-success` is not — the token file's own
            // comment measures it at 2.08:1 and says so isn't a body-text
            // colour. Alert and Toast both solve this the same way: tint
            // the surface with the hue and keep `text-content` for the
            // text (14.9:1). Danger doesn't need the same tint; it's only
            // applied to success so the two states don't gain mismatched
            // treatments for no reason.
            status === "error" && "text-danger",
            status === "success" && "bg-success/10 text-content"
          )}
        >
          {message}
        </p>

        <p className="text-content-subtle text-xs">
          One email when Pro is ready. Nothing else, and one click to unsubscribe.
        </p>
      </form>
    </div>
  );
});
WaitlistForm.displayName = "WaitlistForm";
