import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";

/**
 * The server cannot read `prefers-reduced-motion`; the client can, and Motion
 * reads it synchronously on the first render. Anything a component derives
 * from that read and then puts *into the markup* — a Motion `initial`, an
 * `animate` under `initial={false}`, a gated `animate-*` class — therefore
 * differs between the two renders, and React reports a hydration mismatch.
 *
 * These render on the server with the preference unreadable (as a real server
 * does) and hydrate with it set, which is exactly the pairing a
 * reduced-motion visitor produces. The assertion is React's own reconciler
 * complaint, not a snapshot of the markup, so any fix that makes the two
 * renders agree passes.
 *
 * Motion caches its reduced-motion state at MODULE scope, so mocking
 * window.matchMedia only takes effect for the first render in the file. Mock
 * the module and drive it from a hoisted, mutable flag instead — the same
 * strategy lib/motion.test.ts uses, and for the same reason.
 */
const mocks = vi.hoisted(() => ({ reducedMotion: false }));
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useReducedMotion: () => mocks.reducedMotion };
});

import { useReducedMotion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Progress } from "./progress";
import { Skeleton } from "./skeleton";
import { Spinner } from "./spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

/** `act` requires this flag. @testing-library/react sets it for the files
 *  that import it; this one hydrates by hand and does not. */
const actEnvironment = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };

let container: HTMLDivElement;

beforeEach(() => {
  actEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  container.remove();
  vi.restoreAllMocks();
  mocks.reducedMotion = false;
});

const isHydrationComplaint = (complaint: string) => /hydrat/i.test(complaint);

/**
 * Server-render without the preference, then hydrate with it. Returns the
 * complaints React made while reconciling that name a hydration problem.
 *
 * Everything else React said is deliberately *not* dropped. The spy swallows
 * every `console.error` for the duration of the hydrate, so an unrelated
 * React error — a bad prop, a failed invariant — would otherwise vanish
 * without a trace while the test still reported a clean `[]`. Non-hydration
 * complaints are re-emitted through the restored `console.error` instead, so
 * they reach whoever is running the suite.
 */
function hydrateUnderReducedMotion(element: React.ReactElement): string[] {
  mocks.reducedMotion = false;
  container.innerHTML = renderToString(element);

  mocks.reducedMotion = true;
  const complaints: string[] = [];
  const consoleError = vi
    .spyOn(console, "error")
    .mockImplementation((...args: unknown[]) => {
      complaints.push(args.map(String).join(" "));
    });

  act(() => {
    hydrateRoot(container, element, {
      onRecoverableError: (error) => complaints.push(String(error)),
    });
  });

  consoleError.mockRestore();

  for (const other of complaints.filter((c) => !isHydrationComplaint(c))) {
    console.error("hydration.test.tsx — unrelated React error while hydrating:", other);
  }

  return complaints.filter(isHydrationComplaint);
}

/**
 * A component that is *supposed* to fail: its rendered text is derived from
 * the reduced-motion preference, the exact thing the server cannot read.
 * It is the positive control for the harness above.
 *
 * Without it, every assertion in this file is of the form "expect no
 * complaints" — so if the `console.error` capture, the mock, or
 * `onRecoverableError` ever stopped working, all of them would pass forever
 * while testing nothing. This one proves the harness can still see a
 * mismatch when there genuinely is one.
 */
function DeliberateMismatch() {
  const prefersReducedMotion = useReducedMotion();
  return <div>{prefersReducedMotion ? "held still" : "in motion"}</div>;
}

describe("the harness can still see a mismatch when there is one", () => {
  it("catches a component whose markup depends on the preference", () => {
    expect(hydrateUnderReducedMotion(<DeliberateMismatch />).length).toBeGreaterThan(0);
  });
});

describe("server and first client render agree under reduced motion", () => {
  it("Card hydrates without a mismatch", () => {
    expect(
      hydrateUnderReducedMotion(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Body</CardContent>
        </Card>
      )
    ).toEqual([]);
  });

  it("TabsContent hydrates without a mismatch", () => {
    expect(
      hydrateUnderReducedMotion(
        <Tabs>
          <TabsList>
            <TabsTrigger>One</TabsTrigger>
          </TabsList>
          <TabsContent>Body</TabsContent>
        </Tabs>
      )
    ).toEqual([]);
  });

  it("Spinner hydrates without a mismatch", () => {
    expect(hydrateUnderReducedMotion(<Spinner />)).toEqual([]);
  });

  it("Skeleton hydrates without a mismatch", () => {
    expect(hydrateUnderReducedMotion(<Skeleton className="h-4" />)).toEqual([]);
  });

  it("an indeterminate Progress hydrates without a mismatch", () => {
    expect(hydrateUnderReducedMotion(<Progress />)).toEqual([]);
  });

  it("a determinate Progress hydrates without a mismatch", () => {
    expect(hydrateUnderReducedMotion(<Progress value={40} />)).toEqual([]);
  });
});

