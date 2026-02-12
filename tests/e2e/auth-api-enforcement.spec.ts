import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Auth API Enforcement Tests
 *
 * Runs in the "auth-enforcement" Playwright project (NO storageState).
 * Tests that API routes properly enforce authentication, deactivated user
 * rejection, and role-based access control.
 *
 * 1. Unauthenticated requests to admin API routes return 401
 * 2. Deactivated users are redirected by middleware and rejected by API
 * 3. data_manager role cannot access admin-only endpoints
 *
 * Auth helpers: src/lib/api/auth-helpers.ts (requireAuth, requireAdmin)
 * Middleware: src/middleware.ts (deactivated user redirect)
 */

const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const DATA_MANAGER_EMAIL = "carlos.data@acr.com";
const DATA_MANAGER_PASSWORD = "acr2026data";

/** Service role client for direct DB modifications (bypass RLS). */
function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Helper: log in as data_manager via the UI. */
async function loginAsDataManager(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(DATA_MANAGER_EMAIL);
  await page.getByLabel("Password").fill(DATA_MANAGER_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/data-portal", { timeout: 15_000 });
}

/** Helper: set is_active on the data_manager's user_profiles row. */
async function setDataManagerActive(active: boolean) {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ is_active: active })
    .eq("email", DATA_MANAGER_EMAIL);
  if (error) {
    throw new Error(
      `Failed to set is_active=${active} for ${DATA_MANAGER_EMAIL}: ${error.message}`
    );
  }
}

// ---------------------------------------------------------------------------
// 1. Unauthenticated API Access
// ---------------------------------------------------------------------------

test.describe("Auth API Enforcement", () => {
  test.describe("Unauthenticated API Access", () => {
    test("GET /api/admin/export returns 401", async ({ page }) => {
      const response = await page.request.get("/api/admin/export");
      expect(response.status()).toBe(401);
    });

    test("POST /api/admin/import/validate returns 401", async ({ page }) => {
      const response = await page.request.post("/api/admin/import/validate", {
        multipart: {
          file: {
            name: "test.xlsx",
            mimeType:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            buffer: Buffer.from("fake"),
          },
        },
      });
      expect(response.status()).toBe(401);
    });

    test("POST /api/admin/upload-images returns 401", async ({ page }) => {
      const response = await page.request.post("/api/admin/upload-images", {
        multipart: {
          file: {
            name: "test.png",
            mimeType: "image/png",
            buffer: Buffer.from("fake"),
          },
        },
      });
      expect(response.status()).toBe(401);
    });

    test("GET /api/admin/parts returns 401", async ({ page }) => {
      const response = await page.request.get("/api/admin/parts");
      expect(response.status()).toBe(401);
    });

    test("GET /api/admin/stats returns 401", async ({ page }) => {
      const response = await page.request.get("/api/admin/stats");
      expect(response.status()).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Deactivated User Enforcement
  // ---------------------------------------------------------------------------

  test.describe("Deactivated User Enforcement", () => {
    test.describe.configure({ mode: "serial" });

    test.beforeAll(async () => {
      // Safety check: ensure data_manager starts in an active state
      const supabase = getServiceClient();
      const { data } = await supabase
        .from("user_profiles")
        .select("is_active")
        .eq("email", DATA_MANAGER_EMAIL)
        .single();

      if (!data?.is_active) {
        // Reactivate if somehow left deactivated from a prior failed run
        await setDataManagerActive(true);
      }
    });

    test.afterAll(async () => {
      // Safety net: always reactivate data_manager after this block
      await setDataManagerActive(true);
    });

    test("deactivated user is redirected from /data-portal to /", async ({
      page,
    }) => {
      // 1. Log in as data_manager
      await loginAsDataManager(page);

      // 2. Verify we can access /data-portal while active
      await page.goto("/data-portal");
      await expect(page).toHaveURL(/\/data-portal/);

      // 3. Deactivate the user via service role
      await setDataManagerActive(false);

      // 4. Navigate to /data-portal — middleware should redirect to /
      await page.goto("/data-portal");
      await page.waitForURL("**/", { timeout: 10_000 });
      // Verify we landed on the homepage (not /data-portal, not /login)
      expect(page.url()).toMatch(/\/$/);

      // 5. Reactivate (cleanup within the test itself)
      await setDataManagerActive(true);
    });

    test("deactivated user API request returns 403", async ({ page }) => {
      // 1. Log in as data_manager (fresh page context after prior test)
      await loginAsDataManager(page);

      // 2. Deactivate via service role
      await setDataManagerActive(false);

      // 3. API call should return 403 (requireAuth checks is_active)
      const response = await page.request.get("/api/admin/export");
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body.error).toContain("deactivated");

      // 4. Reactivate (cleanup within the test itself)
      await setDataManagerActive(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Data Manager Role Restrictions (admin-only endpoints)
  // ---------------------------------------------------------------------------

  test.describe("Data Manager Role Restrictions", () => {
    test("data_manager cannot access GET /api/auth/users (admin-only)", async ({
      page,
    }) => {
      // Log in as data_manager to establish session cookies
      await loginAsDataManager(page);

      // Attempt to access admin-only endpoint
      const response = await page.request.get("/api/auth/users");
      // Should be 403 (authenticated but not admin)
      expect(response.status()).toBe(403);
    });

    test("data_manager cannot access PUT /api/admin/settings (admin-only)", async ({
      page,
    }) => {
      // Log in as data_manager
      await loginAsDataManager(page);

      // Attempt to update a setting — requireAdmin should reject
      const response = await page.request.put("/api/admin/settings", {
        data: { key: "site_name", value: "Hacked" },
      });
      // Should be 403 (authenticated but not admin)
      expect(response.status()).toBe(403);
    });
  });
});
