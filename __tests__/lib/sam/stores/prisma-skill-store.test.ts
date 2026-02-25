/**
 * PrismaSkillStore Unit Tests
 *
 * Tests the SkillStore adapter that bridges @sam-ai/agentic SkillStore
 * to Prisma SkillProgress model. Covers getSkillProfile, getSkill,
 * updateSkill, getSkillsForCourse, getStrugglingConcepts, and
 * getConceptsDueForReview.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSkillProgressFindMany = jest.fn();
const mockSkillProgressFindFirst = jest.fn();
const mockSkillProgressUpsert = jest.fn();
const mockCourseSkillFindMany = jest.fn();
const mockSkillFindMany = jest.fn();

const mockDb = {
  skillProgress: {
    findMany: mockSkillProgressFindMany,
    findFirst: mockSkillProgressFindFirst,
    upsert: mockSkillProgressUpsert,
  },
  courseSkill: {
    findMany: mockCourseSkillFindMany,
  },
  skill: {
    findMany: mockSkillFindMany,
  },
};

jest.mock('@/lib/sam/stores/db-provider', () => ({
  getDb: () => mockDb,
  PrismaClient: {},
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { PrismaSkillStore, createPrismaSkillStore } from '@/lib/sam/stores/prisma-skill-store';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const NOW = new Date('2026-02-01T12:00:00Z');

const makeSkillProgress = (overrides: Record<string, unknown> = {}) => ({
  id: 'sp-1',
  userId: 'user-1',
  skillId: 'skill-1',
  currentLevel: 75,
  targetLevel: 100,
  mastery: 75,
  attempts: 10,
  timeSpent: 3600,
  lastPracticed: NOW,
  createdAt: NOW,
  updatedAt: NOW,
  metadata: {
    confidenceScore: 0.8,
    strengthTrend: 'improving',
    nextReviewAt: '2026-03-01T00:00:00Z',
    retentionScore: 0.9,
    correctCount: 8,
    firstLearnedAt: '2026-01-01T00:00:00Z',
  },
  skill: { id: 'skill-1', name: 'TypeScript Generics' },
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaSkillStore', () => {
  let store: PrismaSkillStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createPrismaSkillStore();
  });

  // -----------------------------------------------------------------------
  // getSkillProfile
  // -----------------------------------------------------------------------
  describe('getSkillProfile', () => {
    it('returns a skill profile with categorized concepts', async () => {
      mockSkillProgressFindMany.mockResolvedValue([
        makeSkillProgress({ mastery: 90, skillId: 'mastered' }),
        makeSkillProgress({ mastery: 60, skillId: 'in-progress' }),
        makeSkillProgress({ mastery: 20, skillId: 'struggling' }),
      ]);

      const profile = await store.getSkillProfile('user-1');

      expect(profile).not.toBeNull();
      expect(profile?.userId).toBe('user-1');
      expect(profile?.skills).toHaveLength(3);
      expect(profile?.masteredConcepts).toContain('mastered');
      expect(profile?.inProgressConcepts).toContain('in-progress');
      expect(profile?.strugglingConcepts).toContain('struggling');
    });

    it('returns null when no skill progress exists', async () => {
      mockSkillProgressFindMany.mockResolvedValue([]);

      const profile = await store.getSkillProfile('user-1');

      expect(profile).toBeNull();
    });

    it('returns null on DB error', async () => {
      mockSkillProgressFindMany.mockRejectedValue(new Error('DB error'));

      const profile = await store.getSkillProfile('user-1');

      expect(profile).toBeNull();
    });

    it('calculates total learning time from timeSpent fields', async () => {
      mockSkillProgressFindMany.mockResolvedValue([
        makeSkillProgress({ timeSpent: 7200 }), // 120 minutes
        makeSkillProgress({ timeSpent: 1800 }),  // 30 minutes
      ]);

      const profile = await store.getSkillProfile('user-1');

      expect(profile?.totalLearningTimeMinutes).toBe(150);
    });
  });

  // -----------------------------------------------------------------------
  // getSkill
  // -----------------------------------------------------------------------
  describe('getSkill', () => {
    it('returns a single skill by userId and conceptId', async () => {
      mockSkillProgressFindFirst.mockResolvedValue(makeSkillProgress());

      const skill = await store.getSkill('user-1', 'skill-1');

      expect(skill).not.toBeNull();
      expect(skill?.conceptId).toBe('skill-1');
      expect(skill?.conceptName).toBe('TypeScript Generics');
      expect(skill?.masteryLevel).toBe(75);
      expect(skill?.confidenceScore).toBe(0.8);
    });

    it('returns null when skill not found', async () => {
      mockSkillProgressFindFirst.mockResolvedValue(null);

      const skill = await store.getSkill('user-1', 'nonexistent');

      expect(skill).toBeNull();
    });

    it('returns null on DB error', async () => {
      mockSkillProgressFindFirst.mockRejectedValue(new Error('Timeout'));

      const skill = await store.getSkill('user-1', 'skill-1');

      expect(skill).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // updateSkill
  // -----------------------------------------------------------------------
  describe('updateSkill', () => {
    it('upserts skill progress with mapped fields', async () => {
      mockSkillProgressUpsert.mockResolvedValue(makeSkillProgress());

      await store.updateSkill('user-1', {
        conceptId: 'skill-1',
        conceptName: 'TypeScript Generics',
        masteryLevel: 85,
        confidenceScore: 0.9,
        practiceCount: 15,
        correctCount: 12,
        lastPracticedAt: NOW,
        firstLearnedAt: new Date('2026-01-01'),
        strengthTrend: 'improving',
        nextReviewAt: new Date('2026-03-15'),
      });

      expect(mockSkillProgressUpsert).toHaveBeenCalledTimes(1);
      const call = mockSkillProgressUpsert.mock.calls[0][0];
      expect(call.where.userId_skillId).toEqual({
        userId: 'user-1',
        skillId: 'skill-1',
      });
      expect(call.update.currentLevel).toBe(85);
      expect(call.update.mastery).toBe(85);
    });

    it('propagates DB errors', async () => {
      mockSkillProgressUpsert.mockRejectedValue(new Error('Constraint error'));

      await expect(
        store.updateSkill('user-1', {
          conceptId: 'skill-1',
          conceptName: 'TS',
          masteryLevel: 50,
          confidenceScore: 0.5,
          practiceCount: 1,
          correctCount: 0,
          lastPracticedAt: NOW,
          firstLearnedAt: NOW,
          strengthTrend: 'stable',
        })
      ).rejects.toThrow('Constraint error');
    });
  });

  // -----------------------------------------------------------------------
  // saveSkillProfile
  // -----------------------------------------------------------------------
  describe('saveSkillProfile', () => {
    it('calls updateSkill for each skill in the profile', async () => {
      mockSkillProgressUpsert.mockResolvedValue(makeSkillProgress());

      await store.saveSkillProfile({
        userId: 'user-1',
        skills: [
          {
            conceptId: 'skill-1',
            conceptName: 'TS',
            masteryLevel: 80,
            confidenceScore: 0.8,
            practiceCount: 10,
            correctCount: 8,
            lastPracticedAt: NOW,
            firstLearnedAt: NOW,
            strengthTrend: 'stable',
          },
          {
            conceptId: 'skill-2',
            conceptName: 'React',
            masteryLevel: 60,
            confidenceScore: 0.6,
            practiceCount: 5,
            correctCount: 3,
            lastPracticedAt: NOW,
            firstLearnedAt: NOW,
            strengthTrend: 'improving',
          },
        ],
        masteredConcepts: [],
        inProgressConcepts: [],
        strugglingConcepts: [],
        totalLearningTimeMinutes: 100,
        streakDays: 5,
        lastActivityAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      });

      expect(mockSkillProgressUpsert).toHaveBeenCalledTimes(2);
    });
  });

  // -----------------------------------------------------------------------
  // getSkillsForCourse
  // -----------------------------------------------------------------------
  describe('getSkillsForCourse', () => {
    it('returns started and unstarted skills for a course', async () => {
      mockCourseSkillFindMany.mockResolvedValue([
        { skillId: 'skill-1' },
        { skillId: 'skill-2' },
      ]);
      mockSkillProgressFindMany.mockResolvedValue([
        makeSkillProgress({ skillId: 'skill-1' }),
      ]);
      mockSkillFindMany.mockResolvedValue([
        { id: 'skill-2', name: 'React Hooks' },
      ]);

      const skills = await store.getSkillsForCourse('user-1', 'course-1');

      expect(skills).toHaveLength(2);
      const unstartedSkill = skills.find((s) => s.conceptId === 'skill-2');
      expect(unstartedSkill?.masteryLevel).toBe(0);
      expect(unstartedSkill?.conceptName).toBe('React Hooks');
    });

    it('returns empty array when no course skills mapped', async () => {
      mockCourseSkillFindMany.mockResolvedValue([]);

      const skills = await store.getSkillsForCourse('user-1', 'course-1');

      expect(skills).toEqual([]);
    });

    it('returns empty array on DB error', async () => {
      mockCourseSkillFindMany.mockRejectedValue(new Error('DB error'));

      const skills = await store.getSkillsForCourse('user-1', 'course-1');

      expect(skills).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // getStrugglingConcepts
  // -----------------------------------------------------------------------
  describe('getStrugglingConcepts', () => {
    it('returns skills with mastery below 40', async () => {
      mockSkillProgressFindMany.mockResolvedValue([
        makeSkillProgress({ mastery: 20 }),
        makeSkillProgress({ mastery: 35, skillId: 'skill-2', skill: { id: 'skill-2', name: 'React' } }),
      ]);

      const struggling = await store.getStrugglingConcepts('user-1');

      expect(struggling).toHaveLength(2);
    });

    it('respects limit parameter', async () => {
      mockSkillProgressFindMany.mockResolvedValue([makeSkillProgress({ mastery: 10 })]);

      await store.getStrugglingConcepts('user-1', 3);

      const call = mockSkillProgressFindMany.mock.calls[0][0];
      expect(call.take).toBe(3);
      expect(call.where.mastery).toEqual({ lt: 40 });
    });
  });

  // -----------------------------------------------------------------------
  // getConceptsDueForReview
  // -----------------------------------------------------------------------
  describe('getConceptsDueForReview', () => {
    it('returns skills due for review based on nextReviewAt', async () => {
      mockSkillProgressFindMany.mockResolvedValue([
        makeSkillProgress({
          metadata: { nextReviewAt: '2025-12-01T00:00:00Z' }, // past date -> due
        }),
        makeSkillProgress({
          metadata: { nextReviewAt: '2099-01-01T00:00:00Z' }, // future -> not due
          skillId: 'skill-future',
          skill: { id: 'skill-future', name: 'Future' },
        }),
      ]);

      const due = await store.getConceptsDueForReview('user-1');

      expect(due).toHaveLength(1);
    });

    it('includes skills with no nextReviewAt as due', async () => {
      mockSkillProgressFindMany.mockResolvedValue([
        makeSkillProgress({ metadata: {} }), // no nextReviewAt -> due
      ]);

      const due = await store.getConceptsDueForReview('user-1');

      expect(due).toHaveLength(1);
    });

    it('returns empty array on DB error', async () => {
      mockSkillProgressFindMany.mockRejectedValue(new Error('Error'));

      const due = await store.getConceptsDueForReview('user-1');

      expect(due).toEqual([]);
    });
  });
});
