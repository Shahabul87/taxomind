/**
 * @sam-ai/educational - Test Setup
 * Mock utilities and sample data factories for testing
 */

import { vi } from 'vitest';
import type {
  SAMConfig,
  AIAdapter,
  AIChatParams,
  AIChatResponse,
} from '@sam-ai/core';

// ============================================================================
// MOCK AI ADAPTER
// ============================================================================

/**
 * Create a mock AI response for testing
 */
export function createMockAIResponse(content: unknown): AIChatResponse {
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
export function createMockAIAdapter(
  responseOverride?: (params: AIChatParams) => AIChatResponse | Promise<AIChatResponse>
): AIAdapter {
  return {
    name: 'mock-ai',
    version: '1.0.0',
    chat: async (params: AIChatParams): Promise<AIChatResponse> => {
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
export function createMockSAMConfig(
  overrides: Partial<SAMConfig> = {}
): SAMConfig {
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
] as const;

export type BloomsLevel = (typeof BLOOMS_LEVELS)[number];

/**
 * Sample content for each Bloom's level
 */
export const BLOOMS_SAMPLE_CONTENT: Record<BloomsLevel, string> = {
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
export function createSampleBloomsDistribution(
  overrides: Partial<Record<BloomsLevel, number>> = {}
): Record<BloomsLevel, number> {
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

// ============================================================================
// COURSE TEST DATA
// ============================================================================

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
export function createSampleSection(
  overrides: Partial<SampleSection> = {}
): SampleSection {
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
export function createSampleChapter(
  overrides: Partial<SampleChapter> = {}
): SampleChapter {
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
export function createSampleCourse(
  overrides: Partial<SampleCourse> = {}
): SampleCourse {
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

// ============================================================================
// STUDENT PROFILE TEST DATA
// ============================================================================

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
export function createSampleStudentProfile(
  overrides: Partial<SampleStudentProfile> = {}
): SampleStudentProfile {
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

// ============================================================================
// EVALUATION TEST DATA
// ============================================================================

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
export function createSampleEvaluationContext(
  overrides: Partial<SampleEvaluationContext> = {}
): SampleEvaluationContext {
  return {
    questionId: 'q-1',
    question: 'Explain the concept of inheritance in OOP.',
    expectedAnswer:
      'Inheritance is a mechanism where a new class derives properties and behaviors from an existing class.',
    studentAnswer:
      'Inheritance allows a class to inherit properties from another class.',
    bloomsLevel: 'UNDERSTAND',
    maxScore: 10,
    ...overrides,
  };
}

// ============================================================================
// PREDICTIVE ENGINE TEST DATA
// ============================================================================

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
export function createSamplePredictiveProfile(
  overrides: Partial<SamplePredictiveStudentProfile> = {}
): SamplePredictiveStudentProfile {
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
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a deferred promise for testing async operations
 */
export function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Generate a unique ID for testing
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a mock function with typed return
 */
export function createTypedMock<T>(returnValue: T) {
  return vi.fn().mockReturnValue(returnValue);
}

/**
 * Create an async mock function with typed return
 */
export function createAsyncMock<T>(returnValue: T) {
  return vi.fn().mockResolvedValue(returnValue);
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert that a value is within a range
 */
export function expectInRange(
  value: number,
  min: number,
  max: number
): void {
  if (value < min || value > max) {
    throw new Error(
      `Expected ${value} to be between ${min} and ${max}`
    );
  }
}

/**
 * Assert that a distribution sums to 100
 */
export function expectValidDistribution(
  distribution: Record<string, number>
): void {
  const sum = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 100) > 0.01) {
    throw new Error(
      `Expected distribution to sum to 100, but got ${sum}`
    );
  }
}

/**
 * Assert that all Bloom's levels are present
 */
export function expectAllBloomsLevels(
  distribution: Record<string, number>
): void {
  for (const level of BLOOMS_LEVELS) {
    if (!(level in distribution)) {
      throw new Error(`Expected distribution to include ${level}`);
    }
  }
}
