/**
 * Enhanced Course Depth Analysis Engine
 * Integrates Webb's DOK, Course Type Detection, Assessment Quality, and Objective Analysis
 */
import type { BloomsLevel, SAMConfig } from '@sam-ai/core';
import { BloomsDistribution, WebbDOKDistribution, EnhancedDepthAnalysisResponse, ObjectiveAnalysis, AssessmentQualityMetrics, EnhancedRecommendations, CourseType, LearningPathway, LearningGap, StudentImpactAnalysis } from '../types/depth-analysis.types';
export interface DepthAnalysisLogger {
    info: (message: string, ...args: unknown[]) => void;
    warn?: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
}
export interface CourseDepthAnalysisCacheEntry {
    courseId: string;
    contentHash: string | null;
    analyzedAt: Date;
    bloomsDistribution: BloomsDistribution;
    cognitiveDepth: number;
    learningPathway: LearningPathway;
    skillsMatrix: StudentImpactAnalysis['skillsDeveloped'];
    gapAnalysis: LearningGap[];
    recommendations: EnhancedRecommendations;
    dokDistribution?: WebbDOKDistribution;
    courseType?: CourseType;
    courseTypeMatch?: number;
    assessmentQuality?: AssessmentQualityMetrics;
    objectiveAnalysis?: ObjectiveAnalysis[];
}
export interface CourseDepthAnalysisHistoryEntry {
    id: string;
    snapshotAt: Date;
    cognitiveDepth: number;
    balanceScore: number;
    completenessScore: number;
    totalChapters: number;
    totalObjectives: number;
}
export interface CourseDepthAnalysisSnapshotInput {
    courseId: string;
    snapshotAt: Date;
    cognitiveDepth: number;
    balanceScore: number;
    completenessScore: number;
    totalChapters: number;
    totalObjectives: number;
    metadata: Record<string, unknown>;
}
export interface CourseDepthAnalysisStore {
    getCachedAnalysis: (courseId: string) => Promise<CourseDepthAnalysisCacheEntry | null>;
    saveAnalysis: (courseId: string, data: CourseDepthAnalysisCacheEntry) => Promise<void>;
    listHistoricalSnapshots?: (courseId: string, limit: number) => Promise<CourseDepthAnalysisHistoryEntry[]>;
    hasRecentSnapshot?: (courseId: string, since: Date) => Promise<boolean>;
    createHistoricalSnapshot?: (snapshot: CourseDepthAnalysisSnapshotInput) => Promise<void>;
}
export interface EnhancedDepthAnalysisEngineOptions {
    /** Optional SAMConfig for AI-enhanced analysis */
    samConfig?: SAMConfig;
    /** Storage adapter for caching and persistence */
    storage?: CourseDepthAnalysisStore;
    /** Logger for debugging and monitoring */
    logger?: DepthAnalysisLogger;
    /** Custom content hasher function */
    contentHasher?: (courseData: CourseData) => string;
    /** Enable AI-enhanced recommendations (requires samConfig) */
    enableAIEnhancements?: boolean;
}
export declare function generateCourseContentHash(course: CourseData): string;
export interface CourseData {
    id: string;
    title: string;
    description: string | null;
    whatYouWillLearn: string[];
    categoryId?: string | null;
    price?: number | null;
    category: {
        name: string;
    } | null;
    chapters: ChapterData[];
    attachments: AttachmentData[];
}
export interface ChapterData {
    id: string;
    title: string;
    description: string | null;
    learningOutcomes: string | null;
    position: number;
    sections: SectionData[];
}
export interface SectionData {
    id: string;
    title: string;
    description: string | null;
    position: number;
    videoUrl: string | null;
    duration: number | null;
    exams?: ExamDataInternal[];
    Question?: QuestionDataInternal[];
}
interface ExamDataInternal {
    id: string;
    title: string;
    ExamQuestion?: QuestionDataInternal[];
}
interface QuestionDataInternal {
    id: string;
    text: string;
    question?: string;
    type?: string;
    bloomsLevel?: BloomsLevel;
    explanation?: string;
    options?: OptionDataInternal[];
}
interface OptionDataInternal {
    id: string;
    text: string;
    isCorrect: boolean;
}
interface AttachmentData {
    id: string;
    name: string;
}
export declare class EnhancedDepthAnalysisEngine {
    private startTime;
    private readonly samConfig?;
    private readonly storage?;
    private readonly logger;
    private readonly contentHasher;
    private readonly enableAIEnhancements;
    constructor(options?: EnhancedDepthAnalysisEngineOptions);
    /**
     * Check if AI-enhanced analysis is available
     */
    hasAICapabilities(): boolean;
    /**
     * Get the SAMConfig (for subclasses or testing)
     */
    protected getSAMConfig(): SAMConfig | undefined;
    /**
     * Perform comprehensive enhanced depth analysis
     */
    analyze(courseData: CourseData, options?: {
        forceReanalyze?: boolean;
        includeHistoricalSnapshot?: boolean;
        analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
    }): Promise<EnhancedDepthAnalysisResponse>;
    /**
     * Get historical trend data for a course
     */
    getHistoricalTrends(courseId: string, limit?: number): Promise<{
        snapshots: Array<{
            id: string;
            snapshotAt: Date;
            cognitiveDepth: number;
            balanceScore: number;
            completenessScore: number;
            totalChapters: number;
            totalObjectives: number;
        }>;
        trends: Array<{
            metric: string;
            change: number;
            direction: 'improving' | 'declining' | 'stable';
        }>;
    }>;
    /**
     * Build course metadata for type detection
     */
    private buildCourseMetadata;
    /**
     * Analyze chapters with enhanced metrics
     */
    private analyzeChapters;
    /**
     * Analyze sections
     */
    private analyzeSections;
    /**
     * Extract activities from section
     */
    private extractActivities;
    /**
     * Calculate engagement score
     */
    private calculateEngagementScore;
    /**
     * Analyze objectives
     */
    private analyzeObjectives;
    /**
     * Analyze assessment quality
     */
    private analyzeAssessmentQuality;
    /**
     * Calculate Bloom's distribution from chapter analyses
     */
    private calculateBloomsDistribution;
    /**
     * Calculate section-level Bloom's distribution
     */
    private calculateSectionBloomsDistribution;
    /**
     * Calculate cognitive depth score
     */
    private calculateCognitiveDepth;
    /**
     * Determine balance
     */
    private determineBalance;
    private calculateBalanceScore;
    /**
     * Get primary Bloom's level
     */
    private getPrimaryLevel;
    /**
     * Infer Bloom's level from text
     */
    private inferBloomsLevel;
    /**
     * Analyze chapter strengths and weaknesses
     */
    private analyzeChapterStrengthsWeaknesses;
    /**
     * Generate chapter-specific recommendations
     */
    private generateChapterRecommendations;
    /**
     * Generate learning pathway
     */
    private generateLearningPathway;
    /**
     * Get activities for a level
     */
    private getActivitiesForLevel;
    /**
     * Get recommended activities for level
     */
    private getRecommendedActivities;
    /**
     * Identify gaps between current and recommended
     */
    private identifyGaps;
    /**
     * Determine current stage
     */
    private determineCurrentStage;
    /**
     * Calculate path completion
     */
    private calculatePathCompletion;
    /**
     * Generate milestones
     */
    private generateMilestones;
    /**
     * Generate enhanced recommendations
     */
    private generateEnhancedRecommendations;
    /**
     * Generate content adjustments
     */
    private generateContentAdjustments;
    /**
     * Generate assessment changes
     */
    private generateAssessmentChanges;
    /**
     * Generate activity suggestions
     */
    private generateActivitySuggestions;
    /**
     * Analyze student impact
     */
    private analyzeStudentImpact;
    /**
     * Get skill name
     */
    private getSkillName;
    /**
     * Get skill description
     */
    private getSkillDescription;
    /**
     * Get industry relevance
     */
    private getIndustryRelevance;
    /**
     * Get career alignment
     */
    private getCareerAlignment;
    /**
     * Calculate completion percentage
     */
    private calculateCompletionPercentage;
    /**
     * Get cached analysis
     */
    private getCachedAnalysis;
    /**
     * Store analysis results
     */
    private storeAnalysis;
    /**
     * Store historical snapshot
     */
    private storeHistoricalSnapshot;
}
export declare const enhancedDepthEngine: EnhancedDepthAnalysisEngine;
export declare const createEnhancedDepthAnalysisEngine: (options?: EnhancedDepthAnalysisEngineOptions) => EnhancedDepthAnalysisEngine;
export {};
//# sourceMappingURL=enhanced-depth-engine.d.ts.map