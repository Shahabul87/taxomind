/**
 * @sam-ai/educational - Test Setup
 * Mock utilities and sample data factories for testing
 */
import type { SAMConfig, AIAdapter, AIChatParams, AIChatResponse } from '@sam-ai/core';
/**
 * Create a mock AI response for testing
 */
export declare function createMockAIResponse(content: unknown): AIChatResponse;
/**
 * Create a mock AI adapter for testing
 */
export declare function createMockAIAdapter(responseOverride?: (params: AIChatParams) => AIChatResponse | Promise<AIChatResponse>): AIAdapter;
/**
 * Create a mock SAM config for testing
 */
export declare function createMockSAMConfig(overrides?: Partial<SAMConfig>): SAMConfig;
export declare const BLOOMS_LEVELS: readonly ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
export type BloomsLevel = (typeof BLOOMS_LEVELS)[number];
/**
 * Sample content for each Bloom's level
 */
export declare const BLOOMS_SAMPLE_CONTENT: Record<BloomsLevel, string>;
/**
 * Create a sample Bloom's distribution
 */
export declare function createSampleBloomsDistribution(overrides?: Partial<Record<BloomsLevel, number>>): Record<BloomsLevel, number>;
export interface SampleSection {
    id: string;
    title: string;
    content: string;
    position?: number;
}
export interface SampleChapter {
    id: string;
    title: string;
    position: number;
    sections: SampleSection[];
}
export interface SampleCourse {
    id: string;
    title: string;
    description?: string;
    chapters: SampleChapter[];
}
/**
 * Create a sample section
 */
export declare function createSampleSection(overrides?: Partial<SampleSection>): SampleSection;
/**
 * Create a sample chapter
 */
export declare function createSampleChapter(overrides?: Partial<SampleChapter>): SampleChapter;
/**
 * Create a sample course
 */
export declare function createSampleCourse(overrides?: Partial<SampleCourse>): SampleCourse;
export interface SampleStudentProfile {
    id: string;
    name: string;
    learningStyle: string;
    currentLevel: BloomsLevel;
    masteryScores: Record<string, number>;
    preferences: {
        pacePreference: 'slow' | 'moderate' | 'fast';
        contentLength: 'short' | 'medium' | 'long';
    };
}
/**
 * Create a sample student profile
 */
export declare function createSampleStudentProfile(overrides?: Partial<SampleStudentProfile>): SampleStudentProfile;
export interface SampleEvaluationContext {
    questionId: string;
    question: string;
    expectedAnswer: string;
    studentAnswer: string;
    bloomsLevel: BloomsLevel;
    maxScore: number;
}
/**
 * Create a sample evaluation context
 */
export declare function createSampleEvaluationContext(overrides?: Partial<SampleEvaluationContext>): SampleEvaluationContext;
export interface SamplePredictiveStudentProfile {
    userId: string;
    courseId: string;
    learningHistory: {
        averageScore: number;
        assessmentCount: number;
        completionRate: number;
        studyTimeMinutes: number;
    };
    performanceMetrics: {
        currentStreak: number;
        missedDeadlines: number;
        participationRate: number;
    };
    behaviorPatterns: {
        preferredStudyTime: string;
        averageSessionDuration: number;
        contentInteractionRate: number;
    };
}
/**
 * Create a sample predictive student profile
 */
export declare function createSamplePredictiveProfile(overrides?: Partial<SamplePredictiveStudentProfile>): SamplePredictiveStudentProfile;
/**
 * Wait for specified milliseconds
 */
export declare function wait(ms: number): Promise<void>;
/**
 * Create a deferred promise for testing async operations
 */
export declare function createDeferred<T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
};
/**
 * Generate a unique ID for testing
 */
export declare function generateTestId(prefix?: string): string;
/**
 * Create a mock function with typed return
 */
export declare function createTypedMock<T>(returnValue: T): import("vitest").Mock<(...args: any[]) => any>;
/**
 * Create an async mock function with typed return
 */
export declare function createAsyncMock<T>(returnValue: T): import("vitest").Mock<(...args: any[]) => any>;
/**
 * Assert that a value is within a range
 */
export declare function expectInRange(value: number, min: number, max: number): void;
/**
 * Assert that a distribution sums to 100
 */
export declare function expectValidDistribution(distribution: Record<string, number>): void;
/**
 * Assert that all Bloom's levels are present
 */
export declare function expectAllBloomsLevels(distribution: Record<string, number>): void;
//# sourceMappingURL=setup.d.ts.map