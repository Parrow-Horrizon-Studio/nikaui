import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
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
    // Mirrors tsconfig.json's "@/*" -> "./src/*". Previously unneeded:
    // every existing *.test.{ts,tsx} either imports its subject by relative
    // path or the subject itself has no "@/" imports. opengraph-image.tsx
    // does (`@/lib/site`), so it's the first test to require this.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
