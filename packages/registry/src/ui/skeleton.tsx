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
        "relative overflow-hidden rounded-md bg-muted",
        // A sweep, not a pulse. animate-pulse fades the whole block, and at
        // the bottom of its cycle a skeleton reads as disabled rather than
        // loading. A directional sweep reads as progress.
        //
        // motion-safe: is required, not just the configured.enabled check —
        // see the comment in spinner.tsx for why a JS-gated keyframe still
        // runs for a reduced-motion visitor on first paint.
        configured.enabled &&
          "motion-safe:after:absolute motion-safe:after:inset-0 motion-safe:after:-translate-x-full motion-safe:after:bg-gradient-to-r motion-safe:after:from-transparent motion-safe:after:via-shimmer motion-safe:after:to-transparent motion-safe:after:animate-[nika-shimmer_1.6s_ease-out_infinite]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
