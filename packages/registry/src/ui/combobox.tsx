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

/**
 * The props intersection is load-bearing, not defensive.
 *
 * `ComponentPropsWithoutRef<typeof ComboboxInput>` alone resolves against an
 * uninstantiated generic, and the result rejected every native input
 * attribute — `placeholder`, `id`, `name`, `autoComplete`, all of them. A
 * text input that cannot take a placeholder. Intersecting with
 * InputHTMLAttributes restores them without giving up the Headless UI props.
 */
export type ComboboxTriggerProps = React.ComponentPropsWithoutRef<
  typeof ComboboxInput
> &
  React.InputHTMLAttributes<HTMLInputElement>;

const ComboboxTrigger = React.forwardRef<HTMLInputElement, ComboboxTriggerProps>(
  ({ className, ...props }, ref) => (
  <div className="relative">
    <ComboboxInput
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-line-strong bg-canvas px-3 py-2 text-sm placeholder:text-content-muted focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
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


export interface ComboboxChipsProps {
  /** The current selection when `multiple` is set. */
  value?: string[] | null;
  /** How many chips to show before collapsing the rest into a count. */
  max?: number;
  className?: string;
}

/**
 * The current selection, drawn as chips above the input.
 *
 * Deliberately a near-copy of SelectValue rather than an import from
 * select.tsx: these files are installed one at a time, and `nika add combobox`
 * must not quietly drag in select. In a copy-into-your-project registry a
 * shared helper is a dependency the consumer never asked for — duplication is
 * the cheaper of the two costs.
 *
 * Renders nothing when empty, so an unselected combobox has no stray empty row
 * above it.
 */
const ComboboxChips = ({ value, max = 2, className }: ComboboxChipsProps) => {
  const values = value ?? [];
  if (!values.length) return null;

  const shown = values.slice(0, max);
  const rest = values.length - shown.length;

  return (
    <div className={cn("mb-1.5 flex flex-wrap items-center gap-1.5", className)}>
      {shown.map((item) => (
        <span
          key={item}
          className="inline-flex max-w-[10rem] items-center truncate rounded-full bg-field px-2 py-0.5 text-xs font-medium text-content"
        >
          {item}
        </span>
      ))}
      {rest > 0 ? (
        <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
          +{rest}
        </span>
      ) : null}
    </div>
  );
};
ComboboxChips.displayName = "ComboboxChips";

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

export { Combobox, ComboboxTrigger,
  ComboboxChips, ComboboxContent, ComboboxItem };
