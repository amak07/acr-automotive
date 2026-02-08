// ============================================================================
// Import API Helpers - Shared utilities
// ============================================================================

import { supabase } from '@/lib/supabase/client';
import type { ExistingDatabaseData } from '@/services/excel/validation/ValidationEngine';
import type {
  ExcelPartRow,
  ExcelVehicleAppRow,
  ExcelAliasRow,
} from '@/services/excel/shared/types';

const PAGE_SIZE = 1000;

/**
 * Fetch all existing database data with pagination
 * Used by validation and diff engines
 *
 * Data is keyed by business keys for SKU-based matching:
 * - Parts: keyed by acr_sku
 * - Vehicle Applications: keyed by composite "acr_sku::make::model"
 * - Aliases: keyed by composite "alias::canonical_name"
 * - Cross References: keyed by part UUID (for brand column diffing)
 */
export async function fetchExistingData(): Promise<ExistingDatabaseData> {
  // Fetch all parts with pagination — keyed by acr_sku
  const parts = new Map<string, ExcelPartRow>();
  const partSkus = new Set<string>();
  const partIdToSku = new Map<string, string>(); // UUID → acr_sku (for VA join)

  let partsPage = 0;
  let hasMoreParts = true;
  while (hasMoreParts) {
    const { data: partsData, error: partsError } = await supabase
      .from('parts')
      .select('*')
      .range(partsPage * PAGE_SIZE, (partsPage + 1) * PAGE_SIZE - 1);

    if (partsError) throw partsError;

    if (partsData && partsData.length > 0) {
      partsData.forEach((part) => {
        parts.set(part.acr_sku, {
          _id: part.id,
          acr_sku: part.acr_sku,
          part_type: part.part_type,
          position_type: part.position_type,
          abs_type: part.abs_type,
          bolt_pattern: part.bolt_pattern,
          drive_type: part.drive_type,
          specifications: part.specifications,
          workflow_status: part.workflow_status,
        });
        partSkus.add(part.acr_sku);
        partIdToSku.set(part.id, part.acr_sku);
      });
      hasMoreParts = partsData.length === PAGE_SIZE;
      partsPage++;
    } else {
      hasMoreParts = false;
    }
  }

  // Fetch all vehicle applications with pagination — keyed by composite "acr_sku::make::model::start_year"
  const vehicleApplications = new Map<string, ExcelVehicleAppRow>();

  let vaPage = 0;
  let hasMoreVa = true;
  while (hasMoreVa) {
    const { data: vaData, error: vaError } = await supabase
      .from('vehicle_applications')
      .select('*')
      .range(vaPage * PAGE_SIZE, (vaPage + 1) * PAGE_SIZE - 1);

    if (vaError) throw vaError;

    if (vaData && vaData.length > 0) {
      vaData.forEach((va) => {
        // Resolve acr_sku from part_id
        const acr_sku = partIdToSku.get(va.part_id) || '';
        const compositeKey = `${acr_sku}::${va.make}::${va.model}::${va.start_year}`;
        vehicleApplications.set(compositeKey, {
          _id: va.id,
          _part_id: va.part_id,
          acr_sku,
          make: va.make,
          model: va.model,
          start_year: va.start_year,
          end_year: va.end_year,
        });
      });
      hasMoreVa = vaData.length === PAGE_SIZE;
      vaPage++;
    } else {
      hasMoreVa = false;
    }
  }

  // Fetch all cross references with pagination — keyed by UUID (for brand column diffing)
  const crossReferences = new Map<string, { _id: string; acr_part_id: string; competitor_brand: string; competitor_sku: string }>();

  let crPage = 0;
  let hasMoreCr = true;
  while (hasMoreCr) {
    const { data: crData, error: crError } = await supabase
      .from('cross_references')
      .select('*')
      .range(crPage * PAGE_SIZE, (crPage + 1) * PAGE_SIZE - 1);

    if (crError) throw crError;

    if (crData && crData.length > 0) {
      crData.forEach((cr) => {
        crossReferences.set(cr.id, {
          _id: cr.id,
          acr_part_id: cr.acr_part_id,
          competitor_brand: cr.competitor_brand,
          competitor_sku: cr.competitor_sku,
        });
      });
      hasMoreCr = crData.length === PAGE_SIZE;
      crPage++;
    } else {
      hasMoreCr = false;
    }
  }

  // Fetch all vehicle aliases — keyed by composite "alias::canonical_name"
  const aliases = new Map<string, ExcelAliasRow>();

  const { data: aliasData, error: aliasError } = await supabase
    .from('vehicle_aliases')
    .select('id, alias, canonical_name, alias_type');

  if (aliasError) throw aliasError;

  if (aliasData) {
    aliasData.forEach((a) => {
      const compositeKey = `${a.alias.toLowerCase()}::${a.canonical_name.toUpperCase()}`;
      aliases.set(compositeKey, {
        _id: a.id,
        alias: a.alias,
        canonical_name: a.canonical_name,
        alias_type: a.alias_type,
      });
    });
  }

  return {
    parts,
    vehicleApplications,
    crossReferences,
    partSkus,
    aliases,
  };
}
