# TruthForge AI - Database Initialization Guide

## Overview

The TruthForge AI database system provides persistent storage for debates, claims, evidence, verdicts, and memory entries using SQLite. The initialization system ensures the database is properly set up on application startup.

## Database Structure

### Schema
- **Location**: `src/truthforge_schema.sql`
- **Tables**: 10 core tables
- **Indexes**: 14 performance indexes
- **Features**: Foreign key constraints, timestamps, JSON fields for complex data

### Tables
1. **debates** - Main debate/session records
2. **questions** - Questions being debated
3. **claims** - Supporting thesis claims
4. **counter_claims** - Antithesis counter-claims
5. **evidence** - Supporting evidence
6. **verdicts** - Referee evaluations
7. **reasonings** - Complete reasoning chains
8. **relationships** - Graph edges between nodes
9. **plan_steps** - Debate planning steps
10. **memory_entries** - Long-term memory store

## Initialization System

### Components

#### 1. **Database Init Module** (`src/db-init.ts`)
Handles database creation and schema initialization:

```typescript
import { initializeDatabase, checkDatabaseHealth } from './db-init';

// Initialize on startup
const result = await initializeDatabase();

// Check health
const health = checkDatabaseHealth();
```

**Functions**:
- `initializeDatabase(dbPath)` - Creates database and runs schema
- `checkDatabaseHealth(dbPath)` - Checks database connection and table count
- `resetDatabase(dbPath)` - Clears and reinitializes (dev only)

#### 2. **TruthForge Store** (`src/truthforge_store.ts`)
TypeScript wrapper for database operations:

```typescript
import TruthForgeStore from './truthforge_store';

const store = new TruthForgeStore();
store.initializeSchema(); // Initialize schema
store.createQuestion({...});
store.createDebate({...});
```

**Key Methods**:
- `initializeSchema()` - Initialize schema (idempotent)
- `isConnected()` - Check database connection
- `getTableCount()` - Get number of tables
- `beginTransaction()`, `commitTransaction()`, `rollbackTransaction()` - Transaction support
- CRUD operations for all entities

#### 3. **Server Integration** (`src/server.ts`)
Automatically initializes database on first request:

```typescript
// Database initializes automatically when server starts
// Health check endpoint available at /api/health
```

#### 4. **Migration System** (`src/db-migrations.ts`)
Version control for schema changes:

```typescript
import { MigrationManager } from './db-migrations';

const manager = new MigrationManager(db);
manager.register({
  version: '1.0.1',
  name: 'Add new field to claims',
  up: (db) => { /* migrate up */ },
  down: (db) => { /* migrate down */ }
});
await manager.runPending();
```

#### 5. **Database Seeding** (`src/db-seed.ts`)
Populate development database with sample data:

```typescript
import { seedDatabase, clearDatabase } from './db-seed';

// Seed with sample data
await seedDatabase(store, {
  includeDebates: true,
  includeMemory: true,
  includeRelationships: true
});

// Clear for fresh start
await clearDatabase(store);
```

## Configuration

### Database Path
- **Default**: `./truthforge.db` (project root)
- **Custom**: Set `TRUTHFORGE_DB_PATH` environment variable

**Example**:
```bash
export TRUTHFORGE_DB_PATH=/var/db/truthforge.db
npm run dev
```

### Environment Variables
```env
# Database path (optional, defaults to ./truthforge.db)
TRUTHFORGE_DB_PATH=./truthforge.db

# Node environment
NODE_ENV=development  # or production

# Logging level
LOG_LEVEL=info
```

## Usage Examples

### Basic Setup
```typescript
// Initialize on startup
import { initializeDatabase } from './db-init';

async function startApp() {
  try {
    const result = await initializeDatabase();
    console.log(`Database ready: ${result.tablesCreated} tables`);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

startApp();
```

### Using the Store
```typescript
import TruthForgeStore from './truthforge_store';

const store = new TruthForgeStore();
store.initializeSchema();

// Create a question
const question = store.createQuestion({
  id: 'q1',
  text: 'Is AI safe?',
  complexity: 0.75,
  domain: 'ethics',
  subtopics: JSON.stringify(['safety', 'alignment'])
});

// Create a debate session
const debate = store.createDebate({
  id: 'debate1',
  question_id: question.id,
  status: 'in_progress',
  complexity_level: 'high',
  agents_activated: JSON.stringify(['planner', 'thesis']),
  stage: 1,
  total_stages: 5
});

// Add a claim
const claim = store.createClaim({
  id: 'claim1',
  debate_id: debate.id,
  statement: 'AI safety research is critical',
  strength: 0.85,
  reasoning: 'Without safety measures, risks increase',
  key_points: JSON.stringify(['alignment', 'robustness']),
  assumptions: JSON.stringify(['humans stay in control']),
  supporting_count: 0
});
```

