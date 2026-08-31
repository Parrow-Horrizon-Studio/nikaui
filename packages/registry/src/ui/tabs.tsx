"use client";

import * as React from "react";
import { TabGroup, TabList, Tab, TabPanel } from "@headlessui/react";
import { motion as m } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import {
  useConfiguredMotion,
  useMotionPreset,
  type MotionPreset,
} from "../lib/motion";

const Tabs = TabGroup;

/**
 * One indicator element travels between triggers.
 *
 * Every trigger used to paint its own `data-[selected]:bg-canvas`, so nothing
 * moved — the highlight appeared somewhere else. Moving a single element is a
 * different mechanism, and it is what lets all four variants share one
 * implementation: only the indicator's shape and the list's chrome change.
 *
 * The measurement is a layout effect plus a MutationObserver, not a render
 * prop, because Headless UI flips `data-selected` on the Tab elements without
 * re-rendering this component — a plain effect on props would never fire.
 */
const listVariants = cva("text-content-muted", {
  variants: {
    variant: {
      segmented:
        "relative inline-flex h-10 items-center justify-center rounded-md bg-muted p-1",
      underline:
        "relative inline-flex h-10 items-center justify-start border-b border-line",
      vertical:
        "relative inline-flex h-auto flex-col items-stretch justify-start gap-1 rounded-md bg-muted p-1",
      // Edge fades signal that there is more to reach; the list stays
      // keyboard-reachable because Headless UI still owns arrow navigation.
      overflow:
        "relative flex h-10 items-center justify-start overflow-x-auto rounded-md bg-muted p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    },
  },
  defaultVariants: { variant: "segmented" },
});

const indicatorVariants = cva("pointer-events-none absolute z-0", {
  variants: {
    variant: {
      segmented: "rounded-sm bg-surface shadow-sm",
      underline: "rounded-full bg-primary",
      vertical: "rounded-sm bg-surface shadow-sm",
      overflow: "rounded-sm bg-surface shadow-sm",
    },
  },
  defaultVariants: { variant: "segmented" },
});

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabList>,
    VariantProps<typeof listVariants> {
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

interface IndicatorBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, variant, children, motion: motionProp, ...props }, ref) => {
    const configured = useConfiguredMotion("tabs", motionProp);
    const listRef = React.useRef<HTMLDivElement | null>(null);
    const [box, setBox] = React.useState<IndicatorBox | null>(null);

    React.useLayoutEffect(() => {
      const list = listRef.current;
      if (!list) return;

      const measure = () => {
        const selected = list.querySelector<HTMLElement>("[data-selected]");
        if (!selected) {
          setBox(null);
          return;
        }
        setBox({
          left: selected.offsetLeft,
          top: selected.offsetTop,
          width: selected.offsetWidth,
          height: selected.offsetHeight,
        });
        // Keep the active trigger reachable in the scrolling variant.
        // Guarded for the same reason as ResizeObserver below: jsdom does
        // not implement it, and scrolling the active trigger into view is an
        // enhancement the indicator does not depend on.
        if (variant === "overflow" && typeof selected.scrollIntoView === "function") {
          selected.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      };

      measure();
      // Headless UI toggles data-selected directly on the Tab nodes.
      const attributes = new MutationObserver(measure);
      attributes.observe(list, {
        subtree: true,
        attributes: true,
        attributeFilter: ["data-selected"],
      });
      // Feature-detected, not assumed: ResizeObserver is absent in jsdom and
      // in older browsers, and the indicator must still land correctly from
      // the initial measurement without it. Re-measuring on resize is an
      // enhancement, not a requirement.
      const resize =
        typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
      resize?.observe(list);
      return () => {
        attributes.disconnect();
        resize?.disconnect();
      };
    }, [variant]);

    const underline = variant === "underline";
    const vertical = variant === "vertical";

    // A width of 0 means "not measured yet" — jsdom never reports otherwise,
    // and in a browser it is the single frame before layout. Showing the
    // indicator at a wrong position would produce a jump on hydration, so it
    // stays invisible until it knows where to be.
    const measured = box !== null && box.width > 0;

    return (
      <TabList
        ref={(node: HTMLDivElement | null) => {
          listRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(listVariants({ variant }), className)}
        {...props}
      >
        <span
          data-tabs-indicator=""
          aria-hidden="true"
          className={cn(indicatorVariants({ variant }))}
          style={{
            opacity: measured ? 1 : 0,
            transform: `translate(${box?.left ?? 0}px, ${
              underline ? 0 : box?.top ?? 0
            }px)`,
            width: underline || !vertical ? box?.width ?? 0 : box?.width ?? 0,
            height: underline ? 2 : box?.height ?? 0,
            ...(underline ? { top: "auto", bottom: -1, left: 0 } : { top: 0, left: 0 }),
            transition: configured.enabled
              ? "transform var(--nika-duration-slow) var(--nika-ease-spring), width var(--nika-duration-slow) var(--nika-ease-spring), height var(--nika-duration-slow) var(--nika-ease-spring)"
              : undefined,
          }}
        />
        {children as React.ReactNode}
      </TabList>
    );
  }
);
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Tab>
>(({ className, ...props }, ref) => (
  <Tab
    ref={ref}
    className={cn(
      "relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-colors duration-[var(--nika-duration)] ease-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[selected]:font-semibold data-[selected]:text-content",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabPanel> {
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, children, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("tabs", motionProp);
    // The selected panel is server-rendered, so its from-state must not
    // depend on a preference only the client can read — see
    // useConfiguredMotion.
    const configured = useConfiguredMotion("tabs", motionProp);

    return (
      <TabPanel
        ref={ref}
        className={cn(
          "mt-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
          className
        )}
        {...props}
      >
        <m.div
          initial={
            configured.enabled
              ? { opacity: 0, y: 4 * configured.travel }
              : false
          }
          animate={{ opacity: 1, y: 0 }}
          transition={feel.transition}
          // Pins the panel to its resting state for a reduced-motion visitor
          // from the first paint. Overrides Motion's inline style, hence `!`.
          className="motion-reduce:opacity-100! motion-reduce:transform-none!"
        >
          {children as React.ReactNode}
        </m.div>
      </TabPanel>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
