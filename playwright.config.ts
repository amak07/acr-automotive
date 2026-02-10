import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : 4,

  /* Reporter to use */
  reporter: [
    ["html", { open: "never" }],
    ["list"],
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: "http://localhost:3000",

    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",

    /* Take screenshot on failure */
    screenshot: "only-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    // Auth setup: logs in as admin, saves storageState for reuse
    { name: "setup", testMatch: /.*\.setup\.ts/ },

    // DB-mutating tests: run first, before read-only specs.
    // admin-import uses destructive snapshot restores (DELETE ALL + UPSERT),
    // so it must complete before any other spec reads the DB.
    {
      name: "db-tests",
      testMatch: /admin-import\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
    },

    // Read-only specs: run after db-tests complete (parallel safe)
    {
      name: "chromium",
      testIgnore: [/auth-boundary\.spec\.ts/, /admin-import\.spec\.ts/],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/admin.json",
      },
      dependencies: ["setup", "db-tests"],
    },

    // Auth boundary tests: runs WITHOUT storageState (unauthenticated)
    {
      name: "auth-tests",
      testMatch: /auth-boundary\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"], // Needs setup to create data_manager auth state
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: process.platform === "win32" ? "npm.cmd run dev" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
