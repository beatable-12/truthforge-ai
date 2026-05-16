/**
 * TruthForge AI - Response Parser
 * Parses Gemini API text responses into structured formats
 * Handles various response formats and provides fallback values
 */

export interface ParsedThesis {
  thesis: string;
  key_points: string[];
  reasoning?: string;
  strength: number;
  assumptions?: string[];
}

export interface ParsedAntithesis {
  antithesis: string;
  counter_points: string[];
  reasoning?: string;
  strength: number;
  assumptions?: string[];
}

export interface ParsedEvidence {
  credibility_score: number;
  relevance_score: number;
  key_findings: string[];
  quality_assessment: string;
  limitations?: string;
  source_type?: string;
  recency?: string;
}

export interface ParsedSynthesis {
  analysis: string;
  supporting_signals: string[];
  counterarguments: string[];
  confidence: string;
  final_answer: string;
  reasoning_chain: string[];
}

export interface ParsedVerdict {
  evaluation: string;
  logic_quality_score: number;
  evidence_strength_score: number;
  assumption_validity: number;
  overall_confidence: number;
  key_findings?: string[];
  reasoning_quality?: string;
}

export class ResponseParser {
  /**
   * Extract JSON from text response
   */
  static extractJson(response: string): Record<string, any> {
    try {
      // Try to find JSON object in response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Parse thesis response
   */
  static parseThesis(response: string, fallback: string = ''): ParsedThesis {
    const json = this.extractJson(response);

    return {
      thesis: json.thesis || fallback || response.substring(0, 200),
      key_points: Array.isArray(json.key_points)
        ? json.key_points.filter((p: any) => typeof p === 'string')
        : this._extractBulletPoints(response),
      reasoning: json.reasoning || '',
      strength: this._normalizeScore(json.strength, 0.8),
      assumptions: Array.isArray(json.assumptions)
        ? json.assumptions.filter((a: any) => typeof a === 'string')
        : []
    };
  }

  /**
   * Parse antithesis response
   */
  static parseAntithesis(response: string, fallback: string = ''): ParsedAntithesis {
    const json = this.extractJson(response);

    return {
      antithesis: json.antithesis || fallback || response.substring(0, 200),
      counter_points: Array.isArray(json.counter_points)
        ? json.counter_points.filter((p: any) => typeof p === 'string')
        : this._extractBulletPoints(response),
      reasoning: json.reasoning || '',
      strength: this._normalizeScore(json.strength, 0.75),
      assumptions: Array.isArray(json.assumptions)
        ? json.assumptions.filter((a: any) => typeof a === 'string')
        : []
    };
  }

  /**
   * Parse evidence analysis response
   */
  static parseEvidence(response: string): ParsedEvidence {
    const json = this.extractJson(response);

    return {
      credibility_score: this._normalizeScore(json.credibility_score, 0.7),
      relevance_score: this._normalizeScore(json.relevance_score, 0.7),
      key_findings: Array.isArray(json.key_findings)
        ? json.key_findings.filter((f: any) => typeof f === 'string')
        : this._extractBulletPoints(response),
      quality_assessment: json.quality_assessment || response.substring(0, 300),
      limitations: json.limitations || '',
      source_type: json.source_type || 'unknown',
      recency: json.recency || ''
    };
  }

  /**
   * Parse synthesis response
   */
  static parseSynthesis(response: string): ParsedSynthesis {
    const json = this.extractJson(response);

    return {
      analysis: json.analysis || response.substring(0, 400),
      supporting_signals: Array.isArray(json.supporting_signals)
        ? json.supporting_signals.filter((s: any) => typeof s === 'string')
        : this._extractBulletPoints(response, 'supporting_signals'),
      counterarguments: Array.isArray(json.counterarguments)
        ? json.counterarguments.filter((c: any) => typeof c === 'string')
        : this._extractBulletPoints(response, 'counterarguments'),
      confidence: this._normalizeConfidence(json.confidence),
      final_answer: json.final_answer || response.substring(0, 300),
      reasoning_chain: Array.isArray(json.reasoning_chain)
        ? json.reasoning_chain.filter((r: any) => typeof r === 'string')
        : this._extractNumberedPoints(response)
    };
  }

  /**
   * Parse verdict response
   */
  static parseVerdict(response: string): ParsedVerdict {
    const json = this.extractJson(response);

    return {
      evaluation: json.evaluation || response.substring(0, 300),
      logic_quality_score: this._normalizeScore(json.logic_quality_score, 0.75),
      evidence_strength_score: this._normalizeScore(json.evidence_strength_score, 0.75),
      assumption_validity: this._normalizeScore(json.assumption_validity, 0.75),
      overall_confidence: this._normalizeScore(json.overall_confidence, 0.75),
      key_findings: Array.isArray(json.key_findings)
        ? json.key_findings.filter((f: any) => typeof f === 'string')
        : this._extractBulletPoints(response),
      reasoning_quality: json.reasoning_quality || ''
    };
  }

  /**
   * Extract bullet points from text
   */
  private static _extractBulletPoints(
    text: string,
    sectionName?: string
  ): string[] {
    const lines = text.split('\n');
    const points: string[] = [];

    let inSection = !sectionName;

    for (const line of lines) {
      const trimmed = line.trim();

      if (sectionName && trimmed.toLowerCase().includes(sectionName.toLowerCase())) {
        inSection = true;
        continue;
      }

      if (inSection && trimmed) {
        if (trimmed.match(/^[-*•]\s+/) || trimmed.match(/^\d+\.\s+/)) {
          const point = trimmed.replace(/^[-*•]\s+|\d+\.\s+/, '').trim();
          if (point && points.length < 10) {
            points.push(point);
          }
        }
      }
    }

    return points;
  }

  /**
   * Extract numbered points from text
   */
  private static _extractNumberedPoints(text: string): string[] {
    const lines = text.split('\n');
    const points: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      const match = trimmed.match(/^\d+\.\s+(.+)/);

      if (match) {
        const point = match[1].trim();
        if (point && points.length < 10) {
          points.push(point);
        }
      }
    }

    return points;
  }

  /**
   * Normalize score to 0-1 range
   */
  private static _normalizeScore(value: any, fallback: number = 0.5): number {
    if (typeof value !== 'number') {
      return fallback;
    }

    if (value > 1) {
      // If score is 0-100, convert to 0-1
      if (value > 10) {
        return Math.min(1, Math.max(0, value / 100));
      }
      // If score is 1-10, convert to 0-1
      return Math.min(1, Math.max(0, value / 10));
    }

    return Math.min(1, Math.max(0, value));
  }

  /**
   * Normalize confidence level
   */
  private static _normalizeConfidence(value: any): string {
    const confidence = String(value || '').toLowerCase().trim();

    if (confidence.includes('high')) return 'High';
    if (confidence.includes('medium')) return 'Medium';
    if (confidence.includes('low')) return 'Low';

    return 'Medium';
  }

  /**
   * Validate parsed thesis
   */
  static validateThesis(thesis: ParsedThesis): thesis is ParsedThesis {
    return (
      typeof thesis.thesis === 'string' &&
      thesis.thesis.length > 0 &&
      Array.isArray(thesis.key_points) &&
      thesis.key_points.length > 0 &&
      typeof thesis.strength === 'number' &&
      thesis.strength >= 0 &&
      thesis.strength <= 1
    );
  }

  /**
   * Validate parsed evidence
   */
  static validateEvidence(evidence: ParsedEvidence): evidence is ParsedEvidence {
    return (
      typeof evidence.credibility_score === 'number' &&
      evidence.credibility_score >= 0 &&
      evidence.credibility_score <= 1 &&
      typeof evidence.relevance_score === 'number' &&
      evidence.relevance_score >= 0 &&
      evidence.relevance_score <= 1 &&
      Array.isArray(evidence.key_findings)
    );
  }

  /**
   * Validate parsed synthesis
   */
  static validateSynthesis(synthesis: ParsedSynthesis): synthesis is ParsedSynthesis {
    return (
      typeof synthesis.analysis === 'string' &&
      synthesis.analysis.length > 0 &&
      Array.isArray(synthesis.supporting_signals) &&
      Array.isArray(synthesis.counterarguments) &&
      typeof synthesis.final_answer === 'string' &&
      synthesis.final_answer.length > 0
    );
  }

  /**
   * Validate parsed verdict
   */
  static validateVerdict(verdict: ParsedVerdict): verdict is ParsedVerdict {
    return (
      typeof verdict.evaluation === 'string' &&
      verdict.evaluation.length > 0 &&
      typeof verdict.logic_quality_score === 'number' &&
      verdict.logic_quality_score >= 0 &&
      verdict.logic_quality_score <= 1 &&
      typeof verdict.overall_confidence === 'number' &&
      verdict.overall_confidence >= 0 &&
      verdict.overall_confidence <= 1
    );
  }
}

export default ResponseParser;
