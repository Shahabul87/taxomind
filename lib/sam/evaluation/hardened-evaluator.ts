/**
 * Hardened Evaluator
 *
 * Priority 8: Harden Assessment Reliability
 * Main integration that combines all evaluation components
 */

import type {
  StudentResponse,
  Rubric,
  VerifiedEvaluation,
  VerificationResult,
  ScoreResult,
  HumanReviewRequest,
  HardenedEvaluatorConfig,
  AnswerKeyVerification,
} from './types';
import { DEFAULT_HARDENED_EVALUATOR_CONFIG } from './types';
import {
  DualPassEvaluator,
  type DualPassResult,
  type LLMScorer,
  type DualPassLogger,
} from './dual-pass-evaluator';
import {
  RulesBasedScorer,
  type RulesScoreBreakdown,
} from './rules-based-scorer';
import {
  AdversarialGenerator,
  type AdversarialGenerator as AdversarialGeneratorType,
} from './adversarial-generator';
import {
  HumanReviewFlagger,
  type FlaggingResult,
  type HumanReviewStore,
} from './human-review-flagger';

// ============================================================================
// HARDENED EVALUATOR CONFIGURATION
// ============================================================================

/**
 * Full hardened evaluator configuration
 */
export interface FullHardenedEvaluatorConfig extends HardenedEvaluatorConfig {
  /**
   * Primary LLM scorer
   */
  primaryScorer?: LLMScorer;

  /**
   * Secondary LLM scorer
   */
  secondaryScorer?: LLMScorer;

  /**
   * Human review store
   */
  reviewStore?: HumanReviewStore;

  /**
   * Logger
   */
  logger?: HardenedEvaluatorLogger;

  /**
   * Enable adversarial testing on new rubrics
   */
  enableAdversarialTesting?: boolean;

  /**
   * Random sampling rate for quality assurance
   */
  qualitySamplingRate?: number;
}

/**
 * Logger interface
 */
export interface HardenedEvaluatorLogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

/**
 * Default full configuration
 */
const DEFAULT_FULL_CONFIG: Required<
  Omit<FullHardenedEvaluatorConfig, 'primaryScorer' | 'secondaryScorer' | 'reviewStore' | 'logger'>
> = {
  ...DEFAULT_HARDENED_EVALUATOR_CONFIG,
  enableAdversarialTesting: true,
  qualitySamplingRate: 0.05,
};

// ============================================================================
// EVALUATION RESULT TYPES
// ============================================================================

/**
 * Complete evaluation result
 */
export interface HardenedEvaluationResult {
  /**
   * Verified evaluation
   */
  evaluation: VerifiedEvaluation;

  /**
   * Dual-pass result details
   */
  dualPassResult: DualPassResult;

  /**
   * Rules-based breakdown (if available)
   */
  rulesBreakdown?: RulesScoreBreakdown;

  /**
   * Flagging result
   */
  flaggingResult: FlaggingResult;

  /**
   * Whether evaluation is ready for release
   */
  isReadyForRelease: boolean;

  /**
   * Reason if not ready
   */
  holdReason?: string;
}

/**
 * Batch evaluation result
 */
export interface BatchEvaluationResult {
  /**
   * Successful evaluations
   */
  successful: HardenedEvaluationResult[];

  /**
   * Failed evaluations
   */
  failed: Array<{
    response: StudentResponse;
    error: string;
  }>;

  /**
   * Summary statistics
   */
  summary: {
    total: number;
    successful: number;
    failed: number;
    flaggedForReview: number;
    averageScore: number;
    averageConfidence: number;
    processingTimeMs: number;
  };
}

// ============================================================================
// HARDENED EVALUATOR IMPLEMENTATION
// ============================================================================

/**
 * Hardened Evaluator
 * Complete evaluation system with verification and human review integration
 */
