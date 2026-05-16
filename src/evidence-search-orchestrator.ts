/**
 * TruthForge AI - Evidence Search Orchestrator
 * Coordinates web search, query generation, and credibility scoring
 * for comprehensive evidence gathering
 */

import { WebSearchClient, SearchResult } from './search-client';
import { CredibilityScorer } from './credibility-scorer';
import { QueryGenerator, GeneratedQuery } from './query-generator';

export interface EvidenceSearchResult {
  query: string;
  results: Array<{
    url: string;
    title: string;
    snippet: string;
    credibility_score: number;
    domain: string;
  }>;
  count: number;
  timestamp: string;
}

export interface ClaimEvidence {
  claim: string;
  supporting_evidence: EvidenceSearchResult[];
  counter_evidence: EvidenceSearchResult[];
  total_credible_sources: number;
}

export class EvidenceSearchOrchestrator {
  private searchClient: WebSearchClient;
  private credibilityScorer: CredibilityScorer;
  private queryGenerator: QueryGenerator;
  private maxQueriesPerClaim: number = 3;

  constructor(dbPath: string = process.env.TRUTHFORGE_DB_PATH || './truthforge.db') {
    this.searchClient = new WebSearchClient(dbPath);
    this.credibilityScorer = new CredibilityScorer();
    this.queryGenerator = new QueryGenerator();
    console.log('[ORCHESTRATOR] Initialized evidence search orchestrator');
  }

  /**
   * Search for evidence supporting a thesis claim
   */
  async searchThesisClaim(claim: string, domain: string = ''): Promise<EvidenceSearchResult[]> {
    console.log(`[ORCHESTRATOR] Searching evidence for claim: "${claim}"`);

    const queryStrategy = this.queryGenerator.generateSearchStrategy(claim, domain);
    const queries = this.queryGenerator.rankQueries([
      ...queryStrategy.supporting,
      ...queryStrategy.general,
    ]);

    const limitedQueries = queries.slice(0, this.maxQueriesPerClaim);
    return this.executeSearchQueries(limitedQueries);
  }

  /**
   * Search for counter-evidence against a claim
   */
  async searchCounterClaim(claim: string, domain: string = ''): Promise<EvidenceSearchResult[]> {
    console.log(`[ORCHESTRATOR] Searching counter-evidence for claim: "${claim}"`);

    const queryStrategy = this.queryGenerator.generateSearchStrategy(claim, domain);
    const queries = this.queryGenerator.rankQueries([
      ...queryStrategy.counter,
      ...queryStrategy.general,
    ]);

    const limitedQueries = queries.slice(0, this.maxQueriesPerClaim);
    return this.executeSearchQueries(limitedQueries);
  }

  /**
   * Execute search queries and return results
   */
  private async executeSearchQueries(queries: GeneratedQuery[]): Promise<EvidenceSearchResult[]> {
    const results: EvidenceSearchResult[] = [];

    for (const generatedQuery of queries) {
      const formattedQuery = this.queryGenerator.formatForSearch(generatedQuery);

      try {
        console.log(`[ORCHESTRATOR]   Executing: ${formattedQuery}`);
        const searchResults = await this.searchClient.searchEvidence(formattedQuery);

        // Score and filter results
        const scoredResults = searchResults.map((result) => ({
          ...result,
          credibility_score: this.credibilityScorer.evaluateEvidence(
            result.title,
            result.snippet,
            result.domain
          ),
        }));

        const filtered = scoredResults.filter(
          (r) => r.credibility_score >= this.credibilityScorer.getMinCredibilityThreshold()
        );

        if (filtered.length > 0) {
          results.push({
            query: formattedQuery,
            results: filtered,
            count: filtered.length,
            timestamp: new Date().toISOString(),
          });

          console.log(
            `[ORCHESTRATOR]     Found ${filtered.length} credible sources for query`
          );
        }
      } catch (error) {
        console.error(`[ORCHESTRATOR]   Error executing query "${formattedQuery}":`, error);
      }
    }

    return results;
  }

  /**
   * Comprehensive evidence gathering for a claim
   */
  async gatherClaimEvidence(
    claim: string,
    searchCounterEvidence: boolean = true,
    domain: string = ''
  ): Promise<ClaimEvidence> {
    console.log(`[ORCHESTRATOR] Starting comprehensive evidence gathering for: "${claim}"`);

    const supporting = await this.searchThesisClaim(claim, domain);
    let counter: EvidenceSearchResult[] = [];

    if (searchCounterEvidence) {
      counter = await this.searchCounterClaim(claim, domain);
    }

    const totalCredible = (supporting.length + counter.length) * 5; // Rough estimate

    const result: ClaimEvidence = {
      claim,
      supporting_evidence: supporting,
      counter_evidence: counter,
      total_credible_sources: totalCredible,
    };

    console.log(
      `[ORCHESTRATOR] Gathering complete: ${supporting.length} supporting query results, ` +
        `${counter.length} counter results`
    );

    return result;
  }

  /**
   * Batch evidence gathering for multiple claims
   */
  async gatherMultipleClaimsEvidence(
    claims: string[],
    domain: string = '',
    includeCounter: boolean = true
  ): Promise<ClaimEvidence[]> {
    console.log(`[ORCHESTRATOR] Gathering evidence for ${claims.length} claims`);

    const results: ClaimEvidence[] = [];

    for (let i = 0; i < claims.length; i++) {
      const claim = claims[i];
      console.log(`[ORCHESTRATOR] Processing claim ${i + 1}/${claims.length}`);

      const evidence = await this.gatherClaimEvidence(claim, includeCounter, domain);
      results.push(evidence);

      // Add delay to avoid rate limiting
      if (i < claims.length - 1) {
        await this.delay(1000);
      }
    }

    return results;
  }

  /**
   * Get top credible sources from search results
   */
  getTopCredibleSources(
    searchResults: EvidenceSearchResult[],
    limit: number = 5
  ): Array<{
    url: string;
    title: string;
    snippet: string;
    credibility_score: number;
    domain: string;
  }> {
    const allSources = searchResults.flatMap((r) => r.results);
    return allSources.sort((a, b) => b.credibility_score - a.credibility_score).slice(0, limit);
  }

  /**
   * Get search cache statistics
   */
  getCacheStats(): { total: number; valid: number; expired: number } {
    return this.searchClient.getCacheStats();
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    this.searchClient.clearExpiredCache();
  }

  /**
   * Close database connection
   */
  close(): void {
    this.searchClient.close();
  }

  /**
   * Utility: delay for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Export evidence as JSON
   */
  exportEvidenceJSON(evidence: ClaimEvidence[]): string {
    return JSON.stringify(evidence, null, 2);
  }

  /**
   * Generate evidence summary
   */
  generateEvidenceSummary(evidence: ClaimEvidence[]): string {
    let summary = '# Evidence Search Summary\n\n';

    for (const claim of evidence) {
      summary += `## Claim: ${claim.claim}\n`;
      summary += `- Supporting evidence sources: ${claim.supporting_evidence.length}\n`;
      summary += `- Counter-evidence sources: ${claim.counter_evidence.length}\n`;
      summary += `- Total credible sources identified: ${claim.total_credible_sources}\n\n`;
    }

    return summary;
  }
}
