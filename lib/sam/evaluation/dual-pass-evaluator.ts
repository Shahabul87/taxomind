/**
 * Dual-Pass Evaluator
 *
 * Priority 8: Harden Assessment Reliability
 * Implements dual-pass LLM scoring with verification and aggregation
 */

import type {
  StudentResponse,
  Rubric,
  ScoreResult,
  CriterionScore,
  VerificationResult,
  AgreementLevel,
  HardenedEvaluatorConfig,
  ScoringSource,
} from './types';
import { DEFAULT_HARDENED_EVALUATOR_CONFIG } from './types';
import { RulesBasedScorer } from './rules-based-scorer';

// ============================================================================
// LLM SCORER INTERFACE
// ============================================================================

/**
 * LLM scoring request
 */
export interface LLMScoreRequest {
  /**
   * Student response to evaluate
   */
  response: StudentResponse;

  /**
   * Rubric to use for evaluation
   */
  rubric: Rubric;

  /**
   * Expected answer (if available)
   */
  expectedAnswer?: string;

  /**
   * Additional context
   */
  context?: string;

  /**
   * Model to use
   */
  model?: string;
}

/**
 * LLM scoring response
 */
export interface LLMScoreResponse {
  /**
   * Numerical score
   */
  score: number;

  /**
   * Maximum possible score
   */
  maxScore: number;

  /**
   * Confidence in the score (0-1)
   */
  confidence: number;

  /**
   * Detailed feedback
   */
  feedback: string;

  /**
   * Strengths identified
   */
  strengths: string[];

  /**
   * Areas for improvement
   */
  improvements: string[];

  /**
   * Criterion-level scores
   */
  criterionScores?: CriterionScore[];

  /**
   * Model version used
   */
  modelVersion: string;
}

/**
 * LLM Scorer interface
 * Implement this to connect to actual LLM providers
 */
export interface LLMScorer {
  /**
   * Score a student response using LLM
   */
  score(request: LLMScoreRequest): Promise<LLMScoreResponse>;

  /**
   * Get the model identifier
   */
  getModelId(): string;
}

// ============================================================================
// DUAL-PASS EVALUATOR CONFIGURATION
// ============================================================================

/**
 * Dual-pass evaluator configuration
 */
export interface DualPassEvaluatorConfig extends HardenedEvaluatorConfig {
  /**
   * Primary LLM scorer
   */
  primaryScorer?: LLMScorer;

  /**
   * Secondary LLM scorer
   */
  secondaryScorer?: LLMScorer;

  /**
   * Rules-based scorer
   */
  rulesScorer?: RulesBasedScorer;

  /**
   * Logger for debugging
   */
  logger?: DualPassLogger;
}

/**
 * Logger interface
 */
export interface DualPassLogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

/**
 * Evaluation result with all scores
 */
export interface DualPassResult {
  /**
   * Primary score
   */
  primaryScore: ScoreResult;

  /**
   * Secondary score (if dual-pass was used)
   */
  secondaryScore?: ScoreResult;

  /**
   * Rules-based score (if enabled)
   */
  rulesScore?: ScoreResult;

  /**
   * Verification result
   */
  verification: VerificationResult;

  /**
   * Whether dual-pass was used
   */
  usedDualPass: boolean;

  /**
   * Timing information
   */
  timing: {
    primaryMs: number;
    secondaryMs?: number;
    rulesMs?: number;
    totalMs: number;
  };
}

// ============================================================================
// DUAL-PASS EVALUATOR IMPLEMENTATION
// ============================================================================

/**
 * Dual-Pass Evaluator
 * Performs multi-source scoring with verification and aggregation
 */
export class DualPassEvaluator {
  private readonly config: Required<HardenedEvaluatorConfig>;
  private readonly primaryScorer?: LLMScorer;
  private readonly secondaryScorer?: LLMScorer;
  private readonly rulesScorer: RulesBasedScorer;
  private readonly logger?: DualPassLogger;

