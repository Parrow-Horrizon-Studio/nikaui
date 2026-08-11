"use client";

import * as React from "react";
import { TabGroup, TabList, Tab, TabPanel } from "@headlessui/react";
import { motion as m } from "motion/react";
import { cn } from "../lib/utils";
import {
  useConfiguredMotion,
  useMotionPreset,
  type MotionPreset,
} from "../lib/motion";

const Tabs = TabGroup;

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabList>
>(({ className, ...props }, ref) => (
  <TabList
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-content-muted",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Tab>
>(({ className, ...props }, ref) => (
  <Tab
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-canvas transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[selected]:bg-canvas data-[selected]:text-content data-[selected]:shadow-sm",
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
          "mt-2 ring-offset-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
