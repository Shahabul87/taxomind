/**
 * Tests for course-initializer.ts
 *
 * Verifies initializeCourseRecord: course DB creation,
 * category resolution, goal/plan initialization, and checkpoint seeding.
 */

jest.mock('@/lib/db');
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../course-creation-controller', () => ({
  initializeCourseCreationGoal: jest.fn().mockResolvedValue({
    goalId: 'goal-1',
    planId: 'plan-1',
    stepIds: ['s1', 's2', 's3'],
  }),
  storeBlueprintInGoal: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../course-categories', () => ({
  COURSE_CATEGORIES: [
    { value: 'web-development', label: 'Web Development' },
    { value: 'data-science', label: 'Data Science' },
  ],
}));

jest.mock('../prompts', () => ({
  PROMPT_VERSION: '2.1.0',
}));

import { db } from '@/lib/db';
import { initializeCourseRecord } from '../course-initializer';
import { initializeCourseCreationGoal, storeBlueprintInGoal } from '../course-creation-controller';
import type { SequentialCreationConfig } from '../types';

const mockDb = db as jest.Mocked<typeof db>;
const mockInitGoal = initializeCourseCreationGoal as jest.Mock;
const mockStoreBlueprintInGoal = storeBlueprintInGoal as jest.Mock;

describe('initializeCourseRecord', () => {
  const sampleConfig: SequentialCreationConfig = {
    courseTitle: 'React Mastery',
    courseDescription: 'Complete React course',
    courseGoals: ['Build apps', 'Learn hooks'],
    difficulty: 'INTERMEDIATE',
    totalChapters: 5,
    sectionsPerChapter: 3,
    category: 'web-development',
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Restore mock implementations cleared by resetMocks
    mockInitGoal.mockResolvedValue({
      goalId: 'goal-1',
      planId: 'plan-1',
      stepIds: ['s1', 's2', 's3'],
    });
    mockStoreBlueprintInGoal.mockResolvedValue(undefined);
    (mockDb.category.upsert as jest.Mock).mockResolvedValue({ id: 'cat-1' });
    (mockDb.course.create as jest.Mock).mockResolvedValue({ id: 'course-1', title: 'React Mastery' });
    (mockDb.sAMExecutionPlan.update as jest.Mock).mockResolvedValue({});
  });

  it('should create a course record in the database', async () => {
    const result = await initializeCourseRecord('user-1', sampleConfig, null);
    expect(result.courseId).toBe('course-1');
    expect(mockDb.course.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'React Mastery',
          userId: 'user-1',
          isPublished: false,
        }),
      }),
    );
  });

  it('should resolve category name from slug', async () => {
    await initializeCourseRecord('user-1', sampleConfig, null);
    expect(mockDb.category.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: 'Web Development' },
      }),
    );
  });

  it('should return goal and plan IDs', async () => {
    const result = await initializeCourseRecord('user-1', sampleConfig, null);
    expect(result.goalId).toBe('goal-1');
    expect(result.planId).toBe('plan-1');
    expect(result.stepIds).toEqual(['s1', 's2', 's3']);
  });

  it('should seed checkpoint in execution plan', async () => {
    await initializeCourseRecord('user-1', sampleConfig, null);
    expect(mockDb.sAMExecutionPlan.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'plan-1' },
        data: expect.objectContaining({
          checkpointData: expect.objectContaining({
            courseId: 'course-1',
            completedChapterCount: 0,
            status: 'in_progress',
          }),
        }),
      }),
    );
  });

  it('should resolve subcategory when provided', async () => {
    const configWithSub = { ...sampleConfig, subcategory: 'React' };
    await initializeCourseRecord('user-1', configWithSub, null);
    // Should call upsert twice: once for category, once for subcategory
    expect(mockDb.category.upsert).toHaveBeenCalledTimes(2);
  });
});
