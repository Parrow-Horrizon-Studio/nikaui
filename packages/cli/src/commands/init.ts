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
import { applyMotionPreset } from "../utils/motion-source.js";
import { MOTION_PRESETS, type MotionPreset } from "../utils/config.js";
import { checkContainment, isContainedPath } from "../utils/paths.js";

const DEFAULTS = {
  componentsDir: "src/components/ui",
  utilsDir: "src/lib",
  tailwindCss: "src/app/globals.css",
  motion: "spring" as MotionPreset,
};

/**
 * Prompt copy and display position for each preset.
 *
 * Typed `Record<MotionPreset, …>`, so adding a preset to `MOTION_PRESETS`
 * fails compilation here until it is given a label — the prompt cannot fall
 * behind the vocabulary. `rank` exists because the display order is not the
 * vocabulary's order: the recommended preset leads and `none` trails.
 */
const MOTION_CHOICES: Record<MotionPreset, { label: string; rank: number }> = {
  spring: { label: "spring — lively, slight overshoot (recommended)", rank: 0 },
  glide: { label: "glide  — smooth, no overshoot", rank: 1 },
  snap: { label: "snap   — fast and tight", rank: 2 },
  bounce: { label: "bounce — pronounced overshoot", rank: 3 },
  none: { label: "none   — no animation", rank: 4 },
};

// Generated from MOTION_PRESETS, not written out again, so a preset cannot
// be missing from the prompt while present in the union.
const motionChoices = [...MOTION_PRESETS]
  .sort((a, b) => MOTION_CHOICES[a].rank - MOTION_CHOICES[b].rank)
  .map((value) => ({ title: MOTION_CHOICES[value].label, value }));

/**
 * A stylesheet answer must be a `.css` file that resolves inside the
 * project. An empty answer resolves `cssDir` to the project's parent
 * directory; a `../`-prefixed answer can escape `cwd` entirely — both
 * would otherwise write nika-tokens.css outside the project silently.
 * `isContainedPath` carries the containment half of that check; this adds
 * the `.css` requirement on top.
 */
function isValidStylesheetPath(cwd: string, value: string): boolean {
  return !!value && value.endsWith(".css") && isContainedPath(cwd, value);
}

/**
 * The clause completing "Must …" (prompt) / "It must …" (guard) for a
 * rejected componentsDir/utilsDir answer, or `null` if it's fine.
 *
 * Distinguishes `checkContainment`'s "root" result from "outside": an
 * answer that resolves to `cwd` itself (e.g. "", ".", or enough `../` to
 * cancel back to the start) didn't escape anywhere, so "resolve inside the
 * project" reads like an escape complaint for an answer that just named
 * the project itself. The real objection there is narrower — it has to be
 * a subdirectory.
 */
function dirContainmentError(cwd: string, value: string): string | null {
  const result = checkContainment(cwd, value);
  if (result === "ok") return null;
  return result === "root"
    ? "be a subdirectory of the project, not the project root itself"
    : "resolve inside the project";
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
              validate: (value: string) => {
                const error = dirContainmentError(cwd, value);
                return error === null || `Must ${error}`;
              },
            },
            {
              type: "text",
              name: "utilsDir",
              message: "Where should utilities be installed?",
              initial: DEFAULTS.utilsDir,
              validate: (value: string) => {
                const error = dirContainmentError(cwd, value);
                return error === null || `Must ${error}`;
              },
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
              choices: motionChoices,
              initial: motionChoices.findIndex(
                (choice) => choice.value === DEFAULTS.motion
              ),
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

    // Defense in depth: the `validate` on each prompt above only runs for
    // real interactive input. --yes and programmatically-injected answers
    // (as used in this project's own tests) both skip it, so re-check here
    // — before any directory is created or file written — rather than
    // trust the prompts alone.
    const componentsDirError = dirContainmentError(cwd, response.componentsDir);
    if (componentsDirError) {
      console.error(
        chalk.red(
          `\n  Invalid components directory: "${response.componentsDir}". It must ${componentsDirError}.\n`
        )
      );
      process.exit(1);
    }

    const utilsDirError = dirContainmentError(cwd, response.utilsDir);
    if (utilsDirError) {
      console.error(
        chalk.red(
          `\n  Invalid utils directory: "${response.utilsDir}". It must ${utilsDirError}.\n`
        )
      );
      process.exit(1);
    }

    if (!isValidStylesheetPath(cwd, response.tailwindCss)) {
      console.error(
        chalk.red(
          `\n  Invalid stylesheet path: "${response.tailwindCss}". It must be a .css file inside the project.\n`
        )
      );
      process.exit(1);
    }

    // Same defense in depth, and it matters more now that this answer is
    // baked into source: an out-of-vocabulary value would be written into
    // motion.ts as `motionPresets.<garbage>`, which is a type error in the
    // consumer's project rather than a message here.
    if (!(MOTION_PRESETS as readonly string[]).includes(response.motion)) {
      console.error(
        chalk.red(
          `\n  Unknown motion preset: "${response.motion}". Expected one of: ${MOTION_PRESETS.join(", ")}.\n`
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

      // Insert the import immediately after `@import "tailwindcss";`. This
      // is convention, not correctness: Tailwind marks its own defaults
      // `@theme default`, and its engine refuses to overwrite a key already
      // set by a non-default block, so Nika's `@theme inline` wins over
      // Tailwind's defaults for a colliding key (radius, shadow, font,
      // ease) in either order. What insert-after buys is that the
      // consumer's own overrides sit below this line, where the ordinary
      // later-wins rule between two project-level blocks does apply.
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

      // Write cn() utility. Read from the registry rather than an inline
      // literal: `add` already serves this file from `lib/utils.ts`, and two
      // copies of the same source in two places drift the moment one of them
      // is touched.
      const utilsContent = await getRegistryFile("lib/utils.ts");
      await fs.writeFile(
        path.join(cwd, response.utilsDir, "utils.ts"),
        utilsContent
      );

      // Write motion presets. The motion module is registry source now;
      // write it exactly as the tokens are written — except that the preset
      // chosen above is baked into the copy. `nika.config.ts` records the
      // answer for humans and for future CLI commands, but no runtime code
      // reads that file, so the built-in default in this module is the only
      // thing that actually decides how an un-wrapped app feels.
      const motionContent = applyMotionPreset(
        await getRegistryFile("lib/motion.ts"),
        response.motion
      );
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
      console.log(
        chalk.dim(
          `    - ${response.utilsDir}/motion.ts (default feel: ${response.motion})`
        )
      );
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
