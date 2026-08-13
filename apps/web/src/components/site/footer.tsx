import type { ReactNode } from "react";
import Link from "next/link";
import { Brand } from "./brand";
import { FOOTER_COLUMNS, type NavLink } from "./nav-links";

const linkClassName =
  "rounded-sm text-sm text-content-muted transition-colors hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

/**
 * Footer links carry three shapes: a same-page hash ("#motion"), an in-app
 * path ("/docs/..."), or an absolute URL (GitHub, its LICENSE blob). Only
 * the in-app path gets `next/link`; the other two are plain anchors, and an
 * absolute URL additionally opens in a new tab since it leaves the site.
 */
function FooterAnchor({ href, children }: { href: NavLink["href"]; children: ReactNode }) {
  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
        {children}
      </a>
    );
  }
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

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-12">
        {/* Two grid tracks, not one-per-column: `repeat(N, …)` would hard-code
            the column count again, just with a different N. The brand takes
            the first track; every `FOOTER_COLUMNS` entry lives inside the
            second as a `flex flex-wrap` group, so adding or removing a
            column is purely a data change — the grid never needs to know
            the count. */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-sm">
            <Brand />
            <p className="mt-4 text-sm text-content-muted">
              Beautiful, animated components with the freedom to move. Open source and MIT
              licensed.
            </p>
          </div>

          <div className="flex flex-wrap gap-10">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.heading}>
                <h3 className="text-sm font-semibold text-content">{column.heading}</h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <FooterAnchor href={link.href}>{link.label}</FooterAnchor>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-content-subtle">
            © 2026 Nika UI · Built with the freedom to move.
          </p>
          <p className="font-mono text-xs text-content-subtle">named after the Sun God, Nika ☀</p>
        </div>
      </div>
    </footer>
  );
}
