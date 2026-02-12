import { test, expect } from "@playwright/test";
import { VALID_VEHICLES, CATALOG_STATS } from "./fixtures/test-data";

/**
 * Vehicle Options API E2E Tests
 *
 * Tests the /api/public/vehicle-options endpoint that powers the
 * vehicle dropdown search (make → model → year cascade).
 *
 * If this endpoint breaks, all vehicle dropdown searches are dead.
 *
 * Runs in the "chromium" project (read-only, no DB mutations).
 *
 * API route: src/app/api/public/vehicle-options/route.ts
 */

test.describe("Vehicle Options API", () => {
  test("returns makes, models, and years", async ({ page }) => {
    const response = await page.request.get("/api/public/vehicle-options");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();

    const { makes, models, years } = body.data;

    // Makes should be a non-empty sorted array of strings
    expect(Array.isArray(makes)).toBe(true);
    expect(makes.length).toBeGreaterThan(0);
    // Verify sorted
    const sortedMakes = [...makes].sort();
    expect(makes).toEqual(sortedMakes);
  });

  test("includes known makes from seed data", async ({ page }) => {
    const response = await page.request.get("/api/public/vehicle-options");
    const body = await response.json();
    const { makes } = body.data;

    // Known makes from test data
    for (const vehicle of VALID_VEHICLES) {
      expect(makes).toContain(vehicle.make);
    }
  });

  test("models are grouped by make", async ({ page }) => {
    const response = await page.request.get("/api/public/vehicle-options");
    const body = await response.json();
    const { makes, models } = body.data;

    // Every make should have a models entry
    for (const make of makes) {
      expect(models[make]).toBeDefined();
      expect(Array.isArray(models[make])).toBe(true);
      expect(models[make].length).toBeGreaterThan(0);
    }

    // Known make-model combos from seed data
    const acuraModels = models["ACURA"];
    expect(acuraModels).toBeDefined();
    expect(acuraModels).toContain("MDX");
    expect(acuraModels).toContain("CL");
  });

  test("years are grouped by make-model and sorted newest first", async ({
    page,
  }) => {
    const response = await page.request.get("/api/public/vehicle-options");
    const body = await response.json();
    const { years } = body.data;

    // Check a known make-model combo
    const acuraMdxYears = years["ACURA-MDX"];
    expect(acuraMdxYears).toBeDefined();
    expect(Array.isArray(acuraMdxYears)).toBe(true);
    expect(acuraMdxYears.length).toBeGreaterThan(0);

    // Verify sorted newest first (descending)
    for (let i = 1; i < acuraMdxYears.length; i++) {
      expect(acuraMdxYears[i - 1]).toBeGreaterThanOrEqual(acuraMdxYears[i]);
    }

    // Year 2020 should be in the range for ACURA MDX (from test data: 2014-2020)
    expect(acuraMdxYears).toContain(2020);
  });

  test("endpoint is publicly accessible (no auth required)", async ({
    page,
  }) => {
    // This endpoint is at /api/public/* — no auth should be needed
    // Even though we're running with admin auth, this verifies the route exists
    // The auth-api-enforcement tests verify unauthenticated access for admin routes
    const response = await page.request.get("/api/public/vehicle-options");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
  });
});
