"use client";

import * as React from "react";
import { cn } from "../lib/utils";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
  /**
   * Centres text between two rules — the "OR" divider between a form and a
   * social-login button, which is one of the most common uses and had to be
   * hand-built before.
   */
  label?: React.ReactNode;
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  (
    { className, orientation = "horizontal", decorative = true, label, ...props },
    ref
  ) => {
    if (label && orientation === "horizontal") {
      return (
        <div
          ref={ref}
          role={decorative ? "none" : "separator"}
          aria-orientation={decorative ? undefined : orientation}
          className={cn(
            "flex w-full items-center gap-3 text-xs font-semibold uppercase tracking-wider text-content-subtle",
            className
          )}
          {...props}
        >
          <span className="h-px flex-1 bg-line" />
          {label}
          <span className="h-px flex-1 bg-line" />
        </div>
      );
    }

    return (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        "shrink-0 bg-line",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
    );
  }
);
Separator.displayName = "Separator";

export { Separator };
