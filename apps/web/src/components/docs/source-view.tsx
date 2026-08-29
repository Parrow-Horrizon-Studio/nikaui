import fs from "node:fs";
import path from "node:path";
import { highlight } from "fumadocs-core/highlight";
import { CopyButton } from "./copy-button";

/**
 * Shows the file a developer actually owns.
 *
 * Every component page documented how to *call* the component —
 * `<Button>Click me</Button>` — and nowhere showed what lands in
 * `components/ui/button.tsx`. In a copy-into-your-project library that is the
 * one artefact the reader takes away and edits, and it was the one thing the
 * documentation never displayed.
 *
 * The file is READ, never copied into MDX. A copy is a second representation
 * of the same fact and would drift the first time a component changed. The
 * previews already prove docs and CLI serve one source — `component-previews`
 * imports from `@nikaui/registry`, and the CLI fetches the same path from
 * GitHub raw — and this keeps that property rather than quietly breaking it.
 */

/**
 * Finds the registry by walking up from the working directory.
 *
 * Neither fixed anchor survives both environments: `import.meta.dirname` is
 * undefined once Next bundles this module (the build fails with "paths[0]
 * must be of type string"), and a `process.cwd()` offset assumes which
 * directory the process was started from, which differs between `next build`,
 * Vitest and a CI runner. Walking up until the directory actually exists
 * makes no assumption about either.
 */
function findUiDir(): string {
  let dir = process.cwd();
  for (let depth = 0; depth < 6; depth++) {
    const candidate = path.join(dir, "packages/registry/src/ui");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    `SourceView: could not locate packages/registry/src/ui above ${process.cwd()}`
  );
}

const UI_DIR = findUiDir();

/**
 * Reads one component's source.
 *
 * Throws rather than returning empty on a miss. A Source view that silently
 * renders nothing is the same failure mode as D's component index deriving
 * from an unparsed frontmatter field: a green build and a blank space where
 * the content should be.
 */
export function readComponentSource(name: string): string {
  const file = path.join(UI_DIR, `${name}.tsx`);
  if (!fs.existsSync(file)) {
    throw new Error(
      `SourceView: no registry component named "${name}" (looked in ${UI_DIR}). ` +
        "If the component was renamed, update the page's slug."
    );
  }
  return fs.readFileSync(file, "utf-8");
}

export async function SourceView({ name }: { name: string }) {
  const code = readComponentSource(name);
  const rendered = await highlight(code, {
    lang: "tsx",
    themes: { light: "github-light", dark: "github-dark" },
  });

  return (
    <figure className="relative my-6 overflow-hidden rounded-lg border border-fd-border bg-fd-card">
      <figcaption className="flex items-center justify-between border-b border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
        <span className="font-mono">components/ui/{name}.tsx</span>
        <CopyButton value={code} />
      </figcaption>
      <div className="max-h-[32rem] overflow-auto p-4 text-sm [&_pre]:bg-transparent">
        {rendered}
      </div>
    </figure>
  );
}
