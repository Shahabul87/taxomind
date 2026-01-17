/**
 * Unified Bloom's Engine Types
 *
 * Priority 1: Unified Bloom's Engine
 * - Merges keyword-only core engine with AI+DB educational engine
 * - Provides single interface with intelligent fallback
 * - Implements confidence-based escalation to AI analysis
 */
import type { SAMConfig, SAMDatabaseAdapter, BloomsLevel } from '@sam-ai/core';
import type { BloomsDistribution, CognitiveProfile } from './blooms.types';
export interface UnifiedBloomsConfig {
    /**
     * SAM configuration with AI provider settings
     */
    samConfig: SAMConfig;
    /**
     * Optional database adapter for persistence
     */
    database?: SAMDatabaseAdapter;
    /**
     * Default analysis mode for the engine
     * - 'quick': Keyword-only, <10ms, no AI costs
     * - 'standard': Keyword + AI validation when confidence low
     * - 'comprehensive': Full AI analysis with semantic understanding
     * @default 'standard'
     */
    defaultMode?: UnifiedBloomsMode;
    /**
     * Confidence threshold below which AI analysis is triggered
     * In 'standard' mode, if keyword confidence < threshold, escalates to AI
     * @default 0.7
     */
    confidenceThreshold?: number;
    /**
     * Enable caching for AI analysis results
     * Reduces API costs for repeated analyses
     * @default true
     */
    enableCache?: boolean;
    /**
     * Cache TTL in seconds
     * @default 3600 (1 hour)
     */
    cacheTTL?: number;
}
export type UnifiedBloomsMode = 'quick' | 'standard' | 'comprehensive';
export interface AnalysisOptions {
    /**
     * Override the default analysis mode for this request
     */
    mode?: UnifiedBloomsMode;
    /**
     * Force keyword-only analysis regardless of confidence
     */
    forceKeyword?: boolean;
    /**
     * Force AI analysis regardless of keyword confidence
     */
    forceAI?: boolean;
    /**
     * Include section-level analysis for content with sections
     */
    includeSections?: boolean;
    /**
     * Custom confidence threshold for this request
     */
    confidenceThreshold?: number;
}
export interface UnifiedBloomsResult {
    /**
     * The dominant Bloom's level identified
     */
    dominantLevel: BloomsLevel;
    /**
     * Distribution across all Bloom's levels (percentage)
     */
    distribution: BloomsDistribution;
    /**
     * Confidence score (0-1) in the classification
     */
    confidence: number;
    /**
     * Cognitive depth score (0-100)
     */
    cognitiveDepth: number;
    /**
     * Balance assessment
     */
    balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
    /**
     * Levels with insufficient coverage (<5%)
     */
    gaps: BloomsLevel[];
    /**
     * Actionable recommendations
     */
    recommendations: UnifiedBloomsRecommendation[];
    /**
     * Section-level analysis (if requested and sections provided)
     */
    sectionAnalysis?: SectionAnalysis[];
    /**
     * Analysis metadata
     */
    metadata: AnalysisMetadata;
}
export interface UnifiedBloomsRecommendation {
    /**
     * Target Bloom's level for this recommendation
     */
    level: BloomsLevel;
    /**
     * Description of the recommended action
     */
    action: string;
    /**
     * Priority of this recommendation
     */
    priority: 'low' | 'medium' | 'high';
    /**
     * Specific examples or suggestions
     */
    examples?: string[];
    /**
     * Expected impact on cognitive depth
     */
    expectedImpact?: string;
}
export interface SectionAnalysis {
    /**
     * Section identifier
     */
    id?: string;
    /**
     * Section title
     */
    title: string;
    /**
     * Detected Bloom's level for this section
     */
    level: BloomsLevel;
    /**
     * Confidence in the level detection
     */
    confidence: number;
    /**
     * Detected keywords that influenced classification
     */
    detectedKeywords?: string[];
}
export interface AnalysisMetadata {
    /**
     * Which analysis method was used
     */
    method: 'keyword' | 'ai' | 'hybrid';
    /**
     * Processing time in milliseconds
     */
    processingTimeMs: number;
    /**
     * Timestamp of analysis
     */
    timestamp: string;
    /**
     * Whether the result was served from cache
     */
    fromCache: boolean;
    /**
     * If AI was used, which model was used
     */
    aiModel?: string;
    /**
     * If hybrid, the keyword confidence that triggered AI escalation
     */
    keywordConfidence?: number;
    /**
     * Validation error message if AI response parsing failed
     * Indicates fallback to default values was used
     */
    validationError?: string;
}
export interface UnifiedCourseInput {
    /**
     * Course identifier
     */
    id: string;
    /**
     * Course title
     */
    title: string;
    /**
     * Course description
     */
    description?: string;
    /**
     * Learning objectives
     */
    objectives?: string[];
    /**
     * Chapters with sections
     */
    chapters: CourseChapter[];
}
export interface CourseChapter {
    id: string;
    title: string;
    position: number;
    /**
     * Chapter-level learning outcomes
     */
    learningOutcomes?: string;
    /**
     * Chapter-level course goals
     */
    courseGoals?: string;
    sections: CourseSection[];
}
export interface CourseSection {
    id: string;
    title: string;
    content?: string;
    description?: string;
    type?: string;
    learningObjectives?: string[];
    questions?: Array<{
        id: string;
        text: string;
        bloomsLevel?: BloomsLevel;
    }>;
}
export interface UnifiedCourseOptions extends AnalysisOptions {
    /**
     * Analysis depth for course
     */
    depth?: 'basic' | 'detailed' | 'comprehensive';
    /**
     * Include learning pathway analysis
     */
    includeLearningPathway?: boolean;
    /**
     * Include recommendations for improvements
     */
    includeRecommendations?: boolean;
    /**
     * Force reanalysis even if cached result exists
     */
    forceReanalyze?: boolean;
}
export interface UnifiedCourseResult {
    /**
     * Course identifier
     */
    courseId: string;
    /**
     * Overall course-level analysis
     */
    courseLevel: {
        distribution: BloomsDistribution;
        cognitiveDepth: number;
        balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
        confidence: number;
    };
    /**
     * Chapter-by-chapter analysis
     */
    chapters: ChapterAnalysis[];
    /**
     * Identified gaps and recommendations
     */
    recommendations: CourseRecommendation[];
    /**
     * Suggested learning pathway
     */
    learningPathway?: UnifiedLearningPath;
    /**
     * Analysis metadata
     */
    metadata: AnalysisMetadata;
    /**
     * Timestamp of analysis
     */
    analyzedAt: string;
}
export interface ChapterAnalysis {
    chapterId: string;
    chapterTitle: string;
    distribution: BloomsDistribution;
    primaryLevel: BloomsLevel;
    cognitiveDepth: number;
    confidence: number;
    sections: SectionAnalysis[];
}
export interface CourseRecommendation {
    type: 'content' | 'assessment' | 'activity' | 'structure';
    priority: 'low' | 'medium' | 'high';
    targetLevel: BloomsLevel;
    description: string;
    targetChapter?: string;
    targetSection?: string;
    examples?: string[];
    expectedImpact: string;
}
export interface UnifiedLearningPath {
    stages: PathwayStage[];
    estimatedDuration: string;
    cognitiveProgression: BloomsLevel[];
    recommendations: string[];
}
export interface PathwayStage {
    level: BloomsLevel;
    mastery: number;
    activities: string[];
    timeEstimate: number;
}
export interface CognitiveProgressInput {
    userId: string;
    sectionId: string;
    bloomsLevel: BloomsLevel;
    score: number;
    courseId?: string;
}
export interface CognitiveProgressResult {
    updated: boolean;
    profile: CognitiveProfile;
    recommendations: ProgressRecommendation[];
}
export interface ProgressRecommendation {
    type: 'review' | 'practice' | 'advance' | 'remediate';
    title: string;
    description: string;
    bloomsLevel: BloomsLevel;
    priority: number;
}
export interface UnifiedSpacedRepetitionInput {
    userId: string;
    conceptId: string;
    performance: number;
    previousInterval?: number;
    previousEaseFactor?: number;
}
export interface UnifiedSpacedRepetitionResult {
    nextReviewDate: Date;
    intervalDays: number;
    easeFactor: number;
    repetitionCount: number;
}
export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    key: string;
}
export interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    oldestEntry?: string;
}
/**
 * Unified Bloom's Engine Interface
 * Provides a single unified interface for all Bloom's Taxonomy analysis
 */
export interface UnifiedBloomsEngine {
    /**
     * Fast keyword-only classification (<10ms)
     */
    quickClassify(content: string): BloomsLevel;
    /**
     * Analyze content with intelligent mode selection
     */
    analyze(content: string, options?: AnalysisOptions): Promise<UnifiedBloomsResult>;
    /**
     * Analyze an entire course structure
     */
    analyzeCourse(courseData: UnifiedCourseInput, options?: UnifiedCourseOptions): Promise<UnifiedCourseResult>;
    /**
     * Update cognitive progress for a user
     */
    updateCognitiveProgress(input: CognitiveProgressInput): Promise<CognitiveProgressResult>;
    /**
     * Get cognitive profile for a user
     */
    getCognitiveProfile(userId: string, courseId?: string): Promise<CognitiveProfile>;
    /**
     * Calculate next review date using SM-2 algorithm
     */
    calculateSpacedRepetition(input: UnifiedSpacedRepetitionInput): UnifiedSpacedRepetitionResult;
    /**
     * Get cache statistics
     */
    getCacheStats(): CacheStats;
    /**
     * Clear the cache
     */
    clearCache(): void;
}
//# sourceMappingURL=unified-blooms.types.d.ts.map