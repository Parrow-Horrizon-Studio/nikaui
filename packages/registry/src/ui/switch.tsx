"use client";

import * as React from "react";
import { Switch as HeadlessSwitch } from "@headlessui/react";
import { motion as m } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

export interface SwitchProps
  extends Omit<React.ComponentPropsWithoutRef<typeof HeadlessSwitch>, "children"> {
  className?: string;
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

/**
 * The unchecked track is `bg-indicator`.
 *
 * WCAG 2.1 SC 1.4.11 asks 3:1 of a control's state indicator. This track is
 * the whole of the off state, so it is the tightest case in the library: it
 * has to clear 3:1 against both the page behind it and its own
 * `bg-surface` thumb.
 *
 * It did not, for a long time. `bg-canvas-2` put the off track 1.06:1 from
 * the page and 1.06:1 from its thumb — an off switch was effectively
 * invisible, and so was the thumb inside it. `bg-line` improved that to
 * 1.27:1 light / 1.44:1 dark and shipped, with a comment here admitting it
 * still fell short. `bg-line-strong` would have reached only 1.54:1 / 1.88:1,
 * and `bg-muted` is the hover surface every component uses, so an off track
 * painted with it reads as hovered.
 *
 * The gap was never a wrong value — it was a missing token. Every neutral in
 * the scale is deliberately subtle and correct at its own job. H1 added
 * `--nika-indicator`, tuned for exactly this rule and nothing else:
 *
 *   light  3.79:1 against canvas, 3.95:1 against surface
 *   dark   3.88:1 against canvas, 3.61:1 against surface
 *
 * tokens.test.ts asserts all four, so the value cannot drift back. The same
 * token carries the unchecked Checkbox border, the unchecked RadioGroup ring,
 * and the Slider and Progress tracks.
 */
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("switch", motionProp);

    return (
      <HeadlessSwitch
        ref={ref}
        className={cn(
          "peer inline-flex h-7 w-[50px] shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-[var(--nika-duration)] ease-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary data-[unchecked]:bg-indicator",
          className
        )}
        {...props}
      >
        {({ checked }) => (
          <m.span
            className="pointer-events-none block size-[22px] rounded-full bg-surface shadow-md ring-0"
            animate={{ x: checked ? 22 : 0 }}
            transition={
              feel.enabled
                ? { duration: 0.52, ease: [0.34, 1.56, 0.64, 1] }
                : { duration: 0 }
            }
          />
        )}
      </HeadlessSwitch>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
