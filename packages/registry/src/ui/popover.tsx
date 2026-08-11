"use client";

import * as React from "react";
import {
  Popover as HeadlessPopover,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import { motion as m } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

const Popover = HeadlessPopover;

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof PopoverButton>
>(({ className, ...props }, ref) => (
  <PopoverButton ref={ref} className={cn(className)} {...props} />
));
PopoverTrigger.displayName = "PopoverTrigger";

export interface PopoverContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", children, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("popover", motionProp);

    return (
      <PopoverPanel
        ref={ref}
        anchor={
          align === "start"
            ? "bottom start"
            : align === "end"
              ? "bottom end"
              : "bottom"
        }
        className={cn(
          "z-50 w-72 rounded-md border border-line bg-overlay p-4 text-content shadow-md outline-none",
          className
        )}
        {...props}
      >
        <m.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={feel.transition}
        >
          {children as React.ReactNode}
        </m.div>
      </PopoverPanel>
    );
  }
);
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
