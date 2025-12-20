# Archive: Historical Schema Files

## Purpose

This directory contains historical database schema files preserved for:
- **Learning & Reference**: Understanding how the schema evolved over time
- **RAG System**: Future AI-powered documentation search will index these files
- **Decision Documentation**: Reviewing past architectural decisions
- **Team Onboarding**: Helping new developers understand the database evolution

## Important Note

**These files are ARCHIVED and should NOT be used for database operations.**

The active schema is managed through:
- **Current migrations**: `supabase/migrations/*.sql`
- **Complete reference**: `docs/database/DATABASE.md`

## Files in This Archive

### 001-initial-schema.sql
**Created**: September 2025

This was the initial "learning version" schema - kept here as a reference copy. The active version is now at `supabase/migrations/20250907000000_initial_schema.sql`.

## Active Migrations Location

All migrations are now in `supabase/migrations/` with proper timestamps:

| Timestamp | Name | Purpose |
|-----------|------|---------|
| 20250907000000 | initial_schema | Base tables, extensions, RLS |
| 20251011000000 | add_part_images | Multiple images per part |
| 20251013000000 | update_search_functions | Remove image_url from functions |
| 20251013010000 | add_site_settings | Site settings table |
| 20251017000000 | add_360_viewer | 360° viewer support |
| 20251022000000 | add_tenant_id | Multi-tenancy columns |
| 20251022010000 | add_import_history | Import rollback support |
| 20251027000000 | add_updated_at_tracking | Conflict detection |
| 20251028000000 | add_atomic_import_transaction | Atomic import function |
| 20251109000000 | add_sku_normalization | normalize_sku function |
| 20251115182620 | create_storage_bucket | Storage bucket setup |
| 20251216163858 | add_has_product_images | has_product_images column |
| 20251217111259 | add_view_type_to_part_images | view_type column |

## Related Documentation

- **Current schema**: `docs/database/DATABASE.md`
- **Migration workflow**: `supabase/migrations/README.md`
- **Architecture**: `docs/PLANNING.md`
- **Scripts reference**: `SCRIPTS.md`

---

*These files are preserved for historical learning and are maintained for future RAG system integration.*
