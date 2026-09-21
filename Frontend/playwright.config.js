import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 10000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    launchOptions: process.env.E2E_CHROMIUM_PATH
      ? {
          executablePath: process.env.E2E_CHROMIUM_PATH,
          args: ["--no-sandbox", "--disable-dev-shm-usage"],
        }
      : undefined,
    viewport: { width: 1440, height: 1050 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node tests/server.mjs",
      env: { DEVSYNC_E2E: "1" },
      url: "http://127.0.0.1:5001/api/health",
      reuseExistingServer: false,
    },
    {
      command: "npm run dev",
      env: { API_PROXY_TARGET: "http://127.0.0.1:5001" },
      url: "http://127.0.0.1:5173",
      reuseExistingServer: false,
    },
  ],
});