  constructor(config: DualPassEvaluatorConfig = {}) {
    this.config = {
      ...DEFAULT_HARDENED_EVALUATOR_CONFIG,
      ...config,
    };
    this.primaryScorer = config.primaryScorer;
    this.secondaryScorer = config.secondaryScorer;
    this.rulesScorer = config.rulesScorer ?? new RulesBasedScorer();
    this.logger = config.logger;
  }

  /**
   * Evaluate a student response with dual-pass verification
   */
  async evaluate(
    response: StudentResponse,
    rubric: Rubric,
    expectedAnswer?: string
  ): Promise<DualPassResult> {
    const startTime = Date.now();
    this.logger?.info('Starting dual-pass evaluation', {
      responseId: response.id,
      rubricId: rubric.id,
    });

    // Get primary score
    const primaryStart = Date.now();
    const primaryScore = await this.getPrimaryScore(response, rubric, expectedAnswer);
    const primaryMs = Date.now() - primaryStart;

    // Determine if we need secondary scoring
    const needsSecondary = this.needsSecondaryPass(primaryScore);

    let secondaryScore: ScoreResult | undefined;
    let secondaryMs: number | undefined;

    if (needsSecondary && this.secondaryScorer) {
      const secondaryStart = Date.now();
      secondaryScore = await this.getSecondaryScore(response, rubric, expectedAnswer);
      secondaryMs = Date.now() - secondaryStart;
    }

    // Get rules-based score if enabled
    let rulesScore: ScoreResult | undefined;
    let rulesMs: number | undefined;

    if (this.config.useRulesBasedScoring) {
      const rulesStart = Date.now();
      rulesScore = this.rulesScorer.score(response, rubric);
      rulesMs = Date.now() - rulesStart;
    }

    // Verify and aggregate scores
    const verification = this.verifyScores(primaryScore, secondaryScore, rulesScore);

    const totalMs = Date.now() - startTime;

    this.logger?.info('Dual-pass evaluation complete', {
      responseId: response.id,
      primaryScore: primaryScore.percentage,
      secondaryScore: secondaryScore?.percentage,
      rulesScore: rulesScore?.percentage,
      aggregatedScore: verification.aggregatedScore.percentage,
      agreementLevel: verification.agreementLevel,
      needsHumanReview: verification.needsHumanReview,
      totalMs,
    });

    return {
      primaryScore,
      secondaryScore,
      rulesScore,
      verification,
      usedDualPass: secondaryScore !== undefined,
      timing: {
        primaryMs,
        secondaryMs,
        rulesMs,
        totalMs,
      },
    };
  }

  /**
   * Evaluate using only rules-based scoring (no LLM)
   */
  evaluateWithRulesOnly(
    response: StudentResponse,
    rubric: Rubric
  ): ScoreResult {
    return this.rulesScorer.score(response, rubric);
  }

  /**
   * Get primary score from LLM or rules
   */
  private async getPrimaryScore(
    response: StudentResponse,
    rubric: Rubric,
    expectedAnswer?: string
  ): Promise<ScoreResult> {
    if (this.primaryScorer) {
      const llmResponse = await this.primaryScorer.score({
        response,
        rubric,
        expectedAnswer,
        model: this.config.primaryModel,
      });

      return this.llmResponseToScoreResult(llmResponse, 'llm_primary');
    }

    // Fallback to rules-based scoring
    return this.rulesScorer.score(response, rubric);
  }

  /**
   * Get secondary score from LLM
   */
  private async getSecondaryScore(
    response: StudentResponse,
    rubric: Rubric,
    expectedAnswer?: string
  ): Promise<ScoreResult> {
    if (!this.secondaryScorer) {
      throw new Error('Secondary scorer not configured');
    }

    const llmResponse = await this.secondaryScorer.score({
      response,
      rubric,
      expectedAnswer,
      model: this.config.secondaryModel,
    });

    return this.llmResponseToScoreResult(llmResponse, 'llm_secondary');
  }

