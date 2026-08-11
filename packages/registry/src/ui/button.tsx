"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion as m, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-fg hover:bg-primary-hover",
        destructive: "bg-danger text-danger-fg hover:bg-danger/90",
        outline:
          "border border-line-strong bg-canvas hover:bg-muted hover:text-content",
        secondary: "bg-surface-2 text-content hover:bg-muted",
        ghost: "hover:bg-muted hover:text-content",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
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
        whileHover={{ scale: feel.scale.hover }}
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
