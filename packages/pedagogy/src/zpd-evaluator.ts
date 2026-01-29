/**
 * ZPD (Zone of Proximal Development) Evaluator
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Evaluates content fit within student's Zone of Proximal Development
 */

import type {
  PedagogicalContent,
  StudentCognitiveProfile,
  ZPDEvaluatorResult,
  ZPDZone,
  ChallengeLevel,
  ChallengeFactor,
  SupportAdequacy,
  EngagementPrediction,
  PersonalizationFit,
  PersonalizationOpportunity,
  PedagogicalIssue,
  PedagogicalEvaluator,
} from './types';
import { getBloomsLevelIndex, getDifficultyLevelIndex } from './types';
import {
  createCognitiveLoadAnalyzer,
  type CognitiveLoadAnalyzer,
  type CognitiveLoadResult,
} from './cognitive-load-analyzer';

// ============================================================================
// ZPD CONSTANTS
// ============================================================================

/**
 * Challenge score ranges for each ZPD zone
 */
export const ZPD_ZONE_RANGES: Record<ZPDZone, { min: number; max: number }> = {
  TOO_EASY: { min: 0, max: 20 },
  COMFORT_ZONE: { min: 20, max: 35 },
  ZPD_LOWER: { min: 35, max: 50 },
  ZPD_OPTIMAL: { min: 50, max: 70 },
  ZPD_UPPER: { min: 70, max: 85 },
  FRUSTRATION: { min: 85, max: 95 },
  UNREACHABLE: { min: 95, max: 100 },
};

/**
 * Engagement predictions based on ZPD zone
 */
export const ZONE_ENGAGEMENT_MAP: Record<
  ZPDZone,
  EngagementPrediction['predictedState']
> = {
  TOO_EASY: 'bored',
  COMFORT_ZONE: 'comfortable',
  ZPD_LOWER: 'engaged',
  ZPD_OPTIMAL: 'challenged',
  ZPD_UPPER: 'challenged',
  FRUSTRATION: 'frustrated',
  UNREACHABLE: 'anxious',
};

/**
 * Support types that should be present
 */
export const SUPPORT_TYPES = [
  'examples',
  'hints',
  'scaffolding',
  'feedback',
  'modeling',
  'guidance',
  'resources',
  'explanations',
];

// ============================================================================
// ZPD EVALUATOR IMPLEMENTATION
// ============================================================================

/**
 * Configuration for ZPD Evaluator
 */
export interface ZPDEvaluatorConfig {
  /**
   * Target ZPD zone for optimal learning
   */
  targetZone?: ZPDZone;

  /**
   * Minimum challenge score (0-100)
   */
  minChallengeScore?: number;

  /**
   * Maximum challenge score (0-100)
   */
  maxChallengeScore?: number;

  /**
   * Minimum support adequacy score (0-100)
   */
  minSupportAdequacy?: number;

  /**
   * Minimum score to pass
   */
  passingScore?: number;

  /**
   * Weight for challenge appropriateness
   */
  challengeWeight?: number;

  /**
   * Weight for support adequacy
   */
  supportWeight?: number;

  /**
   * Weight for personalization fit
   */
  personalizationWeight?: number;

  /**
   * Whether to include cognitive load analysis (Phase 3)
   * @default true
   */
  includeCognitiveLoad?: boolean;

  /**
   * Maximum total cognitive load before ZPD adjustment (Phase 3)
   * If load exceeds this, ZPD zone is adjusted toward easier content
   * @default 70
   */
  maxCognitiveLoad?: number;

  /**
   * Weight for cognitive load in score calculation (Phase 3)
   * @default 0.15
   */
  cognitiveLoadWeight?: number;
}

/**
 * Default configuration
 */
export const DEFAULT_ZPD_CONFIG: Required<ZPDEvaluatorConfig> = {
  targetZone: 'ZPD_OPTIMAL',
  minChallengeScore: 35,
  maxChallengeScore: 85,
  minSupportAdequacy: 60,
  passingScore: 70,
  challengeWeight: 0.35,
  supportWeight: 0.30,
  personalizationWeight: 0.20,
  // Phase 3: Cognitive Load Integration
  includeCognitiveLoad: true,
  maxCognitiveLoad: 70,
  cognitiveLoadWeight: 0.15,
};

/**
 * ZPD Evaluator
 * Analyzes content fit within student's Zone of Proximal Development
 */
