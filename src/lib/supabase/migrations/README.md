# Database Migrations

This directory contains database migrations for ACR Automotive.

## How to Apply Migrations

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your project
2. Click **SQL Editor** in the left sidebar
3. Open the migration file (e.g., `001_add_part_images.sql`)
4. Copy and paste the SQL into the editor
5. Click **Run**
6. Update the status below when applied

## Migration History

| # | File | Description | Status | Applied Date |
|---|------|-------------|--------|--------------|
| - | `schema.sql` | Initial database schema | ✅ Applied | Sept 7, 2025 |
| 001 | `001_add_part_images.sql` | Multiple images per part (Feature 2.3) | ✅ Applied | Oct 11, 2025 |
| 002 | `002_update_search_functions.sql` | Enhanced search functions | ✅ Applied | Oct 13, 2025 |
| 003 | `003_add_site_settings.sql` | Site settings table (Feature 2.4) | ✅ Applied | Oct 15, 2025 |
| 004 | `004_add_360_viewer.sql` | 360° interactive viewer (Phase 7) | ✅ Applied | Oct 17, 2025 |
| 005 | `005_add_tenant_id.sql` | Multi-tenancy preparation (Phase 8.1) | ✅ Applied | Oct 22, 2025 |
| 006 | `006_add_import_history.sql` | Import rollback support (Phase 8.1) | ✅ Applied | Oct 22, 2025 |
| 007 | `007_add_updated_at_tracking.sql` | Automatic timestamp tracking (Phase 8.2) | ✅ Applied | Oct 27, 2025 |
| 008 | `008_add_atomic_import_transaction.sql` | Atomic import transactions (Phase 8.2) | ✅ Applied | Oct 28, 2025 |

## Upcoming Migrations

_No pending migrations at this time._

## Important Notes

- ✅ All migrations are **idempotent** (safe to re-run)
- ✅ Migrations 005-006 are **backward compatible** (no breaking changes)
- ⚠️ Always backup your database before applying migrations
- 📝 Migrations are applied manually via Supabase SQL Editor
- 📚 Keep this README updated when applying migrations
- 🔍 Migration files are version controlled for documentation
- **📖 IMPORTANT**: When updating migrations, also update `docs/database/DATABASE.md` with the changes

## Testing Migrations Locally

If using local Supabase (via `supabase start`):

```bash
# Apply migration
supabase migration up

# Check status
supabase migration list
```

For production, use Supabase Dashboard SQL Editor (manual process).
