export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      cross_references: {
        Row: {
          acr_part_id: string
          competitor_brand: string | null
          competitor_sku: string
          created_at: string | null
          id: string
          tenant_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          acr_part_id: string
          competitor_brand?: string | null
          competitor_sku: string
          created_at?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          acr_part_id?: string
          competitor_brand?: string | null
          competitor_sku?: string
          created_at?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cross_references_acr_part_id_fkey"
            columns: ["acr_part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_references_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      import_history: {
        Row: {
          created_at: string | null
          file_name: string
          file_size_bytes: number | null
          id: string
          import_summary: Json | null
          imported_by: string | null
          rows_imported: number
          snapshot_data: Json
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size_bytes?: number | null
          id?: string
          import_summary?: Json | null
          imported_by?: string | null
          rows_imported?: number
          snapshot_data: Json
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          import_summary?: Json | null
          imported_by?: string | null
          rows_imported?: number
          snapshot_data?: Json
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      part_360_frames: {
        Row: {
          created_at: string | null
          file_size_bytes: number | null
          frame_number: number
          height: number | null
          id: string
          image_url: string
          part_id: string
          storage_path: string
          tenant_id: string | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          file_size_bytes?: number | null
          frame_number: number
          height?: number | null
          id?: string
          image_url: string
          part_id: string
          storage_path: string
          tenant_id?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          file_size_bytes?: number | null
          frame_number?: number
          height?: number | null
          id?: string
          image_url?: string
          part_id?: string
          storage_path?: string
          tenant_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "part_360_frames_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_360_frames_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      part_images: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number
          id: string
          image_url: string
          is_primary: boolean | null
          part_id: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_primary?: boolean | null
          part_id: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_primary?: boolean | null
          part_id?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_images_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_images_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          abs_type: string | null
          acr_sku: string
          bolt_pattern: string | null
          created_at: string | null
          drive_type: string | null
          has_360_viewer: boolean | null
          id: string
          part_type: string
          position_type: string | null
          specifications: string | null
          tenant_id: string | null
          updated_at: string | null
          updated_by: string | null
          viewer_360_frame_count: number | null
        }
        Insert: {
          abs_type?: string | null
          acr_sku: string
          bolt_pattern?: string | null
          created_at?: string | null
          drive_type?: string | null
          has_360_viewer?: boolean | null
          id?: string
          part_type: string
          position_type?: string | null
          specifications?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          viewer_360_frame_count?: number | null
        }
        Update: {
          abs_type?: string | null
          acr_sku?: string
          bolt_pattern?: string | null
          created_at?: string | null
          drive_type?: string | null
          has_360_viewer?: boolean | null
          id?: string
          part_type?: string
          position_type?: string | null
          specifications?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          viewer_360_frame_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicle_applications: {
        Row: {
          created_at: string | null
          end_year: number
          id: string
          make: string
          model: string
          part_id: string
          start_year: number
          tenant_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          end_year: number
          id?: string
          make: string
          model: string
          part_id: string
          start_year: number
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          end_year?: number
          id?: string
          make?: string
          model?: string
          part_id?: string
          start_year?: number
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_applications_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_applications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_by_sku: {
        Args: { search_sku: string }
        Returns: {
          abs_type: string
          acr_sku: string
          bolt_pattern: string
          created_at: string
          drive_type: string
          id: string
          match_type: string
          part_type: string
          position_type: string
          similarity_score: number
          specifications: string
          updated_at: string
        }[]
      }
      search_by_vehicle: {
        Args: { make: string; model: string; target_year: number }
        Returns: {
          abs_type: string
          acr_sku: string
          bolt_pattern: string
          created_at: string
          drive_type: string
          id: string
          part_type: string
          position_type: string
          specifications: string
          updated_at: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
