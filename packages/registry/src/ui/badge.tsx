import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
  {
    variants: {
      variant: {
        // Tinted, not filled: a badge is an annotation, and a solid accent
        // fill makes it compete with the primary button on the same screen.
        // The previous solid fill is preserved as `solid`.
        default: "border-primary/25 bg-primary/15 text-primary",
        solid: "border-transparent bg-primary font-semibold text-primary-fg",
        secondary: "border-transparent bg-field text-content-muted",
        danger: "border-danger/25 bg-danger/15 text-danger",
        success: "border-success/30 bg-success/20 text-success",
        outline: "border-line-strong text-content-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
