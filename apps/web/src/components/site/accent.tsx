"use client";

import * as React from "react";

export const ACCENTS = ["sun", "violet", "emerald", "azure", "rose"] as const;

export type Accent = (typeof ACCENTS)[number];

export const DEFAULT_ACCENT: Accent = "sun";

export const STORAGE_KEY = "nika-accent";

export function isAccent(value: unknown): value is Accent {
  return typeof value === "string" && (ACCENTS as readonly string[]).includes(value);
}

/**
 * Applies a stored accent to the document before React hydrates. This is
 * `.toString()`-serialised into a <script> by `AccentScript`, so it runs in
 * the browser with none of this module's closure available — every value
 * it needs is threaded in as an argument rather than captured.
 *
 * Mirrors the technique next-themes uses to avoid the equivalent flash for
 * light/dark: read the stored value, validate it, apply the attribute,
 * before the browser paints anything. Without this, a returning visitor's
 * accent would flash `sun` and correct itself after hydration.
 */
export function applyStoredAccent(
  accents: readonly string[],
  storageKey: string,
  defaultAccent: string,
) {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored && stored !== defaultAccent && accents.indexOf(stored) !== -1) {
      document.documentElement.setAttribute("data-accent", stored);
    }
  } catch {
    // localStorage can throw (SecurityError in a partitioned iframe, some
    // privacy configurations). The accent is best-effort: fall back to the
    // default rather than let a storage error break the page.
  }
}

/**
 * Renders the pre-hydration accent script. `ACCENTS`, `STORAGE_KEY` and
 * `DEFAULT_ACCENT` are serialised from the real exports above at render
 * time — not duplicated as literals in the script string — so the accent
 * vocabulary the script checks against can never drift from the one the
 * rest of this module uses.
 *
 * Render this in `<head>`, before `<body>`, so it runs before first paint.
 */
export function AccentScript() {
  const script = `(${applyStoredAccent.toString()})(${JSON.stringify(
    ACCENTS,
  )},${JSON.stringify(STORAGE_KEY)},${JSON.stringify(DEFAULT_ACCENT)})`;
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: script }} />;
}

interface AccentContextValue {
  accent: Accent;
  setAccent: (accent: Accent) => void;
}

const AccentContext = React.createContext<AccentContextValue | null>(null);

function readInitialAccent(): Accent {
  // No `document` on the server — render as the default there, matching
  // the markup `AccentScript` produces before any accent is applied.
  if (typeof document === "undefined") return DEFAULT_ACCENT;
  // On the client, `AccentScript` has already run by the time this
  // component's first render happens (it is a synchronous <script> earlier
  // in the document), so reading the attribute it set gives the correct
  // accent on the very first render — no post-mount correction, no flash.
  const attr = document.documentElement.getAttribute("data-accent");
  return isAccent(attr) ? attr : DEFAULT_ACCENT;
}

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = React.useState<Accent>(readInitialAccent);

  // Fallback for when the pre-hydration script did not run (for example, a
  // Content-Security-Policy blocking unnonced inline scripts). In the
  // normal case this reads back the same value `readInitialAccent` already
  // picked up, so it is a no-op re-render.
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isAccent(stored)) setAccentState(stored);
    } catch {
      // Best-effort: keep whatever accent is already applied.
    }
  }, []);

  React.useEffect(() => {
    // `sun` is the default and its block is unconditional in tokens.css, so
    // it needs no attribute — leaving it off keeps the DOM honest about
    // which accents are overrides.
    if (accent === DEFAULT_ACCENT) {
      document.documentElement.removeAttribute("data-accent");
    } else {
      document.documentElement.setAttribute("data-accent", accent);
    }
  }, [accent]);

  const setAccent = React.useCallback((next: Accent) => {
    setAccentState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Best-effort persistence; the accent still applies for this session.
    }
  }, []);

  const value = React.useMemo(() => ({ accent, setAccent }), [accent, setAccent]);

  return <AccentContext.Provider value={value}>{children}</AccentContext.Provider>;
}

export function useAccent(): AccentContextValue {
  const context = React.useContext(AccentContext);
  if (!context) {
    throw new Error("useAccent must be used inside an AccentProvider.");
  }
  return context;
}
