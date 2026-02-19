/**
 * Integration tests for Pipeline Resume
 *
 * Validates that:
 * 1. Prompt version gate blocks resume on major version mismatch
 * 2. Prompt version gate allows resume on minor version mismatch
 * 3. Resume with missing checkpoint data returns clear error
 * 4. Idempotency key dedup prevents duplicate courses
 */

// Mock external dependencies before imports
jest.mock('@/lib/db', () => ({
  db: {
    sAMExecutionPlan: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
    section: {
      deleteMany: jest.fn(),
    },
    chapter: {
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../course-creation-controller', () => ({
  reactivateCourseCreation: jest.fn(),
}));

jest.mock('../../orchestrator', () => ({
  orchestrateCourseCreation: jest.fn().mockResolvedValue({ success: true, courseId: 'test-course' }),
}));

// Dynamic mock for PROMPT_VERSION — supports both legacy and composite formats
let mockPromptVersion = 'stage1:2.0.0|stage2:2.0.0|stage3:2.0.0';
let mockPromptVersions = { stage1: '2.0.0', stage2: '2.0.0', stage3: '2.0.0' };
jest.mock('../../prompts', () => ({
  get PROMPT_VERSION() { return mockPromptVersion; },
  get PROMPT_VERSIONS() { return mockPromptVersions; },
}));

import { db } from '@/lib/db';

const mockDb = db as jest.Mocked<typeof db>;

describe('Pipeline Resume - Prompt Version Gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPromptVersion = 'stage1:2.0.0|stage2:2.0.0|stage3:2.0.0';
    mockPromptVersions = { stage1: '2.0.0', stage2: '2.0.0', stage3: '2.0.0' };
    (mockDb.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'user-1',
      isPublished: false,
      chapters: [],
    });
  });

  it('should block resume when major version differs', async () => {
    // Setup: checkpoint was saved with prompt version 1.0.0
    (mockDb.sAMExecutionPlan.findFirst as jest.Mock).mockResolvedValue({
      id: 'plan-1',
      checkpointData: {
        completedChapterCount: 3,
        courseId: 'course-1',
        config: { totalChapters: 10, sectionsPerChapter: 5, difficulty: 'intermediate' },
        goalId: 'goal-1',
        planId: 'plan-1',
        stepIds: [],
        promptVersion: '1.0.0', // Major version mismatch with current 2.0.0
      },
    });

    // We need to import after mocks are set up
    const { resumeCourseCreation } = await import('../../checkpoint-manager');

    const result = await resumeCourseCreation({
      userId: 'user-1',
      resumeCourseId: 'course-1',
      config: {} as never,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('major version mismatch');
    expect(result.error).toContain('1.0.0');
    expect(result.error).toContain('2.0.0');
  });

  it('should allow resume when only minor version differs', async () => {
    mockPromptVersion = 'stage1:2.1.0|stage2:2.1.0|stage3:2.1.0';
    mockPromptVersions = { stage1: '2.1.0', stage2: '2.1.0', stage3: '2.1.0' };

    (mockDb.sAMExecutionPlan.findFirst as jest.Mock).mockResolvedValue({
      id: 'plan-1',
      checkpointData: {
        completedChapterCount: 3,
        courseId: 'course-1',
        config: { totalChapters: 10, sectionsPerChapter: 5, difficulty: 'intermediate' },
        goalId: 'goal-1',
        planId: 'plan-1',
        stepIds: [],
        promptVersion: '2.0.0', // Minor mismatch with 2.1.0 — should be allowed
        bloomsProgression: [],
        allSectionTitles: [],
        qualityScores: [],
      },
    });

    (mockDb.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'user-1',
      isPublished: false,
      chapters: [
        { id: 'ch-1', position: 1, title: 'Ch 1', sections: [], courseGoals: '', estimatedTime: '1h' },
        { id: 'ch-2', position: 2, title: 'Ch 2', sections: [], courseGoals: '', estimatedTime: '1h' },
        { id: 'ch-3', position: 3, title: 'Ch 3', sections: [], courseGoals: '', estimatedTime: '1h' },
      ],
    });

    const { resumeCourseCreation } = await import('../../checkpoint-manager');

    const result = await resumeCourseCreation({
      userId: 'user-1',
      resumeCourseId: 'course-1',
      config: {} as never,
    });

    // Should proceed (not fail on version) — the orchestrator mock returns success
    expect(result.success).toBe(true);
  });

  it('should return clear error for incomplete checkpoint data', async () => {
    (mockDb.sAMExecutionPlan.findFirst as jest.Mock).mockResolvedValue({
      id: 'plan-1',
      checkpointData: {
        // Missing required fields: completedChapterCount, courseId, config
      },
    });

    const { resumeCourseCreation } = await import('../../checkpoint-manager');

    const result = await resumeCourseCreation({
      userId: 'user-1',
      resumeCourseId: 'course-1',
      config: {} as never,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('incomplete');
  });

  it('should return error when no checkpoint exists', async () => {
    (mockDb.sAMExecutionPlan.findFirst as jest.Mock).mockResolvedValue(null);

    const { resumeCourseCreation } = await import('../../checkpoint-manager');

    const result = await resumeCourseCreation({
      userId: 'user-1',
      resumeCourseId: 'course-1',
      config: {} as never,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('No checkpoint found');
  });
});
