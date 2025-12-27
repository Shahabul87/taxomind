/**
 * Bloom's Aligner Evaluator
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Evaluates content alignment with Bloom's Taxonomy cognitive levels
 */

import type {
  PedagogicalContent,
  StudentCognitiveProfile,
  BloomsAlignerResult,
  BloomsLevel,
  BloomsDistribution,
  VerbAnalysis,
  ActivityAnalysis,
  PedagogicalIssue,
  PedagogicalEvaluator,
} from './types';
import { BLOOMS_LEVEL_ORDER, getBloomsLevelIndex } from './types';

// ============================================================================
// BLOOM'S VERB TAXONOMY
// ============================================================================

/**
 * Cognitive verbs associated with each Bloom's level
 */
export const BLOOMS_VERBS: Record<BloomsLevel, string[]> = {
  REMEMBER: [
    'list',
    'define',
    'identify',
    'recall',
    'name',
    'state',
    'describe',
    'recognize',
    'label',
    'match',
    'reproduce',
    'memorize',
    'repeat',
    'outline',
    'select',
    'tell',
    'locate',
    'find',
    'know',
    'remember',
  ],
  UNDERSTAND: [
    'explain',
    'summarize',
    'interpret',
    'classify',
    'compare',
    'contrast',
    'discuss',
    'distinguish',
    'illustrate',
    'paraphrase',
    'predict',
    'relate',
    'translate',
    'understand',
    'clarify',
    'infer',
    'generalize',
    'express',
    'review',
    'restate',
  ],
  APPLY: [
    'apply',
    'demonstrate',
    'solve',
    'use',
    'calculate',
    'complete',
    'construct',
    'execute',
    'implement',
    'modify',
    'operate',
    'practice',
    'schedule',
    'show',
    'utilize',
    'experiment',
    'compute',
    'illustrate',
    'produce',
    'employ',
  ],
  ANALYZE: [
    'analyze',
    'break down',
    'categorize',
    'compare',
    'contrast',
    'differentiate',
    'discriminate',
    'examine',
    'investigate',
    'organize',
    'question',
    'separate',
    'test',
    'deconstruct',
    'dissect',
    'inspect',
    'probe',
    'survey',
    'detect',
    'deduce',
  ],
  EVALUATE: [
    'evaluate',
    'assess',
    'critique',
    'defend',
    'judge',
    'justify',
    'prioritize',
    'rate',
    'recommend',
    'support',
    'value',
    'appraise',
    'argue',
    'decide',
    'determine',
    'estimate',
    'measure',
    'rank',
    'score',
    'validate',
  ],
  CREATE: [
    'create',
    'design',
    'develop',
    'formulate',
    'generate',
    'invent',
    'plan',
    'produce',
    'compose',
    'construct',
    'devise',
    'hypothesize',
    'imagine',
    'originate',
    'propose',
    'synthesize',
    'assemble',
    'build',
    'combine',
    'innovate',
  ],
};

/**
 * Activity types associated with each Bloom's level
 */
export const BLOOMS_ACTIVITIES: Record<BloomsLevel, string[]> = {
  REMEMBER: [
    'flashcard',
    'quiz recall',
    'matching exercise',
    'fill in the blank',
    'multiple choice recognition',
    'listing',
    'labeling diagram',
    'timeline ordering',
  ],
  UNDERSTAND: [
    'summary writing',
    'concept mapping',
    'explaining in own words',
    'classification exercise',
    'comparison chart',
    'paraphrasing',
    'example finding',
    'analogy making',
  ],
  APPLY: [
    'problem solving',
    'simulation',
    'hands-on exercise',
    'practical demonstration',
    'case study application',
    'role play',
    'experiment',
    'coding exercise',
  ],
  ANALYZE: [
    'case study analysis',
    'data interpretation',
    'pattern recognition',
    'cause and effect analysis',
    'comparative analysis',
    'error analysis',
    'systems analysis',
    'root cause analysis',
  ],
  EVALUATE: [
    'peer review',
    'critique writing',
    'debate',
    'rubric assessment',
    'decision making exercise',
    'priority ranking',
    'pro/con analysis',
    'recommendation writing',
  ],
  CREATE: [
    'project creation',
    'original design',
    'creative writing',
    'research proposal',
    'prototype building',
    'solution development',
    'hypothesis formulation',
    'innovation challenge',
  ],
};

// ============================================================================
// BLOOM'S ALIGNER IMPLEMENTATION
// ============================================================================

/**
 * Configuration for Bloom's Aligner
 */
export interface BloomsAlignerConfig {
  /**
   * Minimum percentage for a level to be considered significant
   */
  significanceThreshold?: number;

  /**
   * Acceptable variance from target level (0-5)
   */
  acceptableVariance?: number;

