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
  /**
   * Which side of the trigger the panel opens on.
   *
   * `align` alone could only shift a panel that was always pinned to the
   * bottom, so "open this above the trigger" was not expressible — and a
   * trigger near the foot of the page opened its panel off-screen.
   */
  placement?: "top" | "right" | "bottom" | "left";
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  (
    {
      className,
      align = "center",
      placement = "bottom",
      children,
      motion: motionProp,
      ...props
    },
    ref
  ) => {
    const feel = useMotionPreset("popover", motionProp);

    return (
      <PopoverPanel
        ref={ref}
        // Headless UI takes "<side> <alignment>"; alignment only applies to
        // the two horizontal sides, which is why left/right pass the side
        // alone rather than an alignment that would be ignored.
        anchor={
          placement === "top" || placement === "bottom"
            ? align === "center"
              ? placement
              : `${placement} ${align}`
            : placement
        }
        data-placement={placement}
        className={cn(
          "z-50 w-72 origin-top-left rounded-lg border border-line bg-overlay p-4 text-content shadow-lg outline-none",
          className
        )}
        {...props}
      >
        <m.div
          initial={{ opacity: 0, y: -4 * feel.travel }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 * feel.travel }}
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
