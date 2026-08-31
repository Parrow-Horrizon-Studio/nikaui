"use client";

import * as React from "react";
import { NikaMotionConfig } from "@nikaui/registry/lib/motion";
import { previews } from "./component-previews";

const PRESETS = ["none", "snap", "glide", "spring", "bounce"] as const;
type Preset = (typeof PRESETS)[number];

/**
 * A live, interactive preview with a motion-preset switcher.
 *
 * D chartered "live previews for every component, with variant and
 * motion-preset switchers" and shipped fixed demos used only as inert
 * thumbnails on the index — component pages had no running component on them
 * at all, just code blocks.
 *
 * The motion switcher is the only place in the documentation where `none`,
 * `snap`, `glide`, `spring` and `bounce` can be *felt* rather than read about.
 * It works by wrapping the demo in the same provider a consumer would use,
 * so what the reader is trying is the real mechanism and not a simulation of
 * it.
 *
 * Remounting on change is deliberate: several presets only differ on entrance,
 * and without a remount you would switch from `snap` to `bounce` and see
 * nothing happen.
 */
export function PreviewWithSwitchers({ name }: { name: string }) {
  const [preset, setPreset] = React.useState<Preset>("spring");
  const [generation, setGeneration] = React.useState(0);
  const demo = previews[name];

  if (!demo) {
    throw new Error(
      `PreviewWithSwitchers: no preview registered for "${name}". ` +
        "Add one to component-previews.tsx — the index test requires a preview " +
        "for every documented component."
    );
  }

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-fd-border">
      <div
        data-testid="preview"
        data-motion={preset}
        className="flex min-h-[180px] items-center justify-center bg-fd-card p-8"
      >
        <NikaMotionConfig key={generation} preset={preset}>
          {demo}
        </NikaMotionConfig>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-fd-border bg-fd-muted/30 px-4 py-2.5">
        <span className="text-xs font-medium text-fd-muted-foreground">Motion</span>
        {PRESETS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={preset === option}
            onClick={() => {
              setPreset(option);
              setGeneration((n) => n + 1);
            }}
            className={
              preset === option
                ? "rounded-full bg-fd-primary px-2.5 py-1 text-xs font-semibold text-fd-primary-foreground"
                : "rounded-full px-2.5 py-1 text-xs text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground"
            }
          >
            {option}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setGeneration((n) => n + 1)}
          className="ml-auto rounded-full px-2.5 py-1 text-xs text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground"
        >
          Replay
        </button>
      </div>
    </div>
  );
}
