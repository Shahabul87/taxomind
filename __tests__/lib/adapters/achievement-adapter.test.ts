/**
 * Tests for Achievement Adapter
 * Source: lib/adapters/achievement-adapter.ts
 */

jest.mock('@sam-ai/educational', () => ({
  createAchievementEngine: jest.fn(() => ({ analyze: jest.fn() })),
}));

jest.mock('@/lib/adapters', () => ({
  getUserScopedSAMConfig: jest.fn(() => Promise.resolve({ _type: 'SAMConfig' })),
  getUserScopedSAMConfigOrDefault: jest.fn(() => Promise.resolve({ _type: 'SAMConfig' })),
}));

import { createAchievementDatabaseAdapter, getAchievementEngine } from '@/lib/adapters/achievement-adapter';
import { createAchievementEngine } from '@sam-ai/educational';
import { db } from '@/lib/db';

// Ensure models exist on the globally-mocked db
function ensureMockModel(name: string) {
  if (!(db as Record<string, unknown>)[name]) {
    (db as Record<string, unknown>)[name] = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(() => Promise.resolve([])),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(() => Promise.resolve(0)),
      aggregate: jest.fn(),
    };
  }
}

function getModel(name: string) {
  return (db as Record<string, unknown>)[name] as Record<string, jest.Mock>;
}

describe('AchievementDatabaseAdapter', () => {
  let adapter: ReturnType<typeof createAchievementDatabaseAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();
    ensureMockModel('sAMPoints');
    ensureMockModel('sAMStreak');
    ensureMockModel('sAMBadge');
    ensureMockModel('sAMInteraction');
    ensureMockModel('userChapterCompletion');
    ensureMockModel('groupDiscussion');
    ensureMockModel('groupDiscussionComment');
    ensureMockModel('userExamAttempt');
    ensureMockModel('selfAssessmentAttempt');
    adapter = createAchievementDatabaseAdapter();
  });

  // -------------------------------------------------------------------
  // unlockBadge
  // -------------------------------------------------------------------
  describe('unlockBadge', () => {
    it('creates a badge in the database', async () => {
      getModel('sAMBadge').create.mockResolvedValue({ id: 'badge-1' });

      await adapter.unlockBadge('user-1', {
        badgeType: 'COMPLETION',
        level: 2,
        description: 'Completed 5 courses',
        requirements: { count: 5 },
        courseId: 'c1',
      });

      expect(getModel('sAMBadge').create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            badgeType: 'LEARNING_CHAMPION',
            level: 'SILVER',
          }),
        })
      );
    });
  });

  // -------------------------------------------------------------------
  // getUserStats
  // -------------------------------------------------------------------
  describe('getUserStats', () => {
    it('aggregates points, streak, and challenges', async () => {
      getModel('sAMPoints').aggregate.mockResolvedValue({ _sum: { points: 2500 } });
      getModel('sAMStreak').findUnique.mockResolvedValue({ currentStreak: 7 });
      (db.user.findUnique as jest.Mock).mockResolvedValue({
        samActiveChallenges: ['c1'],
        samCompletedChallenges: ['c2', 'c3'],
      });

      const stats = await adapter.getUserStats('user-1');
      expect(stats.points).toBe(2500);
      expect(stats.streak).toBe(7);
      expect(stats.level).toBe(3); // floor(2500/1000) + 1
      expect(stats.completedChallenges).toEqual(['c2', 'c3']);
      expect(stats.activeChallenges).toEqual(['c1']);
    });

    it('handles missing data gracefully', async () => {
      getModel('sAMPoints').aggregate.mockResolvedValue({ _sum: { points: null } });
      getModel('sAMStreak').findUnique.mockResolvedValue(null);
      (db.user.findUnique as jest.Mock).mockResolvedValue(null);

      const stats = await adapter.getUserStats('user-1');
      expect(stats.points).toBe(0);
      expect(stats.streak).toBe(0);
      expect(stats.level).toBe(1);
    });
  });

  // -------------------------------------------------------------------
  // checkAchievementProgress
  // -------------------------------------------------------------------
  describe('checkAchievementProgress', () => {
    it('checks first_course_created achievement', async () => {
      (db.course.count as jest.Mock).mockResolvedValue(3);

      const progress = await adapter.checkAchievementProgress('first_course_created', 'user-1');
      expect(progress.completed).toBe(true);
      expect(progress.progress).toBe(1);
      expect(progress.total).toBe(1);
    });

    it('returns incomplete progress for streak_7_days when streak is short', async () => {
      getModel('sAMStreak').findUnique.mockResolvedValue({
        currentStreak: 3,
        longestStreak: 5,
      });

      const progress = await adapter.checkAchievementProgress('streak_7_days', 'user-1');
      expect(progress.completed).toBe(false);
      expect(progress.progress).toBe(5);
      expect(progress.total).toBe(7);
    });
  });

  // -------------------------------------------------------------------
  // awardPoints
  // -------------------------------------------------------------------
  describe('awardPoints', () => {
    it('creates points record with correct category', async () => {
      getModel('sAMPoints').create.mockResolvedValue({ id: 'p1' });

      await adapter.awardPoints('user-1', {
        points: 50,
        reason: 'Achievement unlocked',
        source: 'ACHIEVEMENT',
        courseId: 'c1',
      });

      expect(getModel('sAMPoints').create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            points: 50,
            category: 'ACHIEVEMENT_UNLOCK',
          }),
        })
      );
    });
  });

  // -------------------------------------------------------------------
  // getAchievementEngine
  // -------------------------------------------------------------------
  describe('getAchievementEngine', () => {
    it('creates user-scoped engine when userId is provided', async () => {
      const engine = await getAchievementEngine('user-1');
      // Engine should be returned (real or mocked)
      expect(engine).toBeDefined();
    });

    it('creates system-level engine when no userId', async () => {
      const engine = await getAchievementEngine();
      expect(engine).toBeDefined();
    });
  });

  // -------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------
  describe('error handling', () => {
    it('propagates database errors from unlockBadge', async () => {
      getModel('sAMBadge').create.mockRejectedValue(new Error('DB error'));

      await expect(
        adapter.unlockBadge('user-1', {
          badgeType: 'STREAK',
          level: 1,
          description: 'test',
          requirements: {},
        })
      ).rejects.toThrow('DB error');
    });
  });
});
