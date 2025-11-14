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
**Original Location**: `src/lib/supabase/schema.sql`
**Created**: September 2025
**Archived**: November 2025

This was the initial "learning version" schema that bootstrapped the ACR Automotive database:
- Core 3-table design (parts, vehicle_applications, cross_references)
- Initial extensions (uuid-ossp, pg_trgm)
- Base indexes for performance
- Original RLS policies

**Superseded by**: `supabase/migrations/20251109204841_remote_schema.sql`

The active migration now contains the complete current schema including all subsequent changes:
- Additional tables (part_images, part_360_frames, site_settings, tenants, import_history)
- Performance optimizations
- Enhanced search functions
- Updated RLS policies

## How Schema Management Works Now

ACR Automotive uses a **pull-based schema workflow**:

1. **Remote TEST database** (Supabase cloud) is the source of truth
2. Schema changes are applied to remote TEST first
3. Developers pull schema diffs: `npx supabase db diff --linked`
4. This creates migration files in `supabase/migrations/`
5. Team applies migrations: `npm run supabase:reset`

See `docs/database/DATABASE.md` for complete workflow documentation.

## Related Documentation

- **Current schema**: `docs/database/DATABASE.md`
- **Migration workflow**: `supabase/migrations/README.md`
- **Architecture**: `docs/PLANNING.md`
- **Scripts reference**: `SCRIPTS.md`

---

*These files are preserved for historical learning and are maintained for future RAG system integration.*
