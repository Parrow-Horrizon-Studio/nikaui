import fs from "fs-extra";
import path from "path";

export type MotionPreset = "none" | "snap" | "glide" | "spring" | "bounce";

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

  const motionMatch = content.match(
    /motion:\s*"(none|snap|glide|spring|bounce)"/
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
