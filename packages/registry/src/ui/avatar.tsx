"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const avatarVariants = cva("relative flex shrink-0 rounded-full", {
  variants: {
    size: {
      xs: "size-6 text-[10px]",
      sm: "size-8 text-xs",
      md: "size-10 text-sm",
      lg: "size-13 text-lg",
      xl: "size-17 text-xl",
    },
    shape: { circle: "rounded-full", square: "rounded-lg" },
  },
  defaultVariants: { size: "md", shape: "circle" },
});

const STATUS_COLOUR = {
  online: "bg-success",
  away: "bg-warning",
  offline: "bg-content-subtle",
} as const;

export interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatarVariants> {
  /** Presence indicator. Announced, not just coloured. */
  status?: "online" | "away" | "offline";
  /** Ring marking the active user. */
  ring?: boolean;
}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, size, shape, status, ring, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        avatarVariants({ size, shape }),
        // Not overflow-hidden on the wrapper: the status dot sits on the edge
        // and would be clipped in half. The image clips itself instead.
        ring && "ring-2 ring-primary ring-offset-2 ring-offset-canvas",
        className
      )}
      {...props}
    >
      <span className={cn("flex size-full overflow-hidden", shape === "square" ? "rounded-lg" : "rounded-full")}>
        {children}
      </span>
      {status ? (
        <span className="absolute -bottom-px -right-px flex items-center justify-center">
          <span
            className={cn(
              "block size-3 rounded-full border-2 border-canvas",
              STATUS_COLOUR[status]
            )}
          />
          {/* A colour alone carries no meaning for anyone who cannot see it. */}
          <span className="sr-only">{status}</span>
        </span>
      ) : null}
    </span>
  )
);
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, alt, ...props }, ref) => {
  const [hasError, setHasError] = React.useState(false);

  if (hasError) return null;

  return (
    <img
      ref={ref}
      alt={alt}
      className={cn("aspect-square h-full w-full object-cover", className)}
      onError={() => setHasError(true)}
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      // Not bg-muted: that token is the hover surface every other component
      // uses, so a fallback avatar sitting on it read as permanently hovered.
      "flex h-full w-full items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";


export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** How many avatars to show before collapsing the rest into a count. */
  max?: number;
}

/**
 * Overlapping avatars with an overflow count.
 *
 * The count is rendered as a real element rather than a title attribute, so
 * "+2" is readable and announced like the faces it stands in for.
 */
const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, max = 3, children, ...props }, ref) => {
    const all = React.Children.toArray(children);
    const shown = all.slice(0, max);
    const rest = all.length - shown.length;

    return (
      <div ref={ref} className={cn("flex items-center", className)} {...props}>
        {shown.map((child, index) => (
          <span
            key={index}
            className="-ml-2.5 rounded-full ring-2 ring-canvas first:ml-0"
          >
            {child}
          </span>
        ))}
        {rest > 0 ? (
          <span className="-ml-2.5 flex size-10 items-center justify-center rounded-full bg-field text-xs font-semibold text-content-muted ring-2 ring-canvas">
            +{rest}
          </span>
        ) : null}
      </div>
    );
  }
);
AvatarGroup.displayName = "AvatarGroup";

export { Avatar, AvatarImage, AvatarFallback,
  AvatarGroup,
};
