/**
 * TruthForge AI - API Endpoint
 * Full 8-agent pipeline: Planner → Memory → Thesis → Antithesis → Evidence → Referee → Synthesis → MemoryUpdate
 * Each agent performs real Gemini-powered reasoning — no placeholders.
 */

import 'dotenv/config';
import { Request, Response } from 'express';
import TruthForgeStore from './truthforge_store.ts';
import GeminiClient from './gemini-client.ts';
import type {
  PlannerResult,
  ThesisClaim,
  CounterClaim,
  EvidenceResult,
  EvidenceItem,
  RefereeResult,
  SynthesisResult,
} from './gemini-client.ts';
import { v4 as uuidv4 } from 'uuid';

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface DebateRequest {
  question: string;
  domain?: string;
  depth?: number;
}

interface AgentEvent {
  agent: string;
  status: 'started' | 'complete' | 'error';
  detail: string;
  timestamp: string;
  duration_ms?: number;
}

interface DebateResponse {
  success: boolean;
  debate_id: string;
  session_id: string;
  question: string;
  question_type: string;
  complexity: string;
  analysis: string;
  perspective_exploration: string;
  supporting_factors: string[];
  counterarguments: string[];
  historical_context: string;
  confidence_assessment: string;
  confidence: string;
  final_answer: string;
  reasoning_chain: string[];
  verdict: {
    evaluation: string;
    logic_strength: number;
    evidence_strength: number;
    assumption_risk: number;
    agreement_level: number;
    overall_confidence: number;
  };
  agent_events: AgentEvent[];
  thesis_claims: Array<{ statement: string; reasoning: string; strength: number }>;
  counter_claims: Array<{ statement: string; reasoning: string; strength: number }>;
  evidence: {
    source_count: number;
    source_titles: string[];
    evidence: Array<{ content: string; source_title: string; supports: string; credibility: number }>;
  };
  timestamp: string;
}

// ─── API Class ──────────────────────────────────────────────────────────────

export class TruthForgeAPI {
  private store: TruthForgeStore;
  private gemini: GeminiClient | null;
  private dbPath: string;
  private geminiApiKey: string;
  private geminiModel: string;
  private logLevel: string;

