"use client";
// buttonVariants() is called directly at render time to style the two CTA
// links below (a next/link and a plain <a> can't render as <Button>, a
// <button> element) — the same reason hero.tsx and site/nav.tsx are
// "use client".
//
// This project's Vitest pipeline has no automatic-JSX-runtime plugin
// configured (apps/web/tsconfig.json sets "jsx": "preserve", meant for
// Next's own SWC build, not Vite/esbuild), so any file using JSX syntax
// needs React in scope for the classic transform — the same reason
// hero-window.tsx and motion-showcase.tsx import it.
import * as React from "react";
import Link from "next/link";
import { buttonVariants } from "@nikaui/registry/ui/button";
import { cn } from "@nikaui/registry/lib/utils";
// Relative, not the "@/" alias: vitest.config.ts (untouched by this task)
// has no path-alias resolution set up, so a test that imports this module
// would fail to resolve an "@/..." specifier even though Next's own build
// resolves it fine.
import { GITHUB_URL } from "../site/nav-links";

export function CtaBand() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-6 py-24">
      <div className="cta-band">
        {/* Ported from the prototype's .sun-mark, enlarged via the
            .sun-mark--lg modifier appended in globals.css. `block` +
            `mx-auto` centers it explicitly: unlike the nav/footer's Brand,
            this span isn't inside a flex container, and width/height have
            no effect on a plain inline element. */}
        <span className="sun-mark sun-mark--lg mx-auto block" aria-hidden="true" />

        <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-content sm:text-4xl">
          Build something with the freedom to move
        </h2>
        <p className="mx-auto mt-4 max-w-[52ch] text-balance text-lg text-content-muted">
          Open the docs and add your first component in under a minute.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/docs/guide" className={cn(buttonVariants({ size: "lg" }))}>
            Read the docs
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Star on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
