/**
 * Supabase Client Configuration
 * 
 * This file configures the Supabase client for ACR Automotive.
 * Supabase provides database, authentication, and storage services.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Supabase Client Instance
 * 
 * This client is used for all database operations:
 * - Parts catalog management
 * - Vehicle applications
 * - Cross-reference lookups
 * - Image storage operations
 */
export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Database Types
 * 
 * These will be auto-generated once we set up the database schema
 */
export type Database = {
  public: {
    Tables: {
      parts: {
        Row: {
          id: string
          acr_sku: string
          competitor_sku: string | null
          part_type: string
          position_type: string | null
          abs_type: string | null
          bolt_pattern: string | null
          drive_type: string | null
          specifications: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          acr_sku: string
          competitor_sku?: string | null
          part_type: string
          position_type?: string | null
          abs_type?: string | null
          bolt_pattern?: string | null
          drive_type?: string | null
          specifications?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          acr_sku?: string
          competitor_sku?: string | null
          part_type?: string
          position_type?: string | null
          abs_type?: string | null
          bolt_pattern?: string | null
          drive_type?: string | null
          specifications?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicle_applications: {
        Row: {
          id: string
          part_id: string
          make: string
          model: string
          year_range: string
          created_at: string
        }
        Insert: {
          id?: string
          part_id: string
          make: string
          model: string
          year_range: string
          created_at?: string
        }
        Update: {
          id?: string
          part_id?: string
          make?: string
          model?: string
          year_range?: string
          created_at?: string
        }
      }
      cross_references: {
        Row: {
          id: string
          acr_part_id: string
          competitor_sku: string
          competitor_brand: string | null
          created_at: string
        }
        Insert: {
          id?: string
          acr_part_id: string
          competitor_sku: string
          competitor_brand?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          acr_part_id?: string
          competitor_sku?: string
          competitor_brand?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_by_sku: {
        Args: {
          search_sku: string
        }
        Returns: Array<{
          id: string
          acr_sku: string
          competitor_sku: string | null
          part_type: string
          position_type: string | null
          abs_type: string | null
          bolt_pattern: string | null
          drive_type: string | null
          specifications: string | null
          image_url: string | null
          match_type: string
        }>
      }
      search_by_vehicle: {
        Args: {
          vehicle_make: string
          vehicle_model: string
          vehicle_year_range: string
          part_type_filter?: string
        }
        Returns: Array<{
          id: string
          acr_sku: string
          competitor_sku: string | null
          part_type: string
          position_type: string | null
          abs_type: string | null
          bolt_pattern: string | null
          drive_type: string | null
          specifications: string | null
          image_url: string | null
        }>
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}