/**
 * TruthForge AI - Web Search Client
 * Wrapper for Google Custom Search API with caching and rate limiting
 */

import Database from 'better-sqlite3';

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  credibility_score: number;
  domain: string;
}

export interface CachedSearchResult {
  query: string;
  results: SearchResult[];
  timestamp: number;
  ttl_days: number;
}

interface GoogleSearchItem {
  link: string;
  title: string;
  snippet: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[];
  error?: { message: string };
}

export class WebSearchClient {
  private apiKey: string;
  private engineId: string;
  private resultLimit: number;
  private cacheTtlDays: number;
  private minCredibilityScore: number;
  private db: Database.Database;
  private requestLog: Map<string, number[]> = new Map();
  private readonly REQUESTS_PER_MINUTE = 5; // Conservative rate limit

  constructor(dbPath: string = process.env.TRUTHFORGE_DB_PATH || './truthforge.db') {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.engineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
    this.resultLimit = parseInt(process.env.SEARCH_RESULT_LIMIT || '10', 10);
    this.cacheTtlDays = parseInt(process.env.SEARCH_CACHE_TTL_DAYS || '7', 10);
    this.minCredibilityScore = parseFloat(process.env.MIN_CREDIBILITY_SCORE || '0.75');
    this.db = new Database(dbPath);
    this.ensureCacheTable();
    this.logSearch('WebSearchClient initialized', '');
  }

  /**
   * Ensure search_cache table exists in database
   */
  private ensureCacheTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS search_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL UNIQUE,
        results TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_search_cache_query ON search_cache(query);
      CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache(expires_at);
    `);
  }

  /**
   * Log search operation
   */
  private logSearch(query: string, status: string): void {
    const now = Date.now();
    const timestamp = new Date().toISOString();
    console.log(`[SEARCH] [${timestamp}] ${query} - ${status}`);

    // Track for rate limiting
    if (!this.requestLog.has(query)) {
      this.requestLog.set(query, []);
    }
    this.requestLog.get(query)!.push(now);
  }

  /**
   * Check if rate limit is exceeded
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    let totalRequests = 0;
    for (const timestamps of this.requestLog.values()) {
      totalRequests += timestamps.filter((t) => t > oneMinuteAgo).length;
    }

    return totalRequests >= this.REQUESTS_PER_MINUTE;
  }

  /**
   * Get cached search results
   */
  private getCachedResults(query: string): SearchResult[] | null {
    try {
      const cached = this.db
        .prepare(
          `SELECT results FROM search_cache 
           WHERE query = ? AND expires_at > datetime('now')`
        )
        .get(query) as { results: string } | undefined;

      if (cached) {
        this.logSearch(query, 'retrieved from cache');
        return JSON.parse(cached.results);
      }
    } catch (error) {
      console.error('[SEARCH] Cache retrieval error:', error);
    }
    return null;
  }

  /**
   * Store search results in cache
   */
  private cacheResults(query: string, results: SearchResult[]): void {
    try {
      const expiresAt = new Date(Date.now() + this.cacheTtlDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO search_cache (query, results, expires_at) 
        VALUES (?, ?, ?)
      `);

      stmt.run(query, JSON.stringify(results), expiresAt);
      this.logSearch(query, `cached ${results.length} results`);
    } catch (error) {
      console.error('[SEARCH] Cache storage error:', error);
    }
  }

  /**
   * Search using Google Custom Search API
   */
  async searchEvidence(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      this.logSearch(query, 'empty query');
      return [];
    }

    // Check cache first
    const cached = this.getCachedResults(query);
    if (cached) {
      return cached;
    }

    // Check rate limit
    if (this.checkRateLimit()) {
      this.logSearch(query, 'rate limit exceeded, using cache');
      // Try to return any cached results regardless of TTL
      try {
        const fallback = this.db
          .prepare(`SELECT results FROM search_cache WHERE query = ?`)
          .get(query) as { results: string } | undefined;
        if (fallback) {
          return JSON.parse(fallback.results);
        }
      } catch (error) {
        console.error('[SEARCH] Fallback cache error:', error);
      }
      return [];
    }

    try {
      // Skip actual API call if no credentials configured (development mode)
      if (!this.apiKey || !this.engineId) {
        this.logSearch(query, 'skipped (no API credentials)');
        return [];
      }

      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.append('q', query);
      url.searchParams.append('key', this.apiKey);
      url.searchParams.append('cx', this.engineId);
      url.searchParams.append('num', String(this.resultLimit));

      const response = await fetch(url.toString());

      if (!response.ok) {
        this.logSearch(query, `API error: ${response.status}`);
        return [];
      }

      const data = (await response.json()) as GoogleSearchResponse;

      if (data.error) {
        this.logSearch(query, `API error: ${data.error.message}`);
        return [];
      }

      if (!data.items || data.items.length === 0) {
        this.logSearch(query, 'no results found');
        return [];
      }

      const results: SearchResult[] = data.items
        .map((item) => ({
          url: item.link,
          title: item.title,
          snippet: item.snippet,
          domain: this.extractDomain(item.link),
          credibility_score: 0.5, // Will be scored by credibility-scorer
        }))
        .slice(0, this.resultLimit);

      this.cacheResults(query, results);
      return results;
    } catch (error) {
      this.logSearch(query, `error: ${error}`);
      return [];
    }
  }

  /**
   * Search for claims with supporting evidence
   */
  async searchClaims(claim: string): Promise<SearchResult[]> {
    const query = `"${claim}" evidence research`;
    return this.searchEvidence(query);
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    try {
      const result = this.db
        .prepare(`DELETE FROM search_cache WHERE expires_at <= datetime('now')`)
        .run();
      console.log(`[SEARCH] Cleared ${result.changes} expired cache entries`);
    } catch (error) {
      console.error('[SEARCH] Cache cleanup error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { total: number; valid: number; expired: number } {
    try {
      const total = (
        this.db.prepare(`SELECT COUNT(*) as count FROM search_cache`).get() as {
          count: number;
        }
      ).count;

      const valid = (
        this.db
          .prepare(
            `SELECT COUNT(*) as count FROM search_cache WHERE expires_at > datetime('now')`
          )
          .get() as { count: number }
      ).count;

      return {
        total,
        valid,
        expired: total - valid,
      };
    } catch (error) {
      console.error('[SEARCH] Stats retrieval error:', error);
      return { total: 0, valid: 0, expired: 0 };
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
