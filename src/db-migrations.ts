/**
 * TruthForge AI - Migration System
 * Handles database schema versioning and migrations
 */

import { DatabaseSync } from 'node:sqlite';

export interface Migration {
  version: string;
  name: string;
  up: (db: DatabaseSync) => void;
  down?: (db: DatabaseSync) => void;
}

export class MigrationManager {
  private db: DatabaseSync;
  private migrations: Migration[] = [];

  constructor(db: DatabaseSync) {
    this.db = db;
    this.createMigrationsTable();
  }

  /**
   * Create migrations tracking table
   */
  private createMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER
      )
    `);
  }

  /**
   * Register a migration
   */
  public register(migration: Migration): void {
    this.migrations.push(migration);
  }

  /**
   * Run all pending migrations
   */
  public async runPending(): Promise<string[]> {
    const executed: string[] = [];
    const executedMigrations = this.getExecutedMigrations();

    for (const migration of this.migrations) {
      if (executedMigrations.includes(migration.version)) {
        console.log(`[Migration] Skipping ${migration.version}: already executed`);
        continue;
      }

      try {
        console.log(`[Migration] Running ${migration.version}: ${migration.name}`);
        const start = Date.now();

        this.db.exec('BEGIN TRANSACTION');
        migration.up(this.db);

        const stmt = this.db.prepare(`
          INSERT INTO migrations (version, name, execution_time_ms)
          VALUES (?, ?, ?)
        `);
        stmt.run(migration.version, migration.name, Date.now() - start);

        this.db.exec('COMMIT');
        executed.push(migration.version);
        console.log(`[Migration] ✓ ${migration.version} completed`);
      } catch (error) {
        this.db.exec('ROLLBACK');
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Migration] ✗ ${migration.version} failed: ${errorMessage}`);
        throw error;
      }
    }

    return executed;
  }

  /**
   * Get executed migrations
   */
  private getExecutedMigrations(): string[] {
    const stmt = this.db.prepare('SELECT version FROM migrations ORDER BY executed_at');
    const results = stmt.all() as Array<{ version: string }>;
    return results.map((r) => r.version);
  }

  /**
   * Get migration status
   */
  public getStatus(): {
    total: number;
    executed: number;
    pending: number;
  } {
    const executed = this.getExecutedMigrations().length;
    return {
      total: this.migrations.length,
      executed,
      pending: this.migrations.length - executed,
    };
  }

  /**
   * Rollback last migration (development only)
   */
  public rollbackLast(): boolean {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Rollback not allowed in production');
    }

    const stmt = this.db.prepare(`
      SELECT version FROM migrations
      ORDER BY executed_at DESC
      LIMIT 1
    `);
    const lastMigration = stmt.get() as { version: string } | undefined;

    if (!lastMigration) {
      console.log('[Migration] No migrations to rollback');
      return false;
    }

    const migration = this.migrations.find((m) => m.version === lastMigration.version);
    if (!migration || !migration.down) {
      console.log(`[Migration] No rollback available for ${lastMigration.version}`);
      return false;
    }

    try {
      console.log(`[Migration] Rolling back ${lastMigration.version}`);
      this.db.exec('BEGIN TRANSACTION');
      migration.down(this.db);
      this.db.prepare('DELETE FROM migrations WHERE version = ?').run(lastMigration.version);
      this.db.exec('COMMIT');
      console.log(`[Migration] ✓ Rollback complete`);
      return true;
    } catch (error) {
      this.db.exec('ROLLBACK');
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Migration] ✗ Rollback failed: ${errorMessage}`);
      throw error;
    }
  }
}
