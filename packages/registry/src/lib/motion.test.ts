import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import * as React from "react";
import {
  motionPresets,
  NikaMotionConfig,
  useMotionPreset,
  type NikaMotionConfigProps,
} from "./motion";

// Motion caches its reduced-motion state at MODULE scope, so mocking
// window.matchMedia only takes effect for the first render in the file.
// Mock the module and drive it from a hoisted, mutable flag instead.
const mocks = vi.hoisted(() => ({ reducedMotion: false }));
vi.mock("motion/react", () => ({
  useReducedMotion: () => mocks.reducedMotion,
}));

beforeEach(() => {
  mocks.reducedMotion = false;
});

describe("motionPresets", () => {
  it("defines exactly the five documented presets", () => {
    expect(Object.keys(motionPresets)).toEqual([
      "none",
      "snap",
      "glide",
      "spring",
      "bounce",
    ]);
  });

  it("orders presets by descending damping, which is the whole scale", () => {
    const damping = (["snap", "glide", "spring", "bounce"] as const).map(
      (k) => (motionPresets[k].transition as { damping: number }).damping
    );
    expect(damping).toEqual([...damping].sort((a, b) => b - a));
  });

  it("orders travel multipliers the same way as the scale, ascending from snap to bounce", () => {
    const travel = (["snap", "glide", "spring", "bounce"] as const).map(
      (k) => motionPresets[k].travel
    );
    expect(travel).toEqual([...travel].sort((a, b) => a - b));
  });

  it("makes none a true no-op: no scale, no travel, and explicitly disabled", () => {
    expect(motionPresets.none.scale.hover).toBe(1);
    expect(motionPresets.none.scale.tap).toBe(1);
    expect(motionPresets.none.travel).toBe(0);
    expect(motionPresets.none.enabled).toBe(false);
  });

  it("enables every preset except none", () => {
    expect(motionPresets.none.enabled).toBe(false);
    for (const key of ["snap", "glide", "spring", "bounce"] as const) {
      expect(motionPresets[key].enabled).toBe(true);
    }
  });

  it("gives spring — the built-in default — a travel multiplier of exactly 1", () => {
    // A component multiplying its base travel distance by feel.travel must
    // render identically to before this field existed when the resolver
    // falls through to its built-in default.
    expect(motionPresets.spring.travel).toBe(1);
  });
});

describe("useMotionPreset resolution order", () => {
  it("falls back to spring when nothing is configured", () => {
    const { result } = renderHook(() => useMotionPreset("button"));
    expect(result.current).toEqual(motionPresets.spring);
  });

  it("prefers the instance prop over the built-in default", () => {
    const { result } = renderHook(() => useMotionPreset("button", "bounce"));
    expect(result.current).toEqual(motionPresets.bounce);
  });

  it("prefers a provider global default over the built-in default", () => {
    const { result } = renderHook(() => useMotionPreset("button"), {
      wrapper: ({ children }) => {
        const props: NikaMotionConfigProps = { preset: "glide", children };
        return React.createElement(NikaMotionConfig, props);
      },
    });
    expect(result.current).toEqual(motionPresets.glide);
  });

  it("prefers a provider per-component override over the provider default", () => {
    const { result } = renderHook(() => useMotionPreset("dialog"), {
      wrapper: ({ children }) => {
        const props: NikaMotionConfigProps = {
          preset: "glide",
          components: { dialog: "none" },
          children,
        };
        return React.createElement(NikaMotionConfig, props);
      },
    });
    expect(result.current).toEqual(motionPresets.none);
  });

  it("prefers the instance prop over a provider per-component override", () => {
    const { result } = renderHook(() => useMotionPreset("dialog", "bounce"), {
      wrapper: ({ children }) => {
        const props: NikaMotionConfigProps = {
          preset: "glide",
          components: { dialog: "none" },
          children,
        };
        return React.createElement(NikaMotionConfig, props);
      },
    });
    expect(result.current).toEqual(motionPresets.bounce);
  });

  it("lets a per-component override apply only to its own component", () => {
    const { result } = renderHook(() => useMotionPreset("button"), {
      wrapper: ({ children }) => {
        const props: NikaMotionConfigProps = {
          preset: "glide",
          components: { dialog: "none" },
          children,
        };
        return React.createElement(NikaMotionConfig, props);
      },
    });
    expect(result.current).toEqual(motionPresets.glide);
  });

  it("forces none under reduced motion, overriding an explicit prop", () => {
    mocks.reducedMotion = true;
    const { result } = renderHook(() => useMotionPreset("button", "bounce"));
    expect(result.current).toEqual(motionPresets.none);
  });

  it("forces none under reduced motion, overriding the provider", () => {
    mocks.reducedMotion = true;
    const { result } = renderHook(() => useMotionPreset("dialog"), {
      wrapper: ({ children }) => {
        const props: NikaMotionConfigProps = {
          preset: "bounce",
          components: { dialog: "bounce" },
          children,
        };
        return React.createElement(NikaMotionConfig, props);
      },
    });
    expect(result.current).toEqual(motionPresets.none);
  });
});
