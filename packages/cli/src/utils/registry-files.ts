import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

// Base URL for fetching component source files from the registry
export const REGISTRY_BASE_URL =
  "https://raw.githubusercontent.com/Parrow-Horrizon-Studio/nikaui/main/packages/registry/src";

/**
 * Get registry source file content.
 * First tries the local registry (monorepo development),
 * then falls back to fetching from GitHub.
 */
export async function getRegistryFile(sourcePath: string): Promise<string> {
  // Try local paths (monorepo dev, or installed via node_modules)
  const cliDir = fileURLToPath(new URL(".", import.meta.url));
  const localPaths = [
    // Monorepo: cli/dist/../../../registry/src/
    path.resolve(cliDir, "..", "..", "registry", "src", sourcePath),
    // Installed: node_modules/nikaui/dist/../../../@nikaui/registry/src/
    path.resolve(cliDir, "..", "..", "@nikaui", "registry", "src", sourcePath),
  ];

  for (const localPath of localPaths) {
    if (await fs.pathExists(localPath)) {
      return fs.readFile(localPath, "utf-8");
    }
  }

  // Fall back to remote fetch
  const url = `${REGISTRY_BASE_URL}/${sourcePath}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${sourcePath} from registry (${response.status})`
    );
  }

  return response.text();
}
