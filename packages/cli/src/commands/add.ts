import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import prompts from "prompts";
import { getConfig, resolveAliasPath, type NikaConfig } from "../utils/config.js";
import {
  getComponent,
  resolveWithDependencies,
  type RegistryEntry,
} from "../utils/registry.js";
import {
  getMissingDependencies,
  installDependencies,
  detectPackageManager,
} from "../utils/dependencies.js";
import { transformImports } from "../utils/transformer.js";

// Base URL for fetching component source files from the registry
const REGISTRY_BASE_URL =
  "https://raw.githubusercontent.com/Parrow-Horrizon-Studio/nikaui/main/packages/registry/src";

export const addCommand = new Command()
  .name("add")
  .description("Add components to your project")
  .argument("<components...>", "Components to add")
  .option("--overwrite", "Overwrite existing files", false)
  .option("--cwd <path>", "Working directory", process.cwd())
  .option("--path <path>", "Override the component install path")
  .action(async (componentNames: string[], options) => {
    const cwd = path.resolve(options.cwd);

    // 1. Load config
    let config;
    try {
      config = await getConfig(cwd);
    } catch {
      console.error(
        chalk.red(
          "\n  Could not find nika.config.ts. Run `npx nika init` first.\n"
        )
      );
      process.exit(1);
    }

    // 2. Validate component names
    const invalid = componentNames.filter((name) => !getComponent(name));
    if (invalid.length > 0) {
      console.error(
        chalk.red(`\n  Unknown component(s): ${invalid.join(", ")}`)
      );
      console.error(chalk.dim("  Run `npx nika list` to see available components.\n"));
      process.exit(1);
    }

    // 3. Resolve all dependencies
    const resolved = resolveWithDependencies(componentNames);

    // 4. Determine target paths
    const uiDir = path.join(cwd, options.path || resolveAliasPath(config.aliases.ui));
    const libDir = path.join(cwd, resolveAliasPath(config.aliases.utils).replace(/\/utils$/, ""));

    // 5. Check for existing files
    const allEntries = [...resolved.libs, ...resolved.components];
    const existingFiles: string[] = [];

    for (const entry of allEntries) {
      for (const file of entry.files) {
        const targetDir = entry.type === "lib" ? libDir : uiDir;
        const targetPath = path.join(targetDir, path.basename(file.target));
        if (await fs.pathExists(targetPath)) {
          existingFiles.push(targetPath);
        }
      }
    }

    if (existingFiles.length > 0 && !options.overwrite) {
      console.log(chalk.yellow("\n  The following files already exist:"));
      for (const f of existingFiles) {
        console.log(chalk.dim(`    - ${path.relative(cwd, f)}`));
      }

      const { proceed } = await prompts({
        type: "confirm",
        name: "proceed",
        message: "Overwrite existing files?",
        initial: false,
      });

      if (!proceed) {
        console.log(chalk.dim("  Cancelled.\n"));
        process.exit(0);
      }
    }

    const spinner = ora("Installing components...").start();

    try {
      // 6. Install missing npm dependencies
      const missingDeps = await getMissingDependencies(
        cwd,
        resolved.npmDependencies
      );

      if (missingDeps.length > 0) {
        const pm = detectPackageManager(cwd);
        spinner.text = `Installing dependencies: ${missingDeps.join(", ")}...`;
        installDependencies(cwd, missingDeps);
        spinner.text = `Installed ${missingDeps.length} dependencies via ${pm}`;
      }

      // 7. Copy lib files (utils, motion presets)
      for (const lib of resolved.libs) {
        await copyRegistryFiles(lib, libDir, config, cwd);
      }

      // 8. Copy component files
      for (const component of resolved.components) {
        await copyRegistryFiles(component, uiDir, config, cwd);
      }

      // 9. Summary
      const installed = resolved.components.map((c) => c.name);
      spinner.succeed(
        chalk.green(`Added ${installed.length} component(s): ${installed.join(", ")}`)
      );

      if (resolved.libs.length > 0) {
        const libNames = resolved.libs.map((l) => l.name);
        console.log(
          chalk.dim(`  + dependencies: ${libNames.join(", ")}`)
        );
      }

      if (missingDeps.length > 0) {
        console.log(
          chalk.dim(`  + npm packages: ${missingDeps.join(", ")}`)
        );
      }

      // 10. Show usage example
      const first = resolved.components[0];
      if (first) {
        const componentName = toPascalCase(first.name);
        console.log(
          chalk.dim(`\n  Import with:`),
          chalk.cyan(`import { ${componentName} } from "${config.aliases.ui}/${first.name}"`)
        );
      }
      console.log();
    } catch (error) {
      spinner.fail(chalk.red("Failed to add components"));
      if (error instanceof Error) {
        console.error(chalk.dim(`  ${error.message}`));
      }
      process.exit(1);
    }
  });

/**
 * Copy registry files to the target directory, transforming imports.
 */
async function copyRegistryFiles(
  entry: RegistryEntry,
  targetDir: string,
  config: NikaConfig,
  cwd: string
): Promise<void> {
  await fs.ensureDir(targetDir);

  for (const file of entry.files) {
    const targetPath = path.join(targetDir, path.basename(file.target));

    // Try to read from local registry first (for development),
    // then fall back to fetching from remote
    const content = await getFileContent(file.source);
    const transformed = transformImports(content, config);

    await fs.writeFile(targetPath, transformed, "utf-8");
  }
}

/**
 * Get component source file content.
 * First tries the local registry (monorepo development),
 * then falls back to fetching from GitHub.
 */
async function getFileContent(sourcePath: string): Promise<string> {
  // Try local paths (monorepo dev, or installed via node_modules)
  const cliDir = fileURLToPath(new URL(".", import.meta.url));
  const localPaths = [
    // Monorepo: cli/dist/../../../registry/src/
    path.resolve(cliDir, "..", "..", "registry", "src", sourcePath),
    // Installed: node_modules/nika-ui/dist/../../../@nikaui/registry/src/
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

function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}
