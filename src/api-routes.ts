/**
 * TruthForge API Routes
 * Main API endpoints for the TruthForge reasoning engine
 */

import { Router, Request, Response, NextFunction } from 'express';
import { TruthForgeAPI } from '../truthforge_api';
import { v4 as uuidv4 } from 'uuid';

export interface ExtendedRequest extends Request {
  logContext?: {
    requestId: string;
    method: string;
    path: string;
    timestamp: string;
    startTime: number;
  };
  debateContext?: {
    debate_id: string;
    start_time: number;
  };
  session_id?: string;
  rate_limit_key?: string;
}

const router = Router();

// Initialize TruthForge API
const dbPath = process.env.TRUTHFORGE_DB_PATH || './truthforge.db';
const truthforgeApi = new TruthForgeAPI(dbPath);

/**
 * Health Check Endpoint
 * GET /api/truthforge/health
 */
router.get('/health', (req: ExtendedRequest, res: Response) => {
  res.json({
    success: true,
    service: 'truthforge-api',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Main Debate Endpoint
 * POST /api/truthforge/debate
 * Processes a question through the TruthForge reasoning system
 */
router.post('/debate', async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();
    const { question, session_id, domain, depth } = req.body;

    // Validation
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Question is required and must be a non-empty string',
        debate_id: undefined,
        timestamp: new Date().toISOString(),
      });
    }

    // Create debate context
    const debate_id = `debate_${uuidv4()}`;
    const sessionId = session_id || `session_${uuidv4()}`;

    req.debateContext = {
      debate_id,
      start_time: startTime,
    };

    req.session_id = sessionId;

    console.log(
      `[TRUTHFORGE] Starting debate ${debate_id} for question: "${question.substring(0, 100)}${question.length > 100 ? '...' : ''}"`
    );

    // Call TruthForge API
    await truthforgeApi.processQuestion(req, res);

    const duration = Date.now() - startTime;
    console.log(`[TRUTHFORGE] Debate ${debate_id} completed in ${duration}ms`);
  } catch (error) {
    console.error('[TRUTHFORGE] Error in debate endpoint:', error);
    next(error);
  }
});

/**
 * Get Debate Details
 * GET /api/truthforge/debate/:debateId
 */
router.get('/debate/:debateId', async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  try {
    const { debateId } = req.params;

    if (!debateId || debateId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debate ID is required',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[TRUTHFORGE] Retrieving debate: ${debateId}`);

    // Call getDebate method
    await truthforgeApi.getDebate(req as any, res);
  } catch (error) {
    console.error('[TRUTHFORGE] Error retrieving debate:', error);
    next(error);
  }
});

/**
 * Get Recent Debates
 * GET /api/truthforge/debates
 * Query params:
 *   - limit: number of debates to return (default: 10, max: 100)
 *   - offset: pagination offset (default: 0)
 */
router.get('/debates', async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    console.log(`[TRUTHFORGE] Retrieving debates: limit=${limit}, offset=${offset}`);

    // TODO: Implement debate listing in TruthForgeStore
    // For now return empty list
    res.json({
      success: true,
      debates: [],
      count: 0,
      limit,
      offset,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[TRUTHFORGE] Error retrieving debates list:', error);
    next(error);
  }
});

/**
 * Get Memory / Prior Reasoning
 * GET /api/truthforge/memory/:id
 */
router.get('/memory/:id', async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id || id.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Memory ID is required',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[TRUTHFORGE] Retrieving memory: ${id}`);

    // TODO: Implement memory retrieval
    res.json({
      success: true,
      memory: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[TRUTHFORGE] Error retrieving memory:', error);
    next(error);
  }
});

/**
 * Submit Feedback
 * POST /api/truthforge/feedback
 */
router.post('/feedback', async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  try {
    const { debate_id, rating, comment, helpful } = req.body;

    if (!debate_id) {
      return res.status(400).json({
        success: false,
        error: 'Debate ID is required for feedback',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[TRUTHFORGE] Received feedback for debate ${debate_id}:`, { rating, helpful });

    // TODO: Implement feedback storage
    res.json({
      success: true,
      feedback_id: `feedback_${uuidv4()}`,
      message: 'Feedback received',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[TRUTHFORGE] Error processing feedback:', error);
    next(error);
  }
});

export default router;
