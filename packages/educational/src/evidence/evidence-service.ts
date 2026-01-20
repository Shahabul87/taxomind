/**
 * Evidence Service
 * Enhanced Depth Analysis - January 2026
 *
 * Service for managing analysis evidence:
 * - Storing and retrieving evidence
 * - Confidence calculation
 * - Evidence aggregation and summarization
 */

import type { BloomsLevel } from '@sam-ai/core';
import type { WebbDOKLevel } from '../types/depth-analysis.types';
import type {
  AnalysisEvidenceStore,
  AnalysisEvidenceInput,
  AnalysisEvidenceData,
  EvidenceServiceOptions,
  EvidenceLogger,
  EvidenceQuery,
  EvidenceSummary,
  EvidenceSourceType,
  ContentContext,
  TextPosition,
  ConfidenceBreakdown,
  ConfidenceCalculatorOptions,
  ConfidenceCalculationResult,
  KeywordMatch,
  KeywordAnalysisResult,
  AggregatedEvidence,
  EvidenceAggregationResult,
  EvidenceConflict,
} from './types';

const EVIDENCE_SERVICE_VERSION = '1.0.0';

// ═══════════════════════════════════════════════════════════════
// KEYWORD DICTIONARIES
// ═══════════════════════════════════════════════════════════════

const BLOOMS_KEYWORDS: Record<BloomsLevel, { primary: string[]; secondary: string[] }> = {
  REMEMBER: {
    primary: ['recall', 'identify', 'recognize', 'list', 'name', 'define', 'match', 'memorize', 'label', 'state'],
    secondary: ['describe', 'locate', 'retrieve', 'repeat', 'quote', 'recite'],
  },
  UNDERSTAND: {
    primary: ['explain', 'summarize', 'interpret', 'classify', 'compare', 'infer', 'paraphrase'],
    secondary: ['discuss', 'distinguish', 'translate', 'illustrate', 'extend', 'predict'],
  },
  APPLY: {
    primary: ['apply', 'implement', 'execute', 'use', 'demonstrate', 'solve', 'compute'],
    secondary: ['operate', 'practice', 'calculate', 'employ', 'perform', 'show'],
  },
  ANALYZE: {
    primary: ['analyze', 'differentiate', 'organize', 'attribute', 'examine', 'investigate'],
    secondary: ['dissect', 'contrast', 'categorize', 'deconstruct', 'compare', 'diagram'],
  },
  EVALUATE: {
    primary: ['evaluate', 'judge', 'critique', 'assess', 'argue', 'defend', 'justify'],
    secondary: ['appraise', 'prioritize', 'validate', 'recommend', 'rate', 'select'],
  },
  CREATE: {
    primary: ['create', 'design', 'develop', 'produce', 'construct', 'generate', 'compose'],
    secondary: ['synthesize', 'invent', 'formulate', 'devise', 'build', 'plan'],
  },
};

const CONTEXT_MULTIPLIERS: Record<ContentContext, number> = {
  instructional: 1.0,
  assessment: 1.2, // Assessment context is more definitive
  activity: 1.1,
  discussion: 0.9,
  reflection: 1.0,
  project: 1.15,
  example: 0.85,
  definition: 0.9,
};

const POSITION_MULTIPLIERS: Record<'beginning' | 'middle' | 'end', number> = {
  beginning: 1.1, // Key terms at beginning are often important
  middle: 1.0,
  end: 1.05, // Conclusions are often at end
};

// ═══════════════════════════════════════════════════════════════
// DEFAULT CONFIDENCE CALCULATOR OPTIONS
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIDENCE_OPTIONS: Required<ConfidenceCalculatorOptions> = {
  keywordBaseWeight: 0.6,
  contextWeight: 0.2,
  positionWeight: 0.2,
  minConfidence: 0.1,
  maxConfidence: 0.95,
};

// ═══════════════════════════════════════════════════════════════
// EVIDENCE SERVICE
// ═══════════════════════════════════════════════════════════════

export class EvidenceService {
  private store: AnalysisEvidenceStore;
  private logger: EvidenceLogger | undefined;

  constructor(options: EvidenceServiceOptions) {
    this.store = options.store;
    this.logger = options.logger;
  }

  /**
   * Store evidence for an analysis
   */
  async storeEvidence(
    analysisId: string,
    evidence: AnalysisEvidenceInput[]
  ): Promise<AnalysisEvidenceData[]> {
    this.logger?.info(`Storing ${evidence.length} evidence items for analysis: ${analysisId}`);

    const result = await this.store.storeEvidence(analysisId, evidence);

    this.logger?.info(`Stored ${result.length} evidence items`);
    return result;
  }

