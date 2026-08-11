import fs from "fs-extra";
import path from "path";

/**
 * The single source of truth for the preset vocabulary.
 *
 * The union type, the config parser's regex and `init`'s prompt choices are
 * all derived from this array, so there is exactly one place to edit when a
 * preset is added or removed. Previously all three were written out by hand
 * and could drift apart silently — a preset present in the union but missing
 * from the regex would parse as the default with no error.
 *
 * Order here is the vocabulary's own (ascending liveliness), not the order
 * the prompt displays; `init` sorts for display.
 */
export const MOTION_PRESETS = [
  "none",
  "snap",
  "glide",
  "spring",
  "bounce",
] as const;

export type MotionPreset = (typeof MOTION_PRESETS)[number];

export interface NikaConfig {
  style: string;
  tailwind: {
    css: string;
  };
  aliases: {
    components: string;
    ui: string;
    utils: string;
    hooks: string;
    blocks: string;
  };
  motion: MotionPreset;
}

const DEFAULT_CONFIG: NikaConfig = {
  style: "default",
  tailwind: {
    css: "./src/app/globals.css",
  },
  aliases: {
    components: "@/components",
    ui: "@/components/ui",
    utils: "@/lib/utils",
    hooks: "@/hooks",
    blocks: "@/components/blocks",
  },
  motion: "spring",
};

export async function getConfig(cwd: string): Promise<NikaConfig> {
  const configPath = path.join(cwd, "nika.config.ts");

  if (!(await fs.pathExists(configPath))) {
    throw new Error(
      "nika.config.ts not found. Run `npx nikaui init` first."
    );
  }

  const content = await fs.readFile(configPath, "utf-8");

  // Parse the config from the TS file (simple regex extraction)
  // This avoids needing a full TS compiler at runtime
  const config = { ...DEFAULT_CONFIG };

  const uiMatch = content.match(/ui:\s*"([^"]+)"/);
  if (uiMatch) config.aliases.ui = uiMatch[1]!;

  const utilsMatch = content.match(/utils:\s*"([^"]+)"/);
  if (utilsMatch) config.aliases.utils = utilsMatch[1]!;

  const hooksMatch = content.match(/hooks:\s*"([^"]+)"/);
  if (hooksMatch) config.aliases.hooks = hooksMatch[1]!;

  const componentsMatch = content.match(/components:\s*"([^"]+)"/);
  if (componentsMatch) config.aliases.components = componentsMatch[1]!;

  // Built from MOTION_PRESETS rather than spelled out, so the accepted set
  // cannot fall behind the union. The names contain no regex metacharacters,
  // so joining them directly is safe.
  const motionMatch = content.match(
    new RegExp(`motion:\\s*"(${MOTION_PRESETS.join("|")})"`)
  );
  if (motionMatch) config.motion = motionMatch[1] as MotionPreset;

  const blocksMatch = content.match(/blocks:\s*"([^"]+)"/);
  if (blocksMatch) config.aliases.blocks = blocksMatch[1]!;

  const cssMatch = content.match(/css:\s*"([^"]+)"/);
  if (cssMatch) config.tailwind.css = cssMatch[1]!;

  return config;
}

/**
 * Resolve an alias like "@/components/ui" to a filesystem path like "src/components/ui"
 */
export function resolveAliasPath(alias: string): string {
  return alias.replace(/^@\//, "src/");
}
