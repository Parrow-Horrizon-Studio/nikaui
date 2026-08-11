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

const DEFAULTS = {
  componentsDir: "src/components/ui",
  utilsDir: "src/lib",
  tailwindCss: "src/app/globals.css",
  motion: "spring",
};

/**
 * A stylesheet answer must be a `.css` file that resolves inside the
 * project. An empty answer resolves `cssDir` to the project's parent
 * directory; a `../`-prefixed answer can escape `cwd` entirely — both
 * would otherwise write nika-tokens.css outside the project silently.
 */
function isValidStylesheetPath(cwd: string, value: string): boolean {
  if (!value || !value.endsWith(".css")) return false;
  const resolved = path.resolve(cwd, value);
  const rel = path.relative(cwd, resolved);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

export const initCommand = new Command()
  .name("init")
  .description("Initialize Nika UI in your project")
  .option("--cwd <path>", "Working directory", process.cwd())
  .option("-y, --yes", "Skip prompts and use the defaults", false)
  .action(async (options) => {
    const cwd = path.resolve(options.cwd);

    console.log(chalk.bold("\n  Welcome to Nika UI\n"));

    // Check if already initialized
    const configExists = await fs.pathExists(path.join(cwd, "nika.config.ts"));
    if (configExists && !options.yes) {
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

    const response = options.yes
      ? { ...DEFAULTS }
      : await prompts(
          [
            {
              type: "text",
              name: "componentsDir",
              message: "Where should components be installed?",
              initial: DEFAULTS.componentsDir,
            },
            {
              type: "text",
              name: "utilsDir",
              message: "Where should utilities be installed?",
              initial: DEFAULTS.utilsDir,
            },
            {
              type: "text",
              name: "tailwindCss",
              message: "Where is your global stylesheet?",
              initial: DEFAULTS.tailwindCss,
              validate: (value: string) =>
                isValidStylesheetPath(cwd, value) ||
                "Must be a .css path inside the project",
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
          ],
          {
            // Without this, a Ctrl+C mid-flow still resolves the prompts
            // call — with whatever ran before the cancel point filled in
            // and everything after it `undefined` — and the code below
            // would happily write a corrupt config from that partial
            // object. Abort before any of it runs.
            onCancel: () => {
              console.log(chalk.dim("  Cancelled.\n"));
              process.exit(0);
            },
          }
        );

    // User cancelled (Ctrl+C). The onCancel handler above already exits
    // before this point for the interactive path; this is a defensive
    // fallback in case a future prompt is added without wiring it up.
    if (!response.componentsDir) {
      console.log(chalk.dim("  Cancelled.\n"));
      process.exit(0);
    }

    // Defense in depth: the `validate` on the prompt above only runs for
    // real interactive input. --yes and programmatically-injected answers
    // (as used in this project's own tests) both skip it, so re-check here
    // — before any file is written — rather than trust the prompt alone.
    if (!isValidStylesheetPath(cwd, response.tailwindCss)) {
      console.error(
        chalk.red(
          `\n  Invalid stylesheet path: "${response.tailwindCss}". It must be a .css file inside the project.\n`
        )
      );
      process.exit(1);
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
      // wholesale, rather than diffing against hand-edited CSS. Never
      // clobber one that already exists: the file's own header invites
      // hand edits ("You own this file. Edit it freely."), and a re-run
      // silently overwriting it would destroy that work.
      const cssPath = path.join(cwd, response.tailwindCss);
      const cssDir = path.dirname(cssPath);
      await fs.ensureDir(cssDir);

      const tokensPath = path.join(cssDir, "nika-tokens.css");
      const tokensExisted = await fs.pathExists(tokensPath);
      let wroteTokens = false;
      if (!tokensExisted) {
        const tokensSource = await getRegistryFile("styles/tokens.css");
        await fs.writeFile(tokensPath, tokensSource);
        wroteTokens = true;
      }

      // Insert the import immediately after `@import "tailwindcss";`, not
      // before it. Tailwind v4 merges every `@theme`/`@theme inline` block
      // across all flattened imports into one theme, and among blocks at
      // the same precedence level the later one in source order wins for
      // any key they both define. Placing Nika's import after Tailwind's
      // own keeps Nika's @theme block the later one for every colliding
      // key (radius, shadow, font, ease) — matching Tailwind's own
      // documented convention of "import the framework, then customize".
      // If no `@import "tailwindcss"` line is found, insert after the
      // last import in the file's leading import block instead of
      // silently doing nothing.
      const importLine = '@import "./nika-tokens.css";';
      let wroteImport = false;
      if (await fs.pathExists(cssPath)) {
        const existing = await fs.readFile(cssPath, "utf-8");
        if (!existing.includes("nika-tokens.css")) {
          const lines = existing.split("\n");
          const tailwindImportIdx = lines.findIndex((line) =>
            /^\s*@import\s+["']tailwindcss["']/.test(line)
          );

          let insertAt = 0;
          if (tailwindImportIdx !== -1) {
            insertAt = tailwindImportIdx + 1;
          } else {
            // No `@import "tailwindcss"` line — fall back to appending
            // after the last import in the file's leading import block
            // (or the very top, if there is no such block).
            for (let i = 0; i < lines.length; i++) {
              const trimmed = lines[i]!.trim();
              if (trimmed === "") continue;
              if (/^@import\b/.test(trimmed)) {
                insertAt = i + 1;
                continue;
              }
              break;
            }
          }

          lines.splice(insertAt, 0, importLine);
          await fs.writeFile(cssPath, lines.join("\n"));
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
      if (wroteTokens) {
        console.log(chalk.dim(`    - ${path.relative(cwd, tokensPath)}`));
      } else {
        console.log(
          chalk.dim(`    - ${path.relative(cwd, tokensPath)} (kept — already exists)`)
        );
      }
      if (wroteImport) {
        console.log(chalk.dim(`    - @import added to ${response.tailwindCss}`));
      } else {
        console.log(
          chalk.dim(`    - @import already present in ${response.tailwindCss}`)
        );
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
