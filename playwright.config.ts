import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  features: "e2e/features/**/*.feature",
  steps: ["e2e/steps/**/*.ts", "e2e/fixtures.ts"],
  outputDir: ".features-gen",
  featuresRoot: "e2e/features",
  disableWarnings: { importTestFrom: true },
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [["html"], ["list"]],

  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    locale: "ko-KR",
  },

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: "pipe",
    stderr: "pipe",
  },

  projects: [
    {
      name: "setup",
      testDir: "e2e",
      testMatch: "global-setup.ts",
    },
    // Scanner integration tests (no auth needed)
    {
      name: "scanner-only",
      testDir: "e2e",
      testMatch: "scanner-integration.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    // Full scan flow tests (needs auth + all services)
    {
      name: "scan-flow",
      testDir: "e2e",
      testMatch: "scan-flow.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
      },
      dependencies: ["setup"],
    },
    // Auth tests run without stored authentication
    {
      name: "chromium-no-auth",
      testDir: ".features-gen",
      testMatch: "auth/**/*.spec.js",
      use: {
        ...devices["Desktop Chrome"],
        // No storageState - starts fresh for login tests
      },
      dependencies: ["setup"],
    },
    // All other tests run with authentication
    {
      name: "chromium",
      testDir: ".features-gen",
      testIgnore: "auth/**/*.spec.js",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
});
