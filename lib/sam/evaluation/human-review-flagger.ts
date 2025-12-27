/**
 * Human Review Flagger
 *
 * Priority 8: Harden Assessment Reliability
 * Manages human review queue and flags evaluations needing human attention
 */

import type {
  HumanReviewRequest,
  HumanReviewReason,
  HumanReviewResult,
  ReviewQueueStats,
  VerifiedEvaluation,
  ScoreResult,
  VerificationResult,
} from './types';

// ============================================================================
// HUMAN REVIEW STORE INTERFACE
// ============================================================================

/**
 * Store interface for human review requests
 */
export interface HumanReviewStore {
  /**
   * Add a review request
   */
  addRequest(request: HumanReviewRequest): Promise<void>;

  /**
   * Get a review request by ID
   */
  getRequest(id: string): Promise<HumanReviewRequest | null>;

  /**
   * Get all pending requests
   */
  getPendingRequests(): Promise<HumanReviewRequest[]>;

  /**
   * Get requests by priority
   */
  getRequestsByPriority(
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): Promise<HumanReviewRequest[]>;

  /**
   * Get requests by reason
   */
  getRequestsByReason(reason: HumanReviewReason): Promise<HumanReviewRequest[]>;

  /**
   * Update request status
   */
  updateStatus(
    id: string,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  ): Promise<void>;

  /**
   * Assign reviewer
   */
  assignReviewer(id: string, reviewerId: string): Promise<void>;

  /**
   * Complete review
   */
  completeReview(id: string, result: HumanReviewResult): Promise<void>;

  /**
   * Get queue statistics
   */
  getStats(): Promise<ReviewQueueStats>;

  /**
   * Get overdue requests
   */
  getOverdueRequests(): Promise<HumanReviewRequest[]>;
}

// ============================================================================
// IN-MEMORY STORE IMPLEMENTATION
// ============================================================================

/**
 * In-memory implementation of human review store
 */
export class InMemoryHumanReviewStore implements HumanReviewStore {
  private readonly requests: Map<string, HumanReviewRequest> = new Map();
  private readonly completedReviews: Map<string, HumanReviewResult> = new Map();

  async addRequest(request: HumanReviewRequest): Promise<void> {
    this.requests.set(request.id, { ...request });
  }

  async getRequest(id: string): Promise<HumanReviewRequest | null> {
    return this.requests.get(id) ?? null;
  }

  async getPendingRequests(): Promise<HumanReviewRequest[]> {
    return Array.from(this.requests.values()).filter(
      (r) => r.status === 'pending' || r.status === 'in_progress'
    );
  }

  async getRequestsByPriority(
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): Promise<HumanReviewRequest[]> {
    return Array.from(this.requests.values()).filter(
      (r) => r.priority === priority && r.status !== 'completed' && r.status !== 'cancelled'
    );
  }

  async getRequestsByReason(reason: HumanReviewReason): Promise<HumanReviewRequest[]> {
    return Array.from(this.requests.values()).filter(
      (r) => r.reason === reason && r.status !== 'completed' && r.status !== 'cancelled'
    );
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  ): Promise<void> {
    const request = this.requests.get(id);
    if (request) {
      request.status = status;
    }
  }

  async assignReviewer(id: string, reviewerId: string): Promise<void> {
    const request = this.requests.get(id);
    if (request) {
      request.assignedTo = reviewerId;
      request.status = 'in_progress';
    }
  }

  async completeReview(id: string, result: HumanReviewResult): Promise<void> {
    const request = this.requests.get(id);
    if (request) {
      request.status = 'completed';
      this.completedReviews.set(id, result);
    }
  }

  async getStats(): Promise<ReviewQueueStats> {
    const allRequests = Array.from(this.requests.values());
    const pending = allRequests.filter(
      (r) => r.status === 'pending' || r.status === 'in_progress'
    );

    const now = new Date();
    const byReason: Record<HumanReviewReason, number> = {
      score_disagreement: 0,
      low_confidence: 0,
      edge_case: 0,
      student_appeal: 0,
      random_sample: 0,
      quality_assurance: 0,
      new_rubric: 0,
      flagged_content: 0,
    };

    let totalWaitTime = 0;
    for (const req of pending) {
      byReason[req.reason] = (byReason[req.reason] ?? 0) + 1;
      totalWaitTime += now.getTime() - req.requestedAt.getTime();
    }

    const overdue = await this.getOverdueRequests();
    const completedToday = allRequests.filter((r) => {
      if (r.status !== 'completed') return false;
      const review = this.completedReviews.get(r.id);
      if (!review) return false;
      const reviewDate = review.reviewedAt;
      return (
        reviewDate.getFullYear() === now.getFullYear() &&
        reviewDate.getMonth() === now.getMonth() &&
        reviewDate.getDate() === now.getDate()
      );
    }).length;

    return {
      totalPending: pending.length,
      highPriorityPending: pending.filter(
        (r) => r.priority === 'high' || r.priority === 'urgent'
      ).length,
      averageWaitTimeHours:
        pending.length > 0 ? totalWaitTime / pending.length / 3600000 : 0,
      byReason,
      completedToday,
      overdue: overdue.length,
    };
  }

