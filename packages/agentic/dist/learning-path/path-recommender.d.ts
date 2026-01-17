/**
 * @sam-ai/agentic - LearningPathRecommender
 * Generates personalized learning path recommendations
 */
import type { LearningPath, LearningPathOptions, LearningPathStore, CourseGraphStore } from './types';
import type { SkillTracker } from './skill-tracker';
import type { MemoryLogger } from '../memory/types';
export interface PathRecommenderConfig {
    pathStore: LearningPathStore;
    courseGraphStore: CourseGraphStore;
    skillTracker: SkillTracker;
    logger?: MemoryLogger;
    defaultMaxSteps?: number;
    defaultMaxMinutes?: number;
    pathExpirationHours?: number;
}
export declare class LearningPathRecommender {
    private pathStore;
    private courseGraphStore;
    private skillTracker;
    private logger?;
    private defaultMaxSteps;
    private defaultMaxMinutes;
    private pathExpirationHours;
    constructor(config: PathRecommenderConfig);
    /**
     * Generate a personalized learning path
     */
    generatePath(userId: string, options?: LearningPathOptions): Promise<LearningPath>;
    /**
     * Get active learning path for a user
     */
    getActivePath(userId: string, courseId?: string): Promise<LearningPath | null>;
    /**
     * Mark a step as completed
     */
    completeStep(pathId: string, stepOrder: number): Promise<void>;
    /**
     * Generate a path to reach a specific target concept
     */
    generatePathToTarget(userId: string, targetConceptId: string, courseId: string): Promise<LearningPath>;
    private buildStrugglingConceptSteps;
    private buildInProgressSteps;
    private buildNewConceptSteps;
    private buildReviewSteps;
    private buildOrderedSteps;
    private findAllPrerequisites;
    private topologicalSort;
    private calculatePathDifficulty;
    private calculateConfidence;
    private generatePathReason;
    private getConceptName;
}
export declare function createPathRecommender(config: PathRecommenderConfig): LearningPathRecommender;
//# sourceMappingURL=path-recommender.d.ts.map