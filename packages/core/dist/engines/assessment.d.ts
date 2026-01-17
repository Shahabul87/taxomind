/**
 * @sam-ai/core - Assessment Engine
 * Generates adaptive assessments with Bloom's Taxonomy alignment
 */
import type { SAMConfig, EngineInput, BloomsLevel, BloomsDistribution, QuestionType, Question } from '../types';
import { BaseEngine } from './base';
export interface AssessmentConfig {
    questionCount: number;
    duration: number;
    bloomsDistribution: Partial<BloomsDistribution>;
    difficultyDistribution: {
        easy: number;
        medium: number;
        hard: number;
    };
    questionTypes: QuestionType[];
    adaptiveMode: boolean;
}
export interface GeneratedQuestion extends Question {
    targetBloomsLevel: BloomsLevel;
    cognitiveSkills: string[];
    commonMisconceptions?: string[];
}
export interface AssessmentAnalysis {
    bloomsComparison: {
        target: BloomsDistribution;
        actual: BloomsDistribution;
        alignment: number;
    };
    cognitiveProgression: {
        startLevel: BloomsLevel;
        endLevel: BloomsLevel;
        progressionScore: number;
    };
    skillsCoverage: {
        covered: string[];
        missing: string[];
        overRepresented: string[];
    };
    difficultyAnalysis: {
        averageDifficulty: number;
        distribution: {
            easy: number;
            medium: number;
            hard: number;
        };
        isBalanced: boolean;
    };
}
export interface StudyGuide {
    focusAreas: Array<{
        topic: string;
        importance: 'critical' | 'important' | 'helpful';
        description: string;
        resources?: string[];
    }>;
    practiceQuestions: GeneratedQuestion[];
    keyConceptsSummary: string[];
    studyTips: string[];
}
export interface AssessmentEngineOutput {
    questions: GeneratedQuestion[];
    analysis: AssessmentAnalysis;
    studyGuide?: StudyGuide;
    metadata: {
        totalPoints: number;
        estimatedDuration: number;
        averageDifficulty: 'easy' | 'medium' | 'hard';
        bloomsAlignment: number;
    };
}
export declare class AssessmentEngine extends BaseEngine<AssessmentEngineOutput> {
    private readonly defaultConfig;
    constructor(config: SAMConfig);
    protected performInitialization(): Promise<void>;
    protected process(input: EngineInput): Promise<AssessmentEngineOutput>;
    private buildAssessmentConfig;
    private normalizeDistribution;
    private generateQuestions;
    private buildQuestionGenerationPrompt;
    private buildQuestionRequestPrompt;
    private parseQuestionsResponse;
    private normalizeQuestion;
    private generateDefaultOptions;
    private generateDefaultQuestions;
    private analyzeAssessment;
    private generateStudyGuide;
    private extractTopicsFromQuestions;
    private calculateMetadata;
    protected getCacheKey(input: EngineInput): string;
}
export declare function createAssessmentEngine(config: SAMConfig): AssessmentEngine;
//# sourceMappingURL=assessment.d.ts.map