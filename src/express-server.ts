/**
 * TruthForge Express Server
 * Main backend server integrating TruthForge reasoning engine with Express.js
 * Runs on port 3000 with full API endpoints
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Import routes and middleware
import truthforgeRouter from './api-routes.ts';
import { truthforgeLogger } from './truthforge-logger.ts';
import { truthforgeErrorHandler } from './truthforge-error.ts';
import { createTruthForgeRateLimiter } from './truthforge-rate-limit.ts';
import { initializeDatabase, checkDatabaseHealth } from './db-init.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Store initialization state
let databaseInitialized = false;

/**
 * Initialize Express middleware
 */
function initializeMiddleware() {
  // CORS Configuration
  app.use(
    cors({
      origin: [
        'http://localhost:5173', // Vite dev server
        'http://localhost:3000', // API server itself
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      maxAge: 86400, // 24 hours
    })
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Request logging
  app.use(truthforgeLogger);

  // Rate limiting for TruthForge API (10 requests per minute per session)
  app.use('/api/truthforge', createTruthForgeRateLimiter({ windowMs: 60 * 1000, maxRequests: 10 }));

  console.log('[Server] Middleware initialized');
}

/**
 * Initialize database on startup
 */
function initializeAppDatabase(): void {
  if (databaseInitialized) {
    return;
  }

  try {
    console.log('[Server] Initializing TruthForge database...');
    const dbPath = process.env.TRUTHFORGE_DB_PATH || './truthforge.db';
    const result = initializeDatabase(dbPath);

    if (result.success) {
      console.log(`[Server] ✓ Database initialized: ${result.tablesCreated} tables, ${result.indexesCreated} indexes`);
      databaseInitialized = true;
    } else {
      console.warn(`[Server] Database initialization warning: ${result.message}`);
    }
  } catch (error) {
    console.error('[Server] Database initialization failed:', String(error));
    throw error;
  }
}

/**
 * Setup API Routes
 */
function setupRoutes() {
  // Health check endpoint
  app.get('/health', (req, res) => {
    const health = checkDatabaseHealth(process.env.TRUTHFORGE_DB_PATH || './truthforge.db');
    res.status(health.healthy ? 200 : 503).json({
      status: health.healthy ? 'healthy' : 'degraded',
      service: 'truthforge-api',
      database: health,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV,
    });
  });

  // API routes
  app.use('/api/truthforge', truthforgeRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Not found',
      path: req.path,
      timestamp: new Date().toISOString(),
    });
  });

  console.log('[Server] Routes configured');
}

/**
 * Setup Error Handling
 */
function setupErrorHandling() {
  // Global error handler
  app.use(truthforgeErrorHandler);

  // Unhandled rejection handler
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Uncaught exception handler
  process.on('uncaughtException', (error) => {
    console.error('[Server] Uncaught Exception:', error);
  });

  console.log('[Server] Error handling configured');
}

/**
 * Start the Express server
 */
function startServer(): void {
  try {
    // Initialize database first (synchronous)
    initializeAppDatabase();

    // Setup middleware
    initializeMiddleware();

    // Setup routes
    setupRoutes();

    // Setup error handling
    setupErrorHandling();

    // Start listening
    app.listen(PORT, () => {
      console.log(`[Server] ✓ TruthForge API server running on http://localhost:${PORT}`);
      console.log(`[Server] Environment: ${NODE_ENV}`);
      console.log(`[Server] CORS enabled for: http://localhost:5173, http://localhost:3000`);
      console.log('[Server] Available endpoints:');
      console.log('  - GET  /health - Server health check');
      console.log('  - GET  /api/truthforge/health - API health check');
      console.log('  - POST /api/truthforge/debate - Process question through reasoning engine');
      console.log('  - GET  /api/truthforge/debate/:debateId - Get debate details');
      console.log('  - GET  /api/truthforge/debates - List recent debates');
      console.log('  - GET  /api/truthforge/memory/:id - Get prior reasoning memory');
      console.log('  - POST /api/truthforge/feedback - Submit feedback');
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', String(error));
    process.exit(1);
  }
}

// Start the server if this is the main module (Windows-safe)
const isMain =
  typeof process.argv[1] === 'string' &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  try {
    startServer();
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[Server] Startup exception:', errMsg);
    if (err instanceof Error && err.stack) {
      console.error('[Server] Stack:', err.stack);
    }
    process.exit(1);
  }
}

export default app;
