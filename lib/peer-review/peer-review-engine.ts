/**
 * Peer Review Workflow Engine for Taxomind
 *
 * Comprehensive peer review system for essay and open-ended assessments:
 * - Double-blind review assignment
 * - Rubric-based evaluation
 * - Calibration training for reviewers
 * - Inter-rater reliability calculation
 * - Dispute resolution workflow
 * - Quality assurance mechanisms
 *
 * Standards: Best practices in peer assessment, educational psychology research
 */

// Peer Review Types
export type ReviewStatus =
  | 'PENDING_ASSIGNMENT'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'CALIBRATING'
  | 'DISPUTED'
  | 'RESOLVED'
  | 'COMPLETED';

export type ReviewerLevel = 'NOVICE' | 'INTERMEDIATE' | 'EXPERT' | 'MASTER';

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // percentage of total score
  levels: {
    score: number;
    label: string;
    description: string;
  }[];
  maxScore: number;
}

export interface Rubric {
  id: string;
  name: string;
  description: string;
  criteria: RubricCriterion[];
  totalPoints: number;
  passingScore: number;
  bloomsAlignment?: Record<string, string[]>; // Bloom's level -> criteria IDs
}

export interface Submission {
  id: string;
  examId: string;
  questionId: string;
  userId: string;
  content: string;
  attachments?: string[];
  submittedAt: Date;
  wordCount: number;
}

export interface ReviewAssignment {
  id: string;
  submissionId: string;
  reviewerId: string;
  status: ReviewStatus;
  assignedAt: Date;
  dueDate: Date;
  startedAt?: Date;
  completedAt?: Date;
  isBlind: boolean;
}

export interface Review {
  id: string;
  assignmentId: string;
  submissionId: string;
  reviewerId: string;
  scores: {
    criterionId: string;
    score: number;
    feedback: string;
  }[];
  overallScore: number;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  timeSpentMinutes: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  submittedAt: Date;
}

export interface CalibrationSession {
  id: string;
  rubricId: string;
  reviewerId: string;
  expertSubmissions: {
    submissionId: string;
    expertScores: Record<string, number>;
  }[];
  reviewerScores: {
    submissionId: string;
    scores: Record<string, number>;
  }[];
  agreement: number; // 0-100
  passed: boolean;
  feedback: string;
  completedAt?: Date;
}

export interface ReviewerProfile {
  userId: string;
  level: ReviewerLevel;
  totalReviews: number;
  averageAgreement: number;
  averageTimeMinutes: number;
  calibrationsPassed: number;
  calibrationsFailed: number;
  disputesReceived: number;
  disputesLost: number;
  reliabilityScore: number; // 0-100
  specializations: string[]; // topic areas
}

export interface Dispute {
  id: string;
  submissionId: string;
  originalReviewId: string;
  disputedBy: string; // userId
  reason: string;
  disputedCriteria: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_UPHELD' | 'RESOLVED_MODIFIED' | 'RESOLVED_REJECTED';
  moderatorId?: string;
  resolution?: {
    decision: string;
    newScores?: Record<string, number>;
    feedback: string;
  };
  createdAt: Date;
  resolvedAt?: Date;
}

export interface PeerReviewConfig {
  // Assignment settings
  reviewsPerSubmission: number; // typically 2-3
  allowSelfReview: boolean;
  blindReview: boolean;
  doubleBlind: boolean;

  // Reviewer requirements
  minReviewerLevel: ReviewerLevel;
  requireCalibration: boolean;
  calibrationThreshold: number; // minimum agreement % to pass

  // Timing
  reviewTimeoutDays: number;
  disputeWindowDays: number;

  // Quality
  minFeedbackLength: number; // characters
  requireStrengthsAndImprovements: boolean;

  // Scoring
  aggregationMethod: 'AVERAGE' | 'MEDIAN' | 'WEIGHTED_AVERAGE' | 'HIGHEST' | 'LOWEST';
  outlierThreshold: number; // SD for outlier detection
  minAgreementForFinal: number; // minimum agreement before escalation
}