export class HardenedEvaluator {
  private readonly config: Required<
    Omit<FullHardenedEvaluatorConfig, 'primaryScorer' | 'secondaryScorer' | 'reviewStore' | 'logger'>
  >;
  private readonly dualPassEvaluator: DualPassEvaluator;
  private readonly rulesScorer: RulesBasedScorer;
  private readonly adversarialGenerator: AdversarialGenerator;
  private readonly humanReviewFlagger: HumanReviewFlagger;
  private readonly logger?: HardenedEvaluatorLogger;
  private idCounter: number = 0;

  // Cache for rubric verification results
  private readonly rubricVerificationCache: Map<string, AnswerKeyVerification> = new Map();

  constructor(config: FullHardenedEvaluatorConfig = {}) {
    this.config = { ...DEFAULT_FULL_CONFIG, ...config };
    this.logger = config.logger;

    // Initialize components
    this.rulesScorer = new RulesBasedScorer();

    this.dualPassEvaluator = new DualPassEvaluator({
      ...this.config,
      primaryScorer: config.primaryScorer,
      secondaryScorer: config.secondaryScorer,
      rulesScorer: this.rulesScorer,
      logger: this.createDualPassLogger(),
    });

    this.adversarialGenerator = new AdversarialGenerator({
      includeEdgeCases: true,
      difficulty: 'medium',
    });

    this.humanReviewFlagger = new HumanReviewFlagger({
      store: config.reviewStore,
      scoreDifferenceThreshold: this.config.humanReviewThreshold,
      confidenceThreshold: this.config.minConfidence,
      randomSamplingRate: this.config.qualitySamplingRate,
      logger: this.createFlaggerLogger(),
    });
  }

