/**
 * Engine Interfaces
 */
import type { BloomsLevel } from '@sam-ai/core';
import type { ExamGenerationConfig, StudentProfile, EnhancedQuestion, Resource } from './exam.types';
import type { EvaluationContext, SubjectiveEvaluationResult, EvaluationResult, GradingAssistance, ObjectiveAnswer } from './evaluation.types';
import type { BloomsAnalysisResult, CognitiveProfile, LearningRecommendation, SpacedRepetitionInput, SpacedRepetitionResult, CourseAnalysisInput, CourseAnalysisOptions, CourseBloomsAnalysisResult } from './blooms.types';
export interface ExamEngine {
    generateExam(courseId: string | null, sectionIds: string[] | null, config: ExamGenerationConfig, studentProfile?: StudentProfile): Promise<{
        exam: {
            id: string;
            questions: EnhancedQuestion[];
            metadata: {
                totalQuestions: number;
                totalPoints: number;
                estimatedDuration: number;
                bloomsDistribution: Record<BloomsLevel, number>;
                difficultyDistribution: Record<string, number>;
                topicsCovered: string[];
                learningObjectives: string[];
            };
        };
        bloomsAnalysis: {
            targetVsActual: {
                target: Record<BloomsLevel, number>;
                actual: Record<BloomsLevel, number>;
                deviation: Record<BloomsLevel, number>;
                alignmentScore: number;
            };
            cognitiveProgression: string[];
            skillsCovered: Array<{
                name: string;
                bloomsLevel: BloomsLevel;
                coverage: number;
            }>;
        };
        adaptiveSettings?: {
            startingQuestionDifficulty: string;
            adjustmentRules: Array<{
                condition: string;
                action: string;
                threshold: number;
            }>;
            performanceThresholds: Array<{
                level: string;
                minScore: number;
                action: string;
            }>;
            minQuestions: number;
            maxQuestions: number;
        };
        studyGuide: {
            focusAreas: string[];
            recommendedResources: Resource[];
            practiceQuestions: EnhancedQuestion[];
        };
    }>;
    getExamAnalysis(examId: string): Promise<BloomsAnalysisResult>;
    generateStudyGuide(examId: string, studentId?: string): Promise<{
        focusAreas: string[];
        recommendedResources: Resource[];
        practiceQuestions: EnhancedQuestion[];
    }>;
}
export interface EvaluationEngine {
    evaluateAnswer(studentAnswer: string, context: EvaluationContext): Promise<SubjectiveEvaluationResult>;
    evaluateObjectiveAnswer(answer: ObjectiveAnswer): EvaluationResult;
    getGradingAssistance(questionText: string, expectedAnswer: string, studentAnswer: string, rubric: {
        criteria: string[];
        maxScore: number;
    }, bloomsLevel: BloomsLevel): Promise<GradingAssistance>;
    explainResultToStudent(question: string, result: EvaluationResult, studentName: string): Promise<string>;
}
export interface BloomsAnalysisEngine {
    analyzeContent(content: string): Promise<BloomsAnalysisResult>;
    analyzeCourse(courseData: CourseAnalysisInput, options?: CourseAnalysisOptions): Promise<CourseBloomsAnalysisResult>;
    updateCognitiveProgress(userId: string, sectionId: string, bloomsLevel: BloomsLevel, score: number): Promise<void>;
    calculateSpacedRepetition(input: SpacedRepetitionInput): Promise<SpacedRepetitionResult>;
    getCognitiveProfile(userId: string, courseId?: string): Promise<CognitiveProfile>;
    getRecommendations(userId: string, courseId?: string): Promise<LearningRecommendation[]>;
}
//# sourceMappingURL=interfaces.d.ts.map