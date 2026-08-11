import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import prompts from "prompts";
import {
  getMissingDependencies,
  installDependencies,
  detectPackageManager,
} from "../utils/dependencies.js";
import { getRegistryFile } from "../utils/registry-files.js";

export const initCommand = new Command()
  .name("init")
  .description("Initialize Nika UI in your project")
  .option("--cwd <path>", "Working directory", process.cwd())
  .action(async (options) => {
    const cwd = path.resolve(options.cwd);

    console.log(chalk.bold("\n  Welcome to Nika UI\n"));

    // Check if already initialized
    if (await fs.pathExists(path.join(cwd, "nika.config.ts"))) {
      const { overwrite } = await prompts({
        type: "confirm",
        name: "overwrite",
        message: "nika.config.ts already exists. Overwrite?",
        initial: false,
      });

      if (!overwrite) {
        console.log(chalk.dim("  Cancelled.\n"));
        process.exit(0);
      }
    }

    const response = await prompts([
      {
        type: "text",
        name: "componentsDir",
        message: "Where should components be installed?",
        initial: "src/components/ui",
      },
      {
        type: "text",
        name: "utilsDir",
        message: "Where should utilities be installed?",
        initial: "src/lib",
      },
      {
        type: "text",
        name: "tailwindCss",
        message: "Where is your global stylesheet?",
        initial: "src/app/globals.css",
      },
      {
        type: "select",
        name: "motion",
        message: "Default animation feel?",
        choices: [
          { title: "spring — lively, slight overshoot (recommended)", value: "spring" },
          { title: "glide  — smooth, no overshoot", value: "glide" },
          { title: "snap   — fast and tight", value: "snap" },
          { title: "bounce — pronounced overshoot", value: "bounce" },
          { title: "none   — no animation", value: "none" },
        ],
        initial: 0,
      },
    ]);

    // User cancelled (Ctrl+C)
    if (!response.componentsDir) {
      console.log(chalk.dim("  Cancelled.\n"));
      process.exit(0);
    }

    const spinner = ora("Initializing Nika UI...").start();

    try {
      // Create directories
      await fs.ensureDir(path.join(cwd, response.componentsDir));
      await fs.ensureDir(path.join(cwd, response.utilsDir));

      // Derive aliases from user paths
      const uiAlias = `@/${response.componentsDir.replace(/^src\//, "")}`;
      const utilsAlias = `@/${response.utilsDir.replace(/^src\//, "")}/utils`;
      const hooksAlias = "@/hooks";
      const componentsAlias = `@/${response.componentsDir.replace(/^src\//, "").replace(/\/ui$/, "")}`;

      // Write nika.config.ts
      const config = `export default {
  style: "default",
  tailwind: {
    css: "./${response.tailwindCss}",
  },
  aliases: {
    components: "${componentsAlias}",
    ui: "${uiAlias}",
    utils: "${utilsAlias}",
    hooks: "${hooksAlias}",
    blocks: "${componentsAlias}/blocks",
  },
  motion: "${response.motion}",
} as const;
`;
      await fs.writeFile(path.join(cwd, "nika.config.ts"), config);

      // Write the token layer beside the consumer's global stylesheet.
      // An isolated file keeps ownership intact — they may edit or delete
      // it freely — while giving a future `update` a file it can replace
      // wholesale, rather than diffing against hand-edited CSS.
      const cssPath = path.join(cwd, response.tailwindCss);
      const cssDir = path.dirname(cssPath);
      await fs.ensureDir(cssDir);

      const tokensSource = await getRegistryFile("styles/tokens.css");
      await fs.writeFile(path.join(cssDir, "nika-tokens.css"), tokensSource);

      // Prepend the import if it is not already there. Consumer overrides
      // belong in globals.css *after* this line, where nothing clobbers them.
      const importLine = '@import "./nika-tokens.css";';
      let wroteImport = false;
      if (await fs.pathExists(cssPath)) {
        const existing = await fs.readFile(cssPath, "utf-8");
        if (!existing.includes("nika-tokens.css")) {
          await fs.writeFile(cssPath, importLine + "\n" + existing);
          wroteImport = true;
        }
      } else {
        await fs.writeFile(cssPath, importLine + "\n");
        wroteImport = true;
      }

      // Write cn() utility
      const utilsContent = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
      await fs.writeFile(
        path.join(cwd, response.utilsDir, "utils.ts"),
        utilsContent
      );

      // Write motion presets. The motion module is registry source now;
      // write it exactly as the tokens are written.
      const motionContent = await getRegistryFile("lib/motion.ts");
      await fs.writeFile(
        path.join(cwd, response.utilsDir, "motion.ts"),
        motionContent
      );

      // Install base dependencies — motion is always needed because every
      // component imports the resolver.
      const baseDeps = ["clsx", "tailwind-merge", "motion"];

      const missingDeps = await getMissingDependencies(cwd, baseDeps);
      if (missingDeps.length > 0) {
        const pm = detectPackageManager(cwd);
        spinner.text = `Installing dependencies via ${pm}...`;
        installDependencies(cwd, missingDeps);
      }

      spinner.succeed(chalk.green("Nika UI initialized successfully!"));

      console.log(chalk.dim("\n  Created:"));
      console.log(chalk.dim(`    - nika.config.ts`));
      console.log(chalk.dim(`    - ${response.utilsDir}/utils.ts`));
      console.log(chalk.dim(`    - ${response.utilsDir}/motion.ts`));
      console.log(chalk.dim(`    - ${path.relative(cwd, path.join(cssDir, "nika-tokens.css"))}`));
      if (wroteImport) {
        console.log(chalk.dim(`    - @import added to ${response.tailwindCss}`));
      }
      if (missingDeps.length > 0) {
        console.log(chalk.dim(`    - Installed: ${missingDeps.join(", ")}`));
      }

      console.log(
        chalk.dim("\n  Add components with:"),
        chalk.cyan("npx nikaui add button\n")
      );
    } catch (error) {
      spinner.fail(chalk.red("Failed to initialize Nika UI"));
      if (error instanceof Error) {
        console.error(chalk.dim(`  ${error.message}`));
      }
      process.exit(1);
    }
  });