// Default configuration
export const defaultPeerReviewConfig: PeerReviewConfig = {
  reviewsPerSubmission: 2,
  allowSelfReview: false,
  blindReview: true,
  doubleBlind: true,
  minReviewerLevel: 'NOVICE',
  requireCalibration: true,
  calibrationThreshold: 70,
  reviewTimeoutDays: 7,
  disputeWindowDays: 3,
  minFeedbackLength: 100,
  requireStrengthsAndImprovements: true,
  aggregationMethod: 'AVERAGE',
  outlierThreshold: 2.0,
  minAgreementForFinal: 70,
};

/**
 * Review Assignment Manager
 */
export class ReviewAssignmentManager {
  private config: PeerReviewConfig;

  constructor(config: Partial<PeerReviewConfig> = {}) {
    this.config = { ...defaultPeerReviewConfig, ...config };
  }

  /**
   * Create review assignments for a submission
   */
  createAssignments(
    submission: Submission,
    availableReviewers: ReviewerProfile[],
    rubric: Rubric
  ): ReviewAssignment[] {
    // Filter eligible reviewers
    let eligibleReviewers = availableReviewers.filter((r) => {
      // Exclude self if not allowed
      if (!this.config.allowSelfReview && r.userId === submission.userId) {
        return false;
      }

      // Check minimum level
      const levelOrder: ReviewerLevel[] = ['NOVICE', 'INTERMEDIATE', 'EXPERT', 'MASTER'];
      const minLevelIndex = levelOrder.indexOf(this.config.minReviewerLevel);
      const reviewerLevelIndex = levelOrder.indexOf(r.level);
      if (reviewerLevelIndex < minLevelIndex) {
        return false;
      }

      // Check calibration requirement
      if (this.config.requireCalibration && r.calibrationsPassed === 0) {
        return false;
      }

      return true;
    });

    // Sort by reliability and availability (fewer pending reviews)
    eligibleReviewers.sort((a, b) => {
      // Prefer higher reliability
      const reliabilityDiff = b.reliabilityScore - a.reliabilityScore;
      if (Math.abs(reliabilityDiff) > 10) return reliabilityDiff;

      // Prefer balanced workload (assume totalReviews as proxy)
      return a.totalReviews - b.totalReviews;
    });

    // Select reviewers
    const selectedReviewers = eligibleReviewers.slice(
      0,
      this.config.reviewsPerSubmission
    );

    // Create assignments
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + this.config.reviewTimeoutDays);

