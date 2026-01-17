/**
 * Enhanced Course Depth Analysis Types
 * Comprehensive TypeScript interfaces for robust analysis engine
 */
import type { BloomsLevel } from '@sam-ai/core';
export interface BloomsDistribution {
    REMEMBER: number;
    UNDERSTAND: number;
    APPLY: number;
    ANALYZE: number;
    EVALUATE: number;
    CREATE: number;
    [key: string]: number;
}
export type BloomsBalance = 'well-balanced' | 'bottom-heavy' | 'top-heavy';
export type WebbDOKLevel = 1 | 2 | 3 | 4;
export interface WebbDOKAnalysis {
    level: WebbDOKLevel;
    levelName: 'Recall' | 'Skill/Concept' | 'Strategic Thinking' | 'Extended Thinking';
    indicators: string[];
    bloomsCorrelation: BloomsLevel;
    confidence: number;
}
export interface WebbDOKDistribution {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
}
export declare const WEBB_DOK_DESCRIPTORS: Record<WebbDOKLevel, {
    name: string;
    description: string;
    keywords: string[];
    bloomsMapping: BloomsLevel[];
}>;
export type CourseType = 'foundational' | 'intermediate' | 'advanced' | 'professional' | 'creative' | 'technical' | 'theoretical';
export interface CourseTypeProfile {
    type: CourseType;
    description: string;
    idealBloomsDistribution: BloomsDistribution;
    idealDOKDistribution: WebbDOKDistribution;
    primaryObjective: string;
    targetAudience: string;
}
export declare const COURSE_TYPE_PROFILES: Record<CourseType, CourseTypeProfile>;
export interface AssessmentQualityMetrics {
    overallScore: number;
    questionVariety: QuestionVarietyMetrics;
    difficultyProgression: DifficultyProgressionMetrics;
    bloomsCoverage: BloomsCoverageMetrics;
    feedbackQuality: FeedbackQualityMetrics;
    distractorAnalysis: DistractorAnalysisMetrics | null;
}
export interface QuestionVarietyMetrics {
    score: number;
    typeDistribution: Record<string, number>;
    uniqueTypes: number;
    recommendation: string;
}
export interface DifficultyProgressionMetrics {
    score: number;
    pattern: 'ascending' | 'descending' | 'random' | 'plateaued';
    averageDifficulty: number;
    isAppropriate: boolean;
    recommendation: string;
}
export interface BloomsCoverageMetrics {
    score: number;
    coveredLevels: BloomsLevel[];
    missingLevels: BloomsLevel[];
    distribution: BloomsDistribution;
    recommendation: string;
}
export interface FeedbackQualityMetrics {
    score: number;
    hasExplanations: boolean;
    explanationDepth: 'none' | 'basic' | 'detailed' | 'comprehensive';
    providesRemediation: boolean;
    recommendation: string;
}
export interface DistractorAnalysisMetrics {
    score: number;
    averagePlausibility: number;
    discriminationIndex: number;
    commonMistakes: string[];
    recommendation: string;
}
export interface ObjectiveAnalysis {
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
export interface SMARTCriteriaAnalysis {
    specific: CriterionScore;
    measurable: CriterionScore;
    achievable: CriterionScore;
    relevant: CriterionScore;
    timeBound: CriterionScore;
    overallScore: number;
}
export interface CriterionScore {
    score: number;
    feedback: string;
    suggestions: string[];
}
export interface MeasurabilityAnalysis {
    score: number;
    hasQuantifiableOutcome: boolean;
    assessmentMethod: string;
    verificationCriteria: string[];
}
export interface ObjectiveCluster {
    clusterId: string;
    objectives: string[];
    semanticSimilarity: number;
    recommendation: 'merge' | 'differentiate' | 'keep';
    suggestedMerge: string | null;
    reason: string;
}
export interface ObjectiveDeduplicationResult {
    totalObjectives: number;
    uniqueClusters: number;
    duplicateGroups: ObjectiveCluster[];
    recommendations: string[];
    optimizedObjectives: string[];
}
export interface AnalysisSnapshot {
    id: string;
    courseId: string;
    timestamp: Date;
    cognitiveDepth: number;
    balanceScore: number;
    completenessScore: number;
    bloomsDistribution: BloomsDistribution;
    dokDistribution: WebbDOKDistribution;
    assessmentQuality: number;
    totalChapters: number;
    totalSections: number;
    totalObjectives: number;
}
export interface TrendAnalysis {
    period: 'week' | 'month' | 'quarter' | 'year';
    snapshots: AnalysisSnapshot[];
    trends: TrendMetric[];
    improvements: ImprovementMetric[];
    regressions: RegressionMetric[];
    projections: ProjectionMetric[];
}
export interface TrendMetric {
    metric: string;
    startValue: number;
    endValue: number;
    changePercent: number;
    direction: 'improving' | 'declining' | 'stable';
    significance: 'low' | 'medium' | 'high';
}
export interface ImprovementMetric {
    area: string;
    improvement: number;
    milestone: string;
    date: Date;
}
export interface RegressionMetric {
    area: string;
    decline: number;
    possibleCause: string;
    suggestedAction: string;
}
export interface ProjectionMetric {
    metric: string;
    currentValue: number;
    projectedValue: number;
    timeframe: string;
    confidence: number;
}
export interface EnhancedChapterAnalysis {
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
export interface EnhancedSectionAnalysis {
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
export interface ComplexityMetrics {
    vocabularyLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
    conceptDensity: number;
    prerequisiteCount: number;
    estimatedStudyTime: number;
}
export interface ActivityAnalysis {
    type: string;
    bloomsLevel: BloomsLevel;
    dokLevel: WebbDOKLevel;
    description: string;
    engagementPotential: number;
}
export interface ChapterRecommendation {
    type: 'content' | 'structure' | 'activity' | 'assessment';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: string;
    implementation: string[];
}
export interface EnhancedDepthAnalysisResponse {
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
export interface LearningPathway {
    current: CognitivePath;
    recommended: CognitivePath;
    gaps: LearningGap[];
    milestones: LearningMilestone[];
}
export interface CognitivePath {
    stages: CognitiveStage[];
    currentStage: number;
    completionPercentage: number;
}
export interface CognitiveStage {
    level: BloomsLevel;
    dokLevel: WebbDOKLevel;
    mastery: number;
    activities: string[];
    timeEstimate: number;
}
export interface LearningGap {
    level: BloomsLevel;
    dokLevel: WebbDOKLevel;
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestions: string[];
    estimatedEffortHours: number;
}
export interface LearningMilestone {
    title: string;
    bloomsLevel: BloomsLevel;
    dokLevel: WebbDOKLevel;
    description: string;
    assessmentCriteria: string[];
}
export interface EnhancedRecommendations {
    immediate: Recommendation[];
    shortTerm: Recommendation[];
    longTerm: Recommendation[];
    contentAdjustments: ContentRecommendation[];
    assessmentChanges: AssessmentRecommendation[];
    activitySuggestions: ActivitySuggestion[];
}
export interface Recommendation {
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
export interface ContentRecommendation {
    type: 'add' | 'modify' | 'remove' | 'restructure';
    targetChapter: string | null;
    targetSection: string | null;
    bloomsLevel: BloomsLevel;
    dokLevel: WebbDOKLevel;
    description: string;
    impact: 'low' | 'medium' | 'high';
    implementation: string[];
}
export interface AssessmentRecommendation {
    type: string;
    bloomsLevel: BloomsLevel;
    dokLevel: WebbDOKLevel;
    description: string;
    examples: string[];
    rubricSuggestion: string;
}
export interface ActivitySuggestion {
    bloomsLevel: BloomsLevel;
    dokLevel: WebbDOKLevel;
    activityType: string;
    description: string;
    implementation: string;
    expectedOutcome: string;
    materials: string[];
    timeRequired: string;
}
export interface StudentImpactAnalysis {
    skillsDeveloped: SkillDevelopment[];
    cognitiveGrowth: GrowthProjection;
    careerAlignment: CareerPath[];
    competencyGains: CompetencyGain[];
}
export interface SkillDevelopment {
    name: string;
    bloomsLevel: BloomsLevel;
    dokLevel: WebbDOKLevel;
    proficiency: number;
    description: string;
    industryRelevance: number;
}
export interface GrowthProjection {
    currentLevel: number;
    projectedLevel: number;
    timeframe: string;
    keyMilestones: string[];
    confidenceInterval: {
        low: number;
        high: number;
    };
}
export interface CareerPath {
    role: string;
    alignment: number;
    requiredSkills: string[];
    matchedSkills: string[];
    gapSkills: string[];
    developmentPlan: string;
}
export interface CompetencyGain {
    competency: string;
    beforeLevel: number;
    afterLevel: number;
    bloomsAlignment: BloomsLevel;
    dokAlignment: WebbDOKLevel;
}
export interface AnalysisMetadata {
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
export type BloomsLevelKey = keyof BloomsDistribution;
export interface BloomsKeywordMap {
    level: BloomsLevel;
    keywords: string[];
    weight: number;
}
export declare const BLOOMS_KEYWORD_MAP: BloomsKeywordMap[];
export declare function getBloomsWeight(level: BloomsLevel): number;
export declare function bloomsToDOK(bloomsLevel: BloomsLevel): WebbDOKLevel;
export declare function dokToBlooms(dokLevel: WebbDOKLevel): BloomsLevel[];
//# sourceMappingURL=depth-analysis.types.d.ts.map