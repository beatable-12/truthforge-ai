/**
 * TruthForge AI - Search Query Generator
 * Generates effective search queries from claims and topics
 */

export interface GeneratedQuery {
  query: string;
  type: string;
  keywords: string[];
}

export class QueryGenerator {
  private commonStopwords = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'for',
    'from',
    'in',
    'is',
    'it',
    'of',
    'on',
    'or',
    'the',
    'to',
    'with',
    'that',
    'this',
    'but',
    'if',
    'was',
    'were',
  ]);

  /**
   * Generate search queries from a claim
   */
  generateClaimQueries(claim: string): GeneratedQuery[] {
    const queries: GeneratedQuery[] = [];

    // 1. Direct exact match query
    queries.push({
      query: `"${claim}"`,
      type: 'exact',
      keywords: this.extractKeywords(claim),
    });

    // 2. Keywords with evidence markers
    const keywords = this.extractKeywords(claim);
    if (keywords.length > 0) {
      queries.push({
        query: `${keywords.join(' ')} evidence research`,
        type: 'keywords-evidence',
        keywords,
      });
    }

    // 3. Question form
    if (!claim.endsWith('?')) {
      queries.push({
        query: `Does ${claim}?`,
        type: 'question',
        keywords,
      });
    }

    // 4. Statistical/data focused
    if (keywords.length > 0) {
      queries.push({
        query: `"${keywords[0]}" statistics data research`,
        type: 'statistical',
        keywords: [keywords[0]],
      });
    }

    // 5. Study/research focused
    if (keywords.length > 0) {
      queries.push({
        query: `${keywords.slice(0, 3).join(' ')} study research findings`,
        type: 'research',
        keywords: keywords.slice(0, 3),
      });
    }

    return queries;
  }

  /**
   * Generate counter-evidence queries
   */
  generateCounterQueries(claim: string): GeneratedQuery[] {
    const queries: GeneratedQuery[] = [];
    const keywords = this.extractKeywords(claim);

    // 1. Opposite stance queries
    queries.push({
      query: `NOT (${claim}) -"${claim}"`,
      type: 'opposite',
      keywords,
    });

    // 2. Counter arguments
    if (keywords.length > 0) {
      queries.push({
        query: `${keywords.join(' ')} counterargument criticism opposing`,
        type: 'counter-argument',
        keywords,
      });
    }

    // 3. Myth or false claims
    queries.push({
      query: `"${claim}" myth false debunked`,
      type: 'debunking',
      keywords,
    });

    // 4. Limitations or caveats
    if (keywords.length > 0) {
      queries.push({
        query: `${keywords.join(' ')} limitations limitations drawbacks`,
        type: 'limitations',
        keywords,
      });
    }

    // 5. Alternative perspectives
    queries.push({
      query: `alternative perspective ${keywords.join(' ')} contrasts`,
      type: 'alternative',
      keywords,
    });

    return queries;
  }

  /**
   * Generate supporting evidence queries
   */
  generateSupportingQueries(claim: string): GeneratedQuery[] {
    const queries: GeneratedQuery[] = [];
    const keywords = this.extractKeywords(claim);

    // 1. Expert opinion
    queries.push({
      query: `"${keywords.join(' ')}" expert opinion analysis`,
      type: 'expert-opinion',
      keywords,
    });

    // 2. Peer-reviewed research
    queries.push({
      query: `${keywords.join(' ')} peer-reviewed research published`,
      type: 'peer-reviewed',
      keywords,
    });

    // 3. Case studies
    queries.push({
      query: `${keywords.join(' ')} case study implementation`,
      type: 'case-study',
      keywords,
    });

    // 4. Recent developments
    queries.push({
      query: `${keywords.join(' ')} recent 2024 2023 developments`,
      type: 'recent-developments',
      keywords,
    });

    // 5. Success metrics
    queries.push({
      query: `${keywords.join(' ')} success metrics results impact`,
      type: 'success-metrics',
      keywords,
    });

    return queries;
  }

  /**
   * Extract important keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Split and clean
    const words = text
      .toLowerCase()
      .split(/[\s\p{P}]+/gu)
      .filter((word) => word.length > 2 && !this.commonStopwords.has(word));

    // Remove duplicates and limit
    const unique = [...new Set(words)];
    return unique.slice(0, 5);
  }

  /**
   * Generate domain-specific queries
   */
  generateDomainQueries(topic: string, domain: string): GeneratedQuery[] {
    const queries: GeneratedQuery[] = [];
    const keywords = this.extractKeywords(topic);

    switch (domain.toLowerCase()) {
      case 'technology':
        queries.push(
          {
            query: `"${keywords.join(' ')}" artificial intelligence machine learning`,
            type: 'ai-technology',
            keywords: [...keywords, 'AI'],
          },
          {
            query: `${keywords.join(' ')} software development framework`,
            type: 'tech-framework',
            keywords,
          }
        );
        break;

      case 'medicine':
      case 'health':
        queries.push(
          {
            query: `"${keywords.join(' ')}" clinical trial medical research`,
            type: 'clinical-research',
            keywords: [...keywords, 'clinical'],
          },
          {
            query: `${keywords.join(' ')} FDA approved treatment`,
            type: 'fda-approved',
            keywords,
          }
        );
        break;

      case 'environment':
        queries.push(
          {
            query: `"${keywords.join(' ')}" climate change environmental impact`,
            type: 'climate-related',
            keywords: [...keywords, 'climate'],
          },
          {
            query: `${keywords.join(' ')} sustainability environmental study`,
            type: 'sustainability',
            keywords,
          }
        );
        break;

      case 'economics':
      case 'finance':
        queries.push(
          {
            query: `"${keywords.join(' ')}" economic analysis financial report`,
            type: 'economic-report',
            keywords: [...keywords, 'economic'],
          },
          {
            query: `${keywords.join(' ')} market research industry analysis`,
            type: 'market-analysis',
            keywords,
          }
        );
        break;

      case 'politics':
      case 'social':
        queries.push(
          {
            query: `"${keywords.join(' ')}" policy analysis government report`,
            type: 'policy-analysis',
            keywords: [...keywords, 'policy'],
          },
          {
            query: `${keywords.join(' ')} social impact statistical analysis`,
            type: 'social-impact',
            keywords,
          }
        );
        break;

      default:
        // Default queries for unknown domains
        queries.push(
          {
            query: `"${keywords.join(' ')}" research study`,
            type: 'research-default',
            keywords,
          },
          {
            query: `${keywords.join(' ')} analysis findings`,
            type: 'analysis-default',
            keywords,
          }
        );
    }

    return queries;
  }

  /**
   * Combine and deduplicate queries
   */
  combineQueries(...queryLists: GeneratedQuery[][]): GeneratedQuery[] {
    const seen = new Set<string>();
    const combined: GeneratedQuery[] = [];

    for (const list of queryLists) {
      for (const query of list) {
        if (!seen.has(query.query.toLowerCase())) {
          seen.add(query.query.toLowerCase());
          combined.push(query);
        }
      }
    }

    return combined;
  }

  /**
   * Rank queries by complexity and relevance
   */
  rankQueries(queries: GeneratedQuery[]): GeneratedQuery[] {
    return queries.sort((a, b) => {
      // Prioritize: exact > specific > general
      const typeOrder: Record<string, number> = {
        'exact': 5,
        'question': 4,
        'peer-reviewed': 4,
        'research': 4,
        'keywords-evidence': 3,
        'counter-argument': 3,
        'case-study': 3,
        'statistical': 2,
        'general': 1,
      };

      const aScore = typeOrder[a.type] || 1;
      const bScore = typeOrder[b.type] || 1;

      if (aScore !== bScore) {
        return bScore - aScore;
      }

      // Secondary: by keyword count
      return b.keywords.length - a.keywords.length;
    });
  }

  /**
   * Format query for search API
   */
  formatForSearch(generatedQuery: GeneratedQuery): string {
    // Clean up special query syntax for actual API use
    return generatedQuery.query
      .replace(/NOT\s+\(/g, '-')
      .replace(/\)/g, '')
      .replace(/-"([^"]+)"/g, '-"$1"')
      .trim();
  }

  /**
   * Generate comprehensive search strategy
   */
  generateSearchStrategy(
    topic: string,
    domain: string = ''
  ): { supporting: GeneratedQuery[]; counter: GeneratedQuery[]; general: GeneratedQuery[] } {
    const general = this.generateClaimQueries(topic);
    const supporting = this.generateSupportingQueries(topic);
    const counter = this.generateCounterQueries(topic);

    // Add domain-specific if provided
    if (domain) {
      const domainQueries = this.generateDomainQueries(topic, domain);
      const combined = this.combineQueries([supporting], [domainQueries]);
      return {
        supporting: this.rankQueries(combined),
        counter: this.rankQueries(counter),
        general: this.rankQueries(general),
      };
    }

    return {
      supporting: this.rankQueries(supporting),
      counter: this.rankQueries(counter),
      general: this.rankQueries(general),
    };
  }
}
