/**
 * Cognitive Load Analyzer
 *
 * Phase 3: Cognitive Load Integration
 * Analyzes content for cognitive load factors based on Cognitive Load Theory (CLT)
 *
 * Three types of cognitive load:
 * - Intrinsic: Inherent complexity of the material
 * - Extraneous: Unnecessary processing burden (poor design, confusing presentation)
 * - Germane: Learning-productive processing (schema building, deep understanding)
 */

import type { BloomsLevel } from './types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Cognitive load types based on Cognitive Load Theory
 */
export type CognitiveLoadType = 'intrinsic' | 'extraneous' | 'germane';

/**
 * Individual cognitive load measurement
 */
export interface CognitiveLoadMeasurement {
  /**
   * Type of cognitive load
   */
  type: CognitiveLoadType;

  /**
   * Load score (0-100)
   * Higher = more load
   */
  score: number;

  /**
   * Factors contributing to this load
   */
  factors: CognitiveLoadFactor[];

  /**
   * Confidence in the measurement (0-1)
   */
  confidence: number;
}

/**
 * Factor contributing to cognitive load
 */
export interface CognitiveLoadFactor {
  /**
   * Factor name
   */
  name: string;

  /**
   * Factor contribution to load (0-100)
   */
  contribution: number;

  /**
   * Evidence for this factor
   */
  evidence: string;

  /**
   * Whether this factor can be optimized
   */
  optimizable: boolean;
}

/**
 * Complete cognitive load analysis result
 */
export interface CognitiveLoadResult {
  /**
   * Overall cognitive load score (0-100)
   * Weighted combination of all load types
   */
  totalLoad: number;

  /**
   * Load category based on total load
   */
  loadCategory: 'low' | 'moderate' | 'high' | 'overload';

  /**
   * Individual load measurements
   */
  measurements: {
    intrinsic: CognitiveLoadMeasurement;
    extraneous: CognitiveLoadMeasurement;
    germane: CognitiveLoadMeasurement;
  };

  /**
   * Balance assessment
   * Ideal: low extraneous, appropriate intrinsic, high germane
   */
  balance: CognitiveLoadBalance;

  /**
   * Recommendations for optimizing cognitive load
   */
  recommendations: CognitiveLoadRecommendation[];

  /**
   * Bloom's level compatibility
   * Higher Bloom's levels require more cognitive capacity
   */
  bloomsCompatibility: BloomsCompatibility;

  /**
   * Processing metadata
   */
  metadata: {
    processingTimeMs: number;
    timestamp: string;
    contentLength: number;
  };
}

/**
 * Balance assessment of cognitive load distribution
 */
export interface CognitiveLoadBalance {
  /**
   * Overall balance status
   */
  status: 'optimal' | 'suboptimal' | 'problematic';

  /**
   * Whether extraneous load is minimized
   */
  extraneousMinimized: boolean;

  /**
   * Whether germane load is maximized
   */
  germaneMaximized: boolean;

  /**
   * Whether intrinsic load matches learner level
   */
  intrinsicAppropriate: boolean;

  /**
   * Balance score (0-100)
   */
  score: number;
}

/**
 * Recommendation for optimizing cognitive load
 */
export interface CognitiveLoadRecommendation {
  /**
   * Target load type
   */
  targetType: CognitiveLoadType;

  /**
   * Recommendation action
   */
  action: string;

  /**
   * Expected improvement
   */
  expectedImprovement: string;

  /**
   * Priority (1-5, 1 = highest)
   */
  priority: number;

  /**
   * Specific techniques to apply
   */
  techniques?: string[];
}

/**
 * Bloom's level compatibility with cognitive load
 */
export interface BloomsCompatibility {
  /**
   * Maximum recommended Bloom's level given current load
   */
  maxRecommendedLevel: BloomsLevel;

  /**
   * Whether current load supports the target Bloom's level
   */
  supportsTargetLevel: boolean;

  /**
   * Cognitive capacity remaining after current load (0-100)
   */
  remainingCapacity: number;

  /**
   * Adjustment suggestions
   */
  adjustments?: string[];
}

// ============================================================================
// INDICATORS
// ============================================================================

/**
 * Intrinsic load indicators (content complexity)
 */
