/**
 * @sam-ai/educational - Test Setup
 * Mock utilities and sample data factories for testing
 */
import { vi } from 'vitest';
// ============================================================================
// MOCK AI ADAPTER
// ============================================================================
/**
 * Create a mock AI response for testing
 */
export function createMockAIResponse(content) {
    return {
        content: typeof content === 'string' ? content : JSON.stringify(content),
        model: 'mock-model',
        usage: { inputTokens: 100, outputTokens: 200 },
        finishReason: 'stop',
    };
}
/**
 * Create a mock AI adapter for testing
 */
export function createMockAIAdapter(responseOverride) {
    return {
        name: 'mock-ai',
        version: '1.0.0',
        chat: async (params) => {
            if (responseOverride) {
                return responseOverride(params);
            }
            return createMockAIResponse({
                dominantLevel: 'ANALYZE',
                distribution: {
                    REMEMBER: 10,
                    UNDERSTAND: 20,
                    APPLY: 25,
                    ANALYZE: 30,
                    EVALUATE: 10,
                    CREATE: 5,
                },
                confidence: 0.85,
                cognitiveDepth: 55,
                balance: 'well-balanced',
                gaps: ['CREATE'],
                recommendations: [
                    {
                        level: 'CREATE',
                        action: 'Add more creative activities',
                        priority: 'medium',
                    },
                ],
            });
        },
        isConfigured: () => true,
        getModel: () => 'mock-model',
    };
}
/**
 * Create a mock SAM config for testing
 */
export function createMockSAMConfig(overrides = {}) {
    return {
        ai: createMockAIAdapter(),
        features: {
            gamification: true,
            formSync: true,
            autoContext: true,
            emotionDetection: true,
            learningStyleDetection: true,
            streaming: true,
            analytics: true,
        },
        model: {
            name: 'mock-model',
            temperature: 0.7,
            maxTokens: 4000,
        },
        engine: {
            timeout: 30000,
            retries: 2,
            concurrency: 3,
            cacheEnabled: true,
            cacheTTL: 300,
        },
        maxConversationHistory: 50,
        ...overrides,
    };
}
// ============================================================================
// BLOOM'S TAXONOMY TEST DATA
// ============================================================================
export const BLOOMS_LEVELS = [
    'REMEMBER',
    'UNDERSTAND',
    'APPLY',
    'ANALYZE',
    'EVALUATE',
    'CREATE',
];
/**
 * Sample content for each Bloom's level
 */
export const BLOOMS_SAMPLE_CONTENT = {
    REMEMBER: 'Define the concept. List the key terms. Identify the main ideas.',
    UNDERSTAND: 'Explain the process. Summarize the findings. Interpret the results.',
    APPLY: 'Apply the formula. Demonstrate the technique. Solve the problem.',
    ANALYZE: 'Analyze the data. Compare the approaches. Differentiate between concepts.',
    EVALUATE: 'Evaluate the effectiveness. Judge the quality. Critique the argument.',
    CREATE: 'Create a design. Develop a plan. Compose a solution.',
};
/**
 * Create a sample Bloom's distribution
 */
export function createSampleBloomsDistribution(overrides = {}) {
    return {
        REMEMBER: 10,
        UNDERSTAND: 20,
        APPLY: 25,
        ANALYZE: 30,
        EVALUATE: 10,
        CREATE: 5,
        ...overrides,
    };
}
/**
 * Create a sample section
 */
export function createSampleSection(overrides = {}) {
    return {
        id: 'section-1',
        title: 'Introduction',
        content: 'Explain the concept. Define the key terms.',
        position: 1,
        ...overrides,
    };
}
/**
 * Create a sample chapter
 */
export function createSampleChapter(overrides = {}) {
    return {
        id: 'chapter-1',
        title: 'Getting Started',
        position: 1,
        sections: [createSampleSection()],
        ...overrides,
    };
}
/**
 * Create a sample course
 */
export function createSampleCourse(overrides = {}) {
    return {
        id: 'course-1',
        title: 'Introduction to Programming',
        description: 'Learn the fundamentals of programming',
        chapters: [
            createSampleChapter({ id: 'ch-1', position: 1 }),
            createSampleChapter({
                id: 'ch-2',
                title: 'Advanced Topics',
                position: 2,
                sections: [
                    createSampleSection({
                        id: 's-2',
                        title: 'Deep Dive',
                        content: 'Analyze patterns. Compare approaches.',
                    }),
                ],
            }),
        ],
        ...overrides,
    };
}
/**
 * Create a sample student profile
 */
export function createSampleStudentProfile(overrides = {}) {
    return {
        id: 'student-1',
        name: 'Test Student',
        learningStyle: 'visual',
        currentLevel: 'APPLY',
        masteryScores: {
            'topic-1': 0.75,
            'topic-2': 0.60,
            'topic-3': 0.85,
        },
        preferences: {
            pacePreference: 'moderate',
            contentLength: 'medium',
        },
        ...overrides,
    };
}
/**
 * Create a sample evaluation context
 */
export function createSampleEvaluationContext(overrides = {}) {
    return {
        questionId: 'q-1',
        question: 'Explain the concept of inheritance in OOP.',
        expectedAnswer: 'Inheritance is a mechanism where a new class derives properties and behaviors from an existing class.',
        studentAnswer: 'Inheritance allows a class to inherit properties from another class.',
        bloomsLevel: 'UNDERSTAND',
        maxScore: 10,
        ...overrides,
    };
}
/**
 * Create a sample predictive student profile
 */
export function createSamplePredictiveProfile(overrides = {}) {
    return {
        userId: 'user-1',
        courseId: 'course-1',
        learningHistory: {
            averageScore: 78,
            assessmentCount: 15,
            completionRate: 0.85,
            studyTimeMinutes: 1200,
        },
        performanceMetrics: {
            currentStreak: 7,
            missedDeadlines: 1,
            participationRate: 0.90,
        },
        behaviorPatterns: {
            preferredStudyTime: 'evening',
            averageSessionDuration: 45,
            contentInteractionRate: 0.75,
        },
        ...overrides,
    };
}
// ============================================================================
// TEST UTILITIES
// ============================================================================
/**
 * Wait for specified milliseconds
 */
export function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Create a deferred promise for testing async operations
 */
export function createDeferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}
/**
 * Generate a unique ID for testing
 */
export function generateTestId(prefix = 'test') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * Create a mock function with typed return
 */
export function createTypedMock(returnValue) {
    return vi.fn().mockReturnValue(returnValue);
}
/**
 * Create an async mock function with typed return
 */
export function createAsyncMock(returnValue) {
    return vi.fn().mockResolvedValue(returnValue);
}
// ============================================================================
// ASSERTION HELPERS
// ============================================================================
/**
 * Assert that a value is within a range
 */
export function expectInRange(value, min, max) {
    if (value < min || value > max) {
        throw new Error(`Expected ${value} to be between ${min} and ${max}`);
    }
}
/**
 * Assert that a distribution sums to 100
 */
export function expectValidDistribution(distribution) {
    const sum = Object.values(distribution).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 100) > 0.01) {
        throw new Error(`Expected distribution to sum to 100, but got ${sum}`);
    }
}
/**
 * Assert that all Bloom's levels are present
 */
export function expectAllBloomsLevels(distribution) {
    for (const level of BLOOMS_LEVELS) {
        if (!(level in distribution)) {
            throw new Error(`Expected distribution to include ${level}`);
        }
    }
}
