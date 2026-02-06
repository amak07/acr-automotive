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
  reporter: [["html", { open: "never" }], ["list"]],

  /* Shared settings for all the projects below */
  use: {
    /* Port 3001 to avoid conflict with main repo dev server on 3000 (worktree isolation) */
    baseURL: process.env.BASE_URL || "http://localhost:3001",

    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",

    /* Take screenshot on failure */
    screenshot: "only-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Uncomment for cross-browser testing
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm.cmd run dev -- -p 3001",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