  /**
   * Convert LLM response to ScoreResult
   */
  private llmResponseToScoreResult(
    llmResponse: LLMScoreResponse,
    source: ScoringSource
  ): ScoreResult {
    const percentage = (llmResponse.score / llmResponse.maxScore) * 100;

    return {
      score: llmResponse.score,
      maxScore: llmResponse.maxScore,
      percentage: Math.round(percentage * 10) / 10,
      confidence: llmResponse.confidence,
      source,
      feedback: llmResponse.feedback,
      strengths: llmResponse.strengths,
      improvements: llmResponse.improvements,
      criterionScores: llmResponse.criterionScores,
      timestamp: new Date(),
      modelVersion: llmResponse.modelVersion,
    };
  }

  /**
   * Determine if secondary pass is needed
   */
  private needsSecondaryPass(primaryScore: ScoreResult): boolean {
    // Always use dual-pass if configured
    if (this.config.alwaysUseDualPass) {
      return true;
    }

    // Use secondary if primary confidence is low
    if (primaryScore.confidence < this.config.minConfidence) {
      this.logger?.debug('Triggering secondary pass due to low confidence', {
        confidence: primaryScore.confidence,
        threshold: this.config.minConfidence,
      });
      return true;
    }

    // Use secondary for borderline scores (near grade boundaries)
    const percentage = primaryScore.percentage;
    const borderlineRanges = [
      [58, 62], // D/C boundary
      [68, 72], // C/B boundary
      [78, 82], // B/A boundary
      [88, 92], // A/A+ boundary
    ];

    for (const [min, max] of borderlineRanges) {
      if (percentage >= min && percentage <= max) {
        this.logger?.debug('Triggering secondary pass due to borderline score', {
          percentage,
          range: [min, max],
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Verify scores and create verification result
   */
  private verifyScores(
    primaryScore: ScoreResult,
    secondaryScore?: ScoreResult,
    rulesScore?: ScoreResult
  ): VerificationResult {
    const scores: ScoreResult[] = [primaryScore];
    if (secondaryScore) scores.push(secondaryScore);
    if (rulesScore) scores.push(rulesScore);

    // Calculate differences
    const percentages = scores.map((s) => s.percentage);
    const maxDiff = Math.max(...percentages) - Math.min(...percentages);
    const avgPercentage = percentages.reduce((a, b) => a + b, 0) / percentages.length;

    // Determine agreement level
    const agreementLevel = this.determineAgreementLevel(maxDiff);

    // Calculate aggregated score
    const aggregatedScore = this.aggregateScores(scores);

    // Determine if human review is needed
    const { needsHumanReview, humanReviewReason } = this.checkHumanReview(
      agreementLevel,
      maxDiff,
      scores
    );

    // Verification passes if agreement is strong or moderate
    const passed = agreementLevel === 'strong' || agreementLevel === 'moderate';

    return {
      passed,
      agreementLevel,
      scoreDifference: primaryScore.score - (secondaryScore?.score ?? primaryScore.score),
      percentageDifference: maxDiff,
      primaryScore,
      secondaryScore,
      rulesScore,
      aggregatedScore,
      needsHumanReview,
      humanReviewReason,
      verifiedAt: new Date(),
    };
  }

  /**
   * Determine agreement level based on score difference
   */
  private determineAgreementLevel(percentageDiff: number): AgreementLevel {
    if (percentageDiff <= 5) {
      return 'strong';
    } else if (percentageDiff <= this.config.toleranceThreshold) {
      return 'moderate';
    } else if (percentageDiff <= this.config.humanReviewThreshold) {
      return 'weak';
    } else {
      return 'disagreement';
    }
  }

  /**
   * Aggregate multiple scores into a final score
   */
  private aggregateScores(scores: ScoreResult[]): ScoreResult {
    if (scores.length === 0) {
      throw new Error('No scores to aggregate');
    }

    if (scores.length === 1) {
      return { ...scores[0], source: 'aggregated' };
    }

    let aggregatedScore: number;
    let aggregatedPercentage: number;

    switch (this.config.aggregationMethod) {
      case 'median':
        aggregatedScore = this.calculateMedian(scores.map((s) => s.score));
        aggregatedPercentage = this.calculateMedian(scores.map((s) => s.percentage));
        break;

      case 'average':
        aggregatedScore = scores.reduce((a, s) => a + s.score, 0) / scores.length;
        aggregatedPercentage = scores.reduce((a, s) => a + s.percentage, 0) / scores.length;
        break;

      case 'weighted':
        aggregatedScore = this.calculateWeightedScore(scores);
        aggregatedPercentage = (aggregatedScore / scores[0].maxScore) * 100;
        break;

      case 'conservative':
        // Use the lowest score (most conservative)
        aggregatedScore = Math.min(...scores.map((s) => s.score));
        aggregatedPercentage = Math.min(...scores.map((s) => s.percentage));
        break;

      default:
        aggregatedScore = this.calculateWeightedScore(scores);
        aggregatedPercentage = (aggregatedScore / scores[0].maxScore) * 100;
    }

    // Combine feedback from all sources
    const allStrengths = [...new Set(scores.flatMap((s) => s.strengths))];
    const allImprovements = [...new Set(scores.flatMap((s) => s.improvements))];

    // Calculate aggregated confidence
    const avgConfidence = scores.reduce((a, s) => a + s.confidence, 0) / scores.length;
    const agreementBonus = this.calculateAgreementBonus(scores);
    const confidence = Math.min(0.99, avgConfidence + agreementBonus);

    // Combine criterion scores (prefer primary, then secondary)
    const criterionScores = scores.find((s) => s.criterionScores)?.criterionScores;

    return {
      score: Math.round(aggregatedScore * 10) / 10,
      maxScore: scores[0].maxScore,
      percentage: Math.round(aggregatedPercentage * 10) / 10,
      confidence,
      source: 'aggregated',
      feedback: this.combineFeedback(scores),
      strengths: allStrengths.slice(0, 5),
      improvements: allImprovements.slice(0, 5),
      criterionScores,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate weighted score
   */
  private calculateWeightedScore(scores: ScoreResult[]): number {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const score of scores) {
      let weight: number;
      switch (score.source) {
        case 'llm_primary':
          weight = this.config.primaryWeight;
          break;
        case 'llm_secondary':
          weight = this.config.secondaryWeight;
          break;
        case 'rules':
          weight = this.config.rulesWeight;
          break;
        default:
          weight = 1 / scores.length;
      }
      totalWeight += weight;
      weightedSum += score.score * weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : scores[0].score;
  }

  /**
   * Calculate median of numbers
   */
  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calculate confidence bonus based on score agreement
   */
  private calculateAgreementBonus(scores: ScoreResult[]): number {
    if (scores.length < 2) return 0;

    const percentages = scores.map((s) => s.percentage);
    const maxDiff = Math.max(...percentages) - Math.min(...percentages);

    if (maxDiff <= 5) return 0.15;
    if (maxDiff <= 10) return 0.1;
    if (maxDiff <= 15) return 0.05;
    return -0.1; // Penalty for high disagreement
  }

  /**
   * Combine feedback from multiple scores
   */
  private combineFeedback(scores: ScoreResult[]): string {
    const feedbacks = scores.map((s) => s.feedback).filter((f) => f.length > 0);

    if (feedbacks.length === 0) {
      return 'Evaluation complete.';
    }

    if (feedbacks.length === 1) {
      return feedbacks[0];
    }

    // Use primary feedback as base, add unique insights from others
    const primary = feedbacks[0];
    const additional: string[] = [];

    for (let i = 1; i < feedbacks.length; i++) {
      const sentences = feedbacks[i].split('. ').filter(
        (s) => s.length > 20 && !primary.toLowerCase().includes(s.toLowerCase().substring(0, 30))
      );
      additional.push(...sentences.slice(0, 2));
    }

    if (additional.length > 0) {
      return `${primary} Additional notes: ${additional.join('. ')}.`;
    }

    return primary;
  }

  /**
   * Check if human review is needed
   */
  private checkHumanReview(
    agreementLevel: AgreementLevel,
    percentageDiff: number,
    scores: ScoreResult[]
  ): { needsHumanReview: boolean; humanReviewReason?: string } {
    // High disagreement
    if (agreementLevel === 'disagreement') {
      return {
        needsHumanReview: true,
        humanReviewReason: `Score disagreement exceeds threshold (${Math.round(percentageDiff)}% difference)`,
      };
    }

    // Low confidence across all scorers
    const avgConfidence = scores.reduce((a, s) => a + s.confidence, 0) / scores.length;
    if (avgConfidence < this.config.minConfidence) {
      return {
        needsHumanReview: true,
        humanReviewReason: `Low scoring confidence (${Math.round(avgConfidence * 100)}%)`,
      };
    }

    // Borderline score with weak agreement
    const avgPercentage = scores.reduce((a, s) => a + s.percentage, 0) / scores.length;
    const isGradeBoundary = this.isNearGradeBoundary(avgPercentage);
    if (isGradeBoundary && agreementLevel === 'weak') {
      return {
        needsHumanReview: true,
        humanReviewReason: `Borderline score (${Math.round(avgPercentage)}%) with weak scorer agreement`,
      };
    }

    return { needsHumanReview: false };
  }

  /**
   * Check if score is near a grade boundary
   */
  private isNearGradeBoundary(percentage: number): boolean {
    const boundaries = [60, 70, 80, 90];
    return boundaries.some((b) => Math.abs(percentage - b) <= 2);
  }
}

// ============================================================================
// MOCK LLM SCORER FOR TESTING
// ============================================================================

/**
 * Mock LLM Scorer for testing and development
 */
export class MockLLMScorer implements LLMScorer {
  private readonly modelId: string;
  private readonly variability: number;

  constructor(modelId: string = 'mock-model', variability: number = 0.1) {
    this.modelId = modelId;
    this.variability = variability;
  }

  async score(request: LLMScoreRequest): Promise<LLMScoreResponse> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const { response, rubric } = request;

    // Calculate a base score based on response length and rubric
    const wordCount = response.content.split(/\s+/).length;
    const expectedWords = 200; // Arbitrary expected length
    const lengthScore = Math.min(1, wordCount / expectedWords);

    // Add some randomness
    const randomFactor = 1 + (Math.random() - 0.5) * this.variability * 2;

    const baseScore = lengthScore * rubric.maxPoints * randomFactor;
    const score = Math.max(0, Math.min(rubric.maxPoints, Math.round(baseScore * 10) / 10));

    // Generate mock criterion scores
    const criterionScores: CriterionScore[] = rubric.criteria.map((criterion) => {
      const criterionScore = Math.round(
        criterion.maxPoints * lengthScore * randomFactor * criterion.weight * 10
      ) / 10;

      return {
        criterionId: criterion.id,
        score: Math.max(0, Math.min(criterion.maxPoints, criterionScore)),
        maxScore: criterion.maxPoints,
        levelAchieved: criterionScore >= criterion.maxPoints * 0.8 ? 'Excellent' : 'Good',
        justification: `Mock evaluation for ${criterion.name}`,
      };
    });

    return {
      score,
      maxScore: rubric.maxPoints,
      confidence: 0.8 + Math.random() * 0.15,
      feedback: 'This is a mock evaluation response.',
      strengths: ['Good structure', 'Clear writing'],
      improvements: ['Add more examples', 'Expand on key points'],
      criterionScores,
      modelVersion: this.modelId,
    };
  }

  getModelId(): string {
    return this.modelId;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a dual-pass evaluator
 */
export function createDualPassEvaluator(
  config?: DualPassEvaluatorConfig
): DualPassEvaluator {
  return new DualPassEvaluator(config);
}

/**
 * Create a dual-pass evaluator with mock scorers for testing
 */
export function createMockDualPassEvaluator(): DualPassEvaluator {
  return new DualPassEvaluator({
    primaryScorer: new MockLLMScorer('primary-mock', 0.05),
    secondaryScorer: new MockLLMScorer('secondary-mock', 0.1),
    alwaysUseDualPass: true,
    useRulesBasedScoring: true,
  });
}

/**
 * Create a rules-only evaluator (no LLM)
 */
export function createRulesOnlyEvaluator(): DualPassEvaluator {
  return new DualPassEvaluator({
    useRulesBasedScoring: true,
    alwaysUseDualPass: false,
  });
}
