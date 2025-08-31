import { Database } from "./types";

// Types for database operations
export type DatabasePart = Database["public"]["Tables"]["parts"]["Insert"]; // Data inserted.
export type DatabasePartRow = Database["public"]["Tables"]["parts"]["Row"]; // Data returned from an insert.
export type DatabaseCrossRef =
  Database["public"]["Tables"]["cross_references"]["Insert"];
export type DatabaseCrossRefRow =
  Database["public"]["Tables"]["cross_references"]["Row"]; // Data returned from an insert.
export type DatabaseVehicleApp =
  Database["public"]["Tables"]["vehicle_applications"]["Insert"];
export type DatabaseVehicleAppRow =
  Database["public"]["Tables"]["vehicle_applications"]["Row"]; // Data returned from an insert.
