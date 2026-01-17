/**
 * Evaluation Memory Integration
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Main integration module that connects evaluations to student profiles
 */
import type { EvaluationOutcome, OutcomeRecordingResult, EvaluationMemoryIntegration as IEvaluationMemoryIntegration, StudentProfile, ReviewScheduleEntry, MemoryEntry, MemoryEntryType, ImportanceLevel, MemoryStore, StudentProfileStore, ReviewScheduleStore, LearningPathway, MemoryIntegrationConfig } from './types';
/**
 * In-memory implementation of MemoryStore
 */
export declare class InMemoryMemoryStore implements MemoryStore {
    private entries;
    /**
     * Store a memory entry
     */
    store(entry: Omit<MemoryEntry, 'id' | 'accessCount'>): Promise<MemoryEntry>;
    /**
     * Get a memory entry by ID
     */
    get(entryId: string): Promise<MemoryEntry | null>;
    /**
     * Search memories by type
     */
    getByType(studentId: string, type: MemoryEntryType, limit?: number): Promise<MemoryEntry[]>;
    /**
     * Search memories by topic
     */
    getByTopic(studentId: string, topicId: string, limit?: number): Promise<MemoryEntry[]>;
    /**
     * Get recent memories
     */
    getRecent(studentId: string, limit?: number): Promise<MemoryEntry[]>;
    /**
     * Get important memories
     */
    getImportant(studentId: string, minImportance: ImportanceLevel): Promise<MemoryEntry[]>;
    /**
     * Update access timestamp
     */
    recordAccess(entryId: string): Promise<void>;
    /**
     * Prune expired entries
     */
    pruneExpired(): Promise<number>;
    /**
     * Delete entries for a student
     */
    deleteForStudent(studentId: string): Promise<number>;
    /**
     * Clear all entries (for testing)
     */
    clear(): void;
    /**
     * Get all entries (for testing)
     */
    getAll(): MemoryEntry[];
}
/**
 * Configuration for EvaluationMemoryIntegrationImpl
 */
export interface EvaluationMemoryIntegrationImplConfig extends Partial<MemoryIntegrationConfig> {
    /**
     * Student profile store
     */
    profileStore: StudentProfileStore;
    /**
     * Review schedule store
     */
    reviewStore: ReviewScheduleStore;
    /**
     * Memory store
     */
    memoryStore: MemoryStore;
    /**
     * Optional logger
     */
    logger?: MemoryIntegrationLogger;
}
/**
 * Logger interface for memory integration
 */
export interface MemoryIntegrationLogger {
    debug(message: string, context?: Record<string, unknown>): void;
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(message: string, context?: Record<string, unknown>): void;
}
/**
 * Evaluation Memory Integration Implementation
 * Connects evaluation outcomes to student profiles and learning systems
 */
export declare class EvaluationMemoryIntegrationImpl implements IEvaluationMemoryIntegration {
    private readonly config;
    private readonly profileStore;
    private readonly memoryStore;
    private readonly masteryTracker;
    private readonly pathwayCalculator;
    private readonly spacedRepetitionScheduler;
    private readonly logger;
    constructor(implConfig: EvaluationMemoryIntegrationImplConfig);
    /**
     * Record an evaluation outcome
     */
    recordEvaluationOutcome(outcome: EvaluationOutcome): Promise<OutcomeRecordingResult>;
    /**
     * Get student profile
     */
    getStudentProfile(studentId: string): Promise<StudentProfile | null>;
    /**
     * Get pending reviews for a student
     */
    getPendingReviews(studentId: string): Promise<ReviewScheduleEntry[]>;
    /**
     * Get relevant memories for context
     */
    getRelevantMemories(studentId: string, topicId: string): Promise<MemoryEntry[]>;
    /**
     * Recalculate learning pathway
     */
    recalculatePathway(studentId: string, pathwayId: string): Promise<LearningPathway>;
    /**
     * Get mastery summary for a student
     */
    getMasterySummary(studentId: string): Promise<import("./mastery-tracker").MasterySummary>;
    /**
     * Get review statistics
     */
    getReviewStats(studentId: string): Promise<import("./spaced-repetition").ReviewStats>;
    /**
     * Create memory entries for an evaluation
     */
    private createMemoryEntries;
    /**
     * Calculate importance of an evaluation outcome
     */
    private calculateImportance;
}
/**
 * Create an in-memory memory store
 */
export declare function createInMemoryMemoryStore(): InMemoryMemoryStore;
/**
 * Create an evaluation memory integration
 */
export declare function createEvaluationMemoryIntegration(config: EvaluationMemoryIntegrationImplConfig): EvaluationMemoryIntegrationImpl;
/**
 * Get the default memory store (singleton)
 */
export declare function getDefaultMemoryStore(): InMemoryMemoryStore;
/**
 * Reset the default memory store (for testing)
 */
export declare function resetDefaultMemoryStore(): void;
//# sourceMappingURL=evaluation-memory-integration.d.ts.map