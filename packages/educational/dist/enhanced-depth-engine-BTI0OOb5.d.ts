import { BloomsLevel } from '@sam-ai/core';

/**
 * Enhanced Course Depth Analysis Types
 * Comprehensive TypeScript interfaces for robust analysis engine
 */

interface BloomsDistribution {
    REMEMBER: number;
    UNDERSTAND: number;
    APPLY: number;
    ANALYZE: number;
    EVALUATE: number;
    CREATE: number;
    [key: string]: number;
}
type BloomsBalance = 'well-balanced' | 'bottom-heavy' | 'top-heavy';
type WebbDOKLevel = 1 | 2 | 3 | 4;
interface WebbDOKAnalysis {
    level: WebbDOKLevel;
    levelName: 'Recall' | 'Skill/Concept' | 'Strategic Thinking' | 'Extended Thinking';
    indicators: string[];
    bloomsCorrelation: BloomsLevel;
    confidence: number;
}
interface WebbDOKDistribution {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
}
type CourseType = 'foundational' | 'intermediate' | 'advanced' | 'professional' | 'creative' | 'technical' | 'theoretical';
interface CourseTypeProfile {
    type: CourseType;
    description: string;
    idealBloomsDistribution: BloomsDistribution;
    idealDOKDistribution: WebbDOKDistribution;
    primaryObjective: string;
    targetAudience: string;
}
interface AssessmentQualityMetrics {
    overallScore: number;
    questionVariety: QuestionVarietyMetrics;
    difficultyProgression: DifficultyProgressionMetrics;
    bloomsCoverage: BloomsCoverageMetrics;
    feedbackQuality: FeedbackQualityMetrics;
    distractorAnalysis: DistractorAnalysisMetrics | null;
}
interface QuestionVarietyMetrics {
    score: number;
    typeDistribution: Record<string, number>;
    uniqueTypes: number;
    recommendation: string;
}
interface DifficultyProgressionMetrics {
    score: number;
    pattern: 'ascending' | 'descending' | 'random' | 'plateaued';
    averageDifficulty: number;
    isAppropriate: boolean;
    recommendation: string;
}
interface BloomsCoverageMetrics {
    score: number;
    coveredLevels: BloomsLevel[];
    missingLevels: BloomsLevel[];
    distribution: BloomsDistribution;
    recommendation: string;
}
interface FeedbackQualityMetrics {
    score: number;
    hasExplanations: boolean;
    explanationDepth: 'none' | 'basic' | 'detailed' | 'comprehensive';
    providesRemediation: boolean;
    recommendation: string;
}
interface DistractorAnalysisMetrics {
    score: number;
    averagePlausibility: number;
    discriminationIndex: number;
    commonMistakes: string[];
    recommendation: string;
}
interface ObjectiveAnalysis {
    objective: string;
    bloomsLevel: BloomsLevel;
    dokLevel: WebbDOKLevel;
    actionVerb: string;
    verbStrength: 'weak' | 'moderate' | 'strong';
    smartCriteria: SMARTCriteriaAnalysis;
    clarityScore: number;
    measurability: MeasurabilityAnalysis;
    suggestions: string[];
    improvedVersion: string;
}
interface SMARTCriteriaAnalysis {
    specific: CriterionScore;
    measurable: CriterionScore;
    achievable: CriterionScore;
    relevant: CriterionScore;
    timeBound: CriterionScore;
    overallScore: number;
}
interface CriterionScore {
    score: number;
    feedback: string;
    suggestions: string[];
}
interface MeasurabilityAnalysis {
    score: number;
    hasQuantifiableOutcome: boolean;
    assessmentMethod: string;
    verificationCriteria: string[];
}
interface ObjectiveCluster {
    clusterId: string;
    objectives: string[];
    semanticSimilarity: number;
    recommendation: 'merge' | 'differentiate' | 'keep';
    suggestedMerge: string | null;
    reason: string;
}
interface ObjectiveDeduplicationResult {
    totalObjectives: number;
    uniqueClusters: number;
    duplicateGroups: ObjectiveCluster[];
    recommendations: string[];
    optimizedObjectives: string[];
}
interface EnhancedChapterAnalysis {
    chapterId: string;
    chapterTitle: string;
    position: number;
    bloomsDistribution: BloomsDistribution;
    dokDistribution: WebbDOKDistribution;
    primaryBloomsLevel: BloomsLevel;
    primaryDOKLevel: WebbDOKLevel;
    cognitiveDepth: number;
    complexity: ComplexityMetrics;
    sections: EnhancedSectionAnalysis[];
    strengths: string[];
    weaknesses: string[];
    recommendations: ChapterRecommendation[];
}
interface EnhancedSectionAnalysis {
    sectionId: string;
    sectionTitle: string;
    position: number;
    bloomsLevel: BloomsLevel;
    dokLevel: WebbDOKLevel;
    activities: ActivityAnalysis[];
    learningObjectives: string[];
    contentDepth: number;
    engagementScore: number;
}
interface ComplexityMetrics {
    vocabularyLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
    conceptDensity: number;
    prerequisiteCount: number;
    estimatedStudyTime: number;
}
interface ActivityAnalysis {
    type: string;
    bloomsLevel: BloomsLevel;
    dokLevel: WebbDOKLevel;
    description: string;
    engagementPotential: number;
}
interface ChapterRecommendation {
    type: 'content' | 'structure' | 'activity' | 'assessment';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: string;
    implementation: string[];
}
interface EnhancedDepthAnalysisResponse {
    courseLevel: {
        bloomsDistribution: BloomsDistribution;
        dokDistribution: WebbDOKDistribution;
        cognitiveDepth: number;
        balance: BloomsBalance;
        courseType: CourseType;
        courseTypeMatch: number;
    };
    chapterAnalysis: EnhancedChapterAnalysis[];
    objectivesAnalysis: ObjectiveAnalysis[];
    objectiveDeduplication: ObjectiveDeduplicationResult;
    assessmentQuality: AssessmentQualityMetrics;
    learningPathway: LearningPathway;
    recommendations: EnhancedRecommendations;
    studentImpact: StudentImpactAnalysis;
    metadata: AnalysisMetadata;
}
interface LearningPathway {
    current: CognitivePath;
    recommended: CognitivePath;
    gaps: LearningGap[];
    milestones: LearningMilestone[];
}
interface CognitivePath {
    stages: CognitiveStage[];
    currentStage: number;
    completionPercentage: number;
}
interface CognitiveStage {
    level: BloomsLevel;
    dokLevel: WebbDOKLevel;
    mastery: number;
    activities: string[];
    timeEstimate: number;
}
interface LearningGap {
    level: BloomsLevel;
    dokLevel: WebbDOKLevel;
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestions: string[];
    estimatedEffortHours: number;
}
interface LearningMilestone {
    title: string;
    bloomsLevel: BloomsLevel;
    dokLevel: WebbDOKLevel;
    description: string;
    assessmentCriteria: string[];
}
interface EnhancedRecommendations {
    immediate: Recommendation[];
    shortTerm: Recommendation[];
    longTerm: Recommendation[];
    contentAdjustments: ContentRecommendation[];
    assessmentChanges: AssessmentRecommendation[];
    activitySuggestions: ActivitySuggestion[];
}
interface Recommendation {
    id: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    type: 'content' | 'structure' | 'activity' | 'assessment' | 'objectives';
    category: string;
    title: string;
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
    estimatedTime: string;
    actionSteps: string[];
    examples: string[];
    bloomsTarget: BloomsLevel;
    dokTarget: WebbDOKLevel;
}
interface ContentRecommendation {
    type: 'add' | 'modify' | 'remove' | 'restructure';
    targetChapter: string | null;
    targetSection: string | null;
    bloomsLevel: BloomsLevel;
    dokLevel: WebbDOKLevel;
    description: string;
    impact: 'low' | 'medium' | 'high';
    implementation: string[];
}
interface AssessmentRecommendation {
    type: string;
    bloomsLevel: BloomsLevel;
    dokLevel: WebbDOKLevel;
    description: string;
    examples: string[];
    rubricSuggestion: string;
}
interface ActivitySuggestion {
    bloomsLevel: BloomsLevel;
    dokLevel: WebbDOKLevel;
    activityType: string;
    description: string;
    implementation: string;
    expectedOutcome: string;
    materials: string[];
    timeRequired: string;
}
interface StudentImpactAnalysis {
    skillsDeveloped: SkillDevelopment[];
    cognitiveGrowth: GrowthProjection;
    careerAlignment: CareerPath[];
    competencyGains: CompetencyGain[];
}
interface SkillDevelopment {
    name: string;
    bloomsLevel: BloomsLevel;
    dokLevel: WebbDOKLevel;
    proficiency: number;
    description: string;
    industryRelevance: number;
}
interface GrowthProjection {
    currentLevel: number;
    projectedLevel: number;
    timeframe: string;
    keyMilestones: string[];
    confidenceInterval: {
        low: number;
        high: number;
    };
}
interface CareerPath {
    role: string;
    alignment: number;
    requiredSkills: string[];
    matchedSkills: string[];
    gapSkills: string[];
    developmentPlan: string;
}
interface CompetencyGain {
    competency: string;
    beforeLevel: number;
    afterLevel: number;
    bloomsAlignment: BloomsLevel;
    dokAlignment: WebbDOKLevel;
}
interface AnalysisMetadata {
    analyzedAt: string;
    courseId: string;
    contentHash: string;
    engineVersion: string;
    totalChapters: number;
    totalSections: number;
    totalObjectives: number;
    completionPercentage: number;
    analysisDepth: 'basic' | 'detailed' | 'comprehensive';
    cached: boolean;
    processingTimeMs: number;
}

