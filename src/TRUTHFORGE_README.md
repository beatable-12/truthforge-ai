# TruthForge AI - Backend Core

## Overview

TruthForge AI is an autonomous multi-agent reasoning platform where AI agents challenge ideas instead of simply answering questions. The backend core uses **Jac** (graph-native language) as the primary intelligence layer and implements a sophisticated debate orchestration system.

## Architecture

### Core Philosophy
- **Jac is the Intelligence Layer**: All reasoning, planning, and multi-agent orchestration happens in Jac
- **Gemini API is a Tool**: External reasoning support and evidence gathering
- **Graph-Native**: Uses graph nodes and edges to model debate participants and logical relationships
- **Dynamic Orchestration**: PlannerWalker dynamically decides agent activation based on question complexity
- **Not a Simple API Wrapper**: Full multi-step reasoning with memory, debate, evaluation, and synthesis

## System Architecture

```
User Question
  ↓
PlannerWalker (Analyzes & Orchestrates)
  ↓
  ├─→ MemoryWalker (Retrieves Prior Context)
  ├─→ ThesisWalker (Generates Supporting Claims)
  ├─→ AntithesisWalker (Generates Counter-Claims)
  ├─→ EvidenceWalker (Gathers Evidence)
  ├─→ RefereeWalker (Evaluates)
  ├─→ SynthesisWalker (Creates Final Output)
  └─→ MemoryUpdateWalker (Persists to Database)
```

## File Structure

### Core Jac Files

#### `truthforge_nodes.jac`
Defines all node types in the reasoning graph:
- **Question**: User input/topic
- **Topic**: Extracted subject area
- **Claim**: Supporting thesis positions
- **CounterClaim**: Opposing positions
- **Evidence**: Supporting data/facts
- **Verdict**: Referee evaluations
- **DebateSession**: Container for reasoning cycle
- **PlanStep**: Planning decisions
- **MemoryEntry**: Stored prior reasoning
- **SynthesisResult**: Final output

#### `truthforge_edges.jac`
Defines relationship types between nodes:
- `supports` - Evidence/claims support position
- `attacks` - Counter-claims attack thesis
- `validated_by` - Claims validated by evidence
- `related_to` - Topical similarity
- `generated_from` - Derivation source
- `discussed_in` - Part of session
- `refines` - Evolves from prior work
- `contradicts` - Direct contradiction
- `contributes_to` - Contributes to verdict

#### `truthforge_config.jac`
Global configuration constants:
- API keys and model selection
- Complexity thresholds
- Agent types and capabilities
- Evidence classification types
- Database path and logging

### Walker Files

#### `truthforge_planner.jac` - **PlannerWalker**
**Responsibilities**:
- Analyzes user question
- Extracts domain and topic
- Estimates complexity (0-1 scale)
- Decides which agents activate
- Creates execution plan with dependencies
- Orchestrates workflow dynamically

**Key Methods**:
- `analyze_question()` - Estimate complexity
- `detect_domain()` - Identify subject area
- `determine_agents_needed()` - Select agents based on complexity
- `create_execution_plan()` - Build ordered execution with dependencies
- `orchestrate()` - Main execution

**Complexity Levels**:
- **Simple** (< 0.3): thesis, antithesis, referee, synthesis
- **Moderate** (< 0.6): + memory, evidence
- **Complex** (≥ 0.6): Full agent team

#### `truthforge_memory.jac` - **MemoryWalker**
**Responsibilities**:
- Traverse graph finding related debates
- Retrieve prior reasoning chains
- Extract confidence history
- Provide context for current reasoning

**Key Methods**:
- `search_related_topics()` - Find similar prior debates
- `traverse_prior_claims()` - Navigate graph for related claims
- `retrieve_counter_arguments()` - Find prior counter-arguments
- `find_confidence_history()` - Extract confidence patterns
- `retrieve_memory()` - Main orchestration

