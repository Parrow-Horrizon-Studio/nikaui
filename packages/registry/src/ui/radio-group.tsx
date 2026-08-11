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

function RadioGroup({ className, children, ...props }: RadioGroupProps) {
  return (
    <HeadlessRadioGroup className={cn("grid gap-2", className)} {...props}>
      {children}
    </HeadlessRadioGroup>
  );
}

export interface RadioGroupItemProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

function RadioGroupItem({
  className,
  children,
  motion: motionProp,
  ...props
}: RadioGroupItemProps) {
  const feel = useMotionPreset("radio-group", motionProp);

  return (
    <Radio
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

export { RadioGroup, RadioGroupItem };
