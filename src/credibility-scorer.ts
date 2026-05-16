/**
 * TruthForge AI - Source Credibility Scorer
 * Evaluates source credibility based on domain reputation and content analysis
 */

export interface SourceCredibility {
  domain: string;
  score: number;
  category: string;
  reasoning: string;
}

export class CredibilityScorer {
  private domainReputation: Map<string, number> = new Map();
  private domainCategory: Map<string, string> = new Map();
  private minCredibilityThreshold: number;

  constructor() {
    this.minCredibilityThreshold = parseFloat(process.env.MIN_CREDIBILITY_SCORE || '0.75');
    this.initializeDomainDatabase();
  }

  /**
   * Initialize domain reputation database
   */
  private initializeDomainDatabase(): void {
    // Peer-reviewed and academic sources (0.9)
    const peerReviewedDomains = [
      'nature.com',
      'science.org',
      'cell.com',
      'doi.org',
      'plos.org',
      'plos',
      'springer.com',
      'ieee.org',
      'acm.org',
      'arxiv.org',
      'pubmed.ncbi.nlm.nih.gov',
      'sciencedirect.com',
      'tandfonline.com',
      'jstor.org',
      'research.google',
    ];

    // Academic institutions and universities (0.85)
    const academicDomains = [
      '.edu',
      'stanford.edu',
      'mit.edu',
      'harvard.edu',
      'berkeley.edu',
      'ox.ac.uk',
      'cam.ac.uk',
      'eth.ch',
      'caltech.edu',
      'jpl.nasa.gov',
      'nasa.gov',
    ];

    // Reputable news and media (0.7)
    const reputableNewsDomains = [
      'bbc.com',
      'bbc.co.uk',
      'reuters.com',
      'apnews.com',
      'nytimes.com',
      'theguardian.com',
      'economist.com',
      'ft.com',
      'wired.com',
      'nature.com',
      'sciencenews.org',
      'pbs.org',
      'npr.org',
      'newscientist.com',
      'theverge.com',
    ];

    // Government and official sources (0.8)
    const governmentDomains = [
      '.gov',
      '.gov.uk',
      '.gov.au',
      '.gov.ca',
      'whitehouse.gov',
      'congress.gov',
      'parliament.uk',
      'epa.gov',
      'fda.gov',
      'nih.gov',
      'cdc.gov',
      'noaa.gov',
      'usgs.gov',
    ];

    // Blogs and forums (0.5)
    const blogDomains = ['medium.com', 'substack.com', 'wordpress.com', 'blogger.com'];

    // Register domains
    peerReviewedDomains.forEach((domain) => {
      this.domainReputation.set(domain, 0.9);
      this.domainCategory.set(domain, 'peer-reviewed');
    });

    academicDomains.forEach((domain) => {
      this.domainReputation.set(domain, 0.85);
      this.domainCategory.set(domain, 'academic');
    });

    reputableNewsDomains.forEach((domain) => {
      this.domainReputation.set(domain, 0.7);
      this.domainCategory.set(domain, 'news');
    });

    governmentDomains.forEach((domain) => {
      this.domainReputation.set(domain, 0.8);
      this.domainCategory.set(domain, 'government');
    });

    blogDomains.forEach((domain) => {
      this.domainReputation.set(domain, 0.5);
      this.domainCategory.set(domain, 'blog');
    });
  }

  /**
   * Score a source based on domain
   */
  scoreSource(domain: string): SourceCredibility {
    if (!domain) {
      return {
        domain: '',
        score: 0.2,
        category: 'unknown',
        reasoning: 'No domain information',
      };
    }

    const lowerDomain = domain.toLowerCase();

    // Check for exact matches
    if (this.domainReputation.has(lowerDomain)) {
      const score = this.domainReputation.get(lowerDomain)!;
      const category = this.domainCategory.get(lowerDomain)!;
      return {
        domain,
        score,
        category,
        reasoning: `Known ${category} source`,
      };
    }

    // Check for partial matches (domain extensions)
    for (const [knownDomain, score] of this.domainReputation) {
      if (knownDomain.startsWith('.') && lowerDomain.endsWith(knownDomain)) {
        const category = this.domainCategory.get(knownDomain)!;
        return {
          domain,
          score,
          category,
          reasoning: `${category.charAt(0).toUpperCase() + category.slice(1)} institution`,
        };
      }

      if (!knownDomain.startsWith('.') && lowerDomain.includes(knownDomain)) {
        const score_val = this.domainReputation.get(knownDomain)!;
        const category = this.domainCategory.get(knownDomain)!;
        return {
          domain,
          score: score_val,
          category,
          reasoning: `Subdomain of known ${category} source`,
        };
      }
    }

    // Heuristic scoring for unknown domains
    return this.heuristicScore(lowerDomain);
  }

