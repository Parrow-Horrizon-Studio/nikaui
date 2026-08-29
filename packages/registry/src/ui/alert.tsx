import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

/**
 * Status is carried by a rail and an icon, never by the surface.
 *
 * The status variants used to tint the surface itself — `bg-success/10` and
 * friends — with no opaque base underneath. Over a photograph, a gradient, or
 * any page content, that showed straight through and the text stopped being
 * readable. The class names looked correct and every test passed; the defect
 * was only visible by putting an Alert over something.
 *
 * The constraint that produced the tint in the first place still holds and is
 * worth restating: the status hue is not a body-text colour on the light
 * canvas. `text-success` on `bg-success/10` measures 1.94:1, because both the
 * hue and a 10% wash of it over a near-white page sit at almost the same
 * luminance; `text-content` on the same tint measures 14.9:1. The hues are
 * readable as fills, borders and large icons. So the hue moved to a 3px rail
 * and a 20px icon chip — both of which are fills — and the surface underneath
 * became opaque.
 */
const alertVariants = cva(
  "relative w-full overflow-hidden rounded-lg border border-line bg-surface px-4 py-3 text-sm text-content before:absolute before:content-[''] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-4 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "before:bg-content-subtle",
        success: "before:bg-success [&>svg]:text-success",
        warning: "before:bg-warning [&>svg]:text-warning",
        danger: "before:bg-danger [&>svg]:text-danger",
        info: "before:bg-info [&>svg]:text-info",
      },
      rail: {
        left: "pl-[19px] before:inset-y-0 before:left-0 before:w-[3px]",
        top: "pt-[15px] before:inset-x-0 before:top-0 before:h-[3px]",
      },
    },
    defaultVariants: { variant: "default", rail: "left" },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, rail, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant, rail }), className)}
      {...props}
    />
  )
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-content-muted [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, alertVariants };
