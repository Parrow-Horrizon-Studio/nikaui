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
 * The off track is painted unconditionally; only the ON state is
 * attribute-driven.
 *
 * It used to be `data-[unchecked]:bg-line`, and that never applied.
 * Headless UI emits `data-checked` when a Switch is on and emits NOTHING
 * when it is off — no `data-unchecked` attribute exists to match. So the
 * off track had no background at all: transparent, 1.00:1 against whatever
 * was behind it, an off switch visible only by its thumb.
 *
 * The comment that used to sit here said the off track was `bg-line` and
 * measured 1.27:1. That figure was real for the colour, but the colour was
 * never on screen. It was found by reading getComputedStyle in a browser
 * during H1's visual pass — every unit test passed, because the class string
 * was present and correct and simply matched nothing.
 *
 * WCAG 2.1 SC 1.4.11 asks 3:1 of a state indicator, and this track is the
 * whole of the off state, so it must clear 3:1 against both the page behind
 * it and its own `bg-surface` thumb. `--nika-indicator` exists for that:
 *
 *   light  3.79:1 against canvas, 3.95:1 against surface
 *   dark   3.88:1 against canvas, 3.61:1 against surface
 *
 * tokens.test.ts asserts all four, and switch.test.tsx asserts that the off
 * state does not depend on an attribute Headless UI never sets.
 */
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("switch", motionProp);

    return (
      <HeadlessSwitch
        ref={ref}
        className={cn(
          "peer inline-flex h-7 w-[50px] shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-[var(--nika-duration)] ease-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 bg-indicator data-[checked]:bg-primary",
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
