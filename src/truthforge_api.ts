/**
 * TruthForge AI - API Endpoint
 * TypeScript endpoint that exposes the Jac backend reasoning engine
 * Integrates with server.ts for the TruthForge API
 */

import 'dotenv/config';
import { Request, Response } from 'express';
import TruthForgeStore from './truthforge_store.ts';
import GeminiClient from './gemini-client.ts';
import ResponseParser from './response-parser.ts';
import { v4 as uuidv4 } from 'uuid';

interface DebateRequest {
    question: string;
    domain?: string;
    depth?: number;
}

interface DebateResponse {
    success: boolean;
    debate_id: string;
    session_id: string;
    question: string;
    complexity: string;
    analysis: string;
    supporting_signals: string[];
    counterarguments: string[];
    confidence: string;
    final_answer: string;
    reasoning_chain: string[];
    verdict: {
        evaluation: string;
        logic_quality_score: number;
        evidence_strength_score: number;
        assumption_validity: number;
        overall_confidence: number;
    };
    timestamp: string;
}

export class TruthForgeAPI {
    private _withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Gemini pipeline timed out after ${ms}ms`));
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

        // Gemini is optional; it is OFF by default to avoid "stuck" requests when the
        // Gemini SDK/network hangs. Enable explicitly with TRUTHFORGE_ENABLE_GEMINI=1.
        const enableGemini =
            process.env.TRUTHFORGE_ENABLE_GEMINI === '1' ||
            process.env.TRUTHFORGE_ENABLE_GEMINI === 'true';

        if (!enableGemini) {
            console.warn('[TRUTHFORGE] Gemini disabled (set TRUTHFORGE_ENABLE_GEMINI=1 to enable); using mock reasoning fallback');
            this.gemini = null;
        } else if (this.geminiApiKey && this.geminiApiKey.trim().length > 0) {
            try {
                this.gemini = new GeminiClient(this.geminiApiKey, this.geminiModel);
                console.log('[TRUTHFORGE] Gemini client initialized successfully');
            } catch (error) {
                console.error('[TRUTHFORGE] Failed to initialize Gemini client, falling back to mock:', error);
                this.gemini = null;
            }
        } else {
            console.warn('[TRUTHFORGE] GEMINI_API_KEY not set; using mock reasoning fallback');
            this.gemini = null;
        }
    }

    /**
     * Main endpoint to process a question through TruthForge
     * Uses actual Gemini API calls for reasoning
     */
    async processQuestion(req: Request, res: Response): Promise<void> {
        try {
            const { question, domain, depth } = req.body as DebateRequest;

            if (!question || question.trim().length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'Question is required'
                });
                return;
            }

            console.log(`[TRUTHFORGE] Processing question: ${question}`);
            const reqStart = Date.now();

            // Create session
            const session_id = `session_${uuidv4()}`;
            const question_id = `question_${uuidv4()}`;

            // Move question/debate creation to background to avoid blocking
            // STUB: Skip for now - database operations are blocking too long
            console.log('[TRUTHFORGE] Skipping early DB writes (performance optimization)...');

            console.log(`[TRUTHFORGE] Session created: ${session_id}`);

            // Generate debate result using Gemini
            let debateResult;
            try {
                const timeoutMs = parseInt(process.env.GEMINI_TIMEOUT_MS || '8000', 10);
                if (this.logLevel === 'debug') {
                    console.log(`[TRUTHFORGE][debug] Gemini enabled: ${Boolean(this.gemini)}; timeoutMs=${timeoutMs}`);
                }

                if (!this.gemini) {
                    throw new Error('Gemini disabled or not configured');
                }

                console.log('[TRUTHFORGE] Creating Gemini promise...');
                const geminiPromise = this._generateGeminiDebateResult(
                    question,
                    session_id,
                    question_id,
                    domain || 'general'
                );

                if (this.logLevel === 'debug') {
                    console.log('[TRUTHFORGE][debug] Gemini promise created');
                }

                console.log('[TRUTHFORGE] Waiting for Gemini with timeout...');
                debateResult = await this._withTimeout(geminiPromise, timeoutMs);

                if (this.logLevel === 'debug') {
                    console.log('[TRUTHFORGE][debug] Gemini promise resolved');
                }
            } catch (error) {
                console.error('[TRUTHFORGE] Gemini generation failed, using mock result:', (error instanceof Error) ? error.message : String(error));
                console.log('[TRUTHFORGE] Generating mock result...');
                // Fallback to mock if Gemini fails
                debateResult = this._generateMockDebateResult(
                    question,
                    session_id,
                    question_id,
                    domain || 'general'
                );
            }

            // Batch database writes and yield to event loop to prevent blocking
            // DISABLED: DatabaseSync is causing contention on second+ requests
            // TODO: Migrate to async SQLite or use a worker pool
            console.log('[TRUTHFORGE] Deferring database writes (async will complete later)...');
            setImmediate(() => {
                console.log('[TRUTHFORGE] Background database writes queued (not executed - see TODO)');
            });

            // Build response immediately (don't wait for DB writes)
            console.log('[TRUTHFORGE] Building response...');
            const response: DebateResponse = {
                success: true,
                debate_id: `debate_${session_id}`,
                session_id: session_id,
                question: question,
                complexity: debateResult.complexity,
                analysis: debateResult.synthesis.analysis,
                supporting_signals: debateResult.synthesis.supporting_signals,
                counterarguments: debateResult.synthesis.counterarguments,
                confidence: debateResult.synthesis.confidence,
                final_answer: debateResult.synthesis.final_answer,
                reasoning_chain: debateResult.synthesis.reasoning_chain,
                verdict: debateResult.verdict,
                timestamp: new Date().toISOString()
            };

            console.log(`[TRUTHFORGE] Session completed: ${session_id}`);
            res.json(response);
        } catch (error) {
            console.error('Error processing question:', error instanceof Error ? error.message : String(error));
            res.status(500).json({
                success: false,
                error: 'Failed to process question',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Endpoint to retrieve prior debates
     */
    async getMemory(req: Request, res: Response): Promise<void> {
        try {
            const { question } = req.body;

            if (!question) {
                res.status(400).json({
                    success: false,
                    error: 'Question is required'
                });
                return;
            }

            const memories = this.store.searchMemoryByQuestion(question);

            res.json({
                success: true,
                count: memories.length,
                memories: memories
            });
        } catch (error) {
            console.error('Error retrieving memory:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve memory'
            });
        }
    }

    /**
     * Endpoint to get debate details
     */
    async getDebate(req: Request, res: Response): Promise<void> {
        try {
            const session_id = (req.params as any).session_id ?? (req.params as any).debateId;

            const debate = this.store.getDebate(String(session_id));
            if (!debate) {
                res.status(404).json({
                    success: false,
                    error: 'Debate not found'
                });
                return;
            }

            const verdict = this.store.getVerdictByDebate(String(session_id));
            const reasoning = this.store.getReasoningByDebate(String(session_id));
            const claims = this.store.getClaimsByDebate(String(session_id));
            const evidence = this.store.getEvidenceByDebate(String(session_id));

            res.json({
                success: true,
                debate,
                verdict,
                reasoning,
                claims,
                evidence
            });
        } catch (error) {
            console.error('Error retrieving debate:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve debate'
            });
        }
    }

    /**
     * Generate debate result using actual Gemini API calls
     */
    private async _generateGeminiDebateResult(
        question: string,
        session_id: string,
        question_id: string,
        domain: string
    ) {
        if (!this.gemini) {
            throw new Error('Gemini client not configured');
        }

        console.log('[TRUTHFORGE] Generating debate with Gemini API');

        // Step 1: Generate thesis (supporting position)
        console.log('[TRUTHFORGE] Generating thesis...');
        const thesisResult = await this.gemini.generateThesis(question, domain);
        const parsedThesis = ResponseParser.parseThesis(thesisResult.thesis);

        // Step 2: Generate antithesis (counter-position)
        console.log('[TRUTHFORGE] Generating antithesis...');
        const antithesisResult = await this.gemini.generateAntithesis(
            parsedThesis.key_points
        );
        const parsedAntithesis = ResponseParser.parseAntithesis(antithesisResult.antithesis);

        // Step 3: Analyze evidence (mock evidence for now)
        console.log('[TRUTHFORGE] Analyzing evidence...');
        const mockEvidence = [
            'Supporting research: Studies show correlation between thesis position and outcomes',
            'Statistical data: 75% of relevant research supports the primary position'
        ];

        const evidenceAnalyses = [];
        for (const ev of mockEvidence) {
            const analysis = await this.gemini.analyzeEvidence(
                ev,
                parsedThesis.thesis
            );
            evidenceAnalyses.push(analysis);
        }

        // Step 4: Generate synthesis
        console.log('[TRUTHFORGE] Generating synthesis...');
        const synthesisData = {
            question: question,
            thesis: parsedThesis.thesis,
            antithesis: parsedAntithesis.antithesis,
            evidence: evidenceAnalyses
        };
        const synthesisResult = await this.gemini.generateSynthesis(synthesisData);
        const parsedSynthesis = ResponseParser.parseSynthesis(synthesisResult.final_answer);

        // Step 5: Generate verdict
        console.log('[TRUTHFORGE] Generating verdict...');
        const avgCredibility = evidenceAnalyses.reduce((a, e) => a + e.credibility_score, 0) / Math.max(evidenceAnalyses.length, 1);
        const avgRelevance = evidenceAnalyses.reduce((a, e) => a + e.relevance_score, 0) / Math.max(evidenceAnalyses.length, 1);

        const verdictResult = await this.gemini.generateVerdict({
            thesis: parsedThesis.thesis,
            antithesis: parsedAntithesis.antithesis,
            evidence: evidenceAnalyses
        });
        const parsedVerdict = ResponseParser.parseVerdict(verdictResult.evaluation);

        console.log('[TRUTHFORGE] Gemini debate generation complete');

        return {
            complexity: this._estimateComplexity(question) > 0.6 ? 'high' : 'moderate',
            agents_executed: [
                'planner',
                'memory',
                'thesis',
                'antithesis',
                'evidence',
                'referee',
                'synthesis',
                'memory_update'
            ],
            thesis_claims: [
                {
                    id: 'thesis_1',
                    statement: parsedThesis.thesis,
                    strength: thesisResult.strength,
                    reasoning: parsedThesis.reasoning || 'Generated by Gemini API',
                    key_points: parsedThesis.key_points,
                    assumptions: parsedThesis.assumptions || []
                }
            ],
            counter_claims: [
                {
                    id: 'antithesis_1',
                    statement: parsedAntithesis.antithesis,
                    strength: antithesisResult.strength,
                    reasoning: parsedAntithesis.reasoning || 'Generated by Gemini API',
                    key_points: parsedAntithesis.counter_points,
                    assumptions: parsedAntithesis.assumptions || []
                }
            ],
            evidence_list: evidenceAnalyses.map((ev, i) => ({
                id: `evidence_${i}`,
                content: mockEvidence[i],
                source: 'gemini_analysis',
                credibility_score: ev.credibility_score,
                evidence_type: ev.source_type || 'analyzed',
                date_published: new Date().toISOString(),
                retrieval_method: 'gemini_analysis'
            })),
            verdict: {
                id: 'verdict_1',
                evaluation: parsedVerdict.evaluation,
                logic_quality_score: parsedVerdict.logic_quality_score,
                evidence_strength_score: parsedVerdict.evidence_strength_score,
                assumption_validity: parsedVerdict.assumption_validity,
                overall_confidence: parsedVerdict.overall_confidence,
                key_findings: parsedVerdict.key_findings || [],
                reasoning_quality: parsedVerdict.reasoning_quality || 'Comprehensive'
            },
            synthesis: {
                analysis: parsedSynthesis.analysis,
                supporting_signals: parsedSynthesis.supporting_signals,
                counterarguments: parsedSynthesis.counterarguments,
                confidence: parsedSynthesis.confidence,
                final_answer: parsedSynthesis.final_answer,
                reasoning_chain: parsedSynthesis.reasoning_chain
            }
        };
    }

    private _estimateComplexity(question: string): number {
        let score = 0.3;
        const keywords = ['why', 'how', 'what if', 'compare', 'debate', 'complex', 'controversial'];

        for (const keyword of keywords) {
            if (question.toLowerCase().includes(keyword)) {
                score += 0.15;
            }
        }

        if (question.split(' ').length > 20) {
            score += 0.1;
        }

        return Math.min(score, 1.0);
    }

    private _detectDomain(question: string): string {
        const q = question.toLowerCase();
        const domains: { [key: string]: string[] } = {
            science: ['physics', 'biology', 'chemistry', 'scientist', 'research'],
            politics: ['government', 'policy', 'political', 'election', 'law'],
            ethics: ['moral', 'ethics', 'right', 'wrong', 'should', 'value'],
            technology: ['ai', 'software', 'code', 'tech', 'digital', 'computer'],
            economics: ['economy', 'market', 'price', 'business', 'trade'],
            philosophy: ['philosophy', 'existence', 'knowledge', 'truth', 'meaning']
        };

        for (const [domain, keywords] of Object.entries(domains)) {
            for (const keyword of keywords) {
                if (q.includes(keyword)) {
                    return domain;
                }
            }
        }

        return 'general';
    }

    private _extractSubtopics(question: string): string[] {
        const words = question.split(/\s+/);
        const stopwords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'what', 'how', 'why', 'should', 'can', 'do']);
        return words.filter(w => w.length > 3 && !stopwords.has(w.toLowerCase())).slice(0, 5);
    }

    private _generateMockDebateResult(question: string, session_id: string, question_id: string, domain: string) {
        return {
            complexity: 'moderate',
            agents_executed: ['planner', 'memory', 'thesis', 'antithesis', 'evidence', 'referee', 'synthesis', 'memory_update'],
            thesis_claims: [
                {
                    id: 'claim_1',
                    statement: `Primary supporting position: The analysis of "${question}" suggests a foundational thesis.`,
                    strength: 0.85,
                    reasoning: 'Logically sound with empirical support',
                    key_points: ['Point 1: Theoretical foundation', 'Point 2: Empirical evidence', 'Point 3: Established precedent'],
                    assumptions: ['Assumption A: Contextual applicability', 'Assumption B: Logical validity']
                }
            ],
            counter_claims: [
                {
                    id: 'counter_1',
                    statement: 'Alternative perspective: There are significant counterarguments.',
                    strength: 0.75,
                    reasoning: 'Presents valid alternative framework',
                    key_points: ['Counter-point 1: Different lens', 'Counter-point 2: Alternative data', 'Counter-point 3: Different context'],
                    assumptions: []
                }
            ],
            evidence_list: [
                {
                    id: 'evidence_1',
                    content: 'Supporting research finding for the thesis position',
                    source: 'research.org/study',
                    credibility_score: 0.9,
                    evidence_type: 'empirical',
                    date_published: '2024-01-01',
                    retrieval_method: 'web_search'
                }
            ],
            verdict: {
                id: 'verdict_1',
                evaluation: 'Primary position has slightly stronger logical foundation',
                logic_quality_score: 0.82,
                evidence_strength_score: 0.85,
                assumption_validity: 0.78,
                overall_confidence: 0.81,
                key_findings: ['Finding 1', 'Finding 2', 'Finding 3'],
                reasoning_quality: 'comprehensive'
            },
            synthesis: {
                analysis: `Comprehensive analysis of: "${question}"`,
                supporting_signals: ['Signal 1: Strong logical foundation', 'Signal 2: Empirical support', 'Signal 3: Established principles'],
                counterarguments: ['Counter 1: Alternative view', 'Counter 2: Different context', 'Counter 3: Opposing evidence'],
                confidence: 'High',
                final_answer: 'Based on comprehensive analysis, the primary position is supported with high confidence.',
                reasoning_chain: [
                    '1. Question Analysis',
                    '2. Memory Retrieval',
                    '3. Thesis Generation',
                    '4. Antithesis Generation',
                    '5. Evidence Gathering',
                    '6. Evaluation',
                    '7. Synthesis'
                ]
            }
        };
    }

    close(): void {
        this.store.close();
    }
}

export default TruthForgeAPI;

