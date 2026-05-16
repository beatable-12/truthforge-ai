# Database Initialization - Quick Start

This document explains how to use the TruthForge AI database system.

## Overview

The database automatically initializes when you start the application. It will:
1. Create `truthforge.db` in the project root (or custom path)
2. Run the schema from `src/truthforge_schema.sql`
3. Create all tables and indexes
4. Enable foreign key constraints

## Starting the App

```bash
npm install  # Install dependencies (including better-sqlite3)
npm run dev  # Start development server
```

The database will initialize on the first request to any endpoint.

## Configuration

### Custom Database Path

```bash
# Set environment variable
export TRUTHFORGE_DB_PATH=/custom/path/truthforge.db

# Then start
npm run dev
```

### Environment Setup

Create `.env` file in project root:

```env
TRUTHFORGE_DB_PATH=./truthforge.db
LOG_LEVEL=debug
NODE_ENV=development
```

## Usage

### Initialize Store

```typescript
import TruthForgeStore from './truthforge_store';

const store = new TruthForgeStore();
store.initializeSchema();
```

### Create Entities

```typescript
// Create a question
const question = store.createQuestion({
  id: 'q1',
  text: 'Is AI safe?',
  complexity: 0.75,
  domain: 'ethics',
  subtopics: JSON.stringify(['safety', 'alignment'])
});

// Create a debate
const debate = store.createDebate({
  id: 'debate1',
  question_id: question.id,
  status: 'pending',
  complexity_level: 'high',
  agents_activated: JSON.stringify([]),
  stage: 0,
  total_stages: 5
});

// Add claims
const claim = store.createClaim({
  id: 'claim1',
  debate_id: debate.id,
  statement: 'AI safety is important',
  strength: 0.85,
  reasoning: 'Without safety, risks increase',
  key_points: JSON.stringify(['alignment']),
  assumptions: JSON.stringify(['humans stay in control']),
  supporting_count: 0
});
```

### Seed Sample Data

In development:

```typescript
import TruthForgeStore from './truthforge_store';
import { seedDatabase } from './db-seed';

const store = new TruthForgeStore();
store.initializeSchema();

await seedDatabase(store);
```

### Health Check

```bash
# Check database health
curl http://localhost:3000/api/health

# Response
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
}
```

## Files Created

1. **`src/db-init.ts`** - Database initialization and health checks
2. **`src/db-migrations.ts`** - Schema migration system
3. **`src/db-seed.ts`** - Sample data for development
4. **`src/truthforge_store.ts`** - Updated with transaction support
5. **`src/server.ts`** - Updated with database initialization
6. **`DATABASE_SETUP.md`** - Comprehensive database documentation

## Troubleshooting

### Database not created
- Check file permissions in project root
- Verify `TRUTHFORGE_DB_PATH` is writable
- Check logs for error messages

### Schema fails to load
- Verify `src/truthforge_schema.sql` exists
- Check for syntax errors in schema file
- Review console logs

### Health check fails
- Ensure database file is created
- Check database is not locked by another process
- Verify permissions

## Next Steps

1. Review `DATABASE_SETUP.md` for comprehensive documentation
2. Check `src/db-init.ts` for initialization details
3. Use `src/truthforge_store.ts` for database operations
4. Set up migrations if you need to evolve the schema

## Support

For issues or questions, refer to:
- `DATABASE_SETUP.md` - Comprehensive guide
- `src/db-init.ts` - Initialization code
- `src/truthforge_store.ts` - Store operations
