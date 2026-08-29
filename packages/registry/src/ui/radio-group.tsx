"use client";

import * as React from "react";
import { Radio, RadioGroup as HeadlessRadioGroup } from "@headlessui/react";
import { motion as m } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
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

/**
 * `default` is the plain row: a 16px ring, an 8px dot, and the label beside
 * it. `card` makes the whole option a target — a surface with a 2px accent
 * border and a tinted fill when chosen, so the selection is legible across a
 * page rather than from an 8px dot. The card is the bigger visual jump, so it
 * is opt-in.
 */
const radioItemVariants = cva(
  "group flex cursor-pointer items-center gap-3 text-sm text-content focus-visible:outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        card:
          "w-full rounded-lg border-2 border-transparent bg-field px-3.5 py-2.5 transition-[background-color,border-color] duration-[var(--nika-duration)] ease-out hover:bg-field-hover data-[checked]:border-primary data-[checked]:bg-primary/10",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface RadioGroupItemProps
  extends VariantProps<typeof radioItemVariants> {
  value: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const RadioGroupItem = React.forwardRef<HTMLElement, RadioGroupItemProps>(
  ({ className, children, variant, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("radio-group", motionProp);

    return (
      <Radio
        ref={ref}
        className={cn(radioItemVariants({ variant, className }))}
        {...props}
      >
        {({ checked }) => (
          <>
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full border-2 border-indicator transition-colors group-data-[checked]:border-primary group-focus-visible:ring-[3px] group-focus-visible:ring-ring",
                variant === "card" ? "size-5" : "size-4"
              )}
            >
              <m.span
                className={cn(
                  "rounded-full bg-primary",
                  variant === "card" ? "size-2.5" : "size-2"
                )}
                initial={false}
                animate={{ scale: checked ? 1 : 0 }}
                transition={
                  feel.enabled
                    ? { duration: 0.52, ease: [0.34, 1.56, 0.64, 1] }
                    : { duration: 0 }
                }
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
