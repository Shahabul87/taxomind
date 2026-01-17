/**
 * @sam-ai/educational - Socratic Teaching Engine
 * Guides discovery learning through strategic questioning
 */
import type { SocraticTeachingConfig, SocraticQuestion, SocraticDialogue, SocraticResponse, StartDialogueInput, ContinueDialogueInput, ResponseAnalysis, DialoguePerformance, SocraticQuestionType } from '../types/socratic-teaching.types';
/**
 * SocraticTeachingEngine - Guides learning through discovery questioning
 *
 * Features:
 * - Strategic question generation based on Socratic method
 * - Response analysis for understanding and misconceptions
 * - Progressive dialogue management
 * - Hint system for struggling learners
 * - Synthesis and insight tracking
 * - Performance analytics
 */
export declare class SocraticTeachingEngine {
    private config;
    private database?;
    private aiAdapter?;
    private dialogueCache;
    constructor(config?: SocraticTeachingConfig);
    /**
     * Start a new Socratic dialogue
     */
    startDialogue(input: StartDialogueInput): Promise<SocraticResponse>;
    /**
     * Continue an existing dialogue
     */
    continueDialogue(input: ContinueDialogueInput): Promise<SocraticResponse>;
    /**
     * Get hint for current question
     */
    getHint(dialogueId: string, hintIndex?: number): Promise<string>;
    /**
     * End dialogue and get summary
     */
    endDialogue(dialogueId: string): Promise<{
        synthesis: string;
        performance: DialoguePerformance;
    }>;
    /**
     * Get dialogue by ID
     */
    getDialogue(dialogueId: string): Promise<SocraticDialogue | null>;
    /**
     * Get user's dialogue history
     */
    getUserDialogues(userId: string, limit?: number): Promise<SocraticDialogue[]>;
    /**
     * Generate a Socratic question
     */
    generateQuestion(topic: string, type: SocraticQuestionType, context?: {
        previousQuestions?: string[];
        currentUnderstanding?: string;
    }): Promise<SocraticQuestion>;
    /**
     * Analyze a student response
     */
    analyzeResponse(question: SocraticQuestion, response: string): Promise<ResponseAnalysis>;
    private generateQuestionWithAI;
    private generateTemplateQuestion;
    private analyzeWithAI;
    private analyzeWithRules;
    private generateKeyInsights;
    private generateSynthesis;
    private calculatePerformance;
    private calculateProgress;
    private shouldConclude;
    private concludeDialogue;
    private moveToNextQuestion;
    private getNextQuestionType;
    private determineDialogueState;
    private generateFeedback;
    private getIntroductionMessage;
    private getEncouragement;
    private extractJson;
}
/**
 * Factory function to create a SocraticTeachingEngine instance
 */
export declare function createSocraticTeachingEngine(config?: SocraticTeachingConfig): SocraticTeachingEngine;
//# sourceMappingURL=socratic-teaching-engine.d.ts.map