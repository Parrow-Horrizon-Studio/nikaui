"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Label } from "./label";

/**
 * Ties a control to its label, description and error.
 *
 * The visible half of an error state is the easy half and nearly worthless on
 * its own: a red border tells a sighted user something is wrong and tells a
 * screen reader nothing at all. What matters is `aria-invalid` on the control
 * and an `aria-describedby` that resolves to the message element — a
 * relationship no consumer should have to wire by hand, and one that is
 * quietly wrong in most applications that do.
 *
 * Field clones its child to attach those attributes rather than requiring a
 * particular component, so it works with Input, Textarea, Select, or anything
 * else that forwards props to a form element.
 */
export interface FieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label?: React.ReactNode;
  /** Help text. Announced only when there is no error to announce instead. */
  description?: React.ReactNode;
  /** Presence marks the field invalid; the text becomes its description. */
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactElement;
}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ className, label, description, error, required, children, ...props }, ref) => {
    const id = React.useId();
    const controlId = `${id}-control`;
    const describedById = `${id}-described`;
    const invalid = Boolean(error);

    // The error wins when both are present. Announcing the hint first buries
    // the failure behind advice the user has already failed to follow.
    const message = error ?? description;

    const control = React.cloneElement(
      children,
      {
        id: controlId,
        "aria-invalid": invalid || undefined,
        "aria-required": required || undefined,
        "aria-describedby": message ? describedById : undefined,
        invalid: invalid || undefined,
      } as Record<string, unknown>
    );

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {label ? (
          <Label htmlFor={controlId}>
            {label}
            {required ? (
              <span className="ml-0.5 text-danger" aria-hidden="true">
                *
              </span>
            ) : null}
          </Label>
        ) : null}
        {control}
        {message ? (
          <p
            id={describedById}
            className={cn(
              "mt-1.5 text-xs",
              invalid ? "font-medium text-danger" : "text-content-subtle"
            )}
          >
            {message}
          </p>
        ) : null}
      </div>
    );
  }
);
Field.displayName = "Field";

export { Field };
