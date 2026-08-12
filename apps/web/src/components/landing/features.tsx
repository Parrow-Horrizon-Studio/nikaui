import type { ReactNode } from "react";

interface Feature {
  heading: string;
  body: ReactNode;
  icon: ReactNode;
}

const FEATURES: readonly Feature[] = [
  {
    heading: "You own the code",
    body: "The CLI copies real source into your repo — no opaque package. Read it, fork it, ship it. Forever yours.",
    icon: <CodeIcon />,
  },
  {
    heading: "Animated by default",
    body: (
      <>
        Every component ships with named spring presets. Pass{" "}
        <code className="font-mono text-primary">motion=&quot;bounce&quot;</code> — done. Powered
        by Motion.
      </>
    ),
    icon: <MotionIcon />,
  },
  {
    heading: "Centralized theming",
    body: "One token layer drives the whole system. Swap an accent and buttons, rings and gradients all retune.",
    icon: <ThemingIcon />,
  },
  {
    heading: "CLI-first install",
    body: (
      <>
        <code className="font-mono text-primary">npx nikaui add</code> pulls a component, its
        dependencies and its motion config in one step.
      </>
    ),
    icon: <CliIcon />,
  },
  {
    heading: "Accessible primitives",
    body: "Built on Headless UI — focus traps, keyboard navigation and ARIA handled, so your polish never costs accessibility.",
    icon: <AccessibleIcon />,
  },
  {
    heading: "Light and dark",
    body: "Two modes, one source of truth. Tuned in OKLCH for consistent contrast across every accent.",
    icon: <ThemesIcon />,
  },
];

export function Features() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-6 py-24">
      <div className="mx-auto max-w-[60ch] text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Why Nika</p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-content sm:text-4xl">
          The workflow you know, with motion in its DNA
        </h2>
        <p className="mt-4 text-balance text-lg text-content-muted">
          Open, ownable, and animated by default. Built for teams who want polish without fighting
          a black box.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 min-[860px]:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.heading}
            className="rounded-xl border border-line bg-surface p-[26px] transition hover:-translate-y-[3px] hover:border-line-strong hover:shadow-md"
          >
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/14 text-primary">
              {feature.icon}
            </div>
            <h3 className="mt-4 font-semibold text-content">{feature.heading}</h3>
            <p className="mt-2 text-sm text-content-muted">{feature.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  className: "size-[22px]",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
} as const;

/** "You own the code" — a code-brackets glyph. */
function CodeIcon() {
  return (
    <svg {...iconProps}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

/** "Animated by default" — a bolt, for motion. */
function MotionIcon() {
  return (
    <svg {...iconProps}>
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
    </svg>
  );
}

/** "Centralized theming" — three tuned sliders, for the token layer. */
function ThemingIcon() {
  return (
    <svg {...iconProps}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="9" cy="6" r="2" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="15" cy="12" r="2" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="9" cy="18" r="2" />
    </svg>
  );
}

/** "CLI-first install" — a terminal prompt. */
function CliIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <polyline points="7 9 10 12 7 15" />
      <line x1="12" y1="15" x2="16" y2="15" />
    </svg>
  );
}

/** "Accessible primitives" — a shield with a check, for handled-for-you. */
function AccessibleIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/** "Light and dark" — a half-filled contrast disc. */
function ThemesIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
