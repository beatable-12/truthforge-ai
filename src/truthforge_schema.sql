-- TruthForge AI - SQLite Database Schema
-- Persistence layer for reasoning and debates

-- Debates/Sessions table
CREATE TABLE IF NOT EXISTS debates (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    complexity_level TEXT DEFAULT 'unknown',
    agents_activated TEXT,  -- JSON array of agent names
    stage INTEGER DEFAULT 0,
    total_stages INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id)
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    complexity REAL DEFAULT 0.0,
    domain TEXT DEFAULT '',
    subtopics TEXT,  -- JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id)
);

-- Claims table (supporting thesis)
CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    debate_id TEXT NOT NULL,
    statement TEXT NOT NULL,
    strength REAL DEFAULT 0.0,
    reasoning TEXT DEFAULT '',
    key_points TEXT,  -- JSON array
    assumptions TEXT,  -- JSON array
    supporting_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debate_id) REFERENCES debates(id),
    UNIQUE(id)
);

-- Counter Claims table (antithesis)
CREATE TABLE IF NOT EXISTS counter_claims (
    id TEXT PRIMARY KEY,
    debate_id TEXT NOT NULL,
    statement TEXT NOT NULL,
    strength REAL DEFAULT 0.0,
    reasoning TEXT DEFAULT '',
    key_points TEXT,  -- JSON array
    assumptions TEXT,  -- JSON array
    attacks_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debate_id) REFERENCES debates(id),
    UNIQUE(id)
);

-- Evidence table
CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    debate_id TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT DEFAULT '',
    credibility_score REAL DEFAULT 0.0,
    evidence_type TEXT DEFAULT '',
    date_published TEXT DEFAULT '',
    retrieval_method TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debate_id) REFERENCES debates(id),
    UNIQUE(id)
);

-- Verdicts table (referee evaluation)
CREATE TABLE IF NOT EXISTS verdicts (
    id TEXT PRIMARY KEY,
    debate_id TEXT NOT NULL,
    evaluation TEXT NOT NULL,
    logic_quality_score REAL DEFAULT 0.0,
    evidence_strength_score REAL DEFAULT 0.0,
    assumption_validity REAL DEFAULT 0.0,
    overall_confidence REAL DEFAULT 0.0,
    key_findings TEXT,  -- JSON array
    reasoning_quality TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debate_id) REFERENCES debates(id),
    UNIQUE(id)
);

-- Reasoning chains table (complete reasoning paths)
CREATE TABLE IF NOT EXISTS reasonings (
    id TEXT PRIMARY KEY,
    debate_id TEXT NOT NULL,
    analysis TEXT NOT NULL,
    supporting_signals TEXT,  -- JSON array
    counterarguments TEXT,  -- JSON array
    confidence TEXT DEFAULT '',
    final_answer TEXT DEFAULT '',
    reasoning_chain TEXT,  -- JSON array of steps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debate_id) REFERENCES debates(id),
    UNIQUE(id)
);

-- Relationships table (graph edges persistence)
CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    relation_type TEXT NOT NULL,  -- supports, attacks, validated_by, etc.
    weight REAL DEFAULT 1.0,
    strength REAL DEFAULT 0.0,
    explanation TEXT DEFAULT '',
    metadata TEXT DEFAULT '{}',  -- JSON for extra data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plan steps table
CREATE TABLE IF NOT EXISTS plan_steps (
    id TEXT PRIMARY KEY,
    debate_id TEXT NOT NULL,
    step_number INTEGER,
    agent_name TEXT NOT NULL,
    reason TEXT DEFAULT '',
    priority REAL DEFAULT 0.0,
    dependencies TEXT,  -- JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debate_id) REFERENCES debates(id),
    UNIQUE(id)
);

-- Memory entries table
CREATE TABLE IF NOT EXISTS memory_entries (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    summary TEXT NOT NULL,
    claims TEXT,  -- JSON array
    counter_claims TEXT,  -- JSON array
    verdict TEXT DEFAULT '',
    confidence REAL DEFAULT 0.0,
    timestamp TEXT DEFAULT '',
    relevance_score REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id)
);

-- Search cache table for web search results
CREATE TABLE IF NOT EXISTS search_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL UNIQUE,
    results TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_debates_question ON debates(question_id);
CREATE INDEX IF NOT EXISTS idx_debates_status ON debates(status);
CREATE INDEX IF NOT EXISTS idx_claims_debate ON claims(debate_id);
CREATE INDEX IF NOT EXISTS idx_counter_claims_debate ON counter_claims(debate_id);
CREATE INDEX IF NOT EXISTS idx_evidence_debate ON evidence(debate_id);
CREATE INDEX IF NOT EXISTS idx_verdicts_debate ON verdicts(debate_id);
CREATE INDEX IF NOT EXISTS idx_reasonings_debate ON reasonings(debate_id);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relation_type);
CREATE INDEX IF NOT EXISTS idx_memory_timestamp ON memory_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_search_cache_query ON search_cache(query);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache(expires_at);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT,
    plan TEXT DEFAULT 'free',
    debate_count INTEGER DEFAULT 0,
    saved_memories INTEGER DEFAULT 0,
    history TEXT,  -- JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id)
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
