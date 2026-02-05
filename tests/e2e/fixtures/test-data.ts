/**
 * E2E Test Data — Derived from Local Seed Database
 *
 * All values verified via SQL queries against local Docker Supabase.
 * DB totals: 860 ACTIVE parts, 5 INACTIVE parts, 1000 vehicle_apps, 1000 cross_refs, 15 aliases.
 *
 * INACTIVE parts are set in scripts/db/import-seed-sql.ts after importing seed-data.sql.
 * Re-seed with: npm run db:import-seed
 */

// ---------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------

/** ACTIVE parts — appear in search results (workflow_status = 'ACTIVE') */
export const ACTIVE_SKUS = {
  /** MAZA type, has FAG + SYD cross-refs and vehicle apps. position_type = DELANTERA */
  ACR2302006: { partType: "MAZA", positionType: "DELANTERA" },
  /** MAZA type, NATIONAL cross-ref */
  ACR2302007: { partType: "MAZA", positionType: null },
  /** MAZA type, TMK + FAG cross-refs */
  ACR2306010: { partType: "MAZA", positionType: null },
  /** MAZA type, minimal cross-refs */
  ACR518507: { partType: "MAZA", positionType: null },
  /** Rich part: 9 cross-refs, 22 vehicle apps (BMW). position_type = DELANTERA */
  ACR513254: { partType: "MAZA", positionType: "DELANTERA" },
} as const;

/** Shorthand array of ACTIVE SKUs for iteration */
export const VALID_ACR_SKUS = Object.keys(ACTIVE_SKUS) as Array<
  keyof typeof ACTIVE_SKUS
>;

/**
 * INACTIVE parts — excluded from search by workflow_status filter.
 * Set in scripts/db/import-seed-sql.ts. Each has cross-refs and/or vehicle apps
 * that should NOT appear in results.
 */
export const INACTIVE_SKUS = {
  /** MC2133-S (ATV) sole target. Searching MC2133-S should return empty. */
  ACR512220: { partType: "PENDING", crossRefFrom: "MC2133-S" },
  /** MC2136-S (ATV), TM512136 (TMK). Vehicle apps: CHRYSLER SEBRING, DODGE AVENGER. */
  ACR512136: { partType: "MAZA", crossRefFrom: "TM512136" },
  /** 22 BMW vehicle apps. MW7318-S (ATV), TM513125 (TMK). */
  ACR513125: { partType: "MAZA", crossRefFrom: "TM513125" },
  /** 10 AUDI vehicle apps (A4 QUATTRO 2002-2008, S4, A6, etc.). TM512305 (TMK). */
  ACR512305: { partType: "MAZA", crossRefFrom: "TM512305" },
  /** Plain SKU with no significant relationships. Direct search exclusion test. */
  ACR513014: { partType: "MAZA", crossRefFrom: null },
} as const;

/** Shorthand array of INACTIVE SKUs for iteration */
export const INACTIVE_ACR_SKUS = Object.keys(INACTIVE_SKUS) as Array<
  keyof typeof INACTIVE_SKUS
>;

// ---------------------------------------------------------------------------
// Cross-References (verified via SQL JOIN cross_references → parts)
// ---------------------------------------------------------------------------

/** Cross-refs where ALL target parts are ACTIVE → should return results */
export const ACTIVE_CROSS_REFS = {
  /** ATV MC0335 → ACR513158, ACR513159 (both ACTIVE, MAZA) */
  MC0335: { brand: "ATV", expectedAcrSkus: ["ACR513158", "ACR513159"] },
  /** TMK TM515072 → ACR2306010 (ACTIVE) */
  TM515072: { brand: "TMK", expectedAcrSkus: ["ACR2306010"] },
  /** FAG "713 6493 80" → ACR2302006 (ACTIVE) — tests spaces in SKU */
  "713 6493 80": { brand: "FAG", expectedAcrSkus: ["ACR2302006"] },
  /** SYD "2302006" → ACR2302006 + ACR513254 (both ACTIVE) — pure digit cross-ref */
  "2302006": { brand: "SYD", expectedAcrSkus: ["ACR2302006", "ACR513254"] },
  /** FAG "102011" → ACR2306010 (ACTIVE) */
  "102011": { brand: "FAG", expectedAcrSkus: ["ACR2306010"] },
  /** OEM "05181925AB" → ACR2306055 + ACR512555 (both ACTIVE) — OEM part number */
  "05181925AB": { brand: "OEM", expectedAcrSkus: ["ACR2306055", "ACR512555"] },
} as const;

/** Cross-refs where the sole target part is INACTIVE → should return empty */
export const INACTIVE_CROSS_REFS = {
  /** ATV MC2133-S → ACR512220 (INACTIVE). Only target is INACTIVE. */
  "MC2133-S": { brand: "ATV", inactiveTarget: "ACR512220" },
  /** TMK TM512136 → ACR512136 (INACTIVE). */
  TM512136: { brand: "TMK", inactiveTarget: "ACR512136" },
  /** TMK TM513125 → ACR513125 (INACTIVE). */
  TM513125: { brand: "TMK", inactiveTarget: "ACR513125" },
} as const;

// ---------------------------------------------------------------------------
// Competitor Brands (from cross_references, excluding junk "-" entries)
// ---------------------------------------------------------------------------

export const COMPETITOR_BRANDS = [
  "ATV",
  "FAG",
  "GMB",
  "GROB",
  "GSP",
  "NATIONAL",
  "OEM",
  "OEM2",
  "RACE",
  "SYD",
  "TMK",
] as const;

// ---------------------------------------------------------------------------
// Vehicle Aliases (all 15, from vehicle_aliases table)
// ---------------------------------------------------------------------------