  async getOverdueRequests(): Promise<HumanReviewRequest[]> {
    const now = new Date();
    return Array.from(this.requests.values()).filter((r) => {
      if (r.status === 'completed' || r.status === 'cancelled') return false;
      if (!r.dueBy) return false;
      return r.dueBy < now;
    });
  }
}

// ============================================================================
// FLAGGER CONFIGURATION
// ============================================================================

/**
 * Flagger configuration
 */
export interface HumanReviewFlaggerConfig {
  /**
   * Score difference threshold for flagging (percentage points)
   */
  scoreDifferenceThreshold?: number;

  /**
   * Confidence threshold for flagging
   */
  confidenceThreshold?: number;

  /**
   * Random sampling rate (0-1)
   */
  randomSamplingRate?: number;

  /**
   * Default due date offset in hours
   */
  defaultDueHours?: number;

  /**
   * Priority score thresholds
   */
  priorityThresholds?: {
    urgent: number;
    high: number;
    medium: number;
  };

  /**
   * Store implementation
   */
  store?: HumanReviewStore;

  /**
   * Logger
   */
  logger?: FlaggerLogger;
}

/**
 * Logger interface
 */
export interface FlaggerLogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

/**
 * Default flagger configuration
 */
export const DEFAULT_FLAGGER_CONFIG: Required<Omit<HumanReviewFlaggerConfig, 'store' | 'logger'>> = {
  scoreDifferenceThreshold: 15,
  confidenceThreshold: 0.7,
  randomSamplingRate: 0.05, // 5% random sampling
  defaultDueHours: 48,
  priorityThresholds: {
    urgent: 25, // >25% score difference
    high: 20, // >20% score difference
    medium: 15, // >15% score difference
  },
};

// ============================================================================
// HUMAN REVIEW FLAGGER IMPLEMENTATION
// ============================================================================

/**
 * Result of flagging check
 */
export interface FlaggingResult {
  /**
   * Whether flagging is needed
   */
  shouldFlag: boolean;

  /**
   * Reason for flagging
   */
  reason?: HumanReviewReason;

  /**
   * Priority level
   */
  priority: 'low' | 'medium' | 'high' | 'urgent';

  /**
   * Detailed explanation
   */
  explanation: string;

  /**
   * Created request (if flagged)
   */
  request?: HumanReviewRequest;
}

/**
 * Human Review Flagger
 * Determines when evaluations need human review and manages the review queue
 */
export class HumanReviewFlagger {
  private readonly config: Required<Omit<HumanReviewFlaggerConfig, 'store' | 'logger'>>;
  private readonly store: HumanReviewStore;
  private readonly logger?: FlaggerLogger;
  private idCounter: number = 0;

  constructor(config: HumanReviewFlaggerConfig = {}) {
    this.config = { ...DEFAULT_FLAGGER_CONFIG, ...config };
    this.store = config.store ?? new InMemoryHumanReviewStore();
    this.logger = config.logger;
  }

  /**
   * Check if an evaluation should be flagged for human review
   */
  async checkAndFlag(
    evaluation: VerifiedEvaluation
  ): Promise<FlaggingResult> {
    const { verification } = evaluation;

    // Check various flagging conditions
    const checks = [
      this.checkScoreDisagreement(verification),
      this.checkLowConfidence(evaluation.allScores),
      this.checkEdgeCase(evaluation),
      this.checkRandomSampling(),
    ];

    // Find highest priority reason
    let highestPriorityResult: FlaggingResult | null = null;

    for (const check of checks) {
      if (check.shouldFlag) {
        if (
          !highestPriorityResult ||
          this.priorityRank(check.priority) > this.priorityRank(highestPriorityResult.priority)
        ) {
          highestPriorityResult = check;
        }
      }
    }

    if (highestPriorityResult && highestPriorityResult.shouldFlag && highestPriorityResult.reason) {
      const request = await this.createRequest(
        evaluation,
        highestPriorityResult.reason,
        highestPriorityResult.priority
      );
      highestPriorityResult.request = request;

      this.logger?.info('Evaluation flagged for human review', {
        evaluationId: evaluation.id,
        reason: highestPriorityResult.reason,
        priority: highestPriorityResult.priority,
      });
    }

    return (
      highestPriorityResult ?? {
        shouldFlag: false,
        priority: 'low',
        explanation: 'Evaluation does not require human review',
      }
    );
  }

