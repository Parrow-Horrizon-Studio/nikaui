import { Command } from "commander";
import chalk from "chalk";
import { getAllComponents } from "../utils/registry.js";

export const listCommand = new Command()
  .name("list")
  .description("List all available components")
  .action(() => {
    const components = getAllComponents();

    console.log(chalk.bold("\n  Available components:\n"));

    for (const component of components) {
      const deps = component.dependencies.length > 0
        ? chalk.dim(` (${component.dependencies.join(", ")})`)
        : "";

      console.log(
        `  ${chalk.cyan(component.name.padEnd(16))} ${chalk.dim(component.description)}${deps}`
      );
    }

    console.log(
      chalk.dim(`\n  ${components.length} components available.`)
    );
    console.log(
      chalk.dim("  Add with:"),
      chalk.cyan("npx nikaui add <component>\n")
    );
  });
