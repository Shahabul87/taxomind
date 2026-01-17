/**
 * @sam-ai/educational - Unified Bloom's Taxonomy Engine
 *
 * Priority 1: Unified Bloom's Engine
 *
 * This engine merges the keyword-only core engine with the AI+DB educational engine,
 * providing a single unified interface with intelligent fallback.
 *
 * Key features:
 * - Fast keyword-only classification for quick analysis (<10ms)
 * - AI-powered semantic analysis for comprehensive understanding
 * - Confidence-based escalation: if keyword confidence < threshold, uses AI
 * - In-memory caching for AI results to reduce costs
 * - Course-level analysis with learning pathways
 * - Cognitive progress tracking with spaced repetition (SM-2)
 *
 * @packageDocumentation
 */
import type { BloomsLevel } from '@sam-ai/core';
import type { CognitiveProfile } from '../types/blooms.types';
import type { UnifiedBloomsConfig, UnifiedBloomsResult, AnalysisOptions, UnifiedCourseInput, UnifiedCourseOptions, UnifiedCourseResult, CognitiveProgressInput, CognitiveProgressResult, UnifiedSpacedRepetitionInput, UnifiedSpacedRepetitionResult, CacheStats } from '../types/unified-blooms.types';
export declare class UnifiedBloomsEngine {
    private readonly config;
    private readonly database?;
    private readonly defaultMode;
    private readonly confidenceThreshold;
    private readonly enableCache;
    private readonly cacheTTL;
    private readonly cache;
    private cacheHits;
    private cacheMisses;
    constructor(config: UnifiedBloomsConfig);
    /**
     * Fast keyword-only classification (<10ms)
     * Use when you need immediate results without AI costs
     *
     * @param content - Text content to classify
     * @returns The dominant Bloom's level
     */
    quickClassify(content: string): BloomsLevel;
    /**
     * Analyze content with intelligent mode selection
     *
     * In 'quick' mode: keyword-only analysis
     * In 'standard' mode: keyword analysis, AI escalation if confidence < threshold
     * In 'comprehensive' mode: full AI semantic analysis
     *
     * @param content - Text content to analyze
     * @param options - Analysis options
     * @returns Unified analysis result
     */
    analyze(content: string, options?: AnalysisOptions): Promise<UnifiedBloomsResult>;
    /**
     * Analyze an entire course structure
     *
     * @param courseData - Course structure with chapters and sections
     * @param options - Analysis options
     * @returns Course-level analysis with recommendations
     */
    analyzeCourse(courseData: UnifiedCourseInput, options?: UnifiedCourseOptions): Promise<UnifiedCourseResult>;
    /**
     * Update cognitive progress for a user
     *
     * @param input - Progress update input
     * @returns Updated cognitive profile with recommendations
     */
    updateCognitiveProgress(input: CognitiveProgressInput): Promise<CognitiveProgressResult>;
    /**
     * Update cognitive progress for a user (legacy signature)
     *
     * @param userId - User ID
     * @param sectionId - Section ID (used as context)
     * @param bloomsLevel - Bloom's level demonstrated
     * @param score - Score achieved (0-100)
     */
    updateCognitiveProgress(userId: string, sectionId: string, bloomsLevel: BloomsLevel, score: number): Promise<void>;
    /**
     * Get cognitive profile for a user
     */
    getCognitiveProfile(userId: string, courseId?: string): Promise<CognitiveProfile>;
    /**
     * Calculate next review date using SM-2 algorithm
     *
     * @param input - Spaced repetition input
     * @returns Calculated review schedule
     */
    calculateSpacedRepetition(input: UnifiedSpacedRepetitionInput): UnifiedSpacedRepetitionResult;
    /**
     * Log a learning activity for a user
     *
     * @param userId - User ID
     * @param activityType - Type of activity (e.g., 'TAKE_EXAM', 'COMPLETE_SECTION')
     * @param data - Activity metadata
     */
    logLearningActivity(userId: string, activityType: string, data: Record<string, unknown>): Promise<void>;
    /**
     * Create a progress intervention for a user
     *
     * @param userId - User ID
     * @param type - Intervention type (e.g., 'SUPPORT_NEEDED', 'CELEBRATION')
     * @param title - Intervention title
     * @param message - Intervention message
     * @param metadata - Additional metadata
     */
    createProgressIntervention(userId: string, type: string, title: string, message: string, metadata: Record<string, unknown>): Promise<void>;
    /**
     * Get cache statistics
     */
    getCacheStats(): CacheStats;
    /**
     * Clear the cache
     */
    clearCache(): void;
    private analyzeWithKeywords;
    private analyzeKeywordDistribution;
    private findDominantLevel;
    private calculateKeywordConfidence;
    private calculateCognitiveDepth;
    private determineBalance;
    private identifyGaps;
    private analyzeWithAI;
    private getSystemPrompt;
    private buildAIPrompt;
    private parseAIResponse;
    private validateBloomsLevel;
    private validateBalance;
    private normalizeDistribution;
    private parseRecommendations;
    private generateRecommendations;
    private generateCourseRecommendations;
    private generateLearningPathway;
    private getActivitiesForLevel;
    private identifyPreferredLevels;
    private identifyChallengeAreas;
    private generateProgressRecommendations;
    private extractChapterText;
    private aggregateDistributions;
    private generateCacheKey;
    private hashString;
    private getFromCache;
    private setCache;
    private evictOldestEntries;
}
/**
 * Create a unified Bloom's engine instance
 *
 * @param config - Engine configuration
 * @returns UnifiedBloomsEngine instance
 */
export declare function createUnifiedBloomsEngine(config: UnifiedBloomsConfig): UnifiedBloomsEngine;
//# sourceMappingURL=unified-blooms-engine.d.ts.map