  /**
   * Check for score disagreement
   */
  private checkScoreDisagreement(verification: VerificationResult): FlaggingResult {
    const diff = verification.percentageDifference;

    if (diff >= this.config.priorityThresholds.urgent) {
      return {
        shouldFlag: true,
        reason: 'score_disagreement',
        priority: 'urgent',
        explanation: `Critical score disagreement: ${Math.round(diff)}% difference between scorers`,
      };
    }

    if (diff >= this.config.priorityThresholds.high) {
      return {
        shouldFlag: true,
        reason: 'score_disagreement',
        priority: 'high',
        explanation: `High score disagreement: ${Math.round(diff)}% difference between scorers`,
      };
    }

    if (diff >= this.config.scoreDifferenceThreshold) {
      return {
        shouldFlag: true,
        reason: 'score_disagreement',
        priority: 'medium',
        explanation: `Score disagreement: ${Math.round(diff)}% difference between scorers`,
      };
    }

    return {
      shouldFlag: false,
      priority: 'low',
      explanation: 'Scores are within acceptable range',
    };
  }

  /**
   * Check for low confidence
   */
  private checkLowConfidence(scores: ScoreResult[]): FlaggingResult {
    const avgConfidence =
      scores.reduce((sum, s) => sum + s.confidence, 0) / scores.length;

    if (avgConfidence < this.config.confidenceThreshold * 0.5) {
      return {
        shouldFlag: true,
        reason: 'low_confidence',
        priority: 'high',
        explanation: `Very low confidence: ${Math.round(avgConfidence * 100)}%`,
      };
    }

    if (avgConfidence < this.config.confidenceThreshold) {
      return {
        shouldFlag: true,
        reason: 'low_confidence',
        priority: 'medium',
        explanation: `Low confidence: ${Math.round(avgConfidence * 100)}%`,
      };
    }

    return {
      shouldFlag: false,
      priority: 'low',
      explanation: 'Confidence is acceptable',
    };
  }

  /**
   * Check for edge cases
   */
  private checkEdgeCase(evaluation: VerifiedEvaluation): FlaggingResult {
    const score = evaluation.finalScore.percentage;

    // Check for extreme scores
    if (score === 0 || score === 100) {
      return {
        shouldFlag: true,
        reason: 'edge_case',
        priority: 'medium',
        explanation: `Extreme score detected: ${score}%`,
      };
    }

    // Check for borderline grades
    const gradeThresholds = [60, 70, 80, 90];
    for (const threshold of gradeThresholds) {
      if (Math.abs(score - threshold) <= 1) {
        return {
          shouldFlag: true,
          reason: 'edge_case',
          priority: 'low',
          explanation: `Borderline score: ${score}% (near ${threshold}% threshold)`,
        };
      }
    }

    return {
      shouldFlag: false,
      priority: 'low',
      explanation: 'No edge case detected',
    };
  }

  /**
   * Random sampling for quality assurance
   */
  private checkRandomSampling(): FlaggingResult {
    if (Math.random() < this.config.randomSamplingRate) {
      return {
        shouldFlag: true,
        reason: 'random_sample',
        priority: 'low',
        explanation: 'Selected for quality assurance random sampling',
      };
    }

    return {
      shouldFlag: false,
      priority: 'low',
      explanation: 'Not selected for random sampling',
    };
  }

  /**
   * Create a review request
   */
  private async createRequest(
    evaluation: VerifiedEvaluation,
    reason: HumanReviewReason,
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): Promise<HumanReviewRequest> {
    const request: HumanReviewRequest = {
      id: this.generateId(),
      evaluationId: evaluation.id,
      responseId: evaluation.responseId,
      studentId: evaluation.studentId,
      reason,
      priority,
      scores: evaluation.allScores,
      scoreDifference: evaluation.verification.percentageDifference,
      requestedAt: new Date(),
      status: 'pending',
      dueBy: this.calculateDueDate(priority),
    };

    await this.store.addRequest(request);
    return request;
  }

  /**
   * Flag for student appeal
   */
  async flagForAppeal(
    evaluation: VerifiedEvaluation,
    appealReason: string
  ): Promise<HumanReviewRequest> {
    const request: HumanReviewRequest = {
      id: this.generateId(),
      evaluationId: evaluation.id,
      responseId: evaluation.responseId,
      studentId: evaluation.studentId,
      reason: 'student_appeal',
      priority: 'high',
      scores: evaluation.allScores,
      scoreDifference: evaluation.verification.percentageDifference,
      requestedAt: new Date(),
      status: 'pending',
      dueBy: this.calculateDueDate('high'),
    };

    await this.store.addRequest(request);

    this.logger?.info('Student appeal flagged', {
      evaluationId: evaluation.id,
      appealReason,
    });

    return request;
  }

