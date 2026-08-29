"use client";

import * as React from "react";
import {
  Dialog as HeadlessDialog,
  DialogPanel,
  DialogTitle,
  DialogBackdrop,
  Description,
} from "@headlessui/react";
import { motion as m } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

const Dialog = HeadlessDialog;

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPanel> {
  overlayClassName?: string;
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, overlayClassName, children, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("dialog", motionProp);

    return (
      <DialogBackdrop className={cn("fixed inset-0 z-50", overlayClassName)}>
        {/*
          bg-scrim, not bg-black/50. A hard-coded scrim broke this repo's own
          "all colour comes from the token layer" rule, and could not retune:
          50% black over an already-dark canvas is far heavier than the same
          50% over a light one, so dark mode got a backdrop nobody chose.
        */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-scrim backdrop-blur-[3px]"
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel
            ref={ref}
            className={cn(
              "w-full max-w-lg rounded-xl border border-line bg-overlay p-6 shadow-lg",
              className
            )}
            {...props}
          >
            <m.div
              initial={{ opacity: 0, scale: feel.scale.tap, y: 10 * feel.travel }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: feel.scale.tap, y: 10 * feel.travel }}
              transition={feel.transition}
            >
              {children as React.ReactNode}
            </m.div>
          </DialogPanel>
        </div>
      </DialogBackdrop>
    );
  }
);
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
);

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4", className)}
    {...props}
  />
);

const DialogTitleComponent = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof DialogTitle>
>(({ className, ...props }, ref) => (
  <DialogTitle
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitleComponent.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof Description>
>(({ className, ...props }, ref) => (
  <Description
    ref={ref}
    className={cn("text-sm text-content-muted", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitleComponent as DialogTitle,
  DialogDescription,
};
