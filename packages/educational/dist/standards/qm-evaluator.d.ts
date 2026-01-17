/**
 * Quality Matters (QM) Higher Education Rubric Evaluator
 * 7th Edition Standards Implementation
 *
 * Citation: Quality Matters. (2023). Higher Education Rubric, 7th Edition.
 * URL: https://www.qualitymatters.org/qa-resources/rubric-standards/higher-ed-rubric
 *
 * QM Scoring System:
 * - 3 points: Met (meets standard)
 * - 2 points: Minor issues (meets with minor concerns)
 * - 1 point: Significant issues (does not meet)
 * - 0 points: Not applicable or not evaluated
 *
 * Essential Standards must score 3 to achieve QM certification
 */
import type { CourseAnalysisInput } from '../analyzers/deterministic-rubric-engine';
export type QMGeneralStandard = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export interface QMStandard {
    id: string;
    generalStandard: QMGeneralStandard;
    description: string;
    points: 3 | 2 | 1;
    essential: boolean;
    annotation: string;
    checkCriteria: string[];
    automatedCheckPossible: boolean;
}
export interface QMStandardResult {
    standardId: string;
    status: 'met' | 'partially_met' | 'not_met' | 'manual_review_required' | 'not_evaluated';
    score: 0 | 1 | 2 | 3;
    maxScore: number;
    notes?: string;
    evidence?: string[];
    recommendations?: string[];
}
export interface QMEvaluationResult {
    overallScore: number;
    maxPossibleScore: number;
    percentageScore: number;
    essentialsMet: boolean;
    essentialsCount: {
        met: number;
        total: number;
    };
    qmCertifiable: boolean;
    standardResults: QMStandardResult[];
    categoryScores: Record<QMGeneralStandard, {
        earned: number;
        max: number;
        percentage: number;
    }>;
    recommendations: QMRecommendation[];
    timestamp: string;
}
export interface QMRecommendation {
    standardId: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionSteps: string[];
    isEssential: boolean;
}
export declare const QM_STANDARDS: QMStandard[];
export declare class QMEvaluator {
    private readonly VERSION;
    /**
     * Evaluate course against QM Higher Education Rubric (7th Edition)
     */
    evaluate(courseData: CourseAnalysisInput): QMEvaluationResult;
    /**
     * Get the QM evaluator version
     */
    getVersion(): string;
    /**
     * Get all QM standards for reference
     */
    getStandards(): QMStandard[];
    /**
     * Get essential standards only
     */
    getEssentialStandards(): QMStandard[];
    private evaluateStandard;
    private evaluate1_1_CourseNavigation;
    private evaluate1_2_CourseIntroduction;
    private evaluate1_7_Prerequisites;
    private evaluate1_8_InstructorIntro;
    private evaluate2_1_MeasurableObjectives;
    private evaluate2_2_ModuleObjectives;
    private evaluate2_3_LearnerCenteredObjectives;
    private evaluate2_4_ObjectiveActivityAlignment;
    private evaluate2_5_ObjectiveLevel;
    private evaluate3_1_AssessmentAlignment;
    private evaluate3_3_EvaluationCriteria;
    private evaluate3_4_AssessmentVariety;
    private evaluate3_5_ProgressTracking;
    private evaluate4_1_MaterialsAlignment;
    private evaluate4_5_MaterialVariety;
    private evaluate5_1_ActivityAlignment;
    private evaluate5_2_ActiveLearning;
    private evaluate8_1_Navigation;
    private evaluate8_2_Readability;
    private evaluate8_3_AccessibleContent;
    private evaluate8_4_AccessibleMultimedia;
    private evaluate8_5_MultimediaUsability;
    private generateRecommendations;
}
export declare const qmEvaluator: QMEvaluator;
//# sourceMappingURL=qm-evaluator.d.ts.map