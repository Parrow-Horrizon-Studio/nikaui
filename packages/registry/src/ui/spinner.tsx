"use client";

import * as React from "react";
import { motion as m } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

// `animate-spin` is deliberately NOT in this base string. It is a CSS
// keyframe loop, so it ignores the motion resolver entirely unless the
// component gates the class itself — which is how a Spinner kept spinning
// under `prefers-reduced-motion: reduce` while LoadingDots, twelve lines
// below, honoured it. The class is applied in the component, on
// `feel.enabled`.
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
    const feel = useMotionPreset("spinner", motionProp);

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
          feel.enabled && "animate-spin",
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
