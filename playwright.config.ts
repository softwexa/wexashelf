import { defineConfig, devices } from "@playwright/test";

const externalBaseURL =
  process.env.E2E_BASE_URL || process.env.ADMIN_E2E_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: externalBaseURL || "http://127.0.0.1:3140",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: externalBaseURL
    ? undefined
    : {
        command: "npm run dev:legacy",
        url: "http://127.0.0.1:3140",
        reuseExistingServer: true,
        timeout: 120000,
      },
});
