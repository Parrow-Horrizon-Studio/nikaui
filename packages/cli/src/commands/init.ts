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
        type: "confirm",
        name: "motion",
        message: "Enable motion animations?",
        initial: true,
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
    css: "./src/app/globals.css",
  },
  aliases: {
    components: "${componentsAlias}",
    ui: "${uiAlias}",
    utils: "${utilsAlias}",
    hooks: "${hooksAlias}",
  },
  motion: ${response.motion},
} as const;
`;
      await fs.writeFile(path.join(cwd, "nika.config.ts"), config);

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

      // Write motion presets if enabled
      if (response.motion) {
        const motionContent = `export const motionPresets = {
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  slideUp: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
  slideDown: { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 } },
  scaleIn: { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } },
  tap: { whileTap: { scale: 0.98 } },
  hover: { whileHover: { scale: 1.02 } },
  spring: { type: "spring" as const, stiffness: 400, damping: 17 },
  springBouncy: { type: "spring" as const, stiffness: 600, damping: 15 },
  springSmooth: { type: "spring" as const, stiffness: 300, damping: 30 },
} as const;
`;
        await fs.writeFile(
          path.join(cwd, response.utilsDir, "motion.ts"),
          motionContent
        );
      }

      // Install base dependencies
      const baseDeps = ["clsx", "tailwind-merge"];
      if (response.motion) {
        baseDeps.push("motion");
      }

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
      if (response.motion) {
        console.log(chalk.dim(`    - ${response.utilsDir}/motion.ts`));
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
