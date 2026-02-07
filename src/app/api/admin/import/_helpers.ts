// ============================================================================
// Import API Helpers - Shared utilities
// ============================================================================

import { supabase } from '@/lib/supabase/client';
import type { ExistingDatabaseData } from '@/services/excel/validation/ValidationEngine';
import type {
  ExcelPartRow,
  ExcelVehicleAppRow,
  ExcelCrossRefRow,
} from '@/services/excel/shared/types';

const PAGE_SIZE = 1000;

/**
 * Fetch all existing database data with pagination
 * Used by validation and diff engines
 */
export async function fetchExistingData(): Promise<ExistingDatabaseData> {
  // Fetch all parts with pagination
  const parts = new Map<string, ExcelPartRow>();
  const partSkus = new Set<string>();

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
        parts.set(part.id, {
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
      });
      hasMoreParts = partsData.length === PAGE_SIZE;
      partsPage++;
    } else {
      hasMoreParts = false;
    }
  }

  // Fetch all vehicle applications with pagination
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
        vehicleApplications.set(va.id, {
          _id: va.id,
          _part_id: va.part_id,
          acr_sku: '', // Not stored in DB, computed on export
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

  // Fetch all cross references with pagination
  const crossReferences = new Map<string, ExcelCrossRefRow>();

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
          _acr_part_id: cr.acr_part_id,
          acr_sku: '', // Not stored in DB, computed on export
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

  return {
    parts,
    vehicleApplications,
    crossReferences,
    partSkus,
  };
}
