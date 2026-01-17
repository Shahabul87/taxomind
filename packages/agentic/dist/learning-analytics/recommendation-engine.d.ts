/**
 * @sam-ai/agentic - Recommendation Engine
 * Generates personalized learning recommendations
 */
import { Recommendation, RecommendationStore, RecommendationBatch, LearningPath, ContentItem, ContentStore, ContentFilters, ContentType, LearningStyle, LearningGap, SkillDecay, TopicProgress, SkillAssessment, AnalyticsLogger, RecommendationFeedback } from './types';
/**
 * In-memory implementation of RecommendationStore
 */
export declare class InMemoryRecommendationStore implements RecommendationStore {
    private recommendations;
    create(recommendation: Omit<Recommendation, 'id'>): Promise<Recommendation>;
    get(id: string): Promise<Recommendation | null>;
    getByUser(userId: string, limit?: number): Promise<Recommendation[]>;
    getActive(userId: string): Promise<Recommendation[]>;
    markViewed(id: string): Promise<Recommendation>;
    markCompleted(id: string, rating?: number): Promise<Recommendation>;
    expire(id: string): Promise<void>;
}
/**
 * In-memory implementation of ContentStore
 */
export declare class InMemoryContentStore implements ContentStore {
    private content;
    addContent(item: ContentItem): void;
    get(id: string): Promise<ContentItem | null>;
    getByTopic(topicId: string): Promise<ContentItem[]>;
    getBySkill(skillId: string): Promise<ContentItem[]>;
    getByType(type: ContentType): Promise<ContentItem[]>;
    search(query: string, filters?: ContentFilters): Promise<ContentItem[]>;
}
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
    availableTime?: number;
    learningStyle?: LearningStyle;
    currentGoals?: string[];
    excludeCompleted?: boolean;
}
/**
 * Recommendation Engine
 * Generates personalized learning recommendations
 */
export declare class RecommendationEngine {
    private recommendationStore;
    private contentStore;
    private logger;
    private maxRecommendationsPerBatch;
    private recommendationExpiryDays;
    private preferredContentTypes;
    private feedbackHistory;
    constructor(config?: RecommendationEngineConfig);
    /**
     * Generate recommendations for a user
     */
    generateRecommendations(input: RecommendationInput): Promise<RecommendationBatch>;
    /**
     * Get active recommendations for a user
     */
    getActiveRecommendations(userId: string): Promise<Recommendation[]>;
    /**
     * Get recommendation by ID
     */
    getRecommendation(id: string): Promise<Recommendation | null>;
    /**
     * Mark recommendation as viewed
     */
    markViewed(recommendationId: string): Promise<Recommendation>;
    /**
     * Mark recommendation as completed
     */
    markCompleted(recommendationId: string, rating?: number): Promise<Recommendation>;
    /**
     * Record feedback on a recommendation
     */
    recordFeedback(feedback: RecommendationFeedback): Promise<void>;
    /**
     * Generate a learning path for a target skill
     */
    generateLearningPath(userId: string, targetSkillIds: string[], currentAssessments: SkillAssessment[]): Promise<LearningPath>;
    /**
     * Add content to the content store
     */
    addContent(item: ContentItem): void;
    /**
     * Search for content
     */
    searchContent(query: string, filters?: ContentFilters): Promise<ContentItem[]>;
    /**
     * Get content by ID
     */
    getContent(id: string): Promise<ContentItem | null>;
    private generateGapRecommendations;
    private generateDecayRecommendations;
    private generateSkillRecommendations;
    private generateExplorationRecommendations;
    private gapSeverityToPriority;
    private sortByPriority;
    private orderContentByDifficulty;
    private shouldSkipContent;
    private determineDifficulty;
}
/**
 * Create a new RecommendationEngine instance
 */
export declare function createRecommendationEngine(config?: RecommendationEngineConfig): RecommendationEngine;
//# sourceMappingURL=recommendation-engine.d.ts.map