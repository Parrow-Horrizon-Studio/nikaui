"use client";

import * as React from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { motion as m } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

const Accordion = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-1", className)} {...props} />
);

/**
 * `default` is the hairline-separated list. `card` gives each item its own
 * surface, which suits a short list of two or three and gives the chevron
 * somewhere to sit; the hairline list stays the default because it is what
 * long FAQ-style lists want.
 */
const accordionItemVariants = cva("", {
  variants: {
    variant: {
      default: "border-b border-line",
      card:
        "mb-1.5 overflow-hidden rounded-lg bg-field transition-colors duration-[var(--nika-duration)] ease-out hover:bg-field-hover",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface AccordionItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof accordionItemVariants> {}

const AccordionItem = ({ className, variant, ...props }: AccordionItemProps) => (
  <Disclosure
    as="div"
    className={cn(accordionItemVariants({ variant, className }))}
    {...props}
  />
);

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof DisclosureButton>
>(({ className, children, ...props }, ref) => (
  <DisclosureButton
    ref={ref}
    className={cn(
      // Hover tints the row rather than underlining the label. An underline on
      // hover reads as a link, and this is a button — it was the one styling
      // choice in the library that was a mistake rather than a preference.
      "-mx-2 flex w-full items-center justify-between rounded-md px-2 py-4 font-medium transition-colors duration-[var(--nika-duration)] ease-out hover:bg-field-hover [&[data-open]>svg]:rotate-180",
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
      className="h-4 w-4 shrink-0 transition-transform duration-200"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  </DisclosureButton>
));
AccordionTrigger.displayName = "AccordionTrigger";

export interface AccordionContentProps
  extends React.ComponentPropsWithoutRef<typeof DisclosurePanel> {
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("accordion", motionProp);

    return (
      <DisclosurePanel ref={ref} {...props}>
        <m.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={feel.transition}
          className="overflow-hidden"
        >
          <div className={cn("pb-4 pt-0 text-sm", className)}>{children as React.ReactNode}</div>
        </m.div>
      </DisclosurePanel>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