  /**
   * Flag for new rubric quality check
   */
  async flagForNewRubric(
    evaluation: VerifiedEvaluation,
    rubricVersion: string
  ): Promise<HumanReviewRequest> {
    const request: HumanReviewRequest = {
      id: this.generateId(),
      evaluationId: evaluation.id,
      responseId: evaluation.responseId,
      studentId: evaluation.studentId,
      reason: 'new_rubric',
      priority: 'medium',
      scores: evaluation.allScores,
      scoreDifference: evaluation.verification.percentageDifference,
      requestedAt: new Date(),
      status: 'pending',
      dueBy: this.calculateDueDate('medium'),
    };

    await this.store.addRequest(request);

    this.logger?.info('New rubric review flagged', {
      evaluationId: evaluation.id,
      rubricVersion,
    });

    return request;
  }

  /**
   * Assign a reviewer to a request
   */
  async assignReviewer(requestId: string, reviewerId: string): Promise<void> {
    await this.store.assignReviewer(requestId, reviewerId);
    this.logger?.info('Reviewer assigned', { requestId, reviewerId });
  }

  /**
   * Complete a review
   */
  async completeReview(
    requestId: string,
    reviewerId: string,
    finalScore: number,
    feedback: string,
    overrideReason?: string
  ): Promise<HumanReviewResult> {
    const result: HumanReviewResult = {
      reviewerId,
      finalScore,
      feedback,
      overrideReason,
      reviewedAt: new Date(),
    };

    await this.store.completeReview(requestId, result);

    this.logger?.info('Review completed', {
      requestId,
      reviewerId,
      finalScore,
      hasOverride: !!overrideReason,
    });

    return result;
  }

  /**
   * Get pending reviews
   */
  async getPendingReviews(): Promise<HumanReviewRequest[]> {
    return this.store.getPendingRequests();
  }

  /**
   * Get reviews by priority
   */
  async getReviewsByPriority(
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): Promise<HumanReviewRequest[]> {
    return this.store.getRequestsByPriority(priority);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<ReviewQueueStats> {
    return this.store.getStats();
  }

  /**
   * Get overdue reviews
   */
  async getOverdueReviews(): Promise<HumanReviewRequest[]> {
    return this.store.getOverdueRequests();
  }

  /**
   * Calculate due date based on priority
   */
  private calculateDueDate(priority: 'low' | 'medium' | 'high' | 'urgent'): Date {
    const hoursMultiplier: Record<string, number> = {
      urgent: 0.25, // 6 hours
      high: 0.5, // 12 hours
      medium: 1, // 24 hours
      low: 2, // 48 hours
    };

    const hours = this.config.defaultDueHours * (hoursMultiplier[priority] ?? 1);
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + hours);
    return dueDate;
  }

  /**
   * Get priority rank for comparison
   */
  private priorityRank(priority: 'low' | 'medium' | 'high' | 'urgent'): number {
    const ranks: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      urgent: 4,
    };
    return ranks[priority] ?? 0;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `hr-${++this.idCounter}-${Date.now().toString(36)}`;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

// Default store singleton
let defaultStore: HumanReviewStore | null = null;

/**
 * Get default human review store
 */
export function getDefaultHumanReviewStore(): HumanReviewStore {
  if (!defaultStore) {
    defaultStore = new InMemoryHumanReviewStore();
  }
  return defaultStore;
}

/**
 * Reset default store (for testing)
 */
export function resetDefaultHumanReviewStore(): void {
  defaultStore = null;
}

/**
 * Create a human review flagger
 */
export function createHumanReviewFlagger(
  config?: HumanReviewFlaggerConfig
): HumanReviewFlagger {
  return new HumanReviewFlagger(config);
}

/**
 * Create a strict flagger (lower thresholds, more flagging)
 */
export function createStrictFlagger(): HumanReviewFlagger {
  return new HumanReviewFlagger({
    scoreDifferenceThreshold: 10,
    confidenceThreshold: 0.8,
    randomSamplingRate: 0.1,
    priorityThresholds: {
      urgent: 20,
      high: 15,
      medium: 10,
    },
  });
}

/**
 * Create a lenient flagger (higher thresholds, less flagging)
 */
export function createLenientFlagger(): HumanReviewFlagger {
  return new HumanReviewFlagger({
    scoreDifferenceThreshold: 20,
    confidenceThreshold: 0.6,
    randomSamplingRate: 0.02,
    priorityThresholds: {
      urgent: 30,
      high: 25,
      medium: 20,
    },
  });
}
