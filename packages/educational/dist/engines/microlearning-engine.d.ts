/**
 * @sam-ai/educational - MicrolearningEngine
 *
 * Engine for bite-sized learning modules, content chunking, spaced delivery,
 * and mobile-optimized learning experiences.
 */
import type { MicrolearningEngineConfig, MicroModule, ChunkingInput, ChunkingResult, DeliverySchedule, DeliveryPreferences, MicrolearningSession, MobileOptimizationInput, MobileOptimizedContent, MicrolearningSRResult, MicrolearningAnalytics, GenerateModulesInput, GenerateModulesResult, CreateSessionInput, UpdateProgressInput, GetAnalyticsInput } from '../types';
export declare class MicrolearningEngine {
    private config;
    private database?;
    private logger;
    private targetDuration;
    private maxDuration;
    private enableAIChunking;
    private defaultScheduleType;
    private spacedRepetitionConfig;
    private moduleCache;
    private scheduleCache;
    private sessionCache;
    private progressCache;
    constructor(engineConfig: MicrolearningEngineConfig);
    /**
     * Chunk content into micro-learning modules
     */
    chunkContent(input: ChunkingInput): Promise<ChunkingResult>;
    private chunkWithAI;
    private chunkWithRules;
    private createChunkFromText;
    private extractTitle;
    private extractMainConcept;
    private extractRelatedConcepts;
    private detectBloomsLevel;
    private suggestModuleType;
    private estimateDuration;
    private calculateCoverage;
    /**
     * Generate micro-learning modules from content
     */
    generateModules(input: GenerateModulesInput): Promise<GenerateModulesResult>;
    private createModuleFromChunk;
    private extractKeyTakeaways;
    private generateQuickSummary;
    private generatePracticeModules;
    private generatePracticeContent;
    private generatePracticeInteractions;
    private createSummaryModule;
    private calculateBloomsDistribution;
    private calculateTypeDistribution;
    private generateScheduleSuggestion;
    /**
     * Create a delivery schedule for modules
     */
    createSchedule(userId: string, modules: MicroModule[], preferences: Partial<DeliveryPreferences>, courseId?: string): DeliverySchedule;
    private scheduleModules;
    /**
     * Create a learning session
     */
    createSession(input: CreateSessionInput): Promise<MicrolearningSession>;
    private getModulesNeedingReview;
    /**
     * Update progress for a module
     */
    updateProgress(input: UpdateProgressInput): Promise<MicrolearningSRResult | null>;
    private calculateSpacedRepetition;
    /**
     * Optimize content for mobile devices
     */
    optimizeForMobile(input: MobileOptimizationInput): MobileOptimizedContent;
    private createMobileContent;
    private createMobileCards;
    private createLoadingChunks;
    private optimizeMedia;
    private calculateDataSize;
    /**
     * Get analytics for a user
     */
    getAnalytics(input: GetAnalyticsInput): Promise<MicrolearningAnalytics>;
    private calculateOverallStats;
    private calculateStreakStats;
    private analyzeLearningPatterns;
    private getUniqueDays;
    private calculateModuleBreakdown;
    private generateRecommendations;
    /**
     * Get a module by ID
     */
    getModule(moduleId: string): MicroModule | undefined;
    /**
     * Get a schedule by ID
     */
    getSchedule(scheduleId: string): DeliverySchedule | undefined;
    /**
     * Get a session by ID
     */
    getSession(sessionId: string): MicrolearningSession | undefined;
    /**
     * Clear all caches
     */
    clearCaches(): void;
}
export declare function createMicrolearningEngine(config: MicrolearningEngineConfig): MicrolearningEngine;
//# sourceMappingURL=microlearning-engine.d.ts.map