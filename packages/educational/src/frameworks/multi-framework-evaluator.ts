/**
 * Multi-Framework Evaluator
 * Enhanced Depth Analysis - January 2026
 *
 * Evaluates content using multiple taxonomy frameworks:
 * - Bloom's Taxonomy, Webb's DOK, SOLO, Fink, Marzano
 * - Cross-framework mapping and alignment
 * - Course-type weighted distributions
 */

import type { BloomsLevel } from '@sam-ai/core';
import type { CourseType, BloomsDistribution, WebbDOKDistribution } from '../types/depth-analysis.types';
import type {
  FrameworkType,
  MultiFrameworkEvaluatorOptions,
  MultiFrameworkResult,
  FrameworkAnalysis,
  FrameworkRecommendation,
  ContentForMultiFrameworkAnalysis,
  AnalyzableContent,
  FrameworkDistribution,
  FrameworkWeights,
  LevelAnalysisDetail,
  TaxonomyLevel,
  FrameworkLogger,
} from './types';
import {
  FRAMEWORKS,
  COURSE_TYPE_FRAMEWORK_WEIGHTS,
  getFramework,
  getIdealDistribution,
  getFrameworkLevel,
} from './framework-definitions';

const EVALUATOR_VERSION = '1.0.0';

// ═══════════════════════════════════════════════════════════════
// DEFAULT OPTIONS
// ═══════════════════════════════════════════════════════════════

const DEFAULT_OPTIONS: Required<Omit<MultiFrameworkEvaluatorOptions, 'logger' | 'courseTypeWeights'>> = {
  frameworks: ['blooms', 'dok'],
  primaryFramework: 'blooms',
  minConfidence: 0.5,
};

// ═══════════════════════════════════════════════════════════════
// KEYWORD PATTERNS BY FRAMEWORK
// ═══════════════════════════════════════════════════════════════

const FRAMEWORK_KEYWORDS: Record<FrameworkType, Record<string, string[]>> = {
  blooms: {
    REMEMBER: ['recall', 'identify', 'recognize', 'list', 'name', 'define', 'match', 'memorize'],
    UNDERSTAND: ['explain', 'summarize', 'interpret', 'classify', 'compare', 'infer', 'paraphrase'],
    APPLY: ['apply', 'implement', 'execute', 'use', 'demonstrate', 'solve', 'compute'],
    ANALYZE: ['analyze', 'differentiate', 'organize', 'attribute', 'examine', 'investigate'],
    EVALUATE: ['evaluate', 'judge', 'critique', 'assess', 'argue', 'defend', 'justify'],
    CREATE: ['create', 'design', 'develop', 'produce', 'construct', 'generate', 'compose'],
  },
  dok: {
    '1': ['recall', 'identify', 'recognize', 'list', 'name', 'define', 'match'],
    '2': ['summarize', 'interpret', 'classify', 'compare', 'organize', 'estimate'],
    '3': ['analyze', 'investigate', 'formulate', 'differentiate', 'conclude', 'critique'],
    '4': ['design', 'create', 'synthesize', 'connect', 'prove', 'research'],
  },
  solo: {
    prestructural: ['miss', 'irrelevant', 'confused'],
    unistructural: ['identify', 'name', 'follow'],
    multistructural: ['describe', 'list', 'enumerate', 'combine'],
    relational: ['compare', 'contrast', 'explain causes', 'analyze', 'relate'],
    extended_abstract: ['generalize', 'hypothesize', 'theorize', 'create', 'reflect'],
  },
  fink: {
    foundational_knowledge: ['understand', 'remember', 'know', 'information'],
    application: ['apply', 'use', 'skills', 'practical', 'manage'],
    integration: ['connect', 'relate', 'integrate', 'interdisciplinary'],
    human_dimension: ['self', 'others', 'interact', 'collaborate'],
    caring: ['care', 'value', 'interest', 'motivation'],
    learning_how_to_learn: ['metacognition', 'self-directed', 'inquiry', 'autonomous'],
  },
  marzano: {
    retrieval: ['recall', 'recognize', 'execute', 'retrieve'],
    comprehension: ['integrate', 'symbolize', 'translate', 'represent'],
    analysis: ['match', 'classify', 'error analysis', 'generalize'],
    knowledge_utilization: ['decide', 'problem solve', 'experiment', 'investigate'],
    metacognition: ['goals', 'monitor', 'clarity', 'accuracy'],
    self_system: ['importance', 'efficacy', 'emotional', 'motivation'],
  },
};

