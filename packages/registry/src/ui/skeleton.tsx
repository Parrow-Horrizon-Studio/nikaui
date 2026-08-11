"use client";

import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

/**
 * `animate-pulse` is a CSS keyframe loop, so it does not pass through the
 * motion resolver on its own — it kept pulsing under
 * `prefers-reduced-motion: reduce` and could not be switched off through the
 * API. Gating the class on `feel.enabled` puts it back under the same
 * precedence every other component obeys; disabled renders a static muted
 * block, which still reads as a placeholder.
 */
function Skeleton({ className, motion: motionProp, ...props }: SkeletonProps) {
  const feel = useMotionPreset("skeleton", motionProp);

  return (
    <div
      className={cn(
        feel.enabled && "animate-pulse",
        "rounded-md bg-muted",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