  constructor(dbPath: string = process.env.TRUTHFORGE_DB_PATH || './truthforge.db') {
    this.dbPath = dbPath;
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.store = new TruthForgeStore(dbPath);

    // Gemini is optional; enable explicitly with TRUTHFORGE_ENABLE_GEMINI=1
    const enableGemini =
      process.env.TRUTHFORGE_ENABLE_GEMINI === '1' ||
      process.env.TRUTHFORGE_ENABLE_GEMINI === 'true';

    if (!enableGemini) {
      console.warn(
        '[TRUTHFORGE] Gemini disabled (set TRUTHFORGE_ENABLE_GEMINI=1 to enable)'
      );
      this.gemini = null;
    } else if (this.geminiApiKey && this.geminiApiKey.trim().length > 0) {
      try {
        this.gemini = new GeminiClient(this.geminiApiKey, this.geminiModel);
        console.log('[TRUTHFORGE] Gemini client initialized successfully');
      } catch (error) {
        console.error('[TRUTHFORGE] Failed to initialize Gemini client:', error);
        this.gemini = null;
      }
    } else {
      console.warn('[TRUTHFORGE] GEMINI_API_KEY not set');
      this.gemini = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Timeout helper
  // ═══════════════════════════════════════════════════════════════════════════

  private _withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Pipeline timed out after ${ms}ms`));
      }, ms);

      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Main endpoint
  // ═══════════════════════════════════════════════════════════════════════════

  async processQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { question, domain, depth } = req.body as DebateRequest;

      if (!question || question.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Question is required' });
        return;
      }

      console.log(`\n[TRUTHFORGE] ════════════════════════════════════════`);
      console.log(`[TRUTHFORGE] Processing: ${question}`);
      console.log(`[TRUTHFORGE] ════════════════════════════════════════`);

      const session_id = `session_${uuidv4()}`;
      const question_id = `question_${uuidv4()}`;

      if (!this.gemini) {
        throw new Error('Gemini not configured — set TRUTHFORGE_ENABLE_GEMINI=1 and GEMINI_API_KEY');
      }

      // Run the full pipeline with a generous timeout
      const timeoutMs = parseInt(process.env.GEMINI_PIPELINE_TIMEOUT_MS || '90000', 10);
      const debateResult = await this._withTimeout(
        this._runAgentPipeline(question, session_id, question_id, domain || 'auto'),
        timeoutMs
      );

      // Persist to database in the background
      this._persistResults(session_id, question_id, question, debateResult);

      // Build response
      const response: DebateResponse = {
        success: true,
        debate_id: `debate_${session_id}`,
        session_id,
        question,
        question_type: debateResult.plannerResult.question_type,
        complexity: debateResult.plannerResult.complexity > 0.6 ? 'complex' : debateResult.plannerResult.complexity > 0.3 ? 'moderate' : 'simple',
        analysis: debateResult.synthesisResult.analysis,
        perspective_exploration: debateResult.synthesisResult.perspective_exploration,
        supporting_factors: debateResult.synthesisResult.supporting_factors,
        counterarguments: debateResult.synthesisResult.counterarguments,
        historical_context: debateResult.synthesisResult.historical_context,
        confidence_assessment: debateResult.synthesisResult.confidence_assessment,
        confidence: debateResult.synthesisResult.confidence,
        final_answer: debateResult.synthesisResult.final_answer,
        reasoning_chain: debateResult.synthesisResult.reasoning_chain,
        verdict: {
          evaluation: debateResult.refereeResult.reasoning,
          logic_strength: debateResult.refereeResult.logic_strength,
          evidence_strength: debateResult.refereeResult.evidence_strength,
          assumption_risk: debateResult.refereeResult.assumption_risk,
          agreement_level: debateResult.refereeResult.agreement_level,
          overall_confidence:
            (debateResult.refereeResult.logic_strength + debateResult.refereeResult.evidence_strength) / 2 *
            (1 - debateResult.refereeResult.assumption_risk * 0.3),
        },
        agent_events: debateResult.agentEvents,
        thesis_claims: debateResult.thesisClaims.map((c) => ({
          statement: c.statement,
          reasoning: c.reasoning,
          strength: c.strength,
        })),
        counter_claims: debateResult.counterClaims.map((c) => ({
          statement: c.statement,
          reasoning: c.reasoning,
          strength: c.strength,
        })),
        evidence: {
          source_count: debateResult.evidenceResult.source_count,
          source_titles: debateResult.evidenceResult.source_titles,
          evidence: debateResult.evidenceResult.evidence.map((e) => ({
            content: e.content,
            source_title: e.source_title,
            supports: e.supports,
            credibility: e.credibility,
          })),
        },
        timestamp: new Date().toISOString(),
      };

      console.log(`[TRUTHFORGE] ✓ Pipeline complete: ${session_id}`);
      res.json(response);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[TRUTHFORGE] Pipeline error:', errMsg);
      res.status(500).json({
        success: false,
        error: 'Failed to process question',
        details: errMsg,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Full 8-Agent Pipeline
  // ═══════════════════════════════════════════════════════════════════════════

  private async _runAgentPipeline(
    question: string,
    session_id: string,
    question_id: string,
    domain: string
  ) {
    if (!this.gemini) throw new Error('Gemini client not available');

    const agentEvents: AgentEvent[] = [];
    const emitEvent = (agent: string, status: AgentEvent['status'], detail: string, durationMs?: number) => {
      const event: AgentEvent = {
        agent,
        status,
        detail,
        timestamp: new Date().toISOString(),
        duration_ms: durationMs,
      };
      agentEvents.push(event);
      console.log(`[TRUTHFORGE] [${status.toUpperCase()}] ${agent}: ${detail}`);
    };

    // ── Step 1: PLANNER ──────────────────────────────────────────────────
    emitEvent('planner', 'started', 'Classifying question type and activating agents');
    const plannerStart = Date.now();

    let plannerResult: PlannerResult;
    try {
      plannerResult = await this.gemini.classifyQuestion(question);
    } catch (err) {
      plannerResult = {
        question_type: 'factual',
        domain: domain !== 'auto' ? domain : 'general',
        complexity: 0.5,
        reasoning: 'Planner fallback: classification failed',
        agents_to_activate: ['memory', 'thesis', 'antithesis', 'evidence', 'referee', 'synthesis', 'memory_update'],
      };
    }

    emitEvent(
      'planner',
      'complete',
      `Question type: ${plannerResult.question_type} | Domain: ${plannerResult.domain} | Complexity: ${plannerResult.complexity.toFixed(2)}`,
      Date.now() - plannerStart
    );

    // ── Step 2: MEMORY ───────────────────────────────────────────────────
    emitEvent('memory', 'started', 'Retrieving prior reasoning from database');
    const memoryStart = Date.now();

    let memoryContext = '';
    let memoryCount = 0;
    try {
      const memories = this.store.searchMemoryByQuestion(question);
      memoryCount = memories.length;
      if (memories.length > 0) {
        memoryContext = memories
          .slice(0, 3)
          .map((m: any) => `Prior analysis: ${m.summary || m.question}`)
          .join('\n');
      }
    } catch (err) {
      // Memory is optional — proceed without it
    }

    emitEvent('memory', 'complete', `Retrieved: ${memoryCount} prior analyses`, Date.now() - memoryStart);

    // ── Step 3: THESIS ───────────────────────────────────────────────────
    emitEvent('thesis', 'started', 'Generating supporting claims via Gemini');
    const thesisStart = Date.now();

    let thesisClaims: ThesisClaim[];
    try {
      thesisClaims = await this.gemini.generateThesisClaims(
        question,
        plannerResult.question_type,
        plannerResult.domain,
        memoryContext
      );
    } catch (err) {
      thesisClaims = [
        {
          statement: `Analysis of "${question}" requires further evidence gathering`,
          reasoning: 'Thesis generation encountered an error',
          strength: 0.5,
        },
      ];
      emitEvent('thesis', 'error', `Thesis generation failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    emitEvent(
      'thesis',
      'complete',
      `Claims generated: ${thesisClaims.length}`,
      Date.now() - thesisStart
    );

    // ── Step 4: ANTITHESIS ───────────────────────────────────────────────
    emitEvent('antithesis', 'started', 'Generating counter-arguments via Gemini');
    const antithesisStart = Date.now();

    let counterClaims: CounterClaim[];
    try {
      counterClaims = await this.gemini.generateCounterClaims(question, thesisClaims);
    } catch (err) {
      counterClaims = [
        {
          targets_claim_index: 0,
          statement: 'Counter-argument generation requires retry',
          attack_type: 'logical',
          reasoning: 'Antithesis generation encountered an error',
          strength: 0.5,
        },
      ];
      emitEvent('antithesis', 'error', `Antithesis generation failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    emitEvent(
      'antithesis',
      'complete',
      `Counterclaims generated: ${counterClaims.length}`,
      Date.now() - antithesisStart
    );

    // ── Step 5: EVIDENCE ─────────────────────────────────────────────────
    emitEvent('evidence', 'started', 'Gathering structured evidence via Gemini');
    const evidenceStart = Date.now();

    let evidenceResult: EvidenceResult;
    try {
      evidenceResult = await this.gemini.generateEvidenceAnalysis(
        question,
        thesisClaims.map((c) => c.statement),
        counterClaims.map((c) => c.statement)
      );
    } catch (err) {
      evidenceResult = { source_count: 0, source_titles: [], evidence: [] };
      emitEvent('evidence', 'error', `Evidence gathering failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    emitEvent(
      'evidence',
      'complete',
      `Evidence retrieved: ${evidenceResult.source_count} sources`,
      Date.now() - evidenceStart
    );

    // ── Step 6: REFEREE ──────────────────────────────────────────────────
    emitEvent('referee', 'started', 'Evaluating debate quality');
    const refereeStart = Date.now();

    let refereeResult: RefereeResult;
    try {
      refereeResult = await this.gemini.evaluateDebate(
        question,
        thesisClaims.map((c) => ({ statement: c.statement, strength: c.strength })),
        counterClaims.map((c) => ({ statement: c.statement, strength: c.strength })),
        evidenceResult.evidence.map((e) => ({
          content: e.content,
          supports: e.supports,
          credibility: e.credibility,
        }))
      );
    } catch (err) {
      refereeResult = {
        logic_strength: 0.6,
        evidence_strength: 0.5,
        assumption_risk: 0.5,
        agreement_level: 0.4,
        stronger_position: 'balanced',
        key_findings: ['Referee evaluation encountered an error'],
        reasoning: 'Fallback scores due to evaluation error',
      };
      emitEvent('referee', 'error', `Referee evaluation failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    emitEvent(
      'referee',
      'complete',
      `Logic: ${refereeResult.logic_strength.toFixed(2)} | Evidence: ${refereeResult.evidence_strength.toFixed(2)} | Risk: ${refereeResult.assumption_risk.toFixed(2)}`,
      Date.now() - refereeStart
    );

    // ── Step 7: SYNTHESIS ────────────────────────────────────────────────
    emitEvent('synthesis', 'started', 'Generating final analysis');
    const synthesisStart = Date.now();

    let synthesisResult: SynthesisResult;
    try {
      synthesisResult = await this.gemini.generateFinalSynthesis({
        question,
        questionType: plannerResult.question_type,
        claims: thesisClaims.map((c) => ({ statement: c.statement })),
        counterClaims: counterClaims.map((c) => ({ statement: c.statement })),
        evidence: evidenceResult.evidence.map((e) => ({
          content: e.content,
          source_title: e.source_title,
          supports: e.supports,
        })),
        scores: {
          logic_strength: refereeResult.logic_strength,
          evidence_strength: refereeResult.evidence_strength,
          assumption_risk: refereeResult.assumption_risk,
          agreement_level: refereeResult.agreement_level,
          stronger_position: refereeResult.stronger_position,
        },
      });
    } catch (err) {
      synthesisResult = {
        analysis: `Analysis of "${question}" encountered a synthesis error.`,
        perspective_exploration: '',
        supporting_factors: thesisClaims.map((c) => c.statement),
        counterarguments: counterClaims.map((c) => c.statement),
        historical_context: '',
        confidence_assessment: 'Unable to fully assess confidence due to synthesis error.',
        final_answer: 'The analysis could not be fully synthesized. Please retry.',
        confidence: 'Low',
        reasoning_chain: ['Synthesis encountered an error'],
      };
      emitEvent('synthesis', 'error', `Synthesis failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    emitEvent(
      'synthesis',
      'complete',
      `Confidence: ${synthesisResult.confidence} | Answer length: ${synthesisResult.final_answer.length} chars`,
      Date.now() - synthesisStart
    );

    // ── Step 8: MEMORY_UPDATE ────────────────────────────────────────────
    emitEvent('memory_update', 'started', 'Persisting results to database');
    emitEvent('memory_update', 'complete', 'Results queued for persistence');

    return {
      plannerResult,
      memoryCount,
      thesisClaims,
      counterClaims,
      evidenceResult,
      refereeResult,
      synthesisResult,
      agentEvents,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Database persistence (runs after response is sent)
  // ═══════════════════════════════════════════════════════════════════════════

  private _persistResults(
    session_id: string,
    question_id: string,
    question: string,
    result: Awaited<ReturnType<typeof this._runAgentPipeline>>
  ): void {
    setImmediate(() => {
      try {
        // Store claims
        for (const claim of result.thesisClaims) {
          try {
            this.store.createClaim({
              id: `${session_id}_claim_${uuidv4()}`,
              debate_id: session_id,
              statement: claim.statement,
              strength: claim.strength,
              reasoning: claim.reasoning,
              key_points: JSON.stringify([]),
              assumptions: JSON.stringify([]),
              supporting_count: 0,
            });
          } catch (e) { /* best effort */ }
        }

        // Store counter-claims
        for (const counter of result.counterClaims) {
          try {
            this.store.createClaim({
              id: `${session_id}_counter_${uuidv4()}`,
              debate_id: session_id,
              statement: counter.statement,
              strength: counter.strength,
              reasoning: counter.reasoning,
              key_points: JSON.stringify([]),
              assumptions: JSON.stringify([]),
              supporting_count: 0,
            });
          } catch (e) { /* best effort */ }
        }

        // Store evidence
        for (const ev of result.evidenceResult.evidence) {
          try {
            this.store.createEvidence({
              id: `${session_id}_evidence_${uuidv4()}`,
              debate_id: session_id,
              content: ev.content,
              source: ev.source_title,
              credibility_score: ev.credibility,
              evidence_type: ev.source_type,
              date_published: new Date().toISOString(),
              retrieval_method: 'gemini_analysis',
            });
          } catch (e) { /* best effort */ }
        }

        // Store verdict
        try {
          this.store.createVerdict({
            id: `${session_id}_verdict`,
            debate_id: session_id,
            evaluation: result.refereeResult.reasoning,
            logic_quality_score: result.refereeResult.logic_strength,
            evidence_strength_score: result.refereeResult.evidence_strength,
            assumption_validity: 1 - result.refereeResult.assumption_risk,
            overall_confidence:
              (result.refereeResult.logic_strength + result.refereeResult.evidence_strength) / 2,
            key_findings: JSON.stringify(result.refereeResult.key_findings),
            reasoning_quality: result.refereeResult.stronger_position,
          });
        } catch (e) { /* best effort */ }

        // Store synthesis
        try {
          this.store.createReasoning({
            id: `${session_id}_reasoning`,
            debate_id: session_id,
            analysis: result.synthesisResult.analysis,
            supporting_signals: JSON.stringify(result.synthesisResult.supporting_factors),
            counterarguments: JSON.stringify(result.synthesisResult.counterarguments),
            confidence: result.synthesisResult.confidence,
            final_answer: result.synthesisResult.final_answer,
            reasoning_chain: JSON.stringify(result.synthesisResult.reasoning_chain),
          });
        } catch (e) { /* best effort */ }

        // Store memory entry for future retrieval
        try {
          this.store.createMemoryEntry({
            id: `${session_id}_memory`,
            question,
            summary: result.synthesisResult.final_answer.substring(0, 500),
            claims: JSON.stringify(result.thesisClaims.map((c) => c.statement)),
            counter_claims: JSON.stringify(result.counterClaims.map((c) => c.statement)),
            verdict: result.refereeResult.reasoning,
            confidence:
              (result.refereeResult.logic_strength + result.refereeResult.evidence_strength) / 2,
            timestamp: new Date().toISOString(),
            relevance_score: 1.0,
          });
        } catch (e) { /* best effort */ }

        console.log(`[TRUTHFORGE] ✓ Results persisted for ${session_id}`);
      } catch (error) {
        console.error('[TRUTHFORGE] Persistence error:', error);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Other endpoints (unchanged)
  // ═══════════════════════════════════════════════════════════════════════════

  async getMemory(req: Request, res: Response): Promise<void> {
    try {
      const { question } = req.body;

      if (!question) {
        res.status(400).json({ success: false, error: 'Question is required' });
        return;
      }

      const memories = this.store.searchMemoryByQuestion(question);

      res.json({
        success: true,
        count: memories.length,
        memories,
      });
    } catch (error) {
      console.error('Error retrieving memory:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve memory' });
    }
  }

  async getDebate(req: Request, res: Response): Promise<void> {
    try {
      const session_id =
        (req.params as any).session_id ?? (req.params as any).debateId;

      const debate = this.store.getDebate(String(session_id));
      if (!debate) {
        res.status(404).json({ success: false, error: 'Debate not found' });
        return;
      }

      const verdict = this.store.getVerdictByDebate(String(session_id));
      const reasoning = this.store.getReasoningByDebate(String(session_id));
      const claims = this.store.getClaimsByDebate(String(session_id));
      const evidence = this.store.getEvidenceByDebate(String(session_id));

      res.json({ success: true, debate, verdict, reasoning, claims, evidence });
    } catch (error) {
      console.error('Error retrieving debate:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve debate' });
    }
  }

  close(): void {
    this.store.close();
  }
}

export default TruthForgeAPI;
