# Supabase Database Context

## Migration Conventions

**Naming**: `YYYYMMDD[hhmmss]_description.sql`
- First migration of day: `20260203000000_add_feature.sql`
- Same-day follow-up: `20260203010000_fix_feature.sql`
- Description: snake_case, starts with verb (add_, fix_, drop_, update_)

## Critical Rule: DROP Before Modifying Functions

PostgreSQL CANNOT change function return types or parameter names with `CREATE OR REPLACE`.
You MUST `DROP FUNCTION IF EXISTS` first:

```sql
-- WRONG - Will fail if return type or parameter names change
CREATE OR REPLACE FUNCTION search_by_sku(search_sku TEXT)
RETURNS TABLE (...new columns...)

-- CORRECT - Always safe
DROP FUNCTION IF EXISTS search_by_sku(TEXT);
CREATE OR REPLACE FUNCTION search_by_sku(search_sku TEXT)
RETURNS TABLE (...new columns...)
```

**Why?** PostgreSQL treats function signature (name + parameter types) as identity. Changing:
- Return type columns
- Parameter names (even with same types)
- Adding/removing parameters

...all require dropping the old function first.

## When to Invoke Skills

**Before any database schema changes**, invoke:
- `/supabase-postgres-best-practices` - Performance optimization and indexing

## Checklist for New Migrations

1. Use `IF NOT EXISTS` for tables, indexes, types
2. Use `DROP FUNCTION IF EXISTS` before function changes
3. Use `ON CONFLICT` for idempotent inserts
4. Add comments explaining the migration purpose
5. Test locally: `npx.cmd supabase db reset`

## File Structure

```
supabase/
├── config.toml          # Supabase configuration (storage buckets here!)
├── migrations/          # All SQL migrations (ordered by timestamp)
│   ├── 20250907000000_initial_schema.sql
│   ├── 20251011000000_add_part_images.sql
│   └── ...
└── CLAUDE.md            # This file (local context)
```

## Pull-Based Workflow

1. Make schema changes on remote TEST database
2. Pull diff: `npx.cmd supabase db diff --linked -f description`
3. Commit migration file
4. Team applies: `npm.cmd run supabase:reset`

## Important Notes

- **Storage buckets**: Defined in `config.toml`, NOT in migrations (migrations only capture PostgreSQL schema)
- **Archive folder**: `archive/migrations/` contains historical schema files for learning reference only
- **Local dev**: Docker Supabase with seed data from `tests/fixtures/seed-data.sql`
