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

/** The bag Headless UI hands a ListboxButton render prop. */
export interface SelectTriggerRenderProps {
  /**
   * A string for a single select, an array when `multiple`. Typed concretely
   * rather than `unknown` so a render prop infers without a cast — an
   * `unknown` bag pushed the cast onto every call site.
   */
  value: string | string[] | null;
  open: boolean;
  disabled: boolean;
}

export type SelectTriggerProps = Omit<
  React.ComponentPropsWithoutRef<typeof ListboxButton>,
  "children"
> & {
  children?:
    | React.ReactNode
    | ((bag: SelectTriggerRenderProps) => React.ReactNode);
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <ListboxButton
      ref={ref}
      className={cn(
        "group flex h-10 w-full items-center justify-between gap-2 rounded-md border border-line-strong bg-canvas px-3 py-2 text-sm placeholder:text-content-muted focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {/*
        The render-prop form, always. Headless UI hands the button a bag
        carrying the current value, and that is the only way to draw the
        selection inside the trigger — which is what SelectValue needs to
        render chips for a multi-select. Passing `children` straight through
        alongside the chevron meant a function child was never called; React
        silently renders nothing for it.
      */}
      {(bag: SelectTriggerRenderProps) => (
        <>
          <span className="flex min-w-0 flex-1 items-center">
            {typeof children === "function"
              ? (children as (b: SelectTriggerRenderProps) => React.ReactNode)(bag)
              : (children as React.ReactNode)}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0 opacity-50 transition-transform duration-[var(--nika-duration)] ease-out group-data-[open]:rotate-180"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </>
      )}
    </ListboxButton>
  )
);
SelectTrigger.displayName = "SelectTrigger";


export interface SelectValueProps {
  /** The current selection: a string, or an array when `multiple`. */
  value?: string | string[] | null;
  placeholder?: React.ReactNode;
  /** How many chips to show before collapsing the rest into a count. */
  max?: number;
  className?: string;
}

/**
 * Renders whatever is currently selected inside the trigger.
 *
 * A single value is plain text. Several values become chips, because a
 * multi-select that prints `Design,Engineering,Marketing` as raw text is the
 * reason people stop using the component and write their own. Past `max` the
 * tail collapses to a count so the trigger cannot grow without bound.
 */
const SelectValue = ({ value, placeholder, max = 2, className }: SelectValueProps) => {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  if (!values.length) {
    return (
      <span className={cn("truncate text-content-muted", className)}>
        {placeholder}
      </span>
    );
  }

  if (!Array.isArray(value)) {
    return <span className={cn("truncate", className)}>{values[0]}</span>;
  }

  const shown = values.slice(0, max);
  const rest = values.length - shown.length;

  return (
    <span className={cn("flex min-w-0 flex-wrap items-center gap-1.5", className)}>
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
    </span>
  );
};
SelectValue.displayName = "SelectValue";

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
          "z-50 max-h-60 w-[var(--button-width)] origin-top overflow-auto rounded-lg border border-line bg-overlay p-1.5 text-content shadow-lg",
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
      "relative flex w-full cursor-pointer select-none items-center rounded-md py-[7px] pl-8 pr-2 text-sm outline-none transition-colors data-[focus]:bg-field-hover data-[focus]:text-content data-[selected]:bg-primary/12 data-[selected]:font-semibold data-[selected]:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
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

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