  /**
   * Apply heuristics to score unknown domains
   */
  private heuristicScore(domain: string): SourceCredibility {
    let score = 0.3; // Default low score
    let reasoning = '';

    // Check for HTTPS and other signals (we can't check these directly from domain)
    // But we can infer from structure
    if (domain.includes('research') || domain.includes('institute') || domain.includes('lab')) {
      score = 0.65;
      reasoning = 'Research-related organization';
    } else if (
      domain.includes('wiki') ||
      domain.includes('forum') ||
      domain.includes('reddit')
    ) {
      score = 0.35;
      reasoning = 'Community-generated content';
    } else if (
      domain.includes('blog') ||
      domain.includes('personal') ||
      domain.includes('medium')
    ) {
      score = 0.4;
      reasoning = 'Personal blog or medium';
    } else if (domain.includes('company') || domain.includes('business')) {
      score = 0.55;
      reasoning = 'Commercial entity';
    } else if (domain.length > 20) {
      score = 0.25;
      reasoning = 'Suspiciously long domain';
    } else {
      score = 0.4;
      reasoning = 'Unknown source';
    }

    return {
      domain,
      score,
      category: 'unknown',
      reasoning,
    };
  }

  /**
   * Score content for credibility signals
   */
  scoreContent(content: string, source: string): number {
    let contentScore = 0.5;

    // Check for citations and references
    if (
      content.match(/\[\d+\]/) ||
      content.match(/http/) ||
      content.includes('http') ||
      content.match(/doi\s*:/)
    ) {
      contentScore += 0.15;
    }

    // Check for statistical data
    if (content.match(/\d+%/) || content.match(/\d+,\d+/) || content.match(/\d+ (million|billion)/i)) {
      contentScore += 0.1;
    }

    // Check for qualifiers (often signs of careful writing)
    if (content.match(/research\s+(shows|indicates|suggests)/i)) {
      contentScore += 0.05;
    }

    // Check for hedging language (scientific caution)
    if (content.match(/may\s+|appears\s+to\s+|suggests\s+|indicates\s+/i)) {
      contentScore += 0.05;
    }

    // Reduce score for red flags
    if (content.match(/MUST READ|SHOCKING|GUARANTEED|PROVEN/i)) {
      contentScore -= 0.2;
    }

    // Cap score
    return Math.min(1.0, Math.max(0.0, contentScore));
  }

  /**
   * Combine source and content scores
   */
  evaluateEvidence(title: string, snippet: string, domain: string): number {
    const sourceCredibility = this.scoreSource(domain);
    const contentScore = this.scoreContent(snippet, domain);

    // Weight: 70% source credibility, 30% content quality
    const combinedScore = sourceCredibility.score * 0.7 + contentScore * 0.3;

    return Math.min(1.0, Math.max(0.0, combinedScore));
  }

  /**
   * Filter results by credibility threshold
   */
  filterByCredibility(
    results: Array<{ domain: string; title: string; snippet: string; url: string }>
  ): Array<{ domain: string; title: string; snippet: string; url: string; credibility: number }> {
    return results
      .map((result) => ({
        ...result,
        credibility: this.evaluateEvidence(result.title, result.snippet, result.domain),
      }))
      .filter((result) => result.credibility >= this.minCredibilityThreshold)
      .sort((a, b) => b.credibility - a.credibility);
  }

  /**
   * Get domain categories
   */
  getDomainCategories(): Record<string, string[]> {
    const categories: Record<string, string[]> = {};

    for (const [domain, category] of this.domainCategory) {
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(domain);
    }

    return categories;
  }

  /**
   * Get credibility threshold
   */
  getMinCredibilityThreshold(): number {
    return this.minCredibilityThreshold;
  }

  /**
   * Set credibility threshold
   */
  setMinCredibilityThreshold(threshold: number): void {
    if (threshold >= 0 && threshold <= 1) {
      this.minCredibilityThreshold = threshold;
    }
  }
}
