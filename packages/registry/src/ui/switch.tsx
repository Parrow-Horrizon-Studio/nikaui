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
 * The unchecked track is `bg-line`, not `bg-canvas-2`.
 *
 * `bg-canvas-2` put the off track 1.06:1 from the page behind it and 1.06:1
 * from its own `bg-canvas` thumb — an off switch was effectively invisible
 * and so was the thumb inside it. `bg-line` measures 1.27:1 in light and
 * 1.44:1 in dark on both of those. `bg-muted` was the other candidate and is
 * weaker (1.09:1 / 1.22:1); it is also the token every component uses for
 * its hover surface, so an off track painted with it reads as hovered.
 *
 * This still does not reach the 3:1 that WCAG 1.4.11 asks of a state
 * indicator; no existing token does (`bg-line-strong` reaches only 1.54:1 /
 * 1.88:1). Closing that gap needs a token that does not exist yet, which is
 * a wider change than this. The state is not carried by the track alone —
 * the thumb translates 20px and the checked track becomes `bg-primary`.
 */
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("switch", motionProp);

    return (
      <HeadlessSwitch
        ref={ref}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary data-[unchecked]:bg-line",
          className
        )}
        {...props}
      >
        {({ checked }) => (
          <m.span
            className="pointer-events-none block h-5 w-5 rounded-full bg-canvas shadow-lg ring-0"
            animate={{ x: checked ? 20 : 0 }}
            transition={feel.transition}
          />
        )}
      </HeadlessSwitch>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