// ═══════════════════════════════════════════════════════════════
// MULTI-FRAMEWORK EVALUATOR
// ═══════════════════════════════════════════════════════════════

export class MultiFrameworkEvaluator {
  private options: Required<Omit<MultiFrameworkEvaluatorOptions, 'logger' | 'courseTypeWeights'>>;
  private courseTypeWeights: Record<CourseType, FrameworkWeights>;
  private logger: FrameworkLogger | undefined;

  constructor(options: MultiFrameworkEvaluatorOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    this.courseTypeWeights = options.courseTypeWeights || COURSE_TYPE_FRAMEWORK_WEIGHTS;
    this.logger = options.logger;
  }

  /**
   * Evaluate content using multiple frameworks
   */
  async evaluate(content: ContentForMultiFrameworkAnalysis): Promise<MultiFrameworkResult> {
    this.logger?.info(`Starting multi-framework evaluation for course: ${content.courseId}`);

    const startTime = Date.now();
    const courseType = content.courseType || this.detectCourseType(content);

    // Get framework weights for this course type
    const weights = this.courseTypeWeights[courseType];

    // Analyze with each framework
    const frameworkAnalyses: FrameworkAnalysis[] = [];

    for (const frameworkType of this.options.frameworks) {
      const analysis = await this.analyzeWithFramework(
        content.content,
        frameworkType,
        courseType,
        content.existingBloomsAnalysis,
        content.existingDOKAnalysis
      );
      frameworkAnalyses.push(analysis);
    }

    // Separate primary and secondary analyses
    const primaryAnalysis = frameworkAnalyses.find(
      (a) => a.framework === this.options.primaryFramework
    ) || frameworkAnalyses[0];

    const secondaryAnalyses = frameworkAnalyses.filter(
      (a) => a.framework !== primaryAnalysis.framework
    );

    // Calculate cross-framework alignment
    const crossFrameworkAlignment = this.calculateCrossFrameworkAlignment(frameworkAnalyses);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      frameworkAnalyses,
      courseType,
      crossFrameworkAlignment
    );

    // Calculate composite score
    const compositeScore = this.calculateCompositeScore(frameworkAnalyses, weights);

    const durationMs = Date.now() - startTime;
    this.logger?.info(`Multi-framework evaluation completed in ${durationMs}ms`);

