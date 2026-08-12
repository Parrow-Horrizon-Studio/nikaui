"use client";

import { cn } from "../lib/utils";
import { useConfiguredMotion, type MotionPreset } from "../lib/motion";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

/**
 * A pulse class is a CSS keyframe loop, so it does not pass through the
 * motion resolver on its own — it kept pulsing under
 * `prefers-reduced-motion: reduce` and could not be switched off through the
 * API. Two gates put it back under the same precedence every other component
 * obeys: `configured.enabled` decides whether the class is rendered at all,
 * and the `motion-safe:` variant decides whether the browser runs it.
 *
 * The preference has to be the CSS half. This class list is server-rendered,
 * and a `prefers-reduced-motion` read in JavaScript is not available there —
 * gating on it disagrees with the server about the class list, and pulses in
 * the server-rendered HTML until hydration catches up. Disabled either way
 * renders a static muted block, which still reads as a placeholder.
 */
function Skeleton({ className, motion: motionProp, ...props }: SkeletonProps) {
  const configured = useConfiguredMotion("skeleton", motionProp);

  return (
    <div
      className={cn(
        configured.enabled && "motion-safe:animate-pulse",
        "rounded-md bg-muted",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
