"use client";

import * as React from "react";
import { AnimatePresence, motion as m, useReducedMotion } from "motion/react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";
import { useMotionPreset, motionPresets, type MotionPreset } from "../lib/motion";

const toastVariants = cva(
  "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "border border-line bg-canvas text-content",
        destructive: "border-danger bg-danger text-danger-fg",
        success: "border-success/50 bg-success/10 text-success",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within <ToastProvider>");
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

function ToastViewport() {
  const { toasts, removeToast } = useToast();
  // Resolves reduced-motion + provider config + fallback once, unconditionally,
  // so per-toast overrides below can be applied without calling a hook inside
  // the .map() — the toasts array grows and shrinks across renders, and
  // useMotionPreset relies on useContext/useReducedMotion, which cannot be
  // called a variable number of times per render.
  const defaultFeel = useMotionPreset("toast");
  const prefersReduced = useReducedMotion();

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const feel = prefersReduced
            ? motionPresets.none
            : toast.motion
              ? motionPresets[toast.motion]
              : defaultFeel;

          return (
            <m.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: feel.scale.tap }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: feel.scale.tap }}
              transition={feel.transition}
              className={cn(toastVariants({ variant: toast.variant }))}
            >
              <div className="flex-1">
                {toast.title && (
                  <div className="text-sm font-semibold">{toast.title}</div>
                )}
                {toast.description && (
                  <div className="text-sm opacity-90">{toast.description}</div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="inline-flex shrink-0 items-center justify-center rounded-md h-6 w-6 text-content-subtle hover:text-content transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </m.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export { toastVariants };
