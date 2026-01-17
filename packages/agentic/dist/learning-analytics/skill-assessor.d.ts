/**
 * @sam-ai/agentic - Skill Assessor
 * Assesses and tracks skill development and mastery
 */
import { Skill, SkillAssessment, SkillAssessmentStore, SkillMap, SkillDecay, SkillComparison, MasteryLevel, AnalyticsLogger, SkillAssessmentInput } from './types';
/**
 * In-memory implementation of SkillAssessmentStore
 */
export declare class InMemorySkillAssessmentStore implements SkillAssessmentStore {
    private assessments;
    private userSkillIndex;
    private getKey;
    create(assessment: Omit<SkillAssessment, 'id'>): Promise<SkillAssessment>;
    get(id: string): Promise<SkillAssessment | null>;
    getByUserAndSkill(userId: string, skillId: string): Promise<SkillAssessment | null>;
    getByUser(userId: string): Promise<SkillAssessment[]>;
    getHistory(userId: string, skillId: string, limit?: number): Promise<SkillAssessment[]>;
}
/**
 * Configuration for SkillAssessor
 */
export interface SkillAssessorConfig {
    store?: SkillAssessmentStore;
    logger?: AnalyticsLogger;
    skills?: Skill[];
    masteryThresholds?: Partial<Record<MasteryLevel, number>>;
    decayRatePerDay?: number;
    assessmentValidityDays?: number;
}
/**
 * Skill Assessor
 * Tracks and assesses skill development and mastery
 */
export declare class SkillAssessor {
    private store;
    private logger;
    private skills;
    private masteryThresholds;
    private decayRatePerDay;
    private assessmentValidityDays;
    constructor(config?: SkillAssessorConfig);
    /**
     * Register a skill
     */
    registerSkill(skill: Skill): void;
    /**
     * Get a registered skill
     */
    getSkill(skillId: string): Skill | undefined;
    /**
     * List all registered skills, optionally filtered by category
     */
    listSkills(category?: string): Skill[];
    /**
     * Assess a skill
     */
    assessSkill(input: SkillAssessmentInput): Promise<SkillAssessment>;
    /**
     * Get current assessment for a skill
     */
    getAssessment(userId: string, skillId: string): Promise<SkillAssessment | null>;
    /**
     * Get all assessments for a user
     */
    getUserAssessments(userId: string): Promise<SkillAssessment[]>;
    /**
     * Get assessment history for a skill
     */
    getAssessmentHistory(userId: string, skillId: string, limit?: number): Promise<SkillAssessment[]>;
    /**
     * Generate skill map for a user
     */
    generateSkillMap(userId: string): Promise<SkillMap>;
    /**
     * Predict skill decay
     */
    predictDecay(userId: string): Promise<SkillDecay[]>;
    /**
     * Compare user skills with benchmarks
     */
    compareSkills(userId: string, benchmarkData?: Map<string, number>): Promise<SkillComparison[]>;
    /**
     * Get skill prerequisites status
     */
    getPrerequisiteStatus(userId: string, skillId: string): Promise<{
        met: string[];
        unmet: string[];
        partiallyMet: string[];
    }>;
    /**
     * Calculate skill improvement rate
     */
    getImprovementRate(userId: string, skillId: string): Promise<number>;
    /**
     * Get skills by mastery level
     */
    getSkillsByLevel(userId: string, level: MasteryLevel): Promise<SkillAssessment[]>;
    /**
     * Estimate time to reach target level
     */
    estimateTimeToLevel(userId: string, skillId: string, targetLevel: MasteryLevel): Promise<number | null>;
    private scoreToLevel;
    private calculateConfidence;
    private calculateDecayRate;
    private findDependents;
    private suggestFocusAreas;
}
/**
 * Create a new SkillAssessor instance
 */
export declare function createSkillAssessor(config?: SkillAssessorConfig): SkillAssessor;
//# sourceMappingURL=skill-assessor.d.ts.map