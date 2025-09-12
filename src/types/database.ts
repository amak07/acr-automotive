import { Database } from "@/lib/supabase/types";

// Types for database operations - Parts
export type DatabasePart = Database["public"]["Tables"]["parts"]["Insert"];
export type DatabasePartRow = Database["public"]["Tables"]["parts"]["Row"];

// Types for database operations - Cross References
export type DatabaseCrossRef = Database["public"]["Tables"]["cross_references"]["Insert"];
export type DatabaseCrossRefRow = Database["public"]["Tables"]["cross_references"]["Row"];

// Types for database operations - Vehicle Applications
export type DatabaseVehicleApp = Database["public"]["Tables"]["vehicle_applications"]["Insert"];
export type DatabaseVehicleAppRow = Database["public"]["Tables"]["vehicle_applications"]["Row"];

// Enhanced types for API responses
export type EnrichedPart = DatabasePartRow & {
  vehicle_count: number;
  cross_reference_count: number;
};

// Parts with joined relationships
export type PartWithRelations = DatabasePartRow & {
  vehicle_applications: Array<{ id: string }>;
  cross_references: Array<{ id: string }>;
};