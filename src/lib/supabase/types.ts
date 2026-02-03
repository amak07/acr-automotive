export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  pgbouncer: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_auth: {
        Args: { p_usename: string };
        Returns: {
          password: string;
          username: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      cross_references: {
        Row: {
          acr_part_id: string;
          competitor_brand: string | null;
          competitor_sku: string;
          competitor_sku_normalized: string | null;
          created_at: string | null;
          id: string;
          tenant_id: string | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          acr_part_id: string;
          competitor_brand?: string | null;
          competitor_sku: string;
          competitor_sku_normalized?: string | null;
          created_at?: string | null;
          id?: string;
          tenant_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          acr_part_id?: string;
          competitor_brand?: string | null;
          competitor_sku?: string;
          competitor_sku_normalized?: string | null;
          created_at?: string | null;
          id?: string;
          tenant_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cross_references_acr_part_id_fkey";
            columns: ["acr_part_id"];
            referencedRelation: "parts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cross_references_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      import_history: {
        Row: {
          created_at: string | null;
          file_name: string;
          file_size_bytes: number | null;
          id: string;
          import_summary: Json | null;
          imported_by: string | null;
          rows_imported: number;
          snapshot_data: Json;
          tenant_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          file_name: string;
          file_size_bytes?: number | null;
          id?: string;
          import_summary?: Json | null;
          imported_by?: string | null;
          rows_imported?: number;
          snapshot_data: Json;
          tenant_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          file_name?: string;
          file_size_bytes?: number | null;
          id?: string;
          import_summary?: Json | null;
          imported_by?: string | null;
          rows_imported?: number;
          snapshot_data?: Json;
          tenant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "import_history_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      part_360_frames: {
        Row: {
          created_at: string | null;
          file_size_bytes: number | null;
          frame_number: number;
          height: number | null;
          id: string;
          image_url: string;
          part_id: string;
          storage_path: string;
          tenant_id: string | null;
          width: number | null;
        };
        Insert: {
          created_at?: string | null;
          file_size_bytes?: number | null;
          frame_number: number;
          height?: number | null;
          id?: string;
          image_url: string;
          part_id: string;
          storage_path: string;
          tenant_id?: string | null;
          width?: number | null;
        };
        Update: {
          created_at?: string | null;
          file_size_bytes?: number | null;
          frame_number?: number;
          height?: number | null;
          id?: string;
          image_url?: string;
          part_id?: string;
          storage_path?: string;
          tenant_id?: string | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "part_360_frames_part_id_fkey";
            columns: ["part_id"];
            referencedRelation: "parts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "part_360_frames_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      part_images: {
        Row: {
          caption: string | null;
          created_at: string | null;
          display_order: number;
          id: string;
          image_url: string;
          is_primary: boolean | null;
          part_id: string;
          tenant_id: string | null;
          updated_at: string | null;
          view_type: string | null;
        };
        Insert: {
          caption?: string | null;
          created_at?: string | null;
          display_order?: number;
          id?: string;
          image_url: string;
          is_primary?: boolean | null;
          part_id: string;
          tenant_id?: string | null;
          updated_at?: string | null;
          view_type?: string | null;
        };
        Update: {
          caption?: string | null;
          created_at?: string | null;
          display_order?: number;
          id?: string;
          image_url?: string;
          is_primary?: boolean | null;
          part_id?: string;
          tenant_id?: string | null;
          updated_at?: string | null;
          view_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "part_images_part_id_fkey";
            columns: ["part_id"];
            referencedRelation: "parts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "part_images_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      parts: {
        Row: {
          abs_type: string | null;
          acr_sku: string;
          acr_sku_normalized: string | null;
          bolt_pattern: string | null;
          created_at: string | null;
          drive_type: string | null;
          has_360_viewer: boolean | null;
          has_product_images: boolean | null;
          id: string;
          part_type: string;
          position_type: string | null;
          specifications: string | null;
          tenant_id: string | null;
          updated_at: string | null;
          updated_by: string | null;
          viewer_360_frame_count: number | null;
          workflow_status: Database["public"]["Enums"]["workflow_status_enum"];
        };
        Insert: {
          abs_type?: string | null;
          acr_sku: string;
          acr_sku_normalized?: string | null;
          bolt_pattern?: string | null;
          created_at?: string | null;
          drive_type?: string | null;
          has_360_viewer?: boolean | null;
          has_product_images?: boolean | null;
          id?: string;
          part_type: string;
          position_type?: string | null;
          specifications?: string | null;
          tenant_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          viewer_360_frame_count?: number | null;
          workflow_status?: Database["public"]["Enums"]["workflow_status_enum"];
        };
        Update: {
          abs_type?: string | null;
          acr_sku?: string;
          acr_sku_normalized?: string | null;
          bolt_pattern?: string | null;
          created_at?: string | null;
          drive_type?: string | null;
          has_360_viewer?: boolean | null;
          has_product_images?: boolean | null;
          id?: string;
          part_type?: string;
          position_type?: string | null;
          specifications?: string | null;
          tenant_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          viewer_360_frame_count?: number | null;
          workflow_status?: Database["public"]["Enums"]["workflow_status_enum"];
        };
        Relationships: [
          {
            foreignKeyName: "parts_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      site_settings: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          key: string;
          updated_at: string | null;
          value: Json;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          key: string;
          updated_at?: string | null;
          value: Json;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          key?: string;
          updated_at?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      tenants: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          slug: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          slug: string;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          email: string;
          full_name: string | null;
          id: string;
          is_active: boolean;
          is_owner: boolean;
          last_login_at: string | null;
          role: Database["public"]["Enums"]["user_role"];
          tenant_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          email: string;
          full_name?: string | null;
          id: string;
          is_active?: boolean;
          is_owner?: boolean;
          last_login_at?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          tenant_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          is_owner?: boolean;
          last_login_at?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          tenant_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicle_aliases: {
        Row: {
          alias: string;
          alias_type: string;
          canonical_name: string;
          created_at: string | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          alias: string;
          alias_type: string;
          canonical_name: string;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          alias?: string;
          alias_type?: string;
          canonical_name?: string;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      vehicle_applications: {
        Row: {
          created_at: string | null;
          end_year: number;
          id: string;
          make: string;
          model: string;
          part_id: string;
          start_year: number;
          tenant_id: string | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          end_year: number;
          id?: string;
          make: string;
          model: string;
          part_id: string;
          start_year: number;
          tenant_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          end_year?: number;
          id?: string;
          make?: string;
          model?: string;
          part_id?: string;
          start_year?: number;
          tenant_id?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "vehicle_applications_part_id_fkey";
            columns: ["part_id"];
            referencedRelation: "parts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicle_applications_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      execute_atomic_import: {
        Args: {
          cross_refs_to_add?: Json;
          cross_refs_to_delete?: Json;
          cross_refs_to_update?: Json;
          parts_to_add?: Json;
          parts_to_delete?: Json;
          parts_to_update?: Json;
          tenant_id_filter?: string;
          vehicles_to_add?: Json;
          vehicles_to_delete?: Json;
          vehicles_to_update?: Json;
        };
        Returns: {
          cross_refs_added: number;
          cross_refs_deleted: number;
          cross_refs_updated: number;
          parts_added: number;
          parts_deleted: number;
          parts_updated: number;
          vehicles_added: number;
          vehicles_deleted: number;
          vehicles_updated: number;
        }[];
      };
      get_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_authenticated_user: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      normalize_sku: { Args: { input_sku: string }; Returns: string };
      search_by_sku: {
        Args: { search_term: string };
        Returns: {
          abs_type: string;
          acr_sku: string;
          bolt_pattern: string;
          created_at: string;
          drive_type: string;
          has_360_viewer: boolean;
          has_product_images: boolean;
          id: string;
          match_type: string;
          part_type: string;
          position_type: string;
          similarity_score: number;
          specifications: string;
          updated_at: string;
          workflow_status: Database["public"]["Enums"]["workflow_status_enum"];
        }[];
      };
      search_by_vehicle: {
        Args: { p_make?: string; p_model?: string; p_year?: number };
        Returns: {
          abs_type: string;
          acr_sku: string;
          bolt_pattern: string;
          drive_type: string;
          id: string;
          part_type: string;
          position_type: string;
          primary_image_url: string;
          specifications: string;
          workflow_status: Database["public"]["Enums"]["workflow_status_enum"];
        }[];
      };
      search_by_vehicle_keyword:
        | {
            Args: { keyword: string; year_filter?: number };
            Returns: {
              abs_type: string;
              acr_sku: string;
              bolt_pattern: string;
              drive_type: string;
              id: string;
              part_type: string;
              position_type: string;
              primary_image_url: string;
              specifications: string;
              workflow_status: Database["public"]["Enums"]["workflow_status_enum"];
            }[];
          }
        | {
            Args: { search_term: string };
            Returns: {
              abs_type: string;
              acr_sku: string;
              bolt_pattern: string;
              created_at: string;
              drive_type: string;
              has_360_viewer: boolean;
              has_product_images: boolean;
              id: string;
              match_type: string;
              matched_vehicle: string;
              part_type: string;
              position_type: string;
              specifications: string;
              updated_at: string;
            }[];
          };
      show_limit: { Args: Record<PropertyKey, never>; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
    };
    Enums: {
      user_role: "admin" | "data_manager";
      workflow_status_enum: "ACTIVE" | "INACTIVE" | "DELETE";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          type: Database["storage"]["Enums"]["buckettype"];
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      buckets_analytics: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          format: string;
          id: string;
          name: string;
          type: Database["storage"]["Enums"]["buckettype"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          format?: string;
          id?: string;
          name: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          format?: string;
          id?: string;
          name?: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Relationships: [];
      };
      buckets_vectors: {
        Row: {
          created_at: string;
          id: string;
          type: Database["storage"]["Enums"]["buckettype"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Relationships: [];
      };
      iceberg_namespaces: {
        Row: {
          bucket_name: string;
          catalog_id: string;
          created_at: string;
          id: string;
          metadata: Json;
          name: string;
          updated_at: string;
        };
        Insert: {
          bucket_name: string;
          catalog_id: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          name: string;
          updated_at?: string;
        };
        Update: {
          bucket_name?: string;
          catalog_id?: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey";
            columns: ["catalog_id"];
            referencedRelation: "buckets_analytics";
            referencedColumns: ["id"];
          },
        ];
      };
      iceberg_tables: {
        Row: {
          bucket_name: string;
          catalog_id: string;
          created_at: string;
          id: string;
          location: string;
          name: string;
          namespace_id: string;
          remote_table_id: string | null;
          shard_id: string | null;
          shard_key: string | null;
          updated_at: string;
        };
        Insert: {
          bucket_name: string;
          catalog_id: string;
          created_at?: string;
          id?: string;
          location: string;
          name: string;
          namespace_id: string;
          remote_table_id?: string | null;
          shard_id?: string | null;
          shard_key?: string | null;
          updated_at?: string;
        };
        Update: {
          bucket_name?: string;
          catalog_id?: string;
          created_at?: string;
          id?: string;
          location?: string;
          name?: string;
          namespace_id?: string;
          remote_table_id?: string | null;
          shard_id?: string | null;
          shard_key?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey";
            columns: ["catalog_id"];
            referencedRelation: "buckets_analytics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey";
            columns: ["namespace_id"];
            referencedRelation: "iceberg_namespaces";
            referencedColumns: ["id"];
          },
        ];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          user_metadata: Json | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey";
            columns: ["bucket_id"];
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      s3_multipart_uploads: {
        Row: {
          bucket_id: string;
          created_at: string;
          id: string;
          in_progress_size: number;
          key: string;
          owner_id: string | null;
          upload_signature: string;
          user_metadata: Json | null;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          id: string;
          in_progress_size?: number;
          key: string;
          owner_id?: string | null;
          upload_signature: string;
          user_metadata?: Json | null;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          id?: string;
          in_progress_size?: number;
          key?: string;
          owner_id?: string | null;
          upload_signature?: string;
          user_metadata?: Json | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey";
            columns: ["bucket_id"];
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string;
          created_at: string;
          etag: string;
          id: string;
          key: string;
          owner_id: string | null;
          part_number: number;
          size: number;
          upload_id: string;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          etag: string;
          id?: string;
          key: string;
          owner_id?: string | null;
          part_number: number;
          size?: number;
          upload_id: string;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          etag?: string;
          id?: string;
          key?: string;
          owner_id?: string | null;
          part_number?: number;
          size?: number;
          upload_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey";
            columns: ["bucket_id"];
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey";
            columns: ["upload_id"];
            referencedRelation: "s3_multipart_uploads";
            referencedColumns: ["id"];
          },
        ];
      };
      vector_indexes: {
        Row: {
          bucket_id: string;
          created_at: string;
          data_type: string;
          dimension: number;
          distance_metric: string;
          id: string;
          metadata_configuration: Json | null;
          name: string;
          updated_at: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          data_type: string;
          dimension: number;
          distance_metric: string;
          id?: string;
          metadata_configuration?: Json | null;
          name: string;
          updated_at?: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          data_type?: string;
          dimension?: number;
          distance_metric?: string;
          id?: string;
          metadata_configuration?: Json | null;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey";
            columns: ["bucket_id"];
            referencedRelation: "buckets_vectors";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string };
        Returns: undefined;
      };
      extension: { Args: { name: string }; Returns: string };
      filename: { Args: { name: string }; Returns: string };
      foldername: { Args: { name: string }; Returns: string[] };
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string };
        Returns: string;
      };
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>;
        Returns: {
          bucket_id: string;
          size: number;
        }[];
      };
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_key_token?: string;
          next_upload_token?: string;
          prefix_param: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
        }[];
      };
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_token?: string;
          prefix_param: string;
          sort_order?: string;
          start_after?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      operation: { Args: Record<PropertyKey, never>; Returns: string };
      search: {
        Args: {
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_by_timestamp: {
        Args: {
          p_bucket_id: string;
          p_level: number;
          p_limit: number;
          p_prefix: string;
          p_sort_column: string;
          p_sort_column_after: string;
          p_sort_order: string;
          p_start_after: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_v2: {
        Args: {
          bucket_name: string;
          levels?: number;
          limits?: number;
          prefix: string;
          sort_column?: string;
          sort_column_after?: string;
          sort_order?: string;
          start_after?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
    };
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  pgbouncer: {
    Enums: {},
  },
  public: {
    Enums: {
      user_role: ["admin", "data_manager"],
      workflow_status_enum: ["ACTIVE", "INACTIVE", "DELETE"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const;
