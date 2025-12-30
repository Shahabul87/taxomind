/**
 * @sam-ai/memory - Test Setup
 * Mock utilities and sample data factories for testing
 */

import { vi } from 'vitest';
import type {
  BloomsLevel,
  MasteryLevel,
  TopicMastery,
  MasteryUpdate,
  PathwayStep,
  LearningPathway,
  PathwayAdjustment,
  ReviewPriority,
  ReviewScheduleEntry,
  CognitivePreferences,
  PerformanceMetrics,
  StudentProfile,
  EvaluationOutcome,
  MemoryEntryType,
  ImportanceLevel,
  MemoryEntry,
  StudentProfileStore,
  ReviewScheduleStore,
  MemoryStore,
} from '../types';

// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================

/**
 * Create a sample TopicMastery record
 */
export function createSampleTopicMastery(
  overrides: Partial<TopicMastery> = {}
): TopicMastery {
  return {
    topicId: 'topic-1',
    level: 'intermediate',
    score: 75,
    bloomsLevel: 'APPLY',
    assessmentCount: 5,
    averageScore: 75,
    lastAssessedAt: new Date('2024-01-15'),
    trend: 'stable',
    confidence: 0.75,
    ...overrides,
  };
}

/**
 * Create a sample MasteryUpdate
 */
export function createSampleMasteryUpdate(
  overrides: Partial<MasteryUpdate> = {}
): MasteryUpdate {
  return {
    topicId: 'topic-1',
    bloomsLevel: 'APPLY',
    score: 80,
    maxScore: 100,
    timestamp: new Date('2024-01-20'),
    ...overrides,
  };
}

/**
 * Create a sample PathwayStep
 */
export function createSamplePathwayStep(
  overrides: Partial<PathwayStep> = {}
): PathwayStep {
  return {
    id: 'step-1',
    topicId: 'topic-1',
    targetBloomsLevel: 'UNDERSTAND',
    order: 1,
    status: 'not_started',
    prerequisites: [],
    estimatedDuration: 30,
    ...overrides,
  };
}

/**
 * Create a sample LearningPathway
 */
export function createSampleLearningPathway(
  overrides: Partial<LearningPathway> = {}
): LearningPathway {
  return {
    id: 'pathway-1',
    studentId: 'student-1',
    courseId: 'course-1',
    steps: [
      createSamplePathwayStep({ id: 'step-1', order: 1 }),
      createSamplePathwayStep({ id: 'step-2', order: 2, topicId: 'topic-2' }),
      createSamplePathwayStep({ id: 'step-3', order: 3, topicId: 'topic-3' }),
    ],
    currentStepIndex: 0,
    progress: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    status: 'active',
    ...overrides,
  };
}

/**
 * Create a sample PathwayAdjustment
 */
export function createSamplePathwayAdjustment(
  overrides: Partial<PathwayAdjustment> = {}
): PathwayAdjustment {
  return {
    type: 'no_change',
    reason: 'No adjustment needed',
    ...overrides,
  };
}

/**
 * Create a sample ReviewScheduleEntry
 */
export function createSampleReviewScheduleEntry(
  overrides: Partial<ReviewScheduleEntry> = {}
): ReviewScheduleEntry {
  return {
    id: 'review-1',
    topicId: 'topic-1',
    studentId: 'student-1',
    scheduledFor: new Date('2024-01-25'),
    priority: 'medium',
    intervalDays: 7,
    successfulReviews: 2,
    easinessFactor: 2.5,
    isOverdue: false,
    status: 'pending',
    ...overrides,
  };
}

/**
 * Create sample CognitivePreferences
 */
export function createSampleCognitivePreferences(
  overrides: Partial<CognitivePreferences> = {}
): CognitivePreferences {
  return {
    learningStyles: ['visual', 'reading'],
    contentLengthPreference: 'moderate',
    pacePreference: 'moderate',
    challengePreference: 'moderate',
    examplesFirst: true,
    ...overrides,
  };
}

/**
 * Create sample PerformanceMetrics
 */
export function createSamplePerformanceMetrics(
  overrides: Partial<PerformanceMetrics> = {}
): PerformanceMetrics {
  return {
    overallAverageScore: 78,
    totalAssessments: 20,
    weeklyAssessments: 5,
    currentStreak: 7,
    longestStreak: 14,
    topicsMastered: 5,
    totalStudyTimeMinutes: 600,
    averageSessionDuration: 45,
    completionRate: 0.85,
    ...overrides,
  };
}

/**
 * Create a sample StudentProfile
 */
