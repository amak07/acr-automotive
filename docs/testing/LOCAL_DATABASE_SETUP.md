---
title: "Local Test Database Setup"
---

# Local Test Database Setup

## Overview

Automated tests (`npm test`) run against a local Docker Postgres container, not remote Supabase.

**Benefits:**

- 6x faster tests (no network latency)
- Safe (can't wipe staging/production data)
- Offline capable
- Free (no Supabase API limits)

## Prerequisites

- Docker Desktop installed and running
- That's it!

## Quick Start

```bash
# Start test database
npm run db:test:start

# Run tests
npm test

# Stop database (optional - can leave running)
npm run db:test:stop
```

## Architecture

```
Local Development (npm run dev)
├─ Next.js: http://localhost:3000
└─ Database: Remote Supabase (.env.local)
   → Full features: Auth, RLS, Storage

Automated Tests (npm test)
├─ No dev server needed
└─ Database: Local Docker (localhost:5433)
   → Fast, isolated, repeatable
```

## Environment Configuration

**`.env.local`** - Used by `npm run dev`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

→ Remote Supabase with full features (Auth, RLS, Storage)

**`.env.local`** - Also used by `npm test`

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:54321/postgres
```

→ Local Docker Postgres (fast, isolated) - same file as dev server

## Manual Commands

```bash
# Start container + run migrations + seed data
npm run db:test:start

# Reset to clean state
npm run db:test:reset

# Stop container
npm run db:test:stop

# Connect with psql
psql postgresql://postgres:postgres@localhost:5433/acr_test

# View logs
docker logs acr-test-db

# Check if container is running
docker ps | grep acr-test-db
```

## What Gets Seeded

When you run `npm run db:test:start` or `npm run db:test:reset`:

1. **Schema** - All tables from `src/lib/supabase/schema.sql`
2. **Migrations** - Any files in `src/lib/supabase/migrations/`
3. **Seed Data** - Test parts from `fixtures/seed-data.sql` (~10 parts)

The database will have realistic test data you can use for manual queries or test development.

## Troubleshooting

### "Cannot connect to Docker daemon"

**Cause:** Docker Desktop not running
**Solution:** Start Docker Desktop application

### "Port 5433 already in use"

**Cause:** Another service using port 5433
**Solutions:**

1. Stop the conflicting service: `docker ps` then `docker stop <container>`
2. OR change port in `docker-compose.test.yml` and `.env.local`

### "Migrations failed" / SQL syntax errors

**Cause:** Issue in schema.sql or migration files
**Solutions:**

1. Check logs: `docker logs acr-test-db`
2. Verify SQL syntax in migration files
3. Try resetting: `npm run db:test:reset`

### "Seed data not loading"

**Cause:** Error in `fixtures/seed-data.sql`
**Solutions:**

1. Check file exists and has valid SQL
2. View logs: `docker logs acr-test-db`
3. Try manual seed:
   ```bash
   psql postgresql://postgres:postgres@localhost:5433/acr_test < fixtures/seed-data.sql
   ```

### Tests still failing with "database not found"

**Cause:** Tests not loading `.env.local`
**Solutions:**

1. Ensure file exists at project root
2. Check integration test scripts have `dotenv.config()` at top
3. Verify `DATABASE_URL` is set correctly

### Container won't start

**Cause:** Docker resources exhausted or corrupted volume
**Solutions:**

1. Remove old container: `docker rm -f acr-test-db`
2. Remove volume: `docker volume rm acr-test-data`
3. Restart Docker Desktop
4. Try starting again: `npm run db:test:start`

## Development Workflow

### Daily Development

```bash
# Morning: Start test database (or leave running overnight)
npm run db:test:start

# Work on features using remote Supabase
npm run dev

# Run tests before commits (uses local Docker)
npm test

# Evening: Stop database (optional)
npm run db:test:stop
```

### When Database State Gets Messy

```bash
# Reset to clean state (wipes everything and re-seeds)
npm run db:test:reset

# Now tests will pass with fresh data
npm test
```

### When Seed Data Changes

```bash
# After modifying fixtures/seed-data.sql
npm run db:test:reset  # Apply new seed data
npm test               # Verify tests still pass
```

### When Schema Changes

```bash
# After modifying schema.sql or adding migrations
npm run db:test:reset  # Apply new schema
npm test               # Verify compatibility
```

## Container Persistence

The Docker container uses a named volume (`acr-test-data`) to persist data between restarts.

**This means:**

- `npm run db:test:start` → Data persists after stop
- `npm run db:test:reset` → Data is wiped and re-seeded
- `npm run db:test:stop` → Container stops but volume remains

**To completely remove everything:**

```bash
docker-compose -f docker-compose.test.yml down -v  # Remove container + volume
```

## Why Not Use Supabase Local?

**Supabase Local** (`npx supabase start`) includes:

- ✅ Full Supabase stack (Auth, Storage, Realtime)
- ❌ Heavier (more services than we need)
- ❌ Slower startup (~30s vs ~5s)
- ❌ Requires Supabase CLI

**Our Docker Postgres** includes:

- ✅ Just Postgres (all we need for tests)
- ✅ Fast startup (~5s)
- ✅ Lighter weight
- ✅ No additional CLI dependencies

We use remote Supabase for `npm run dev` (full features), and local Postgres for `npm test` (speed).

## API Endpoint Testing

**Question:** "How do I test API endpoints if tests use local Docker?"

**Answer:** API endpoint testing still uses remote Supabase.

```bash
# Terminal 1: Start dev server (uses remote Supabase)
npm run dev

# Terminal 2: Test API endpoints
curl http://localhost:3000/api/admin/parts
# OR
npm run test:api:import
```

The local Docker is **only for automated unit/integration tests** that don't need the dev server.

## Connection Details

| Environment                  | Database        | Port            | Connection String                                        |
| ---------------------------- | --------------- | --------------- | -------------------------------------------------------- |
| Local Dev (`npm run dev`)    | Remote Supabase | 5432 (Supabase) | From `.env.local`                                        |
| Automated Tests (`npm test`) | Local Docker    | 5433            | `postgresql://postgres:postgres@localhost:5433/acr_test` |
| Production                   | Remote Supabase | 5432 (Supabase) | From hosting env vars                                    |

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Create `.env.local` (copy from `.env.example` and configure)
3. ✅ Start test database: `npm run db:test:start`
4. ✅ Run tests: `npm test`
5. ✅ See `docs/TESTING.md` for more testing documentation

---

**Questions?** See [TESTING.md](../TESTING.md) or [PLANNING.md](../PLANNING.md)
