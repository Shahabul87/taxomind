/**
 * Evaluation Engine Types
 */
import type { SAMConfig, SAMDatabaseAdapter, BloomsLevel } from '@sam-ai/core';
import type { QuestionType, QuestionDifficulty, EvaluationType } from './common';
import type { QuestionOption, EnhancedQuestion } from './exam.types';
export interface EvaluationEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
    settings?: EvaluationSettings;
}
export interface EvaluationSettings {
    enableAutoGrading: boolean;
    enableAIAssistance: boolean;
    enablePartialCredit: boolean;
    strictnessLevel: 'lenient' | 'moderate' | 'strict';
    feedbackDepth: 'minimal' | 'standard' | 'comprehensive';
    bloomsAnalysis: boolean;
    misconceptionDetection: boolean;
    adaptiveHints: boolean;
}
export interface EvaluationContext {
    questionText: string;
    questionType: QuestionType;
    expectedAnswer: string;
    acceptableVariations?: string[];
    rubric?: EvaluationRubric;
    bloomsLevel: BloomsLevel;
    maxPoints: number;
    learningObjective?: string;
    relatedConcepts?: string[];
}
export interface EvaluationRubric {
    criteria: RubricCriterion[];
    totalPoints: number;
}
export interface RubricCriterion {
    name: string;
    description: string;
    maxPoints: number;
    levels: RubricLevel[];
}
export interface RubricLevel {
    score: number;
    description: string;
}
export interface EvaluationResult {
    questionId: string;
    score: number;
    maxScore: number;
    isCorrect: boolean | null;
    feedback: string;
    bloomsLevel: BloomsLevel;
    demonstratedLevel?: BloomsLevel;
    evaluationType: EvaluationType;
    rubricScores?: RubricScore[];
    strengths?: string[];
    improvements?: string[];
    nextSteps?: string[];
}
export interface RubricScore {
    criterionName: string;
    score: number;
    maxScore: number;
    justification: string;
}
export interface SubjectiveEvaluationResult {
    score: number;
    maxScore: number;
    accuracy: number;
    completeness: number;
    relevance: number;
    depth: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    nextSteps: string[];
    demonstratedBloomsLevel: BloomsLevel;
    misconceptions?: string[];
    partialCreditBreakdown?: PartialCreditItem[];
}
export interface PartialCreditItem {
    concept: string;
    pointsAwarded: number;
    maxPoints: number;
    reason: string;
}
export interface GradingAssistance {
    suggestedScore: number;
    maxScore: number;
    confidence: number;
    reasoning: string;
    rubricAlignment: RubricScore[];
    keyStrengths: string[];
    keyWeaknesses: string[];
    suggestedFeedback: string;
    flaggedIssues: string[];
    comparisonToExpected: ComparisonAnalysis;
    teacherTips: string[];
}
export interface ComparisonAnalysis {
    coveragePercentage: number;
    missingKeyPoints: string[];
    extraneousPoints: string[];
    accuracyScore: number;
}
export interface ObjectiveAnswer {
    questionId: string;
    questionType: QuestionType;
    studentAnswer: string;
    correctAnswer: string;
    options?: QuestionOption[];
    points: number;
    bloomsLevel: BloomsLevel;
}
export interface AssessmentGenerationConfig {
    assessmentType: 'quiz' | 'exam' | 'practice' | 'formative' | 'summative';
    subject: string;
    topic: string;
    difficulty: QuestionDifficulty;
    questionCount: number;
    duration: number;
    learningObjectives: string[];
    bloomsLevels: BloomsLevel[];
    questionTypes: QuestionType[];
}
export interface GeneratedAssessment {
    id: string;
    assessmentType: string;
    subject: string;
    topic: string;
    difficulty: QuestionDifficulty;
    duration: number;
    questions: EnhancedQuestion[];
    metadata: AssessmentMetadata;
    instructions: string;
    scoringGuide: ScoringGuide;
    rubric?: AssessmentRubric;
    createdAt: string;
}
export interface AssessmentMetadata {
    totalQuestions: number;
    totalPoints: number;
    estimatedDuration: number;
    bloomsDistribution: Record<BloomsLevel, number>;
    learningObjectives: string[];
}
export interface ScoringGuide {
    totalPoints: number;
    passingScore: number;
    gradingScale: Record<string, number>;
    partialCredit: boolean;
}
export interface AssessmentRubric {
    criteria: RubricCriterion[];
    performanceLevels: string[];
    scoringGuide: Record<string, number>;
    totalPoints: number;
}
export interface AdaptiveQuestionRequest {
    subject: string;
    topic: string;
    currentDifficulty: QuestionDifficulty;
    previousQuestions: EnhancedQuestion[];
    studentResponses: StudentResponse[];
    adaptiveSettings?: AdaptiveQuestionSettings;
}
export interface StudentResponse {
    questionId: string;
    isCorrect: boolean;
    timeSpent: number;
    confidence?: number;
}
export interface AdaptiveQuestionSettings {
    targetAccuracy: number;
    difficultyAdjustmentRate: number;
    minQuestions: number;
    maxQuestions: number;
}
export interface AdaptiveQuestionResult {
    question: EnhancedQuestion;
    adjustedDifficulty: QuestionDifficulty;
    performanceAnalysis: PerformanceAnalysis;
    adaptationReason: string;
    nextRecommendation: string;
}
export interface PerformanceAnalysis {
    accuracy: number;
    averageTimeSpent: number;
    trend: 'improving' | 'stable' | 'declining';
    confidence: number;
    timeEfficiency: number;
}
//# sourceMappingURL=evaluation.types.d.ts.map