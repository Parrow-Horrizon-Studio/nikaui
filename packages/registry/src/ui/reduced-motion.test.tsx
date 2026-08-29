import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NikaMotionConfig } from "../lib/motion";
import { Spinner } from "./spinner";
import { Skeleton } from "./skeleton";

/**
 * Spinner and Skeleton animate with Tailwind keyframe classes rather than a
 * Motion element. That makes them the two components where the motion
 * resolver can be wired up and still reach nothing: `animate-spin` and
 * `nika-shimmer` keep running whatever `useMotionPreset` returns, unless
 * the component gates the class itself.
 *
 * It has already gone wrong once — a commit titled "close the reduced-motion
 * gap in spinner" fixed LoadingDots and left `Spinner` twelve lines above it
 * still spinning. These assert the gate, not the plumbing.
 */
describe("keyframe animations obey the motion resolver", () => {
  it("Spinner spins by default", () => {
    const { container } = render(<Spinner />);
    // motion-safe:, not a bare animate-spin — the visitor's half of the gate
    // is CSS, because this class list is server-rendered. See
    // useConfiguredMotion and ui/hydration.test.tsx.
    expect(container.querySelector("svg")!.className.baseVal).toContain(
      "motion-safe:animate-spin"
    );
  });

  it("Spinner stops when the instance prop says none", () => {
    const { container } = render(<Spinner motion="none" />);
    expect(container.querySelector("svg")!.className.baseVal).not.toContain(
      "animate-spin"
    );
  });

  it("Spinner stops under a provider set to none", () => {
    const { container } = render(
      <NikaMotionConfig preset="none">
        <Spinner />
      </NikaMotionConfig>
    );
    expect(container.querySelector("svg")!.className.baseVal).not.toContain(
      "animate-spin"
    );
  });

  it("Spinner stops under a per-component provider override", () => {
    const { container } = render(
      <NikaMotionConfig components={{ spinner: "none" }}>
        <Spinner />
      </NikaMotionConfig>
    );
    expect(container.querySelector("svg")!.className.baseVal).not.toContain(
      "animate-spin"
    );
  });

  it("Skeleton sweeps by default", () => {
    const { container } = render(<Skeleton data-testid="s" />);
    expect(container.firstElementChild!.className).toContain(
      "motion-safe:after:animate-[nika-shimmer_1.6s_ease-out_infinite]"
    );
  });

  it("Skeleton stops when the instance prop says none", () => {
    const { container } = render(<Skeleton motion="none" />);
    expect(container.firstElementChild!.className).not.toContain(
      "nika-shimmer"
    );
  });

  it("Skeleton stops under a provider set to none", () => {
    const { container } = render(
      <NikaMotionConfig preset="none">
        <Skeleton />
      </NikaMotionConfig>
    );
    expect(container.firstElementChild!.className).not.toContain(
      "nika-shimmer"
    );
  });

  it("Skeleton keeps its non-motion classes when the animation is off", () => {
    const { container } = render(<Skeleton motion="none" className="h-4" />);
    const cls = container.firstElementChild!.className;
    expect(cls).toContain("bg-muted");
    expect(cls).toContain("rounded-md");
    expect(cls).toContain("h-4");
  });
});
