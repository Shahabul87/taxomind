/**
 * OLC Quality Scorecard for Online Programs
 * Online Learning Consortium Standards Implementation
 *
 * Citation: Online Learning Consortium. (2020). OLC Quality Scorecard Suite.
 * URL: https://onlinelearningconsortium.org/consult/olc-quality-scorecard-suite/
 *
 * Scoring Levels:
 * - 0: Deficient - No evidence
 * - 1: Developing - Minimal evidence
 * - 2: Accomplished - Adequate evidence
 * - 3: Exemplary - Comprehensive evidence
 */
import type { CourseAnalysisInput } from '../analyzers/deterministic-rubric-engine';
export type OLCCategory = 'CourseDevelopment' | 'CourseStructure' | 'TeachingAndLearning' | 'LearnerSupport' | 'EvaluationAndAssessment' | 'AccessibilityAndUsability';
export interface OLCIndicator {
    id: string;
    category: OLCCategory;
    indicator: string;
    scoringLevels: {
        0: string;
        1: string;
        2: string;
        3: string;
    };
    evidence: string[];
    automatedEvaluation: boolean;
}
export interface OLCIndicatorResult {
    indicatorId: string;
    category: OLCCategory;
    score: 0 | 1 | 2 | 3;
    levelDescription: string;
    notes?: string;
    evidence?: string[];
}
export interface OLCEvaluationResult {
    overallScore: number;
    maxPossibleScore: number;
    percentageScore: number;
    qualityLevel: 'Deficient' | 'Developing' | 'Accomplished' | 'Exemplary';
    categoryScores: Record<OLCCategory, {
        earned: number;
        max: number;
        percentage: number;
    }>;
    indicatorResults: OLCIndicatorResult[];
    strengths: string[];
    areasForImprovement: string[];
    recommendations: OLCRecommendation[];
    timestamp: string;
}
export interface OLCRecommendation {
    indicatorId: string;
    category: OLCCategory;
    priority: 'critical' | 'high' | 'medium' | 'low';
    currentLevel: string;
    targetLevel: string;
    actionSteps: string[];
}
export declare const OLC_INDICATORS: OLCIndicator[];
export declare class OLCEvaluator {
    private readonly VERSION;
    /**
     * Evaluate course against OLC Quality Scorecard
     */
    evaluate(courseData: CourseAnalysisInput): OLCEvaluationResult;
    /**
     * Get OLC evaluator version
     */
    getVersion(): string;
    /**
     * Get all OLC indicators
     */
    getIndicators(): OLCIndicator[];
    private evaluateIndicator;
    private evaluateCD1_InstructionalDesign;
    private evaluateCD2_MeasurableObjectives;
    private evaluateCD3_ActiveLearning;
    private evaluateCD4_MaterialVariety;
    private evaluateCD5_CognitiveLoad;
    private evaluateCS1_LogicalOrganization;
    private evaluateCS2_ContentChunking;
    private evaluateCS3_Consistency;
    private evaluateCS4_Introduction;
    private evaluateTL1_ObjectiveLevel;
    private evaluateTL2_InstructionalMethods;
    private evaluateTL3_PracticeOpportunities;
    private evaluateEA1_AssessmentAlignment;
    private evaluateEA2_AssessmentVariety;
    private evaluateEA3_FormativeAssessment;
    private evaluateEA4_ClearCriteria;
    private evaluateAU1_Navigation;
    private evaluateAU2_AccessibleMultimedia;
    private evaluateAU3_Readability;
    private createResult;
    private createManualReviewResult;
    private determineQualityLevel;
    private identifyStrengths;
    private identifyAreasForImprovement;
    private generateRecommendations;
}
export declare const olcEvaluator: OLCEvaluator;
//# sourceMappingURL=olc-scorecard.d.ts.map