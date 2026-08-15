import { defineConfig, devices } from "@playwright/test";

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL ?? "file:../data/xreader.e2e.db";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3201",
  },
  webServer: {
    command: "tsx scripts/e2e-server.ts",
    url: "http://127.0.0.1:3201",
    reuseExistingServer: false,
    env: { ...process.env, E2E_DATABASE_URL: e2eDatabaseUrl, ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "test-admin-password", ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET ?? "test-admin-session-secret" },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
