/**
 * Student Profile Store
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Storage implementations for student profiles
 */
import type { StudentProfile, StudentProfileStore, TopicMastery, MasteryUpdate, LearningPathway, PathwayAdjustment, PerformanceMetrics } from './types';
/**
 * In-memory implementation of StudentProfileStore
 * Suitable for development and testing
 */
export declare class InMemoryStudentProfileStore implements StudentProfileStore {
    private profiles;
    /**
     * Get a student profile
     */
    get(studentId: string): Promise<StudentProfile | null>;
    /**
     * Create or update a student profile
     */
    save(profile: StudentProfile): Promise<void>;
    /**
     * Update mastery for a topic
     */
    updateMastery(studentId: string, update: MasteryUpdate): Promise<TopicMastery>;
    /**
     * Get mastery for a topic
     */
    getMastery(studentId: string, topicId: string): Promise<TopicMastery | null>;
    /**
     * Update learning pathway
     */
    updatePathway(studentId: string, pathwayId: string, adjustment: PathwayAdjustment): Promise<LearningPathway>;
    /**
     * Get active pathways for a student
     */
    getActivePathways(studentId: string): Promise<LearningPathway[]>;
    /**
     * Update performance metrics
     */
    updateMetrics(studentId: string, metrics: Partial<PerformanceMetrics>): Promise<PerformanceMetrics>;
    /**
     * Get knowledge gaps
     */
    getKnowledgeGaps(studentId: string): Promise<string[]>;
    /**
     * Delete a student profile
     */
    delete(studentId: string): Promise<void>;
    /**
     * Compare Bloom's levels and return higher one
     */
    private higherBloomsLevel;
    /**
     * Update overall metrics after mastery change
     */
    private updateOverallMetrics;
    /**
     * Clear all profiles (for testing)
     */
    clear(): void;
    /**
     * Get all profiles (for testing)
     */
    getAll(): StudentProfile[];
}
/**
 * Configuration for Prisma-based student profile store
 */
export interface PrismaStudentProfileStoreConfig {
    /**
     * Prisma client instance
     */
    prisma: any;
    /**
     * Table/model name for student profiles
     */
    profileTableName?: string;
    /**
     * Table/model name for topic mastery
     */
    masteryTableName?: string;
    /**
     * Table/model name for learning pathways
     */
    pathwayTableName?: string;
}
/**
 * Prisma-based implementation of StudentProfileStore
 * Ready for database integration
 */
export declare class PrismaStudentProfileStore implements StudentProfileStore {
    private prisma;
    private profileTableName;
    private masteryTableName;
    private pathwayTableName;
    constructor(config: PrismaStudentProfileStoreConfig);
    /**
     * Get a student profile
     */
    get(studentId: string): Promise<StudentProfile | null>;
    /**
     * Create or update a student profile
     */
    save(profile: StudentProfile): Promise<void>;
    /**
     * Update mastery for a topic
     */
    updateMastery(studentId: string, update: MasteryUpdate): Promise<TopicMastery>;
    /**
     * Get mastery for a topic
     */
    getMastery(studentId: string, topicId: string): Promise<TopicMastery | null>;
    /**
     * Update learning pathway
     */
    updatePathway(studentId: string, pathwayId: string, adjustment: PathwayAdjustment): Promise<LearningPathway>;
    /**
     * Get active pathways for a student
     */
    getActivePathways(studentId: string): Promise<LearningPathway[]>;
    /**
     * Update performance metrics
     */
    updateMetrics(studentId: string, metrics: Partial<PerformanceMetrics>): Promise<PerformanceMetrics>;
    /**
     * Get knowledge gaps
     */
    getKnowledgeGaps(studentId: string): Promise<string[]>;
    /**
     * Delete a student profile
     */
    delete(studentId: string): Promise<void>;
    /**
     * Map database result to StudentProfile
     */
    private mapToProfile;
    /**
     * Map database result to TopicMastery
     */
    private mapToMastery;
    /**
     * Map database result to LearningPathway
     */
    private mapToPathway;
}
/**
 * Create an in-memory student profile store
 */
export declare function createInMemoryStudentProfileStore(): InMemoryStudentProfileStore;
/**
 * Create a Prisma-based student profile store
 */
export declare function createPrismaStudentProfileStore(config: PrismaStudentProfileStoreConfig): PrismaStudentProfileStore;
/**
 * Get the default student profile store (singleton)
 */
export declare function getDefaultStudentProfileStore(): InMemoryStudentProfileStore;
/**
 * Reset the default student profile store (for testing)
 */
export declare function resetDefaultStudentProfileStore(): void;
//# sourceMappingURL=student-profile-store.d.ts.map