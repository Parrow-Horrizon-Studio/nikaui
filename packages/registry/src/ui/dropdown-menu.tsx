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
          "z-50 min-w-[8rem] origin-top-left overflow-hidden rounded-lg border border-line bg-overlay p-1.5 text-content shadow-lg",
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

export type DropdownMenuItemProps = React.ComponentPropsWithoutRef<
  typeof MenuItem
> & {
  inset?: boolean;
  /** Leading icon. Positioned by the item, so every menu aligns the same way. */
  icon?: React.ReactNode;
  /** Trailing keyboard hint, e.g. `⇧⌘P`. */
  shortcut?: React.ReactNode;
  /** Secondary line beneath the label. */
  description?: React.ReactNode;
  /** Destructive actions read in the danger colour and tint danger on hover. */
  destructive?: boolean;
};

/**
 * The four slots a real menu item needs.
 *
 * This took children and nothing else, so an icon, a shortcut hint, a
 * secondary description and a destructive action were each laid out by hand
 * in the consuming app — and therefore laid out differently in every app.
 * Putting them here is what makes two menus in two codebases line up.
 */
const DropdownMenuItem = React.forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  (
    { className, inset, icon, shortcut, description, destructive, children, ...props },
    ref
  ) => (
    <MenuItem
      ref={ref}
      as="button"
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-[7px] text-left text-sm outline-none transition-colors data-[focus]:bg-field-hover data-[focus]:text-content data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        destructive &&
          "text-danger data-[focus]:bg-danger/12 data-[focus]:text-danger",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {icon ? (
        <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{children as React.ReactNode}</span>
        {description ? (
          <span
            className={cn(
              "truncate text-xs",
              destructive ? "text-danger/70" : "text-content-subtle"
            )}
          >
            {description}
          </span>
        ) : null}
      </span>
      {shortcut ? (
        <span className="ml-auto shrink-0 font-mono text-[11px] text-content-subtle">
          {shortcut}
        </span>
      ) : null}
    </MenuItem>
  )
);
DropdownMenuItem.displayName = "DropdownMenuItem";

export interface DropdownMenuGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Visible heading. Also becomes the group's accessible name. */
  label?: React.ReactNode;
}

/**
 * A labelled group.
 *
 * DropdownMenuLabel already existed and was undocumented, but it only
 * labelled *visually* — nothing tied it to the items beneath it, so assistive
 * technology heard a stray line of text rather than a heading for what
 * followed. The accessible name is taken from the visible heading via
 * aria-labelledby rather than duplicated into an aria-label, which would be
 * free to drift away from what is on screen.
 */
const DropdownMenuGroup = React.forwardRef<HTMLDivElement, DropdownMenuGroupProps>(
  ({ className, label, children, ...props }, ref) => {
    const labelId = React.useId();
    return (
      <div
        ref={ref}
        role="group"
        aria-labelledby={label ? labelId : undefined}
        className={cn("py-0.5", className)}
        {...props}
      >
        {label ? (
          <div
            id={labelId}
            className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-content-subtle"
          >
            {label}
          </div>
        ) : null}
        {children}
      </div>
    );
  }
);
DropdownMenuGroup.displayName = "DropdownMenuGroup";

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
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
