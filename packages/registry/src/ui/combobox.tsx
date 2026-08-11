"use client";

import * as React from "react";
import {
  Combobox as HeadlessCombobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import { motion as m } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

const Combobox = HeadlessCombobox;

const ComboboxTrigger = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof ComboboxInput>
>(({ className, ...props }, ref) => (
  <div className="relative">
    <ComboboxInput
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-line-strong bg-canvas px-3 py-2 text-sm ring-offset-canvas placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
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
        <path d="m7 15 5 5 5-5" />
        <path d="m7 9 5-5 5 5" />
      </svg>
    </ComboboxButton>
  </div>
));
ComboboxTrigger.displayName = "ComboboxTrigger";

export interface ComboboxContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const ComboboxContent = React.forwardRef<HTMLDivElement, ComboboxContentProps>(
  ({ className, children, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("combobox", motionProp);

    return (
      <ComboboxOptions
        ref={ref}
        anchor="bottom start"
        className={cn(
          "z-50 max-h-60 w-[var(--input-width)] overflow-auto rounded-md border border-line bg-overlay p-1 text-content shadow-md empty:hidden",
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
      </ComboboxOptions>
    );
  }
);
ComboboxContent.displayName = "ComboboxContent";

const ComboboxItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ComboboxOption>
>(({ className, children, ...props }, ref) => (
  <ComboboxOption
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
  </ComboboxOption>
));
ComboboxItem.displayName = "ComboboxItem";

export { Combobox, ComboboxTrigger, ComboboxContent, ComboboxItem };
