/**
 * TruthForge AI - Database Initialization
 * Handles SQLite database setup and schema migration on app startup
 */

import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface InitializationResult {
  success: boolean;
  dbPath: string;
  tablesCreated: number;
  indexesCreated: number;
  message: string;
  timestamp: string;
}

/**
 * Initialize the SQLite database on application startup
 * Creates database file, runs schema, and verifies all tables exist
 */
export function initializeDatabase(
  dbPath: string = process.env.TRUTHFORGE_DB_PATH || './truthforge.db'
): InitializationResult {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    console.log(`[DB Init] Starting database initialization at ${timestamp}`);
    console.log(`[DB Init] Database path: ${dbPath}`);

    // Ensure the database directory exists
    const dir = dirname(dbPath);
    if (dir && !existsSync(dir) && dir !== '.') {
      mkdirSync(dir, { recursive: true });
      console.log(`[DB Init] Created database directory: ${dir}`);
    }

    // Open or create database
    const db = new DatabaseSync(dbPath);
    console.log(`[DB Init] Database connection established`);

    // Enable foreign keys
    db.exec('PRAGMA foreign_keys = ON;');
    console.log(`[DB Init] Foreign keys enabled`);

    // Read schema file
    const schemaPath = join(__dirname, './truthforge_schema.sql');
    console.log(`[DB Init] Reading schema from: ${schemaPath}`);

    if (!existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute schema
    db.exec(schema);
    console.log(`[DB Init] Schema executed successfully`);

    // Verify tables were created
    const tables = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
      )
      .all() as Array<{ name: string }>;

    const indexes = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'`)
      .all() as Array<{ name: string }>;

    console.log(`[DB Init] ✓ Tables created: ${tables.length}`);
    tables.forEach((table) => {
      console.log(`[DB Init]   - ${table.name}`);
    });

    console.log(`[DB Init] ✓ Indexes created: ${indexes.length}`);
    indexes.forEach((index) => {
      console.log(`[DB Init]   - ${index.name}`);
    });

    // Create migrations table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(`[DB Init] Migrations table ready`);

    // Store initialization metadata
    db.exec(`
      CREATE TABLE IF NOT EXISTS initialization_metadata (
        id INTEGER PRIMARY KEY,
        last_init_time TIMESTAMP,
        schema_version TEXT,
        app_version TEXT
      )
    `);

    const existingMetadata = db
      .prepare('SELECT id FROM initialization_metadata LIMIT 1')
      .get();

    if (existingMetadata) {
      db.prepare(
        'UPDATE initialization_metadata SET last_init_time = ? WHERE id = 1'
      ).run(timestamp);
    } else {
      db.prepare(
        'INSERT INTO initialization_metadata (id, last_init_time, schema_version) VALUES (1, ?, ?)'
      ).run(timestamp, '1.0.0');
    }

    db.close();

    const duration = Date.now() - startTime;
    const result: InitializationResult = {
      success: true,
      dbPath,
      tablesCreated: tables.length,
      indexesCreated: indexes.length,
      message: `Database initialized successfully in ${duration}ms`,
      timestamp,
    };

    console.log(`[DB Init] ✓ ${result.message}`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[DB Init] ✗ Initialization failed after ${duration}ms: ${errorMessage}`);

    const result: InitializationResult = {
      success: false,
      dbPath,
      tablesCreated: 0,
      indexesCreated: 0,
      message: `Database initialization failed: ${errorMessage}`,
      timestamp,
    };

    throw new Error(result.message);
  }
}

/**
 * Check database connection and health
 */
export function checkDatabaseHealth(
  dbPath: string = process.env.TRUTHFORGE_DB_PATH || './truthforge.db'
): {
  healthy: boolean;
  message: string;
  timestamp: string;
} {
  try {
    const db = new DatabaseSync(dbPath);

    // Test basic connectivity
    const result = db.prepare('SELECT 1').get();

    // Verify tables exist
    const tables = db
      .prepare(
        `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
      )
      .get() as { count: number };

    db.close();

    return {
      healthy: result && tables.count > 0,
      message: `Database is healthy with ${tables.count} tables`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      healthy: false,
      message: `Database health check failed: ${errorMessage}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Reset database (development only)
 * Drops all tables and recreates from schema
 */
export function resetDatabase(
  dbPath: string = process.env.TRUTHFORGE_DB_PATH || './truthforge.db'
): InitializationResult {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database reset is not allowed in production');
  }

  try {
    console.log(`[DB Reset] Starting database reset`);

    const db = new DatabaseSync(dbPath);

    // Get all tables
    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`)
      .all() as Array<{ name: string }>;

    // Drop all tables
    for (const table of tables) {
      db.exec(`DROP TABLE IF EXISTS "${table.name}"`);
      console.log(`[DB Reset] Dropped table: ${table.name}`);
    }

    db.close();

    // Reinitialize
    return initializeDatabase(dbPath);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Database reset failed: ${errorMessage}`);
  }
}