  /**
   * Evaluate a single student response
   */
  async evaluate(
    response: StudentResponse,
    rubric: Rubric,
    expectedAnswer?: string
  ): Promise<HardenedEvaluationResult> {
    const startTime = Date.now();

    this.logger?.info('Starting hardened evaluation', {
      responseId: response.id,
      studentId: response.studentId,
      rubricId: rubric.id,
    });

    try {
      // Perform dual-pass evaluation
      const dualPassResult = await this.dualPassEvaluator.evaluate(
        response,
        rubric,
        expectedAnswer
      );

      // Get rules breakdown if rules scoring was used
      let rulesBreakdown: RulesScoreBreakdown | undefined;
      if (this.config.useRulesBasedScoring) {
        rulesBreakdown = this.rulesScorer.getBreakdown(response, rubric);
      }

      // Create verified evaluation
      const evaluation = this.createVerifiedEvaluation(
        response,
        rubric,
        dualPassResult
      );

      // Check for human review flagging
      const flaggingResult = await this.humanReviewFlagger.checkAndFlag(evaluation);

      // Determine if ready for release
      const { isReadyForRelease, holdReason } = this.checkReleaseReadiness(
        evaluation,
        flaggingResult
      );

      const result: HardenedEvaluationResult = {
        evaluation,
        dualPassResult,
        rulesBreakdown,
        flaggingResult,
        isReadyForRelease,
        holdReason,
      };

      this.logger?.info('Hardened evaluation complete', {
        responseId: response.id,
        score: evaluation.finalScore.percentage,
        isReadyForRelease,
        flaggedForReview: flaggingResult.shouldFlag,
        processingTimeMs: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.logger?.error('Evaluation failed', {
        responseId: response.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Evaluate multiple responses in batch
   */
  async evaluateBatch(
    responses: StudentResponse[],
    rubric: Rubric,
    expectedAnswers?: Map<string, string>
  ): Promise<BatchEvaluationResult> {
    const startTime = Date.now();
    const successful: HardenedEvaluationResult[] = [];
    const failed: Array<{ response: StudentResponse; error: string }> = [];

    this.logger?.info('Starting batch evaluation', {
      count: responses.length,
      rubricId: rubric.id,
    });

    for (const response of responses) {
      try {
        const expectedAnswer = expectedAnswers?.get(response.questionId);
        const result = await this.evaluate(response, rubric, expectedAnswer);
        successful.push(result);
      } catch (error) {
        failed.push({
          response,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Calculate summary statistics
    const scores = successful.map((r) => r.evaluation.finalScore.percentage);
    const confidences = successful.map((r) => r.evaluation.finalScore.confidence);
    const flaggedCount = successful.filter((r) => r.flaggingResult.shouldFlag).length;

    const summary = {
      total: responses.length,
      successful: successful.length,
      failed: failed.length,
      flaggedForReview: flaggedCount,
      averageScore:
        scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      averageConfidence:
        confidences.length > 0
          ? confidences.reduce((a, b) => a + b, 0) / confidences.length
          : 0,
      processingTimeMs: Date.now() - startTime,
    };

    this.logger?.info('Batch evaluation complete', summary);

    return { successful, failed, summary };
  }

  /**
   * Verify a rubric using adversarial testing
   */
  async verifyRubric(
    rubric: Rubric,
    expectedAnswer: string,
    questionId: string
  ): Promise<AnswerKeyVerification> {
    // Check cache
    const cacheKey = `${rubric.id}-${rubric.version}`;
    const cached = this.rubricVerificationCache.get(cacheKey);
    if (cached) {
      this.logger?.debug('Using cached rubric verification', { rubricId: rubric.id });
      return cached;
    }

    this.logger?.info('Starting rubric verification', {
      rubricId: rubric.id,
      rubricVersion: rubric.version,
    });

    const verification = await this.adversarialGenerator.verifyAnswerKey(
      expectedAnswer,
      this.dualPassEvaluator,
      rubric,
      questionId
    );

    // Cache the result
    this.rubricVerificationCache.set(cacheKey, verification);

    this.logger?.info('Rubric verification complete', {
      rubricId: rubric.id,
      reliabilityScore: verification.reliabilityScore,
      passed: verification.passed,
      issueCount: verification.issues.length,
    });

    return verification;
  }

  /**
   * Get rules-only score (no LLM)
   */
  getRulesScore(response: StudentResponse, rubric: Rubric): ScoreResult {
    return this.dualPassEvaluator.evaluateWithRulesOnly(response, rubric);
  }

  /**
   * Get rules breakdown
   */
  getRulesBreakdown(response: StudentResponse, rubric: Rubric): RulesScoreBreakdown {
    return this.rulesScorer.getBreakdown(response, rubric);
  }

  /**
   * Get pending human reviews
   */
  async getPendingReviews(): Promise<HumanReviewRequest[]> {
    return this.humanReviewFlagger.getPendingReviews();
  }

  /**
   * Complete a human review
   */
  async completeReview(
    requestId: string,
    reviewerId: string,
    finalScore: number,
    feedback: string,
    overrideReason?: string
  ): Promise<void> {
    await this.humanReviewFlagger.completeReview(
      requestId,
      reviewerId,
      finalScore,
      feedback,
      overrideReason
    );
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    return this.humanReviewFlagger.getQueueStats();
  }

  /**
   * Create verified evaluation from dual-pass result
   */
  private createVerifiedEvaluation(
    response: StudentResponse,
    rubric: Rubric,
    dualPassResult: DualPassResult
  ): VerifiedEvaluation {
    const allScores: ScoreResult[] = [dualPassResult.primaryScore];
    if (dualPassResult.secondaryScore) {
      allScores.push(dualPassResult.secondaryScore);
    }
    if (dualPassResult.rulesScore) {
      allScores.push(dualPassResult.rulesScore);
    }

    return {
      id: this.generateId(),
      responseId: response.id,
      studentId: response.studentId,
      rubricId: rubric.id,
      finalScore: dualPassResult.verification.aggregatedScore,
      verification: dualPassResult.verification,
      allScores,
      humanReviewStatus: dualPassResult.verification.needsHumanReview
        ? 'pending'
        : 'not_needed',
      evaluatedAt: new Date(),
    };
  }

  /**
   * Check if evaluation is ready for release
   */
  private checkReleaseReadiness(
    evaluation: VerifiedEvaluation,
    flaggingResult: FlaggingResult
  ): { isReadyForRelease: boolean; holdReason?: string } {
    // Not ready if flagged for human review
    if (flaggingResult.shouldFlag) {
      return {
        isReadyForRelease: false,
        holdReason: `Pending human review: ${flaggingResult.explanation}`,
      };
    }

    // Not ready if verification failed
    if (!evaluation.verification.passed) {
      return {
        isReadyForRelease: false,
        holdReason: `Verification failed: ${evaluation.verification.agreementLevel} agreement`,
      };
    }

    // Not ready if confidence is too low
    if (evaluation.finalScore.confidence < this.config.minConfidence) {
      return {
        isReadyForRelease: false,
        holdReason: `Low confidence: ${Math.round(evaluation.finalScore.confidence * 100)}%`,
      };
    }

    return { isReadyForRelease: true };
  }

  /**
   * Create logger adapter for dual-pass evaluator
   */
  private createDualPassLogger(): DualPassLogger | undefined {
    if (!this.logger) return undefined;

    return {
      debug: (msg, data) => this.logger?.debug(`[DualPass] ${msg}`, data),
      info: (msg, data) => this.logger?.info(`[DualPass] ${msg}`, data),
      warn: (msg, data) => this.logger?.warn(`[DualPass] ${msg}`, data),
      error: (msg, data) => this.logger?.error(`[DualPass] ${msg}`, data),
    };
  }

  /**
   * Create logger adapter for flagger
   */
  private createFlaggerLogger() {
    if (!this.logger) return undefined;

    return {
      debug: (msg: string, data?: Record<string, unknown>) =>
        this.logger?.debug(`[Flagger] ${msg}`, data),
      info: (msg: string, data?: Record<string, unknown>) =>
        this.logger?.info(`[Flagger] ${msg}`, data),
      warn: (msg: string, data?: Record<string, unknown>) =>
        this.logger?.warn(`[Flagger] ${msg}`, data),
      error: (msg: string, data?: Record<string, unknown>) =>
        this.logger?.error(`[Flagger] ${msg}`, data),
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `eval-${++this.idCounter}-${Date.now().toString(36)}`;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a hardened evaluator
 */
export function createHardenedEvaluator(
  config?: FullHardenedEvaluatorConfig
): HardenedEvaluator {
  return new HardenedEvaluator(config);
}

/**
 * Create a strict hardened evaluator (more verification, more flagging)
 */
export function createStrictHardenedEvaluator(
  config?: Partial<FullHardenedEvaluatorConfig>
): HardenedEvaluator {
  return new HardenedEvaluator({
    ...config,
    toleranceThreshold: 5,
    alwaysUseDualPass: true,
    minConfidence: 0.8,
    humanReviewThreshold: 10,
    qualitySamplingRate: 0.1,
  });
}

/**
 * Create a lenient hardened evaluator (less verification, faster)
 */
export function createLenientHardenedEvaluator(
  config?: Partial<FullHardenedEvaluatorConfig>
): HardenedEvaluator {
  return new HardenedEvaluator({
    ...config,
    toleranceThreshold: 15,
    alwaysUseDualPass: false,
    minConfidence: 0.6,
    humanReviewThreshold: 20,
    qualitySamplingRate: 0.02,
  });
}

/**
 * Create a rules-only evaluator (no LLM, fastest)
 */
export function createRulesOnlyHardenedEvaluator(): HardenedEvaluator {
  return new HardenedEvaluator({
    useRulesBasedScoring: true,
    alwaysUseDualPass: false,
    enableAdversarialTesting: false,
  });
}