#### `truthforge_thesis.jac` - **ThesisWalker**
**Responsibilities**:
- Generate strongest supporting position
- Create Claim nodes
- Build reasoning chains
- Extract assumptions

**Key Methods**:
- `generate_initial_thesis()` - Create primary position
- `identify_key_points()` - Extract 3-5 supporting points
- `build_reasoning_chain()` - Logical flow from premises to conclusion
- `extract_assumptions()` - Identify underlying assumptions
- `create_claim_node()` - Structured claim creation
- `generate_supporting_claims()` - Multiple claims with varying strength
- `generate_thesis()` - Main orchestration

#### `truthforge_antithesis.jac` - **AntithesisWalker**
**Responsibilities**:
- Attack thesis claims
- Generate counter-claims
- Create CounterClaim nodes
- Build opposition arguments

**Key Methods**:
- `identify_thesis_weaknesses()` - Find logical/evidential gaps
- `generate_opposing_position()` - Create direct opposition
- `build_attack_argument()` - Structure attacks on claims
- `extract_counter_assumptions()` - Counter-argument assumptions
- `create_counter_claim_node()` - Structured counter-claim
- `attack_thesis_claims()` - Specific attacks
- `generate_antithesis()` - Main orchestration

#### `truthforge_evidence.jac` - **EvidenceWalker**
**Responsibilities**:
- Gather supporting evidence (via tools)
- Evaluate source credibility
- Create Evidence nodes
- Integration point for Gemini API and web search

**Key Methods**:
- `search_supporting_evidence()` - Evidence for thesis
- `search_counter_evidence()` - Evidence for counter-claims
- `evaluate_source_credibility()` - Score 0-1
- `classify_evidence_type()` - Statistical, logical, empirical, anecdotal, theoretical
- `integrate_with_gemini()` - API integration point
- `integrate_with_web_search()` - Web search integration point
- `gather_evidence()` - Main orchestration

#### `truthforge_referee.jac` - **RefereeWalker**
**Responsibilities**:
- Evaluate logic quality
- Assess evidence strength
- Check assumption validity
- Generate verdicts
- Create Verdict nodes

**Key Methods**:
- `evaluate_logical_validity()` - Score 0-1
- `evaluate_evidence_strength()` - Credibility + diversity
- `evaluate_assumption_validity()` - Check for conflicts
- `compare_positions()` - Thesis vs counter-claims
- `generate_key_findings()` - Structured findings
- `create_verdict_node()` - Final verdict creation
- `evaluate()` - Main orchestration

#### `truthforge_synthesis.jac` - **SynthesisWalker**
**Responsibilities**:
- Generate final structured output
- Extract supporting signals
- Extract counterarguments
- Create SynthesisResult nodes

**Output Format**:
```json
{
  "analysis": "Comprehensive analysis",
  "supporting_signals": ["Signal 1", "Signal 2", ...],
  "counterarguments": ["Counter 1", "Counter 2", ...],
  "confidence": "High/Moderate/Low",
  "final_answer": "Synthesized conclusion",
  "reasoning_chain": ["Step 1", "Step 2", ...]
}
```

**Key Methods**:
- `extract_supporting_signals()` - Key supporting points
- `extract_counterarguments()` - Key counter-arguments
- `determine_confidence_level()` - Based on verdict scores
- `formulate_final_answer()` - Synthesized conclusion
- `create_reasoning_chain()` - Step-by-step reasoning
- `synthesize()` - Main orchestration

#### `truthforge_memory_update.jac` - **MemoryUpdateWalker**
**Responsibilities**:
- Persist all reasoning artifacts
- Store to SQLite database
- Create relationship edges
- Update session status

**Key Methods**:
- `store_question()` - Save question
- `store_claims()` - Persist thesis claims
- `store_counter_claims()` - Persist counter-claims
- `store_evidence()` - Persist evidence
- `store_verdict()` - Persist verdict
- `store_reasoning()` - Persist synthesis result
- `create_relationships()` - Build graph edges
- `update_debate_session()` - Mark complete
- `persist()` - Main orchestration

