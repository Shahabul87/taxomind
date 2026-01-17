/**
 * Test Setup for @sam-ai/adapter-prisma
 * Mock Prisma client and utilities for testing
 */
import { vi } from 'vitest';
// ============================================================================
// MOCK PRISMA MODEL
// ============================================================================
/**
 * Creates a mock Prisma model with all common operations
 */
export function createMockPrismaModel() {
    const storage = new Map();
    return {
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
            // Handle composite keys
            const key = Object.values(where).join(':');
            return storage.get(key) ?? null;
        }),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockImplementation(async ({ data }) => {
            const id = data.id ?? `mock-${Date.now()}`;
            const record = { ...data, id };
            storage.set(id, record);
            return record;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }) => {
            const key = Object.values(where).join(':');
            const existing = storage.get(key);
            if (!existing) {
                throw new Error('Record not found');
            }
            const updated = { ...existing, ...data };
            storage.set(key, updated);
            return updated;
        }),
        upsert: vi.fn().mockImplementation(async ({ where, create, update }) => {
            const key = Object.values(where).join(':');
            const existing = storage.get(key);
            if (existing) {
                const updated = { ...existing, ...update };
                storage.set(key, updated);
                return updated;
            }
            const id = create.id ?? `mock-${Date.now()}`;
            const record = { ...create, id };
            storage.set(id, record);
            return record;
        }),
        delete: vi.fn().mockImplementation(async ({ where }) => {
            const key = Object.values(where).join(':');
            const record = storage.get(key);
            storage.delete(key);
            return record;
        }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        count: vi.fn().mockResolvedValue(0),
        aggregate: vi.fn().mockResolvedValue({ _avg: {} }),
        // Internal storage access for tests
        _storage: storage,
        _clear: () => storage.clear(),
    };
}
/**
 * Creates a mock Prisma client with all required models
 */
export function createMockPrismaClient() {
    return {
        user: createMockPrismaModel(),
        course: createMockPrismaModel(),
        chapter: createMockPrismaModel(),
        section: createMockPrismaModel(),
        questionBank: createMockPrismaModel(),
        studentBloomsProgress: createMockPrismaModel(),
        cognitiveSkillProgress: createMockPrismaModel(),
        sAMInteraction: createMockPrismaModel(),
        courseBloomsAnalysis: createMockPrismaModel(),
        calibrationSample: createMockPrismaModel(),
        studentProfile: createMockPrismaModel(),
        topicMastery: createMockPrismaModel(),
        learningPathway: createMockPrismaModel(),
        memoryEntry: createMockPrismaModel(),
        reviewSchedule: createMockPrismaModel(),
        goldenTestCase: createMockPrismaModel(),
        $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    };
}
// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================
export function createSampleUser(overrides) {
    return {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        createdAt: new Date('2024-01-01'),
        ...overrides,
    };
}
export function createSampleCourse(overrides) {
    return {
        id: 'course-123',
        title: 'Test Course',
        description: 'A test course description',
        imageUrl: null,
        categoryId: 'cat-1',
        userId: 'user-123',
        isPublished: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        ...overrides,
    };
}
export function createSampleChapter(overrides) {
    return {
        id: 'chapter-123',
        title: 'Test Chapter',
        description: 'A test chapter',
        position: 1,
        isPublished: true,
        courseId: 'course-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        ...overrides,
    };
}
export function createSampleSection(overrides) {
    return {
        id: 'section-123',
        title: 'Test Section',
        description: 'A test section',
        position: 1,
        isPublished: true,
        chapterId: 'chapter-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        ...overrides,
    };
}
export function createSampleCalibrationSample(overrides) {
    return {
        id: 'sample-123',
        evaluationId: 'eval-123',
        aiScore: 85,
        humanScore: null,
        aiFeedback: 'Good response',
        humanFeedback: null,
        adjustmentReason: null,
        context: { contentType: 'essay', subject: 'science' },
        evaluatedAt: new Date('2024-01-01'),
        reviewedAt: null,
        reviewerId: null,
        versionInfo: { configVersion: '1.0', promptVersion: '1.0', modelVersion: '1.0' },
        tags: ['test'],
        ...overrides,
    };
}
export function createSampleStudentProfile(overrides) {
    return {
        id: 'profile-123',
        userId: 'user-123',
        cognitivePreferences: {
            learningStyles: ['visual'],
            contentLengthPreference: 'moderate',
            pacePreference: 'moderate',
            challengePreference: 'moderate',
            examplesFirst: true,
        },
        performanceMetrics: {
            overallAverageScore: 75,
            totalAssessments: 10,
            weeklyAssessments: 2,
            currentStreak: 3,
            longestStreak: 5,
            topicsMastered: 3,
            totalStudyTimeMinutes: 120,
            averageSessionDuration: 30,
            completionRate: 0.8,
        },
        overallBloomsDistribution: {
            REMEMBER: 20,
            UNDERSTAND: 25,
            APPLY: 20,
            ANALYZE: 15,
            EVALUATE: 10,
            CREATE: 10,
        },
        knowledgeGaps: ['topic-1'],
        strengths: ['topic-2'],
        createdAt: new Date('2024-01-01'),
        lastActiveAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        masteryRecords: [],
        pathways: [],
        ...overrides,
    };
}
export function createSampleMemoryEntry(overrides) {
    return {
        id: 'memory-123',
        studentId: 'student-123',
        type: 'insight',
        importance: 'medium',
        content: 'Student prefers visual learning',
        metadata: {},
        expiresAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        ...overrides,
    };
}
export function createSampleReviewSchedule(overrides) {
    return {
        id: 'review-123',
        studentId: 'student-123',
        topicId: 'topic-123',
        nextReviewAt: new Date('2024-01-10'),
        interval: 7,
        easeFactor: 2.5,
        repetitions: 3,
        lastReviewedAt: new Date('2024-01-03'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-03'),
        ...overrides,
    };
}
export function createSampleGoldenTestCase(overrides) {
    return {
        id: 'golden-123',
        name: 'Basic Essay Evaluation',
        description: 'Tests basic essay scoring',
        category: 'essay',
        input: {
            question: 'What is photosynthesis?',
            studentResponse: 'Photosynthesis is the process plants use to convert sunlight.',
            rubric: { maxScore: 100 },
        },
        expectedResult: {
            score: 80,
            scoreTolerance: 5,
            feedbackContains: ['photosynthesis', 'plants'],
        },
        tags: ['science', 'biology'],
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        ...overrides,
    };
}
//# sourceMappingURL=setup.js.map