/**
 * Enhanced Course Depth Analysis Engine
 * Integrates Webb's DOK, Course Type Detection, Assessment Quality, and Objective Analysis
 */

interface DepthAnalysisLogger {
    info: (message: string, ...args: unknown[]) => void;
    warn?: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
}
interface CourseDepthAnalysisCacheEntry {
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
interface CourseDepthAnalysisHistoryEntry {
    id: string;
    snapshotAt: Date;
    cognitiveDepth: number;
    balanceScore: number;
    completenessScore: number;
    totalChapters: number;
    totalObjectives: number;
}
interface CourseDepthAnalysisSnapshotInput {
    courseId: string;
    snapshotAt: Date;
    cognitiveDepth: number;
    balanceScore: number;
    completenessScore: number;
    totalChapters: number;
    totalObjectives: number;
    metadata: Record<string, unknown>;
}
interface CourseDepthAnalysisStore {
    getCachedAnalysis: (courseId: string) => Promise<CourseDepthAnalysisCacheEntry | null>;
    saveAnalysis: (courseId: string, data: CourseDepthAnalysisCacheEntry) => Promise<void>;
    listHistoricalSnapshots?: (courseId: string, limit: number) => Promise<CourseDepthAnalysisHistoryEntry[]>;
    hasRecentSnapshot?: (courseId: string, since: Date) => Promise<boolean>;
    createHistoricalSnapshot?: (snapshot: CourseDepthAnalysisSnapshotInput) => Promise<void>;
}
interface EnhancedDepthAnalysisEngineOptions {
    storage?: CourseDepthAnalysisStore;
    logger?: DepthAnalysisLogger;
    contentHasher?: (courseData: CourseData) => string;
}
declare function generateCourseContentHash(course: CourseData): string;
interface CourseData {
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
interface ChapterData {
    id: string;
    title: string;
    description: string | null;
    learningOutcomes: string | null;
    position: number;
    sections: SectionData[];
}
interface SectionData {
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
declare class EnhancedDepthAnalysisEngine {
    private startTime;
    private readonly storage?;
    private readonly logger;
    private readonly contentHasher;
    constructor(options?: EnhancedDepthAnalysisEngineOptions);
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
declare const enhancedDepthEngine: EnhancedDepthAnalysisEngine;
declare const createEnhancedDepthAnalysisEngine: (options?: EnhancedDepthAnalysisEngineOptions) => EnhancedDepthAnalysisEngine;

export { type AssessmentQualityMetrics as A, type BloomsDistribution as B, type CourseType as C, type DepthAnalysisLogger as D, EnhancedDepthAnalysisEngine as E, type LearningPathway as L, type ObjectiveAnalysis as O, type Recommendation as R, type SectionData as S, type WebbDOKAnalysis as W, type WebbDOKDistribution as a, type WebbDOKLevel as b, type CourseTypeProfile as c, type ObjectiveDeduplicationResult as d, createEnhancedDepthAnalysisEngine as e, enhancedDepthEngine as f, generateCourseContentHash as g, type CourseData as h, type ChapterData as i, type CourseDepthAnalysisCacheEntry as j, type CourseDepthAnalysisHistoryEntry as k, type CourseDepthAnalysisSnapshotInput as l, type CourseDepthAnalysisStore as m, type EnhancedDepthAnalysisEngineOptions as n, type EnhancedDepthAnalysisResponse as o, type EnhancedChapterAnalysis as p, type EnhancedSectionAnalysis as q, type EnhancedRecommendations as r, type LearningGap as s, type StudentImpactAnalysis as t, type AnalysisMetadata as u };