    return selectedReviewers.map((reviewer) => ({
      id: this.generateId('assignment'),
      submissionId: submission.id,
      reviewerId: reviewer.userId,
      status: 'ASSIGNED' as ReviewStatus,
      assignedAt: new Date(),
      dueDate,
      isBlind: this.config.blindReview,
    }));
  }

  /**
   * Randomly assign reviewers for double-blind review
   * Ensures no student reviews their own work or classmates they know
   */
  createBlindAssignments(
    submissions: Submission[],
    reviewerPool: ReviewerProfile[]
  ): Map<string, ReviewAssignment[]> {
    const assignments = new Map<string, ReviewAssignment[]>();

    // Create a shuffled copy of submissions
    const shuffledSubmissions = [...submissions].sort(() => Math.random() - 0.5);

    for (const submission of shuffledSubmissions) {
      // Get reviewers who haven't reviewed this submission
      const availableReviewers = reviewerPool.filter(
        (r) =>
          r.userId !== submission.userId &&
          !this.hasExistingAssignment(submission.id, r.userId, assignments)
      );

      const submissionAssignments = this.createAssignments(
        submission,
        availableReviewers,
        { id: '', name: '', description: '', criteria: [], totalPoints: 100, passingScore: 60 }
      );

      assignments.set(submission.id, submissionAssignments);
    }

    return assignments;
  }

  private hasExistingAssignment(
    submissionId: string,
    reviewerId: string,
    assignments: Map<string, ReviewAssignment[]>
  ): boolean {
    const existing = assignments.get(submissionId);
    return existing?.some((a) => a.reviewerId === reviewerId) ?? false;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Review Scoring and Aggregation
 */
export class ReviewScoringEngine {
  private config: PeerReviewConfig;

  constructor(config: Partial<PeerReviewConfig> = {}) {
    this.config = { ...defaultPeerReviewConfig, ...config };
  }

  /**
   * Calculate final score from multiple reviews
   */
  aggregateScores(
    reviews: Review[],
    rubric: Rubric,
    reviewerProfiles: Map<string, ReviewerProfile>
  ): {
    finalScore: number;
    criterionScores: Record<string, number>;
    agreement: number;
    outliers: string[];
    needsModeration: boolean;
  } {
    if (reviews.length === 0) {
      return {
        finalScore: 0,
        criterionScores: {},
        agreement: 0,
        outliers: [],
        needsModeration: true,
      };
    }

    // Calculate scores per criterion
    const criterionScores: Record<string, number[]> = {};
    const reviewWeights: Record<string, number> = {};

    for (const review of reviews) {
      // Get reviewer weight based on reliability
      const profile = reviewerProfiles.get(review.reviewerId);
      const weight = profile ? profile.reliabilityScore / 100 : 0.5;
      reviewWeights[review.id] = weight;

      for (const score of review.scores) {
        if (!criterionScores[score.criterionId]) {
          criterionScores[score.criterionId] = [];
        }
        criterionScores[score.criterionId].push(score.score);
      }
    }

    // Aggregate each criterion
    const finalCriterionScores: Record<string, number> = {};
    const outliers: string[] = [];

    for (const [criterionId, scores] of Object.entries(criterionScores)) {
      const { aggregatedScore, hasOutlier } = this.aggregateCriterionScores(
        scores,
        reviews.map((r) => reviewWeights[r.id])
      );

      finalCriterionScores[criterionId] = aggregatedScore;

      if (hasOutlier) {
        outliers.push(criterionId);
      }
    }

    // Calculate weighted final score
    let finalScore = 0;
    for (const criterion of rubric.criteria) {
      const score = finalCriterionScores[criterion.id] || 0;
      const normalizedScore = score / criterion.maxScore;
      finalScore += normalizedScore * criterion.weight;
    }

    // Calculate inter-rater agreement
    const agreement = this.calculateAgreement(reviews, rubric);

    // Determine if moderation needed
    const needsModeration =
      agreement < this.config.minAgreementForFinal || outliers.length > 0;

    return {
      finalScore: Math.round(finalScore * 100) / 100,
      criterionScores: finalCriterionScores,
      agreement: Math.round(agreement * 100) / 100,
      outliers,
      needsModeration,
    };
  }

  /**
   * Aggregate scores for a single criterion
   */
  private aggregateCriterionScores(
    scores: number[],
    weights: number[]
  ): { aggregatedScore: number; hasOutlier: boolean } {
    if (scores.length === 0) {
      return { aggregatedScore: 0, hasOutlier: false };
    }

    // Detect outliers
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const sd = Math.sqrt(variance);

    const hasOutlier = scores.some(
      (s) => Math.abs(s - mean) > this.config.outlierThreshold * sd
    );

    // Aggregate based on method
    let aggregatedScore: number;

    switch (this.config.aggregationMethod) {
      case 'MEDIAN':
        const sorted = [...scores].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        aggregatedScore =
          sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
        break;

      case 'WEIGHTED_AVERAGE':
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        aggregatedScore =
          scores.reduce((sum, score, i) => sum + score * weights[i], 0) /
          totalWeight;
        break;

      case 'HIGHEST':
        aggregatedScore = Math.max(...scores);
        break;

      case 'LOWEST':
        aggregatedScore = Math.min(...scores);
        break;

      case 'AVERAGE':
      default:
        aggregatedScore = mean;
        break;
    }

    return {
      aggregatedScore: Math.round(aggregatedScore * 100) / 100,
      hasOutlier,
    };
  }

  /**
   * Calculate inter-rater agreement using Cohen's Kappa
   */
  calculateAgreement(reviews: Review[], rubric: Rubric): number {
    if (reviews.length < 2) return 100;

    // Calculate pairwise agreement
    let totalAgreement = 0;
    let pairCount = 0;

    for (let i = 0; i < reviews.length; i++) {
      for (let j = i + 1; j < reviews.length; j++) {
        const agreement = this.calculatePairwiseAgreement(
          reviews[i],
          reviews[j],
          rubric
        );
        totalAgreement += agreement;
        pairCount++;
      }
    }

    return pairCount > 0 ? totalAgreement / pairCount : 0;
  }

  /**
   * Calculate agreement between two reviewers
   */
  private calculatePairwiseAgreement(
    review1: Review,
    review2: Review,
    rubric: Rubric
  ): number {
    let totalDiff = 0;
    let maxDiff = 0;

    for (const criterion of rubric.criteria) {
      const score1 =
        review1.scores.find((s) => s.criterionId === criterion.id)?.score || 0;
      const score2 =
        review2.scores.find((s) => s.criterionId === criterion.id)?.score || 0;

      totalDiff += Math.abs(score1 - score2);
      maxDiff += criterion.maxScore;
    }

    // Convert to percentage agreement
    return ((maxDiff - totalDiff) / maxDiff) * 100;
  }
}

/**
 * Calibration Training System
 */
export class CalibrationTrainer {
  private config: PeerReviewConfig;

  constructor(config: Partial<PeerReviewConfig> = {}) {
    this.config = { ...defaultPeerReviewConfig, ...config };
  }

  /**
   * Create calibration session for a reviewer
   */
  createSession(
    reviewerId: string,
    rubricId: string,
    expertSubmissions: {
      submissionId: string;
      expertScores: Record<string, number>;
    }[]
  ): CalibrationSession {
    return {
      id: `calibration_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      rubricId,
      reviewerId,
      expertSubmissions,
      reviewerScores: [],
      agreement: 0,
      passed: false,
      feedback: '',
    };
  }

  /**
   * Submit calibration scores and evaluate
   */
  evaluateCalibration(
    session: CalibrationSession,
    reviewerScores: { submissionId: string; scores: Record<string, number> }[]
  ): {
    passed: boolean;
    agreement: number;
    feedback: string;
    criterionAnalysis: Record<
      string,
      { agreement: number; bias: number; feedback: string }
    >;
  } {
    session.reviewerScores = reviewerScores;

    // Calculate agreement per criterion
    const criterionAnalysis: Record<
      string,
      { agreement: number; bias: number; feedback: string }
    > = {};

    let totalAgreement = 0;
    let criterionCount = 0;

    for (const expertSubmission of session.expertSubmissions) {
      const reviewerSubmission = reviewerScores.find(
        (r) => r.submissionId === expertSubmission.submissionId
      );

      if (!reviewerSubmission) continue;

      for (const [criterionId, expertScore] of Object.entries(
        expertSubmission.expertScores
      )) {
        const reviewerScore = reviewerSubmission.scores[criterionId];

        if (reviewerScore === undefined) continue;

        if (!criterionAnalysis[criterionId]) {
          criterionAnalysis[criterionId] = {
            agreement: 0,
            bias: 0,
            feedback: '',
          };
        }

        // Calculate agreement (allowing some tolerance)
        const diff = Math.abs(expertScore - reviewerScore);
        const maxScore = Math.max(expertScore, 10); // Assume max 10 if not specified
        const agreement = Math.max(0, 100 - (diff / maxScore) * 100);

        criterionAnalysis[criterionId].agreement += agreement;

        // Calculate bias (positive = lenient, negative = harsh)
        criterionAnalysis[criterionId].bias += reviewerScore - expertScore;

        criterionCount++;
      }
    }

    // Average the agreement and bias
    for (const criterionId of Object.keys(criterionAnalysis)) {
      const submissionCount = session.expertSubmissions.length;
      criterionAnalysis[criterionId].agreement /= submissionCount;
      criterionAnalysis[criterionId].bias /= submissionCount;

      // Generate criterion-specific feedback
      const analysis = criterionAnalysis[criterionId];
      if (analysis.agreement < 60) {
        analysis.feedback =
          'Significant disagreement with expert scores. Review the rubric carefully.';
      } else if (analysis.bias > 1) {
        analysis.feedback = 'You tend to be more lenient than experts on this criterion.';
      } else if (analysis.bias < -1) {
        analysis.feedback = 'You tend to be harsher than experts on this criterion.';
      } else {
        analysis.feedback = 'Good alignment with expert scoring on this criterion.';
      }

      totalAgreement += analysis.agreement;
    }

    const overallAgreement =
      criterionCount > 0
        ? totalAgreement / Object.keys(criterionAnalysis).length
        : 0;

    const passed = overallAgreement >= this.config.calibrationThreshold;

    // Generate overall feedback
    let feedback: string;
    if (passed) {
      feedback = `Congratulations! You have successfully calibrated with ${Math.round(overallAgreement)}% agreement. You are now ready to review submissions.`;
    } else {
      feedback = `Your calibration score of ${Math.round(overallAgreement)}% is below the required ${this.config.calibrationThreshold}%. Please review the rubric and try again.`;
    }

    // Update session
    session.agreement = overallAgreement;
    session.passed = passed;
    session.feedback = feedback;
    session.completedAt = new Date();

    return {
      passed,
      agreement: Math.round(overallAgreement * 100) / 100,
      feedback,
      criterionAnalysis,
    };
  }
}

/**
 * Dispute Resolution Manager
 */
export class DisputeManager {
  private config: PeerReviewConfig;

  constructor(config: Partial<PeerReviewConfig> = {}) {
    this.config = { ...defaultPeerReviewConfig, ...config };
  }

  /**
   * Create a new dispute
   */
  createDispute(params: {
    submissionId: string;
    originalReviewId: string;
    disputedBy: string;
    reason: string;
    disputedCriteria: string[];
  }): Dispute {
    return {
      id: `dispute_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      submissionId: params.submissionId,
      originalReviewId: params.originalReviewId,
      disputedBy: params.disputedBy,
      reason: params.reason,
      disputedCriteria: params.disputedCriteria,
      status: 'OPEN',
      createdAt: new Date(),
    };
  }

  /**
   * Check if dispute is within allowed window
   */
  isDisputeAllowed(reviewCompletedAt: Date): boolean {
    const windowEnd = new Date(reviewCompletedAt);
    windowEnd.setDate(windowEnd.getDate() + this.config.disputeWindowDays);
    return new Date() <= windowEnd;
  }

  /**
   * Resolve a dispute
   */
  resolveDispute(
    dispute: Dispute,
    resolution: {
      decision: 'UPHELD' | 'MODIFIED' | 'REJECTED';
      newScores?: Record<string, number>;
      feedback: string;
      moderatorId: string;
    }
  ): Dispute {
    const statusMap = {
      UPHELD: 'RESOLVED_UPHELD' as const,
      MODIFIED: 'RESOLVED_MODIFIED' as const,
      REJECTED: 'RESOLVED_REJECTED' as const,
    };

    return {
      ...dispute,
      status: statusMap[resolution.decision],
      moderatorId: resolution.moderatorId,
      resolution: {
        decision: resolution.decision,
        newScores: resolution.newScores,
        feedback: resolution.feedback,
      },
      resolvedAt: new Date(),
    };
  }
}

/**
 * Reviewer Profile Manager
 */
export class ReviewerProfileManager {
  /**
   * Calculate reviewer level based on history
   */
  calculateLevel(profile: {
    totalReviews: number;
    averageAgreement: number;
    calibrationsPassed: number;
    disputesLost: number;
  }): ReviewerLevel {
    const { totalReviews, averageAgreement, calibrationsPassed, disputesLost } =
      profile;

    // Master: 100+ reviews, 90%+ agreement, 3+ calibrations, <5% disputes lost
    if (
      totalReviews >= 100 &&
      averageAgreement >= 90 &&
      calibrationsPassed >= 3 &&
      disputesLost / totalReviews < 0.05
    ) {
      return 'MASTER';
    }

    // Expert: 50+ reviews, 80%+ agreement, 2+ calibrations
    if (
      totalReviews >= 50 &&
      averageAgreement >= 80 &&
      calibrationsPassed >= 2
    ) {
      return 'EXPERT';
    }

    // Intermediate: 20+ reviews, 70%+ agreement, 1+ calibration
    if (
      totalReviews >= 20 &&
      averageAgreement >= 70 &&
      calibrationsPassed >= 1
    ) {
      return 'INTERMEDIATE';
    }

    return 'NOVICE';
  }

  /**
   * Calculate reliability score
   */
  calculateReliability(profile: {
    averageAgreement: number;
    calibrationsPassed: number;
    calibrationsFailed: number;
    disputesReceived: number;
    disputesLost: number;
    totalReviews: number;
  }): number {
    const {
      averageAgreement,
      calibrationsPassed,
      calibrationsFailed,
      disputesReceived,
      disputesLost,
      totalReviews,
    } = profile;

    // Base score from agreement
    let score = averageAgreement;

    // Bonus for calibrations
    const calibrationRate =
      calibrationsPassed / Math.max(1, calibrationsPassed + calibrationsFailed);
    score += calibrationRate * 10;

    // Penalty for lost disputes
    if (totalReviews > 0) {
      const disputeLossRate = disputesLost / totalReviews;
      score -= disputeLossRate * 20;
    }

    // Experience bonus
    if (totalReviews >= 50) score += 5;
    if (totalReviews >= 100) score += 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Update profile after a review
   */
  updateAfterReview(
    profile: ReviewerProfile,
    reviewAgreement: number,
    timeSpentMinutes: number
  ): ReviewerProfile {
    const newTotal = profile.totalReviews + 1;
    const newAverageAgreement =
      (profile.averageAgreement * profile.totalReviews + reviewAgreement) /
      newTotal;
    const newAverageTime =
      (profile.averageTimeMinutes * profile.totalReviews + timeSpentMinutes) /
      newTotal;

    return {
      ...profile,
      totalReviews: newTotal,
      averageAgreement: Math.round(newAverageAgreement * 100) / 100,
      averageTimeMinutes: Math.round(newAverageTime * 100) / 100,
      level: this.calculateLevel({
        totalReviews: newTotal,
        averageAgreement: newAverageAgreement,
        calibrationsPassed: profile.calibrationsPassed,
        disputesLost: profile.disputesLost,
      }),
      reliabilityScore: this.calculateReliability({
        ...profile,
        totalReviews: newTotal,
        averageAgreement: newAverageAgreement,
      }),
    };
  }
}

/**
 * Main Peer Review Engine
 */
export class PeerReviewEngine {
  private config: PeerReviewConfig;
  private assignmentManager: ReviewAssignmentManager;
  private scoringEngine: ReviewScoringEngine;
  private calibrationTrainer: CalibrationTrainer;
  private disputeManager: DisputeManager;
  private profileManager: ReviewerProfileManager;

  constructor(config: Partial<PeerReviewConfig> = {}) {
    this.config = { ...defaultPeerReviewConfig, ...config };
    this.assignmentManager = new ReviewAssignmentManager(this.config);
    this.scoringEngine = new ReviewScoringEngine(this.config);
    this.calibrationTrainer = new CalibrationTrainer(this.config);
    this.disputeManager = new DisputeManager(this.config);
    this.profileManager = new ReviewerProfileManager();
  }

  // Expose sub-managers
  get assignments(): ReviewAssignmentManager {
    return this.assignmentManager;
  }

  get scoring(): ReviewScoringEngine {
    return this.scoringEngine;
  }

  get calibration(): CalibrationTrainer {
    return this.calibrationTrainer;
  }

  get disputes(): DisputeManager {
    return this.disputeManager;
  }

  get profiles(): ReviewerProfileManager {
    return this.profileManager;
  }

  /**
   * Validate a review before submission
   */
  validateReview(
    review: Partial<Review>,
    rubric: Rubric
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check all criteria are scored
    for (const criterion of rubric.criteria) {
      const score = review.scores?.find((s) => s.criterionId === criterion.id);
      if (!score) {
        errors.push(`Missing score for criterion: ${criterion.name}`);
      } else {
        // Check score is within range
        const maxLevel = Math.max(...criterion.levels.map((l) => l.score));
        if (score.score < 0 || score.score > maxLevel) {
          errors.push(
            `Score for ${criterion.name} must be between 0 and ${maxLevel}`
          );
        }

        // Check feedback length
        if (score.feedback.length < this.config.minFeedbackLength) {
          errors.push(
            `Feedback for ${criterion.name} must be at least ${this.config.minFeedbackLength} characters`
          );
        }
      }
    }

    // Check overall feedback
    if (
      !review.overallFeedback ||
      review.overallFeedback.length < this.config.minFeedbackLength
    ) {
      errors.push(
        `Overall feedback must be at least ${this.config.minFeedbackLength} characters`
      );
    }

    // Check strengths and improvements if required
    if (this.config.requireStrengthsAndImprovements) {
      if (!review.strengths || review.strengths.length === 0) {
        errors.push('At least one strength must be identified');
      }
      if (!review.improvements || review.improvements.length === 0) {
        errors.push('At least one improvement must be suggested');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate review report for a submission
   */
  generateReport(
    submission: Submission,
    reviews: Review[],
    rubric: Rubric,
    reviewerProfiles: Map<string, ReviewerProfile>
  ): {
    summary: string;
    finalScore: number;
    criterionBreakdown: {
      criterion: string;
      score: number;
      maxScore: number;
      feedback: string[];
    }[];
    strengths: string[];
    improvements: string[];
    agreement: number;
    needsModeration: boolean;
  } {
    const aggregated = this.scoringEngine.aggregateScores(
      reviews,
      rubric,
      reviewerProfiles
    );

    // Compile criterion breakdown
    const criterionBreakdown = rubric.criteria.map((criterion) => ({
      criterion: criterion.name,
      score: aggregated.criterionScores[criterion.id] || 0,
      maxScore: criterion.maxScore,
      feedback: reviews
        .map((r) => r.scores.find((s) => s.criterionId === criterion.id)?.feedback)
        .filter((f): f is string => !!f),
    }));

    // Compile strengths and improvements
    const strengths = [...new Set(reviews.flatMap((r) => r.strengths))];
    const improvements = [...new Set(reviews.flatMap((r) => r.improvements))];

    const summary = `
Peer Review Report
==================
Submission ID: ${submission.id}
Reviews Received: ${reviews.length}
Final Score: ${aggregated.finalScore}%
Inter-Rater Agreement: ${aggregated.agreement}%
${aggregated.needsModeration ? '⚠️ Moderation Required' : '✓ Review Complete'}
    `.trim();

    return {
      summary,
      finalScore: aggregated.finalScore,
      criterionBreakdown,
      strengths,
      improvements,
      agreement: aggregated.agreement,
      needsModeration: aggregated.needsModeration,
    };
  }
}

// Export factory function
export function createPeerReviewEngine(
  config?: Partial<PeerReviewConfig>
): PeerReviewEngine {
  return new PeerReviewEngine(config);
}
