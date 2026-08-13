import { fileURLToPath } from "node:url";
import mdx from "fumadocs-mdx/vite";
import { defineConfig } from "vitest/config";
import * as sourceConfig from "./source.config";

export default defineConfig({
  // Vitest runs on Vite, not on Next's webpack/turbopack build. Next learns
  // how to load "*.mdx?collection=docs" (the format `.source/server.ts`
  // imports) from the createMDX() wrapper in next.config.mjs; Vite has no
  // equivalent unless told. fumadocs-mdx ships this exact plugin for
  // non-Next, Vite-based consumers — without it, Vitest hands the raw MDX
  // source to esbuild's import-analysis step, which isn't JS and fails to
  // parse.
  plugins: [mdx(sourceConfig)],
  // apps/web/tsconfig.json sets "jsx": "preserve" — correct for Next, whose
  // SWC build handles the transform itself, but it leaves Vitest's esbuild
  // on the classic runtime, where every file containing JSX needs `React` in
  // scope. That requirement had spread as an otherwise-unused
  // `import * as React from "react"` plus a five-line comment explaining it
  // in ten files. Telling esbuild to use the automatic runtime — the same
  // one Next uses — removes the need from all of them at once.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      // Mirrors tsconfig.json's "@/*" -> "./src/*". Previously unneeded:
      // every existing *.test.{ts,tsx} either imports its subject by relative
      // path or the subject itself has no "@/" imports. opengraph-image.tsx
      // does (`@/lib/site`), so it's the first test to require this.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Mirrors tsconfig.json's "collections/*" -> "./.source/*". tsconfig
      // `paths` only bind tsc and Next's own module resolver, not Vitest's —
      // source.test.ts imports "collections/server", and without this alias
      // Vitest can't resolve the fumadocs-mdx generated collection.
      collections: fileURLToPath(new URL("./.source", import.meta.url)),
    },
  },
});
