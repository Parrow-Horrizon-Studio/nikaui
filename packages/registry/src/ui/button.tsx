"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion as m, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold tracking-[-0.005em] shadow-sm transition-[background-color,transform,box-shadow] duration-[var(--nika-duration)] ease-out hover:shadow-md active:shadow-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-press",
        danger: "bg-danger text-danger-fg hover:bg-danger/90",
        outline:
          "border-[1.5px] border-line-strong bg-canvas shadow-none hover:bg-field hover:border-content-subtle hover:text-content",
        secondary:
          "bg-field text-content shadow-none hover:bg-field-hover hover:shadow-sm",
        ghost:
          "shadow-none hover:bg-field hover:text-content hover:shadow-none",
        link:
          "text-primary shadow-none underline-offset-4 hover:underline hover:shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "color">,
    VariantProps<typeof buttonVariants> {
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("button", motionProp);

    return (
      <m.button
        // Hover rises rather than scaling: scaling a text label blurs it
        // mid-transition. `feel.travel` is the resolver's distance multiplier
        // and is 0 under `none`, so this needs no separate reduced-motion
        // guard — the same reason the entrance transforms elsewhere use it.
        whileHover={{ y: -1 * feel.travel }}
        whileTap={{ scale: feel.scale.tap }}
        transition={feel.transition}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
