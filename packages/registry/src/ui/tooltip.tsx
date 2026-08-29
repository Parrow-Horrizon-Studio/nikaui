"use client";

import * as React from "react";
import { AnimatePresence, motion as m } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltip() {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error("Tooltip components must be used within <Tooltip>");
  return context;
}

function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement>(null);

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-flex">{children}</div>
    </TooltipContext.Provider>
  );
}

const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => {
  const { setOpen, triggerRef } = useTooltip();

  return (
    <button
      ref={(node) => {
        (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      {...props}
    >
      {children}
    </button>
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

/**
 * A tooltip inverts against the page: dark bubble on a light theme, light
 * bubble on a dark one.
 *
 * Before this, a tooltip was `bg-overlay` + `border-line` + `text-content` —
 * pixel-identical to a Popover. Two components with different jobs and the
 * same appearance, so nothing but position told a reader which one they were
 * looking at.
 *
 * `variant="surface"` opts out. It is a prop rather than a documented
 * `className` override because the arrow below is a CSS border triangle whose
 * coloured edge has to change with the surface — a class on the bubble cannot
 * reach it, so an override would produce a bubble in one colour and an arrow
 * still in the other.
 *
 * Known limitation of the `surface` variant: its bubble has a 1px border and
 * the arrow does not, so the arrow's edges are unbordered. Drawing that
 * properly needs two stacked triangles. Left as-is deliberately — it is an
 * opt-out variant and the seam is 5px long.
 */
const ARROW_POSITION = {
  top: "top-full left-1/2 -ml-[5px] border-x-[5px] border-t-[5px] border-x-transparent",
  bottom: "bottom-full left-1/2 -ml-[5px] border-x-[5px] border-b-[5px] border-x-transparent",
  left: "left-full top-1/2 -mt-[5px] border-y-[5px] border-l-[5px] border-y-transparent",
  right: "right-full top-1/2 -mt-[5px] border-y-[5px] border-r-[5px] border-y-transparent",
} as const;

const ARROW_COLOUR = {
  default: {
    top: "border-t-inverse",
    bottom: "border-b-inverse",
    left: "border-l-inverse",
    right: "border-r-inverse",
  },
  surface: {
    top: "border-t-overlay",
    bottom: "border-b-overlay",
    left: "border-l-overlay",
    right: "border-r-overlay",
  },
} as const;

function TooltipContent({
  children,
  className,
  side,
  placement = "top",
  variant = "default",
  motion: motionProp,
}: {
  children: React.ReactNode;
  className?: string;
  /** @deprecated Use `placement`, which is the name Popover uses too. */
  side?: "top" | "bottom" | "left" | "right";
  placement?: "top" | "bottom" | "left" | "right";
  /** "surface" opts out of the inversion — see the note above ARROW_POSITION. */
  variant?: "default" | "surface";
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}) {
  // `side` kept working so existing call sites do not break silently.
  const resolved = side ?? placement;
  const { open } = useTooltip();
  const feel = useMotionPreset("tooltip", motionProp);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const motionOrigin = {
    top: { y: 4 * feel.travel },
    bottom: { y: -4 * feel.travel },
    left: { x: 4 * feel.travel },
    right: { x: -4 * feel.travel },
  };

  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0, ...motionOrigin[resolved] }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, ...motionOrigin[resolved] }}
          transition={feel.transition}
          className={cn(
            "absolute z-50 overflow-visible rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap",
            variant === "surface"
              ? "border border-line bg-overlay text-content shadow-md"
              : "bg-inverse text-inverse-content shadow-lg",
            positionClasses[resolved],
            className
          )}
          role="tooltip"
          data-placement={resolved}
        >
          {children}
          <span
            aria-hidden="true"
            data-tooltip-arrow=""
            className={cn("absolute", ARROW_POSITION[resolved], ARROW_COLOUR[variant][resolved])}
          />
        </m.div>
      )}
    </AnimatePresence>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent };
