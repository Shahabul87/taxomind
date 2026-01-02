/**
 * @sam-ai/agentic - Recommendation Engine
 * Generates personalized learning recommendations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Recommendation,
  RecommendationStore,
  RecommendationBatch,
  RecommendationContext,
  LearningPath,
  LearningPathStep,
  ContentItem,
  ContentStore,
  ContentFilters,
  ContentType,
  RecommendationPriority,
  RecommendationReason,
  LearningStyle,
  LearningGap,
  SkillDecay,
  TopicProgress,
  SkillAssessment,
  MasteryLevel,
  AnalyticsLogger,
  RecommendationFeedback,
  RecommendationFeedbackSchema,
} from './types';

// ============================================================================
// IN-MEMORY STORES
// ============================================================================

/**
 * In-memory implementation of RecommendationStore
 */
export class InMemoryRecommendationStore implements RecommendationStore {
  private recommendations: Map<string, Recommendation> = new Map();

  async create(recommendation: Omit<Recommendation, 'id'>): Promise<Recommendation> {
    const newRecommendation: Recommendation = {
      ...recommendation,
      id: uuidv4(),
    };
    this.recommendations.set(newRecommendation.id, newRecommendation);
    return newRecommendation;
  }

  async get(id: string): Promise<Recommendation | null> {
    return this.recommendations.get(id) ?? null;
  }

  async getByUser(userId: string, limit?: number): Promise<Recommendation[]> {
    const userRecs = Array.from(this.recommendations.values())
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return limit ? userRecs.slice(0, limit) : userRecs;
  }

  async getActive(userId: string): Promise<Recommendation[]> {
    const now = new Date();
    return Array.from(this.recommendations.values())
      .filter(
        (r) =>
          r.userId === userId &&
          !r.isCompleted &&
          (!r.expiresAt || r.expiresAt > now)
      )
      .sort((a, b) => {
        // Sort by priority first, then by creation date
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        if (aPriority !== bPriority) return aPriority - bPriority;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  async markViewed(id: string): Promise<Recommendation> {
    const rec = this.recommendations.get(id);
    if (!rec) throw new Error(`Recommendation not found: ${id}`);
    const updated = { ...rec, isViewed: true };
    this.recommendations.set(id, updated);
    return updated;
  }

  async markCompleted(id: string, rating?: number): Promise<Recommendation> {
    const rec = this.recommendations.get(id);
    if (!rec) throw new Error(`Recommendation not found: ${id}`);
    const updated = { ...rec, isCompleted: true, userRating: rating };
    this.recommendations.set(id, updated);
    return updated;
  }

  async expire(id: string): Promise<void> {
    const rec = this.recommendations.get(id);
    if (rec) {
      this.recommendations.set(id, { ...rec, expiresAt: new Date() });
    }
  }
}

/**
 * In-memory implementation of ContentStore
 */
export class InMemoryContentStore implements ContentStore {
  private content: Map<string, ContentItem> = new Map();

  addContent(item: ContentItem): void {
    this.content.set(item.id, item);
  }

  async get(id: string): Promise<ContentItem | null> {
    return this.content.get(id) ?? null;
  }

  async getByTopic(topicId: string): Promise<ContentItem[]> {
    return Array.from(this.content.values()).filter((c) => c.topicId === topicId);
  }

  async getBySkill(skillId: string): Promise<ContentItem[]> {
    return Array.from(this.content.values()).filter((c) => c.skillIds.includes(skillId));
  }

  async getByType(type: ContentType): Promise<ContentItem[]> {
    return Array.from(this.content.values()).filter((c) => c.type === type);
  }

  async search(query: string, filters?: ContentFilters): Promise<ContentItem[]> {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.content.values()).filter((c) => {
      // Text search
      const matchesQuery =
        c.title.toLowerCase().includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery) ||
        c.tags.some((t) => t.toLowerCase().includes(lowerQuery));

      if (!matchesQuery) return false;

      // Apply filters
      if (filters) {
        if (filters.types && !filters.types.includes(c.type)) return false;
        if (filters.difficulty && !filters.difficulty.includes(c.difficulty)) return false;
        if (filters.minDuration && c.duration < filters.minDuration) return false;
        if (filters.maxDuration && c.duration > filters.maxDuration) return false;
        if (filters.topicIds && !filters.topicIds.includes(c.topicId)) return false;
        if (filters.skillIds && !filters.skillIds.some((s) => c.skillIds.includes(s))) return false;
      }

      return true;
    });
  }
}

// ============================================================================
// DEFAULT LOGGER
// ============================================================================

const defaultLogger: AnalyticsLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// ============================================================================
// RECOMMENDATION ENGINE
// ============================================================================

/**
 * Configuration for RecommendationEngine
 */
export interface RecommendationEngineConfig {
  recommendationStore?: RecommendationStore;
  contentStore?: ContentStore;
  logger?: AnalyticsLogger;
  maxRecommendationsPerBatch?: number;
  recommendationExpiryDays?: number;
  preferredContentTypes?: ContentType[];
}

/**
 * Input for generating recommendations
 */
export interface RecommendationInput {
  userId: string;
  learningGaps?: LearningGap[];
  skillDecay?: SkillDecay[];
  topicProgress?: TopicProgress[];
  skillAssessments?: SkillAssessment[];
  availableTime?: number; // minutes
  learningStyle?: LearningStyle;
  currentGoals?: string[];
  excludeCompleted?: boolean;
}

/**
 * Recommendation Engine
 * Generates personalized learning recommendations
 */
export class RecommendationEngine {
  private recommendationStore: RecommendationStore;
  private contentStore: ContentStore;
  private logger: AnalyticsLogger;
  private maxRecommendationsPerBatch: number;
  private recommendationExpiryDays: number;
  private preferredContentTypes: ContentType[];
  private feedbackHistory: Map<string, RecommendationFeedback[]> = new Map();

