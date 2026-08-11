"use client";
// State (the replay generation) lives here, so this is a client boundary
// the same way hero-window.tsx is — not because of anything Card or
// NikaMotionConfig themselves require.

import * as React from "react";
import Link from "next/link";
import { NikaMotionConfig, type MotionPreset } from "@nikaui/registry/lib/motion";
import { Badge } from "@nikaui/registry/ui/badge";
import { Button } from "@nikaui/registry/ui/button";
import { Card } from "@nikaui/registry/ui/card";

/**
 * The shipped order, read from `packages/registry/src/lib/motion.ts`. The
 * prototype's list was `bounce, pop, glide, snap, none` — `pop` does not
 * exist as a preset, and `spring`, the built-in default every component
 * falls back to, was missing entirely. This is the real five.
 */
const PRESETS: readonly MotionPreset[] = ["none", "snap", "glide", "spring", "bounce"];

/**
 * `Card`'s entrance ties two things to one preset name: the spring
 * configuration (stiffness/damping) governs how it settles, and the
 * preset's `travel` multiplier governs how far it comes from. Remounting a
 * tile — a new `key` on its `NikaMotionConfig` — is what replays that
 * entrance; there is no imperative "play" API to call instead.
 *
 * A visitor with `prefers-reduced-motion: reduce` will see Replay do
 * nothing to any tile, `none` included. That is `Card`'s own CSS guard
 * (`motion-reduce:opacity-100! motion-reduce:transform-none!` in
 * `ui/card.tsx`) doing exactly its job — the entrance is pinned before this
 * component ever mounts, and remounting it changes nothing about that. This
 * file does not read the reduced-motion preference itself; the guard it
 * relies on already lives in `Card`.
 */
export function MotionShowcase() {
  const [generation, setGeneration] = React.useState(0);

  return (
    <section id="motion" className="mx-auto w-full max-w-[1400px] px-6 py-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            The signature
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-content sm:text-4xl">
            Motion presets, not motion homework
          </h2>
          <p className="mt-4 text-balance text-lg text-content-muted">
            Components should stretch and spring. Five named curves are baked into the system, so
            you get tasteful physics without touching a keyframe.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Motion presets">
            {PRESETS.map((preset) => (
              <li key={preset}>
                <Badge variant="secondary" className="capitalize">
                  {preset}
                </Badge>
              </li>
            ))}
          </ul>

          <Link
            href="/docs/guide/animation"
            className="mt-6 inline-flex items-center rounded-sm text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            Explore presets
          </Link>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-4">
            {PRESETS.map((preset) => (
              <NikaMotionConfig key={`${preset}-${generation}`} preset={preset}>
                <Card
                  data-preset={preset}
                  className="flex h-28 items-center justify-center p-6"
                >
                  <span className="text-sm font-medium capitalize">{preset}</span>
                </Card>
              </NikaMotionConfig>
            ))}
          </div>

          <Button
            variant="outline"
            className="mt-6"
            onClick={() => setGeneration((g) => g + 1)}
          >
            Replay
          </Button>
        </div>
      </div>
    </section>
  );
}