export class ZPDEvaluator
  implements PedagogicalEvaluator<ZPDEvaluatorResult>
{
  readonly name = 'ZPDEvaluator';
  readonly description =
    "Evaluates content fit within student's Zone of Proximal Development";

  private readonly config: Required<ZPDEvaluatorConfig>;
  private readonly cognitiveLoadAnalyzer: CognitiveLoadAnalyzer;

  constructor(config: ZPDEvaluatorConfig = {}) {
    this.config = { ...DEFAULT_ZPD_CONFIG, ...config };
    this.cognitiveLoadAnalyzer = createCognitiveLoadAnalyzer();
  }

  /**
   * Evaluate content for ZPD fit
   */
  async evaluate(
    content: PedagogicalContent,
    studentProfile?: StudentCognitiveProfile
  ): Promise<ZPDEvaluatorResult> {
    const startTime = Date.now();

    // Phase 3: Analyze cognitive load if enabled
    let cognitiveLoadResult: CognitiveLoadResult | undefined;
    if (this.config.includeCognitiveLoad) {
      cognitiveLoadResult = this.cognitiveLoadAnalyzer.analyze(
        content.content,
        content.targetBloomsLevel
      );
    }

    // Analyze challenge level
    const challengeLevel = this.analyzeChallengeLevel(content, studentProfile);

    // Phase 3: Adjust challenge based on cognitive load
    const adjustedChallengeScore = cognitiveLoadResult
      ? this.adjustChallengeForCognitiveLoad(
          challengeLevel.score,
          cognitiveLoadResult
        )
      : challengeLevel.score;

    // Determine ZPD zone (using adjusted challenge if cognitive load is high)
    const zpdZone = this.determineZPDZone(adjustedChallengeScore);

    // Analyze support adequacy
    const supportAdequacy = this.analyzeSupportAdequacy(
      content,
      challengeLevel
    );

    // Predict engagement (consider cognitive load)
    const engagementPrediction = this.predictEngagement(
      zpdZone,
      challengeLevel,
      supportAdequacy,
      cognitiveLoadResult
    );

    // Analyze personalization fit
    const personalizationFit = this.analyzePersonalizationFit(
      content,
      studentProfile
    );

    // Determine if in ZPD
    const inZPD = this.isInZPD(zpdZone);

    // Calculate score (include cognitive load factor)
    const score = this.calculateScore(
      challengeLevel,
      supportAdequacy,
      personalizationFit,
      zpdZone,
      cognitiveLoadResult
    );

    // Analyze issues and recommendations
    const { issues, recommendations } = this.analyzeIssuesAndRecommendations(
      zpdZone,
      challengeLevel,
      supportAdequacy,
      engagementPrediction,
      personalizationFit,
      studentProfile,
      cognitiveLoadResult
    );

    const passed = score >= this.config.passingScore && inZPD;

    return {
      evaluatorName: 'ZPDEvaluator',
      passed,
      score,
      confidence: this.calculateConfidence(studentProfile),
      issues,
      recommendations,
      processingTimeMs: Date.now() - startTime,
      analysis: {
        zpdZone,
        challengeScore: challengeLevel.score,
        supportScore: supportAdequacy.score,
        engagementPrediction: engagementPrediction.predictedState,
        personalizationScore: personalizationFit.score,
        // Phase 3: Cognitive load data
        cognitiveLoad: cognitiveLoadResult ? {
          totalLoad: cognitiveLoadResult.totalLoad,
          category: cognitiveLoadResult.loadCategory,
          intrinsic: cognitiveLoadResult.measurements.intrinsic.score,
          extraneous: cognitiveLoadResult.measurements.extraneous.score,
          germane: cognitiveLoadResult.measurements.germane.score,
          adjustedChallengeScore,
        } : undefined,
      },
      inZPD,
      zpdZone,
      challengeLevel,
      supportAdequacy,
      engagementPrediction,
      personalizationFit,
    };
  }

  /**
   * Adjust challenge score based on cognitive load (Phase 3)
   * High cognitive load effectively increases the perceived challenge
   */
  private adjustChallengeForCognitiveLoad(
    baseChallenge: number,
    cognitiveLoad: CognitiveLoadResult
  ): number {
    // If cognitive load is within acceptable range, no adjustment
    if (cognitiveLoad.totalLoad <= this.config.maxCognitiveLoad) {
      return baseChallenge;
    }

    // High cognitive load increases effective challenge
    // For every 10 points over max, add 5 to challenge
    const excess = cognitiveLoad.totalLoad - this.config.maxCognitiveLoad;
    const adjustment = Math.floor(excess / 10) * 5;

    return Math.min(100, baseChallenge + adjustment);
  }

  /**
   * Analyze challenge level of content
   */
  private analyzeChallengeLevel(
    content: PedagogicalContent,
    studentProfile?: StudentCognitiveProfile
  ): ChallengeLevel {
    const factors: ChallengeFactor[] = [];
    let totalChallenge = 0;

    // Factor 1: Content difficulty vs student level
    const difficultyFactor = this.calculateDifficultyFactor(
      content,
      studentProfile
    );
    factors.push(difficultyFactor);
    totalChallenge += difficultyFactor.contribution;

    // Factor 2: Bloom's level gap
    const bloomsFactor = this.calculateBloomsFactor(content, studentProfile);
    factors.push(bloomsFactor);
    totalChallenge += bloomsFactor.contribution;

    // Factor 3: Prerequisite gaps
    const prerequisiteFactor = this.calculatePrerequisiteFactor(
      content,
      studentProfile
    );
    factors.push(prerequisiteFactor);
    totalChallenge += prerequisiteFactor.contribution;

    // Factor 4: Content complexity
    const complexityFactor = this.calculateComplexityFactor(content);
    factors.push(complexityFactor);
    totalChallenge += complexityFactor.contribution;

    // Normalize score
    const score = Math.min(100, Math.max(0, totalChallenge / factors.length));

    // Determine if challenge is appropriate
    const appropriate =
      score >= this.config.minChallengeScore &&
      score <= this.config.maxChallengeScore;

    // Determine recommended adjustment
    let recommendedAdjustment: ChallengeLevel['recommendedAdjustment'] =
      'maintain';
    if (score < this.config.minChallengeScore) {
      recommendedAdjustment = 'increase';
    } else if (score > this.config.maxChallengeScore) {
      recommendedAdjustment = 'decrease';
    }

    return {
      score,
      appropriate,
      factors,
      recommendedAdjustment,
    };
  }

  /**
   * Calculate difficulty factor
   */
  private calculateDifficultyFactor(
    content: PedagogicalContent,
    studentProfile?: StudentCognitiveProfile
  ): ChallengeFactor {
    const contentDifficulty = content.targetDifficulty ?? 'intermediate';
    const contentDifficultyIndex = getDifficultyLevelIndex(contentDifficulty);

    let studentDifficultyIndex = 1; // Default to intermediate
    if (studentProfile) {
      studentDifficultyIndex = getDifficultyLevelIndex(
        studentProfile.currentDifficultyLevel
      );
    }

    const gap = contentDifficultyIndex - studentDifficultyIndex;
    const contribution = 50 + gap * 20; // Base 50, +/- 20 per level gap

    return {
      name: 'difficulty_gap',
      contribution: Math.min(100, Math.max(0, contribution)),
      appropriate: Math.abs(gap) <= 1,
    };
  }

  /**
   * Calculate Bloom's level factor
   */
  private calculateBloomsFactor(
    content: PedagogicalContent,
    studentProfile?: StudentCognitiveProfile
  ): ChallengeFactor {
    const contentBloomsLevel = content.targetBloomsLevel ?? 'UNDERSTAND';
    const contentBloomsIndex = getBloomsLevelIndex(contentBloomsLevel);

    let studentBloomsIndex = 1; // Default to UNDERSTAND
    if (studentProfile && content.topic) {
      const demonstrated =
        studentProfile.demonstratedBloomsLevels[content.topic];
      if (demonstrated) {
        studentBloomsIndex = getBloomsLevelIndex(demonstrated);
      }
    }

    const gap = contentBloomsIndex - studentBloomsIndex;
    const contribution = 50 + gap * 15; // Base 50, +/- 15 per level gap

    return {
      name: 'blooms_gap',
      contribution: Math.min(100, Math.max(0, contribution)),
      appropriate: gap >= 0 && gap <= 2,
    };
  }

  /**
   * Calculate prerequisite factor
   */
  private calculatePrerequisiteFactor(
    content: PedagogicalContent,
    studentProfile?: StudentCognitiveProfile
  ): ChallengeFactor {
    if (!content.prerequisites || content.prerequisites.length === 0) {
      return {
        name: 'prerequisite_coverage',
        contribution: 50,
        appropriate: true,
      };
    }

    let coveredCount = 0;
    if (studentProfile) {
      for (const prereq of content.prerequisites) {
        const hasMastery =
          studentProfile.completedTopics.includes(prereq) ||
          (studentProfile.masteryLevels[prereq]?.mastery ?? 0) >= 70;
        if (hasMastery) {
          coveredCount++;
        }
      }
    }

    const coverageRatio = coveredCount / content.prerequisites.length;
    // Lower coverage = higher challenge
    const contribution = 100 - coverageRatio * 50;

    return {
      name: 'prerequisite_coverage',
      contribution: Math.min(100, Math.max(0, contribution)),
      appropriate: coverageRatio >= 0.7,
    };
  }

  /**
   * Calculate content complexity factor
   */
  private calculateComplexityFactor(
    content: PedagogicalContent
  ): ChallengeFactor {
    const text = content.content;

    // Estimate complexity based on various factors
    let complexity = 50;

    // Sentence length
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const avgSentenceLength =
      sentences.reduce((sum, s) => sum + s.split(' ').length, 0) /
      (sentences.length || 1);
    if (avgSentenceLength > 25) complexity += 15;
    if (avgSentenceLength > 35) complexity += 10;
    if (avgSentenceLength < 10) complexity -= 15;

    // Technical terms (simple heuristic)
    const technicalPatterns = /\b\w{10,}\b/g;
    const technicalMatches = text.match(technicalPatterns);
    if (technicalMatches && technicalMatches.length > 10) {
      complexity += 10;
    }

    // Learning objectives count
    if (content.learningObjectives) {
      if (content.learningObjectives.length > 5) complexity += 10;
      if (content.learningObjectives.length > 8) complexity += 10;
    }

    return {
      name: 'content_complexity',
      contribution: Math.min(100, Math.max(0, complexity)),
      appropriate: complexity >= 40 && complexity <= 75,
    };
  }

  /**
   * Determine ZPD zone based on challenge score
   */
  private determineZPDZone(challengeScore: number): ZPDZone {
    for (const [zone, range] of Object.entries(ZPD_ZONE_RANGES)) {
      if (challengeScore >= range.min && challengeScore < range.max) {
        return zone as ZPDZone;
      }
    }
    return challengeScore >= 95 ? 'UNREACHABLE' : 'TOO_EASY';
  }

  /**
   * Check if content is within ZPD
   */
  private isInZPD(zone: ZPDZone): boolean {
    return ['ZPD_LOWER', 'ZPD_OPTIMAL', 'ZPD_UPPER'].includes(zone);
  }

  /**
   * Analyze support adequacy
   */
  private analyzeSupportAdequacy(
    content: PedagogicalContent,
    challengeLevel: ChallengeLevel
  ): SupportAdequacy {
    const lowerContent = content.content.toLowerCase();
    const supportPresent: string[] = [];
    const supportMissing: string[] = [];

    // Check for each support type
    for (const supportType of SUPPORT_TYPES) {
      if (lowerContent.includes(supportType)) {
        supportPresent.push(supportType);
      } else {
        supportMissing.push(supportType);
      }
    }

    // Also check for specific support indicators
    const supportIndicators = {
      examples: ['for example', 'such as', 'e.g.', 'consider this'],
      hints: ['hint:', 'tip:', 'remember that', 'keep in mind'],
      scaffolding: ['step by step', 'first,', 'then,', 'next,'],
      feedback: ['correct!', 'well done', 'try again', 'not quite'],
      modeling: ["let me show", "watch how", "here's how"],
      guidance: ['try to', 'your turn', 'now you', 'practice'],
    };

    for (const [type, indicators] of Object.entries(supportIndicators)) {
      for (const indicator of indicators) {
        if (
          lowerContent.includes(indicator) &&
          !supportPresent.includes(type)
        ) {
          supportPresent.push(type);
          const missingIndex = supportMissing.indexOf(type);
          if (missingIndex !== -1) {
            supportMissing.splice(missingIndex, 1);
          }
          break;
        }
      }
    }

    // Calculate score based on support present
    const baseScore = (supportPresent.length / SUPPORT_TYPES.length) * 100;

    // Adjust based on challenge level - higher challenge needs more support
    let adjustedScore = baseScore;
    if (challengeLevel.score > 70) {
      // High challenge - penalize missing support more
      adjustedScore = baseScore * 0.8;
    } else if (challengeLevel.score < 40) {
      // Low challenge - less support needed
      adjustedScore = Math.min(100, baseScore * 1.2);
    }

    const score = Math.round(adjustedScore);
    const adequate = score >= this.config.minSupportAdequacy;

    // Determine balance
    let challengeSupportBalance: SupportAdequacy['challengeSupportBalance'] =
      'balanced';
    if (challengeLevel.score > 70 && score < 60) {
      challengeSupportBalance = 'too_little_support';
    } else if (challengeLevel.score < 40 && score > 80) {
      challengeSupportBalance = 'too_much_support';
    }

    return {
      score,
      adequate,
      supportPresent,
      supportMissing,
      challengeSupportBalance,
    };
  }

  /**
   * Predict student engagement
   * Phase 3: Now considers cognitive load impact on engagement
   */
  private predictEngagement(
    zpdZone: ZPDZone,
    challengeLevel: ChallengeLevel,
    supportAdequacy: SupportAdequacy,
    cognitiveLoad?: CognitiveLoadResult
  ): EngagementPrediction {
    // Base engagement from ZPD zone
    const predictedState = ZONE_ENGAGEMENT_MAP[zpdZone];

    // Calculate engagement score
    let score = 50;

    // Adjust based on zone
    if (this.isInZPD(zpdZone)) {
      score = 80;
      if (zpdZone === 'ZPD_OPTIMAL') score = 90;
    } else if (zpdZone === 'COMFORT_ZONE') {
      score = 65;
    } else if (zpdZone === 'TOO_EASY') {
      score = 40;
    } else if (zpdZone === 'FRUSTRATION') {
      score = 35;
    } else if (zpdZone === 'UNREACHABLE') {
      score = 20;
    }

    // Adjust based on support adequacy
    if (supportAdequacy.adequate) {
      score = Math.min(100, score + 5);
    } else {
      score = Math.max(0, score - 10);
    }

    // Calculate disengagement risk
    let disengagementRisk = 0;
    if (zpdZone === 'TOO_EASY') disengagementRisk = 0.6;
    if (zpdZone === 'FRUSTRATION') disengagementRisk = 0.7;
    if (zpdZone === 'UNREACHABLE') disengagementRisk = 0.9;
    if (supportAdequacy.challengeSupportBalance === 'too_little_support') {
      disengagementRisk = Math.min(1, disengagementRisk + 0.2);
    }

    // Engagement factors
    const engagementFactors: string[] = [];
    if (this.isInZPD(zpdZone)) {
      engagementFactors.push('Content is appropriately challenging');
    }
    if (supportAdequacy.adequate) {
      engagementFactors.push('Adequate support provided');
    }
    if (challengeLevel.appropriate) {
      engagementFactors.push('Challenge level matches student ability');
    }
    if (zpdZone === 'TOO_EASY') {
      engagementFactors.push('Content may be too easy, risking boredom');
    }
    if (zpdZone === 'FRUSTRATION' || zpdZone === 'UNREACHABLE') {
      engagementFactors.push('Content is too difficult, risking frustration');
    }

    // Phase 3: Cognitive load impact on engagement
    if (cognitiveLoad) {
      if (cognitiveLoad.loadCategory === 'overload') {
        score = Math.max(0, score - 20);
        disengagementRisk = Math.min(1, disengagementRisk + 0.3);
        engagementFactors.push('Cognitive overload detected - may cause mental fatigue');
      } else if (cognitiveLoad.loadCategory === 'high') {
        score = Math.max(0, score - 10);
        disengagementRisk = Math.min(1, disengagementRisk + 0.15);
        engagementFactors.push('High cognitive load - monitor for fatigue');
      }

      // High extraneous load is particularly harmful
      if (cognitiveLoad.measurements.extraneous.score > 50) {
        score = Math.max(0, score - 5);
        engagementFactors.push('Extraneous cognitive load is high - simplify presentation');
      }

      // High germane load is positive for learning
      if (cognitiveLoad.measurements.germane.score > 60) {
        score = Math.min(100, score + 5);
        engagementFactors.push('Good schema-building activities present');
      }
    }

    return {
      score,
      predictedState,
      disengagementRisk,
      engagementFactors,
    };
  }

  /**
   * Analyze personalization fit
   */
  private analyzePersonalizationFit(
    content: PedagogicalContent,
    studentProfile?: StudentCognitiveProfile
  ): PersonalizationFit {
    const opportunities: PersonalizationOpportunity[] = [];
    let score = 50; // Base score

    if (!studentProfile) {
      // Without student profile, suggest personalization opportunities
      opportunities.push({
        area: 'Student Profile',
        suggestion: 'Gather student data to enable personalization',
        expectedImpact: 'high',
      });

      return {
        score: 40,
        assessment: 'poor',
        opportunities,
      };
    }

    // Check difficulty match
    const contentDifficulty = content.targetDifficulty ?? 'intermediate';
    if (contentDifficulty === studentProfile.currentDifficultyLevel) {
      score += 15;
    } else {
      opportunities.push({
        area: 'Difficulty Level',
        suggestion: `Adjust content difficulty to match student level (${studentProfile.currentDifficultyLevel})`,
        expectedImpact: 'high',
      });
    }

    // Check for knowledge gaps
    const hasGaps = studentProfile.knowledgeGaps.length > 0;
    if (hasGaps && content.topic) {
      const relevantGaps = studentProfile.knowledgeGaps.filter(
        (gap) => gap.topicId === content.topic
      );
      if (relevantGaps.length > 0) {
        opportunities.push({
          area: 'Knowledge Gaps',
          suggestion: `Address knowledge gaps: ${relevantGaps.map((g) => g.concept).join(', ')}`,
          expectedImpact: 'high',
        });
      } else {
        score += 10;
      }
    }

    // Check learning velocity match
    if (studentProfile.learningVelocity === 'slow') {
      opportunities.push({
        area: 'Pacing',
        suggestion: 'Consider slower pacing with more examples',
        expectedImpact: 'medium',
      });
    } else if (studentProfile.learningVelocity === 'accelerated') {
      opportunities.push({
        area: 'Pacing',
        suggestion: 'Consider faster pacing with more challenge',
        expectedImpact: 'medium',
      });
      score += 5;
    }

    // Check engagement level match
    if (studentProfile.recentPerformance.engagementLevel === 'low') {
      opportunities.push({
        area: 'Engagement',
        suggestion: 'Add interactive elements to boost engagement',
        expectedImpact: 'high',
      });
    } else {
      score += 10;
    }

    // Check performance trend
    if (studentProfile.recentPerformance.trend === 'declining') {
      opportunities.push({
        area: 'Support Level',
        suggestion: 'Increase scaffolding and support for struggling learner',
        expectedImpact: 'high',
      });
    } else if (studentProfile.recentPerformance.trend === 'improving') {
      score += 10;
    }

    // Determine assessment
    let assessment: PersonalizationFit['assessment'] = 'fair';
    if (score >= 80) assessment = 'excellent';
    else if (score >= 65) assessment = 'good';
    else if (score < 50) assessment = 'poor';

    return {
      score: Math.min(100, score),
      assessment,
      opportunities,
    };
  }

  /**
   * Calculate overall ZPD score
   * Phase 3: Now includes cognitive load factor
   */
  private calculateScore(
    challengeLevel: ChallengeLevel,
    supportAdequacy: SupportAdequacy,
    personalizationFit: PersonalizationFit,
    zpdZone: ZPDZone,
    cognitiveLoad?: CognitiveLoadResult
  ): number {
    // Phase 3: Calculate cognitive load score
    let cognitiveLoadScore = 75; // Default if not measured
    if (cognitiveLoad) {
      // Good balance: low extraneous, high germane, appropriate intrinsic
      const extraneousPenalty = cognitiveLoad.measurements.extraneous.score * 0.5;
      const germaneBonus = cognitiveLoad.measurements.germane.score * 0.3;
      const balanceBonus = cognitiveLoad.balance.status === 'optimal' ? 20 : 0;

      cognitiveLoadScore = Math.max(0, Math.min(100,
        100 - extraneousPenalty + germaneBonus + balanceBonus
      ));
    }

    // Weighted combination (Phase 3: includes cognitive load weight)
    let score =
      this.config.challengeWeight * (challengeLevel.appropriate ? 85 : 50) +
      this.config.supportWeight * supportAdequacy.score +
      this.config.personalizationWeight * personalizationFit.score +
      this.config.cognitiveLoadWeight * cognitiveLoadScore;

    // Bonus for optimal ZPD zone
    if (zpdZone === 'ZPD_OPTIMAL') {
      score = Math.min(100, score * 1.1);
    } else if (this.isInZPD(zpdZone)) {
      score = Math.min(100, score * 1.05);
    }

    // Penalty for being outside ZPD
    if (!this.isInZPD(zpdZone)) {
      if (zpdZone === 'FRUSTRATION' || zpdZone === 'UNREACHABLE') {
        score *= 0.7;
      } else {
        score *= 0.85;
      }
    }

    // Phase 3: Additional penalty for cognitive overload
    if (cognitiveLoad?.loadCategory === 'overload') {
      score *= 0.85;
    }

    return Math.round(score);
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(
    studentProfile?: StudentCognitiveProfile
  ): number {
    if (!studentProfile) {
      return 0.4; // Lower confidence without student data
    }

    let confidence = 0.6;

    // More data = higher confidence
    if (studentProfile.completedTopics.length > 5) confidence += 0.1;
    if (studentProfile.recentPerformance.assessmentCount > 5) confidence += 0.1;
    if (Object.keys(studentProfile.masteryLevels).length > 3) confidence += 0.1;
    if (Object.keys(studentProfile.demonstratedBloomsLevels).length > 3) {
      confidence += 0.1;
    }

    return Math.min(1, confidence);
  }

  /**
   * Analyze issues and generate recommendations
   * Phase 3: Now includes cognitive load analysis
   */
  private analyzeIssuesAndRecommendations(
    zpdZone: ZPDZone,
    challengeLevel: ChallengeLevel,
    supportAdequacy: SupportAdequacy,
    engagementPrediction: EngagementPrediction,
    personalizationFit: PersonalizationFit,
    studentProfile?: StudentCognitiveProfile,
    cognitiveLoadResult?: CognitiveLoadResult
  ): { issues: PedagogicalIssue[]; recommendations: string[] } {
    const issues: PedagogicalIssue[] = [];
    const recommendations: string[] = [];

    // ZPD zone issues
    if (zpdZone === 'TOO_EASY') {
      issues.push({
        type: 'zpd_mismatch',
        severity: 'high',
        description: 'Content is too easy for the student',
        learningImpact: 'Student may become bored and disengage',
        suggestedFix: 'Increase complexity and challenge level',
      });
      recommendations.push(
        'Add more challenging exercises',
        'Increase cognitive level to match student ability'
      );
    }

    if (zpdZone === 'COMFORT_ZONE') {
      issues.push({
        type: 'zpd_mismatch',
        severity: 'medium',
        description: 'Content is slightly below optimal challenge level',
        learningImpact: 'Limited growth potential',
        suggestedFix: 'Add some stretch goals or advanced extensions',
      });
      recommendations.push('Include optional challenge activities');
    }

    if (zpdZone === 'FRUSTRATION') {
      issues.push({
        type: 'zpd_mismatch',
        severity: 'high',
        description: 'Content is too difficult for the student',
        learningImpact: 'Student may become frustrated and give up',
        suggestedFix: 'Add more scaffolding or reduce complexity',
      });
      recommendations.push(
        'Add more examples and guided practice',
        'Break down complex concepts into smaller steps',
        'Ensure prerequisites are covered'
      );
    }

    if (zpdZone === 'UNREACHABLE') {
      issues.push({
        type: 'zpd_mismatch',
        severity: 'critical',
        description: 'Content is far beyond student ability',
        learningImpact: 'Learning is nearly impossible at this level',
        suggestedFix: 'Start with prerequisite content first',
      });
      recommendations.push(
        'Provide prerequisite content before this material',
        'Consider adaptive pathways based on student readiness'
      );
    }

    // Challenge level issues
    for (const factor of challengeLevel.factors) {
      if (!factor.appropriate) {
        issues.push({
          type: 'challenge_factor',
          severity: 'medium',
          description: `Challenge factor "${factor.name}" is not appropriate`,
          learningImpact: 'May affect learning effectiveness',
          suggestedFix: `Adjust ${factor.name} to better match student level`,
        });
      }
    }

    // Support adequacy issues
    if (!supportAdequacy.adequate) {
      issues.push({
        type: 'insufficient_support',
        severity: challengeLevel.score > 70 ? 'high' : 'medium',
        description: 'Insufficient learning support provided',
        learningImpact: 'Students may struggle without adequate guidance',
        suggestedFix: `Add more support: ${supportAdequacy.supportMissing.slice(0, 3).join(', ')}`,
      });
      recommendations.push(
        `Add missing support elements: ${supportAdequacy.supportMissing.slice(0, 3).join(', ')}`
      );
    }

    if (supportAdequacy.challengeSupportBalance === 'too_little_support') {
      issues.push({
        type: 'support_balance',
        severity: 'high',
        description: 'High challenge with insufficient support',
        learningImpact: 'Students may become frustrated',
        suggestedFix: 'Add more scaffolding, examples, and hints',
      });
    }

    // Engagement prediction issues
    if (engagementPrediction.disengagementRisk > 0.5) {
      issues.push({
        type: 'engagement_risk',
        severity:
          engagementPrediction.disengagementRisk > 0.7 ? 'high' : 'medium',
        description: `High disengagement risk (${Math.round(engagementPrediction.disengagementRisk * 100)}%)`,
        learningImpact: 'Student likely to disengage from learning',
        suggestedFix: 'Adjust content to ZPD optimal zone',
      });
    }

    // Personalization opportunities
    for (const opportunity of personalizationFit.opportunities) {
      if (opportunity.expectedImpact === 'high') {
        recommendations.push(opportunity.suggestion);
      }
    }

    // Student-specific recommendations
    if (studentProfile) {
      if (studentProfile.learningVelocity === 'slow') {
        recommendations.push('Provide more practice opportunities and repetition');
      }
      if (studentProfile.recentPerformance.trend === 'declining') {
        recommendations.push('Consider diagnostic assessment to identify issues');
      }
    }

    // Phase 3: Cognitive load issues and recommendations
    if (cognitiveLoadResult) {
      // Cognitive overload
      if (cognitiveLoadResult.loadCategory === 'overload') {
        issues.push({
          type: 'cognitive_overload',
          severity: 'critical',
          description: `Cognitive overload detected (total load: ${Math.round(cognitiveLoadResult.totalLoad)}%)`,
          learningImpact: 'Students will struggle to process and retain information',
          suggestedFix: 'Reduce complexity, break into smaller chunks, remove extraneous elements',
        });
        recommendations.push(
          'Break content into smaller, focused sections',
          'Remove decorative or non-essential elements',
          'Use progressive disclosure for complex topics'
        );
      } else if (cognitiveLoadResult.loadCategory === 'high') {
        issues.push({
          type: 'high_cognitive_load',
          severity: 'high',
          description: `High cognitive load detected (total load: ${Math.round(cognitiveLoadResult.totalLoad)}%)`,
          learningImpact: 'May cause mental fatigue and reduced retention',
          suggestedFix: 'Consider simplifying presentation or adding more scaffolding',
        });
        recommendations.push('Add more visual aids and worked examples');
      }

      // High extraneous load (waste of cognitive resources)
      if (cognitiveLoadResult.measurements.extraneous.score > 60) {
        issues.push({
          type: 'high_extraneous_load',
          severity: 'high',
          description: 'High extraneous cognitive load - presentation is inefficient',
          learningImpact: 'Cognitive resources wasted on non-learning activities',
          suggestedFix: 'Simplify formatting, remove distracting elements, improve organization',
        });
        recommendations.push(
          'Simplify visual presentation and reduce clutter',
          'Use consistent formatting and clear structure',
          'Eliminate redundant or confusing navigation'
        );
      } else if (cognitiveLoadResult.measurements.extraneous.score > 40) {
        issues.push({
          type: 'moderate_extraneous_load',
          severity: 'medium',
          description: 'Moderate extraneous cognitive load detected',
          learningImpact: 'Some cognitive resources diverted from learning',
          suggestedFix: 'Review presentation efficiency',
        });
      }

      // Low germane load (not enough schema-building)
      if (cognitiveLoadResult.measurements.germane.score < 30) {
        issues.push({
          type: 'low_germane_load',
          severity: 'medium',
          description: 'Low germane cognitive load - insufficient schema-building activities',
          learningImpact: 'Limited long-term retention and transfer',
          suggestedFix: 'Add practice problems, comparisons, and connection-making activities',
        });
        recommendations.push(
          'Add more practice exercises with feedback',
          'Include comparisons to prior knowledge',
          'Add self-explanation prompts'
        );
      }

      // High intrinsic load without adequate support
      if (
        cognitiveLoadResult.measurements.intrinsic.score > 60 &&
        !supportAdequacy.adequate
      ) {
        issues.push({
          type: 'unsupported_complexity',
          severity: 'high',
          description: 'Complex content without adequate instructional support',
          learningImpact: 'Learners may not be able to process difficult material',
          suggestedFix: 'Add more scaffolding, worked examples, or reduce element interactivity',
        });
        recommendations.push(
          'Add step-by-step worked examples',
          'Break complex procedures into sub-steps',
          'Consider completion problems (partially solved examples)'
        );
      }

      // Imbalanced cognitive load profile
      if (cognitiveLoadResult.balance.status !== 'optimal') {
        // Get recommendations from top-level recommendations array
        for (const rec of cognitiveLoadResult.recommendations) {
          if (!recommendations.includes(rec.action)) {
            recommendations.push(rec.action);
          }
        }
      }
    }

    return { issues, recommendations };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a ZPD Evaluator with default config
 */
export function createZPDEvaluator(config?: ZPDEvaluatorConfig): ZPDEvaluator {
  return new ZPDEvaluator(config);
}

/**
 * Create a strict ZPD Evaluator (requires optimal zone)
 */
export function createStrictZPDEvaluator(): ZPDEvaluator {
  return new ZPDEvaluator({
    targetZone: 'ZPD_OPTIMAL',
    minChallengeScore: 50,
    maxChallengeScore: 70,
    minSupportAdequacy: 70,
    passingScore: 80,
  });
}

/**
 * Create a lenient ZPD Evaluator (allows wider ZPD range)
 */
export function createLenientZPDEvaluator(): ZPDEvaluator {
  return new ZPDEvaluator({
    targetZone: 'ZPD_LOWER',
    minChallengeScore: 25,
    maxChallengeScore: 90,
    minSupportAdequacy: 50,
    passingScore: 60,
  });
}