export const VEHICLE_ALIASES = {
  // Make aliases (10)
  beemer: { canonical: "BMW", type: "make", appsInDb: 105 },
  bimmer: { canonical: "BMW", type: "make", appsInDb: 105 },
  chevy: { canonical: "CHEVROLET", type: "make", appsInDb: 269 },
  vw: { canonical: "VOLKSWAGEN", type: "make", appsInDb: 0 },
  merc: { canonical: "MERCEDES-BENZ", type: "make", appsInDb: 0 },
  mercedes: { canonical: "MERCEDES-BENZ", type: "make", appsInDb: 0 },
  benz: { canonical: "MERCEDES-BENZ", type: "make", appsInDb: 0 },
  ram: { canonical: "DODGE-RAM", type: "make", appsInDb: 139 },
  dodge: { canonical: "DODGE-RAM", type: "make", appsInDb: 139 },
  caddy: { canonical: "CADILLAC", type: "make", appsInDb: 57 },
  // Model aliases (5)
  stang: { canonical: "MUSTANG", type: "model", appsInDb: 5 },
  vette: { canonical: "CORVETTE", type: "model", appsInDb: 5 },
  cammy: { canonical: "CAMRY", type: "model", appsInDb: 0 },
  monte: { canonical: "MONTE CARLO", type: "model", appsInDb: 12 },
  slade: { canonical: "ESCALADE", type: "model", appsInDb: 9 },
} as const;

/** Aliases that have vehicle apps in the seed → should return results */
export const ALIASES_WITH_DATA = ["chevy", "dodge", "beemer", "caddy", "stang", "monte", "slade"] as const;

/** Aliases where the target has zero vehicle apps → should return empty */
export const ALIASES_WITHOUT_DATA = ["vw", "merc", "cammy"] as const;

// ---------------------------------------------------------------------------
// Vehicle Dropdown Combos (verified make+model+year against vehicle_applications)
// ---------------------------------------------------------------------------

export const VALID_VEHICLES = [
  /** ACURA MDX 2014-2020 → ACR512531 (ACTIVE). Year 2020 in range. */
  { make: "ACURA", model: "MDX", year: 2020, expectedSku: "ACR512531" },
  /** AUDI A4 QUATTRO 2009-2016 → ACR513301 (ACTIVE). Year 2015 in range. */
  { make: "AUDI", model: "A4 QUATTRO", year: 2015, expectedSku: "ACR513301" },
  /** ACURA CL 1997-1999 → ACR510038, ACR513098 (both ACTIVE). */
  { make: "ACURA", model: "CL", year: 1997, expectedSku: "ACR510038" },
  /** FORD EDGE 2007-2010 → ACR512334, ACR512335 (both ACTIVE). */
  { make: "FORD", model: "EDGE", year: 2010, expectedSku: "ACR512334" },
  /** CHEVROLET MONTE CARLO 2005-2007 → 12 parts. Rich test case. */
  { make: "CHEVROLET", model: "MONTE CARLO", year: 2006, expectedSku: "ACR512244" },
] as const;

/** Vehicle combo where INACTIVE part was the only match for a specific year range.
 *  AUDI A4 QUATTRO 2002-2008 → ACR512305 (INACTIVE). Year 2005 in range.
 *  Note: Other ACTIVE parts may still match if year ranges overlap. */
export const INACTIVE_VEHICLE_COMBO = {
  make: "AUDI",
  model: "A4 QUATTRO",
  year: 2005,
  inactiveSku: "ACR512305",
} as const;

// ---------------------------------------------------------------------------
// Catalog Stats
// ---------------------------------------------------------------------------

export const CATALOG_STATS = {
  totalParts: 865,
  activeParts: 860,
  inactiveParts: 5,
  partTypes: { MAZA: 740, PENDING: 125 },
  vehicleApps: 1000,
  crossRefs: 1000,
  aliases: 15,
  pageSize: 15,
} as const;

// ---------------------------------------------------------------------------
// Vehicle Keyword Patterns (trigger vehicle search via detectVehicleKeyword)
// ---------------------------------------------------------------------------

export const VEHICLE_KEYWORDS = {
  /** Direct model name, 5 apps in seed */
  singleWord: "mustang",
  /** Hyphenated model, 2 apps */
  withHyphen: "f-150",
  /** Multi-word model, 12 apps */
  multiWord: "monte carlo",
  /** Alias (3+ chars), resolves to CHEVROLET (269 apps) */
  alias: "chevy",
} as const;

// ---------------------------------------------------------------------------
// Invalid / Edge-Case Inputs (for error state testing)
// ---------------------------------------------------------------------------

export const INVALID_INPUTS = {
  nonExistentSku: "ACR999999",
  nonExistentCrossRef: "ZZZZZZ",
  sqlInjection: "'; DROP TABLE parts;--",
  xssAttempt: "<script>alert(1)</script>",
  unicode: "日本語",
  veryLongInput: "A".repeat(500),
  specialCharsOnly: "!@#$%^&*()",
  emptyString: "",
  singleChar: "A",
  twoChars: "AB",
} as const;

// ---------------------------------------------------------------------------
// SKU Pattern Detection (determines SKU search vs vehicle keyword search)
// ---------------------------------------------------------------------------

export const SKU_PATTERNS = {
  /** Starts with "ACR" → exact ACR SKU search */
  acrPrefix: "ACR2302006",
  /** Pure digits → treated as SKU search (could be cross-ref digit SKU) */
  pureDigits: "518507",
  /** Prefix-number with hyphen → treated as SKU search */
  prefixNumber: "WB-123",
} as const;
