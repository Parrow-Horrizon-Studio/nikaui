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

/** Server-render without the preference, then hydrate with it. Returns every
 *  complaint React made while reconciling. */
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
  return complaints.filter((c) => /hydrat/i.test(c));
}

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
