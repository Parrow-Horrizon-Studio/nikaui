import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
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
