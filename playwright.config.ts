import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/setup.ts",
  use: {
    baseURL: "http://127.0.0.1:3201",
  },
  webServer: {
    command: "npm run dev -- --port 3201",
    url: "http://127.0.0.1:3201",
    reuseExistingServer: false,
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL ?? "file:../data/xreader.db", ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "test-admin-password", ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET ?? "test-admin-session-secret" },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
