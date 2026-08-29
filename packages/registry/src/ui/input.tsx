import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

/**
 * `default` is the bordered field on the page canvas — what you get with no
 * `variant` prop.
 *
 * `filled` is the borderless treatment: the control becomes a surface in its
 * own right, darkening on hover and again on focus, with an inset ring rather
 * than one drawn outside a border. It reads as a distinctly different form
 * language, which is why it is opt-in.
 *
 * The floating label that pairs with `filled` lives in `Field`, which owns
 * the label and needs somewhere to position it against.
 */
const inputVariants = cva(
  "flex w-full px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-content placeholder:text-content-muted transition-[background-color,border-color,box-shadow] duration-[var(--nika-duration)] ease-out focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "rounded-md border border-line-strong bg-canvas focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring",
        filled:
          "rounded-lg border-0 bg-field hover:bg-field-hover focus-visible:bg-field-press focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
      },
      size: {
        sm: "h-9 text-[13px]",
        md: "h-10",
        lg: "h-11 text-[15px]",
      },
      invalid: {
        true: "border-danger focus-visible:border-danger focus-visible:ring-danger/45",
        false: "",
      },
    },
    defaultVariants: { variant: "default", size: "md", invalid: false },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /**
   * Leading icon or affix.
   *
   * A prop rather than a composed child on purpose: the input's own padding
   * has to shift to make room, and a consumer composing an absolutely
   * positioned icon has to remember to do that every time. Here it cannot be
   * forgotten.
   */
  startContent?: React.ReactNode;
  /** Trailing icon, affix or action. Shifts the padding the same way. */
  endContent?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, variant, size, invalid, startContent, endContent, ...props },
    ref
  ) => {
    const field = (
      <input
        type={type}
        className={cn(
          inputVariants({ variant, size, invalid }),
          startContent && "pl-9",
          endContent && "pr-10",
          className
        )}
        ref={ref}
        {...props}
      />
    );

    if (!startContent && !endContent) return field;

    return (
      <div className="relative flex w-full items-center">
        {startContent ? (
          <span className="pointer-events-none absolute left-3 flex items-center text-content-subtle [&_svg]:size-4">
            {startContent}
          </span>
        ) : null}
        {field}
        {endContent ? (
          // Not pointer-events-none: end content is often a clear or reveal
          // button, and making it inert would break it.
          <span className="absolute right-3 flex items-center text-content-subtle [&_svg]:size-4">
            {endContent}
          </span>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
