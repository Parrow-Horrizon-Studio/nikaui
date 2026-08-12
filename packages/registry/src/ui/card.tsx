"use client";

import * as React from "react";
import { motion as m, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";
import {
  useConfiguredMotion,
  useMotionPreset,
  type MotionPreset,
} from "../lib/motion";

export interface CardProps extends HTMLMotionProps<"div"> {
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("card", motionProp);
    // The from-state is server-rendered, so it must not depend on a
    // preference only the client can read — see useConfiguredMotion.
    const configured = useConfiguredMotion("card", motionProp);

    return (
      <m.div
        ref={ref}
        initial={
          configured.enabled ? { opacity: 0, y: 15 * configured.travel } : false
        }
        animate={{ opacity: 1, y: 0 }}
        transition={feel.transition}
        className={cn(
          "rounded-lg border border-line bg-surface text-content shadow-sm",
          // Pins the card to its resting state for a reduced-motion visitor
          // from the first paint, so the server-rendered from-state is never
          // the thing they see. Overrides Motion's inline style, hence `!`.
          //
          // KNOWN COST, documented in guide/animation.mdx: this pin lands on
          // the same element `className` styles, and `!` beats an unmarked
          // utility whatever the source order. So for a reduced-motion
          // visitor — and only for them — `<Card className="opacity-60">`
          // renders fully opaque and `<Card className="-translate-y-1">`
          // renders unshifted. Anyone not testing with the preference on
          // never sees it. TabsContent does not have this problem: its guard
          // sits on an internal wrapper the consumer cannot reach. Card
          // cannot copy that without adding a wrapper element to every card
          // in every consuming app, so the cost is documented instead of
          // hidden — reach for `motion="none"` plus your own styling when
          // you need a card whose resting state is not the default one.
          "motion-reduce:opacity-100! motion-reduce:transform-none!",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-content-muted", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
