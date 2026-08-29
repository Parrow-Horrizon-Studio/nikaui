import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

/**
 * `default` is the bordered field on the page canvas — unchanged, and what
 * you get with no `variant` prop.
 *
 * `filled` is the borderless treatment: the control becomes a surface in its
 * own right, darkening on hover and again on focus, with an inset ring rather
 * than one drawn outside the border. It reads as a distinctly different form
 * language, which is why it is opt-in rather than the default.
 *
 * The floating label that pairs with `filled` is not here. It needs a wrapper
 * element to position against, and that wrapper (`Field`) arrives with the
 * label, description and error slots in H2. `filled` on its own is the
 * surface treatment only.
 */
const inputVariants = cva(
  "flex h-10 w-full px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-content placeholder:text-content-muted transition-[background-color,border-color,box-shadow] duration-[var(--nika-duration)] ease-out focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "rounded-md border border-line-strong bg-canvas focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring",
        filled:
          "rounded-lg border-0 bg-field hover:bg-field-hover focus-visible:bg-field-press focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