  /**
   * Get all evidence for an analysis
   */
  async getEvidenceForAnalysis(analysisId: string): Promise<AnalysisEvidenceData[]> {
    return this.store.getEvidenceForAnalysis(analysisId);
  }

  /**
   * Get evidence by classification
   */
  async getEvidenceByClassification(
    analysisId: string,
    classification: BloomsLevel | string
  ): Promise<AnalysisEvidenceData[]> {
    return this.store.getEvidenceByClassification(analysisId, classification);
  }

  /**
   * Get evidence for a specific source
   */
  async getEvidenceForSource(
    sourceType: EvidenceSourceType,
    sourceId: string
  ): Promise<AnalysisEvidenceData[]> {
    return this.store.getEvidenceForSource(sourceType, sourceId);
  }

  /**
   * Query evidence with filters
   */
  async queryEvidence(query: EvidenceQuery): Promise<AnalysisEvidenceData[]> {
    return this.store.queryEvidence(query);
  }

  /**
   * Get evidence summary for an analysis
   */
  async getSummary(analysisId: string): Promise<EvidenceSummary> {
    return this.store.getSummary(analysisId);
  }

  /**
   * Delete evidence for an analysis
   */
  async deleteEvidenceForAnalysis(analysisId: string): Promise<number> {
    this.logger?.info(`Deleting evidence for analysis: ${analysisId}`);
    return this.store.deleteEvidenceForAnalysis(analysisId);
  }

