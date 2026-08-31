"use client";

import * as React from "react";

/**
 * Copies a string to the clipboard and says so.
 *
 * The confirmation matters more than it looks: without it, a click that
 * silently succeeds and a click that silently fails are indistinguishable,
 * and clipboard writes do fail — denied permissions, insecure origins.
 */
export function CopyButton({ value }: { value: string }) {
  const [state, setState] = React.useState<"idle" | "copied" | "failed">("idle");

  React.useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 1600);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setState("copied");
        } catch {
          setState("failed");
        }
      }}
      className="rounded-md px-2 py-1 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
    >
      {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}
    </button>
  );
}