describe("the entrance still plays for a visitor who did not ask for stillness", () => {
  it("Card server-renders its from-state, so the animation has somewhere to come from", () => {
    mocks.reducedMotion = false;
    const html = renderToString(<Card>Body</Card>);
    expect(html).toContain("opacity:0");
    expect(html).toContain("translateY(15px)");
  });

  it("Card scales that from-state by the preset's travel", () => {
    mocks.reducedMotion = false;
    // snap travels 0.5 of the base 15px.
    expect(renderToString(<Card motion="snap">Body</Card>)).toContain(
      "translateY(7.5px)"
    );
  });

  it("Spinner keeps a spin class a normal-motion visitor's browser will run", () => {
    mocks.reducedMotion = false;
    expect(renderToString(<Spinner />)).toContain("animate-spin");
  });

  it("an indeterminate Progress server-renders its segment inside the track, not past the right edge", () => {
    mocks.reducedMotion = false;
    const html = renderToString(<Progress />);
    // `initial={false}` with a keyframe array does NOT mean "start at the
    // first keyframe". When the initial animation is blocked Motion takes
    // `valueTarget[valueTarget.length - 1]` (motion/utils/use-visual-state),
    // so `x: ["-100%", "300%"]` server-rendered as translateX(300%) — three
    // times the segment's own width, entirely outside an overflow-hidden
    // track. Every visitor who did not ask for reduced motion saw an empty
    // grey bar until Motion booted.
    //
    // Motion normalises a zero translate to the identity, so the correct
    // server markup is `transform:none` (or an explicit `translateX(0%)`);
    // either way the segment sits at the track's start. What must never
    // appear is the sweep's *end* keyframe.
    expect(html).not.toContain("300%");
    expect(html).toMatch(/style="transform:(none|translateX\(0%\))"/);
  });
});

describe("a visitor who asked for stillness gets it before hydration, not after", () => {
  it("Card carries the class that pins it to its resting state under reduced motion", () => {
    mocks.reducedMotion = true;
    const html = renderToString(<Card>Body</Card>);
    expect(html).toContain("motion-reduce:opacity-100!");
    expect(html).toContain("motion-reduce:transform-none!");
  });

  it("TabsContent carries it too", () => {
    mocks.reducedMotion = true;
    const html = renderToString(
      <Tabs>
        <TabsList>
          <TabsTrigger>One</TabsTrigger>
        </TabsList>
        <TabsContent>Body</TabsContent>
      </Tabs>
    );
    expect(html).toContain("motion-reduce:opacity-100!");
    expect(html).toContain("motion-reduce:transform-none!");
  });

  it("Spinner's spin is CSS-gated, so it never starts rather than stopping at hydration", () => {
    mocks.reducedMotion = true;
    expect(renderToString(<Spinner />)).toContain("motion-safe:animate-spin");
  });

  it("Skeleton's pulse is CSS-gated the same way", () => {
    mocks.reducedMotion = true;
    expect(renderToString(<Skeleton />)).toContain("motion-safe:animate-pulse");
  });

  it("an indeterminate Progress parks its segment at the track start", () => {
    mocks.reducedMotion = true;
    expect(renderToString(<Progress />)).toContain(
      "motion-reduce:transform-none!"
    );
  });
});

describe('an explicit motion="none" still removes the animation outright', () => {
  it("Card renders no from-state at all", () => {
    mocks.reducedMotion = false;
    const html = renderToString(<Card motion="none">Body</Card>);
    expect(html).not.toContain("opacity:0");
  });

  it("Spinner renders no spin class at all", () => {
    mocks.reducedMotion = false;
    expect(renderToString(<Spinner motion="none" />)).not.toContain(
      "animate-spin"
    );
  });

  it("Skeleton renders no pulse class at all", () => {
    mocks.reducedMotion = false;
    expect(renderToString(<Skeleton motion="none" />)).not.toContain(
      "animate-pulse"
    );
  });
});
