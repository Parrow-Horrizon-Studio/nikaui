"use client";
// buttonVariants() is called directly at render time to style the two CTA
// links below (Link can't render as a <Button>, which is a <button>
// element) — the same reason components/site/nav.tsx is "use client". It's
// a plain function exported from a "use client" module, and Next's RSC
// boundary only allows calling it from a Client Component.

import Link from "next/link";
import { Badge } from "@nikaui/registry/ui/badge";
import { buttonVariants } from "@nikaui/registry/ui/button";
import { cn } from "@nikaui/registry/lib/utils";
import { InstallBar } from "./install-bar";

const STATS = [
  { value: "27", label: "Components" },
  { value: "5", label: "Motion presets" },
  { value: "5", label: "Accents" },
  { value: "MIT", label: "Open source core" },
] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="hero-rays" aria-hidden="true" />
      <div className="hero-sun" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col items-center px-6 pb-24 pt-20 text-center sm:pt-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 py-1 pl-1 pr-4 text-sm text-content-muted shadow-sm backdrop-blur">
          <Badge>New</Badge>
          <span>27 components, five motion presets</span>
        </div>

        <h1 className="mt-6 max-w-[16ch] text-balance text-5xl font-semibold tracking-tight text-content sm:text-6xl">
          Components with the{" "}
          <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
            freedom to move
          </span>
        </h1>

        <p className="mt-6 max-w-[56ch] text-balance text-lg text-content-muted">
          Beautiful, animated React components built with Tailwind and Motion. Install
          individually, own the code, theme everything from one line.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/docs/guide" className={cn(buttonVariants({ size: "lg" }))}>
            Get started
          </Link>
          <Link
            href="/docs/components"
            className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
          >
            Browse components
          </Link>
        </div>

        <div className="mt-8">
          <InstallBar command="npx nikaui add button" />
        </div>

        {/* Slot for Task 5's live component window. */}
        <div className="mt-16 w-full max-w-3xl" />

        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-content-muted">
          {STATS.map((stat, index) => (
            <span key={stat.label} className="flex items-center gap-3">
              {index > 0 ? (
                <span aria-hidden="true" className="text-content-subtle">
                  ·
                </span>
              ) : null}
              <span>
                <span className="font-semibold text-content">{stat.value}</span> / {stat.label}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