  constructor(config: RecommendationEngineConfig = {}) {
    this.recommendationStore = config.recommendationStore ?? new InMemoryRecommendationStore();
    this.contentStore = config.contentStore ?? new InMemoryContentStore();
    this.logger = config.logger ?? defaultLogger;
    this.maxRecommendationsPerBatch = config.maxRecommendationsPerBatch ?? 10;
    this.recommendationExpiryDays = config.recommendationExpiryDays ?? 7;
    this.preferredContentTypes = config.preferredContentTypes ?? [
      ContentType.TUTORIAL,
      ContentType.EXERCISE,
      ContentType.VIDEO,
    ];
  }

  /**
   * Generate recommendations for a user
   */
  async generateRecommendations(input: RecommendationInput): Promise<RecommendationBatch> {
    this.logger.info('Generating recommendations', { userId: input.userId });

    const recommendations: Recommendation[] = [];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.recommendationExpiryDays * 24 * 60 * 60 * 1000);

    // Build context
    const context: RecommendationContext = {
      recentTopics: input.topicProgress?.map((p) => p.topicId) ?? [],
      learningGaps: input.learningGaps?.map((g) => g.conceptId) ?? [],
      skillsToImprove: input.skillDecay?.filter((d) => d.riskLevel !== 'low').map((d) => d.skillId) ?? [],
      preferredContentTypes: this.preferredContentTypes,
      availableTime: input.availableTime ?? 60,
      learningStyle: input.learningStyle,
      currentGoals: input.currentGoals ?? [],
    };

    // 1. Generate gap-based recommendations (highest priority)
    if (input.learningGaps && input.learningGaps.length > 0) {
      const gapRecs = await this.generateGapRecommendations(
        input.userId,
        input.learningGaps,
        expiresAt
      );
      recommendations.push(...gapRecs);
    }

    // 2. Generate skill decay recommendations
    if (input.skillDecay && input.skillDecay.length > 0) {
      const decayRecs = await this.generateDecayRecommendations(
        input.userId,
        input.skillDecay,
        expiresAt
      );
      recommendations.push(...decayRecs);
    }

