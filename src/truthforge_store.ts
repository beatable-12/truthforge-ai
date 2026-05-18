/**
 * TruthForge AI - SQLite Store
 * TypeScript wrapper for SQLite persistence
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface Debate {
    id: string;
    question_id: string;
    status: string;
    complexity_level: string;
    agents_activated: string;
    stage: number;
    total_stages: number;
    created_at: string;
    updated_at: string;
}

export interface Question {
    id: string;
    text: string;
    complexity: number;
    domain: string;
    subtopics: string;
    created_at: string;
    updated_at: string;
}

export interface Claim {
    id: string;
    debate_id: string;
    statement: string;
    strength: number;
    reasoning: string;
    key_points: string;
    assumptions: string;
    supporting_count: number;
    created_at: string;
    updated_at: string;
}

export interface Verdict {
    id: string;
    debate_id: string;
    evaluation: string;
    logic_quality_score: number;
    evidence_strength_score: number;
    assumption_validity: number;
    overall_confidence: number;
    key_findings: string;
    reasoning_quality: string;
    created_at: string;
}

export interface Evidence {
    id: string;
    debate_id: string;
    content: string;
    source: string;
    credibility_score: number;
    evidence_type: string;
    date_published: string;
    retrieval_method: string;
    created_at: string;
}

export interface Reasoning {
    id: string;
    debate_id: string;
    analysis: string;
    supporting_signals: string;
    counterarguments: string;
    confidence: string;
    final_answer: string;
    reasoning_chain: string;
    created_at: string;
}

export interface Relationship {
    id: string;
    source_id: string;
    target_id: string;
    relation_type: string;
    weight: number;
    strength: number;
    explanation: string;
    metadata: string;
    created_at: string;
}

export interface MemoryEntry {
    id: string;
    question: string;
    summary: string;
    claims: string;
    counter_claims: string;
    verdict: string;
    confidence: number;
    timestamp: string;
    relevance_score: number;
    created_at: string;
}

export class TruthForgeStore {
    private db: DatabaseSync;
    private dbPath: string;
    private isInitialized: boolean = false;

    constructor(dbPath: string = './truthforge.db') {
        this.dbPath = dbPath;
        this.db = new DatabaseSync(dbPath);
        this.isInitialized = false;
    }

    /**
     * Initialize schema - called once on startup
     */
    public initializeSchema(): void {
        if (this.isInitialized) {
            console.log('[TruthForgeStore] Schema already initialized');
            return;
        }

        try {
            const schemaPath = path.join(__dirname, './truthforge_schema.sql');
            const schema = readFileSync(schemaPath, 'utf-8');
            this.db.exec(schema);
            this.db.exec('PRAGMA foreign_keys = ON;');
            this.isInitialized = true;
            console.log('[TruthForgeStore] Schema initialized successfully');
        } catch (error) {
            console.error('[TruthForgeStore] Failed to initialize schema:', error);
            throw error;
        }
    }

    /**
     * Get database connection status
     */
    public isConnected(): boolean {
        try {
            this.db.prepare('SELECT 1').get();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get table count
     */
    public getTableCount(): number {
        const result = this.db
            .prepare(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`)
            .get() as { count: number };
        return result?.count || 0;
    }

    /**
     * Begin transaction
     */
    public beginTransaction(): void {
        this.db.exec('BEGIN TRANSACTION');
    }

    /**
     * Commit transaction
     */
    public commitTransaction(): void {
        this.db.exec('COMMIT');
    }

    /**
     * Rollback transaction
     */
    public rollbackTransaction(): void {
        this.db.exec('ROLLBACK');
    }

    // Debate operations
    createDebate(debate: Omit<Debate, 'created_at' | 'updated_at'>): Debate {
        const stmt = this.db.prepare(`
            INSERT INTO debates (id, question_id, status, complexity_level, agents_activated, stage, total_stages)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            debate.id,
            debate.question_id,
            debate.status,
            debate.complexity_level,
            debate.agents_activated,
            debate.stage,
            debate.total_stages
        );
        return this.getDebate(debate.id) as Debate;
    }

    getDebate(id: string): Debate | null {
        const stmt = this.db.prepare('SELECT * FROM debates WHERE id = ?');
        return (stmt.get(id) as Debate) || null;
    }

    updateDebate(id: string, updates: Partial<Debate>): void {
        const allowed = ['status', 'complexity_level', 'agents_activated', 'stage', 'total_stages'];
        const updates_map = Object.entries(updates).filter(([key]) => allowed.includes(key));

        if (updates_map.length === 0) return;

        const setClauses = updates_map.map(([key]) => `${key} = ?`).join(', ');
        const values = updates_map.map(([_, value]) => value);

        const stmt = this.db.prepare(`
            UPDATE debates SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `);
        stmt.run(...values, id);
    }

    // Question operations
    createQuestion(question: Omit<Question, 'created_at' | 'updated_at'>): Question {
        const stmt = this.db.prepare(`
            INSERT INTO questions (id, text, complexity, domain, subtopics)
            VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(
            question.id,
            question.text,
            question.complexity,
            question.domain,
            question.subtopics
        );
        return this.getQuestion(question.id) as Question;
    }

    getQuestion(id: string): Question | null {
        const stmt = this.db.prepare('SELECT * FROM questions WHERE id = ?');
        return (stmt.get(id) as Question) || null;
    }

    // Claim operations
    createClaim(claim: Omit<Claim, 'created_at' | 'updated_at'>): Claim {
        const stmt = this.db.prepare(`
            INSERT INTO claims (id, debate_id, statement, strength, reasoning, key_points, assumptions, supporting_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            claim.id,
            claim.debate_id,
            claim.statement,
            claim.strength,
            claim.reasoning,
            claim.key_points,
            claim.assumptions,
            claim.supporting_count
        );
        return this.getClaim(claim.id) as Claim;
    }

    getClaim(id: string): Claim | null {
        const stmt = this.db.prepare('SELECT * FROM claims WHERE id = ?');
        return (stmt.get(id) as Claim) || null;
    }

    getClaimsByDebate(debateId: string): Claim[] {
        const stmt = this.db.prepare('SELECT * FROM claims WHERE debate_id = ?');
        return stmt.all(debateId) as Claim[];
    }

    // Evidence operations
    createEvidence(evidence: Omit<Evidence, 'created_at'>): Evidence {
        const stmt = this.db.prepare(`
            INSERT INTO evidence (id, debate_id, content, source, credibility_score, evidence_type, date_published, retrieval_method)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            evidence.id,
            evidence.debate_id,
            evidence.content,
            evidence.source,
            evidence.credibility_score,
            evidence.evidence_type,
            evidence.date_published,
            evidence.retrieval_method
        );
        return this.getEvidence(evidence.id) as Evidence;
    }

    getEvidence(id: string): Evidence | null {
        const stmt = this.db.prepare('SELECT * FROM evidence WHERE id = ?');
        return (stmt.get(id) as Evidence) || null;
    }

    getEvidenceByDebate(debateId: string): Evidence[] {
        const stmt = this.db.prepare('SELECT * FROM evidence WHERE debate_id = ?');
        return stmt.all(debateId) as Evidence[];
    }

    // Verdict operations
    createVerdict(verdict: Omit<Verdict, 'created_at'>): Verdict {
        const stmt = this.db.prepare(`
            INSERT INTO verdicts (id, debate_id, evaluation, logic_quality_score, evidence_strength_score, assumption_validity, overall_confidence, key_findings, reasoning_quality)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            verdict.id,
            verdict.debate_id,
            verdict.evaluation,
            verdict.logic_quality_score,
            verdict.evidence_strength_score,
            verdict.assumption_validity,
            verdict.overall_confidence,
            verdict.key_findings,
            verdict.reasoning_quality
        );
        return this.getVerdict(verdict.id) as Verdict;
    }

    getVerdict(id: string): Verdict | null {
        const stmt = this.db.prepare('SELECT * FROM verdicts WHERE id = ?');
        return (stmt.get(id) as Verdict) || null;
    }

    getVerdictByDebate(debateId: string): Verdict | null {
        const stmt = this.db.prepare('SELECT * FROM verdicts WHERE debate_id = ? ORDER BY created_at DESC LIMIT 1');
        return (stmt.get(debateId) as Verdict) || null;
    }

    // Reasoning operations
    createReasoning(reasoning: Omit<Reasoning, 'created_at'>): Reasoning {
        const stmt = this.db.prepare(`
            INSERT INTO reasonings (id, debate_id, analysis, supporting_signals, counterarguments, confidence, final_answer, reasoning_chain)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            reasoning.id,
            reasoning.debate_id,
            reasoning.analysis,
            reasoning.supporting_signals,
            reasoning.counterarguments,
            reasoning.confidence,
            reasoning.final_answer,
            reasoning.reasoning_chain
        );
        return this.getReasoning(reasoning.id) as Reasoning;
    }

    getReasoning(id: string): Reasoning | null {
        const stmt = this.db.prepare('SELECT * FROM reasonings WHERE id = ?');
        return (stmt.get(id) as Reasoning) || null;
    }

    getReasoningByDebate(debateId: string): Reasoning | null {
        const stmt = this.db.prepare('SELECT * FROM reasonings WHERE debate_id = ? ORDER BY created_at DESC LIMIT 1');
        return (stmt.get(debateId) as Reasoning) || null;
    }

    // Relationship operations (graph edges)
    createRelationship(rel: Omit<Relationship, 'created_at'>): Relationship {
        const stmt = this.db.prepare(`
            INSERT INTO relationships (id, source_id, target_id, relation_type, weight, strength, explanation, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            rel.id,
            rel.source_id,
            rel.target_id,
            rel.relation_type,
            rel.weight,
            rel.strength,
            rel.explanation,
            rel.metadata
        );
        return this.getRelationship(rel.id) as Relationship;
    }

    getRelationship(id: string): Relationship | null {
        const stmt = this.db.prepare('SELECT * FROM relationships WHERE id = ?');
        return (stmt.get(id) as Relationship) || null;
    }

    getRelationshipsBySource(sourceId: string): Relationship[] {
        const stmt = this.db.prepare('SELECT * FROM relationships WHERE source_id = ?');
        return stmt.all(sourceId) as Relationship[];
    }

    getRelationshipsByTarget(targetId: string): Relationship[] {
        const stmt = this.db.prepare('SELECT * FROM relationships WHERE target_id = ?');
        return stmt.all(targetId) as Relationship[];
    }

    // Memory operations
    createMemoryEntry(entry: Omit<MemoryEntry, 'created_at'>): MemoryEntry {
        const stmt = this.db.prepare(`
            INSERT INTO memory_entries (id, question, summary, claims, counter_claims, verdict, confidence, timestamp, relevance_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            entry.id,
            entry.question,
            entry.summary,
            entry.claims,
            entry.counter_claims,
            entry.verdict,
            entry.confidence,
            entry.timestamp,
            entry.relevance_score
        );
        return this.getMemoryEntry(entry.id) as MemoryEntry;
    }

    getMemoryEntry(id: string): MemoryEntry | null {
        const stmt = this.db.prepare('SELECT * FROM memory_entries WHERE id = ?');
        return (stmt.get(id) as MemoryEntry) || null;
    }

    searchMemoryByQuestion(questionText: string): MemoryEntry[] {
        const stmt = this.db.prepare(`
            SELECT * FROM memory_entries 
            WHERE question LIKE ? 
            ORDER BY relevance_score DESC LIMIT 10
        `);
        return stmt.all(`%${questionText}%`) as MemoryEntry[];
    }

    /**
     * Delete all records from a table (development only)
     */
    public deleteAll(tableName: string): void {
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`Cannot delete all records from ${tableName} in production`);
        }
        const stmt = this.db.prepare(`DELETE FROM ${tableName}`);
        stmt.run();
    }

    close(): void {
        this.db.close();
    }
}

export default TruthForgeStore;
