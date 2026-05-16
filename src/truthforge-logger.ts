/**
 * TruthForge API Request Logger Middleware
 * Logs all TruthForge API calls with detailed timing and status information
 */

import { Request, Response, NextFunction } from 'express';

interface LogContext {
  requestId: string;
  method: string;
  path: string;
  timestamp: string;
  startTime: number;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

// Store logs in memory for debugging
const requestLogs: LogContext[] = [];
const MAX_LOGS = 1000;

export interface ExtendedRequest extends Request {
  logContext?: LogContext;
}

/**
 * TruthForge Logger Middleware
 * Logs request start, processing time, and response status
 */
export function truthforgeLogger(req: ExtendedRequest, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const timestamp = new Date().toISOString();

  const logContext: LogContext = {
    requestId,
    method: req.method,
    path: req.path,
    timestamp,
    startTime,
  };

  // Log request body for POST requests
  if (req.method === 'POST' && req.body) {
    logContext.body = sanitizeBody(req.body);
  }

  // Log query parameters
  if (Object.keys(req.query).length > 0) {
    logContext.query = req.query;
  }

  req.logContext = logContext;

  // Log initial request
  console.log(`[API] [${requestId}] ${req.method} ${req.path} - Request received at ${timestamp}`);

  // Capture the original end function
  const originalEnd = res.end;

  // Override res.end to log response
  res.end = function (...args) {
    const duration = Date.now() - startTime;
    const logEntry = {
      ...logContext,
      status: res.statusCode,
      duration,
      durationMs: `${duration}ms`,
    };

    // Store log for potential debugging
    storeLog(logEntry);

    // Determine log level based on status code
    let logLevel = '✓';
    if (res.statusCode >= 400) {
      logLevel = res.statusCode >= 500 ? '✗' : '⚠';
    }

    console.log(
      `[API] [${requestId}] ${logLevel} ${res.statusCode} - ${req.method} ${req.path} completed in ${duration}ms`
    );

    // Call original end
    return originalEnd.apply(res, args);
  };

  next();
}

/**
 * Get recent request logs for debugging
 */
export function getRecentLogs(limit: number = 50): Array<LogContext & { status?: number; duration?: number }> {
  return requestLogs.slice(-limit);
}

/**
 * Clear all stored logs
 */
export function clearLogs(): void {
  requestLogs.length = 0;
}

// Helper functions

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function storeLog(logEntry: unknown): void {
  requestLogs.push(logEntry as LogContext);
  if (requestLogs.length > MAX_LOGS) {
    requestLogs.shift();
  }
}

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...body };
  // Remove sensitive fields if any
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***';
    }
  }
  return sanitized;
}
