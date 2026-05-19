/**
 * TruthForge AI - Gemini API Client
 * Wrapper for Google Gemini API with error handling, retries, and logging.
 * Provides agent-specific methods for the TruthForge pipeline.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  PLANNER_CLASSIFY_PROMPT,
  THESIS_CLAIMS_PROMPT,
  ANTITHESIS_ATTACK_PROMPT,
  EVIDENCE_GATHER_PROMPT,
  REFEREE_EVALUATE_PROMPT,
  SYNTHESIS_FINAL_PROMPT,
} from './prompts.ts';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface PlannerResult {
  question_type: string;
  domain: string;
  complexity: number;
  reasoning: string;
  agents_to_activate: string[];
}

export interface ThesisClaim {
  statement: string;
  reasoning: string;
  strength: number;
}

export interface CounterClaim {
  targets_claim_index: number;
  statement: string;
  attack_type: string;
  reasoning: string;
  strength: number;
}

export interface EvidenceItem {
  content: string;
  source_title: string;
  source_type: string;
  supports: string;
  credibility: number;
  relevance: number;
}

export interface EvidenceResult {
  source_count: number;
  source_titles: string[];
  evidence: EvidenceItem[];
}

export interface RefereeResult {
  logic_strength: number;
  evidence_strength: number;
  assumption_risk: number;
  agreement_level: number;
  stronger_position: string;
  key_findings: string[];
  reasoning: string;
}

export interface SynthesisResult {
  analysis: string;
  perspective_exploration: string;
  supporting_factors: string[];
  counterarguments: string[];
  historical_context: string;
  confidence_assessment: string;
  final_answer: string;
  confidence: string;
  reasoning_chain: string[];
}

// Legacy interface kept for backward compatibility
interface AnalysisResult {
  credibility_score: number;
  relevance_score: number;
  key_findings: string[];
  quality_assessment: string;
}

// ─── Client ─────────────────────────────────────────────────────────────────

export class GeminiClient {
  private apiKey: string;
  private model: string;
  private maxRetries: number = 3;
  private retryDelayMs: number = 1000;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.apiKey = key;
    this.model = model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    this.log('info', `Gemini client initialized with model: ${this.model}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW: Agent-specific methods for TruthForge pipeline
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * PLANNER: Classify question type and decide which agents to activate
   */
  async classifyQuestion(question: string): Promise<PlannerResult> {
    this.log('info', `[PLANNER] Classifying question: ${question.substring(0, 60)}...`);

    const prompt = PLANNER_CLASSIFY_PROMPT(question);
    const response = await this._callGeminiWithRetry(prompt);
    const parsed = this._parseJsonResponse(response);

    const validTypes = ['factual', 'prediction', 'controversial', 'strategic', 'philosophical'];
    const questionType = validTypes.includes(parsed.question_type)
      ? parsed.question_type
      : 'factual';

    return {
      question_type: questionType,
      domain: parsed.domain || 'general',
      complexity: this._clamp(parsed.complexity ?? 0.5, 0, 1),
      reasoning: parsed.reasoning || '',
      agents_to_activate: Array.isArray(parsed.agents_to_activate)
        ? parsed.agents_to_activate
        : ['memory', 'thesis', 'antithesis', 'evidence', 'referee', 'synthesis', 'memory_update'],
    };
  }

  /**
   * THESIS: Generate 2-4 concrete supporting claims
   */
  async generateThesisClaims(
    question: string,
    questionType: string,
    domain: string,
    memoryContext: string
  ): Promise<ThesisClaim[]> {
    this.log('info', `[THESIS] Generating claims for: ${question.substring(0, 60)}...`);

    const prompt = THESIS_CLAIMS_PROMPT(question, questionType, domain, memoryContext);
    const response = await this._callGeminiWithRetry(prompt);
    const parsed = this._parseJsonResponse(response);

    if (!Array.isArray(parsed.claims) || parsed.claims.length === 0) {
      this.log('warn', '[THESIS] No claims in response, using raw response');
      return [
        {
          statement: parsed.thesis || response.substring(0, 200),
          reasoning: 'Extracted from unstructured Gemini response',
          strength: 0.7,
        },
      ];
    }

    return parsed.claims.map((c: any) => ({
      statement: String(c.statement || ''),
      reasoning: String(c.reasoning || ''),
      strength: this._clamp(c.strength ?? 0.8, 0, 1),
    }));
  }

  /**
   * ANTITHESIS: Attack each thesis claim individually
   */
  async generateCounterClaims(
    question: string,
    thesisClaims: ThesisClaim[]
  ): Promise<CounterClaim[]> {
    this.log('info', `[ANTITHESIS] Generating counter-claims for ${thesisClaims.length} claims`);

    const prompt = ANTITHESIS_ATTACK_PROMPT(question, thesisClaims);
    const response = await this._callGeminiWithRetry(prompt);
    const parsed = this._parseJsonResponse(response);

    if (!Array.isArray(parsed.counter_claims) || parsed.counter_claims.length === 0) {
      this.log('warn', '[ANTITHESIS] No counter_claims in response');
      return [
        {
          targets_claim_index: 0,
          statement: parsed.antithesis || response.substring(0, 200),
          attack_type: 'logical',
          reasoning: 'Extracted from unstructured Gemini response',
          strength: 0.7,
        },
      ];
    }

    return parsed.counter_claims.map((c: any) => ({
      targets_claim_index: c.targets_claim_index ?? 0,
      statement: String(c.statement || ''),
      attack_type: String(c.attack_type || 'logical'),
      reasoning: String(c.reasoning || ''),
      strength: this._clamp(c.strength ?? 0.75, 0, 1),
    }));
  }

  /**
   * EVIDENCE: Gather structured evidence for claims and counter-claims
   */
  async generateEvidenceAnalysis(
    question: string,
    claims: string[],
    counterClaims: string[]
  ): Promise<EvidenceResult> {
    this.log('info', `[EVIDENCE] Gathering evidence for ${claims.length} claims + ${counterClaims.length} counter-claims`);

    const prompt = EVIDENCE_GATHER_PROMPT(question, claims, counterClaims);
    const response = await this._callGeminiWithRetry(prompt);
    const parsed = this._parseJsonResponse(response);

    const evidence: EvidenceItem[] = Array.isArray(parsed.evidence)
      ? parsed.evidence.map((e: any) => ({
          content: String(e.content || ''),
          source_title: String(e.source_title || 'Unknown source'),
          source_type: String(e.source_type || 'general'),
          supports: String(e.supports || 'both'),
          credibility: this._clamp(e.credibility ?? 0.7, 0, 1),
          relevance: this._clamp(e.relevance ?? 0.7, 0, 1),
        }))
      : [];

    return {
      source_count: parsed.source_count ?? evidence.length,
      source_titles: Array.isArray(parsed.source_titles) ? parsed.source_titles : evidence.map(e => e.source_title),
      evidence,
    };
  }

  /**
   * REFEREE: Evaluate the debate quality with real scores
   */
  async evaluateDebate(
    question: string,
    claims: Array<{ statement: string; strength: number }>,
    counterClaims: Array<{ statement: string; strength: number }>,
    evidence: Array<{ content: string; supports: string; credibility: number }>
  ): Promise<RefereeResult> {
    this.log('info', `[REFEREE] Evaluating debate...`);

    const prompt = REFEREE_EVALUATE_PROMPT(question, claims, counterClaims, evidence);
    const response = await this._callGeminiWithRetry(prompt);
    const parsed = this._parseJsonResponse(response);

    return {
      logic_strength: this._clamp(parsed.logic_strength ?? 0.7, 0, 1),
      evidence_strength: this._clamp(parsed.evidence_strength ?? 0.7, 0, 1),
      assumption_risk: this._clamp(parsed.assumption_risk ?? 0.5, 0, 1),
      agreement_level: this._clamp(parsed.agreement_level ?? 0.5, 0, 1),
      stronger_position: parsed.stronger_position || 'balanced',
      key_findings: Array.isArray(parsed.key_findings) ? parsed.key_findings : [],
      reasoning: String(parsed.reasoning || ''),
    };
  }

  /**
   * SYNTHESIS: Generate the final structured output
   */
  async generateFinalSynthesis(data: {
    question: string;
    questionType: string;
    claims: Array<{ statement: string }>;
    counterClaims: Array<{ statement: string }>;
    evidence: Array<{ content: string; source_title: string; supports: string }>;
    scores: {
      logic_strength: number;
      evidence_strength: number;
      assumption_risk: number;
      agreement_level: number;
      stronger_position: string;
    };
  }): Promise<SynthesisResult> {
    this.log('info', `[SYNTHESIS] Generating final analysis...`);

    const prompt = SYNTHESIS_FINAL_PROMPT(data);
    const response = await this._callGeminiWithRetry(prompt);
    const parsed = this._parseJsonResponse(response);

    return {
      analysis: String(parsed.analysis || response.substring(0, 400)),
      perspective_exploration: String(parsed.perspective_exploration || ''),
      supporting_factors: Array.isArray(parsed.supporting_factors) ? parsed.supporting_factors : [],
      counterarguments: Array.isArray(parsed.counterarguments) ? parsed.counterarguments : [],
      historical_context: String(parsed.historical_context || ''),
      confidence_assessment: String(parsed.confidence_assessment || ''),
      final_answer: String(parsed.final_answer || response.substring(0, 300)),
      confidence: this._normalizeConfidence(parsed.confidence),
      reasoning_chain: Array.isArray(parsed.reasoning_chain) ? parsed.reasoning_chain : [],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY: Kept for backward compatibility with older code paths
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate thesis (supporting position) for a question
   */
  async generateThesis(
    question: string,
    topic: string
  ): Promise<{
    thesis: string;
    key_points: string[];
    strength: number;
  }> {
    this.log('info', `Generating thesis for question: ${question}`);

    const prompt = `You are an expert debater generating the STRONGEST supporting position.

Question: ${question}
Topic: ${topic}

Generate a comprehensive thesis that supports this position. Your response MUST be valid JSON with this structure:
{
  "thesis": "Your main supporting position statement",
  "key_points": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "reasoning": "Detailed reasoning for this position",
  "strength": 0.85
}

Ensure the thesis is logically sound, well-reasoned, and compelling. Include specific supporting arguments.`;

    const response = await this._callGeminiWithRetry(prompt);
    const parsed = this._parseJsonResponse(response);

    this.log('info', `Thesis generated successfully`);
    return {
      thesis: parsed.thesis || response,
      key_points: parsed.key_points || [],
      strength: parsed.strength || 0.8,
    };
  }

  /**
   * Generate antithesis (counter-position)
   */
  async generateAntithesis(
    claims: string[]
  ): Promise<{
    antithesis: string;
    counter_points: string[];
    strength: number;
  }> {
    this.log('info', `Generating antithesis for ${claims.length} claims`);

    const claimsText = claims.map((c, i) => `${i + 1}. ${c}`).join('\n');

    const prompt = `You are an expert debater generating strong counter-arguments.

These are the main claims to counter:
${claimsText}

Generate compelling counter-arguments that present the strongest opposing position. Your response MUST be valid JSON with this structure:
{
  "antithesis": "Your main counter-position statement",
  "counter_points": ["counter point 1", "counter point 2", "counter point 3", "counter point 4", "counter point 5"],
  "reasoning": "Detailed reasoning for this opposing position",
  "strength": 0.80
}

Ensure the antithesis is logically valid and presents serious challenges to the original claims.`;

    const response = await this._callGeminiWithRetry(prompt);
    const parsed = this._parseJsonResponse(response);

    this.log('info', `Antithesis generated successfully`);
    return {
      antithesis: parsed.antithesis || response,
      counter_points: parsed.counter_points || [],
      strength: parsed.strength || 0.75,
    };
  }

  /**
   * Analyze quality and credibility of evidence
   */
  async analyzeEvidence(
    evidence: string,
    claim: string
  ): Promise<AnalysisResult> {
    this.log('info', `Analyzing evidence quality`);

    const prompt = `You are an expert evidence analyst evaluating the quality and relevance of evidence.

Claim: ${claim}

Evidence: ${evidence}

Evaluate this evidence and provide your assessment in valid JSON format:
{
  "credibility_score": 0.85,
  "relevance_score": 0.90,
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "quality_assessment": "Detailed assessment of the evidence quality",
  "limitations": "Any limitations or caveats to consider"
}

Provide scores from 0 to 1 (1 being highest credibility/relevance).`;

    const response = await this._callGeminiWithRetry(prompt);
    const parsed = this._parseJsonResponse(response);

    this.log('info', `Evidence analysis complete`);
    return {
      credibility_score: parsed.credibility_score ?? 0.7,
      relevance_score: parsed.relevance_score ?? 0.7,
      key_findings: parsed.key_findings || [],
      quality_assessment: parsed.quality_assessment || response,
    };
  }

  /**
   * Generate synthesis (final reasoning summary)
   */
  async generateSynthesis(data: {
    question: string;
    thesis: string;
    antithesis: string;
    evidence: AnalysisResult[];
  }): Promise<{
    analysis: string;
    supporting_signals: string[];
    counterarguments: string[];
    confidence: string;
    final_answer: string;
  }> {
    this.log('info', `Generating synthesis`);

    const evidenceSummary = data.evidence
      .map((e) => `Credibility: ${e.credibility_score}, Relevance: ${e.relevance_score}`)
      .join('; ');

    const prompt = `You are an expert synthesizing a comprehensive debate analysis.

Question: ${data.question}

Supporting Position: ${data.thesis}
Counter Position: ${data.antithesis}
Evidence Quality: ${evidenceSummary}

Synthesize all information and provide your comprehensive analysis in valid JSON:
{
  "analysis": "Comprehensive analysis integrating all positions and evidence",
  "supporting_signals": ["signal 1", "signal 2", "signal 3"],
  "counterarguments": ["counter 1", "counter 2", "counter 3"],
  "confidence": "High/Medium/Low",
  "final_answer": "Your well-reasoned final assessment"
}

Provide a balanced, thorough analysis that considers all perspectives.`;

    const response = await this._callGeminiWithRetry(prompt);
    const parsed = this._parseJsonResponse(response);

    this.log('info', `Synthesis complete`);
    return {
      analysis: parsed.analysis || response,
      supporting_signals: parsed.supporting_signals || [],
      counterarguments: parsed.counterarguments || [],
      confidence: parsed.confidence || 'Medium',
      final_answer: parsed.final_answer || response,
    };
  }

  /**
   * Generate verdict evaluating logic and evidence quality
   */
  async generateVerdict(data: {
    thesis: string;
    antithesis: string;
    evidence: AnalysisResult[];
  }): Promise<{
    evaluation: string;
    logic_quality_score: number;
    evidence_strength_score: number;
    assumption_validity: number;
    overall_confidence: number;
  }> {
    this.log('info', `Generating verdict`);

    const prompt = `You are an expert judge evaluating the quality of reasoning and evidence.

Thesis: ${data.thesis}
Antithesis: ${data.antithesis}

Evidence Summary:
- Average Credibility: ${(data.evidence.reduce((a, e) => a + e.credibility_score, 0) / Math.max(data.evidence.length, 1)).toFixed(2)}
- Average Relevance: ${(data.evidence.reduce((a, e) => a + e.relevance_score, 0) / Math.max(data.evidence.length, 1)).toFixed(2)}

Provide your verdict in valid JSON:
{
  "evaluation": "Your assessment of which position has stronger foundation",
  "logic_quality_score": 0.85,
  "evidence_strength_score": 0.80,
  "assumption_validity": 0.75,
  "overall_confidence": 0.82,
  "key_findings": ["finding 1", "finding 2"],
  "reasoning_quality": "Explanation of overall reasoning quality"
}

All scores should be between 0 and 1.`;

    const response = await this._callGeminiWithRetry(prompt);
    const parsed = this._parseJsonResponse(response);

    this.log('info', `Verdict generated`);
    return {
      evaluation: parsed.evaluation || response,
      logic_quality_score: this._clamp(parsed.logic_quality_score ?? 0.75, 0, 1),
      evidence_strength_score: this._clamp(parsed.evidence_strength_score ?? 0.75, 0, 1),
      assumption_validity: this._clamp(parsed.assumption_validity ?? 0.75, 0, 1),
      overall_confidence: this._clamp(parsed.overall_confidence ?? 0.75, 0, 1),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Internal helpers
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Call Gemini API with retry logic
   */
  private async _callGeminiWithRetry(prompt: string): Promise<string> {
    let lastError: Error | null = null;

    const isNonRetryable = (msg: string): boolean => {
      const m = msg.toLowerCase();
      return (
        m.includes('429') ||
        m.includes('quota exceeded') ||
        m.includes('rate limit') ||
        m.includes('permission') ||
        m.includes('api key')
      );
    };

    const getPerCallTimeoutMs = (): number => {
      const raw =
        process.env.GEMINI_CALL_TIMEOUT_MS ||
        process.env.GEMINI_TIMEOUT_MS ||
        '15000';
      const ms = parseInt(raw, 10);
      return Number.isFinite(ms) && ms > 0 ? ms : 15000;
    };

    const helperPath = fileURLToPath(new URL('./gemini-subprocess.mjs', import.meta.url));

    const generateInSubprocess = (promptText: string, timeoutMs: number): Promise<string> => {
      return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [helperPath], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            GEMINI_API_KEY: this.apiKey,
            GEMINI_MODEL: this.model,
            GEMINI_CALL_TIMEOUT_MS: String(timeoutMs),
          },
        });

        let out = '';
        let err = '';

        const killTimer = setTimeout(() => {
          child.kill();
          reject(new Error(`Gemini subprocess timed out after ${timeoutMs}ms`));
        }, timeoutMs + 500);

        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', (d) => (out += d));
        child.stderr.on('data', (d) => (err += d));

        child.on('error', (e) => {
          clearTimeout(killTimer);
          reject(e);
        });

        child.on('close', (code) => {
          clearTimeout(killTimer);
          try {
            const msg = out ? JSON.parse(out) : null;
            if (msg?.ok) {
              resolve(String(msg.text ?? ''));
            } else {
              reject(
                new Error(
                  String(msg?.error || err || `Gemini subprocess failed (code ${code})`)
                )
              );
            }
          } catch (e) {
            reject(
              new Error(
                `Failed to parse Gemini subprocess response: ${String(e)}; stdout=${out.slice(0, 200)}; stderr=${err.slice(0, 200)}`
              )
            );
          }
        });

        const payload = JSON.stringify({
          prompt: promptText,
          timeoutMs,
          model: this.model,
        });
        child.stdin.write(payload);
        child.stdin.end();
      });
    };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const timeoutMs = getPerCallTimeoutMs();
        this.log(
          'debug',
          `Calling Gemini API (attempt ${attempt}/${this.maxRetries}, timeout=${timeoutMs}ms)`
        );

        const text = await generateInSubprocess(prompt, timeoutMs);

        if (!text) {
          throw new Error('Empty response from Gemini API');
        }

        this.log('debug', `Gemini API call successful`);
        return text;
      } catch (error) {
        lastError = error as Error;
        this.log(
          'warn',
          `Gemini API call failed (attempt ${attempt}): ${lastError.message}`
        );

        // Quota/rate-limit/auth errors should fail fast so the API can fall back.
        if (isNonRetryable(lastError.message)) {
          break;
        }

        if (attempt < this.maxRetries) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
          this.log('debug', `Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Gemini API call failed: ${lastError?.message}`);
  }

  /**
   * Parse JSON from Gemini response
   */
  private _parseJsonResponse(response: string): Record<string, any> {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    } catch (error) {
      this.log('warn', `Failed to parse JSON response: ${error}`);
      return {};
    }
  }

  /**
   * Clamp a number to a range
   */
  private _clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  /**
   * Normalize confidence string
   */
  private _normalizeConfidence(value: any): string {
    const s = String(value || '').toLowerCase();
    if (s.includes('high')) return 'High';
    if (s.includes('low')) return 'Low';
    return 'Moderate';
  }

  /**
   * Logging utility
   */
  private log(
    level: 'info' | 'debug' | 'warn' | 'error',
    message: string
  ): void {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };

    if (levels[level] >= levels[logLevel as keyof typeof levels]) {
      console.log(
        `[${new Date().toISOString()}] [GEMINI] [${level.toUpperCase()}] ${message}`
      );
    }
  }
}

export default GeminiClient;
