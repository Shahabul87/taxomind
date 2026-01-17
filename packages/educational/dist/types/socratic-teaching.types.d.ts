/**
 * @sam-ai/educational - Socratic Teaching Engine Types
 * Types for guided discovery learning through questioning
 */
import type { BloomsLevel } from '@sam-ai/core';
/**
 * Types of Socratic questions
 */
export type SocraticQuestionType = 'clarifying' | 'probing_assumptions' | 'probing_reasons' | 'questioning_viewpoints' | 'probing_implications' | 'questioning_the_question';
/**
 * Dialogue state in Socratic conversation
 */
export type DialogueState = 'introduction' | 'exploration' | 'clarification' | 'challenge' | 'synthesis' | 'conclusion';
/**
 * Configuration for the Socratic Teaching Engine
 */
export interface SocraticTeachingConfig {
    /** AI adapter for generating questions */
    aiAdapter?: {
        chat(params: {
            messages: {
                role: string;
                content: string;
            }[];
        }): Promise<{
            content: string;
        }>;
    };
    /** Database adapter for storing dialogues */
    database?: SocraticDatabaseAdapter;
    /** Maximum questions before conclusion */
    maxQuestions?: number;
    /** Enable hint system */
    enableHints?: boolean;
    /** Patience level (how long to wait before giving hints) */
    patienceLevel?: 'low' | 'medium' | 'high';
    /** Enable encouraging feedback */
    encouragingMode?: boolean;
}
/**
 * A Socratic question
 */
export interface SocraticQuestion {
    /** Question ID */
    id: string;
    /** Question type */
    type: SocraticQuestionType;
    /** The question text */
    question: string;
    /** Purpose of this question */
    purpose: string;
    /** Expected direction of thought */
    expectedDirection: string;
    /** Bloom's level this targets */
    bloomsLevel: BloomsLevel;
    /** Follow-up questions if student struggles */
    fallbackQuestions: string[];
    /** Hints if student is stuck */
    hints: string[];
    /** Key insights to draw out */
    keyInsights: string[];
}
/**
 * Student response to a Socratic question
 */
export interface SocraticStudentResponse {
    /** Response ID */
    id: string;
    /** Question ID this responds to */
    questionId: string;
    /** The response text */
    response: string;
    /** Response timestamp */
    timestamp: Date;
    /** Time taken to respond in seconds */
    responseTime: number;
    /** Whether student asked for hint */
    usedHint: boolean;
}
/**
 * Analysis of a student response
 */
export interface ResponseAnalysis {
    /** Quality score (0-100) */
    qualityScore: number;
    /** Depth of thinking (0-100) */
    thinkingDepth: number;
    /** Evidence of understanding */
    understandingIndicators: string[];
    /** Misconceptions detected */
    misconceptions: string[];
    /** Gaps in reasoning */
    reasoningGaps: string[];
    /** Strengths identified */
    strengths: string[];
    /** Whether the key insight was reached */
    reachedInsight: boolean;
    /** Recommended next question type */
    recommendedNextType: SocraticQuestionType;
    /** Bloom's level demonstrated */
    demonstratedBloomsLevel: BloomsLevel;
}
/**
 * Socratic dialogue session
 */
export interface SocraticDialogue {
    /** Dialogue ID */
    id: string;
    /** User ID */
    userId: string;
    /** Topic being explored */
    topic: string;
    /** Learning objective */
    learningObjective: string;
    /** Current dialogue state */
    state: DialogueState;
    /** Question-response pairs */
    exchanges: DialogueExchange[];
    /** Key insights discovered */
    discoveredInsights: string[];
    /** Remaining insights to discover */
    remainingInsights: string[];
    /** Session started at */
    startedAt: Date;
    /** Session ended at */
    endedAt?: Date;
    /** Final synthesis */
    synthesis?: string;
    /** Overall performance */
    performance?: DialoguePerformance;
}
/**
 * A question-response exchange
 */
export interface DialogueExchange {
    /** Exchange order */
    order: number;
    /** The question asked */
    question: SocraticQuestion;
    /** The student's response */
    response?: SocraticStudentResponse;
    /** Analysis of the response */
    analysis?: ResponseAnalysis;
    /** Tutor's feedback */
    feedback?: string;
}
/**
 * Performance metrics for a dialogue
 */
