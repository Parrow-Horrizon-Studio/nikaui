"use client";
// Required even though this component has no state of its own: it calls
// `buttonVariants()` directly at render time, and that's a plain-function
// export from button.tsx, a "use client" module. Next's RSC boundary
// forbids calling any export of a client module from a Server Component —
// it can only be rendered as a component, not invoked as a function. Nav
// already renders two client children (ThemeToggle, AccentSwitcher), so
// this isn't a new client-bundle cost, just an explicit one.

import type { ReactNode } from "react";
import Link from "next/link";
import { buttonVariants } from "@nikaui/registry/ui/button";
import { cn } from "@nikaui/registry/lib/utils";
import { AccentSwitcher } from "./accent-switcher";
import { Brand } from "./brand";
import { GITHUB_URL, NAV_LINKS, type NavLink } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

const linkClassName =
  "rounded-sm text-sm font-medium text-content-muted transition-colors hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

/**
 * `NAV_LINKS` only ever holds a same-page hash ("#pricing") or an in-app
 * path ("/docs/..."). A hash needs a plain anchor — `next/link` treats it
 * as a route change, not a scroll — everything else gets `next/link` so
 * navigating within the app doesn't trigger a full reload.
 */
function NavAnchor({ href, children }: { href: NavLink["href"]; children: ReactNode }) {
  if (href.startsWith("#")) {
    return (
      <a href={href} className={linkClassName}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={linkClassName}>
      {children}
    </Link>
  );
}

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3">
        <Brand />

        <nav aria-label="Primary" className="flex flex-wrap items-center gap-5">
          {NAV_LINKS.map((link) => (
            <NavAnchor key={link.href} href={link.href}>
              {link.label}
            </NavAnchor>
          ))}
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <AccentSwitcher />
          <ThemeToggle />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <GithubIcon />
          </a>
          <a href="#pricing" className={cn(buttonVariants({ size: "sm" }))}>
            Join the waitlist
          </a>
        </div>
      </div>
    </header>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
