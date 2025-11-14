/**
 * SKU Utilities
 * Helper functions for SKU-based routing and lookups
 */

import { supabase } from "@/lib/supabase/client";

/**
 * Normalize SKU to uppercase for consistent lookups
 */
export function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase();
}

/**
 * Encode SKU for use in URLs
 */
export function encodeSku(sku: string): string {
  return encodeURIComponent(normalizeSku(sku));
}

/**
 * Decode SKU from URL parameter
 */
export function decodeSku(encodedSku: string): string {
  return normalizeSku(decodeURIComponent(encodedSku));
}

/**
 * Lookup part UUID by ACR SKU
 * @param sku - The ACR SKU to lookup
 * @returns UUID of the part, or null if not found
 */
export async function getPartIdBySku(sku: string): Promise<string | null> {
  const normalizedSku = normalizeSku(sku);

  const { data, error } = await supabase
    .from("parts")
    .select("id")
    .eq("acr_sku", normalizedSku)
    .single();

  if (error || !data) {
    return null;
  }

  return data.id;
}

/**
 * Validate if a string is a valid UUID format
 */
export function isUuid(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}
