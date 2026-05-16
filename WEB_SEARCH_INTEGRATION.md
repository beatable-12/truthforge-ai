# TruthForge AI - Web Search Integration Guide

## Overview

The web search integration system for TruthForge AI enables comprehensive evidence gathering by searching the internet for supporting and counter-evidence. The system is built with four main components:

1. **WebSearchClient** (`search-client.ts`) - Handles API communication and caching
2. **CredibilityScorer** (`credibility-scorer.ts`) - Evaluates source credibility
3. **QueryGenerator** (`query-generator.ts`) - Generates effective search queries
4. **EvidenceSearchOrchestrator** (`evidence-search-orchestrator.ts`) - Orchestrates the full workflow

## Architecture

```
┌─────────────────────────────────────────┐
│  EvidenceWalker (truthforge_evidence.jac)│
└─────────────────────┬───────────────────┘
                      │
┌─────────────────────▼───────────────────┐
│   EvidenceSearchOrchestrator            │
│   - Coordinates search flow             │
│   - Manages multiple searches           │
└─┬───────────────────┬───────────────────┬┘
  │                   │                   │
  ▼                   ▼                   ▼
QueryGenerator  WebSearchClient    CredibilityScorer
- Generate      - Search API       - Score sources
  queries       - Cache results    - Rate limit
- Multiple      - Error handling   - Filter by
  strategies                         credibility
```

## Components

### 1. WebSearchClient (`search-client.ts`)

**Responsibilities:**
- Interface with Google Custom Search API
- Cache search results in SQLite
- Implement rate limiting (5 requests/minute)
- Log all searches
- Handle errors gracefully

**Key Methods:**
```typescript
// Search for evidence with query
searchEvidence(query: string): Promise<SearchResult[]>

// Search for specific claims
searchClaims(claim: string): Promise<SearchResult[]>

// Get cache statistics
getCacheStats(): { total: number; valid: number; expired: number }

// Clear expired cache entries
clearExpiredCache(): void
```

**Example Usage:**
```typescript
const client = new WebSearchClient('./truthforge.db');
const results = await client.searchEvidence('AI accelerates software development');
console.log(`Found ${results.length} results`);
client.close();
```

### 2. CredibilityScorer (`credibility-scorer.ts`)

**Source Categories:**
- **Peer-Reviewed** (0.9): Nature, Science, PLOS, arXiv, etc.
- **Academic** (0.85): .edu, MIT, Stanford, Oxford, etc.
- **Government** (0.8): .gov sites, NASA, CDC, NIH, etc.
- **Reputable News** (0.7): BBC, Reuters, NYT, Guardian, etc.
- **Blogs/Forums** (0.5): Medium, Substack, WordPress, etc.
- **Unknown** (0.2-0.65): Heuristic scoring based on domain signals

**Content Quality Signals:**
- +0.15: Citations, references, DOI links
- +0.10: Statistical data (percentages, millions, etc.)
- +0.05: Research language ("research shows", "indicates")
- +0.05: Hedging language ("may", "suggests", "indicates")
- -0.20: Red flags ("MUST READ", "SHOCKING", "GUARANTEED")

**Scoring Formula:**
```
Final Score = (Source Score × 0.7) + (Content Score × 0.3)
```

**Key Methods:**
```typescript
// Score a source domain
scoreSource(domain: string): SourceCredibility

// Score content quality
scoreContent(content: string, source: string): number

// Evaluate evidence comprehensively
evaluateEvidence(title: string, snippet: string, domain: string): number

// Filter results by threshold
filterByCredibility(results): Array<{ ...result; credibility: number }>
```

**Example Usage:**
```typescript
const scorer = new CredibilityScorer();
const score = scorer.evaluateEvidence(
  "AI Accelerates Development",
  "Research shows AI can accelerate development by 30%",
  "nature.com"
);
console.log(`Credibility score: ${score}`); // ~0.85
```

### 3. QueryGenerator (`query-generator.ts`)

**Query Types Generated:**

For **Supporting Evidence:**
- Exact match: `"exact claim text"`
- Keywords with evidence: `keyword1 keyword2 evidence research`
- Question form: `Does [claim]?`
- Statistical: Focus on data and metrics
- Research: Focus on studies and findings

For **Counter-Evidence:**
- Opposite stance: `NOT (claim)`
- Counter-arguments: `claim counterargument criticism`
- Debunking: `claim myth false debunked`
- Limitations: `claim limitations drawbacks`
- Alternative perspectives: `alternative perspective [topic]`

