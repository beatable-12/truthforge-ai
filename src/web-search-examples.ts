/**
 * Web Search Integration - Usage Examples
 * Practical examples of how to use the web search system
 */

import { WebSearchClient } from './search-client';
import { CredibilityScorer } from './credibility-scorer';
import { QueryGenerator } from './query-generator';
import { EvidenceSearchOrchestrator } from './evidence-search-orchestrator';

/**
 * Example 1: Basic Search
 * Search for evidence about a single claim
 */
async function example1_basicSearch() {
  console.log('=== Example 1: Basic Search ===\n');

  const client = new WebSearchClient();
  const scorer = new CredibilityScorer();

  try {
    // Search for evidence
    const results = await client.searchEvidence('AI accelerates software development');

    console.log(`Found ${results.length} raw results\n`);

    // Score each result
    const scored = results.map((r) => ({
      ...r,
      credibility: scorer.evaluateEvidence(r.title, r.snippet, r.domain),
    }));

    // Filter by credibility threshold
    const credible = scored.filter((r) => r.credibility >= 0.75);

    console.log(`Credible sources (>= 0.75): ${credible.length}\n`);

    credible.forEach((result) => {
      console.log(`📄 ${result.title}`);
      console.log(`   Domain: ${result.domain}`);
      console.log(`   Credibility: ${result.credibility.toFixed(2)}`);
      console.log(`   Snippet: ${result.snippet.substring(0, 100)}...\n`);
    });
  } finally {
    client.close();
  }
}

/**
 * Example 2: Multiple Query Strategies
 * Generate and execute multiple types of searches
 */
async function example2_multipleStrategies() {
  console.log('=== Example 2: Multiple Query Strategies ===\n');

  const orchestrator = new EvidenceSearchOrchestrator();

  try {
    // Gather evidence with multiple query types
    const evidence = await orchestrator.gatherClaimEvidence(
      'Machine learning improves medical diagnosis',
      true, // Include counter-evidence
      'medicine' // Domain-specific queries
    );

    console.log(`Claim: ${evidence.claim}\n`);

    console.log(`Supporting Evidence Queries: ${evidence.supporting_evidence.length}`);
    evidence.supporting_evidence.forEach((queryResult, i) => {
      console.log(
        `  ${i + 1}. "${queryResult.query}" → ${queryResult.count} credible sources`
      );
    });

    console.log(`\nCounter Evidence Queries: ${evidence.counter_evidence.length}`);
    evidence.counter_evidence.forEach((queryResult, i) => {
      console.log(
        `  ${i + 1}. "${queryResult.query}" → ${queryResult.count} credible sources`
      );
    });

    console.log(`\nTotal Credible Sources Identified: ${evidence.total_credible_sources}`);

    // Get top sources across all searches
    const topSources = orchestrator.getTopCredibleSources(evidence.supporting_evidence, 3);
    console.log('\nTop Supporting Sources:');
    topSources.forEach((source, i) => {
      console.log(`  ${i + 1}. ${source.title}`);
      console.log(`     URL: ${source.url}`);
      console.log(`     Score: ${source.credibility_score.toFixed(2)}\n`);
    });
  } finally {
    orchestrator.close();
  }
}

/**
 * Example 3: Batch Processing Multiple Claims
 * Gather evidence for multiple claims at once
 */