  /**
   * Aggregate evidence for an analysis
   */
  async aggregateEvidence(analysisId: string): Promise<EvidenceAggregationResult> {
    const evidence = await this.store.getEvidenceForAnalysis(analysisId);

    const byClassification: Record<string, AggregatedEvidence> = {};

    // Group evidence by classification
    for (const e of evidence) {
      if (!byClassification[e.classification]) {
        byClassification[e.classification] = {
          classification: e.classification,
          count: 0,
          averageConfidence: 0,
          topEvidence: [],
          commonPatterns: [],
          sources: [],
        };
      }

      const agg = byClassification[e.classification];
      agg.count++;
      agg.topEvidence.push(e);
      agg.sources.push({
        sourceType: e.sourceType as EvidenceSourceType,
        sourceId: e.sourceId,
        confidence: e.confidence,
      });
    }

    // Calculate averages and sort top evidence
    for (const classification of Object.keys(byClassification)) {
      const agg = byClassification[classification];

      // Calculate average confidence
      const totalConfidence = agg.topEvidence.reduce((sum, e) => sum + e.confidence, 0);
      agg.averageConfidence = totalConfidence / agg.count;

      // Sort and limit top evidence
      agg.topEvidence.sort((a, b) => b.confidence - a.confidence);
      agg.topEvidence = agg.topEvidence.slice(0, 5);

      // Count patterns
      const patternCounts = new Map<string, number>();
      for (const e of evidence.filter((ev) => ev.classification === classification)) {
        for (const pattern of e.triggerPatterns) {
          patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
        }
      }
      agg.commonPatterns = Array.from(patternCounts.entries())
        .map(([pattern, count]) => ({ pattern, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }

    // Calculate overall confidence
    const totalEvidence = evidence.length;
    const weightedConfidence = evidence.reduce((sum, e) => sum + e.confidence, 0);
    const overallConfidence = totalEvidence > 0 ? weightedConfidence / totalEvidence : 0;

    // Detect conflicts
    const conflicts = this.detectConflicts(evidence);

    return {
      byClassification,
      overallConfidence,
      conflicts,
    };
  }

  /**
   * Detect conflicting evidence
   */
  private detectConflicts(evidence: AnalysisEvidenceData[]): EvidenceConflict[] {
    const conflicts: EvidenceConflict[] = [];

    // Group by source
    const bySource = new Map<string, AnalysisEvidenceData[]>();
    for (const e of evidence) {
      const key = `${e.sourceType}:${e.sourceId}`;
      if (!bySource.has(key)) {
        bySource.set(key, []);
      }
      bySource.get(key)!.push(e);
    }

    // Check for conflicts within same source
    for (const [, sourceEvidence] of bySource) {
      if (sourceEvidence.length > 1) {
        const classifications = new Set(sourceEvidence.map((e) => e.classification));
        if (classifications.size > 1) {
          // Multiple classifications for same source
          const highConfEvidence = sourceEvidence.filter((e) => e.confidence >= 0.7);
          if (highConfEvidence.length > 1) {
            const highConfClassifications = new Set(highConfEvidence.map((e) => e.classification));
            if (highConfClassifications.size > 1) {
              conflicts.push({
                evidenceIds: highConfEvidence.map((e) => e.id),
                description: `Same source has multiple high-confidence classifications: ${Array.from(highConfClassifications).join(', ')}`,
                severity: this.determineConflictSeverity(highConfEvidence),
                resolution: 'Review source content for primary cognitive level',
              });
            }
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Determine conflict severity based on evidence
   */
  private determineConflictSeverity(evidence: AnalysisEvidenceData[]): 'minor' | 'moderate' | 'major' {
    const maxConfidence = Math.max(...evidence.map((e) => e.confidence));
    const classifications = new Set(evidence.map((e) => e.classification));

    // Check if classifications are adjacent in Bloom's hierarchy
    const bloomsOrder: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
    const classIndices = Array.from(classifications).map((c) => bloomsOrder.indexOf(c as BloomsLevel)).filter((i) => i >= 0);

    if (classIndices.length >= 2) {
      const maxDiff = Math.max(...classIndices) - Math.min(...classIndices);
      if (maxDiff > 2 && maxConfidence >= 0.8) {
        return 'major'; // Large gap in hierarchy with high confidence
      } else if (maxDiff > 1) {
        return 'moderate';
      }
    }

    return 'minor';
  }
}

// ═══════════════════════════════════════════════════════════════
// CONFIDENCE CALCULATOR
// ═══════════════════════════════════════════════════════════════

export class ConfidenceCalculator {
  private options: Required<ConfidenceCalculatorOptions>;

  constructor(options: ConfidenceCalculatorOptions = {}) {
    this.options = {
      ...DEFAULT_CONFIDENCE_OPTIONS,
      ...options,
    };
  }

  /**
   * Calculate confidence for a classification
   */
  calculate(
    keywordMatches: KeywordMatch[],
    context: ContentContext,
    position: 'beginning' | 'middle' | 'end'
  ): ConfidenceCalculationResult {
    // Calculate keyword score
    const keywordScore = this.calculateKeywordScore(keywordMatches);

    // Apply context multiplier
    const contextMultiplier = CONTEXT_MULTIPLIERS[context] || 1.0;
    const contextScore = keywordScore * contextMultiplier;

    // Apply position multiplier
    const positionMultiplier = POSITION_MULTIPLIERS[position] || 1.0;
    const positionScore = keywordScore * positionMultiplier;

    // Combine scores
    const rawConfidence =
      keywordScore * this.options.keywordBaseWeight +
      (contextScore - keywordScore) * this.options.contextWeight +
      (positionScore - keywordScore) * this.options.positionWeight;

    // Apply bounds
    const confidence = Math.max(
      this.options.minConfidence,
      Math.min(this.options.maxConfidence, rawConfidence)
    );

    // Build breakdown
    const breakdown: ConfidenceBreakdown = {
      keywordScore,
      contextScore: contextScore / keywordScore || 1, // Normalized multiplier
      positionScore: positionScore / keywordScore || 1,
    };

    // Identify contributing and reducing factors
    const contributingFactors: string[] = [];
    const reducingFactors: string[] = [];

    if (keywordMatches.length >= 3) {
      contributingFactors.push('Multiple keyword matches');
    }
    if (keywordMatches.some((m) => m.weight >= 0.8)) {
      contributingFactors.push('High-weight keyword found');
    }
    if (contextMultiplier > 1.0) {
      contributingFactors.push(`Context boost (${context})`);
    }
    if (positionMultiplier > 1.0) {
      contributingFactors.push(`Position boost (${position})`);
    }

    if (keywordMatches.length === 1) {
      reducingFactors.push('Single keyword match');
    }
    if (contextMultiplier < 1.0) {
      reducingFactors.push(`Context reduction (${context})`);
    }
    if (keywordMatches.every((m) => m.weight < 0.5)) {
      reducingFactors.push('Low-weight keywords only');
    }

    return {
      confidence,
      breakdown,
      contributingFactors,
      reducingFactors,
    };
  }

  /**
   * Calculate keyword score
   */
  private calculateKeywordScore(matches: KeywordMatch[]): number {
    if (matches.length === 0) return 0;

    // Sum weights with diminishing returns for additional matches
    let score = 0;
    const sortedMatches = [...matches].sort((a, b) => b.weight - a.weight);

    for (let i = 0; i < sortedMatches.length; i++) {
      const diminishingFactor = 1 / (1 + i * 0.3);
      score += sortedMatches[i].weight * diminishingFactor;
    }

    // Normalize to 0-1
    return Math.min(1, score);
  }
}

// ═══════════════════════════════════════════════════════════════
// KEYWORD ANALYZER
// ═══════════════════════════════════════════════════════════════

export class KeywordAnalyzer {
  /**
   * Analyze text for Bloom's keywords
   */
  analyzeText(text: string): KeywordAnalysisResult {
    const normalizedText = text.toLowerCase();
    const matches: KeywordMatch[] = [];
    const levelCounts: Record<BloomsLevel, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    // Search for keywords at each level
    for (const [level, keywords] of Object.entries(BLOOMS_KEYWORDS)) {
      const bloomsLevel = level as BloomsLevel;

      // Check primary keywords (higher weight)
      for (const keyword of keywords.primary) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        let match;
        while ((match = regex.exec(normalizedText)) !== null) {
          matches.push({
            keyword,
            weight: 0.8, // Primary keywords have higher weight
            bloomsLevel,
            position: match.index,
          });
          levelCounts[bloomsLevel]++;
        }
      }

      // Check secondary keywords (lower weight)
      for (const keyword of keywords.secondary) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        let match;
        while ((match = regex.exec(normalizedText)) !== null) {
          matches.push({
            keyword,
            weight: 0.5, // Secondary keywords have lower weight
            bloomsLevel,
            position: match.index,
          });
          levelCounts[bloomsLevel]++;
        }
      }
    }

    // Determine primary level
    let primaryLevel: BloomsLevel = 'UNDERSTAND';
    let maxCount = 0;

    for (const [level, count] of Object.entries(levelCounts)) {
      if (count > maxCount) {
        maxCount = count;
        primaryLevel = level as BloomsLevel;
      }
    }

    // Find secondary levels
    const secondaryLevels = (Object.entries(levelCounts) as [BloomsLevel, number][])
      .filter(([level, count]) => count > 0 && level !== primaryLevel)
      .sort((a, b) => b[1] - a[1])
      .map(([level]) => level);

    // Calculate confidence
    const totalMatches = matches.length;
    const primaryMatches = matches.filter((m) => m.bloomsLevel === primaryLevel).length;
    const keywordConfidence = totalMatches > 0
      ? Math.min(0.95, 0.3 + (primaryMatches / totalMatches) * 0.5 + Math.min(totalMatches, 10) * 0.02)
      : 0.1;

    // Infer DOK level
    const inferredDOKLevel = this.inferDOKFromBlooms(primaryLevel);

    return {
      matches,
      primaryBloomsLevel: primaryLevel,
      secondaryLevels,
      keywordConfidence,
      inferredDOKLevel,
    };
  }

  /**
   * Infer DOK level from Bloom's level
   */
  private inferDOKFromBlooms(bloomsLevel: BloomsLevel): WebbDOKLevel {
    const mapping: Record<BloomsLevel, WebbDOKLevel> = {
      REMEMBER: 1,
      UNDERSTAND: 2,
      APPLY: 2,
      ANALYZE: 3,
      EVALUATE: 3,
      CREATE: 4,
    };
    return mapping[bloomsLevel];
  }

  /**
   * Extract text position for highlighting
   */
  extractTextPosition(
    text: string,
    sentence: string,
    paragraphIndex: number = 0
  ): TextPosition | null {
    const start = text.indexOf(sentence);
    if (start === -1) return null;

    return {
      start,
      end: start + sentence.length,
      paragraphIndex,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Create an evidence service instance
 */
export function createEvidenceService(options: EvidenceServiceOptions): EvidenceService {
  return new EvidenceService(options);
}

/**
 * Create a confidence calculator instance
 */
export function createConfidenceCalculator(options?: ConfidenceCalculatorOptions): ConfidenceCalculator {
  return new ConfidenceCalculator(options);
}

/**
 * Create a keyword analyzer instance
 */
export function createKeywordAnalyzer(): KeywordAnalyzer {
  return new KeywordAnalyzer();
}

export { EVIDENCE_SERVICE_VERSION };