export interface DialoguePerformance {
    /** Total exchanges */
    totalExchanges: number;
    /** Average response quality */
    averageQuality: number;
    /** Average thinking depth */
    averageDepth: number;
    /** Insights discovered percentage */
    insightDiscoveryRate: number;
    /** Time to complete in minutes */
    completionTime: number;
    /** Hints used */
    hintsUsed: number;
    /** Highest Bloom's level achieved */
    highestBloomsLevel: BloomsLevel;
    /** Growth indicators */
    growth: {
        factor: string;
        description: string;
    }[];
    /** Areas for improvement */
    improvementAreas: string[];
}
/**
 * Input to start a Socratic dialogue
 */
export interface StartDialogueInput {
    /** User ID */
    userId: string;
    /** Topic to explore */
    topic: string;
    /** Specific learning objective */
    learningObjective?: string;
    /** User's current understanding (for calibration) */
    priorKnowledge?: string;
    /** Target Bloom's level to reach */
    targetBloomsLevel?: BloomsLevel;
    /** Preferred question style */
    preferredStyle?: 'gentle' | 'challenging' | 'balanced';
    /** Maximum session duration in minutes */
    maxDuration?: number;
}
/**
 * Response from the engine for next step
 */
export interface SocraticResponse {
    /** Current dialogue state */
    state: DialogueState;
    /** The question to ask (if in questioning state) */
    question?: SocraticQuestion;
    /** Feedback on previous response */
    feedback?: string;
    /** Encouragement message */
    encouragement?: string;
    /** Synthesis (if in conclusion state) */
    synthesis?: string;
    /** Key insights discovered so far */
    discoveredInsights: string[];
    /** Progress percentage */
    progress: number;
    /** Suggested hints (if struggling) */
    availableHints?: string[];
    /** Whether the dialogue is complete */
    isComplete: boolean;
}
/**
 * Input for continuing a dialogue
 */
export interface ContinueDialogueInput {
    /** Dialogue ID */
    dialogueId: string;
    /** Student's response */
    response: string;
    /** Whether student requested a hint */
    requestedHint?: boolean;
    /** Whether student wants to skip this question */
    skipQuestion?: boolean;
}
/**
 * Database adapter for Socratic dialogues
 */
export interface SocraticDatabaseAdapter {
    /** Create a new dialogue */
    createDialogue(dialogue: Omit<SocraticDialogue, 'id'>): Promise<string>;
    /** Get a dialogue by ID */
    getDialogue(dialogueId: string): Promise<SocraticDialogue | null>;
    /** Update a dialogue */
    updateDialogue(dialogueId: string, updates: Partial<SocraticDialogue>): Promise<void>;
    /** Get user's dialogue history */
    getUserDialogues(userId: string, options?: {
        limit?: number;
        topic?: string;
    }): Promise<SocraticDialogue[]>;
    /** Save an exchange */
    saveExchange(dialogueId: string, exchange: DialogueExchange): Promise<void>;
}
/**
 * Socratic Teaching Engine interface
 */
export interface SocraticTeachingEngine {
    /** Start a new Socratic dialogue */
    startDialogue(input: StartDialogueInput): Promise<SocraticResponse>;
    /** Continue an existing dialogue */
    continueDialogue(input: ContinueDialogueInput): Promise<SocraticResponse>;
    /** Get hint for current question */
    getHint(dialogueId: string, hintIndex?: number): Promise<string>;
    /** End dialogue and get summary */
    endDialogue(dialogueId: string): Promise<{
        synthesis: string;
        performance: DialoguePerformance;
    }>;
    /** Get dialogue by ID */
    getDialogue(dialogueId: string): Promise<SocraticDialogue | null>;
    /** Get user's dialogue history */
    getUserDialogues(userId: string, limit?: number): Promise<SocraticDialogue[]>;
    /** Generate question for a topic */
    generateQuestion(topic: string, type: SocraticQuestionType, context?: {
        previousQuestions?: string[];
        currentUnderstanding?: string;
    }): Promise<SocraticQuestion>;
    /** Analyze a response */
    analyzeResponse(question: SocraticQuestion, response: string): Promise<ResponseAnalysis>;
}
//# sourceMappingURL=socratic-teaching.types.d.ts.map