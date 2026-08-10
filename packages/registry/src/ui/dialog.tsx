"use client";

import * as React from "react";
import {
  Dialog as HeadlessDialog,
  DialogPanel,
  DialogTitle,
  DialogBackdrop,
  Description,
} from "@headlessui/react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

const Dialog = HeadlessDialog;

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogPanel> & {
    overlayClassName?: string;
  }
>(({ className, overlayClassName, children, ...props }, ref) => (
  <DialogBackdrop className={cn("fixed inset-0 z-50", overlayClassName)}>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50"
    />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <DialogPanel
        ref={ref}
        className={cn(
          "w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg",
          className
        )}
        {...props}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {children as React.ReactNode}
        </motion.div>
      </DialogPanel>
    </div>
  </DialogBackdrop>
));
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
    className={cn("text-sm text-muted-foreground", className)}
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
