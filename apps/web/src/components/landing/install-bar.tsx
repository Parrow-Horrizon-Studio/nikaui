"use client";

import * as React from "react";

export interface InstallBarProps {
  command: string;
}

/** How long the tick stays up before reverting to the copy icon. */
const CONFIRMATION_MS = 2000;

/**
 * `navigator.clipboard` is only defined in secure contexts (https, or
 * localhost) — plain http, and some embedded/iframed views, leave it
 * `undefined`. Checked lazily inside an effect (never during the initial
 * render) so the server-rendered markup and the client's first render agree:
 * both start from "unavailable" and the button only becomes interactive once
 * the browser has actually confirmed the API exists.
 */
function clipboardIsAvailable(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function";
}

export function InstallBar({ command }: InstallBarProps) {
  const [clipboardAvailable, setClipboardAvailable] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState("");
  const resetTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setClipboardAvailable(clipboardIsAvailable());
  }, []);

  React.useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  async function handleCopy() {
    if (!clipboardIsAvailable()) return;

    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setAnnouncement("Copied to clipboard.");
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), CONFIRMATION_MS);
    } catch {
      // A real rejection (permission denied, user gesture requirements not
      // met, …) — never claim success for a copy that didn't happen.
      setCopied(false);
      setAnnouncement("Couldn't copy the command. Copy it manually instead.");
    }
  }

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-line bg-code px-5 py-2.5 font-mono text-sm">
      <span aria-hidden="true" className="text-primary">
        ❯
      </span>
      <code className="text-white/90">{command}</code>
      <button
        type="button"
        onClick={handleCopy}
        disabled={!clipboardAvailable}
        aria-label={copied ? "Copied" : "Copy install command"}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-code disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      {/* Announces the copy outcome (success or failure) without stealing
          visual focus — the icon swap already carries the confirmation for
          sighted users. */}
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
