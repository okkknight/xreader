import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/vitest.setup.ts"],
    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
      ...(process.env.VITEST_INTEGRATION === "1" ? ["tests/integration/**/*.test.ts"] : []),
    ],
    globalSetup: process.env.VITEST_INTEGRATION === "1" ? ["./tests/integration/setup.ts"] : [],
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
