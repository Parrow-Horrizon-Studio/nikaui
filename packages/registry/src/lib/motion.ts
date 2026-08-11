"use client";

import * as React from "react";
import { useReducedMotion, type Transition } from "motion/react";

/**
 * A preset is a *feel*, not an animation.
 *
 * Each component decides what it animates — a Button scales on hover, a
 * Dialog fades and lifts on enter, an Accordion animates height. The preset
 * decides how any of that feels: a spring configuration, a travel
 * multiplier, and a scale multiplier. That is what lets one name stay
 * coherent across components that animate entirely different properties.
 *
 * `enabled` is the explicit "should this animate at all" bit. `none` needs
 * it because `transition: { duration: 0 }` alone does not mean "off" — a
 * component that also sets `repeat: Infinity` (a continuous loop, not an
 * enter/exit) combines with a zero duration into a loop that never settles.
 * Components with a `repeat` must branch on `feel.enabled` and render a
 * static state instead of animating with a zero-length transition.
 *
 * `travel` is the distance multiplier for components that translate on
 * enter/exit (a Dialog lifting, a Popover dropping in). Each component keeps
 * its own base distance and direction (`y: 10`, `y: -4`, …) and multiplies
 * it by `feel.travel`, the same way `feel.scale.hover` / `feel.scale.tap`
 * scale a hover/tap transform. `travel: 0` under `none` collapses entrance
 * travel to nothing, which is the correct reduced-motion behaviour.
 *
 * The scale and travel columns are both ordered by descending damping: snap
 * and glide are the smallest and tightest, spring is the built-in default,
 * bounce is the largest and loosest.
 */
export const motionPresets = {
  none: {
    transition: { duration: 0 } as Transition,
    scale: { hover: 1, tap: 1 },
    travel: 0,
    enabled: false,
  },
  snap: {
    transition: { type: "spring", stiffness: 700, damping: 40 } as Transition,
    scale: { hover: 1.01, tap: 0.99 },
    travel: 0.5,
    enabled: true,
  },
  glide: {
    transition: { type: "spring", stiffness: 220, damping: 32 } as Transition,
    scale: { hover: 1.02, tap: 0.98 },
    travel: 0.8,
    enabled: true,
  },
  spring: {
    transition: { type: "spring", stiffness: 420, damping: 22 } as Transition,
    scale: { hover: 1.03, tap: 0.97 },
    travel: 1,
    enabled: true,
  },
  bounce: {
    transition: { type: "spring", stiffness: 520, damping: 13 } as Transition,
    scale: { hover: 1.05, tap: 0.94 },
    travel: 1.4,
    enabled: true,
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
  children: React.ReactNode;
}

/**
 * Optional. Components land in repositories where nobody wrapped the app;
 * without this provider they fall through to the built-in default below and
 * still work. That is a hard requirement of copy-paste distribution, not a
 * convenience.
 *
 * `nikaui init` rewrites the built-in default — both here and in
 * `useMotionPreset` — to the preset chosen at setup, so this file is the one
 * place that decides how an un-wrapped app feels.
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
