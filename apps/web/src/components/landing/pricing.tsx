"use client";
// The paid tiers' buttons need an onClick, and the Free tier's link needs
// buttonVariants() to render a next/link as a <Button> — the same reason
// hero.tsx and site/nav.tsx are "use client".
//
// This project's Vitest pipeline has no automatic-JSX-runtime plugin
// configured (apps/web/tsconfig.json sets "jsx": "preserve", meant for
// Next's own SWC build, not Vite/esbuild), so any file using JSX syntax
// needs React in scope for the classic transform — the same reason
// hero-window.tsx and motion-showcase.tsx import it. Next's own build
// doesn't need this (it never hits Vite), but pricing.test.tsx does.
import * as React from "react";
import Link from "next/link";
import { Badge } from "@nikaui/registry/ui/badge";
import { Button, buttonVariants } from "@nikaui/registry/ui/button";
import { cn } from "@nikaui/registry/lib/utils";
// Relative, not the "@/" alias: vitest.config.ts (untouched by this task)
// has no path-alias resolution set up, so pricing.test.tsx — which renders
// <Pricing>, which renders <WaitlistForm> — would fail to resolve an
// "@/..." specifier even though Next's own build resolves it fine. See the
// same note in cta-band.tsx.
import { WaitlistForm, type WaitlistFormHandle } from "./waitlist-form";

/** The two tiers whose call to action opens the waitlist rather than a purchase. */
export type PricingTier = "personal" | "team";

export interface PricingProps {
  /**
   * Called with which paid tier's call to action was clicked. When omitted
   * — the case for every real render, since page.tsx is a Server Component
   * and can't pass a closure prop across the boundary — this scrolls the
   * <WaitlistForm> rendered below into view, focuses its email field and
   * records the tier, via the ref this component holds on that form. Tests
   * that pass their own `onWaitlist` replace that behaviour entirely (e.g.
   * to assert the tier argument without asserting on scroll/focus).
   *
   * The anchor id this JSDoc used to promise before the form existed
   * (`waitlist`) now lives on <WaitlistForm>'s own root element — see
   * waitlist-form.tsx — not on anything in this file.
   */
  onWaitlist?: (tier: PricingTier) => void;
}

interface Tier {
  name: string;
  /** Rendered as the card's `data-tier`, so tests and any future styling hook
   *  can target a specific card without relying on DOM nesting depth. */
  slug: "free" | "personal" | "team";
  /** The small pill next to the tier name — not the "Most popular" flag. */
  badge: string;
  price: string;
  period: string;
  blurb: string;
  /** No counts: there is nothing to count yet. See task-8-brief.md Step 1. */
  features: readonly string[];
  highlighted?: boolean;
  cta:
    | { kind: "link"; label: string; href: string }
    | { kind: "waitlist"; label: string; tier: PricingTier };
}

const TIERS: readonly Tier[] = [
  {
    name: "Free",
    slug: "free",
    badge: "Open source",
    price: "$0",
    period: "/ forever",
    blurb: "Everything you need to build.",
    features: [
      "All 27 core components",
      "Motion presets and theming",
      "CLI and full source",
      "MIT license",
    ],
    cta: { kind: "link", label: "Start building", href: "/docs/guide" },
  },
  {
    name: "Personal",
    slug: "personal",
    badge: "Lifetime",
    price: "$149",
    period: "one-time",
    blurb: "For one developer, on unlimited projects.",
    features: [
      "Everything in Free",
      "Premium blocks",
      "Full-page templates",
      "Lifetime updates",
      "1 developer",
    ],
    highlighted: true,
    cta: { kind: "waitlist", label: "Join the waitlist", tier: "personal" },
  },
  {
    name: "Team",
    slug: "team",
    badge: "Lifetime",
    price: "$349",
    period: "one-time",
    blurb: "For a team, on unlimited projects.",
    features: [
      "Everything in Personal",
      "Up to 5 developers at one organisation",
      "Priority on new blocks",
    ],
    cta: { kind: "waitlist", label: "Join the waitlist", tier: "team" },
  },
] as const;

export function Pricing({ onWaitlist }: PricingProps) {
  // Holds the imperative handle <WaitlistForm> exposes below, so the
  // default (no onWaitlist prop supplied) behaviour can reach across to a
  // sibling that renders after this grid. Declared with useRef, not in the
  // onWaitlist parameter default above, because a parameter default is
  // evaluated before any hook in this body has run — it cannot reference a
  // ref this component hasn't created yet.
  const formRef = React.useRef<WaitlistFormHandle>(null);

  function handleWaitlist(tier: PricingTier) {
    if (onWaitlist) {
      onWaitlist(tier);
      return;
    }
    formRef.current?.openFor(tier);
  }

  return (
    <section id="pricing" className="mx-auto w-full max-w-[1400px] px-6 py-24">
      <div className="mx-auto max-w-[60ch] text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Pricing</p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-content sm:text-4xl">
          Free forever, with Pro on the way
        </h2>
        <p className="mt-4 text-balance text-lg text-content-muted">
          The full library is free and MIT licensed. Personal and Team join the waitlist for
          premium blocks, templates and lifetime updates.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-[1080px] grid-cols-1 gap-6 min-[860px]:grid-cols-3">
        {TIERS.map((tier) => {
          // Narrowing `tier.cta.kind` doesn't survive into the onClick
          // closure below when re-read as the `tier.cta` property access —
          // TypeScript only carries a discriminant narrowing across a
          // closure boundary for a `const` binding, not a repeated member
          // access. Binding it once here is what makes `cta.tier` typed
          // (rather than possibly-undefined) inside the waitlist branch.
          const cta = tier.cta;

          return (
            <div
              key={tier.name}
              data-tier={tier.slug}
              className={cn(
                // `border-line` and `border-primary/50` both set the same
                // border-color longhand — never applied together, so the
                // winner is never left to Tailwind's utility-generation
                // order (which the class-attribute order doesn't control).
                "relative flex flex-col rounded-xl border bg-surface p-8",
                tier.highlighted
                  ? "pricing-highlight border-primary/50 ring-1 ring-primary/30 shadow-lg"
                  : "border-line"
              )}
            >
              {tier.highlighted ? (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most popular</Badge>
              ) : null}

              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-content">{tier.name}</h3>
                <Badge variant="secondary">{tier.badge}</Badge>
              </div>

              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight text-content">
                  {tier.price}
                </span>
                <span className="text-sm text-content-muted">{tier.period}</span>
              </p>

              <p className="mt-2 text-sm text-content-muted">{tier.blurb}</p>

              <div className="mt-6">
                {cta.kind === "link" ? (
                  <Link
                    href={cta.href}
                    className={cn(
                      buttonVariants({ variant: tier.highlighted ? "default" : "outline" }),
                      "w-full"
                    )}
                  >
                    {cta.label}
                  </Link>
                ) : (
                  <Button
                    variant={tier.highlighted ? "default" : "outline"}
                    className="w-full"
                    onClick={() => handleWaitlist(cta.tier)}
                  >
                    {cta.label}
                  </Button>
                )}
              </div>

              <ul className="mt-8 flex flex-col gap-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-content">
                    <CheckIcon />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mx-auto mt-8 max-w-[60ch] text-center text-content-muted text-sm">
        Nika Pro is not on sale yet. Join the waitlist and you will hear first — and help decide
        which blocks get built.
      </p>

      <WaitlistForm ref={formRef} />
    </section>
  );
}

/** A small check mark for feature-list entries. */
function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 size-4 shrink-0 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
