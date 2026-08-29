"use client";

import * as React from "react";
import { Checkbox as HeadlessCheckbox } from "@headlessui/react";
import { motion as m } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

export interface CheckboxProps
  extends Omit<React.ComponentPropsWithoutRef<typeof HeadlessCheckbox>, "children"> {
  className?: string;
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const Checkbox = React.forwardRef<HTMLSpanElement, CheckboxProps>(
  ({ className, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("checkbox", motionProp);

    return (
      <HeadlessCheckbox
        ref={ref}
        className={cn(
          "peer size-5 shrink-0 rounded-[7px] border-2 border-indicator transition-[background-color,border-color] duration-[var(--nika-duration-fast)] ease-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:border-primary data-[checked]:bg-primary data-[checked]:text-primary-fg",
          className
        )}
        {...props}
      >
        {({ checked }) => (
          // Two movements, deliberately out of step: the box squashes and
          // springs back while the tick is drawn 60ms behind it, so the fill
          // lands first and the stroke follows. Animating pathLength and
          // opacity together over one 200ms transition — what this replaced —
          // reads as a fade, not as a tick being drawn.
          <m.span
            className="flex h-full w-full items-center justify-center"
            initial={false}
            animate={{ scale: checked && feel.enabled ? [1, 0.86, 1] : 1 }}
            transition={
              feel.enabled
                ? { duration: 0.52, ease: [0.34, 1.56, 0.64, 1] }
                : { duration: 0 }
            }
          >
            <m.svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-full w-full p-[3px]"
              initial={false}
              animate={{ pathLength: checked ? 1 : 0 }}
              transition={
                feel.enabled
                  ? {
                      duration: 0.34,
                      ease: [0.22, 1, 0.36, 1],
                      delay: checked ? 0.06 : 0,
                    }
                  : { duration: 0 }
              }
            >
              <m.path d="M20 6 9 17l-5-5" />
            </m.svg>
          </m.span>
        )}
      </HeadlessCheckbox>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
