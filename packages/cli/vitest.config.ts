import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The CLI runs under Node, never a browser — no DOM here, unlike
    // packages/registry's component tests.
    environment: "node",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