async function example3_batchProcessing() {
  console.log('=== Example 3: Batch Processing Multiple Claims ===\n');

  const orchestrator = new EvidenceSearchOrchestrator();

  try {
    const claims = [
      'AI accelerates software development',
      'Remote work increases productivity',
      'Machine learning improves medical diagnosis',
    ];

    console.log(`Processing ${claims.length} claims...\n`);

    const allEvidence = await orchestrator.gatherMultipleClaimsEvidence(
      claims,
      'technology',
      true
    );

    // Generate summary
    const summary = orchestrator.generateEvidenceSummary(allEvidence);
    console.log(summary);

    // Statistics
    console.log('Overall Statistics:');
    let totalSupportingQueries = 0;
    let totalCounterQueries = 0;
    let totalCredibleSources = 0;

    allEvidence.forEach((evidence) => {
      totalSupportingQueries += evidence.supporting_evidence.length;
      totalCounterQueries += evidence.counter_evidence.length;
      totalCredibleSources += evidence.total_credible_sources;
    });

    console.log(`- Total supporting query results: ${totalSupportingQueries}`);
    console.log(`- Total counter query results: ${totalCounterQueries}`);
    console.log(`- Total credible sources found: ${totalCredibleSources}`);

    // Cache statistics
    const cacheStats = orchestrator.getCacheStats();
    console.log(`\nCache Statistics:`);
    console.log(`- Total cached queries: ${cacheStats.total}`);
    console.log(`- Valid (not expired): ${cacheStats.valid}`);
    console.log(`- Expired: ${cacheStats.expired}`);
  } finally {
    orchestrator.close();
  }
}

/**
 * Example 4: Query Generation
 * See what queries are generated for a topic
 */
async function example4_queryGeneration() {
  console.log('=== Example 4: Query Generation ===\n');

  const generator = new QueryGenerator();

  const claim = 'Renewable energy reduces carbon emissions';
  const domain = 'environment';

  const strategy = generator.generateSearchStrategy(claim, domain);

  console.log(`Claim: ${claim}`);
  console.log(`Domain: ${domain}\n`);

  console.log('Supporting Evidence Queries:');
  strategy.supporting.slice(0, 3).forEach((q) => {
    console.log(
      `  [${q.type}] ${q.query}`
    );
    console.log(`    Keywords: ${q.keywords.join(', ')}`);
  });

  console.log('\nCounter Evidence Queries:');
  strategy.counter.slice(0, 3).forEach((q) => {
    console.log(
      `  [${q.type}] ${q.query}`
    );
    console.log(`    Keywords: ${q.keywords.join(', ')}`);
  });

  console.log('\nGeneral Queries:');
  strategy.general.slice(0, 2).forEach((q) => {
    console.log(
      `  [${q.type}] ${q.query}`
    );
  });
}

/**
 * Example 5: Credibility Scoring
 * Understand how sources are scored
 */
async function example5_credibilityScoring() {
  console.log('=== Example 5: Credibility Scoring ===\n');

  const scorer = new CredibilityScorer();

  // Test various sources
  const sources = [
    { domain: 'nature.com', description: 'Peer-reviewed journal' },
    { domain: 'stanford.edu', description: 'University' },
    { domain: 'bbc.com', description: 'News outlet' },
    { domain: 'example-research-blog.com', description: 'Unknown blog' },
    { domain: 'nasa.gov', description: 'Government agency' },
  ];

  console.log('Source Credibility Scores:\n');

  sources.forEach(({ domain, description }) => {
    const cred = scorer.scoreSource(domain);
    console.log(`${domain.padEnd(30)} ${cred.score.toFixed(2)} (${cred.category})`);
    console.log(`  → ${description}`);
    console.log(`  → ${cred.reasoning}\n`);
  });

  // Content scoring example
  console.log('\nContent Quality Scoring:');
  console.log('─'.repeat(50));

  const contentExamples = [
    {
      content: 'AI is good and makes things faster and better',
      description: 'Vague claims',
    },
    {
      content:
        'Research shows 75% of developers report improved productivity with AI tools according to a 2024 study',
      description: 'Statistical data',
    },
    {
      content: 'SHOCKING: AI will DESTROY all jobs - MUST READ!!!',
      description: 'Red flags',
    },
    {
      content: 'A study found that AI may improve productivity in some scenarios, suggesting potential benefits',
      description: 'Hedged scientific language',
    },
  ];

  contentExamples.forEach(({ content, description }) => {
    const score = scorer.scoreContent(content, 'nature.com');
    console.log(`\n${description}`);
    console.log(`Score: ${score.toFixed(2)}`);
    console.log(`"${content}"`);
  });
}

