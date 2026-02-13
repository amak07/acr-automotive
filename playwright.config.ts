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
    // Auth setup: logs in as admin + data_manager, saves storageState for reuse
    { name: "setup", testMatch: /.*\.setup\.ts/ },

    // DB-mutating tests: run sequentially, each in its own project.
    // All use destructive snapshot restores (DELETE ALL + UPSERT),
    // so they must NOT run concurrently (separate projects with deps).
    {
      name: "db-tests-import",
      testMatch: /admin-import\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "db-tests-images",
      testMatch: /admin-images\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/admin.json",
      },
      dependencies: ["setup", "db-tests-import"],
    },
    {
      name: "db-tests-data-manager",
      testMatch: /data-manager-workflow\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/data-manager.json",
      },
      dependencies: ["setup", "db-tests-images"],
    },
    {
      name: "db-tests-upload-dashboard",
      testMatch: /upload-images-dashboard\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/admin.json",
      },
      dependencies: ["setup", "db-tests-data-manager"],
    },

    // 360 viewer API tests: pure CRUD + validation, no browser navigation
    {
      name: "db-tests-360-api",
      testMatch: /admin-360-api\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/admin.json",
      },
      dependencies: ["setup", "db-tests-upload-dashboard"],
    },

    // 360 viewer UI tests: dashboard, Excel, upload/delete flows
    {
      name: "db-tests-360-ui",
      testMatch: /admin-360-ui\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/admin.json",
      },
      dependencies: ["setup", "db-tests-360-api"],
    },

    // Auth enforcement: modifies user_profiles.is_active, runs after 360 UI tests
    {
      name: "auth-enforcement",
      testMatch: /auth-api-enforcement\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup", "db-tests-360-ui"],
    },

    // Read-only specs: run after all db-tests complete (parallel safe)
    {
      name: "chromium",
      testIgnore: [
        /auth-boundary\.spec\.ts/,
        /auth-api-enforcement\.spec\.ts/,
        /admin-(import|images)\.spec\.ts/,
        /admin-360-(api|ui)\.spec\.ts/,
        /data-manager-workflow\.spec\.ts/,
        /upload-images-dashboard\.spec\.ts/,
      ],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/admin.json",
      },
      dependencies: ["setup", "db-tests-import", "db-tests-images", "db-tests-data-manager", "db-tests-upload-dashboard", "db-tests-360-api", "db-tests-360-ui", "auth-enforcement"],
    },

    // Auth boundary tests: runs WITHOUT storageState (unauthenticated).
    // Must run AFTER db-tests-data-manager because the logout test invalidates
    // the data_manager session on the server (signOut revokes the refresh token).
    {
      name: "auth-tests",
      testMatch: /auth-boundary\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup", "db-tests-data-manager"],
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
