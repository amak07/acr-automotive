import { Database } from "@/lib/supabase/types";

// Types for database operations - Parts
export type DatabasePart = Database["public"]["Tables"]["parts"]["Insert"];
export type DatabasePartRow = Database["public"]["Tables"]["parts"]["Row"];

// Types for database operations - Cross References
export type DatabaseCrossRef =
  Database["public"]["Tables"]["cross_references"]["Insert"];
export type DatabaseCrossRefRow =
  Database["public"]["Tables"]["cross_references"]["Row"];

// Types for database operations - Vehicle Applications
export type DatabaseVehicleApp =
  Database["public"]["Tables"]["vehicle_applications"]["Insert"];
export type DatabaseVehicleAppRow =
  Database["public"]["Tables"]["vehicle_applications"]["Row"];

// Parts with summary counts for list views
export type PartSummary = DatabasePartRow & {
  vehicle_count: number;
  cross_reference_count: number;
};

// Parts with full relationship data for detail views
export type PartWithDetails = DatabasePartRow & {
  vehicle_applications: Array<{
    id: string;
    part_id: string;
    make: string;
    model: string;
    start_year: number;
    end_year: number;
    created_at: string;
    updated_at: string;
  }>;
  cross_references: Array<{
    id: string;
    acr_part_id: string;
    competitor_sku: string;
    competitor_brand: string | null;
    created_at: string;
    updated_at: string;
  }>;
  vehicle_count?: number;
  cross_reference_count?: number;
};

// Legacy aliases for backward compatibility
/** @deprecated Use PartSummary instead */
export type EnrichedPart = PartSummary;
/** @deprecated Use PartWithDetails instead */
export type PartWithRelations = PartWithDetails;
