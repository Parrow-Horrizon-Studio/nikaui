"use client";

import * as React from "react";
import { cn } from "../lib/utils";

/**
 * A slider built on a wrapper element rather than `input[type=range]`.
 *
 * The native element gives keyboard and ARIA behaviour for free, and this
 * component gave that up deliberately. It had to: there is no cross-browser
 * way to paint the portion of a range input left of its thumb, so the whole
 * rail was one flat colour and nothing showed where the value sat. A slider
 * that does not show its own value is missing information, not merely plain.
 *
 * The cost is that every key and every ARIA attribute below is hand-written,
 * and therefore hand-tested. See slider.test.tsx.
 */

export interface SliderProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "defaultValue" | "onChange"
  > {
  /** Controlled value. Omit for an uncontrolled slider. */
  value?: number;
  /** Starting value when uncontrolled. */
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** Fires with the next value. A controlled slider will not move without it. */
  onValueChange?: (value: number) => void;
}

/**
 * Clamp and quantise in one place.
 *
 * Every key handler and the pointer handler route through this, so "what is a
 * legal value" is answered once. Doing it per-handler is how a slider ends up
 * able to reach 100.0000001 with one key and not another.
 */
function normalise(raw: number, min: number, max: number, step: number): number {
  const clamped = Math.min(max, Math.max(min, raw));
  const steps = Math.round((clamped - min) / step);
  return Math.min(max, Math.round((min + steps * step) * 1e6) / 1e6);
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      className,
      value: controlled,
      defaultValue = 0,
      min = 0,
      max = 100,
      step = 1,
      disabled = false,
      onValueChange,
      ...props
    },
    ref
  ) => {
    const isControlled = controlled !== undefined;
    const [uncontrolled, setUncontrolled] = React.useState(() =>
      normalise(defaultValue, min, max, step)
    );
    const current = normalise(
      isControlled ? (controlled as number) : uncontrolled,
      min,
      max,
      step
    );

    const railRef = React.useRef<HTMLDivElement>(null);

    const commit = React.useCallback(
      (next: number) => {
        const normalised = normalise(next, min, max, step);
        if (normalised === current) return;
        // A controlled slider reports intent and waits for its parent; moving
        // itself as well would fight whatever the parent decides.
        if (!isControlled) setUncontrolled(normalised);
        onValueChange?.(normalised);
      },
      [current, isControlled, max, min, onValueChange, step]
    );

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      // PageUp/PageDown move a coarse jump — ten steps, the convention.
      const page = step * 10;
      const moves: Record<string, number | undefined> = {
        ArrowRight: current + step,
        ArrowUp: current + step,
        ArrowLeft: current - step,
        ArrowDown: current - step,
        PageUp: current + page,
        PageDown: current - page,
        Home: min,
        End: max,
      };
      const next = moves[event.key];
      if (next === undefined) return;
      event.preventDefault();
      commit(next);
    };

    const fromPointer = (clientX: number) => {
      const rail = railRef.current;
      if (!rail) return;
      const rect = rail.getBoundingClientRect();
      if (rect.width === 0) return;
      const ratio = (clientX - rect.left) / rect.width;
      commit(min + ratio * (max - min));
    };

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      fromPointer(event.clientX);
    };

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
      fromPointer(event.clientX);
    };

    const percent =
      max === min ? 0 : ((current - min) / (max - min)) * 100;

    return (
      <div
        ref={ref}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-valuenow={current}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-orientation="horizontal"
        aria-disabled={disabled || undefined}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        className={cn(
          // `group` so the ring below can land on the thumb rather than on
          // the full-width rail, the same way RadioGroup projects onto its dot.
          "group relative flex h-5 w-full touch-none items-center outline-none",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          "focus-visible:outline-none",
          className
        )}
        {...props}
      >
        <div
          ref={railRef}
          className="relative h-2 w-full rounded-full bg-indicator/40"
        >
          <div
            data-slider-fill=""
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            style={{ width: `${percent}%` }}
          />
          <div
            className={cn(
              "absolute top-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-surface shadow-sm transition-shadow",
              "group-focus-visible:ring-[3px] group-focus-visible:ring-ring"
            )}
            style={{ left: `${percent}%` }}
          />
        </div>
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