### Health Check
```typescript
// GET /api/health
// Returns:
{
  "status": "healthy",
  "database": {
    "healthy": true,
    "message": "Database is healthy with 10 tables",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Transactions
```typescript
try {
  store.beginTransaction();
  
  // Multiple operations
  store.createDebate({...});
  store.createClaim({...});
  store.createEvidence({...});
  
  store.commitTransaction();
} catch (error) {
  store.rollbackTransaction();
  throw error;
}
```

## Development Tasks

### Initialize New Database
```typescript
import { initializeDatabase } from './db-init';

const result = await initializeDatabase('./dev.db');
console.log(`Created: ${result.tablesCreated} tables, ${result.indexesCreated} indexes`);
```

### Seed Sample Data
```typescript
import TruthForgeStore from './truthforge_store';
import { seedDatabase } from './db-seed';

const store = new TruthForgeStore();
store.initializeSchema();

const stats = await seedDatabase(store);
console.log(`Seeded: ${stats.questionsCreated} questions`);
```

### Reset Database
```typescript
import { resetDatabase } from './db-init';

// Development only
await resetDatabase('./dev.db');
```

### Check Database Health
```typescript
import { checkDatabaseHealth } from './db-init';

const health = checkDatabaseHealth();
console.log(`Database health: ${health.healthy}`);
console.log(health.message);
```

## Performance Considerations

### Indexes
The schema includes 14 indexes on frequently queried columns:
- `debates(question_id)` - Find debates by question
- `debates(status)` - Filter by status
- `claims(debate_id)` - Get all claims for debate
- `evidence(debate_id)` - Get all evidence for debate
- `relationships(source_id)` - Traverse graph forward
- `relationships(target_id)` - Traverse graph backward
- And more...

### Foreign Keys
All relationships are enforced with foreign key constraints for referential integrity.

### Transactions
Use transactions for multi-step operations to ensure consistency:

```typescript
store.beginTransaction();
try {
  // Multiple operations
  store.commitTransaction();
} catch {
  store.rollbackTransaction();
}
```

## Monitoring

### Health Endpoint
```bash
curl http://localhost:3000/api/health
```

### Logging
All initialization steps are logged with prefix `[DB Init]`:
```
[DB Init] Starting database initialization at 2024-01-15T10:00:00.000Z
[DB Init] Database connection established
[DB Init] Schema executed successfully
[DB Init] ✓ Tables created: 10
[DB Init] ✓ Indexes created: 14
[DB Init] ✓ Database initialized successfully in 42ms
```

## Troubleshooting

### Database File Not Created
- Check directory permissions
- Verify `TRUTHFORGE_DB_PATH` is writable
- Check disk space

### Schema Initialization Failed
- Verify `truthforge_schema.sql` exists in `src/`
- Check for syntax errors in schema file
- Review error logs

### Connection Errors
- Ensure SQLite is available in environment
- Check `better-sqlite3` is installed
- Verify database file isn't locked

### Performance Issues
- Check indexes are created with `PRAGMA index_list(table_name)`
- Monitor query performance with `PRAGMA query_only`
- Consider archiving old memory entries

## Production Checklist

- [ ] Database path configured via environment variable
- [ ] Regular backups enabled
- [ ] Health monitoring in place
- [ ] Foreign key constraints active
- [ ] Proper file permissions set
- [ ] Database file on reliable storage
- [ ] Error logging configured
- [ ] No seed data in production
- [ ] No development-only functions called
- [ ] Migration system tested

## Files Summary

| File | Purpose |
|------|---------|
| `src/db-init.ts` | Database initialization and health checks |
| `src/db-migrations.ts` | Schema version management |
| `src/db-seed.ts` | Sample data population |
| `src/truthforge_store.ts` | Database wrapper and CRUD operations |
| `src/server.ts` | Server integration |
| `src/truthforge_schema.sql` | Database schema |
