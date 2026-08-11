"use client";

import * as React from "react";
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  MenuSeparator,
} from "@headlessui/react";
import { motion as m } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

const DropdownMenu = Menu;

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof MenuButton>
>(({ className, ...props }, ref) => (
  <MenuButton ref={ref} className={cn(className)} {...props} />
));
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

export interface DropdownMenuContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end";
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = "start", children, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("dropdown-menu", motionProp);

    return (
      <MenuItems
        ref={ref}
        anchor={align === "end" ? "bottom end" : "bottom start"}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border border-line bg-overlay p-1 text-content shadow-md",
          className
        )}
        {...props}
      >
        <m.div
          initial={{ opacity: 0, scale: feel.scale.tap }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: feel.scale.tap }}
          transition={feel.transition}
        >
          {children as React.ReactNode}
        </m.div>
      </MenuItems>
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof MenuItem> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenuItem
    ref={ref}
    as="button"
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[focus]:bg-muted data-[focus]:text-content data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof MenuSeparator>
>(({ className, ...props }, ref) => (
  <MenuSeparator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-line", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuLabel = ({
  className,
  inset,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) => (
  <div
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
);

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