export const INTRINSIC_LOAD_INDICATORS = {
  high: [
    'complex', 'advanced', 'intricate', 'sophisticated', 'multifaceted',
    'interconnected', 'abstract', 'theoretical', 'conceptual', 'nuanced',
    'comprehensive', 'challenging', 'demanding', 'intensive', 'rigorous',
  ],
  moderate: [
    'multiple', 'several', 'various', 'related', 'connected',
    'integrated', 'combined', 'detailed', 'thorough', 'systematic',
  ],
  low: [
    'simple', 'basic', 'fundamental', 'elementary', 'straightforward',
    'single', 'isolated', 'concrete', 'familiar', 'routine',
  ],
};

/**
 * Extraneous load indicators (poor design/presentation)
 */
export const EXTRANEOUS_LOAD_INDICATORS = {
  high: [
    // Format issues
    'inconsistent', 'disorganized', 'cluttered', 'confusing', 'unclear',
    // Navigation issues
    'scattered', 'fragmented', 'discontinuous', 'jump', 'abrupt',
    // Presentation issues
    'redundant', 'repetitive', 'verbose', 'wordy', 'convoluted',
  ],
  moderate: [
    'dense', 'lengthy', 'packed', 'detailed', 'technical',
  ],
  low: [
    'clear', 'organized', 'structured', 'concise', 'streamlined',
    'coherent', 'logical', 'sequential', 'focused', 'minimal',
  ],
};

/**
 * Germane load indicators (schema building)
 */
export const GERMANE_LOAD_INDICATORS = {
  high: [
    // Active learning
    'practice', 'apply', 'solve', 'create', 'design', 'build',
    // Reflection
    'reflect', 'consider', 'think', 'analyze', 'evaluate', 'synthesize',
    // Connection
    'connect', 'relate', 'integrate', 'transfer', 'generalize', 'abstract',
    // Self-explanation
    'explain', 'describe', 'elaborate', 'justify', 'reason', 'argue',
  ],
  moderate: [
    'example', 'demonstrate', 'illustrate', 'show', 'compare',
    'contrast', 'differentiate', 'distinguish', 'categorize',
  ],
  low: [
    'memorize', 'recall', 'recognize', 'list', 'name', 'identify',
    'repeat', 'copy', 'state', 'define',
  ],
};

/**
 * Bloom's level cognitive requirements
 * Higher levels require more cognitive capacity
 */
const BLOOMS_COGNITIVE_REQUIREMENTS: Record<BloomsLevel, number> = {
  REMEMBER: 20,
  UNDERSTAND: 35,
  APPLY: 50,
  ANALYZE: 65,
  EVALUATE: 80,
  CREATE: 95,
};

// ============================================================================
// COGNITIVE LOAD ANALYZER CLASS
// ============================================================================

/**
 * Cognitive Load Analyzer
 * Analyzes content for cognitive load and provides optimization recommendations
 */
export class CognitiveLoadAnalyzer {
  /**
   * Analyze content for cognitive load
   */
  analyze(content: string, targetBloomsLevel?: BloomsLevel): CognitiveLoadResult {
    const startTime = Date.now();
    const text = content.toLowerCase();

    // Measure individual load types
    const intrinsic = this.measureIntrinsicLoad(text);
    const extraneous = this.measureExtraneousLoad(text);
    const germane = this.measureGermaneLoad(text);

    // Calculate total load (weighted)
    // Extraneous is bad, intrinsic is necessary, germane is productive
    const totalLoad = this.calculateTotalLoad(intrinsic, extraneous, germane);
    const loadCategory = this.categorizeLoad(totalLoad);

    // Assess balance
    const balance = this.assessBalance(intrinsic, extraneous, germane);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      intrinsic,
      extraneous,
      germane,
      balance
    );

    // Assess Bloom's compatibility
    const bloomsCompatibility = this.assessBloomsCompatibility(
      totalLoad,
      targetBloomsLevel
    );

