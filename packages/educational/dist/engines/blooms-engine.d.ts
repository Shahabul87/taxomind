/**
 * @sam-ai/educational - BloomsAnalysisEngine
 * Advanced Bloom's Taxonomy analysis engine with cognitive profiling
 */
import type { BloomsLevel } from '@sam-ai/core';
import type { BloomsAnalysisConfig, BloomsAnalysisResult, CognitiveProfile, LearningRecommendation, SpacedRepetitionInput, SpacedRepetitionResult, CourseAnalysisInput, CourseAnalysisOptions, CourseBloomsAnalysisResult } from '../types';
export declare class BloomsAnalysisEngine {
    private config;
    private database?;
    private logger;
    private analysisDepth;
    constructor(engineConfig: BloomsAnalysisConfig);
    /**
     * Analyze content for Bloom's Taxonomy distribution
     */
    analyzeContent(content: string): Promise<BloomsAnalysisResult>;
    /**
     * Analyze an entire course for Bloom's Taxonomy distribution
     * This is the main course-level analysis method
     */
    analyzeCourse(courseData: CourseAnalysisInput, options?: CourseAnalysisOptions): Promise<CourseBloomsAnalysisResult>;
    private analyzeChapters;
    private analyzeSections;
    private analyzeSectionContent;
    private analyzeSectionWithAI;
    private analyzeQuestionText;
    private getMostCommonLevel;
    private extractActivities;
    private getVideoBloomsLevel;
    private calculateChapterDistribution;
    private calculateCourseDistribution;
    private calculateCognitiveDepth;
    private determineBalance;
    private analyzeLearningPathway;
    private generateRecommendedPath;
    private generateCourseRecommendations;
    private getQuestionExamples;
    private analyzeStudentImpact;
    private determineCareerAlignment;
    private parseBloomsLevelFromResponse;
    /**
     * Update cognitive progress for a student
     */
    updateCognitiveProgress(userId: string, sectionId: string, bloomsLevel: BloomsLevel, score: number): Promise<void>;
    /**
     * Calculate spaced repetition schedule
     */
    calculateSpacedRepetition(input: SpacedRepetitionInput): Promise<SpacedRepetitionResult>;
    /**
     * Get cognitive profile for a user
     */
    getCognitiveProfile(userId: string, courseId?: string): Promise<CognitiveProfile>;
    /**
     * Get learning recommendations for a user
     */
    getRecommendations(userId: string, courseId?: string): Promise<LearningRecommendation[]>;
    /**
     * Log learning activity
     */
    logLearningActivity(userId: string, activityType: string, data: Record<string, unknown>): Promise<void>;
    /**
     * Create progress intervention
     */
    createProgressIntervention(userId: string, type: string, title: string, message: string, metadata: Record<string, unknown>): Promise<void>;
    /**
     * Enhanced keyword analysis with:
     * - Bigram matching alongside unigrams
     * - Context-window scoring (5 surrounding words for confirmation signals)
     * - Verb-object pattern detection (e.g., "analyze the relationship" > bare "analyze")
     * - Position weighting (questions/objectives score 1.5x vs body text)
     */
    private analyzeKeywords;
    private normalizeDistribution;
    private getDominantLevel;
    private identifyGaps;
    private generateRecommendations;
    private analyzeWithAI;
    private createDefaultProfile;
    private createCognitiveProfile;
    private getNextLevel;
}
export declare function createBloomsAnalysisEngine(config: BloomsAnalysisConfig): BloomsAnalysisEngine;
//# sourceMappingURL=blooms-engine.d.ts.map