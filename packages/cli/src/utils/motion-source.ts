import type { MotionPreset } from "./config.js";

/**
 * Every site in `lib/motion.ts` that spells out the built-in default preset.
 *
 * Two of them are behaviour:
 *
 *   - `useConfiguredMotion`'s final fallback, used when no provider is
 *     mounted at all. It lives there, not in `useMotionPreset`, because
 *     `useMotionPreset` now delegates the whole configured-preset lookup to
 *     it and only layers the visitor's reduced-motion preference on top;
 *   - `NikaMotionConfig`'s own `preset` default, used when a provider *is*
 *     mounted but given no `preset` prop.
 *
 * Both have to move together. Rewriting only the resolver would leave anyone
 * who wraps their app in a bare `<NikaMotionConfig>` back on `spring`, which
 * is the same silent override the config field suffered from.
 *
 * The third is the precedence list in `useMotionPreset`'s doc comment. It is
 * not behaviour, but a copied file whose documentation contradicts its code
 * is worse than one with no documentation.
 */
const ANCHORS = [
  { find: "return motionPresets.spring;", make: (p: string) => `return motionPresets.${p};` },
  { find: `  preset = "spring",`, make: (p: string) => `  preset = "${p}",` },
  { find: `→ "spring"`, make: (p: string) => `→ "${p}"` },
] as const;

/**
 * Bake the preset chosen at `init` into the `lib/motion.ts` source the
 * consumer receives.
 *
 * `nika.config.ts` records the choice, but nothing reads that file at
 * runtime — the components import the resolver directly, and the resolver
 * ends in a hard-coded default. Since the consumer owns every file the CLI
 * writes, the choice belongs in the source itself; a config field the
 * runtime never consults is worse than no field at all.
 *
 * Each anchor must appear **exactly once**. If the registry's motion module
 * is reshaped so an anchor no longer matches — or matches twice — this
 * throws rather than writing a file that quietly ignores the user's answer.
 * Silently writing the unmodified source is precisely the failure mode this
 * function exists to remove, so it must never be the outcome of a mismatch.
 */
export function applyMotionPreset(
  source: string,
  preset: MotionPreset
): string {
  let out = source;

  for (const anchor of ANCHORS) {
    const occurrences = out.split(anchor.find).length - 1;
    if (occurrences !== 1) {
      throw new Error(
        `Cannot apply the "${preset}" motion preset: expected exactly one ` +
          `occurrence of ${JSON.stringify(anchor.find)} in lib/motion.ts, ` +
          `found ${occurrences}. The registry's motion module has changed ` +
          `shape; update packages/cli/src/utils/motion-source.ts to match.`
      );
    }
    out = out.replace(anchor.find, anchor.make(preset));
  }

  return out;
}
