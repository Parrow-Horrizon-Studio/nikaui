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

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("switch", motionProp);

    return (
      <HeadlessSwitch
        ref={ref}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary data-[unchecked]:bg-canvas-2",
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