/**
 * Example 6: Integration with EvidenceWalker
 * How to use in the TruthForge EvidenceWalker
 */
function example6_evidenceWalkerIntegration() {
  console.log('=== Example 6: Integration with EvidenceWalker ===\n');

  console.log(`
In truthforge_evidence.jac, the integrate_with_web_search() method would do:

    can integrate_with_web_search() {
        # Initialize components
        let search_client = WebSearchClient(db_path);
        let scorer = CredibilityScorer();
        let generator = QueryGenerator();
        let orchestrator = EvidenceSearchOrchestrator(db_path);
        
        # For each thesis claim
        for claim in self.thesis_claims {
            let evidence = orchestrator.searchThesisClaim(claim.statement);
            
            # Create evidence nodes
            for query_result in evidence {
                for source in query_result.results {
                    let node = self.create_evidence_node(
                        source.snippet,
                        source.url,
                        "web_search",
                        source.credibility_score
                    );
                    self.gathered_evidence.append(node);
                }
            }
        }
        
        # Repeat for counter-claims
        for claim in self.counter_claims {
            let counter_evidence = orchestrator.searchCounterClaim(claim.statement);
            # ... process and create counter-evidence nodes
        }
        
        # Cache cleanup (optional)
        orchestrator.clearExpiredCache();
        
        print("[EVIDENCE] Successfully gathered evidence with credible sources");
    }
`);
}

/**
 * Example 7: Database and Caching
 * Understand caching behavior
 */
async function example7_caching() {
  console.log('=== Example 7: Database and Caching ===\n');

  const client1 = new WebSearchClient();

  try {
    // Check initial cache
    let stats = client1.getCacheStats();
    console.log(`Initial cache state:`);
    console.log(`  Total entries: ${stats.total}`);
    console.log(`  Valid entries: ${stats.valid}`);
    console.log(`  Expired entries: ${stats.expired}\n`);

    // Execute search (will be cached)
    console.log('Executing search: "AI accelerates development"');
    const result1 = await client1.searchEvidence('AI accelerates development');
    console.log(`First execution: ${result1.length} results\n`);

    // Second execution (should hit cache)
    console.log('Executing same search again...');
    const result2 = await client1.searchEvidence('AI accelerates development');
    console.log(`Second execution: ${result2.length} results (from cache)\n`);

    // Check cache after searches
    stats = client1.getCacheStats();
    console.log(`Cache after searches:`);
    console.log(`  Total entries: ${stats.total}`);
    console.log(`  Valid entries: ${stats.valid}`);
    console.log(`  Expired entries: ${stats.expired}\n`);

    // Cache TTL info
    console.log(`Cache Configuration:`);
    console.log(
      `  TTL: ${process.env.SEARCH_CACHE_TTL_DAYS || '7'} days (configurable via env)`
    );
    console.log(`  Automatic cleanup: Expired entries cleaned on init`);
  } finally {
    client1.close();
  }
}

/**
 * Main: Run all examples
 */
async function runAllExamples() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  TruthForge AI - Web Search Integration Examples  ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const examples = [
    { name: 'example4_queryGeneration', fn: example4_queryGeneration },
    { name: 'example5_credibilityScoring', fn: example5_credibilityScoring },
    { name: 'example6_evidenceWalkerIntegration', fn: example6_evidenceWalkerIntegration },
  ];

  // Note: Examples 1, 2, 3, 7 require live API calls and are commented out for testing
  // Uncomment to test with configured API credentials

  for (const example of examples) {
    try {
      await example.fn();
      console.log('\n' + '═'.repeat(60) + '\n');
    } catch (error) {
      console.error(`Error in ${example.name}:`, error);
    }
  }

  console.log('✓ Examples complete\n');
  console.log('To run all examples including live searches, set environment variables:');
  console.log('  GOOGLE_SEARCH_API_KEY=your_key_here');
  console.log('  GOOGLE_SEARCH_ENGINE_ID=your_cx_here');
}

// Run examples
runAllExamples().catch(console.error);