    // 3. Generate skill improvement recommendations
    if (input.skillAssessments && input.skillAssessments.length > 0) {
      const skillRecs = await this.generateSkillRecommendations(
        input.userId,
        input.skillAssessments,
        expiresAt
      );
      recommendations.push(...skillRecs);
    }

    // 4. Generate exploration recommendations
    const explorationRecs = await this.generateExplorationRecommendations(
      input.userId,
      context,
      expiresAt
    );
    recommendations.push(...explorationRecs);

    // Sort by priority and limit
    const sortedRecs = this.sortByPriority(recommendations)
      .slice(0, this.maxRecommendationsPerBatch);

    // Save recommendations
    const savedRecs: Recommendation[] = [];
    for (const rec of sortedRecs) {
      const saved = await this.recommendationStore.create(rec);
      savedRecs.push(saved);
    }

    const totalEstimatedTime = savedRecs.reduce((sum, r) => sum + r.estimatedDuration, 0);

    const batch: RecommendationBatch = {
      id: uuidv4(),
      userId: input.userId,
      recommendations: savedRecs,
      generatedAt: now,
      basedOn: context,
      totalEstimatedTime,
    };

    this.logger.info('Recommendations generated', {
      userId: input.userId,
      count: savedRecs.length,
      totalTime: totalEstimatedTime,
    });

    return batch;
  }

  /**
   * Get active recommendations for a user
   */
  async getActiveRecommendations(userId: string): Promise<Recommendation[]> {
    return this.recommendationStore.getActive(userId);
  }

  /**
   * Get recommendation by ID
   */
  async getRecommendation(id: string): Promise<Recommendation | null> {
    return this.recommendationStore.get(id);
  }

  /**
   * Mark recommendation as viewed
   */
  async markViewed(recommendationId: string): Promise<Recommendation> {
    this.logger.debug('Marking recommendation viewed', { recommendationId });
    return this.recommendationStore.markViewed(recommendationId);
  }

  /**
   * Mark recommendation as completed
   */
  async markCompleted(recommendationId: string, rating?: number): Promise<Recommendation> {
    this.logger.info('Marking recommendation completed', { recommendationId, rating });
    return this.recommendationStore.markCompleted(recommendationId, rating);
  }

  /**
   * Record feedback on a recommendation
   */
  async recordFeedback(feedback: RecommendationFeedback): Promise<void> {
    const validated = RecommendationFeedbackSchema.parse(feedback);

    this.logger.info('Recording recommendation feedback', {
      recommendationId: validated.recommendationId,
      isHelpful: validated.isHelpful,
    });

    // Store feedback
    if (!this.feedbackHistory.has(validated.userId)) {
      this.feedbackHistory.set(validated.userId, []);
    }
    this.feedbackHistory.get(validated.userId)!.push(validated);

    // Update recommendation if completed
    if (validated.completed) {
      await this.recommendationStore.markCompleted(
        validated.recommendationId,
        validated.rating
      );
    }
  }

  /**
   * Generate a learning path for a target skill
   */
  async generateLearningPath(
    userId: string,
    targetSkillIds: string[],
    currentAssessments: SkillAssessment[]
  ): Promise<LearningPath> {
    this.logger.info('Generating learning path', { userId, targetSkills: targetSkillIds });

    const assessmentMap = new Map(currentAssessments.map((a) => [a.skillId, a]));
    const steps: LearningPathStep[] = [];
    let totalDuration = 0;

    // Build path for each target skill
    for (const skillId of targetSkillIds) {
      const currentAssessment = assessmentMap.get(skillId);
      const currentLevel = currentAssessment?.level ?? MasteryLevel.NOVICE;

      // Get content for skill progression
      const content = await this.contentStore.getBySkill(skillId);
      const orderedContent = this.orderContentByDifficulty(content);

      for (const item of orderedContent) {
        // Skip if already mastered based on current level
        if (this.shouldSkipContent(item, currentLevel)) continue;

        steps.push({
          order: steps.length + 1,
          title: item.title,
          description: item.description,
          contentType: item.type,
          resourceId: item.id,
          estimatedDuration: item.duration,
          skillsGained: item.skillIds,
          isCompleted: false,
        });

        totalDuration += item.duration;
      }
    }

    const difficulty = this.determineDifficulty(currentAssessments, targetSkillIds);

    const learningPath: LearningPath = {
      id: uuidv4(),
      userId,
      title: `Path to ${targetSkillIds.join(', ')} mastery`,
      description: `A structured learning path to develop proficiency in ${targetSkillIds.length} skill(s)`,
      targetSkills: targetSkillIds,
      steps,
      totalDuration,
      difficulty,
      createdAt: new Date(),
      progress: 0,
      currentStep: 0,
    };

    this.logger.info('Learning path generated', {
      userId,
      pathId: learningPath.id,
      stepsCount: steps.length,
      totalDuration,
    });

    return learningPath;
  }

