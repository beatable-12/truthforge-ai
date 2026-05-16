/**
 * TruthForge API Error Handler Middleware
 * Handles errors specific to TruthForge API operations
 */

import { Request, Response, NextFunction } from 'express';

export interface TruthForgeError extends Error {
  statusCode?: number;
  requestId?: string;
  context?: Record<string, unknown>;
}

export interface ExtendedResponse extends Response {
  error?: TruthForgeError;
}

/**
 * TruthForge Error Handler
 * Catches and formats errors from TruthForge API operations
 */
export function truthforgeErrorHandler(
  err: TruthForgeError,
  req: Request,
  res: ExtendedResponse,
  _next: NextFunction
): void {
  const requestId = (req as any).logContext?.requestId || 'unknown';
  const statusCode = err.statusCode || 500;
  const timestamp = new Date().toISOString();

  // Log the error
  console.error(`[API] [${requestId}] Error (${statusCode}): ${err.message}`, {
    stack: err.stack,
    context: err.context,
  });

  // Format error response
  const errorResponse = {
    success: false,
    error: err.message || 'Internal server error',
    debate_id: undefined,
    timestamp,
    request_id: requestId,
    ...(process.env.NODE_ENV === 'development' && { details: err.stack }),
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * Create a standardized TruthForge error
 */
export function createTruthForgeError(
  message: string,
  statusCode: number = 500,
  context?: Record<string, unknown>
): TruthForgeError {
  const error = new Error(message) as TruthForgeError;
  error.statusCode = statusCode;
  error.context = context;
  return error;
}

/**
 * Error codes and messages
 */
export const ErrorCodes = {
  INVALID_REQUEST: {
    code: 'INVALID_REQUEST',
    status: 400,
    message: 'Invalid request parameters',
  },
  MISSING_QUESTION: {
    code: 'MISSING_QUESTION',
    status: 400,
    message: 'Question is required',
  },
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    status: 429,
    message: 'Too many requests. Please try again later.',
  },
  PROCESSING_ERROR: {
    code: 'PROCESSING_ERROR',
    status: 500,
    message: 'Error processing question',
  },
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    status: 500,
    message: 'Database operation failed',
  },
  GEMINI_ERROR: {
    code: 'GEMINI_ERROR',
    status: 503,
    message: 'Gemini API service unavailable',
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    status: 404,
    message: 'Resource not found',
  },
};
