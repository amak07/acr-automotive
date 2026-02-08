/**
 * Search Utility Functions
 *
 * Helper functions for search type detection and query classification
 */

/**
 * Detects if a search term looks like a vehicle keyword (vs a SKU pattern)
 *
 * Vehicle keywords: "FORD", "mustang", "f-150", "monte carlo", "chevy"
 * SKU patterns: "ACR-15002", "512348", "WB-123", "15002"
 *
 * @param term - The search term to classify
 * @returns true if the term appears to be a vehicle keyword, false if SKU
 */
export function detectVehicleKeyword(term: string): boolean {
  const normalized = term.trim().toLowerCase();

  // Too short to be meaningful
  if (normalized.length < 3) return false;

  // Starts with ACR prefix - definitely a SKU
  if (normalized.startsWith("acr")) return false;

  // Matches SKU patterns: digits, or alphanumeric with hyphens containing numbers
  // Examples: "512348", "15002", "ACR-15002", "WB-123", "TM515072", "MC0335"
  if (/^\d+$/.test(normalized)) return false; // Pure digits = SKU
  if (/^[a-z]+-\d+/i.test(normalized)) return false; // "prefix-numbers" = SKU (e.g. WB-123)
  if (/^[a-z]{1,4}\d+/i.test(normalized)) return false; // Letters then digits = competitor SKU (e.g. TM515072, MC0335)

  // Contains mostly letters (with optional spaces/hyphens) = vehicle keyword
  // Examples: "mustang", "f-150", "monte carlo", "chevy"
  return /^[a-z][a-z0-9\s-]*$/i.test(normalized);
}

/**
 * Normalizes a search term for consistent matching
 *
 * @param term - The search term to normalize
 * @returns Normalized search term (trimmed, uppercase for vehicle, original case for SKU)
 */
export function normalizeSearchTerm(term: string): string {
  return term.trim();
}