    return {
      totalLoad,
      loadCategory,
      measurements: {
        intrinsic,
        extraneous,
        germane,
      },
      balance,
      recommendations,
      bloomsCompatibility,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        contentLength: content.length,
      },
    };
  }

  /**
   * Measure intrinsic cognitive load
   */
  private measureIntrinsicLoad(text: string): CognitiveLoadMeasurement {
    const factors: CognitiveLoadFactor[] = [];
    let totalScore = 0;

    // Check complexity indicators
    const highMatches = this.countIndicators(text, INTRINSIC_LOAD_INDICATORS.high);
    const moderateMatches = this.countIndicators(text, INTRINSIC_LOAD_INDICATORS.moderate);
    const lowMatches = this.countIndicators(text, INTRINSIC_LOAD_INDICATORS.low);

    // Complexity factor
    const complexityScore = this.calculateIndicatorScore(highMatches, moderateMatches, lowMatches);
    if (complexityScore > 0) {
      factors.push({
        name: 'Content Complexity',
        contribution: complexityScore,
        evidence: `High: ${highMatches}, Moderate: ${moderateMatches}, Low: ${lowMatches} complexity indicators`,
        optimizable: false, // Intrinsic complexity is inherent
      });
      totalScore += complexityScore * 0.4;
    }

    // Sentence length factor (longer = higher load)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0
      ? sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
      : 0;
    const sentenceLengthScore = Math.min(100, avgSentenceLength * 4);
    factors.push({
      name: 'Sentence Complexity',
      contribution: sentenceLengthScore,
      evidence: `Average ${Math.round(avgSentenceLength)} words per sentence`,
      optimizable: true,
    });
    totalScore += sentenceLengthScore * 0.3;

    // Vocabulary diversity factor
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const uniqueWords = new Set(words);
    const vocabDiversity = words.length > 0 ? (uniqueWords.size / words.length) * 100 : 0;
    factors.push({
      name: 'Vocabulary Diversity',
      contribution: vocabDiversity,
      evidence: `${uniqueWords.size} unique words out of ${words.length} total`,
      optimizable: false,
    });
    totalScore += vocabDiversity * 0.3;

    return {
      type: 'intrinsic',
      score: Math.min(100, totalScore),
      factors,
      confidence: 0.75,
    };
  }

  /**
   * Measure extraneous cognitive load
   */
  private measureExtraneousLoad(text: string): CognitiveLoadMeasurement {
    const factors: CognitiveLoadFactor[] = [];
    let totalScore = 0;

    // Check extraneous indicators
    const highMatches = this.countIndicators(text, EXTRANEOUS_LOAD_INDICATORS.high);
    const moderateMatches = this.countIndicators(text, EXTRANEOUS_LOAD_INDICATORS.moderate);
    const lowMatches = this.countIndicators(text, EXTRANEOUS_LOAD_INDICATORS.low);

    // Extraneous is inverted - high indicators = high load, low indicators = low load
    const extraneousScore = this.calculateIndicatorScore(highMatches, moderateMatches, lowMatches);
    if (highMatches > 0 || moderateMatches > 0) {
      factors.push({
        name: 'Presentation Issues',
        contribution: extraneousScore,
        evidence: `${highMatches} high, ${moderateMatches} moderate extraneous indicators`,
        optimizable: true,
      });
      totalScore += extraneousScore * 0.5;
    }

    // Repetition factor
    const words = text.split(/\s+/).filter(w => w.length > 3);
    const wordCounts = new Map<string, number>();
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
    const repeatedWords = [...wordCounts.values()].filter(c => c > 3).length;
    const repetitionScore = Math.min(100, repeatedWords * 10);
    if (repetitionScore > 0) {
      factors.push({
        name: 'Content Repetition',
        contribution: repetitionScore,
        evidence: `${repeatedWords} words repeated more than 3 times`,
        optimizable: true,
      });
      totalScore += repetitionScore * 0.3;
    }

    // Formatting issues (simplified - would need HTML/structure analysis for full implementation)
    // For now, check for inconsistent punctuation, excessive parentheses, etc.
    const parenthesesCount = (text.match(/\(/g) || []).length;
    const formattingScore = Math.min(100, parenthesesCount * 5);
    if (formattingScore > 20) {
      factors.push({
        name: 'Formatting Complexity',
        contribution: formattingScore,
        evidence: `${parenthesesCount} parenthetical expressions`,
        optimizable: true,
      });
      totalScore += formattingScore * 0.2;
    }

    // Reduce score based on clarity indicators
    const clarityBonus = lowMatches * 5;
    totalScore = Math.max(0, totalScore - clarityBonus);

    return {
      type: 'extraneous',
      score: Math.min(100, totalScore),
      factors,
      confidence: 0.70,
    };
  }

  /**
   * Measure germane cognitive load
   */
  private measureGermaneLoad(text: string): CognitiveLoadMeasurement {
    const factors: CognitiveLoadFactor[] = [];
    let totalScore = 0;

    // Check germane indicators
    const highMatches = this.countIndicators(text, GERMANE_LOAD_INDICATORS.high);
    const moderateMatches = this.countIndicators(text, GERMANE_LOAD_INDICATORS.moderate);
    const lowMatches = this.countIndicators(text, GERMANE_LOAD_INDICATORS.low);

    // High germane = good (schema building activities)
    const germaneScore = this.calculateIndicatorScore(highMatches, moderateMatches, lowMatches);
    if (highMatches > 0 || moderateMatches > 0) {
      factors.push({
        name: 'Schema Building Activities',
        contribution: germaneScore,
        evidence: `${highMatches} high, ${moderateMatches} moderate germane indicators`,
        optimizable: false,
      });
      totalScore += germaneScore * 0.5;
    }

    // Question presence (promotes elaboration)
    const questionCount = (text.match(/\?/g) || []).length;
    const questionScore = Math.min(100, questionCount * 15);
    if (questionScore > 0) {
      factors.push({
        name: 'Questioning Prompts',
        contribution: questionScore,
        evidence: `${questionCount} questions present`,
        optimizable: false,
      });
      totalScore += questionScore * 0.25;
    }

    // Example presence (supports schema building)
    const exampleIndicators = ['example', 'for instance', 'such as', 'e.g.', 'consider'];
    const exampleCount = exampleIndicators.reduce(
      (count, indicator) => count + (text.match(new RegExp(indicator, 'gi')) || []).length,
      0
    );
    const exampleScore = Math.min(100, exampleCount * 20);
    if (exampleScore > 0) {
      factors.push({
        name: 'Concrete Examples',
        contribution: exampleScore,
        evidence: `${exampleCount} examples provided`,
        optimizable: false,
      });
      totalScore += exampleScore * 0.25;
    }

    return {
      type: 'germane',
      score: Math.min(100, totalScore),
      factors,
      confidence: 0.75,
    };
  }

  /**
   * Count indicator matches in text
   */
  private countIndicators(text: string, indicators: string[]): number {
    let count = 0;
    for (const indicator of indicators) {
      const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        count += matches.length;
      }
    }
    return count;
  }

  /**
   * Calculate score based on indicator matches
   */
  private calculateIndicatorScore(high: number, moderate: number, low: number): number {
    // High indicators contribute more than moderate, which contribute more than low
    const score = (high * 15) + (moderate * 8) + (low * 3);
    return Math.min(100, score);
  }

  /**
   * Calculate total cognitive load
   */
  private calculateTotalLoad(
    intrinsic: CognitiveLoadMeasurement,
    extraneous: CognitiveLoadMeasurement,
    germane: CognitiveLoadMeasurement
  ): number {
    // Total load formula:
    // - Intrinsic is necessary but limited by working memory
    // - Extraneous should be minimized (adds to total burden)
    // - Germane is productive but still uses cognitive resources
    // Note: High germane with low extraneous is ideal

    // Weight: Extraneous is most problematic, intrinsic is necessary
    const weightedLoad = (
      intrinsic.score * 0.35 +
      extraneous.score * 0.45 +  // Extraneous gets higher weight as it's wasteful
      germane.score * 0.20       // Germane is productive so weighted lower
    );

    return Math.round(weightedLoad);
  }

  /**
   * Categorize total load
   */
  private categorizeLoad(totalLoad: number): 'low' | 'moderate' | 'high' | 'overload' {
    if (totalLoad <= 30) return 'low';
    if (totalLoad <= 55) return 'moderate';
    if (totalLoad <= 75) return 'high';
    return 'overload';
  }

  /**
   * Assess cognitive load balance
   */
  private assessBalance(
    intrinsic: CognitiveLoadMeasurement,
    extraneous: CognitiveLoadMeasurement,
    germane: CognitiveLoadMeasurement
  ): CognitiveLoadBalance {
    const extraneousMinimized = extraneous.score <= 30;
    const germaneMaximized = germane.score >= 50;
    const intrinsicAppropriate = intrinsic.score >= 30 && intrinsic.score <= 70;

    let status: 'optimal' | 'suboptimal' | 'problematic';
    let score: number;

    if (extraneousMinimized && germaneMaximized && intrinsicAppropriate) {
      status = 'optimal';
      score = 90 + (germane.score - 50) * 0.2;
    } else if (extraneous.score >= 60 || (germane.score < 30 && intrinsic.score < 30)) {
      status = 'problematic';
      score = 30 - (extraneous.score - 60) * 0.5;
    } else {
      status = 'suboptimal';
      score = 60;
      if (extraneousMinimized) score += 10;
      if (germaneMaximized) score += 10;
      if (intrinsicAppropriate) score += 10;
    }

    return {
      status,
      extraneousMinimized,
      germaneMaximized,
      intrinsicAppropriate,
      score: Math.min(100, Math.max(0, score)),
    };
  }

  /**
   * Generate recommendations for optimizing cognitive load
   */
  private generateRecommendations(
    intrinsic: CognitiveLoadMeasurement,
    extraneous: CognitiveLoadMeasurement,
    germane: CognitiveLoadMeasurement,
    balance: CognitiveLoadBalance
  ): CognitiveLoadRecommendation[] {
    const recommendations: CognitiveLoadRecommendation[] = [];

    // High extraneous load recommendations
    if (extraneous.score > 40) {
      recommendations.push({
        targetType: 'extraneous',
        action: 'Reduce extraneous cognitive load',
        expectedImprovement: `Could reduce total load by ${Math.round(extraneous.score * 0.3)}%`,
        priority: 1,
        techniques: [
          'Simplify presentation and remove unnecessary elements',
          'Use consistent formatting throughout',
          'Eliminate redundant information',
          'Improve content organization and flow',
        ],
      });
    }

    // Low germane load recommendations
    if (germane.score < 40) {
      recommendations.push({
        targetType: 'germane',
        action: 'Increase schema-building activities',
        expectedImprovement: 'Enhance learning effectiveness and retention',
        priority: 2,
        techniques: [
          'Add more practice problems and exercises',
          'Include self-explanation prompts',
          'Provide worked examples with annotations',
          'Add reflection questions',
          'Connect new concepts to prior knowledge',
        ],
      });
    }

    // High intrinsic load recommendations
    if (intrinsic.score > 70) {
      recommendations.push({
        targetType: 'intrinsic',
        action: 'Manage intrinsic complexity',
        expectedImprovement: 'Make content more accessible without losing depth',
        priority: 2,
        techniques: [
          'Break complex concepts into smaller chunks',
          'Provide scaffolding for difficult sections',
          'Use analogies and concrete examples',
          'Consider prerequisite knowledge requirements',
        ],
      });
    }

    // Balance-specific recommendations
    if (!balance.germaneMaximized && balance.extraneousMinimized) {
      recommendations.push({
        targetType: 'germane',
        action: 'Redirect saved cognitive capacity to learning',
        expectedImprovement: 'Use available cognitive resources productively',
        priority: 3,
        techniques: [
          'Add higher-order thinking questions',
          'Include application scenarios',
          'Encourage elaboration and connection-making',
        ],
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Assess compatibility with Bloom's taxonomy levels
   */
  private assessBloomsCompatibility(
    totalLoad: number,
    targetLevel?: BloomsLevel
  ): BloomsCompatibility {
    // Calculate remaining cognitive capacity
    const remainingCapacity = Math.max(0, 100 - totalLoad);

    // Find maximum recommended Bloom's level based on remaining capacity
    let maxLevel: BloomsLevel = 'REMEMBER';
    const levels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

    for (const level of levels) {
      if (remainingCapacity >= BLOOMS_COGNITIVE_REQUIREMENTS[level]) {
        maxLevel = level;
      }
    }

    // Check if target level is supported
    const supportsTargetLevel = targetLevel
      ? remainingCapacity >= BLOOMS_COGNITIVE_REQUIREMENTS[targetLevel]
      : true;

    const adjustments: string[] = [];
    if (targetLevel && !supportsTargetLevel) {
      const required = BLOOMS_COGNITIVE_REQUIREMENTS[targetLevel];
      const deficit = required - remainingCapacity;
      adjustments.push(
        `Reduce cognitive load by ${deficit}% to support ${targetLevel} level activities`
      );
      adjustments.push(
        `Consider simplifying content or reducing extraneous load`
      );
    }

    return {
      maxRecommendedLevel: maxLevel,
      supportsTargetLevel,
      remainingCapacity,
      adjustments: adjustments.length > 0 ? adjustments : undefined,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a cognitive load analyzer instance
 */
export function createCognitiveLoadAnalyzer(): CognitiveLoadAnalyzer {
  return new CognitiveLoadAnalyzer();
}
