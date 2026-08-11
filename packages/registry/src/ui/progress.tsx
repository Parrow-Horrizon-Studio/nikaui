"use client";

import * as React from "react";
import { motion as m } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100. Omit for an indeterminate bar. */
  value?: number;
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

/**
 * `repeat: Infinity` on the indeterminate sweep makes this a continuous
 * loop, not an enter/exit — a zero-length transition (feel.transition under
 * "none") does not stop a looping animation, it just restarts it every
 * frame. So the indeterminate branch checks `feel.enabled` explicitly:
 * disabled renders the segment fixed at the track's start (still a visible
 * "loading" affordance) instead of animating with duration 0.
 */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("progress", motionProp);
    const clamped =
      typeof value === "number" ? Math.min(100, Math.max(0, value)) : undefined;
    const indeterminate = clamped === undefined;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-muted",
          className
        )}
        {...props}
      >
        <m.div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-primary to-accent",
            indeterminate && "w-1/3"
          )}
          initial={false}
          animate={
            indeterminate
              ? feel.enabled
                ? { x: ["-100%", "300%"] }
                : { x: "0%" }
              : { width: `${clamped ?? 0}%` }
          }
          transition={
            indeterminate && feel.enabled
              ? { ...feel.transition, repeat: Infinity }
              : feel.transition
          }
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
