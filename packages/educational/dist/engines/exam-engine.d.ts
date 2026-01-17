/**
 * @sam-ai/educational - ExamEngine
 * Portable exam generation engine using adapter pattern
 */
import type { ExamEngineConfig, ExamGenerationConfig, ExamGenerationResponse, StudentProfile, BloomsAnalysisResult, QuestionBankEntry, QuestionBankQuery, QuestionBankStats } from '../types';
export declare class AdvancedExamEngine {
    private config;
    private database?;
    private logger;
    constructor(engineConfig: ExamEngineConfig);
    /**
     * Generate a comprehensive exam with Bloom's taxonomy alignment
     */
    generateExam(courseId: string | null, sectionIds: string[] | null, config: ExamGenerationConfig, studentProfile?: StudentProfile): Promise<ExamGenerationResponse>;
    /**
     * Get question bank questions using database adapter
     */
    private getQuestionBankQuestions;
    /**
     * Analyze student performance for adaptive exam generation
     */
    private analyzeStudentPerformance;
    /**
     * Generate questions using AI
     */
    private generateQuestions;
    /**
     * Generate questions using AI adapter
     */
    private generateQuestionsWithAI;
    /**
     * Build the question generation prompt
     */
    private buildQuestionGenerationPrompt;
    /**
     * Parse AI-generated questions
     */
    private parseGeneratedQuestions;
    /**
     * Generate fallback questions when AI fails
     */
    private generateFallbackQuestions;
    /**
     * Select matching questions from existing pool
     */
    private selectMatchingQuestions;
    /**
     * Calculate exam metadata
     */
    private calculateMetadata;
    /**
     * Calculate Bloom's alignment analysis
     */
    private calculateBloomsAlignment;
    /**
     * Generate adaptive settings
     */
    private generateAdaptiveSettings;
    /**
     * Generate study guide based on exam content
     */
    private generateStudyGuide;
    /**
     * Get exam analysis
     */
    getExamAnalysis(examId: string): Promise<BloomsAnalysisResult>;
    /**
     * Save questions to the question bank
     */
    saveToQuestionBank(questions: QuestionBankEntry[], courseId: string | null, subject: string, topic: string): Promise<{
        saved: number;
        errors: string[];
    }>;
    /**
     * Retrieve questions from the question bank matching query criteria
     */
    getFromQuestionBank(query: QuestionBankQuery): Promise<{
        questions: QuestionBankEntry[];
        total: number;
        hasMore: boolean;
    }>;
    /**
     * Get statistics about the question bank
     */
    getQuestionBankStats(query: Partial<QuestionBankQuery>): Promise<QuestionBankStats>;
    /**
     * Update question usage statistics after exam completion
     */
    updateQuestionUsage(questionIds: string[], results: Array<{
        questionId: string;
        correct: boolean;
        timeSpent: number;
    }>): Promise<void>;
    private mapToQuestionBankEntry;
    private calculateQuestionBankStats;
    private getEmptyStats;
    private mapQuestionTypeToSAM;
    private mapDatabaseQuestion;
    private generateCognitiveProgression;
    private calculateSkillsCovered;
    private getCognitiveProcess;
    private generateId;
    private shuffleArray;
}
export declare function createExamEngine(config: ExamEngineConfig): AdvancedExamEngine;
//# sourceMappingURL=exam-engine.d.ts.map