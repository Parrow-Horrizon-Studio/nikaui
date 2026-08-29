import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

/**
 * Mirrors Input's variants exactly — see the note there.
 *
 * The default sits on `bg-canvas`, not `bg-canvas-2`. It used the latter,
 * which meant a form placing an Input above a Textarea showed two different
 * surfaces for the same job, with a visible seam between them. Nothing about
 * a multi-line field justifies a different ground than a single-line one.
 */
const textareaVariants = cva(
  "flex min-h-20 w-full px-3 py-2 text-sm text-content placeholder:text-content-subtle transition-[background-color,border-color,box-shadow] duration-[var(--nika-duration)] ease-out focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
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

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(textareaVariants({ variant, className }))}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