### Persistence Layer

#### `truthforge_schema.sql`
SQLite database schema:
- `debates` - Session management
- `questions` - Question storage
- `claims` - Thesis claims
- `counter_claims` - Counter-claims
- `evidence` - Evidence artifacts
- `verdicts` - Referee evaluations
- `reasonings` - Complete reasoning chains
- `relationships` - Graph edges
- `plan_steps` - Planning decisions
- `memory_entries` - Debate snapshots

#### `truthforge_store.ts`
TypeScript SQLite wrapper:
- `TruthForgeStore` class
- CRUD operations for all entities
- Query methods for retrieval
- Memory search by relevance
- Type definitions for all tables

### API Layer

#### `truthforge_api.ts`
Express.js API endpoints:
- `POST /api/truthforge/debate` - Process question
- `POST /api/truthforge/memory` - Retrieve memories
- `GET /api/truthforge/debate/:session_id` - Get debate details
- Response formatting
- Error handling

### Main Orchestration

#### `truthforge_main.jac`
Central orchestration graph:
- `DebateGraph` - Main reasoning graph
- Execution sequencing
- Result aggregation
- Session management
- Complete workflow orchestration

## Workflow Example

### Question: "Is artificial intelligence truly intelligent?"

1. **Planning** → Detects complexity: 0.75 (moderate-complex)
   - Selected agents: all 8 walkers
   - Plan: sequence thesis → antithesis → evidence → referee → synthesis

2. **Memory** → Retrieves prior AI reasoning debates
   - Finds 3 related prior debates
   - Extracts: 12 prior claims, confidence patterns

3. **Thesis** → Generates supporting position
   - Primary: "AI meets intelligence definitions through cognitive abilities"
   - Supporting claims: reasoning, learning, problem-solving
   - 4 claims generated with 0.85 average strength

4. **Antithesis** → Generates counter-arguments
   - Primary: "AI lacks true understanding and consciousness"
   - Counter-claims: no genuine understanding, no consciousness, no autonomy
   - 4 counter-claims generated with 0.78 average strength

5. **Evidence** → Gathers supporting evidence
   - Searches for AI reasoning papers
   - Finds 8 pieces of evidence
   - Credibility scores: 0.92, 0.85, 0.78 (average 0.85)

6. **Referee** → Evaluates positions
   - Logic quality: 0.82
   - Evidence strength: 0.85
   - Assumption validity: 0.78
   - Verdict: "AI position stronger but with caveats"
   - Overall confidence: 0.81

7. **Synthesis** → Generates final output
   - Analysis: Comprehensive breakdown
   - Supporting signals: 8 points
   - Counter-arguments: 5 points
   - Confidence: "High"
   - Final answer: "AI demonstrates intelligence within defined parameters"

8. **Memory Update** → Persists to SQLite
   - Stores: 4 claims, 4 counter-claims, 8 evidence items, verdict
   - Creates graph relationships (edges)
   - Updates debate session as "completed"

## Integration Points

### Gemini API Integration
Located in **EvidenceWalker.integrate_with_gemini()** and **integrate_with_web_search()**

```jac
can integrate_with_gemini() {
    """Integration point for Gemini API reasoning"""
    print("[EVIDENCE] Gemini API Integration Point");
    # Call Gemini API for:
    # - Reasoning over evidence
    # - Identifying key facts
    # - Generating alternative perspectives
}
```

### Web Search Integration
Structured for integration with search tools:
```jac
can integrate_with_web_search() {
    """Integration point for web search tool"""
    # Search strategy: Query thesis and counter-claims
    # Filter: High-credibility sources prioritized
    # Types: Academic, news, institutional sources
}
```

## Key Design Decisions

### 1. Dynamic Complexity Analysis
- Questions aren't processed uniformly
- PlannerWalker analyzes and routes appropriately
- Simple questions skip unnecessary agents
- Complex questions activate full reasoning team

