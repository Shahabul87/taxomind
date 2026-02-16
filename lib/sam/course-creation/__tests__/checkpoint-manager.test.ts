/**
 * Checkpoint Manager — Runtime Behavior Tests
 *
 * Tests saveCheckpointWithRetry() and resume validation logic.
 * Requires mocking @/lib/db and server-only.
 */

// Mock server-only before any imports
jest.mock('server-only', () => ({}));

// Mock the db module
const mockUpdate = jest.fn();
const mockFindFirst = jest.fn();
const mockFindUnique = jest.fn();

jest.mock('@/lib/db', () => ({
  db: {
    sAMExecutionPlan: {
      update: (...args: unknown[]) => mockUpdate(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    course: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    section: { deleteMany: jest.fn() },
    chapter: { delete: jest.fn() },
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock dependent modules that checkpoint-manager imports
jest.mock('../chapter-templates', () => ({
  getTemplateForDifficulty: jest.fn(() => ({ totalSections: 7, displayName: 'Intermediate Template' })),
}));
jest.mock('../course-creation-controller', () => ({
  reactivateCourseCreation: jest.fn(),
}));
jest.mock('../orchestrator', () => ({
  orchestrateCourseCreation: jest.fn(),
}));

import { saveCheckpointWithRetry, type SaveCheckpointInput } from '../checkpoint-manager';
import type { BloomsLevel, ConceptTracker, QualityScore, CompletedChapter } from '../types';

// ============================================================================
// Fixtures
// ============================================================================

function makeCheckpointInput(overrides: Partial<SaveCheckpointInput> = {}): SaveCheckpointInput {
  const conceptTracker: ConceptTracker = {
    concepts: new Map([
      ['variables', { concept: 'variables', introducedInChapter: 1, bloomsLevel: 'REMEMBER' as BloomsLevel }],
    ]),
    vocabulary: ['variable', 'function'],
    skillsBuilt: ['basic-coding'],
  };

  return {
    conceptTracker,
    bloomsProgression: [{ chapter: 1, level: 'REMEMBER' as BloomsLevel, topics: ['intro'] }],
    allSectionTitles: ['Section 1.1', 'Section 1.2'],
    qualityScores: [{ uniqueness: 80, specificity: 75, bloomsAlignment: 80, completeness: 85, depth: 70, overall: 78 }] as QualityScore[],
    completedChapterCount: 1,
    config: {
      courseTitle: 'Test Course',
      totalChapters: 5,
      difficulty: 'intermediate',
    } as SaveCheckpointInput['config'],
    goalId: 'goal-1',
    planId: 'plan-1',
    stepIds: ['step-1'],
    courseId: 'course-1',
    completedChaptersList: [{
      id: 'ch-1',
      position: 1,
      title: 'Chapter 1',
      description: 'Desc',
      bloomsLevel: 'REMEMBER' as BloomsLevel,
      learningObjectives: ['Obj 1'],
      keyTopics: ['topic-1'],
      sections: [],
    }] as CompletedChapter[],
    percentage: 20,
    status: 'in_progress' as const,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('saveCheckpointWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls db.sAMExecutionPlan.update with serialized checkpoint', async () => {
    mockUpdate.mockResolvedValueOnce({});
    const input = makeCheckpointInput();

    await saveCheckpointWithRetry('course-1', 'user-1', 'plan-1', input);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'plan-1' },
        data: expect.objectContaining({
          checkpointData: expect.objectContaining({
            completedChapterCount: 1,
            courseId: 'course-1',
          }),
        }),
      }),
    );
  });

  it('serializes ConceptTracker.concepts Map as array of entries', async () => {
    mockUpdate.mockResolvedValueOnce({});
    const input = makeCheckpointInput();

    await saveCheckpointWithRetry('course-1', 'user-1', 'plan-1', input);

    const savedCheckpoint = mockUpdate.mock.calls[0][0].data.checkpointData;
    expect(savedCheckpoint.conceptEntries).toEqual([
      ['variables', { concept: 'variables', introducedInChapter: 1, bloomsLevel: 'REMEMBER' }],
    ]);
  });

  it('retries once on first failure', async () => {
    mockUpdate
      .mockRejectedValueOnce(new Error('DB connection lost'))
      .mockResolvedValueOnce({});

    const input = makeCheckpointInput();

    // Should not throw — retries once
    await expect(
      saveCheckpointWithRetry('course-1', 'user-1', 'plan-1', input),
    ).resolves.toBeUndefined();

    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it('logs error but does not throw when retry also fails', async () => {
    mockUpdate
      .mockRejectedValueOnce(new Error('DB connection lost'))
      .mockRejectedValueOnce(new Error('DB still down'));

    const input = makeCheckpointInput();

    // Should not throw — checkpoint failure is non-fatal
    await expect(
      saveCheckpointWithRetry('course-1', 'user-1', 'plan-1', input),
    ).resolves.toBeUndefined();

    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it('skips silently when planId is empty', async () => {
    const input = makeCheckpointInput();

    await saveCheckpointWithRetry('course-1', 'user-1', '', input);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('includes strategyHistory and promptVersion in checkpoint', async () => {
    mockUpdate.mockResolvedValueOnce({});
    const input = makeCheckpointInput({
      strategyHistory: [{ score: 75, tokensUsed: 1000, latencyMs: 2000 }] as SaveCheckpointInput['strategyHistory'],
      promptVersion: 'v2.1.0',
    });

    await saveCheckpointWithRetry('course-1', 'user-1', 'plan-1', input);

    const savedCheckpoint = mockUpdate.mock.calls[0][0].data.checkpointData;
    expect(savedCheckpoint.promptVersion).toBe('v2.1.0');
    expect(savedCheckpoint.strategyHistory).toHaveLength(1);
  });
});

describe('resumeCourseCreation validation', () => {
  // These test the validation logic inside resumeCourseCreation
  // by calling it with mocked DB responses

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects when no checkpoint exists', async () => {
    mockFindFirst.mockResolvedValueOnce(null);

    // Dynamic import to get the function after mocks are set up
    const { resumeCourseCreation } = await import('../checkpoint-manager');

    const result = await resumeCourseCreation({
      userId: 'user-1',
      resumeCourseId: 'course-1',
    } as Parameters<typeof resumeCourseCreation>[0]);

    expect(result.success).toBe(false);
    expect(result.error).toContain('No checkpoint');
  });

  it('rejects when course belongs to different user', async () => {
    mockFindFirst.mockResolvedValueOnce({
      checkpointData: {
        completedChapterCount: 2,
        config: { totalChapters: 5, difficulty: 'intermediate' },
        conceptEntries: [],
        vocabulary: [],
        skillsBuilt: [],
        bloomsProgression: [],
        allSectionTitles: [],
        qualityScores: [],
        goalId: 'g1',
        planId: 'p1',
        stepIds: [],
      },
    });
    mockFindUnique.mockResolvedValueOnce({
      id: 'course-1',
      userId: 'other-user', // Different user
      isPublished: false,
      chapters: [],
    });

    const { resumeCourseCreation } = await import('../checkpoint-manager');

    const result = await resumeCourseCreation({
      userId: 'user-1',
      resumeCourseId: 'course-1',
    } as Parameters<typeof resumeCourseCreation>[0]);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('rejects when course is already published', async () => {
    mockFindFirst.mockResolvedValueOnce({
      checkpointData: {
        completedChapterCount: 2,
        config: { totalChapters: 5, difficulty: 'intermediate' },
        conceptEntries: [],
        vocabulary: [],
        skillsBuilt: [],
        bloomsProgression: [],
        allSectionTitles: [],
        qualityScores: [],
        goalId: 'g1',
        planId: 'p1',
        stepIds: [],
      },
    });
    mockFindUnique.mockResolvedValueOnce({
      id: 'course-1',
      userId: 'user-1',
      isPublished: true, // Already published
      chapters: [],
    });

    const { resumeCourseCreation } = await import('../checkpoint-manager');

    const result = await resumeCourseCreation({
      userId: 'user-1',
      resumeCourseId: 'course-1',
    } as Parameters<typeof resumeCourseCreation>[0]);

    expect(result.success).toBe(false);
    expect(result.error).toContain('published');
  });
});