For **Domain-Specific:**
- Technology: AI, ML, software frameworks
- Health/Medicine: Clinical trials, FDA approval
- Environment: Climate change, sustainability
- Economics: Market analysis, financial reports
- Politics/Social: Policy analysis, social impact

**Key Methods:**
```typescript
// Generate supporting evidence queries
generateClaimQueries(claim: string): GeneratedQuery[]

// Generate counter-evidence queries
generateCounterQueries(claim: string): GeneratedQuery[]

// Generate domain-specific queries
generateDomainQueries(topic: string, domain: string): GeneratedQuery[]

// Rank queries by effectiveness
rankQueries(queries: GeneratedQuery[]): GeneratedQuery[]

// Get comprehensive search strategy
generateSearchStrategy(topic: string, domain: string): {
  supporting: GeneratedQuery[],
  counter: GeneratedQuery[],
  general: GeneratedQuery[]
}
```

**Example Usage:**
```typescript
const generator = new QueryGenerator();
const strategy = generator.generateSearchStrategy('AI accelerates development', 'technology');
console.log(`Generated ${strategy.supporting.length} supporting queries`);
```

### 4. EvidenceSearchOrchestrator (`evidence-search-orchestrator.ts`)

**Responsibilities:**
- Coordinate all components
- Execute search workflows
- Batch process multiple claims
- Export results
- Generate summaries

**Key Methods:**
```typescript
// Search for evidence supporting a claim
async searchThesisClaim(claim: string, domain?: string): Promise<EvidenceSearchResult[]>

// Search for counter-evidence
async searchCounterClaim(claim: string, domain?: string): Promise<EvidenceSearchResult[]>

// Comprehensive gathering for one claim
async gatherClaimEvidence(claim: string, searchCounterEvidence?: boolean, domain?: string): Promise<ClaimEvidence>

// Batch process multiple claims
async gatherMultipleClaimsEvidence(claims: string[], domain?: string, includeCounter?: boolean): Promise<ClaimEvidence[]>

// Get top credible sources
getTopCredibleSources(searchResults: EvidenceSearchResult[], limit?: number): SearchResult[]
```

**Example Usage:**
```typescript
const orchestrator = new EvidenceSearchOrchestrator();

const evidence = await orchestrator.gatherClaimEvidence(
  'AI accelerates software development',
  true,
  'technology'
);

console.log(`Supporting evidence: ${evidence.supporting_evidence.length} queries`);
console.log(`Counter evidence: ${evidence.counter_evidence.length} queries`);
console.log(`Total credible sources: ${evidence.total_credible_sources}`);

orchestrator.close();
```

## Configuration

### Environment Variables

```env
# Web Search API configuration
GOOGLE_SEARCH_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_cx_here

# Search behavior
SEARCH_RESULT_LIMIT=10              # Results per query (default: 10)
SEARCH_CACHE_TTL_DAYS=7             # Cache duration (default: 7 days)
MIN_CREDIBILITY_SCORE=0.75          # Credibility threshold (default: 0.75)

# Database
TRUTHFORGE_DB_PATH=./truthforge.db
```

### Setting Up Google Custom Search

1. **Create Google Custom Search Engine:**
   - Go to https://programmablesearchengine.google.com/
   - Click "Create" and configure your search engine
   - You'll receive a Search Engine ID (CX)

2. **Get API Key:**
   - Go to Google Cloud Console
   - Create a new project
   - Enable Custom Search API
   - Create API key credentials

3. **Add to .env:**
   ```env
   GOOGLE_SEARCH_API_KEY=AIzaSy...
   GOOGLE_SEARCH_ENGINE_ID=f0a4b2d9...
   ```

## Database Schema

### search_cache Table

```sql
CREATE TABLE search_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL UNIQUE,
    results TEXT NOT NULL,          -- JSON array of SearchResult
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL   -- TTL calculated on insert
);

CREATE INDEX idx_search_cache_query ON search_cache(query);
CREATE INDEX idx_search_cache_expires ON search_cache(expires_at);
```

### Cache Entry Example

```json
{
  "query": "AI development productivity impact statistics",
  "results": [
    {
      "url": "https://nature.com/article/ai-dev",
      "title": "AI Accelerates Development",
      "snippet": "Research shows AI can increase developer productivity...",
      "domain": "nature.com",
      "credibility_score": 0.87
    }
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "expires_at": "2024-01-22T10:30:00Z"
}
```