  /**
   * Weight for verb analysis (0-1)
   */
  verbWeight?: number;

  /**
   * Weight for activity analysis (0-1)
   */
  activityWeight?: number;

  /**
   * Minimum score to pass
   */
  passingScore?: number;
}

/**
 * Default configuration
 */
export const DEFAULT_BLOOMS_ALIGNER_CONFIG: Required<BloomsAlignerConfig> = {
  significanceThreshold: 10,
  acceptableVariance: 1,
  verbWeight: 0.6,
  activityWeight: 0.4,
  passingScore: 70,
};

/**
 * Bloom's Aligner Evaluator
 * Analyzes content for Bloom's Taxonomy level alignment
 */
export class BloomsAligner
  implements PedagogicalEvaluator<BloomsAlignerResult>
{
  readonly name = 'BloomsAligner';
  readonly description =
    "Evaluates content alignment with Bloom's Taxonomy cognitive levels";

  private readonly config: Required<BloomsAlignerConfig>;

  constructor(config: BloomsAlignerConfig = {}) {
    this.config = { ...DEFAULT_BLOOMS_ALIGNER_CONFIG, ...config };
  }

  /**
   * Evaluate content for Bloom's alignment
   */
  async evaluate(
    content: PedagogicalContent,
    _studentProfile?: StudentCognitiveProfile
  ): Promise<BloomsAlignerResult> {
    const startTime = Date.now();

    // Get target level (default to UNDERSTAND if not specified)
    const targetLevel = content.targetBloomsLevel ?? 'UNDERSTAND';

    // Analyze verbs in content
    const verbAnalysis = this.analyzeVerbs(content.content);

    // Analyze activities in content
    const activityAnalysis = this.analyzeActivities(content.content);

    // Calculate distribution from both analyses
    const detectedDistribution = this.calculateDistribution(
      verbAnalysis,
      activityAnalysis
    );

    // Determine dominant level
    const dominantLevel = this.findDominantLevel(detectedDistribution);

    // Calculate alignment
    const levelDistance =
      getBloomsLevelIndex(dominantLevel) - getBloomsLevelIndex(targetLevel);
    const alignmentStatus = this.determineAlignmentStatus(
      dominantLevel,
      targetLevel,
      levelDistance
    );

    // Calculate score
    const score = this.calculateScore(
      detectedDistribution,
      targetLevel,
      alignmentStatus
    );

    // Determine issues and recommendations
    const { issues, recommendations } = this.analyzeIssuesAndRecommendations(
      alignmentStatus,
      targetLevel,
      dominantLevel,
      detectedDistribution,
      verbAnalysis,
      activityAnalysis
    );

    // Determine if passed
    const passed =
      score >= this.config.passingScore &&
      (alignmentStatus === 'aligned' ||
        Math.abs(levelDistance) <= this.config.acceptableVariance);

    return {
      evaluatorName: 'BloomsAligner',
      passed,
      score,
      confidence: this.calculateConfidence(verbAnalysis, activityAnalysis),
      issues,
      recommendations,
      processingTimeMs: Date.now() - startTime,
      analysis: {
        targetLevel,
        dominantLevel,
        alignmentStatus,
        levelDistance,
        verbCount: verbAnalysis.totalVerbs,
        activityCount: activityAnalysis.activityTypes.length,
      },
      detectedDistribution,
      dominantLevel,
      targetLevel,
      alignmentStatus,
      levelDistance,
      verbAnalysis,
      activityAnalysis,
    };
  }

  /**
   * Analyze cognitive verbs in content
   */
  private analyzeVerbs(content: string): VerbAnalysis {
    const lowerContent = content.toLowerCase();
    const verbsByLevel: Record<BloomsLevel, string[]> = {
      REMEMBER: [],
      UNDERSTAND: [],
      APPLY: [],
      ANALYZE: [],
      EVALUATE: [],
      CREATE: [],
    };

    let totalVerbs = 0;

    // Check each level's verbs
    for (const level of BLOOMS_LEVEL_ORDER) {
      for (const verb of BLOOMS_VERBS[level]) {
        // Use word boundary matching
        const regex = new RegExp(`\\b${verb}\\b`, 'gi');
        const matches = lowerContent.match(regex);
        if (matches) {
          verbsByLevel[level].push(
            ...Array(matches.length).fill(verb) as string[]
          );
          totalVerbs += matches.length;
        }
      }
    }

    // Find dominant category
    const dominantCategory = this.findDominantLevel(
      this.verbsToDistribution(verbsByLevel, totalVerbs)
    );

    return {
      verbsByLevel,
      totalVerbs,
      dominantCategory,
    };
  }

  /**
   * Analyze learning activities in content
   */
  private analyzeActivities(content: string): ActivityAnalysis {
    const lowerContent = content.toLowerCase();
    const activityTypes: string[] = [];
    const activitiesByLevel: Record<BloomsLevel, string[]> = {
      REMEMBER: [],
      UNDERSTAND: [],
      APPLY: [],
      ANALYZE: [],
      EVALUATE: [],
      CREATE: [],
    };

    // Check each level's activities
    for (const level of BLOOMS_LEVEL_ORDER) {
      for (const activity of BLOOMS_ACTIVITIES[level]) {
        if (lowerContent.includes(activity.toLowerCase())) {
          activityTypes.push(activity);
          activitiesByLevel[level].push(activity);
        }
      }
    }

    // Check for higher-order thinking activities (ANALYZE, EVALUATE, CREATE)
    const hasHigherOrderActivities =
      activitiesByLevel.ANALYZE.length > 0 ||
      activitiesByLevel.EVALUATE.length > 0 ||
      activitiesByLevel.CREATE.length > 0;

    return {
      activityTypes,
      activitiesByLevel,
      hasHigherOrderActivities,
    };
  }

  /**
   * Calculate Bloom's distribution from verb and activity analysis
   */
  private calculateDistribution(
    verbAnalysis: VerbAnalysis,
    activityAnalysis: ActivityAnalysis
  ): BloomsDistribution {
    const distribution: BloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    const totalVerbs = verbAnalysis.totalVerbs || 1;
    const totalActivities = activityAnalysis.activityTypes.length || 1;

    // Calculate weighted distribution
    for (const level of BLOOMS_LEVEL_ORDER) {
      const verbPercentage =
        (verbAnalysis.verbsByLevel[level].length / totalVerbs) * 100;
      const activityPercentage =
        (activityAnalysis.activitiesByLevel[level].length / totalActivities) *
        100;

      distribution[level] =
        this.config.verbWeight * verbPercentage +
        this.config.activityWeight * activityPercentage;
    }

    // Normalize to sum to 100
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const level of BLOOMS_LEVEL_ORDER) {
        distribution[level] = (distribution[level] / total) * 100;
      }
    } else {
      // Default to UNDERSTAND if no verbs or activities detected
      distribution.UNDERSTAND = 100;
    }

    return distribution;
  }

  /**
   * Convert verbs by level to distribution
   */
  private verbsToDistribution(
    verbsByLevel: Record<BloomsLevel, string[]>,
    totalVerbs: number
  ): BloomsDistribution {
    const distribution: BloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    if (totalVerbs === 0) {
      distribution.UNDERSTAND = 100;
      return distribution;
    }

    for (const level of BLOOMS_LEVEL_ORDER) {
      distribution[level] = (verbsByLevel[level].length / totalVerbs) * 100;
    }

    return distribution;
  }

  /**
   * Find dominant Bloom's level from distribution
   */
  private findDominantLevel(distribution: BloomsDistribution): BloomsLevel {
    let maxLevel: BloomsLevel = 'UNDERSTAND';
    let maxValue = 0;

    for (const level of BLOOMS_LEVEL_ORDER) {
      if (distribution[level] > maxValue) {
        maxValue = distribution[level];
        maxLevel = level;
      }
    }

    return maxLevel;
  }

  /**
   * Determine alignment status
   */
  private determineAlignmentStatus(
    dominantLevel: BloomsLevel,
    targetLevel: BloomsLevel,
    levelDistance: number
  ): 'aligned' | 'below_target' | 'above_target' | 'mixed' {
    if (Math.abs(levelDistance) <= this.config.acceptableVariance) {
      return 'aligned';
    }

    if (levelDistance < 0) {
      return 'below_target';
    }

    if (levelDistance > 0) {
      return 'above_target';
    }

    return 'mixed';
  }

  /**
   * Calculate alignment score
   */
  private calculateScore(
    distribution: BloomsDistribution,
    targetLevel: BloomsLevel,
    alignmentStatus: string
  ): number {
    // Base score from target level percentage
    let score = distribution[targetLevel];

    // Add adjacent levels with reduced weight
    const targetIndex = getBloomsLevelIndex(targetLevel);

    if (targetIndex > 0) {
      const lowerLevel = BLOOMS_LEVEL_ORDER[targetIndex - 1];
      score += distribution[lowerLevel] * 0.5;
    }

    if (targetIndex < BLOOMS_LEVEL_ORDER.length - 1) {
      const higherLevel = BLOOMS_LEVEL_ORDER[targetIndex + 1];
      score += distribution[higherLevel] * 0.5;
    }

    // Bonus for perfect alignment
    if (alignmentStatus === 'aligned') {
      score = Math.min(100, score * 1.1);
    }

    // Penalty for misalignment
    if (alignmentStatus === 'below_target') {
      score = score * 0.8;
    }

    if (alignmentStatus === 'above_target') {
      score = score * 0.9; // Less penalty for being above target
    }

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(
    verbAnalysis: VerbAnalysis,
    activityAnalysis: ActivityAnalysis
  ): number {
    // More verbs and activities = higher confidence
    const verbConfidence = Math.min(1, verbAnalysis.totalVerbs / 20);
    const activityConfidence = Math.min(
      1,
      activityAnalysis.activityTypes.length / 5
    );

    return (verbConfidence + activityConfidence) / 2;
  }

  /**
   * Analyze issues and generate recommendations
   */
  private analyzeIssuesAndRecommendations(
    alignmentStatus: string,
    targetLevel: BloomsLevel,
    dominantLevel: BloomsLevel,
    distribution: BloomsDistribution,
    verbAnalysis: VerbAnalysis,
    activityAnalysis: ActivityAnalysis
  ): { issues: PedagogicalIssue[]; recommendations: string[] } {
    const issues: PedagogicalIssue[] = [];
    const recommendations: string[] = [];

    // Check for misalignment
    if (alignmentStatus === 'below_target') {
      issues.push({
        type: 'cognitive_level_mismatch',
        severity: 'high',
        description: `Content is at ${dominantLevel} level but target is ${targetLevel}`,
        learningImpact:
          'Students may not develop the intended cognitive skills',
        suggestedFix: `Add more ${targetLevel} level activities and questions`,
      });

      recommendations.push(
        `Incorporate more ${targetLevel} level verbs: ${BLOOMS_VERBS[targetLevel].slice(0, 5).join(', ')}`,
        `Add ${targetLevel} level activities: ${BLOOMS_ACTIVITIES[targetLevel].slice(0, 3).join(', ')}`
      );
    }

    if (alignmentStatus === 'above_target') {
      issues.push({
        type: 'cognitive_level_mismatch',
        severity: 'medium',
        description: `Content is at ${dominantLevel} level but target is ${targetLevel}`,
        learningImpact: 'Content may be too challenging for learning stage',
        suggestedFix: `Consider adding more foundational ${targetLevel} level content`,
      });

      recommendations.push(
        `Balance higher-order activities with ${targetLevel} level exercises`,
        `Ensure prerequisite ${targetLevel} skills are addressed first`
      );
    }

    // Check for low verb diversity
    if (verbAnalysis.totalVerbs < 5) {
      issues.push({
        type: 'low_verb_diversity',
        severity: 'low',
        description: 'Content has limited cognitive action verbs',
        learningImpact: 'May lack clear learning directions',
        suggestedFix: 'Add more explicit cognitive action verbs',
      });

      recommendations.push(
        `Add more explicit cognitive verbs to guide learning activities`
      );
    }

    // Check for missing higher-order activities
    if (
      getBloomsLevelIndex(targetLevel) >= 3 &&
      !activityAnalysis.hasHigherOrderActivities
    ) {
      issues.push({
        type: 'missing_higher_order_activities',
        severity: 'medium',
        description:
          'Target requires higher-order thinking but activities are lower-level',
        learningImpact: 'Students may not develop critical thinking skills',
        suggestedFix: 'Add analysis, evaluation, or creation activities',
      });

      recommendations.push(
        `Include higher-order thinking activities such as case studies, debates, or projects`
      );
    }

    // Check for unbalanced distribution
    const significantLevels = BLOOMS_LEVEL_ORDER.filter(
      (level) => distribution[level] >= this.config.significanceThreshold
    );

    if (significantLevels.length === 1 && significantLevels[0] !== targetLevel) {
      issues.push({
        type: 'narrow_cognitive_focus',
        severity: 'low',
        description: `Content heavily focused on ${significantLevels[0]} level only`,
        learningImpact: 'May limit cognitive development range',
        suggestedFix: `Diversify activities to include more ${targetLevel} level content`,
      });
    }

    return { issues, recommendations };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a Bloom's Aligner evaluator with default config
 */
export function createBloomsAligner(
  config?: BloomsAlignerConfig
): BloomsAligner {
  return new BloomsAligner(config);
}

/**
 * Create a strict Bloom's Aligner (no variance allowed)
 */
export function createStrictBloomsAligner(): BloomsAligner {
  return new BloomsAligner({
    acceptableVariance: 0,
    passingScore: 80,
  });
}

/**
 * Create a lenient Bloom's Aligner (more variance allowed)
 */
export function createLenientBloomsAligner(): BloomsAligner {
  return new BloomsAligner({
    acceptableVariance: 2,
    passingScore: 60,
  });
}