  /**
   * Add content to the content store
   */
  addContent(item: ContentItem): void {
    if (this.contentStore instanceof InMemoryContentStore) {
      this.contentStore.addContent(item);
    }
  }

  /**
   * Search for content
   */
  async searchContent(query: string, filters?: ContentFilters): Promise<ContentItem[]> {
    return this.contentStore.search(query, filters);
  }

  /**
   * Get content by ID
   */
  async getContent(id: string): Promise<ContentItem | null> {
    return this.contentStore.get(id);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async generateGapRecommendations(
    userId: string,
    gaps: LearningGap[],
    expiresAt: Date
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    for (const gap of gaps.slice(0, 3)) {
      const priority = this.gapSeverityToPriority(gap.severity);

      // Find relevant content
      const content = await this.contentStore.search(gap.conceptName);
      const bestContent = content[0];

      recommendations.push({
        id: '',
        userId,
        type: bestContent?.type ?? ContentType.TUTORIAL,
        priority,
        reason: RecommendationReason.KNOWLEDGE_GAP,
        title: `Fill knowledge gap: ${gap.conceptName}`,
        description: `Address the identified knowledge gap in ${gap.conceptName}`,
        targetConceptId: gap.conceptId,
        estimatedDuration: bestContent?.duration ?? 30,
        difficulty: gap.severity === 'critical' ? 'medium' : 'easy',
        confidence: 0.9,
        resourceId: bestContent?.id,
        resourceUrl: bestContent?.url,
        createdAt: new Date(),
        expiresAt,
        isViewed: false,
        isCompleted: false,
      });
    }

    return recommendations;
  }

  private async generateDecayRecommendations(
    userId: string,
    decayList: SkillDecay[],
    expiresAt: Date
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const highRiskDecay = decayList.filter((d) => d.riskLevel === 'high' || d.riskLevel === 'medium');

    for (const decay of highRiskDecay.slice(0, 2)) {
      const content = await this.contentStore.getBySkill(decay.skillId);
      const reviewContent = content.find((c) => c.type === ContentType.QUIZ || c.type === ContentType.EXERCISE);

      recommendations.push({
        id: '',
        userId,
        type: reviewContent?.type ?? ContentType.QUIZ,
        priority: decay.riskLevel === 'high' ? RecommendationPriority.HIGH : RecommendationPriority.MEDIUM,
        reason: RecommendationReason.SKILL_DECAY,
        title: `Review: ${decay.skillName}`,
        description: `Refresh your ${decay.skillName} skills to prevent knowledge decay`,
        targetSkillId: decay.skillId,
        estimatedDuration: reviewContent?.duration ?? 15,
        difficulty: 'medium',
        confidence: 0.85,
        resourceId: reviewContent?.id,
        createdAt: new Date(),
        expiresAt,
        isViewed: false,
        isCompleted: false,
      });
    }

    return recommendations;
  }

  private async generateSkillRecommendations(
    userId: string,
    assessments: SkillAssessment[],
    expiresAt: Date
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Find skills that can be improved
    const improvableSkills = assessments.filter(
      (a) =>
        a.level === MasteryLevel.BEGINNER ||
        a.level === MasteryLevel.INTERMEDIATE
    );

    for (const assessment of improvableSkills.slice(0, 2)) {
      const content = await this.contentStore.getBySkill(assessment.skillId);
      const challengeContent = content.find(
        (c) => c.difficulty === 'medium' || c.difficulty === 'hard'
      );

      if (challengeContent) {
        recommendations.push({
          id: '',
          userId,
          type: challengeContent.type,
          priority: RecommendationPriority.MEDIUM,
          reason: RecommendationReason.CHALLENGE,
          title: `Level up: ${assessment.skillName}`,
          description: `Take your ${assessment.skillName} skills to the next level`,
          targetSkillId: assessment.skillId,
          estimatedDuration: challengeContent.duration,
          difficulty: challengeContent.difficulty,
          confidence: 0.75,
          resourceId: challengeContent.id,
          resourceUrl: challengeContent.url,
          createdAt: new Date(),
          expiresAt,
          isViewed: false,
          isCompleted: false,
        });
      }
    }

    return recommendations;
  }

  private async generateExplorationRecommendations(
    userId: string,
    context: RecommendationContext,
    expiresAt: Date
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Find content not in recent topics
    const allContent = await this.contentStore.search('');
    const explorationContent = allContent.filter(
      (c) => !context.recentTopics.includes(c.topicId)
    );

    // Pick diverse content types
    for (const type of context.preferredContentTypes) {
      const typeContent = explorationContent.filter((c) => c.type === type);
      if (typeContent.length > 0) {
        const selected = typeContent[0];
        recommendations.push({
          id: '',
          userId,
          type: selected.type,
          priority: RecommendationPriority.LOW,
          reason: RecommendationReason.EXPLORATION,
          title: `Explore: ${selected.title}`,
          description: selected.description,
          estimatedDuration: selected.duration,
          difficulty: selected.difficulty,
          confidence: 0.6,
          resourceId: selected.id,
          resourceUrl: selected.url,
          createdAt: new Date(),
          expiresAt,
          isViewed: false,
          isCompleted: false,
        });
        break; // Only one exploration recommendation
      }
    }

    return recommendations;
  }

  private gapSeverityToPriority(severity: LearningGap['severity']): RecommendationPriority {
    switch (severity) {
      case 'critical':
        return RecommendationPriority.CRITICAL;
      case 'moderate':
        return RecommendationPriority.HIGH;
      case 'minor':
        return RecommendationPriority.MEDIUM;
      default:
        return RecommendationPriority.MEDIUM;
    }
  }

  private sortByPriority(recommendations: Recommendation[]): Recommendation[] {
    const priorityOrder: Record<RecommendationPriority, number> = {
      [RecommendationPriority.CRITICAL]: 0,
      [RecommendationPriority.HIGH]: 1,
      [RecommendationPriority.MEDIUM]: 2,
      [RecommendationPriority.LOW]: 3,
    };

    return recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }

  private orderContentByDifficulty(content: ContentItem[]): ContentItem[] {
    const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
    return [...content].sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
  }

  private shouldSkipContent(content: ContentItem, currentLevel: MasteryLevel): boolean {
    // Skip easy content if already intermediate or above
    if (content.difficulty === 'easy' &&
        (currentLevel === MasteryLevel.INTERMEDIATE ||
         currentLevel === MasteryLevel.PROFICIENT ||
         currentLevel === MasteryLevel.EXPERT)) {
      return true;
    }
    return false;
  }

  private determineDifficulty(
    assessments: SkillAssessment[],
    targetSkillIds: string[]
  ): 'beginner' | 'intermediate' | 'advanced' {
    const relevantAssessments = assessments.filter((a) => targetSkillIds.includes(a.skillId));

    if (relevantAssessments.length === 0) return 'beginner';

    const avgScore = relevantAssessments.reduce((sum, a) => sum + a.score, 0) / relevantAssessments.length;

    if (avgScore < 30) return 'beginner';
    if (avgScore < 60) return 'intermediate';
    return 'advanced';
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new RecommendationEngine instance
 */
export function createRecommendationEngine(config?: RecommendationEngineConfig): RecommendationEngine {
  return new RecommendationEngine(config);
}
