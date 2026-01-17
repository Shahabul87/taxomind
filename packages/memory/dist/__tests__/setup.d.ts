/**
 * @sam-ai/memory - Test Setup
 * Mock utilities and sample data factories for testing
 */
import { vi } from 'vitest';
import type { BloomsLevel, MasteryLevel, TopicMastery, MasteryUpdate, PathwayStep, LearningPathway, PathwayAdjustment, ReviewPriority, ReviewScheduleEntry, CognitivePreferences, PerformanceMetrics, StudentProfile, EvaluationOutcome, MemoryEntryType, ImportanceLevel, MemoryEntry, StudentProfileStore, ReviewScheduleStore, MemoryStore } from '../types';
/**
 * Create a sample TopicMastery record
 */
export declare function createSampleTopicMastery(overrides?: Partial<TopicMastery>): TopicMastery;
/**
 * Create a sample MasteryUpdate
 */
export declare function createSampleMasteryUpdate(overrides?: Partial<MasteryUpdate>): MasteryUpdate;
/**
 * Create a sample PathwayStep
 */
export declare function createSamplePathwayStep(overrides?: Partial<PathwayStep>): PathwayStep;
/**
 * Create a sample LearningPathway
 */
export declare function createSampleLearningPathway(overrides?: Partial<LearningPathway>): LearningPathway;
/**
 * Create a sample PathwayAdjustment
 */
export declare function createSamplePathwayAdjustment(overrides?: Partial<PathwayAdjustment>): PathwayAdjustment;
/**
 * Create a sample ReviewScheduleEntry
 */
export declare function createSampleReviewScheduleEntry(overrides?: Partial<ReviewScheduleEntry>): ReviewScheduleEntry;
/**
 * Create sample CognitivePreferences
 */
export declare function createSampleCognitivePreferences(overrides?: Partial<CognitivePreferences>): CognitivePreferences;
/**
 * Create sample PerformanceMetrics
 */
export declare function createSamplePerformanceMetrics(overrides?: Partial<PerformanceMetrics>): PerformanceMetrics;
/**
 * Create a sample StudentProfile
 */
export declare function createSampleStudentProfile(overrides?: Partial<StudentProfile>): StudentProfile;
/**
 * Create a sample EvaluationOutcome
 */
export declare function createSampleEvaluationOutcome(overrides?: Partial<EvaluationOutcome>): EvaluationOutcome;
/**
 * Create a sample MemoryEntry
 */
export declare function createSampleMemoryEntry(overrides?: Partial<MemoryEntry>): MemoryEntry;
/**
 * Create a mock StudentProfileStore
 */
export declare function createMockStudentProfileStore(): StudentProfileStore & {
    [K in keyof StudentProfileStore]: ReturnType<typeof vi.fn>;
};
/**
 * Create a mock ReviewScheduleStore
 */
export declare function createMockReviewScheduleStore(): ReviewScheduleStore & {
    [K in keyof ReviewScheduleStore]: ReturnType<typeof vi.fn>;
};
/**
 * Create a mock MemoryStore
 */
export declare function createMockMemoryStore(): MemoryStore & {
    [K in keyof MemoryStore]: ReturnType<typeof vi.fn>;
};
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
 * Create a date offset from now
 */
export declare function createDateOffset(daysFromNow: number): Date;
/**
 * All Bloom's levels for iteration
 */
export declare const ALL_BLOOMS_LEVELS: BloomsLevel[];
/**
 * All mastery levels for iteration
 */
export declare const ALL_MASTERY_LEVELS: MasteryLevel[];
/**
 * All review priorities for iteration
 */
export declare const ALL_REVIEW_PRIORITIES: ReviewPriority[];
/**
 * All memory entry types for iteration
 */
export declare const ALL_MEMORY_ENTRY_TYPES: MemoryEntryType[];
/**
 * All importance levels for iteration
 */
export declare const ALL_IMPORTANCE_LEVELS: ImportanceLevel[];
//# sourceMappingURL=setup.d.ts.map