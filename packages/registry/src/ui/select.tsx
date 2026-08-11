"use client";

import * as React from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import { motion as m } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

const Select = Listbox;

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof ListboxButton>
>(({ className, children, ...props }, ref) => (
  <ListboxButton
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-line-strong bg-canvas px-3 py-2 text-sm ring-offset-canvas placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children as React.ReactNode}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 opacity-50"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  </ListboxButton>
));
SelectTrigger.displayName = "SelectTrigger";

export interface SelectContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("select", motionProp);

    return (
      <ListboxOptions
        ref={ref}
        anchor="bottom start"
        className={cn(
          "z-50 max-h-60 w-[var(--button-width)] overflow-auto rounded-md border border-line bg-overlay p-1 text-content shadow-md",
          className
        )}
        {...props}
      >
        <m.div
          initial={{ opacity: 0, y: -4 * feel.travel }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 * feel.travel }}
          transition={feel.transition}
        >
          {children as React.ReactNode}
        </m.div>
      </ListboxOptions>
    );
  }
);
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ListboxOption>
>(({ className, children, ...props }, ref) => (
  <ListboxOption
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[focus]:bg-muted data-[focus]:text-content data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {({ selected }) => (
      <>
        {selected && (
          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        )}
        {children}
      </>
    )}
  </ListboxOption>
));
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectContent, SelectItem };