    return {
      primary: primaryAnalysis,
      secondary: secondaryAnalyses,
      crossFrameworkAlignment,
      recommendations,
      compositeScore,
      compositeMethod: 'weighted_average',
      courseType,
      metadata: {
        analysisVersion: EVALUATOR_VERSION,
        analyzedAt: new Date(),
        frameworksUsed: this.options.frameworks,
        totalContentAnalyzed: content.content.length,
      },
    };
  }

  /**
   * Analyze content with a specific framework
   */
  private async analyzeWithFramework(
    content: AnalyzableContent[],
    frameworkType: FrameworkType,
    courseType: CourseType,
    existingBlooms?: { distribution: BloomsDistribution; dominantLevel: BloomsLevel },
    existingDOK?: { distribution: WebbDOKDistribution; dominantLevel: number }
  ): Promise<FrameworkAnalysis> {
    const framework = getFramework(frameworkType);
    const keywords = FRAMEWORK_KEYWORDS[frameworkType];

    // If we have existing analysis for this framework, use it
    if (frameworkType === 'blooms' && existingBlooms) {
      return this.buildAnalysisFromExisting(
        frameworkType,
        existingBlooms.distribution as Record<string, number>,
        existingBlooms.dominantLevel,
        courseType
      );
    }

    if (frameworkType === 'dok' && existingDOK) {
      const dokDist: Record<string, number> = {
        '1': existingDOK.distribution.level1,
        '2': existingDOK.distribution.level2,
        '3': existingDOK.distribution.level3,
        '4': existingDOK.distribution.level4,
      };
      return this.buildAnalysisFromExisting(
        frameworkType,
        dokDist,
        existingDOK.dominantLevel.toString(),
        courseType
      );
    }

    // Analyze content
    const distribution: Record<string, number> = {};
    for (const level of framework.levels) {
      distribution[level.id] = 0;
    }

    let totalMatches = 0;

    for (const item of content) {
      const normalizedText = item.text.toLowerCase();

      // Count keyword matches for each level
      for (const level of framework.levels) {
        const levelKeywords = keywords[level.id] || [];
        for (const keyword of levelKeywords) {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = normalizedText.match(regex);
          if (matches) {
            distribution[level.id] += matches.length;
            totalMatches += matches.length;
          }
        }
      }
    }

    // Normalize to percentages
    if (totalMatches > 0) {
      for (const level of Object.keys(distribution)) {
        distribution[level] = Math.round((distribution[level] / totalMatches) * 100);
      }
    } else {
      // If no matches, use a default distribution
      const levelCount = framework.levels.length;
      for (const level of Object.keys(distribution)) {
        distribution[level] = Math.round(100 / levelCount);
      }
    }

    // Find dominant level
    let dominantLevel = framework.levels[0].id;
    let maxValue = 0;
    for (const [level, value] of Object.entries(distribution)) {
      if (value > maxValue) {
        maxValue = value;
        dominantLevel = level;
      }
    }

    return this.buildAnalysisFromExisting(frameworkType, distribution, dominantLevel, courseType);
  }

  /**
   * Build analysis from existing or computed distribution
   */
  private buildAnalysisFromExisting(
    frameworkType: FrameworkType,
    distribution: Record<string, number>,
    dominantLevel: string,
    courseType: CourseType
  ): FrameworkAnalysis {
    const idealDist = getIdealDistribution(frameworkType, courseType) || {};

    // Calculate balance score
    const balanceScore = this.calculateBalanceScore(distribution);

    // Calculate alignment with ideal
    const alignmentWithIdeal = this.calculateAlignmentWithIdeal(distribution, idealDist);

    // Calculate confidence
    const confidence = this.calculateConfidence(distribution);

    // Build level analysis
    const levelAnalysis = this.buildLevelAnalysis(distribution, idealDist);

    return {
      framework: frameworkType,
      distribution,
      dominantLevel,
      balanceScore,
      alignmentWithIdeal,
      confidence,
      levelAnalysis,
    };
  }

  /**
   * Calculate balance score (how evenly distributed)
   */
  private calculateBalanceScore(distribution: Record<string, number>): number {
    const values = Object.values(distribution);
    if (values.length === 0) return 0;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Lower std dev = more balanced = higher score
    // Max theoretical std dev for percentages is ~50
    const maxStdDev = 50;
    const balanceScore = Math.max(0, 1 - stdDev / maxStdDev);

    return Math.round(balanceScore * 100) / 100;
  }

  /**
   * Calculate alignment with ideal distribution
   */
  private calculateAlignmentWithIdeal(
    actual: Record<string, number>,
    ideal: Record<string, number>
  ): number {
    const levels = Object.keys(actual);
    if (levels.length === 0) return 0;

    let totalDeviation = 0;
    for (const level of levels) {
      const actualValue = actual[level] || 0;
      const idealValue = ideal[level] || 0;
      totalDeviation += Math.abs(actualValue - idealValue);
    }

    // Max deviation would be 200 (all at one level vs all at another)
    const maxDeviation = 200;
    const alignment = 1 - totalDeviation / maxDeviation;

    return Math.round(Math.max(0, Math.min(1, alignment)) * 100);
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(distribution: Record<string, number>): number {
    const values = Object.values(distribution);
    const total = values.reduce((a, b) => a + b, 0);

    // Confidence based on whether distribution sums to ~100
    // and has reasonable spread
    if (total < 90 || total > 110) {
      return 0.5; // Suspicious distribution
    }

    // Check for reasonable spread (not all at one level)
    const nonZeroCount = values.filter((v) => v > 5).length;
    const spreadFactor = Math.min(1, nonZeroCount / 3);

    return Math.round(0.7 + spreadFactor * 0.3);
  }

  /**
   * Build level analysis with deviations and recommendations
   */
  private buildLevelAnalysis(
    actual: Record<string, number>,
    ideal: Record<string, number>
  ): LevelAnalysisDetail[] {
    return Object.entries(actual).map(([level, percentage]) => {
      const idealValue = ideal[level] || 0;
      const deviation = percentage - idealValue;

      let status: 'under' | 'on-target' | 'over';
      if (Math.abs(deviation) <= 5) {
        status = 'on-target';
      } else if (deviation < 0) {
        status = 'under';
      } else {
        status = 'over';
      }

      let recommendation: string | undefined;
      if (status === 'under' && Math.abs(deviation) > 10) {
        recommendation = `Consider adding more ${level}-level content`;
      } else if (status === 'over' && deviation > 15) {
        recommendation = `Content may be too heavily weighted toward ${level}`;
      }

      return {
        level,
        percentage,
        deviation,
        status,
        recommendation,
      };
    });
  }

  /**
   * Calculate cross-framework alignment
   */
  private calculateCrossFrameworkAlignment(analyses: FrameworkAnalysis[]): number {
    if (analyses.length < 2) return 100;

    // Compare each pair of frameworks using their mappings
    let totalAgreement = 0;
    let comparisons = 0;

    for (let i = 0; i < analyses.length; i++) {
      for (let j = i + 1; j < analyses.length; j++) {
        const agreement = this.compareFrameworkAnalyses(analyses[i], analyses[j]);
        totalAgreement += agreement;
        comparisons++;
      }
    }

    return comparisons > 0 ? Math.round(totalAgreement / comparisons) : 100;
  }

  /**
   * Compare two framework analyses
   */
  private compareFrameworkAnalyses(a: FrameworkAnalysis, b: FrameworkAnalysis): number {
    // Convert both to cognitive complexity scores (1-6 scale)
    const scoreA = this.getComplexityScore(a);
    const scoreB = this.getComplexityScore(b);

    // Calculate agreement based on how close the scores are
    const diff = Math.abs(scoreA - scoreB);
    const maxDiff = 5; // Max possible difference

    return Math.round((1 - diff / maxDiff) * 100);
  }

  /**
   * Get average cognitive complexity score for an analysis
   */
  private getComplexityScore(analysis: FrameworkAnalysis): number {
    const framework = getFramework(analysis.framework);
    let weightedSum = 0;
    let totalPercentage = 0;

    for (const [levelId, percentage] of Object.entries(analysis.distribution)) {
      const level = framework.levels.find((l) => l.id === levelId);
      if (level) {
        weightedSum += level.weight * percentage;
        totalPercentage += percentage;
      }
    }

    return totalPercentage > 0 ? weightedSum / totalPercentage : 3; // Default to middle
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    analyses: FrameworkAnalysis[],
    courseType: CourseType,
    crossAlignment: number
  ): FrameworkRecommendation[] {
    const recommendations: FrameworkRecommendation[] = [];

    for (const analysis of analyses) {
      const framework = getFramework(analysis.framework);

      // Check alignment with ideal
      if (analysis.alignmentWithIdeal < 60) {
        recommendations.push({
          framework: analysis.framework,
          type: 'rebalance',
          priority: 'high',
          description: `${framework.name} distribution is misaligned with ideal for ${courseType} courses`,
          actionItems: analysis.levelAnalysis
            ?.filter((la) => la.status !== 'on-target' && la.recommendation)
            .map((la) => la.recommendation!)
            .slice(0, 3),
        });
      }

      // Check for overly dominant levels
      for (const [level, percentage] of Object.entries(analysis.distribution)) {
        if (percentage > 50) {
          recommendations.push({
            framework: analysis.framework,
            type: 'reduce_content',
            priority: 'medium',
            level,
            description: `${level} level is over-represented (${percentage}%) in ${framework.name}`,
            actionItems: ['Consider diversifying cognitive levels in content'],
          });
        }

        // Check for missing levels
        const idealDist = getIdealDistribution(analysis.framework, courseType);
        const idealValue = idealDist?.[level] || 0;
        if (percentage < 5 && idealValue >= 15) {
          recommendations.push({
            framework: analysis.framework,
            type: 'add_content',
            priority: 'medium',
            level,
            description: `${level} level is under-represented in ${framework.name}`,
            actionItems: [`Add content targeting ${level} cognitive processes`],
          });
        }
      }
    }

    // Cross-framework alignment issues
    if (crossAlignment < 70) {
      recommendations.push({
        framework: 'blooms' as FrameworkType, // Generic recommendation
        type: 'rebalance',
        priority: 'medium',
        description: 'Framework analyses show inconsistent cognitive level indicators',
        actionItems: [
          'Review content for clearer cognitive level targeting',
          'Ensure objectives, content, and assessments are aligned',
        ],
      });
    }

    // Sort by priority
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations.slice(0, 10); // Limit to top 10
  }

  /**
   * Calculate composite score using weighted average
   */
  private calculateCompositeScore(
    analyses: FrameworkAnalysis[],
    weights: FrameworkWeights
  ): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const analysis of analyses) {
      const weight = weights[analysis.framework as keyof FrameworkWeights] || 0;
      if (weight > 0) {
        // Use alignment with ideal as the score for each framework
        weightedSum += analysis.alignmentWithIdeal * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  /**
   * Detect course type from content
   */
  private detectCourseType(content: ContentForMultiFrameworkAnalysis): CourseType {
    // Simple heuristic based on content analysis
    const allText = content.content.map((c) => c.text).join(' ').toLowerCase();

    const patterns: Record<CourseType, string[]> = {
      foundational: ['introduction', 'basics', 'fundamental', 'beginner', 'overview'],
      intermediate: ['apply', 'practice', 'hands-on', 'implement', 'develop'],
      advanced: ['advanced', 'complex', 'expert', 'specialized', 'research'],
      professional: ['professional', 'career', 'industry', 'workplace', 'leadership'],
      creative: ['create', 'design', 'innovate', 'creative', 'art', 'compose'],
      technical: ['technical', 'programming', 'engineering', 'systems', 'architecture'],
      theoretical: ['theory', 'theoretical', 'conceptual', 'philosophical', 'abstract'],
    };

    const scores: Record<CourseType, number> = {
      foundational: 0,
      intermediate: 0,
      advanced: 0,
      professional: 0,
      creative: 0,
      technical: 0,
      theoretical: 0,
    };

    for (const [type, keywords] of Object.entries(patterns)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = allText.match(regex);
        if (matches) {
          scores[type as CourseType] += matches.length;
        }
      }
    }

    // Find type with highest score
    let maxType: CourseType = 'intermediate';
    let maxScore = 0;

    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxType = type as CourseType;
      }
    }

    return maxType;
  }

  /**
   * Map a level from one framework to another
   */
  mapToFramework(
    fromFramework: FrameworkType,
    toFramework: FrameworkType,
    level: string
  ): string | string[] {
    const framework = getFramework(fromFramework);
    const mapping = framework.mappings.find((m) => m.fromLevel === level);

    if (mapping && toFramework === 'blooms') {
      return mapping.toLevel;
    }

    // If no direct mapping, return the original level
    return level;
  }
}

// ═══════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Create a multi-framework evaluator instance
 */
export function createMultiFrameworkEvaluator(
  options?: MultiFrameworkEvaluatorOptions
): MultiFrameworkEvaluator {
  return new MultiFrameworkEvaluator(options);
}

export { EVALUATOR_VERSION };
