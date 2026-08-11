import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
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
import { getRegistryFile } from "../utils/registry-files.js";

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
          "\n  Could not find nika.config.ts. Run `npx nikaui init` first.\n"
        )
      );
      process.exit(1);
    }

    // --path overrides where ui/ components land, for this invocation only.
    if (options.path) {
      config = {
        ...config,
        aliases: { ...config.aliases, ui: options.path },
      };
    }

    // 2. Validate component names
    const invalid = componentNames.filter((name) => !getComponent(name));
    if (invalid.length > 0) {
      console.error(
        chalk.red(`\n  Unknown component(s): ${invalid.join(", ")}`)
      );
      console.error(chalk.dim("  Run `npx nikaui list` to see available components.\n"));
      process.exit(1);
    }

    // 3. Resolve all dependencies
    const resolved = resolveWithDependencies(componentNames);

    // 5. Check for existing files
    const allEntries = [...resolved.libs, ...resolved.components];
    const existingFiles: string[] = [];

    for (const entry of allEntries) {
      for (const file of entry.files) {
        const targetPath = resolveTarget(file.target, cwd, config);
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
        await copyRegistryFiles(lib, cwd, config);
      }

      // 8. Copy component files
      for (const component of resolved.components) {
        await copyRegistryFiles(component, cwd, config);
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
 * Copy registry files to the path their target declares, transforming imports.
 */
async function copyRegistryFiles(
  entry: RegistryEntry,
  cwd: string,
  config: NikaConfig
): Promise<void> {
  for (const file of entry.files) {
    const targetPath = resolveTarget(file.target, cwd, config);
    await fs.ensureDir(path.dirname(targetPath));

    const content = await getRegistryFile(file.source);
    // CSS carries no imports to rewrite, and running the TS import
    // transformer over it would corrupt @import lines.
    const output = targetPath.endsWith(".css")
      ? content
      : transformImports(content, config);

    await fs.writeFile(targetPath, output, "utf-8");
  }
}

function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Resolve an alias-relative registry target to an absolute path.
 *
 * Targets look like "@ui/button.tsx", "@lib/utils.ts", "@styles/tokens.css"
 * or "@blocks/dashboard/stats-row.tsx". The alias maps to a configured
 * directory; everything after it is preserved verbatim, including nesting.
 */
function resolveTarget(target: string, cwd: string, config: NikaConfig): string {
  const [, alias, rest] = target.match(/^@([a-z]+)\/(.+)$/) ?? [];
  if (!alias || !rest) {
    throw new Error(
      `Registry target "${target}" is not alias-relative. Expected a form like "@ui/button.tsx".`
    );
  }

  const dirs: Record<string, string> = {
    ui: resolveAliasPath(config.aliases.ui),
    lib: resolveAliasPath(config.aliases.utils).replace(/\/utils$/, ""),
    blocks: resolveAliasPath(config.aliases.blocks),
    styles: path.dirname(config.tailwind.css.replace(/^\.\//, "")),
  };

  const base = dirs[alias];
  if (!base) {
    throw new Error(`Unknown registry alias "@${alias}" in target "${target}".`);
  }

  return path.join(cwd, base, rest);
}