### 2. Graph-as-Memory
- Relationships between nodes represent logical connections
- Prior debates are navigable through graph edges
- Confidence patterns are extractable
- Context is retrievable without full re-reasoning

### 3. Modular Agent Architecture
- Each walker is independent
- Walkers have specific responsibilities
- Results are composable
- Easy to add new agents

### 4. Production Quality
- Error handling throughout
- Logging at each stage
- Validation of persistence
- Structured output formats
- Clear separation of concerns

### 5. No Hardcoded Workflows
- PlannerWalker decides orchestration
- Agent activation is dynamic
- Reasoning depth adapts to complexity
- Tools integrated as needed

## Scoring Systems

### Complexity Score (0-1)
- Base: 0.3
- Keywords ("why", "how", "debate"): +0.15 each
- Length (>20 words): +0.1
- Capped at 1.0

### Credibility Score (0-1)
- High: 0.9 (science.org, peer-reviewed, arxiv)
- Medium: 0.7 (Wikipedia, reputable news)
- Low: 0.5 (unverified sources)

### Confidence Calculation
```
overall_confidence = (logic_quality × 0.35) + 
                     (evidence_strength × 0.40) + 
                     (assumption_validity × 0.25)
```

## Database Schema Highlights

### Relationships Table (Graph Persistence)
```sql
CREATE TABLE relationships (
    source_id TEXT,           -- From node
    target_id TEXT,           -- To node
    relation_type TEXT,       -- supports, attacks, etc.
    weight REAL,              -- Importance
    strength REAL,            -- Confidence
    explanation TEXT,         -- Why connected
    metadata TEXT             -- JSON for extra data
);
```

This enables:
- Graph reconstruction
- Relationship querying
- Traversal for memory retrieval
- Historical context linking

## Performance Considerations

- **Indexing**: All foreign keys and frequent query columns indexed
- **Normalization**: Proper schema normalization
- **JSON Storage**: Complex arrays stored as JSON
- **Lazy Loading**: Information fetched as needed
- **Memory Optimization**: Relevance scoring for filtered retrieval

## Future Enhancements

1. **Real Gemini API Integration**: Replace mock with actual API calls
2. **Web Search Integration**: Actual web search tool connection
3. **Knowledge Graphs**: Integrate with external knowledge bases
4. **Streaming Results**: Stream reasoning steps to client
5. **Multi-Language Support**: Reason across languages
6. **Customizable Complexity**: User-defined reasoning depth
7. **Collaborative Debates**: Multiple user participation
8. **Explainability**: Detailed reasoning explanation export

## Usage

### Via API

```typescript
const api = new TruthForgeAPI('./truthforge.db');

// Express route handler
app.post('/api/truthforge/debate', async (req, res) => {
    await api.processQuestion(req, res);
});

// Retrieve memory
app.post('/api/truthforge/memory', async (req, res) => {
    await api.getMemory(req, res);
});
```

### Via Jac

```jac
import:from truthforge_main import initialize_truthforge;

let graph = initialize_truthforge();
let result = graph.run_debate("Your question here");
```

## Testing

The system has been designed to demonstrate:
- ✓ Planning (dynamic complexity analysis)
- ✓ Orchestration (agent activation based on complexity)
- ✓ Memory (graph traversal and retrieval)
- ✓ Multi-agent workflow (all walkers executing)
- ✓ Graph reasoning (nodes and edges modeling debate)
- ✓ Multi-step reasoning (8-stage pipeline)

No hardcoded workflows - all dynamically determined by PlannerWalker.

## Production Deployment

1. Set up Gemini API key in environment
2. Initialize SQLite database
3. Deploy Jac runtime
4. Mount API endpoints to Express server
5. Configure logging and monitoring
6. Set up database backups
7. Implement rate limiting
8. Add authentication/authorization

---

**TruthForge AI Backend Core** - A production-grade multi-agent reasoning platform built with Jac.
