"use client";

import * as React from "react";
import { motion as m } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import {
  useConfiguredMotion,
  useMotionPreset,
  type MotionPreset,
} from "../lib/motion";

/**
 * Size and colour only. **This does not include the spin class.**
 *
 * A spin class is a CSS keyframe loop, so it ignores the motion resolver
 * entirely unless something gates the class — which is how a Spinner kept
 * spinning under `prefers-reduced-motion: reduce` while `LoadingDots`,
 * twelve lines below it in this same file, honoured the preference. Whether
 * the icon animates is now the component's decision, so the class lives in
 * `<Spinner>` and not in this base string.
 *
 * Two things gate it, and both are needed. The `motion` API gates whether
 * the class is rendered at all, from `useConfiguredMotion`. The visitor's
 * reduced-motion preference gates whether the browser runs it, through the
 * `motion-safe:` variant — a plain `animate-spin` gated in JavaScript spins
 * in the server-rendered HTML until hydration catches up, and disagrees with
 * the server about the class list when it does.
 *
 * If you compose this onto your own element, you own that decision too —
 * `spinnerVariants({ size })` alone renders a static icon. Gate the class
 * the way `<Spinner>` does:
 *
 * ```tsx
 * const configured = useConfiguredMotion("spinner");
 * <svg className={cn(configured.enabled && "motion-safe:animate-spin", spinnerVariants({ size }))} />
 * ```
 *
 * Hard-coding a bare `animate-spin` instead works, but opts that element out
 * of reduced motion and out of the `motion` API.
 */
const spinnerVariants = cva("text-content-muted", {
  variants: {
    size: {
      sm: "h-4 w-4",
      default: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface SpinnerProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, motion: motionProp, ...props }, ref) => {
    // The class list is server-rendered, so the reduced-motion half of the
    // gate is CSS (`motion-safe:`) and not this hook — see
    // useConfiguredMotion.
    const configured = useConfiguredMotion("spinner", motionProp);

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          configured.enabled && "motion-safe:animate-spin",
          spinnerVariants({ size }),
          className
        )}
        {...props}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    );
  }
);
Spinner.displayName = "Spinner";

export interface LoadingDotsProps {
  className?: string;
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

/**
 * A motion-enhanced loading dots indicator.
 *
 * `repeat: Infinity` makes this a continuous loop, not an enter/exit — a
 * zero-length transition (feel.transition under "none") does not stop a
 * looping animation, it just restarts it every frame. So this branches on
 * `feel.enabled` explicitly: disabled renders all three dots at a fixed,
 * fully-opaque state (still a visible "loading" affordance — three solid
 * dots read as active/pending — without motion), rather than animating with
 * duration 0 or freezing at whatever the last keyframe happened to be.
 */
function LoadingDots({ className, motion: motionProp }: LoadingDotsProps) {
  const feel = useMotionPreset("spinner", motionProp);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <m.div
          key={i}
          className="h-2 w-2 rounded-full bg-current"
          animate={feel.enabled ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }}
          transition={
            feel.enabled
              ? { ...feel.transition, repeat: Infinity, delay: i * 0.2 }
              : feel.transition
          }
        />
      ))}
    </div>
  );
}

export { Spinner, LoadingDots, spinnerVariants };
