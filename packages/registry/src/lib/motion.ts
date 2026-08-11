"use client";

import * as React from "react";
import { useReducedMotion, type Transition } from "motion/react";

/**
 * A preset is a *feel*, not an animation.
 *
 * Each component decides what it animates — a Button scales on hover, a
 * Dialog fades and lifts on enter, an Accordion animates height. The preset
 * decides how any of that feels: a spring configuration plus a travel
 * multiplier. That is what lets one name stay coherent across components
 * that animate entirely different properties.
 *
 * The scale is ordered by descending damping: snap and glide never
 * overshoot, spring overshoots slightly, bounce pronouncedly.
 */
export const motionPresets = {
  none: {
    transition: { duration: 0 } as Transition,
    scale: { hover: 1, tap: 1 },
  },
  snap: {
    transition: { type: "spring", stiffness: 700, damping: 40 } as Transition,
    scale: { hover: 1.01, tap: 0.99 },
  },
  glide: {
    transition: { type: "spring", stiffness: 220, damping: 32 } as Transition,
    scale: { hover: 1.02, tap: 0.98 },
  },
  spring: {
    transition: { type: "spring", stiffness: 420, damping: 22 } as Transition,
    scale: { hover: 1.03, tap: 0.97 },
  },
  bounce: {
    transition: { type: "spring", stiffness: 520, damping: 13 } as Transition,
    scale: { hover: 1.05, tap: 0.94 },
  },
} as const;

export type MotionPreset = keyof typeof motionPresets;
export type MotionFeel = (typeof motionPresets)[MotionPreset];
export type NikaComponent = string;

interface MotionContextValue {
  preset: MotionPreset;
  components: Partial<Record<NikaComponent, MotionPreset>>;
}

const MotionContext = React.createContext<MotionContextValue | null>(null);

export interface NikaMotionConfigProps {
  /** Global default for every component beneath this provider. */
  preset?: MotionPreset;
  /** Per-component overrides, keyed by component name — e.g. { dialog: "none" }. */
  components?: Partial<Record<NikaComponent, MotionPreset>>;
  /**
   * Optional at the type level only so `React.createElement` calls (used by
   * the .ts test file, which cannot contain JSX) type-check without
   * threading children through the props object. JSX consumers pass
   * children the normal way and are unaffected.
   */
  children?: React.ReactNode;
}

/**
 * Optional. Components land in repositories where nobody wrapped the app;
 * without this provider they fall through to the built-in `spring` default
 * and animate normally. That is a hard requirement of copy-paste
 * distribution, not a convenience.
 */
export function NikaMotionConfig({
  preset = "spring",
  components,
  children,
}: NikaMotionConfigProps) {
  const value = React.useMemo(
    () => ({ preset, components: components ?? {} }),
    [preset, components]
  );
  return React.createElement(MotionContext.Provider, { value }, children);
}

/**
 * Resolve the feel for one component instance.
 *
 * Most specific wins:
 *   1. prefers-reduced-motion: reduce  → forced `none`
 *   2. instance prop                   → <Button motion="bounce">
 *   3. provider per-component override → components={{ dialog: "none" }}
 *   4. provider global default         → preset="glide"
 *   5. built-in default                → "spring"
 *
 * Reduced motion sits above an explicit prop on purpose. A library selling
 * itself on animation is the one that has to get this right.
 */
export function useMotionPreset(
  component: NikaComponent,
  prop?: MotionPreset
): MotionFeel {
  const ctx = React.useContext(MotionContext);
  const prefersReduced = useReducedMotion();

  if (prefersReduced) return motionPresets.none;
  if (prop) return motionPresets[prop];
  if (ctx?.components?.[component]) {
    return motionPresets[ctx.components[component]!];
  }
  if (ctx?.preset) return motionPresets[ctx.preset];
  return motionPresets.spring;
}
