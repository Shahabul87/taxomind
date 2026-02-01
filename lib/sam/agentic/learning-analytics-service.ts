/**
 * Learning Analytics Service
 *
 * Session recording, skill assessment, recommendation generation,
 * progress reporting, and skill map visualization.
 */

import {
  ProgressAnalyzer,
  SkillAssessor,
  RecommendationEngine,
  createProgressAnalyzer,
  createSkillAssessor,
  createRecommendationEngine,
  type ProgressReport,
  type SkillAssessment,
  type RecommendationBatch,
  type SkillMap,
  AssessmentSource,
  TimePeriod,
} from '@sam-ai/agentic';

import { getTaxomindContext } from '../taxomind-context';
import type { AgenticLogger } from './types';

// ============================================================================
// SERVICE
// ============================================================================

export class LearningAnalyticsService {
  private progressAnalyzer?: ProgressAnalyzer;
  private skillAssessor?: SkillAssessor;
  private recommendationEngine?: RecommendationEngine;

  constructor(
    private readonly userId: string,
    private readonly logger: AgenticLogger,
  ) {}

  /** Initialize analytics components with stores from context */
  initialize(): void {
    const context = getTaxomindContext();
    const { stores } = context;

    this.progressAnalyzer = createProgressAnalyzer({
      logger: this.logger,
      sessionStore: stores.learningSession,
      progressStore: stores.topicProgress,
      gapStore: stores.learningGap,
    });
    this.skillAssessor = createSkillAssessor({
      logger: this.logger,
      store: stores.skillAssessment,
    });
    this.recommendationEngine = createRecommendationEngine({
      logger: this.logger,
      recommendationStore: stores.recommendation,
      contentStore: stores.content,
    });

    this.logger.debug('Learning Analytics initialized');
  }

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------

  async recordSession(session: {
    topicId: string;
    duration: number;
    questionsAnswered?: number;
    correctAnswers?: number;
    conceptsCovered?: string[];
  }): Promise<void> {
    if (!this.progressAnalyzer) {
      throw new Error('Learning Analytics not enabled');
    }

    await this.progressAnalyzer.recordSession({
      userId: this.userId,
      ...session,
    });

    this.logger.info('Session recorded', {
      topicId: session.topicId,
      duration: session.duration,
    });
  }

  async assessSkill(
    skillId: string,
    score: number,
    maxScore: number,
    source: 'quiz' | 'exercise' | 'project' | 'self_assessment',
  ): Promise<SkillAssessment> {
    if (!this.skillAssessor) {
      throw new Error('Learning Analytics not enabled');
    }

    const sourceMap: Record<string, AssessmentSource> = {
      quiz: AssessmentSource.QUIZ,
      exercise: AssessmentSource.EXERCISE,
      project: AssessmentSource.PROJECT,
      self_assessment: AssessmentSource.SELF_ASSESSMENT,
    };

    const assessment = await this.skillAssessor.assessSkill({
      userId: this.userId,
      skillId,
      score,
      maxScore,
      source: sourceMap[source],
    });

    this.logger.info('Skill assessed', {
      skillId,
      score,
      level: assessment.level,
    });

    return assessment;
  }

  async getRecommendations(options?: {
    availableTime?: number;
    learningStyle?: string;
    goals?: string[];
  }): Promise<RecommendationBatch> {
    if (!this.recommendationEngine) {
      throw new Error('Learning Analytics not enabled');
    }

    const batch = await this.recommendationEngine.generateRecommendations({
      userId: this.userId,
      availableTime: options?.availableTime,
      currentGoals: options?.goals,
    });

    this.logger.info('Recommendations generated', {
      count: batch.recommendations.length,
      totalTime: batch.totalEstimatedTime,
    });

    return batch;
  }

  async getProgressReport(
    period?: 'daily' | 'weekly' | 'monthly',
  ): Promise<ProgressReport> {
    if (!this.progressAnalyzer) {
      throw new Error('Learning Analytics not enabled');
    }

    const periodMap: Record<string, TimePeriod> = {
      daily: TimePeriod.DAILY,
      weekly: TimePeriod.WEEKLY,
      monthly: TimePeriod.MONTHLY,
    };

    return this.progressAnalyzer.generateReport(
      this.userId,
      periodMap[period ?? 'weekly'],
    );
  }

  async getSkillMap(): Promise<SkillMap> {
    if (!this.skillAssessor) {
      throw new Error('Learning Analytics not enabled');
    }

    return this.skillAssessor.generateSkillMap(this.userId);
  }

  // --------------------------------------------------------------------------
  // Capability checks
  // --------------------------------------------------------------------------

  hasProgressAnalyzer(): boolean {
    return !!this.progressAnalyzer;
  }

  hasRecommendationEngine(): boolean {
    return !!this.recommendationEngine;
  }

  isEnabled(): boolean {
    return !!this.progressAnalyzer;
  }
}
