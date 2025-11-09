/**
 * Database Lifecycle Management for Tests
 * Handles Docker container, migrations, and seeding
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import pg from 'pg';

const execAsync = promisify(exec);
const { Pool } = pg;

export class TestDatabaseManager {
  private pool?: pg.Pool;

  /**
   * Start Docker Postgres container if not running
   */
  async startContainer(): Promise<void> {
    console.log('🐳 Checking Docker container...');

    try {
      // Check if container is running
      const { stdout } = await execAsync(
        'docker ps --filter "name=acr-test-db" --format "{{.Names}}"'
      );

      if (stdout.includes('acr-test-db')) {
        console.log('   ✅ Container already running');
        return;
      }
    } catch (err) {
      // Container not found, need to start it
    }

    console.log('   🚀 Starting Docker container...');
    await execAsync('docker-compose -f docker-compose.test.yml up -d');

    // Wait for health check
    await this.waitForDatabase();
    console.log('   ✅ Container started and healthy');
  }

  /**
   * Wait for database to be ready
   */
  private async waitForDatabase(maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await execAsync(
          'docker exec acr-test-db pg_isready -U postgres'
        );
        return;
      } catch (err) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('Database failed to become ready');
  }

  /**
   * Run migrations to create schema
   */
  async runMigrations(): Promise<void> {
    console.log('📦 Running migrations...');

    const pool = this.getPool();

    // Read schema.sql
    const schemaPath = path.join(process.cwd(), 'src/lib/supabase/schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Remove Supabase-specific statements (storage schema, policies, etc.)
    // These don't exist in plain Postgres and will be skipped
    schemaSql = schemaSql
      .replace(/INSERT INTO storage\.[^;]*;/gi, '-- Skipped: Supabase storage INSERT')
      .replace(/CREATE POLICY[^;]*ON storage\.[^;]*;/gi, '-- Skipped: Supabase storage POLICY')
      .replace(/ALTER TABLE storage\.[^;]*;/gi, '-- Skipped: Supabase storage ALTER');

    // Execute schema creation
    await pool.query(schemaSql);

    // Run any additional migrations (009_add_sku_normalization.sql, etc.)
    const migrationsDir = path.join(process.cwd(), 'src/lib/supabase/migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        let migrationSql = fs.readFileSync(
          path.join(migrationsDir, file),
          'utf-8'
        );

        // Filter Supabase-specific statements from migrations too
        migrationSql = migrationSql
          .replace(/INSERT INTO storage\.[^;]*;/gi, '-- Skipped: Supabase storage INSERT')
          .replace(/CREATE POLICY[^;]*ON storage\.[^;]*;/gi, '-- Skipped: Supabase storage POLICY')
          .replace(/ALTER TABLE storage\.[^;]*;/gi, '-- Skipped: Supabase storage ALTER');

        await pool.query(migrationSql);
        console.log(`   ✅ Applied ${file}`);
      }
    }

    console.log('   ✅ Migrations complete');
  }

  /**
   * Seed database with test data
   */
  async seedDatabase(): Promise<void> {
    console.log('🌱 Seeding test data...');

    const pool = this.getPool();

    // Read seed-data.sql
    const seedPath = path.join(process.cwd(), 'fixtures/seed-data.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf-8');

    // Execute seed data
    await pool.query(seedSql);

    // Verify seed count
    const { rows } = await pool.query('SELECT COUNT(*) FROM parts');
    const partCount = parseInt(rows[0].count);

    console.log(`   ✅ Seeded ${partCount} parts`);
  }

  /**
   * Reset database to clean state
   */
  async resetDatabase(): Promise<void> {
    console.log('🔄 Resetting database...');

    const pool = this.getPool();

    // Drop all tables
    await pool.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);

    console.log('   ✅ Database reset complete');
  }

  /**
   * Get connection pool (lazy initialization)
   */
  private getPool(): pg.Pool {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL ||
          'postgresql://postgres:postgres@localhost:5433/acr_test'
      });
    }
    return this.pool;
  }

  /**
   * Close connection pool
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = undefined;
    }
  }

  /**
   * Stop Docker container
   */
  async stopContainer(): Promise<void> {
    console.log('🛑 Stopping Docker container...');
    await execAsync('docker-compose -f docker-compose.test.yml down');
    console.log('   ✅ Container stopped');
  }
}

// Export singleton instance
export const testDb = new TestDatabaseManager();
