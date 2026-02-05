/**
 * Search Type Detection Unit Tests
 *
 * Tests the detectVehicleKeyword function which classifies search terms
 * as either vehicle keywords or SKU patterns.
 */

import { describe, it, expect } from "@jest/globals";
import { detectVehicleKeyword } from "../../../src/lib/utils/search";

describe("detectVehicleKeyword", () => {
  // ==========================================================================
  // SKU PATTERNS (should return false)
  // ==========================================================================

  describe("SKU Patterns - should return false", () => {
    it("detects pure numeric strings as SKU", () => {
      expect(detectVehicleKeyword("12345")).toBe(false);
      expect(detectVehicleKeyword("512348")).toBe(false);
      expect(detectVehicleKeyword("15002")).toBe(false);
    });

    it("detects ACR prefix as SKU", () => {
      expect(detectVehicleKeyword("ACR-15002")).toBe(false);
      expect(detectVehicleKeyword("acr-12345")).toBe(false);
      expect(detectVehicleKeyword("ACR123")).toBe(false);
      expect(detectVehicleKeyword("acr")).toBe(false); // starts with "acr"
    });

    it("detects prefix-number patterns as SKU", () => {
      expect(detectVehicleKeyword("WB-123")).toBe(false);
      expect(detectVehicleKeyword("AB-456")).toBe(false);
      expect(detectVehicleKeyword("XYZ-789")).toBe(false);
    });

    it("detects short terms as not vehicle keywords", () => {
      expect(detectVehicleKeyword("ab")).toBe(false);
      expect(detectVehicleKeyword("a")).toBe(false);
      expect(detectVehicleKeyword("12")).toBe(false);
    });
  });

  // ==========================================================================
  // VEHICLE KEYWORDS (should return true)
  // ==========================================================================

  describe("Vehicle Keywords - should return true", () => {
    it("detects single word vehicle makes", () => {
      expect(detectVehicleKeyword("FORD")).toBe(true);
      expect(detectVehicleKeyword("BMW")).toBe(true);
      expect(detectVehicleKeyword("TOYOTA")).toBe(true);
      expect(detectVehicleKeyword("HONDA")).toBe(true);
    });

    it("detects vehicle makes case-insensitively", () => {
      expect(detectVehicleKeyword("ford")).toBe(true);
      expect(detectVehicleKeyword("Ford")).toBe(true);
      expect(detectVehicleKeyword("FORD")).toBe(true);
    });

    it("detects multi-word vehicle makes", () => {
      expect(detectVehicleKeyword("MERCEDES BENZ")).toBe(true);
      expect(detectVehicleKeyword("ALFA ROMEO")).toBe(true);
      expect(detectVehicleKeyword("LAND ROVER")).toBe(true);
    });

    it("detects vehicle models", () => {
      expect(detectVehicleKeyword("mustang")).toBe(true);
      expect(detectVehicleKeyword("camaro")).toBe(true);
      expect(detectVehicleKeyword("corvette")).toBe(true);
      expect(detectVehicleKeyword("escalade")).toBe(true);
    });

    it("detects vehicle models with hyphens (letter-only prefix)", () => {
      // Note: "F-150", "RAV-4" match SKU pattern (prefix-numbers)
      // These are classified as SKU, but search still works via fuzzy matching
      // Only pure letter-hyphen-letter patterns are detected as vehicle keywords
      expect(detectVehicleKeyword("CR-V")).toBe(true); // letter-letter
      expect(detectVehicleKeyword("X-Type")).toBe(true); // letter-letters
    });

    it("classifies alphanumeric models as SKU (search still works via fuzzy)", () => {
      // These match SKU pattern but search RPC handles them correctly
      expect(detectVehicleKeyword("F-150")).toBe(false);
      expect(detectVehicleKeyword("RAV-4")).toBe(false);
    });

    it("detects multi-word vehicle models", () => {
      expect(detectVehicleKeyword("monte carlo")).toBe(true);
      expect(detectVehicleKeyword("grand cherokee")).toBe(true);
      expect(detectVehicleKeyword("town car")).toBe(true);
    });

    it("detects vehicle aliases/nicknames", () => {
      expect(detectVehicleKeyword("chevy")).toBe(true);
      expect(detectVehicleKeyword("beemer")).toBe(true);
      expect(detectVehicleKeyword("bimmer")).toBe(true);
      expect(detectVehicleKeyword("caddy")).toBe(true);
      expect(detectVehicleKeyword("vette")).toBe(true);
      expect(detectVehicleKeyword("stang")).toBe(true);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles whitespace trimming", () => {
      expect(detectVehicleKeyword("  FORD  ")).toBe(true);
      expect(detectVehicleKeyword("  12345  ")).toBe(false);
    });

    it("handles empty strings", () => {
      expect(detectVehicleKeyword("")).toBe(false);
      expect(detectVehicleKeyword("   ")).toBe(false);
    });

    it("handles alphanumeric models without clear SKU patterns", () => {
      // Models like "3 SERIES" start with a letter after normalization check
      expect(detectVehicleKeyword("SERIES")).toBe(true);
    });

    it("classifies ambiguous terms appropriately", () => {
      // Terms that could be either - the function uses heuristics
      // "RAM" is a vehicle make
      expect(detectVehicleKeyword("RAM")).toBe(true);
    });
  });
});
