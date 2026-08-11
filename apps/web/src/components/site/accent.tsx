"use client";

import * as React from "react";

export const ACCENTS = ["sun", "violet", "emerald", "azure", "rose"] as const;

export type Accent = (typeof ACCENTS)[number];

export const DEFAULT_ACCENT: Accent = "sun";

const STORAGE_KEY = "nika-accent";

export function isAccent(value: unknown): value is Accent {
  return typeof value === "string" && (ACCENTS as readonly string[]).includes(value);
}

interface AccentContextValue {
  accent: Accent;
  setAccent: (accent: Accent) => void;
}

const AccentContext = React.createContext<AccentContextValue | null>(null);

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = React.useState<Accent>(DEFAULT_ACCENT);

  // Read the stored preference after mount. Doing this during render would
  // produce server/client markup that disagrees.
  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isAccent(stored)) setAccentState(stored);
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
    window.localStorage.setItem(STORAGE_KEY, next);
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
