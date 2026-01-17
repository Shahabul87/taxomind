/**
 * Test Setup for @sam-ai/adapter-prisma
 * Mock Prisma client and utilities for testing
 */
import { vi } from 'vitest';
/**
 * Creates a mock Prisma model with all common operations
 */
export declare function createMockPrismaModel<T>(): {
    findUnique: import("vitest").Mock<(...args: any[]) => any>;
    findMany: import("vitest").Mock<(...args: any[]) => any>;
    create: import("vitest").Mock<(...args: any[]) => any>;
    update: import("vitest").Mock<(...args: any[]) => any>;
    upsert: import("vitest").Mock<(...args: any[]) => any>;
    delete: import("vitest").Mock<(...args: any[]) => any>;
    deleteMany: import("vitest").Mock<(...args: any[]) => any>;
    count: import("vitest").Mock<(...args: any[]) => any>;
    aggregate: import("vitest").Mock<(...args: any[]) => any>;
    _storage: Map<string, T>;
    _clear: () => void;
};
export interface MockPrismaClient {
    user: ReturnType<typeof createMockPrismaModel>;
    course: ReturnType<typeof createMockPrismaModel>;
    chapter: ReturnType<typeof createMockPrismaModel>;
    section: ReturnType<typeof createMockPrismaModel>;
    questionBank: ReturnType<typeof createMockPrismaModel>;
    studentBloomsProgress: ReturnType<typeof createMockPrismaModel>;
    cognitiveSkillProgress: ReturnType<typeof createMockPrismaModel>;
    sAMInteraction: ReturnType<typeof createMockPrismaModel>;
    courseBloomsAnalysis: ReturnType<typeof createMockPrismaModel>;
    calibrationSample: ReturnType<typeof createMockPrismaModel>;
    studentProfile: ReturnType<typeof createMockPrismaModel>;
    topicMastery: ReturnType<typeof createMockPrismaModel>;
    learningPathway: ReturnType<typeof createMockPrismaModel>;
    memoryEntry: ReturnType<typeof createMockPrismaModel>;
    reviewSchedule: ReturnType<typeof createMockPrismaModel>;
    goldenTestCase: ReturnType<typeof createMockPrismaModel>;
    $queryRaw: ReturnType<typeof vi.fn>;
}
/**
 * Creates a mock Prisma client with all required models
 */
export declare function createMockPrismaClient(): MockPrismaClient;
export declare function createSampleUser(overrides?: Partial<{
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    createdAt: Date;
}>): {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    createdAt: Date;
};
export declare function createSampleCourse(overrides?: Partial<{
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    categoryId: string | null;
    userId: string;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}>): {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    categoryId: string | null;
    userId: string;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare function createSampleChapter(overrides?: Partial<{
    id: string;
    title: string;
    description: string | null;
    position: number;
    isPublished: boolean;
    courseId: string;
    createdAt: Date;
    updatedAt: Date;
}>): {
    id: string;
    title: string;
    description: string | null;
    position: number;
    isPublished: boolean;
    courseId: string;
    createdAt: Date;
    updatedAt: Date;
};
export declare function createSampleSection(overrides?: Partial<{
    id: string;
    title: string;
    description: string | null;
    position: number;
    isPublished: boolean;
    chapterId: string;
    createdAt: Date;
    updatedAt: Date;
}>): {
    id: string;
    title: string;
    description: string | null;
    position: number;
    isPublished: boolean;
    chapterId: string;
    createdAt: Date;
    updatedAt: Date;
};
export declare function createSampleCalibrationSample(overrides?: Partial<{
    id: string;
    evaluationId: string;
    aiScore: number;
    humanScore: number | null;
    aiFeedback: string;
    humanFeedback: string | null;
    adjustmentReason: string | null;
    context: Record<string, unknown>;
    evaluatedAt: Date;
    reviewedAt: Date | null;
    reviewerId: string | null;
    versionInfo: Record<string, string>;
    tags: string[];
}>): {
    id: string;
    evaluationId: string;
    aiScore: number;
    humanScore: number | null;
    aiFeedback: string;
    humanFeedback: string | null;
    adjustmentReason: string | null;
    context: Record<string, unknown>;
    evaluatedAt: Date;
    reviewedAt: Date | null;
    reviewerId: string | null;
    versionInfo: Record<string, string>;
    tags: string[];
};
export declare function createSampleStudentProfile(overrides?: Partial<{
    id: string;
    userId: string;
    cognitivePreferences: Record<string, unknown>;
    performanceMetrics: Record<string, unknown>;
    overallBloomsDistribution: Record<string, number>;
    knowledgeGaps: string[];
    strengths: string[];
    createdAt: Date;
    lastActiveAt: Date;
    updatedAt: Date;
    masteryRecords: unknown[];
    pathways: unknown[];
}>): {
    id: string;
    userId: string;
    cognitivePreferences: Record<string, unknown>;
    performanceMetrics: Record<string, unknown>;
    overallBloomsDistribution: Record<string, number>;
    knowledgeGaps: string[];
    strengths: string[];
    createdAt: Date;
    lastActiveAt: Date;
    updatedAt: Date;
    masteryRecords: unknown[];
    pathways: unknown[];
};
export declare function createSampleMemoryEntry(overrides?: Partial<{
    id: string;
    studentId: string;
    type: 'insight' | 'preference' | 'milestone' | 'feedback' | 'context';
    importance: 'low' | 'medium' | 'high' | 'critical';
    content: string;
    metadata: Record<string, unknown>;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>): {
    id: string;
    studentId: string;
    type: "insight" | "preference" | "milestone" | "feedback" | "context";
    importance: "low" | "medium" | "high" | "critical";
    content: string;
    metadata: Record<string, unknown>;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};
export declare function createSampleReviewSchedule(overrides?: Partial<{
    id: string;
    studentId: string;
    topicId: string;
    nextReviewAt: Date;
    interval: number;
    easeFactor: number;
    repetitions: number;
    lastReviewedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>): {
    id: string;
    studentId: string;
    topicId: string;
    nextReviewAt: Date;
    interval: number;
    easeFactor: number;
    repetitions: number;
    lastReviewedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};
export declare function createSampleGoldenTestCase(overrides?: Partial<{
    id: string;
    name: string;
    description: string | null;
    category: string;
    input: Record<string, unknown>;
    expectedResult: Record<string, unknown>;
    tags: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}>): {
    id: string;
    name: string;
    description: string | null;
    category: string;
    input: Record<string, unknown>;
    expectedResult: Record<string, unknown>;
    tags: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};
//# sourceMappingURL=setup.d.ts.map