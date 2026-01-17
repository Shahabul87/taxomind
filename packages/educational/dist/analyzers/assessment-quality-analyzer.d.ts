/**
 * Assessment Quality Analyzer
 * Evaluates the quality and effectiveness of course assessments
 */
import type { BloomsLevel } from '@sam-ai/core';
import { AssessmentQualityMetrics } from '../types/depth-analysis.types';
export interface ExamData {
    id: string;
    title: string;
    questions: QuestionData[];
}
export interface QuestionData {
    id: string;
    text: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'coding' | 'matching';
    bloomsLevel?: BloomsLevel;
    difficulty?: number;
    options?: OptionData[];
    explanation?: string;
    feedback?: string;
    points?: number;
}
export interface OptionData {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation?: string;
}
export declare class AssessmentQualityAnalyzer {
    private readonly IDEAL_BLOOMS_COVERAGE;
    /**
     * Perform comprehensive assessment quality analysis
     */
    analyzeAssessments(exams: ExamData[]): AssessmentQualityMetrics;
    /**
     * Analyze variety of question types
     */
    private analyzeQuestionVariety;
    /**
     * Analyze difficulty progression across questions
     */
    private analyzeDifficultyProgression;
    /**
     * Analyze Bloom's Taxonomy coverage
     */
    private analyzeBloomsCoverage;
    /**
     * Analyze quality of feedback and explanations
     */
    private analyzeFeedbackQuality;
    /**
     * Analyze distractor quality for multiple choice questions
     */
    private analyzeDistractors;
    /**
     * Infer Bloom's level from question text
     */
    private inferBloomsLevel;
    /**
     * Determine difficulty pattern
     */
    private determineDifficultyPattern;
    /**
     * Calculate overall score
     */
    private calculateOverallScore;
    /**
     * Get empty metrics for courses without assessments
     */
    private getEmptyMetrics;
    /**
     * Recommendation generators
     */
    private getVarietyRecommendation;
    private getDifficultyRecommendation;
    private getBloomsCoverageRecommendation;
    private getFeedbackRecommendation;
    private getDistractorRecommendation;
}
export declare const assessmentQualityAnalyzer: AssessmentQualityAnalyzer;
//# sourceMappingURL=assessment-quality-analyzer.d.ts.map