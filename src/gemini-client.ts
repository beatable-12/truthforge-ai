/**
 * TruthForge AI - Gemini API Client
 * Wrapper for Google Gemini API with error handling, retries, and logging
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiResponse {
  text: string;
  finishReason?: string;
}

interface AnalysisResult {
  credibility_score: number;
  relevance_score: number;
  key_findings: string[];
  quality_assessment: string;
}

export class GeminiClient {
  private client: GoogleGenerativeAI;
  private model: string;
  private maxRetries: number = 3;
  private retryDelayMs: number = 1000;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.client = new GoogleGenerativeAI(key);
    this.model = model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    this.log('info', `Gemini client initialized with model: ${this.model}`);
  }

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
      strength: parsed.strength || 0.8
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
      strength: parsed.strength || 0.75
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
      quality_assessment: parsed.quality_assessment || response
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
      .map(e => `Credibility: ${e.credibility_score}, Relevance: ${e.relevance_score}`)
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
      final_answer: parsed.final_answer || response
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
      logic_quality_score: Math.min(1, Math.max(0, parsed.logic_quality_score ?? 0.75)),
      evidence_strength_score: Math.min(1, Math.max(0, parsed.evidence_strength_score ?? 0.75)),
      assumption_validity: Math.min(1, Math.max(0, parsed.assumption_validity ?? 0.75)),
      overall_confidence: Math.min(1, Math.max(0, parsed.overall_confidence ?? 0.75))
    };
  }

  /**
   * Call Gemini API with retry logic
   */
  private async _callGeminiWithRetry(prompt: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.log('debug', `Calling Gemini API (attempt ${attempt}/${this.maxRetries})`);

        const model = this.client.getGenerativeModel({ model: this.model });
        const result = await model.generateContent(prompt);
        const response = result.response;

        if (!response.text()) {
          throw new Error('Empty response from Gemini API');
        }

        this.log('debug', `Gemini API call successful`);
        return response.text();
      } catch (error) {
        lastError = error as Error;
        this.log('warn', `Gemini API call failed (attempt ${attempt}): ${lastError.message}`);

        if (attempt < this.maxRetries) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
          this.log('debug', `Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Gemini API call failed after ${this.maxRetries} attempts: ${lastError?.message}`
    );
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
   * Logging utility
   */
  private log(level: 'info' | 'debug' | 'warn' | 'error', message: string): void {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };

    if (levels[level] >= levels[logLevel as keyof typeof levels]) {
      console.log(`[${new Date().toISOString()}] [GEMINI] [${level.toUpperCase()}] ${message}`);
    }
  }
}

export default GeminiClient;