export function createSampleStudentProfile(
  overrides: Partial<StudentProfile> = {}
): StudentProfile {
  return {
    id: 'student-1',
    userId: 'user-1',
    masteryByTopic: {
      'topic-1': createSampleTopicMastery({ topicId: 'topic-1' }),
    },
    activePathways: [],
    cognitivePreferences: createSampleCognitivePreferences(),
    performanceMetrics: createSamplePerformanceMetrics(),
    overallBloomsDistribution: {
      REMEMBER: 10,
      UNDERSTAND: 25,
      APPLY: 30,
      ANALYZE: 20,
      EVALUATE: 10,
      CREATE: 5,
    },
    knowledgeGaps: ['topic-5'],
    strengths: ['topic-1', 'topic-2'],
    createdAt: new Date('2024-01-01'),
    lastActiveAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    ...overrides,
  };
}

/**
 * Create a sample EvaluationOutcome
 */
export function createSampleEvaluationOutcome(
  overrides: Partial<EvaluationOutcome> = {}
): EvaluationOutcome {
  return {
    evaluationId: 'eval-1',
    studentId: 'student-1',
    topicId: 'topic-1',
    courseId: 'course-1',
    chapterId: 'chapter-1',
    sectionId: 'section-1',
    score: 85,
    maxScore: 100,
    bloomsLevel: 'APPLY',
    assessmentType: 'quiz',
    timeSpentMinutes: 15,
    strengths: ['Good understanding of core concepts'],
    areasForImprovement: ['Need more practice with edge cases'],
    feedback: 'Well done! Keep practicing.',
    evaluatedAt: new Date('2024-01-20'),
    ...overrides,
  };
}

/**
 * Create a sample MemoryEntry
 */
export function createSampleMemoryEntry(
  overrides: Partial<MemoryEntry> = {}
): MemoryEntry {
  return {
    id: 'memory-1',
    studentId: 'student-1',
    type: 'EVALUATION_OUTCOME',
    content: {
      score: 85,
      bloomsLevel: 'APPLY',
      feedback: 'Good progress',
    },
    importance: 'medium',
    relatedTopics: ['topic-1'],
    tags: ['quiz', 'progress'],
    createdAt: new Date('2024-01-20'),
    accessCount: 0,
    ...overrides,
  };
}

// ============================================================================
// MOCK STORES
// ============================================================================

/**
 * Create a mock StudentProfileStore
 */
export function createMockStudentProfileStore(): StudentProfileStore & {
  [K in keyof StudentProfileStore]: ReturnType<typeof vi.fn>;
} {
  return {
    get: vi.fn(),
    save: vi.fn(),
    updateMastery: vi.fn(),
    getMastery: vi.fn(),
    updatePathway: vi.fn(),
    getActivePathways: vi.fn(),
    updateMetrics: vi.fn(),
    getKnowledgeGaps: vi.fn(),
    delete: vi.fn(),
  };
}

/**
 * Create a mock ReviewScheduleStore
 */
export function createMockReviewScheduleStore(): ReviewScheduleStore & {
  [K in keyof ReviewScheduleStore]: ReturnType<typeof vi.fn>;
} {
  return {
    getPendingReviews: vi.fn(),
    getOverdueReviews: vi.fn(),
    scheduleReview: vi.fn(),
    updateReview: vi.fn(),
    completeReview: vi.fn(),
    getReviewHistory: vi.fn(),
    pruneCompleted: vi.fn(),
  };
}

/**
 * Create a mock MemoryStore
 */
export function createMockMemoryStore(): MemoryStore & {
  [K in keyof MemoryStore]: ReturnType<typeof vi.fn>;
} {
  return {
    store: vi.fn(),
    get: vi.fn(),
    getByType: vi.fn(),
    getByTopic: vi.fn(),
    getRecent: vi.fn(),
    getImportant: vi.fn(),
    recordAccess: vi.fn(),
    pruneExpired: vi.fn(),
    deleteForStudent: vi.fn(),
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
 * Create a date offset from now
 */
export function createDateOffset(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

/**
 * All Bloom's levels for iteration
 */
export const ALL_BLOOMS_LEVELS: BloomsLevel[] = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
];

/**
 * All mastery levels for iteration
 */
export const ALL_MASTERY_LEVELS: MasteryLevel[] = [
  'novice',
  'beginner',
  'intermediate',
  'proficient',
  'expert',
];

/**
 * All review priorities for iteration
 */
export const ALL_REVIEW_PRIORITIES: ReviewPriority[] = [
  'urgent',
  'high',
  'medium',
  'low',
];

/**
 * All memory entry types for iteration
 */
export const ALL_MEMORY_ENTRY_TYPES: MemoryEntryType[] = [
  'EVALUATION_OUTCOME',
  'MASTERY_UPDATE',
  'PATHWAY_CHANGE',
  'LEARNING_MILESTONE',
  'STRUGGLE_POINT',
  'BREAKTHROUGH',
];

/**
 * All importance levels for iteration
 */
export const ALL_IMPORTANCE_LEVELS: ImportanceLevel[] = [
  'low',
  'medium',
  'high',
  'critical',
];