## Data Flow

### Evidence Gathering Workflow

```
1. Start with claim: "AI accelerates development"
   │
2. QueryGenerator creates multiple query strategies
   ├─ Exact: "AI accelerates development"
   ├─ Keywords: "AI accelerates development evidence research"
   ├─ Question: "Does AI accelerate development?"
   └─ Variations: With statistical, research, domain-specific focus
   │
3. For each query:
   a) Check WebSearchClient cache
      ├─ HIT → Return cached results
      └─ MISS → Continue to step 3b
   
   b) Execute Google Custom Search
      ├─ SUCCESS → Receive search results
      └─ FAIL → Log error, try next query
   
   c) Score results with CredibilityScorer
      ├─ Evaluate domain reputation (0.3-0.9)
      ├─ Analyze content quality
      └─ Combine scores (70% domain, 30% content)
   
   d) Filter by threshold (0.75+)
   
   e) Cache results for 7 days
   │
4. Aggregate results into EvidenceSearchResult
   │
5. Return evidence with sources and credibility scores
```

## Usage in EvidenceWalker

The TruthForge AI EvidenceWalker integrates web search via the `integrate_with_web_search()` method:

```jac
can integrate_with_web_search() {
    # In production, this will:
    # 1. Initialize WebSearchClient with database
    # 2. Initialize CredibilityScorer with domain reputation database
    # 3. Initialize QueryGenerator for search queries
    # 4. For each thesis claim:
    #    - Generate search queries
    #    - Execute searches via WebSearchClient
    #    - Score results with CredibilityScorer
    #    - Filter by credibility (0.75+)
    #    - Create evidence nodes
    # 5. Repeat for counter-claims
    # 6. Cache results in SQLite
    # 7. Log all searches
}
```

## Error Handling

The system handles various failure scenarios:

1. **API Failures:**
   - Rate limit exceeded: Use cached results
   - API error: Log and continue with next query
   - No results: Log and continue

2. **Database Issues:**
   - Cache table missing: Auto-create on initialization
   - Cache access failure: Fall back to API-only mode

3. **Network Errors:**
   - Connection timeout: Log and skip search
   - Invalid URL: Skip result

## Performance Optimization

### Rate Limiting
- Maximum 5 requests per minute per component
- Prevents API quota exhaustion
- Implements exponential backoff

### Caching
- 7-day TTL by default
- Query deduplication
- Automatic cache cleanup
- ~90% cache hit rate expected in typical usage

### Query Optimization
- Limits to 3 most relevant queries per claim
- Ranked by effectiveness
- Domain-specific queries prioritized

## Logging

All operations are logged with timestamps and status:

```
[SEARCH] [2024-01-15T10:30:45Z] AI accelerates development - retrieved from cache
[SEARCH] [2024-01-15T10:31:20Z] AI productivity metrics - cached 5 results
[ORCHESTRATOR] Searching evidence for claim: "AI accelerates development"
[ORCHESTRATOR]   Executing: AI accelerates development evidence research
[ORCHESTRATOR]     Found 4 credible sources for query
```

## Testing & Development

### Mock Search (No API Key)

If no Google API credentials are configured, the system will:
- Skip actual API calls
- Return empty results with logging
- Allow testing without API usage

### Development Mode

```typescript
// Initialize with logging
const orchestrator = new EvidenceSearchOrchestrator('./truthforge.db');

// Get statistics
const stats = orchestrator.getCacheStats();
console.log(`Cache: ${stats.valid}/${stats.total} valid entries`);

// Clean up
orchestrator.clearExpiredCache();
orchestrator.close();
```

## Limitations & Future Enhancements

### Current Limitations
- Google Custom Search limited to 100 queries/day (free tier)
- Does not evaluate full article content (only snippets)
- Cannot verify citations within sources
- No automatic fact-checking

### Future Enhancements
- Multiple search provider support (Bing, DuckDuckGo)
- Full-text source analysis
- Citation verification
- Real-time fact-checking integration
- Argument extraction from sources
- Source bias detection

## References

- [Google Custom Search API](https://developers.google.com/custom-search/v1)
- [SQLite Caching Best Practices](https://www.sqlite.org/bestpractice.html)
- [Academic Source Evaluation](https://guides.library.upenn.edu/evaluating-sources)
- [Credibility Assessment Frameworks](https://www.credibilitycoalition.org/)
