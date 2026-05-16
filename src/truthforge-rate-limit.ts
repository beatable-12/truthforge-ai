/**
 * TruthForge API Rate Limiting Middleware
 * Prevents abuse by limiting requests per session
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory rate limit store
 * Maps session_id or IP to request count and reset time
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string; // Function to generate rate limit key
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
};

/**
 * Create a rate limiter middleware for TruthForge API
 */
export function createTruthForgeRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const mergedConfig: RateLimitConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  return (req: Request, res: Response, next: NextFunction) => {
    // Generate rate limit key (use session_id if available, otherwise use IP)
    const key = mergedConfig.keyGenerator
      ? mergedConfig.keyGenerator(req)
      : req.ip || req.socket.remoteAddress || 'unknown';

    const now = Date.now();
    let entry = rateLimitStore.get(key);

    // Create new entry if doesn't exist or window expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + mergedConfig.windowMs,
      };
    }

    entry.count++;
    rateLimitStore.set(key, entry);

    // Set rate limit headers
    const remaining = Math.max(0, mergedConfig.maxRequests - entry.count);
    const resetTime = Math.ceil((entry.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', mergedConfig.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', entry.resetTime);
    res.setHeader('Retry-After', resetTime);

    // Check if limit exceeded
    if (entry.count > mergedConfig.maxRequests) {
      console.warn(`[RATE_LIMIT] Rate limit exceeded for key: ${key}`);
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retry_after_seconds: resetTime,
        timestamp: new Date().toISOString(),
      });
    }

    // Store rate limit info for later reference
    (req as any).rateLimit = {
      key,
      count: entry.count,
      limit: mergedConfig.maxRequests,
      remaining,
      resetTime: entry.resetTime,
    };

    next();
  };
}

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(key: string) {
  const entry = rateLimitStore.get(key);
  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (now > entry.resetTime) {
    rateLimitStore.delete(key);
    return null;
  }

  return {
    key,
    count: entry.count,
    resetTime: entry.resetTime,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Reset rate limit for a specific key (admin only)
 */
export function resetRateLimit(key: string): boolean {
  return rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (admin only)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get all active rate limit entries
 */
export function getAllRateLimits(): Map<string, RateLimitEntry> {
  return new Map(rateLimitStore);
}

/**
 * Cleanup expired entries periodically
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    rateLimitStore.delete(key);
  }

  console.log(`[RATE_LIMIT] Cleaned up ${keysToDelete.length} expired entries`);
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredRateLimits, 5 * 60 * 1000);
