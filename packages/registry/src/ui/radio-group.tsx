"use client";

import * as React from "react";
import { Radio, RadioGroup as HeadlessRadioGroup } from "@headlessui/react";
import { motion as m } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

export interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, children, ...props }, ref) => (
    <HeadlessRadioGroup
      ref={ref}
      className={cn("grid gap-2", className)}
      {...props}
    >
      {children}
    </HeadlessRadioGroup>
  )
);
RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const RadioGroupItem = React.forwardRef<HTMLElement, RadioGroupItemProps>(
  ({ className, children, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("radio-group", motionProp);

    return (
      <Radio
        ref={ref}
        className={cn(
          "group flex cursor-pointer items-center gap-3 text-sm text-content focus-visible:outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
          className
        )}
        {...props}
      >
        {({ checked }) => (
          <>
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-line-strong ring-offset-canvas transition-colors group-data-[checked]:border-primary group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2">
              <m.span
                className="size-2 rounded-full bg-primary"
                initial={false}
                animate={{ scale: checked ? 1 : 0 }}
                transition={feel.transition}
              />
            </span>
            {children}
          </>
        )}
      </Radio>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
